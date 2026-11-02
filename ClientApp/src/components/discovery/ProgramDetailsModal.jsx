import { useEffect, useState } from 'react'
import { apiRequest } from '../../auth.js'
import { FOCUS } from '../ui/styles.js'

const formatTuition = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Not specified'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDuration = (months) => {
  if (!months || isNaN(months) || months <= 0) return 'Not specified'
  return months % 12 === 0
    ? `${months / 12} year${months === 12 ? '' : 's'}`
    : `${months} months`
}

export default function ProgramDetailsModal({
  isOpen,
  onClose,
  program = null,
  programId = null,
  session,
  onToggleSave,
  onTrackProgram,
  onNavigate,
}) {
  const [details, setDetails] = useState(program)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [applying, setApplying] = useState(false)
  const [actionNotice, setActionNotice] = useState('')

  const activeId = program?.id ?? programId

  // Load details directly from API if programId provided or to refresh details
  useEffect(() => {
    if (!isOpen || !activeId) return

    let active = true
    setLoading(!program) // only show full loading skeleton if we don't already have initial program card data
    setError('')
    setNotFound(false)
    setActionNotice('')

    if (program) {
      setDetails(program)
    }

    const token = session?.token
    const url = `/discovery/programs/${activeId}`

    apiRequest(url, { token })
      .then((data) => {
        if (!active) return
        if (data) {
          setDetails((prev) => ({ ...(prev || {}), ...data }))
        } else {
          setNotFound(true)
        }
      })
      .catch((err) => {
        if (!active) return
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setNotFound(true)
        } else {
          setError(err.message || 'Failed to load program details.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, activeId, program, session?.token])

  const retryLoad = () => {
    if (!activeId) return
    setLoading(true)
    setError('')
    setNotFound(false)
    apiRequest(`/discovery/programs/${activeId}`, { token: session?.token })
      .then((data) => {
        if (data) setDetails((prev) => ({ ...(prev || {}), ...data }))
        else setNotFound(true)
      })
      .catch((err) => {
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setNotFound(true)
        } else {
          setError(err.message || 'Failed to load program details.')
        }
      })
      .finally(() => setLoading(false))
  }

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }

  const handleSaveClick = async () => {
    if (!details) return
    const nextSaved = !details.isSaved
    setDetails((prev) => ({ ...prev, isSaved: nextSaved }))
    if (onToggleSave) {
      try {
        await onToggleSave(details)
      } catch {
        setDetails((prev) => ({ ...prev, isSaved: !nextSaved }))
      }
    }
  }

  const handleAddToApplications = async () => {
    if (!details || details.isTracked || applying) return
    try {
      setApplying(true)
      await apiRequest('/applications', {
        method: 'POST',
        token: session.token,
        body: { programId: details.id },
      })
      setDetails((prev) => ({ ...prev, isTracked: true }))
      setActionNotice('Added to Application Tracker!')
      onTrackProgram?.(details.id)
    } catch (err) {
      if (err.message?.includes('already tracking')) {
        setDetails((prev) => ({ ...prev, isTracked: true }))
        setActionNotice('This program is already in your Application Tracker.')
        onTrackProgram?.(details.id)
      } else {
        setActionNotice(err.message || 'Failed to add to applications.')
      }
    } finally {
      setApplying(false)
    }
  }

  return (
    <div
      aria-labelledby="program-details-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/70 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn"
      data-testid="program-details-modal"
      onMouseDown={handleBackdropClick}
      role="dialog"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-secondary-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-start justify-between border-b border-secondary-100 bg-surface px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="min-w-0 pr-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-800">
              Program Details
            </span>
            <p className="mt-1 text-xs text-secondary-500 font-semibold truncate">
              {details?.university
                ? `${details.university} · ${details.city || 'City'}, ${details.country || 'Country'}`
                : 'Academic Program Details'}
            </p>
          </div>
          <button
            aria-label="Close program details"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-secondary-400 transition hover:bg-secondary-100 hover:text-secondary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            data-testid="close-details-btn"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
          {loading && !details && (
            <div className="py-16 text-center" data-testid="details-loading-state">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
              <p className="mt-3 text-xs font-semibold text-secondary-600">Loading program details…</p>
            </div>
          )}

          {notFound && (
            <div className="py-12 text-center" data-testid="details-not-found-state">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-secondary-400">
                <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-bold text-secondary-900">Program Not Found</h3>
              <p className="mt-1 text-xs text-secondary-500">
                The requested academic program could not be located in the catalog.
              </p>
              <button
                className="mt-4 rounded-xl bg-primary-50 border border-primary-200 px-4 py-2 text-xs font-bold text-primary-700 hover:bg-primary-100"
                onClick={onClose}
                type="button"
              >
                Back to Programs
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700" data-testid="details-error" role="alert">
              <span>{error}</span>
              <button
                className="font-bold underline hover:text-danger-900"
                data-testid="details-retry-btn"
                onClick={retryLoad}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {actionNotice && (
            <div className="rounded-2xl border border-primary-200 bg-primary-50 p-3 text-xs font-bold text-primary-800" role="status">
              {actionNotice}
            </div>
          )}

          {details && !notFound && (
            <div className="space-y-6" data-testid="program-details-content">
              {/* Title & Match Score Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-secondary-950 leading-tight" id="program-details-title">
                    {details.name}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-secondary-600">
                    {details.university}
                  </p>
                  <p className="mt-0.5 text-xs text-primary-700 font-bold uppercase tracking-wider">
                    {details.city ? `${details.city}, ` : ''}{details.country}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-xl bg-primary-50 border border-primary-200 px-3 py-1.5 text-xs font-extrabold text-primary-700">
                    {details.matchScore}% Academic Match
                  </span>
                </div>
              </div>

              {/* Key Highlights Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-secondary-200 bg-surface p-3.5">
                  <p className="text-[10px] font-bold uppercase text-secondary-400">Annual Tuition</p>
                  <p className="mt-1 font-black text-secondary-950 text-sm">
                    {formatTuition(details.annualTuitionUsd)}
                    {typeof details.annualTuitionUsd === 'number' && <span className="text-[11px] font-normal text-secondary-500"> /yr</span>}
                  </p>
                </div>

                <div className="rounded-2xl border border-secondary-200 bg-surface p-3.5">
                  <p className="text-[10px] font-bold uppercase text-secondary-400">Duration</p>
                  <p className="mt-1 font-black text-secondary-950 text-sm">
                    {formatDuration(details.durationMonths)}
                  </p>
                </div>

                <div className="rounded-2xl border border-secondary-200 bg-surface p-3.5">
                  <p className="text-[10px] font-bold uppercase text-secondary-400">Degree Level</p>
                  <p className="mt-1 font-black text-secondary-950 text-sm">
                    {details.level || 'Not specified'}
                  </p>
                </div>

                <div className="rounded-2xl border border-secondary-200 bg-surface p-3.5">
                  <p className="text-[10px] font-bold uppercase text-secondary-400">Application State</p>
                  <p className="mt-1 font-black text-xs">
                    {details.isTracked ? (
                      <span className="text-emerald-700 font-extrabold">Tracked</span>
                    ) : (
                      <span className="text-secondary-500 font-medium">Not tracked</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Featured Study Tracks / Tags */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900 mb-2">
                  Featured Study Tracks & Disciplines
                </h3>
                {details.tags && details.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5" data-testid="details-tags-list">
                    {details.tags.map((tag) => (
                      <span
                        className="rounded-lg bg-secondary-100 border border-secondary-200/60 px-2.5 py-1 text-xs font-medium text-secondary-700"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-secondary-400">Not specified</p>
                )}
              </div>

              {/* Program Overview & Description */}
              <div className="rounded-2xl border border-secondary-200/80 bg-white p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900">
                  Program Overview
                </h3>
                <p className="text-xs text-secondary-700 leading-relaxed whitespace-pre-line" data-testid="details-description">
                  {details.description || 'Not specified'}
                </p>
              </div>

              {/* Requirements & Admissions Information */}
              <div className="rounded-2xl border border-secondary-200/80 bg-white p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900">
                  Admissions & Language Requirements
                </h3>
                <p className="text-xs text-secondary-700 leading-relaxed whitespace-pre-line" data-testid="details-requirements">
                  {details.requirements || 'Not specified'}
                </p>
              </div>

              {/* Official Link */}
              <div className="rounded-2xl border border-secondary-200/80 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900">
                    Official University Portal
                  </h3>
                  <p className="text-xs text-secondary-500">
                    Direct admission requirements, faculty profiles, and departmental portal.
                  </p>
                </div>
                {details.officialLink ? (
                  <a
                    className={`inline-flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2 text-xs font-bold text-primary-700 hover:bg-primary-100 transition shrink-0 ${FOCUS}`}
                    data-testid="details-official-link"
                    href={details.officialLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>Visit Official Program</span>
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                ) : (
                  <span className="text-xs text-secondary-400 font-medium" data-testid="details-official-link-empty">
                    Not specified
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-secondary-100 bg-surface px-4 sm:px-6 py-3.5 sm:py-4">
          <button
            className={`w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] rounded-xl border border-secondary-300 px-4 py-2.5 text-xs font-bold text-secondary-700 hover:bg-secondary-100 transition ${FOCUS}`}
            data-testid="return-search-btn"
            onClick={onClose}
            type="button"
          >
            Back to Programs
          </button>

          {details && !notFound && (
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {/* Shortlist Bookmark Toggle */}
              <button
                className={`inline-flex items-center justify-center min-h-[44px] rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                  details.isSaved
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border-secondary-300 bg-white text-secondary-700 hover:border-primary-300 hover:text-primary-600'
                } ${FOCUS}`}
                data-testid="details-save-btn"
                onClick={handleSaveClick}
                type="button"
              >
                <svg className={`h-4 w-4 ${details.isSaved ? 'fill-emerald-600' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span>{details.isSaved ? 'Saved in Shortlist' : 'Save to Shortlist'}</span>
              </button>

              {/* Add to Application Tracking */}
              {details.isTracked ? (
                <button
                  className={`inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-xl border border-success-200 bg-success-50 px-4 py-2.5 text-xs font-bold text-success-800 hover:bg-success-100 transition ${FOCUS}`}
                  data-testid="details-view-applications-btn"
                  onClick={() => {
                    onClose?.()
                    onNavigate?.('Applications')
                  }}
                  type="button"
                >
                  <span className="h-2 w-2 rounded-full bg-success-600" aria-hidden="true" />
                  <span>In Application Tracker</span>
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button
                  className={`inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-primary-500/20 transition disabled:opacity-50 ${FOCUS}`}
                  data-testid="details-add-application-btn"
                  disabled={applying}
                  onClick={handleAddToApplications}
                  type="button"
                >
                  {applying ? (
                    'Tracking…'
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
          )}
        </div>
      </div>
    </div>
  )
}
