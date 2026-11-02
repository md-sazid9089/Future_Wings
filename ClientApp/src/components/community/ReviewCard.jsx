import { sanitizeReviewText } from '../../lib/sanitizeText.js'

const initials = (name) => (name || '')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'FW'

const ratingText = (score) => `${score}/5`

export default function ReviewCard({ review }) {
  if (!review) return null

  const cleanComment = sanitizeReviewText(review.comment)

  return (
    <article className="rounded-lg border border-secondary-200 bg-white p-4" data-testid="review-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
          {initials(review.reviewerName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-secondary-950 break-words">{review.reviewerName}</h3>
            {review.isMine && (
              <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-bold text-success-700">
                Your review
              </span>
            )}
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700">
              {ratingText(review.score)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-secondary-600 whitespace-pre-line break-words" data-testid="review-comment">
            {cleanComment || 'No written comment provided.'}
          </p>
        </div>
      </div>
    </article>
  )
}
