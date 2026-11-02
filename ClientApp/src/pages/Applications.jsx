import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { CARD, CONTROL, FOCUS, BTN_PRIMARY, BTN_QUIET } from '../components/ui/styles.js'
import { CloseIcon } from '../components/dashboard/icons.jsx'

const filters = ['All', 'Active', 'Accepted', 'Rejected/Withdrawn']
const statuses = ['Draft', 'Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn']

export default function Applications({ session, onNavigate }) {
  const [applications, setApplications] = useState([])
  const [programs, setPrograms] = useState([])
  const [programId, setProgramId] = useState('')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [tracked, discovery] = await Promise.all([
        apiRequest('/applications', { token: session.token }),
        apiRequest('/discovery', { token: session.token }),
      ])
      setApplications(tracked ?? [])
      setPrograms(discovery?.programs ?? [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [session.token])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const create = async (event) => {
    event.preventDefault()
    if (!programId) return
    setBusy(true)
    setError('')
    try {
      await apiRequest('/applications', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ programId: Number(programId) }),
      })
      setProgramId('')
      setToast('Application added to tracking')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const updateStatus = async (id, status) => {
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/applications/${id}/status`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setToast('Status updated')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id) => {
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/applications/${id}`, { token: session.token, method: 'DELETE' })
      setToast('Application removed')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const visibleApplications = useMemo(() => applications.filter((app) => {
    if (filter === 'Active') return ['Draft', 'Submitted', 'Under Review'].includes(app.status)
    if (filter === 'Accepted') return app.status === 'Accepted'
    if (filter === 'Rejected/Withdrawn') return ['Rejected', 'Withdrawn'].includes(app.status)
    return true
  }), [applications, filter])

  const counts = {
    total: applications.length,
    accepted: applications.filter((app) => app.status === 'Accepted').length,
    pending: applications.filter((app) => ['Draft', 'Submitted', 'Under Review'].includes(app.status)).length,
  }

  const available = programs.filter((program) => !applications.some((item) => item.programId === program.id))

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft': return 'bg-secondary-100 text-secondary-700 border-secondary-200'
      case 'Submitted': return 'bg-primary-50 text-primary-700 border-primary-200'
      case 'Under Review': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Accepted': return 'bg-success-50 text-success-700 border-success-200 font-bold'
      case 'Rejected': return 'bg-danger-50 text-danger-700 border-danger-200'
      case 'Withdrawn': return 'bg-secondary-100 text-secondary-600 border-secondary-200'
      default: return 'bg-secondary-100 text-secondary-700 border-secondary-200'
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* Header Banner */}
      <header
        data-tour="applications-header"
        className="relative overflow-hidden rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-4 sm:p-8 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
            <span className="h-2 w-2 rounded-full bg-primary-400" />
            Admissions Pipeline
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Application Tracker
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-secondary-300">
            Track and manage your university application statuses, deadlines, and offer letters.
          </p>
        </div>
      </header>

      {/* Metric Cards */}
      <section aria-label="Applications summary" className="grid gap-4 sm:grid-cols-3">
        <div className="group rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Total Tracked</p>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-secondary-950 tabular-nums">{counts.total}</p>
          <p className="mt-1 text-xs text-secondary-400 font-medium">Applications created</p>
        </div>
        <div className="group rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">In Review / Pending</p>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-primary-600 tabular-nums">{counts.pending}</p>
          <p className="mt-1 text-xs text-secondary-400 font-medium">Awaiting university response</p>
        </div>
        <div className="group rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Offers & Accepted</p>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-success-600 tabular-nums">{counts.accepted}</p>
          <p className="mt-1 text-xs text-secondary-400 font-medium">Ready for visa stage</p>
        </div>
      </section>

      {error && (
        <div
          className="flex items-start justify-between gap-4 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-xs text-danger-700 shadow-sm"
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

      {/* Quick Add Program to Tracker */}
      {available.length > 0 && (
        <form className="rounded-3xl border border-secondary-200/80 bg-white p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center" onSubmit={create}>
          <label className="sr-only" htmlFor="application-program">Program</label>
          <select
            className="flex-1 rounded-2xl border border-secondary-200 px-4 py-2.5 text-xs font-medium text-secondary-950 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-inner bg-white min-h-[44px]"
            id="application-program"
            onChange={(event) => setProgramId(event.target.value)}
            value={programId}
          >
            <option value="">Select a program from catalog to track...</option>
            {available.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name} — {program.university ?? program.universityName} ({program.country})
              </option>
            ))}
          </select>
          <button className="w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] rounded-2xl bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 text-xs font-extrabold shadow-md shadow-primary-500/25 transition disabled:opacity-50" disabled={busy || !programId} type="submit">
            + Track Application
          </button>
        </form>
      )}

      {/* Applications Pipeline List */}
      <div className="overflow-hidden rounded-3xl border border-secondary-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-6 py-4">
          <h2 className="font-bold text-secondary-950 text-base">Tracked Applications</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl bg-secondary-100 p-1" role="group" aria-label="Filter applications">
              {filters.map((option) => (
                <button
                  aria-pressed={filter === option}
                  className={`min-h-9 rounded-lg px-3 py-1 text-xs font-bold transition ${FOCUS} ${
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
            {onNavigate && (
              <button
                type="button"
                className="rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-100 transition"
                onClick={() => onNavigate('Discovery')}
              >
                Find More Programs <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-secondary-500 animate-pulse">Loading applications…</div>
        ) : visibleApplications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-secondary-950">No applications found</h3>
            <p className="mt-1 text-xs text-secondary-500 max-w-sm mx-auto">
              {filter === 'All' ? "You haven't started tracking any applications yet. Explore the discovery catalog to add programs." : `No applications match the '${filter}' filter.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-100">
            {visibleApplications.map((app) => (
              <div key={app.applicationId ?? app.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-surface/50 transition">
                <div>
                  <h3 className="font-bold text-secondary-950 text-base break-words">{app.programName}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-secondary-500 font-medium">
                    <span>{app.universityName}</span>
                    {app.country && (
                      <>
                        <span>&bull;</span>
                        <span>{app.country}</span>
                      </>
                    )}
                    {app.level && (
                      <>
                        <span>&bull;</span>
                        <span>{app.level}</span>
                      </>
                    )}
                  </div>
                  {app.createdAt && (
                    <p className="mt-1 text-[11px] text-secondary-400">
                      Added: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </span>
                  
                  <select
                    aria-label={`Change status for ${app.programName}`}
                    className="min-h-[44px] rounded-xl border border-secondary-200 bg-white px-3 py-1.5 text-xs font-semibold text-secondary-800 outline-none focus:border-primary-500 shadow-sm"
                    disabled={busy}
                    onChange={(event) => updateStatus(app.applicationId ?? app.id, event.target.value)}
                    value={app.status}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <button
                    className="inline-flex items-center justify-center min-h-[44px] rounded-xl border border-secondary-200 px-3.5 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-50 transition disabled:opacity-50"
                    disabled={busy}
                    onClick={() => remove(app.applicationId ?? app.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast message={toast} />
    </div>
  )
}
