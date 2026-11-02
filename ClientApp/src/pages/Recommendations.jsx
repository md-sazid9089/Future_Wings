import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, FOCUS } from '../components/ui/styles.js'
import { evaluateProfileCompletion } from '../lib/profileCompletion.js'

const formatTuition = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount)

const formatDuration = (months) => months % 12 === 0
  ? `${months / 12} year${months === 12 ? '' : 's'}`
  : `${months} months`

export default function Recommendations({ session, onNavigate }) {
  const [profile, setProfile] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingIds, setSavingIds] = useState(() => new Set())
  const [trackedProgramIds, setTrackedProgramIds] = useState(() => new Set())
  const [trackingIds, setTrackingIds] = useState(() => new Set())
  const [toastMessage, setToastMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [profileData, recs, tracked] = await Promise.all([
        apiRequest('/profile', { token: session.token }),
        apiRequest('/recommendation', { token: session.token }),
        apiRequest('/applications', { token: session.token }).catch(() => []),
      ])
      setProfile(profileData)
      setRecommendations(recs ?? [])
      if (Array.isArray(tracked)) {
        setTrackedProgramIds(new Set(tracked.map((app) => app.programId)))
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    const timer = setTimeout(loadData, 0)
    return () => clearTimeout(timer)
  }, [loadData, refreshKey])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const isProgramTracked = (programId) => {
    return trackedProgramIds.has(programId) || Boolean(recommendations.find((p) => p.programId === programId)?.isTracked)
  }

  const trackProgram = async (item) => {
    if (!item?.programId || isProgramTracked(item.programId) || trackingIds.has(item.programId)) return
    setTrackingIds((current) => new Set(current).add(item.programId))
    try {
      await apiRequest('/applications', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ programId: item.programId }),
      })
      setTrackedProgramIds((current) => new Set(current).add(item.programId))
      setRecommendations((current) => current.map((rec) =>
        rec.programId === item.programId ? { ...rec, isTracked: true } : rec))
      setToastMessage('Added to Application Tracker')
    } catch (requestError) {
      if (requestError.message?.includes('already tracking')) {
        setTrackedProgramIds((current) => new Set(current).add(item.programId))
        setRecommendations((current) => current.map((rec) =>
          rec.programId === item.programId ? { ...rec, isTracked: true } : rec))
        setToastMessage('This program is already in your Application Tracker.')
      } else {
        setToastMessage(requestError.message || 'Failed to add to Application Tracker.')
      }
    } finally {
      setTrackingIds((current) => {
        const next = new Set(current)
        next.delete(item.programId)
        return next
      })
    }
  }

  const toggleSaved = async (recommendation) => {
    if (savingIds.has(recommendation.programId)) return
    const nextSaved = !recommendation.isSaved
    setSavingIds((current) => new Set(current).add(recommendation.programId))
    setRecommendations((current) => current.map((item) =>
      item.programId === recommendation.programId ? { ...item, isSaved: nextSaved } : item))
    try {
      await apiRequest(`/discovery/saved/${recommendation.programId}`, { token: session.token, method: nextSaved ? 'PUT' : 'DELETE' })
    } catch (requestError) {
      setRecommendations((current) => current.map((item) =>
        item.programId === recommendation.programId ? { ...item, isSaved: recommendation.isSaved } : item))
      setError(requestError.message)
    } finally {
      setSavingIds((current) => { const next = new Set(current); next.delete(recommendation.programId); return next })
    }
  }

  const profileCompletion = useMemo(() => evaluateProfileCompletion(profile), [profile])

  const stats = useMemo(() => ({
    excellent: recommendations.filter((item) => item.matchScore >= 90).length,
    countries: new Set(recommendations.map((item) => item.country)).size,
    saved: recommendations.filter((item) => item.isSaved).length,
  }), [recommendations])

  // Profile-completion required state
  if (!loading && profile && !profileCompletion.isComplete) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 pb-16" data-testid="recommendations-incomplete-state">
        <header className="relative overflow-hidden rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-500/20 border border-warning-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-warning-300">
              <span className="h-2 w-2 rounded-full bg-warning-400" />
              Profile Completion Required
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Personalized University Recommendations
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-secondary-300 leading-relaxed">
              Our AI Match Engine evaluates your academic eligibility, annual tuition budget, and degree level to calculate authentic match scores.
            </p>
          </div>
        </header>

        <section className={`${CARD} p-8 sm:p-12 text-center space-y-6`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-100 text-warning-700">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-secondary-950">Complete Your Academic Profile</h2>
            <p className="text-sm text-secondary-600 leading-relaxed">
              Your profile is missing required academic fields ({profileCompletion.completedCount} of {profileCompletion.totalRequired} completed).
              {profileCompletion.missingFields.length > 0 && (
                <span className="block mt-1 font-semibold text-secondary-800">
                  Missing: {profileCompletion.missingFields.join(', ')}
                </span>
              )}
            </p>
          </div>

          <div className="pt-2">
            <button
              className={`${BTN_PRIMARY} px-8 py-3 text-xs font-extrabold`}
              onClick={() => onNavigate?.('Profile')}
              type="button"
              data-testid="recommendations-go-to-profile-btn"
            >
              Complete Profile Now <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* Header Banner */}
      <header
        data-tour="recommendations-header"
        className="relative overflow-hidden flex flex-col justify-between gap-6 rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-6 text-white shadow-xl sm:flex-row sm:items-end sm:p-10"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
            <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
            AI Profile Fit Engine
          </span>
          <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white">
            Your Strongest University Matches
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-secondary-300">
            Ranked using multi-factor profile modeling: academic eligibility, budget coverage, visa historical outcome rates, and post-study opportunities.
          </p>
        </div>
        <button
          className="shrink-0 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-secondary-950 shadow-md transition hover:bg-primary-50 hover:text-primary-700 relative z-10"
          onClick={() => setRefreshKey((key) => key + 1)}
          type="button"
        >
          Refresh Matches
        </button>
      </header>

      {/* KPI Stats */}
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Recommendation summary">
        <article className="group rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Tier 1 Matches</p>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-primary-600 tabular-nums">{stats.excellent}</p>
          <p className="mt-1 text-xs text-secondary-400 font-medium">90%+ match score</p>
        </article>
        <article className="group rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Global Destinations</p>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-secondary-950 tabular-nums">{stats.countries}</p>
          <p className="mt-1 text-xs text-secondary-400 font-medium">Countries represented</p>
        </article>
        <article className="group rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Saved to Shortlist</p>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-secondary-950 tabular-nums">{stats.saved}</p>
          <p className="mt-1 text-xs text-secondary-400 font-medium">Ready for application</p>
        </article>
      </section>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-medium text-danger-700 shadow-sm" role="alert">
          <span>{error}</span>
          <button className="font-bold underline" onClick={() => setRefreshKey((key) => key + 1)} type="button">
            Try again
          </button>
        </div>
      )}

      {/* Program Cards Grid */}
      <section data-tour="recommendations-container" aria-labelledby="matches-title">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Ranked by Profile Fit</p>
          <h2 className="mt-0.5 text-2xl font-black text-secondary-950" id="matches-title">
            Recommended Degree Programs
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2" aria-label="Loading recommendations">
            {[1, 2, 3, 4].map((item) => (
              <div className="h-64 animate-pulse rounded-3xl bg-secondary-200/60" key={item} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {recommendations.map((item, index) => (
              <article
                className="group relative overflow-hidden rounded-3xl border border-secondary-200/80 bg-white p-5 sm:p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl flex flex-col justify-between"
                key={item.programId}
              >
                <div>
                  <div className="absolute right-0 top-0 rounded-bl-2xl bg-primary-50 border-l border-b border-primary-200 px-3.5 py-1.5 text-xs font-black text-primary-800">
                    Rank #{index + 1}
                  </div>

                  <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-3 sm:gap-4 pr-16 sm:pr-20">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 font-black text-base sm:text-lg text-white shadow-md">
                      {Math.round(item.matchScore)}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                        {item.country} · {item.city}
                      </p>
                      <h3 className="text-base sm:text-lg font-black tracking-tight text-secondary-950 group-hover:text-primary-600 transition-colors break-words">
                        {item.programName}
                      </h3>
                      <p className="text-xs font-medium text-secondary-500">
                        {item.universityName}
                      </p>
                    </div>
                  </div>

                  {item.reason && (
                    <div className="mt-4 rounded-xl bg-secondary-50/80 border border-secondary-200/60 p-3 text-xs text-secondary-700">
                      <span className="font-bold text-secondary-900">Why this fits: </span>
                      {item.reason}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        className="rounded-lg bg-secondary-100 px-2 py-0.5 text-[11px] font-semibold text-secondary-600"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-secondary-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs text-secondary-400">Annual Tuition</p>
                    <p className="text-base font-black text-secondary-950">
                      {formatTuition(item.annualTuitionUsd)}
                    </p>
                    <p className="text-[11px] text-secondary-500">{formatDuration(item.durationMonths)} · {item.level}</p>
                  </div>

                  <div className="flex flex-col min-[380px]:flex-row flex-wrap items-stretch min-[380px]:items-center gap-2">
                    <button
                      className={`inline-flex items-center justify-center min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition ${FOCUS} ${
                        item.isSaved
                          ? 'border-primary-500 bg-primary-50 text-primary-700 hover:bg-primary-100'
                          : 'border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50'
                      }`}
                      disabled={savingIds.has(item.programId)}
                      onClick={() => toggleSaved(item)}
                      type="button"
                      data-testid={`save-program-btn-${item.programId}`}
                    >
                      {item.isSaved ? 'Saved ✓' : 'Save to Shortlist'}
                    </button>

                    {isProgramTracked(item.programId) ? (
                      <button
                        type="button"
                        data-testid={`track-program-btn-${item.programId}`}
                        onClick={() => onNavigate?.('Applications')}
                        className={`inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-xl border border-success-200 bg-success-50 hover:bg-success-100 px-3.5 py-2 text-xs font-bold text-success-800 transition ${FOCUS}`}
                        title="View in Application Tracker"
                      >
                        <span className="h-2 w-2 rounded-full bg-success-600" aria-hidden="true" />
                        <span>In Application Tracker</span>
                        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-testid={`track-program-btn-${item.programId}`}
                        disabled={trackingIds.has(item.programId)}
                        onClick={() => trackProgram(item)}
                        className={`inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm shadow-primary-500/20 transition disabled:opacity-60 ${FOCUS}`}
                      >
                        {trackingIds.has(item.programId) ? (
                          <>
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                            <span>Tracking…</span>
                          </>
                        ) : (
                          <>
                            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Add to Application Tracker</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Toast
        message={toastMessage}
        actionLabel={toastMessage.includes('Added') ? 'View Application Tracker' : undefined}
        onAction={() => onNavigate?.('Applications')}
      />
    </div>
  )
}
