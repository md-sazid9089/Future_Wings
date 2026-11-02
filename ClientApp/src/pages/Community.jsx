import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import ReviewCard from '../components/community/ReviewCard.jsx'
import { BTN_PRIMARY, BTN_QUIET, CARD, CONTROL } from '../components/ui/styles.js'

const emptyDiscovery = { programs: [] }

const _initials = (name) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'FW'

const ratingText = (score) => `${score}/5`

const averageScore = (reviews) => {
  if (reviews.length === 0) return null
  const total = reviews.reduce((sum, item) => sum + item.score, 0)
  return Math.round((total / reviews.length) * 10) / 10
}

export default function Community({ session, onNavigate }) {
  const [universities, setUniversities] = useState([])
  const [selectedUniversityId, setSelectedUniversityId] = useState('')
  const [reviews, setReviews] = useState([])
  const [query, setQuery] = useState('')
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const selectedUniversity = universities.find((item) => String(item.id) === String(selectedUniversityId))
  const average = averageScore(reviews)

  const loadCatalog = useCallback(async (signal) => {
    setLoadingCatalog(true)
    setError('')
    try {
      const discovery = await apiRequest('/discovery', { token: session.token, signal })
      const byUniversity = new Map()
      ;(discovery ?? emptyDiscovery).programs.forEach((program) => {
        if (!program.universityId || byUniversity.has(program.universityId)) return
        byUniversity.set(program.universityId, {
          id: program.universityId,
          name: program.university,
          city: program.city,
          country: program.country,
          countryCode: program.countryCode,
        })
      })
      const nextUniversities = [...byUniversity.values()]
        .sort((a, b) => a.name.localeCompare(b.name))
      setUniversities(nextUniversities)
      setSelectedUniversityId((current) => current || String(nextUniversities[0]?.id ?? ''))
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message)
    } finally {
      if (!signal.aborted) setLoadingCatalog(false)
    }
  }, [session.token])

  const loadReviews = useCallback(async (universityId, signal) => {
    if (!universityId) {
      setReviews([])
      return
    }
    setLoadingReviews(true)
    setError('')
    try {
      const data = await apiRequest(`/review/university/${universityId}`, { token: session.token, signal })
      setReviews(data)
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message)
    } finally {
      if (!signal.aborted) setLoadingReviews(false)
    }
  }, [session.token])

  useEffect(() => {
    const controller = new AbortController()
    loadCatalog(controller.signal)
    return () => controller.abort()
  }, [loadCatalog])

  useEffect(() => {
    const controller = new AbortController()
    loadReviews(selectedUniversityId, controller.signal)
    return () => controller.abort()
  }, [loadReviews, selectedUniversityId])

  const filteredUniversities = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return universities
    return universities.filter((item) =>
      item.name.toLowerCase().includes(term) ||
      item.city.toLowerCase().includes(term) ||
      item.country.toLowerCase().includes(term))
  }, [query, universities])

  const submitReview = async (event) => {
    event.preventDefault()
    if (!selectedUniversityId || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const created = await apiRequest('/review', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({
          universityId: Number(selectedUniversityId),
          score,
          comment,
        }),
      })
      setReviews((current) => [created, ...current.filter((item) => item.id !== created.id)])
      setComment('')
      setScore(5)
      setToast(`Review added for ${created.universityName}.`)
      window.setTimeout(() => setToast(''), 3500)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-secondary-950 via-secondary-800 to-primary-600 px-6 py-9 text-white sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-100">Student community</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Read and share university reviews.</h1>
        <p className="mt-3 max-w-2xl text-secondary-100">
          Compare real student impressions by university, then leave your own rating to help the next applicant.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_260px]">
          <label className="sr-only" htmlFor="community-search">Search universities</label>
          <input
            className={`${CONTROL} w-full`}
            id="community-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search university, city, or country"
            type="search"
            value={query}
          />
          <button className={`${BTN_QUIET} bg-white/95`} onClick={() => onNavigate('Discovery')} type="button">
            Explore Programs
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className={`${CARD} p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-secondary-400">Universities</p>
              <p className="mt-1 text-sm text-secondary-500">
                {loadingCatalog ? 'Loading catalog...' : `${filteredUniversities.length} option${filteredUniversities.length === 1 ? '' : 's'}`}
              </p>
            </div>
            {query && (
              <button className={BTN_QUIET} onClick={() => setQuery('')} type="button">
                Clear
              </button>
            )}
          </div>

          <div className="mt-4 max-h-[620px] space-y-2 overflow-auto pr-1">
            {loadingCatalog ? [1, 2, 3, 4, 5].map((item) => (
              <div className="h-20 animate-pulse rounded-lg bg-secondary-100" key={item} />
            )) : filteredUniversities.length === 0 ? (
              <div className="rounded-lg border border-dashed border-secondary-300 px-4 py-8 text-center text-sm text-secondary-500">
                No universities match your search.
              </div>
            ) : filteredUniversities.map((university) => {
              const active = String(university.id) === String(selectedUniversityId)
              return (
                <button
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    active
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                      : 'border-secondary-200 bg-white hover:border-primary-200 hover:bg-primary-50/40'
                  }`}
                  key={university.id}
                  onClick={() => setSelectedUniversityId(String(university.id))}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-secondary-950">{university.name}</h2>
                      <p className="mt-1 text-sm text-secondary-500">{university.city}, {university.country}</p>
                    </div>
                    <span className="rounded-md bg-secondary-100 px-2 py-1 text-xs font-bold text-secondary-600">
                      {university.countryCode}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className={`${CARD} p-5`}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Selected university</p>
                <h2 className="mt-1 text-2xl font-bold text-secondary-950">
                  {selectedUniversity?.name ?? 'Choose a university'}
                </h2>
                {selectedUniversity && (
                  <p className="mt-1 text-sm text-secondary-500">
                    {selectedUniversity.city}, {selectedUniversity.country}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-64">
                <Stat label="Average rating" value={average == null ? '-' : ratingText(average)} />
                <Stat label="Reviews" value={reviews.length} />
              </div>
            </div>
          </section>

          <section className={`${CARD} p-5`}>
            <h2 className="text-lg font-bold text-secondary-950">Add your review</h2>
            <form className="mt-4 space-y-4" onSubmit={submitReview}>
              <div>
                <p className="text-sm font-semibold text-secondary-700">Rating</p>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      aria-checked={score === value}
                      className={`min-h-[44px] min-w-[44px] rounded-lg border px-4 text-sm font-bold transition ${
                        score === value
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-secondary-200 bg-white text-secondary-600 hover:border-primary-300'
                      }`}
                      key={value}
                      onClick={() => setScore(value)}
                      role="radio"
                      type="button"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-secondary-700" htmlFor="review-comment">
                  Comment
                </label>
                <textarea
                  className={`${CONTROL} mt-2 min-h-28 w-full resize-y`}
                  id="review-comment"
                  maxLength={1000}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share what students should know about academics, support, location, or campus life."
                  value={comment}
                />
                <p className="mt-1 text-xs text-secondary-400">{comment.length}/1000</p>
              </div>

              <button className={`${BTN_PRIMARY} w-full sm:w-auto min-h-[44px]`} disabled={!selectedUniversityId || submitting} type="submit">
                {submitting ? 'Publishing...' : 'Publish Review'}
              </button>
            </form>
          </section>

          <section className={`${CARD} p-5`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-secondary-400">Community feedback</p>
                <h2 className="mt-1 text-lg font-bold text-secondary-950">Student reviews</h2>
              </div>
              <button
                className={BTN_QUIET}
                disabled={!selectedUniversityId || loadingReviews}
                onClick={() => loadReviews(selectedUniversityId, new AbortController().signal)}
                type="button"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {loadingReviews ? [1, 2, 3].map((item) => (
                <div className="h-28 animate-pulse rounded-lg bg-secondary-100" key={item} />
              )) : reviews.length === 0 ? (
                <div className="rounded-lg border border-dashed border-secondary-300 px-5 py-10 text-center">
                  <p className="font-bold text-secondary-900">No reviews yet</p>
                  <p className="mt-1 text-sm text-secondary-500">Be the first to review this university.</p>
                </div>
              ) : reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </section>
        </main>
      </div>

      <Toast message={toast} />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-secondary-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-secondary-950">{value}</p>
    </div>
  )
}
