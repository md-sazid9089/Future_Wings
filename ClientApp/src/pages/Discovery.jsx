import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import { useAiSearch } from '../lib/useAiSearch.js'
import ProgramDetailsModal from '../components/discovery/ProgramDetailsModal.jsx'
import Toast from '../components/ui/Toast.jsx'
import { FOCUS } from '../components/ui/styles.js'

const emptyResult = { featuredCountries: [], programs: [], countries: [], levels: [], studyTracks: [], totalCount: 0 }

const formatTuition = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount)

const formatDuration = (months) => months % 12 === 0
  ? `${months / 12} year${months === 12 ? '' : 's'}`
  : `${months} months`

const AI_SUGGESTIONS = [
  'Affordable STEM in Germany',
  'Master in Data Science in UK',
  'Computer Science with Co-op in Canada',
  'Low Tuition Public Universities',
]

export default function Discovery({ session, onNavigate }) {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [level, setLevel] = useState('')
  const [track, setTrack] = useState('')
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [result, setResult] = useState(emptyResult)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingIds, setSavingIds] = useState(() => new Set())
  const [savedPrograms, setSavedPrograms] = useState([])
  const [trackedProgramIds, setTrackedProgramIds] = useState(() => new Set())
  const [trackingIds, setTrackingIds] = useState(() => new Set())
  const [toastMessage, setToastMessage] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const { classify, status: aiStatus, error: aiWorkerError } = useAiSearch()
  const [aiQuery, setAiQuery] = useState('')
  const [aiMatches, setAiMatches] = useState(null)
  const [aiError, setAiError] = useState('')

  const loadPrograms = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (query.trim()) params.set('query', query.trim())
    if (country) params.set('country', country)
    if (level) params.set('level', level)
    if (track) params.set('track', track)

    try {
      const data = await apiRequest(`/discovery?${params}`, { token: session?.token, signal })
      setResult(data)
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [country, level, query, track, session?.token])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => loadPrograms(controller.signal), 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [loadPrograms, reloadKey])

  useEffect(() => {
    let active = true
    apiRequest('/discovery/saved', { token: session?.token })
      .then((programs) => { if (active) setSavedPrograms(programs) })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [reloadKey, session?.token])

  useEffect(() => {
    let active = true
    apiRequest('/applications', { token: session?.token })
      .then((tracked) => {
        if (!active || !Array.isArray(tracked)) return
        setTrackedProgramIds(new Set(tracked.map((app) => app.programId)))
      })
      .catch(() => {})
    return () => { active = false }
  }, [reloadKey, session?.token])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const isProgramTracked = (programId) => {
    return trackedProgramIds.has(programId) || Boolean(result.programs.find((p) => p.id === programId)?.isTracked)
  }

  const trackProgram = async (program) => {
    if (!program?.id || isProgramTracked(program.id) || trackingIds.has(program.id)) return
    setTrackingIds((current) => new Set(current).add(program.id))
    try {
      await apiRequest('/applications', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ programId: program.id }),
      })
      setTrackedProgramIds((current) => new Set(current).add(program.id))
      setResult((current) => ({
        ...current,
        programs: current.programs.map((item) => item.id === program.id ? { ...item, isTracked: true } : item),
      }))
      if (selectedProgram && selectedProgram.id === program.id) {
        setSelectedProgram((prev) => prev ? { ...prev, isTracked: true } : prev)
      }
      setToastMessage('Added to Application Tracker')
    } catch (requestError) {
      if (requestError.message?.includes('already tracking')) {
        setTrackedProgramIds((current) => new Set(current).add(program.id))
        setResult((current) => ({
          ...current,
          programs: current.programs.map((item) => item.id === program.id ? { ...item, isTracked: true } : item),
        }))
        if (selectedProgram && selectedProgram.id === program.id) {
          setSelectedProgram((prev) => prev ? { ...prev, isTracked: true } : prev)
        }
        setToastMessage('This program is already in your Application Tracker.')
      } else {
        setToastMessage(requestError.message || 'Failed to add to Application Tracker.')
      }
    } finally {
      setTrackingIds((current) => {
        const next = new Set(current)
        next.delete(program.id)
        return next
      })
    }
  }

  const toggleSaved = async (program) => {
    if (savingIds.has(program.id)) return
    const nextSaved = !program.isSaved
    setSavingIds((current) => new Set(current).add(program.id))
    setResult((current) => ({
      ...current,
      programs: current.programs.map((item) => item.id === program.id ? { ...item, isSaved: nextSaved } : item),
    }))
    setSavedPrograms((current) => nextSaved
      ? [...current.filter((item) => item.id !== program.id), { ...program, isSaved: true }]
      : current.filter((item) => item.id !== program.id))
    setSelectedProgram((current) => (current && current.id === program.id ? { ...current, isSaved: nextSaved } : current))

    try {
      await apiRequest(`/discovery/saved/${program.id}`, {
        token: session.token,
        method: nextSaved ? 'PUT' : 'DELETE',
      })
    } catch (requestError) {
      setResult((current) => ({
        ...current,
        programs: current.programs.map((item) => item.id === program.id ? { ...item, isSaved: program.isSaved } : item),
      }))
      setSavedPrograms((current) => program.isSaved
        ? [...current.filter((item) => item.id !== program.id), program]
        : current.filter((item) => item.id !== program.id))
      setSelectedProgram((current) => (current && current.id === program.id ? { ...current, isSaved: program.isSaved } : current))
      setError(requestError.message)
    } finally {
      setSavingIds((current) => {
        const next = new Set(current)
        next.delete(program.id)
        return next
      })
    }
  }

  const clearFilters = () => {
    setQuery('')
    setCountry('')
    setLevel('')
    setTrack('')
  }

  const runAiSearch = async (event) => {
    if (event) event.preventDefault()
    if (!aiQuery.trim() || result.programs.length === 0) return
    setAiError('')
    try {
      setAiMatches(await classify(aiQuery, result.programs))
    } catch (searchError) {
      setAiMatches(null)
      setAiError(searchError.message)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setAiQuery(suggestion)
    if (result.programs.length > 0) {
      classify(suggestion, result.programs)
        .then(setAiMatches)
        .catch((err) => setAiError(err.message))
    }
  }

  const clearAiSearch = () => { setAiQuery(''); setAiMatches(null); setAiError('') }

  const displayedPrograms = aiMatches ?? result.programs
  const aiUnavailable = aiStatus === 'error'
  const aiBusy = aiStatus === 'loading-model' || aiStatus === 'classifying'

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* Hero Banner with Integrated Search */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 px-6 py-10 text-white shadow-xl sm:px-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
            <span className="h-2 w-2 rounded-full bg-primary-400" />
            Global University Catalog
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            Find programs that match your ambitions.
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-secondary-300 sm:text-base">
            Compare international universities, verify tuition fees, discover scholarships, and shortlist programs for direct application.
          </p>
          
          <label className="mt-6 flex max-w-2xl items-center gap-3 rounded-2xl bg-white p-2 pl-4 shadow-lg" htmlFor="program-search">
            <svg className="h-5 w-5 text-secondary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="sr-only">Search programs</span>
            <input
              className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-secondary-900 outline-none placeholder:text-secondary-400 sm:text-base"
              id="program-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by program, university, or destination..."
              type="search"
              value={query}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs font-bold text-secondary-400 hover:text-secondary-700 px-2"
              >
                Clear
              </button>
            )}
            <span className="hidden rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-md sm:block">
              Search
            </span>
          </label>
        </div>
      </section>

      {/* AI Natural Language Search Box */}
      <section aria-labelledby="ai-search-title" className="rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600 font-black text-xs">
              AI
            </span>
            <div>
              <h2 className="text-base font-bold text-secondary-950" id="ai-search-title">
                Natural-Language Semantic Finder
              </h2>
            </div>
          </div>
          {aiMatches && (
            <button
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-primary-600 hover:bg-primary-50 focus:outline-none"
              onClick={clearAiSearch}
              type="button"
            >
              Reset AI filter
            </button>
          )}
        </div>

        <p className="text-xs text-secondary-500">
          Describe what you are looking for in your own words — our on-device NLP model ranks all programs by semantic fit.
        </p>

        <form className="mt-4 flex flex-col gap-2.5 sm:flex-row" onSubmit={runAiSearch}>
          <label className="sr-only" htmlFor="ai-search-input">Describe what you are looking for</label>
          <input
            className="min-w-0 flex-1 rounded-xl border border-secondary-200 px-4 py-2.5 text-sm text-secondary-950 outline-none transition placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:bg-secondary-50 shadow-inner"
            disabled={aiUnavailable}
            id="ai-search-input"
            onChange={(event) => setAiQuery(event.target.value)}
            placeholder="e.g. affordable STEM master programs in Europe with good job prospects..."
            type="text"
            value={aiQuery}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-primary-600 shadow-md shadow-primary-500/20 disabled:opacity-60"
            disabled={aiBusy || aiUnavailable || !aiQuery.trim()}
            type="submit"
          >
            {aiBusy ? 'Ranking…' : 'Find Matches'}
          </button>
        </form>

        {/* Query Suggestions */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-secondary-400 uppercase tracking-wider">Try:</span>
          {AI_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="rounded-full bg-secondary-100 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 border border-transparent px-3 py-1 text-xs font-semibold text-secondary-700 transition"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div aria-live="polite" className="mt-3 min-h-[1.25rem]">
          {aiStatus === 'loading-model' && (
            <p className="text-xs font-medium text-primary-700 animate-pulse">
              Loading on-device NLP model into browser cache…
            </p>
          )}
          {aiMatches && !aiBusy && (
            <p className="text-xs font-bold text-success-700 bg-success-50 border border-success-200 rounded-lg p-2">
              Ranked {aiMatches.length} program{aiMatches.length === 1 ? '' : 's'} by contextual relevance. Best matches appear first.
            </p>
          )}
        </div>

        {(aiError || aiUnavailable) && (
          <div className="mt-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-xs text-warning-800" role="alert">
            Smart search is temporarily offline{aiWorkerError || aiError ? ` (${aiWorkerError || aiError})` : ''}. Standard search and filters below are fully operational.
          </div>
        )}
      </section>

      {/* Featured Study Tracks & Destinations */}
      <section aria-labelledby="destinations-title" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Featured Study Tracks & Destinations</p>
            <h2 className="mt-0.5 text-xl font-bold text-secondary-950" id="destinations-title">Explore Tracks & Top Destinations</h2>
            <p className="mt-1 text-xs text-secondary-500">
              Quickly filter programs by discipline or country. Selecting a track syncs directly with the study track filter.
            </p>
          </div>
          {(track || country) && (
            <button
              className="text-xs font-bold text-primary-600 hover:underline self-start sm:self-auto"
              onClick={() => { setTrack(''); setCountry('') }}
              type="button"
            >
              Reset track & destination
            </button>
          )}
        </div>

        {/* Featured Study Track Chips (Quick Selection connected to dropdown) */}
        {result.studyTracks && result.studyTracks.length > 0 && (
          <div className="rounded-2xl border border-secondary-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-secondary-800">
                Featured Catalog Tracks
              </span>
              {track && (
                <span className="text-[11px] font-semibold text-primary-600">
                  Filtered by: <strong>{track}</strong>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2" data-testid="featured-track-chips">
              <button
                type="button"
                onClick={() => setTrack('')}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                  !track
                    ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                    : 'border-secondary-200 bg-secondary-50 text-secondary-700 hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                All tracks
              </button>
              {result.studyTracks.map((t) => (
                <button
                  key={t}
                  type="button"
                  data-testid={`track-chip-${t}`}
                  onClick={() => setTrack(track === t ? '' : t)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                    track === t
                      ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 hover:text-primary-700'
                  }`}
                  aria-pressed={track === t}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {result.featuredCountries.map((item) => (
            <button
              className={`group rounded-3xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                country === item.name
                  ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50/20'
                  : 'border-secondary-200/80 hover:border-primary-200'
              }`}
              key={item.id}
              onClick={() => setCountry(country === item.name ? '' : item.name)}
              type="button"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 border border-primary-200 text-sm font-black text-primary-600">
                  {item.code}
                </div>
                <span aria-hidden="true" className="text-xs font-bold text-secondary-400 group-hover:text-primary-600 transition">→</span>
              </div>
              <h3 className="mt-4 font-bold text-secondary-950 text-base group-hover:text-primary-600 transition">{item.name}</h3>
              <p className="mt-1 text-xs text-secondary-500 leading-relaxed">{item.description}</p>
              <p className="mt-3 text-xs font-extrabold text-primary-600">{item.programCount} programs</p>
            </button>
          ))}
        </div>
      </section>

      {/* Program Results List */}
      <section aria-labelledby="programs-title">
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
              {aiMatches ? 'Contextual Matches' : 'Available Degree Programs'}
            </p>
            <h2 className="mt-0.5 text-2xl font-black text-secondary-950" id="programs-title">
              {aiMatches ? 'Ranked Programs' : 'Programs Directory'}
            </h2>
            <p className="mt-1 text-xs text-secondary-500 font-medium">
              {loading ? 'Searching catalog…' : `${result.totalCount} programs available`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 sm:flex-row">
            <label htmlFor="track-filter" className="sr-only">Featured Study Track</label>
            <select
              className={`rounded-xl border border-secondary-200 bg-white px-3 py-2 text-xs font-semibold text-secondary-700 outline-none focus:border-primary-500 shadow-sm ${FOCUS}`}
              id="track-filter"
              data-testid="track-filter"
              onChange={(event) => setTrack(event.target.value)}
              value={track}
            >
              <option value="">All study tracks</option>
              {(result.studyTracks || []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <label htmlFor="country-filter" className="sr-only">Country</label>
            <select
              className={`rounded-xl border border-secondary-200 bg-white px-3 py-2 text-xs font-semibold text-secondary-700 outline-none focus:border-primary-500 shadow-sm ${FOCUS}`}
              id="country-filter"
              data-testid="country-filter"
              onChange={(event) => setCountry(event.target.value)}
              value={country}
            >
              <option value="">All countries</option>
              {result.countries.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>

            <label htmlFor="level-filter" className="sr-only">Degree level</label>
            <select
              className={`rounded-xl border border-secondary-200 bg-white px-3 py-2 text-xs font-semibold text-secondary-700 outline-none focus:border-primary-500 shadow-sm ${FOCUS}`}
              id="level-filter"
              data-testid="level-filter"
              onChange={(event) => setLevel(event.target.value)}
              value={level}
            >
              <option value="">All degree levels</option>
              {result.levels.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>

            {(query || country || level || track) && (
              <button
                type="button"
                data-testid="clear-all-filters-btn"
                onClick={clearFilters}
                className="rounded-xl border border-secondary-200 bg-white px-3 py-2 text-xs font-bold text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50 transition"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display Chips */}
        {(track || country || level || query) && (
          <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="active-filter-chips">
            <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Active filters:</span>
            {track && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-0.5 text-xs font-semibold text-primary-800">
                Track: {track}
                <button
                  type="button"
                  aria-label={`Remove track filter ${track}`}
                  onClick={() => setTrack('')}
                  className="hover:text-primary-950 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {country && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 border border-secondary-200 px-3 py-0.5 text-xs font-semibold text-secondary-800">
                Country: {country}
                <button
                  type="button"
                  aria-label={`Remove country filter ${country}`}
                  onClick={() => setCountry('')}
                  className="hover:text-secondary-950 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {level && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 border border-secondary-200 px-3 py-0.5 text-xs font-semibold text-secondary-800">
                Level: {level}
                <button
                  type="button"
                  aria-label={`Remove level filter ${level}`}
                  onClick={() => setLevel('')}
                  className="hover:text-secondary-950 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {query && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 border border-secondary-200 px-3 py-0.5 text-xs font-semibold text-secondary-800">
                Keyword: "{query}"
                <button
                  type="button"
                  aria-label={`Remove keyword filter ${query}`}
                  onClick={() => setQuery('')}
                  className="hover:text-secondary-950 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-primary-600 hover:underline ml-1"
            >
              Reset all
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs text-danger-700" role="alert">
            <span>{error}</span>
            <button className="font-bold underline" onClick={() => setReloadKey((key) => key + 1)} type="button">
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading programs">
            {[1, 2, 3, 4].map((item) => (
              <div className="h-60 animate-pulse rounded-3xl bg-secondary-200/60" key={item} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {displayedPrograms.map((item) => (
              <article
                className="group rounded-3xl border border-secondary-200/80 bg-white p-5 sm:p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl flex flex-col justify-between"
                key={item.id}
              >
                <div>
                  <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                        {item.country} · {item.city}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-secondary-950 group-hover:text-primary-600 transition break-words">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 text-xs font-semibold text-secondary-500">{item.university}</p>
                    </div>

                    <div className="flex flex-wrap shrink-0 items-center gap-2 self-start">
                      {typeof item.aiScore === 'number' && (
                        <span className="rounded-lg bg-primary-50 border border-primary-200 px-2.5 py-1 text-xs font-extrabold text-primary-700">
                          {Math.round(item.aiScore * 100)}% fit
                        </span>
                      )}
                      <span className="rounded-lg bg-secondary-100 px-2.5 py-1 text-xs font-bold text-secondary-700">
                        {item.matchScore}% match
                      </span>
                      <button
                        aria-label={`${item.isSaved ? 'Remove' : 'Add'} ${item.name} ${item.isSaved ? 'from' : 'to'} shortlist`}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition shadow-sm ${
                          item.isSaved
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-secondary-200 bg-white text-secondary-400 hover:border-primary-300 hover:text-primary-600'
                        }`}
                        disabled={savingIds.has(item.id)}
                        onClick={() => toggleSaved(item)}
                        type="button"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span className="rounded-lg bg-secondary-100/80 px-2.5 py-0.5 text-[11px] font-medium text-secondary-600" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 border-t border-secondary-100 pt-4 text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-secondary-400">Tuition</p>
                    <p className="mt-0.5 font-bold text-secondary-900">{formatTuition(item.annualTuitionUsd)}/yr</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-secondary-400">Duration</p>
                    <p className="mt-0.5 font-bold text-secondary-900">{formatDuration(item.durationMonths)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-secondary-400">Degree</p>
                    <p className="mt-0.5 font-bold text-secondary-900">{item.level}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-secondary-100 flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    data-testid={`view-details-${item.id}`}
                    onClick={() => setSelectedProgram(item)}
                    className={`inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-xl border border-secondary-200 bg-white hover:bg-secondary-50 px-3.5 py-2 text-xs font-bold text-secondary-700 hover:text-secondary-900 transition ${FOCUS}`}
                  >
                    <span>View Details</span>
                    <span aria-hidden="true">→</span>
                  </button>

                  {isProgramTracked(item.id) ? (
                    <button
                      type="button"
                      data-testid={`track-program-btn-${item.id}`}
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
                      data-testid={`track-program-btn-${item.id}`}
                      disabled={trackingIds.has(item.id)}
                      onClick={() => trackProgram(item)}
                      className={`inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm shadow-primary-500/20 transition disabled:opacity-60 ${FOCUS}`}
                    >
                      {trackingIds.has(item.id) ? (
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
              </article>
            ))}
          </div>
        )}

        {!loading && result.programs.length === 0 && (
          <div className="rounded-3xl border border-dashed border-secondary-300 bg-white px-6 py-14 text-center">
            <p className="font-bold text-secondary-950 text-base">No programs found</p>
            <p className="mt-1 text-xs text-secondary-500">Try adjusting your filters or search keywords.</p>
            <button className="mt-4 rounded-xl bg-primary-50 border border-primary-200 px-4 py-2 text-xs font-bold text-primary-700 hover:bg-primary-100" onClick={clearFilters} type="button">
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* Floating Shortlist Drawer Banner */}
      <aside className="flex flex-col gap-4 rounded-3xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-primary-50/50 p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm" aria-live="polite">
        <div>
          <p className="font-bold text-primary-950 text-sm">Your Shortlisted Programs</p>
          <p className="mt-0.5 text-xs text-secondary-600">
            {savedPrograms.length === 0 ? 'Save programs using the bookmark button to compare tuition and match criteria.' : `${savedPrograms.length} program${savedPrograms.length === 1 ? '' : 's'} saved for comparison.`}
          </p>
        </div>
        <button
          className="rounded-2xl bg-primary-500 hover:bg-primary-600 px-5 py-2.5 text-xs font-extrabold text-white transition shadow-md shadow-primary-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={savedPrograms.length === 0}
          onClick={() => setShowComparison(true)}
          type="button"
        >
          Compare Shortlist ({savedPrograms.length})
        </button>
      </aside>

      {/* Comparison Modal */}
      {showComparison && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-secondary-950/60 p-4 backdrop-blur-sm sm:items-center animate-fadeIn"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowComparison(false) }}
          role="presentation"
        >
          <section aria-labelledby="compare-title" aria-modal="true" className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-secondary-200" role="dialog">
            <div className="flex items-start justify-between gap-4 border-b border-secondary-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Side-by-Side Analysis</p>
                <h2 className="mt-1 text-2xl font-black text-secondary-950" id="compare-title">Compare Shortlisted Programs</h2>
              </div>
              <button
                aria-label="Close comparison"
                className="rounded-xl border border-secondary-200 p-2 text-secondary-500 hover:bg-secondary-50"
                onClick={() => setShowComparison(false)}
                type="button"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedPrograms.map((item) => (
                <article className="rounded-2xl border border-secondary-200 bg-surface p-5" key={item.id}>
                  <p className="text-xs font-bold uppercase text-primary-600">{item.country}</p>
                  <h3 className="mt-1.5 font-black text-secondary-950 text-base">{item.name}</h3>
                  <p className="mt-0.5 text-xs text-secondary-500 font-medium">{item.university}</p>
                  
                  <dl className="mt-4 space-y-2 text-xs border-t border-secondary-200/80 pt-3">
                    <div className="flex justify-between gap-4">
                      <dt className="text-secondary-500 font-medium">Tuition</dt>
                      <dd className="font-bold text-secondary-900">{formatTuition(item.annualTuitionUsd)}/yr</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-secondary-500 font-medium">Duration</dt>
                      <dd className="font-bold text-secondary-900">{formatDuration(item.durationMonths)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-secondary-500 font-medium">Academic Fit</dt>
                      <dd className="font-extrabold text-primary-600">{item.matchScore}%</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
      {/* Program Details Modal */}
      <ProgramDetailsModal
        isOpen={Boolean(selectedProgram)}
        onClose={() => setSelectedProgram(null)}
        program={selectedProgram}
        session={session}
        onToggleSave={toggleSaved}
        onTrackProgram={(id) => {
          setTrackedProgramIds((prev) => new Set(prev).add(id))
          setResult((curr) => ({
            ...curr,
            programs: curr.programs.map((p) => p.id === id ? { ...p, isTracked: true } : p),
          }))
          setToastMessage('Added to Application Tracker')
        }}
        onNavigate={onNavigate}
      />
      <Toast
        message={toastMessage}
        actionLabel={toastMessage.includes('Added') ? 'View Application Tracker' : undefined}
        onAction={() => onNavigate?.('Applications')}
      />
    </div>
  )
}
