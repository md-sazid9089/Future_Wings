import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { CARD, CONTROL, FOCUS } from '../components/ui/styles.js'
import ScholarshipDetails from '../components/scholarships/ScholarshipDetails.jsx'
import { flag, money, date, getDeadlineStatus } from '../lib/scholarshipUtils.js'
import { evaluateProfileCompletion } from '../lib/profileCompletion.js'

export default function Scholarships({ session, onNavigate }) {
  const [items, setItems] = useState([])
  const [profile, setProfile] = useState(null)
  const [query, setQuery] = useState('')
  const [countryId, setCountryId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(() => new Set())
  const [toast, setToast] = useState('')

  // Details view state
  const [selectedScholarshipId, setSelectedScholarshipId] = useState(null)
  const [selectedScholarship, setSelectedScholarship] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [interestLoading, setInterestLoading] = useState(false)
  const [togglingStepId, setTogglingStepId] = useState(null)

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    if (countryId) params.set('countryId', countryId)
    try {
      const response = await apiRequest(`/scholarship?${params}`, { token: session.token, signal })
      setItems(response)
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [countryId, query, session.token])

  useEffect(() => {
    let active = true
    if (session?.token && session.role !== 'Admin' && session.role !== 'Agent') {
      apiRequest('/profile', { token: session.token })
        .then((p) => { if (active) setProfile(p) })
        .catch(() => {})
    }
    return () => { active = false }
  }, [session])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => load(controller.signal), 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [load])

  // Fetch full details when a scholarship is selected
  const handleViewDetails = useCallback(async (id) => {
    setSelectedScholarshipId(id)
    setDetailsLoading(true)
    setDetailsError('')

    // Seed basic info immediately from list if available
    const cached = items.find((item) => item.id === id)
    if (cached) {
      setSelectedScholarship(cached)
    }

    try {
      const details = await apiRequest(`/scholarship/${id}`, { token: session.token })
      setSelectedScholarship(details)
    } catch (err) {
      setDetailsError(err.message || 'Failed to load scholarship details.')
    } finally {
      setDetailsLoading(false)
    }
  }, [items, session.token])

  const handleBackToList = useCallback(() => {
    setSelectedScholarshipId(null)
    setSelectedScholarship(null)
    setDetailsError('')
  }, [])

  // Handle keyboard navigation (Escape returns to list)
  useEffect(() => {
    if (!selectedScholarshipId) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleBackToList()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedScholarshipId, handleBackToList])

  const addDeadline = async (scholarship) => {
    if (adding.has(scholarship.id) || !scholarship.deadline) return
    setAdding((curr) => new Set(curr).add(scholarship.id))
    try {
      await apiRequest('/deadlines', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({
          title: `${scholarship.name} deadline`,
          dueDate: scholarship.deadline,
          description: `Application deadline for ${scholarship.name} (${scholarship.countryName})`,
        }),
      })
      setToast(`Deadline added for ${scholarship.name}`)
    } catch (requestError) {
      setToast(requestError.message)
    } finally {
      setAdding((curr) => {
        const next = new Set(curr)
        next.delete(scholarship.id)
        return next
      })
    }
  }

  // Handle "I'm Interested" action on selected scholarship
  const handleExpressInterest = async () => {
    if (!selectedScholarshipId || interestLoading) return
    setInterestLoading(true)
    try {
      const interest = await apiRequest(`/scholarship/${selectedScholarshipId}/interest`, {
        token: session.token,
        method: 'POST',
      })
      setSelectedScholarship((current) => current ? { ...current, interest, isInterested: true } : current)
      setToast('Application process added to your checklist!')
    } catch (err) {
      setToast(err.message || 'Could not express interest.')
    } finally {
      setInterestLoading(false)
    }
  }

  // Handle checklist step completion toggle
  const handleToggleStep = async (step) => {
    if (!selectedScholarshipId || togglingStepId === step.id) return
    setTogglingStepId(step.id)
    const nextCompleted = !step.isCompleted

    // Optimistic UI update
    setSelectedScholarship((current) => {
      if (!current?.interest?.steps) return current
      const nextSteps = current.interest.steps.map((s) =>
        s.id === step.id ? { ...s, isCompleted: nextCompleted } : s,
      )
      return {
        ...current,
        interest: {
          ...current.interest,
          steps: nextSteps,
        },
      }
    })

    try {
      const updated = await apiRequest(
        `/scholarship/${selectedScholarshipId}/checklist/${step.id}`,
        {
          token: session.token,
          method: 'PUT',
          body: JSON.stringify({ isCompleted: nextCompleted }),
        },
      )
      // Reconcile with server response
      setSelectedScholarship((current) => {
        if (!current?.interest?.steps) return current
        const nextSteps = current.interest.steps.map((s) =>
          s.id === step.id ? updated : s,
        )
        return {
          ...current,
          interest: {
            ...current.interest,
            steps: nextSteps,
          },
        }
      })
    } catch (err) {
      // Revert optimistic update
      setSelectedScholarship((current) => {
        if (!current?.interest?.steps) return current
        const nextSteps = current.interest.steps.map((s) =>
          s.id === step.id ? step : s,
        )
        return {
          ...current,
          interest: {
            ...current.interest,
            steps: nextSteps,
          },
        }
      })
      setToast(err.message || 'Failed to update milestone status.')
    } finally {
      setTogglingStepId(null)
    }
  }

  const countries = useMemo(() => {
    const map = new Map()
    items.forEach((item) => {
      if (item.countryId && item.countryName) map.set(item.countryId, item.countryName)
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [items])

  const maximumAward = useMemo(
    () => items.reduce((max, item) => (item.awardAmount > max ? item.awardAmount : max), 0),
    [items],
  )

  const profileCompletion = useMemo(() => evaluateProfileCompletion(profile), [profile])

  // RENDER: If a scholarship is selected, show details view
  if (selectedScholarshipId !== null) {
    return (
      <div className="mx-auto max-w-7xl pb-16">
        <ScholarshipDetails
          scholarship={selectedScholarship}
          loading={detailsLoading}
          error={detailsError}
          onBack={handleBackToList}
          onAddDeadline={() => selectedScholarship && addDeadline(selectedScholarship)}
          addingDeadline={selectedScholarship ? adding.has(selectedScholarship.id) : false}
          onExpressInterest={handleExpressInterest}
          interestLoading={interestLoading}
          onToggleStep={handleToggleStep}
          togglingStepId={togglingStepId}
          onRetry={() => handleViewDetails(selectedScholarshipId)}
        />
        <Toast message={toast} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7" data-testid="scholarships-directory">
      {/* Profile Incomplete Advisory for student users */}
      {profile && !profileCompletion.isComplete && (
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-warning-200 bg-warning-50 p-4 text-xs sm:text-sm text-warning-900 shadow-sm"
          role="alert"
          data-testid="scholarships-profile-advisory"
        >
          <div className="flex items-start sm:items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-warning-600 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div>
              <p className="font-bold text-warning-950">
                Personalized scholarship matching requires profile completion
              </p>
              <p className="text-warning-800 text-xs mt-0.5">
                Showing all general opportunities. Complete your CGPA, target major, budget, and degree level for custom eligibility fit.
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-warning-600 hover:bg-warning-700 px-4 py-2 text-xs font-bold text-white transition active:scale-[0.98]"
              onClick={() => onNavigate('Profile')}
              type="button"
              data-testid="scholarships-complete-profile-btn"
            >
              Complete Profile <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      )}

      {/* Directory Header Banner */}
      <section className="rounded-2xl border border-secondary-800 bg-secondary-950 px-6 py-8 text-white sm:px-10 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-400">Funding directory</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-white">Fund your study-abroad journey.</h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary-300 leading-relaxed">
          Search verified opportunities by destination, compare awards, and keep every application deadline in one place.
        </p>

        {/* Search & Country filter */}
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
          <div>
            <label className="sr-only" htmlFor="scholarship-search">
              Search scholarships
            </label>
            <input
              className={`${CONTROL} w-full`}
              id="scholarship-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search scholarship or country"
              type="search"
              value={query}
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="scholarship-country">
              Filter by country
            </label>
            <select
              className={`${CONTROL} w-full`}
              id="scholarship-country"
              onChange={(event) => setCountryId(event.target.value)}
              value={countryId}
            >
              <option value="">All countries</option>
              {countries.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Directory Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className={`${CARD} p-5`}>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-400">Total opportunities</p>
          <p className="mt-2 text-3xl font-black text-secondary-950">{loading ? '—' : items.length}</p>
        </div>
        <div className={`${CARD} p-5`}>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-400">Maximum award</p>
          <p className="mt-2 text-3xl font-black text-primary-600">{loading ? '—' : money(maximumAward)}</p>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div aria-label="Loading scholarships" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div className="h-64 animate-pulse rounded-2xl bg-secondary-200/60" key={item} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <section className={`${CARD} border-dashed px-6 py-14 text-center space-y-2`}>
          <p className="font-bold text-secondary-900 text-lg">No scholarships found</p>
          <p className="text-sm text-secondary-500">Try adjusting your keyword search or country filter.</p>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const deadlineInfo = getDeadlineStatus(item.deadline)
            return (
              <article
                className={`${CARD} p-5 flex flex-col justify-between hover:border-secondary-300 hover:shadow-md transition`}
                key={item.id}
                data-testid={`scholarship-card-${item.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xl" role="img" aria-label={item.countryName}>
                      {flag(item.countryName)}
                    </span>
                    <span className="rounded-full bg-success-50 border border-success-200 px-3 py-0.5 text-xs font-bold text-success-700">
                      {money(item.awardAmount)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                      {item.countryName} {item.countryCode && `(${item.countryCode})`}
                    </p>
                    <h2 className="mt-1 text-base font-bold text-secondary-950 leading-snug line-clamp-2">
                      {item.name}
                    </h2>
                  </div>

                  {item.criteriaSnippet && (
                    <p className="text-xs text-secondary-600 line-clamp-3 leading-relaxed">
                      {item.criteriaSnippet}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-secondary-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary-400 font-medium">Deadline</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full ${deadlineInfo.badgeClass}`}
                    >
                      {deadlineInfo.isExpired
                        ? 'Deadline passed'
                        : deadlineInfo.isApproaching
                        ? deadlineInfo.label
                        : date(item.deadline)}
                    </span>
                  </div>

                  <div className="flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-2">
                    <button
                      className={`flex-1 inline-flex items-center justify-center min-h-[44px] rounded-xl bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 text-xs font-bold shadow-sm transition active:scale-[0.98] ${FOCUS}`}
                      onClick={() => handleViewDetails(item.id)}
                      type="button"
                      data-testid={`view-scholarship-btn-${item.id}`}
                    >
                      View Details
                    </button>
                    <button
                      className={`inline-flex items-center justify-center min-h-[44px] rounded-xl border border-primary-300 bg-white hover:bg-primary-50 text-primary-700 px-3 py-2 text-xs font-bold transition disabled:opacity-40 disabled:hover:bg-white active:scale-[0.98] ${FOCUS}`}
                      disabled={!item.deadline || adding.has(item.id)}
                      onClick={() => addDeadline(item)}
                      type="button"
                      data-testid={`add-deadline-${item.id}`}
                    >
                      {adding.has(item.id) ? 'Adding…' : 'Add to Deadlines'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
