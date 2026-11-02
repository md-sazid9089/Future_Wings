import { useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '../auth.js'
import AddDeadlineForm from '../components/dashboard/AddDeadlineForm.jsx'
import DeadlineRow from '../components/dashboard/DeadlineRow.jsx'
import DeadlineSkeleton from '../components/dashboard/DeadlineSkeleton.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import Toast from '../components/ui/Toast.jsx'
import { CARD, FOCUS } from '../components/ui/styles.js'
import StatCard from '../components/dashboard/StatCard.jsx'
import { CloseIcon } from '../components/dashboard/icons.jsx'

const emptyForm = { title: '', category: 'Application', dueAt: '', notes: '' }
const filters = ['Active', 'Overdue', 'Completed']

function toLocalInputValue(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function Dashboard({ session, onNavigate }) {
  const [deadlines, setDeadlines] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('Active')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now)

  const [pendingIds, setPendingIds] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const [justAddedId, setJustAddedId] = useState(null)
  const titleRef = useRef(null)

  const minDueAt = useMemo(() => toLocalInputValue(new Date()), [])

  useEffect(() => {
    apiRequest('/deadlines', { token: session.token })
      .then(setDeadlines)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [session.token])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const markPending = (id, active) =>
    setPendingIds((current) => {
      const next = new Set(current)
      if (active) next.add(id)
      else next.delete(id)
      return next
    })

  const visibleDeadlines = useMemo(() => deadlines.filter((deadline) => {
    if (filter === 'Completed') return deadline.isCompleted
    if (filter === 'Overdue') return !deadline.isCompleted && new Date(deadline.dueAt).getTime() < now
    return !deadline.isCompleted
  }), [deadlines, filter, now])

  const counts = {
    active: deadlines.filter((deadline) => !deadline.isCompleted).length,
    overdue: deadlines.filter((deadline) => !deadline.isCompleted && new Date(deadline.dueAt).getTime() < now).length,
    completed: deadlines.filter((deadline) => deadline.isCompleted).length,
  }

  const createDeadline = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const created = await apiRequest('/deadlines', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ ...form, dueAt: new Date(form.dueAt).toISOString() }),
      })
      setDeadlines((current) => [...current, created].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)))
      setForm(emptyForm)
      setFilter('Active')
      setJustAddedId(created.id)
      setToast('Deadline added')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const setCompletion = async (deadline) => {
    if (pendingIds.has(deadline.id)) return
    setError('')
    markPending(deadline.id, true)
    try {
      const updated = await apiRequest(`/deadlines/${deadline.id}/completion`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ completed: !deadline.isCompleted }),
      })
      setDeadlines((current) => current.map((item) => item.id === updated.id ? updated : item))
      setToast(updated.isCompleted ? 'Marked complete' : 'Moved back to active')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      markPending(deadline.id, false)
    }
  }

  const deleteDeadline = async (deadline) => {
    if (pendingIds.has(deadline.id)) return
    setError('')
    markPending(deadline.id, true)
    try {
      await apiRequest(`/deadlines/${deadline.id}`, { token: session.token, method: 'DELETE' })
      setDeadlines((current) => current.filter((item) => item.id !== deadline.id))
      setToast('Deadline deleted')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      markPending(deadline.id, false)
    }
  }

  const completionRate = deadlines.length
    ? Math.round((counts.completed / deadlines.length) * 100)
    : 0

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* Personalized Welcome Header Banner */}
      <header className="relative overflow-hidden rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-4 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
                <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                Student Workspace
              </span>
              <span className="text-xs text-secondary-400 font-medium">{todayFormatted}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {session.firstName || 'Student'}!
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-secondary-300 max-w-xl">
              Keep your admissions, language exams, visa checkpoints, and scholarship milestones on track.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md px-5 py-3 border border-white/15 text-center min-w-[140px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary-300">Milestones Done</span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="font-mono text-2xl font-black text-primary-400">{completionRate}%</span>
                <span className="text-xs text-secondary-300 font-bold">({counts.completed}/{deadlines.length})</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <section aria-label="Deadline summary" className="grid gap-4 sm:grid-cols-3">
        <StatCard tone="active" label="Active Deadlines" value={counts.active} hint="Tasks in progress" />
        <StatCard tone="overdue" label="Overdue Items" value={counts.overdue} hint="Requires immediate attention" />
        <StatCard tone="completed" label="Completed Tasks" value={counts.completed} hint="Finished milestones" />
      </section>

      {error && (
        <div
          className="flex items-start justify-between gap-4 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700 shadow-sm"
          role="alert"
        >
          <span>{error}</span>
          <button
            aria-label="Dismiss error"
            className={`shrink-0 rounded-lg p-1 text-danger-600 transition hover:bg-danger-100 ${FOCUS}`}
            onClick={() => setError('')}
            type="button"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Deadline Management Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
        <section className={`overflow-hidden rounded-3xl border border-secondary-200/80 bg-white shadow-sm`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-6 py-4">
            <h2 className="font-bold text-secondary-950 text-base">Your Schedule & Milestones</h2>
            <div className="flex rounded-xl bg-secondary-100 p-1" role="group" aria-label="Filter deadlines">
              {filters.map((option) => (
                <button
                  aria-pressed={filter === option}
                  className={`min-h-9 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${FOCUS} ${
                    filter === option
                      ? 'bg-white text-secondary-950 shadow-sm'
                      : 'text-secondary-500 hover:text-secondary-800'
                  }`}
                  key={option}
                  onClick={() => setFilter(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <DeadlineSkeleton />
          ) : visibleDeadlines.length === 0 ? (
            <EmptyState filter={filter} onAdd={() => titleRef.current?.focus()} />
          ) : (
            <div className="divide-y divide-secondary-100">
              {visibleDeadlines.map((deadline) => (
                <DeadlineRow
                  deadline={deadline}
                  justAdded={deadline.id === justAddedId}
                  key={deadline.id}
                  now={now}
                  onDelete={deleteDeadline}
                  onToggle={setCompletion}
                  pending={pendingIds.has(deadline.id)}
                />
              ))}
            </div>
          )}
        </section>

        <AddDeadlineForm
          form={form}
          minDueAt={minDueAt}
          onChange={setForm}
          onSubmit={createDeadline}
          saving={saving}
          titleRef={titleRef}
        />
      </div>

      <Toast message={toast} />
    </div>
  )
}
