import { useEffect, useState } from 'react'
import { BTN_QUIET, FOCUS } from '../ui/styles.js'
import { AlertIcon, CheckIcon, SpinnerIcon, TrashIcon } from './icons.jsx'

const categoryTone = {
  Application: 'bg-accent-50 text-accent-600',
  Scholarship: 'bg-success-50 text-success-700',
  Visa: 'bg-primary-50 text-primary-600',
  Exam: 'bg-warning-50 text-warning-700',
  Document: 'bg-secondary-100 text-secondary-600',
  Other: 'bg-secondary-100 text-secondary-600',
}

/**
 * One deadline.
 *
 * Overdue is signalled three ways — a left border accent, a warning icon, and an
 * "Overdue" badge — so the state never depends on color alone.
 *
 * `pending` disables both controls while this row's own mutation is in flight, which
 * is what stops a double-click from firing two DELETEs (the second 404s and used to
 * surface a false error even though the delete had succeeded).
 */
export default function DeadlineRow({ deadline, now, pending, justAdded, onDelete, onToggle }) {
  const [confirming, setConfirming] = useState(false)
  const [entered, setEntered] = useState(!justAdded)

  const due = new Date(deadline.dueAt)
  const overdue = !deadline.isCompleted && due.getTime() < now
  const { title, isCompleted, category, notes } = deadline

  // The one deliberate motion moment: a freshly created row settles into place.
  useEffect(() => {
    if (justAdded) requestAnimationFrame(() => setEntered(true))
  }, [justAdded])

  // Escape backs out of the confirm step.
  useEffect(() => {
    if (!confirming) return undefined
    const onKeyDown = (event) => event.key === 'Escape' && setConfirming(false)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [confirming])

  return (
    <article
      className={`flex gap-3 sm:gap-4 border-l-2 px-3.5 sm:px-5 py-4 transition-all duration-300 ${
        overdue ? 'border-danger-500 bg-danger-50/40' : 'border-transparent'
      } ${pending ? 'opacity-60' : ''} ${entered ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}
    >
      {/* The visual control stays 20px; the padding (cancelled by the negative margin,
          so layout is unchanged) grows the touch target to 44px. */}
      <button
        aria-label={`${isCompleted ? 'Reopen' : 'Complete'} “${title}”`}
        className={`-m-3 mt-0.5 flex shrink-0 self-start rounded-full p-3 transition disabled:cursor-not-allowed ${FOCUS}`}
        disabled={pending}
        onClick={() => onToggle(deadline)}
        type="button"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
            isCompleted
              ? 'border-success-500 bg-success-500 text-white'
              : 'border-secondary-300'
          }`}
        >
          {pending ? <SpinnerIcon className="h-3 w-3 text-secondary-500" /> : isCompleted ? <CheckIcon /> : null}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`font-semibold break-words ${
              isCompleted ? 'text-secondary-400 line-through' : 'text-secondary-950'
            }`}
          >
            {title}
          </h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              categoryTone[category] ?? categoryTone.Other
            }`}
          >
            {category}
          </span>
          {overdue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger-100 px-2 py-0.5 text-[11px] font-bold text-danger-700">
              <AlertIcon className="h-3 w-3" />
              Overdue
            </span>
          )}
        </div>

        <p className={`mt-1 text-sm font-medium ${overdue ? 'text-danger-600' : 'text-secondary-500'}`}>
          {due.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </p>

        {notes && <p className="mt-2 text-sm leading-6 text-secondary-600 break-words">{notes}</p>}
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-1 self-start">
          <span className="mr-1 text-xs font-medium text-secondary-500">Delete?</span>
          <button
            aria-label={`Confirm deletion of “${title}”`}
            className={`inline-flex min-h-11 items-center rounded-lg bg-danger-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-danger-600 disabled:opacity-50 sm:min-h-8 ${FOCUS}`}
            disabled={pending}
            onClick={() => onDelete(deadline)}
            type="button"
          >
            {pending ? <SpinnerIcon className="h-3.5 w-3.5" /> : 'Yes'}
          </button>
          <button
            aria-label={`Keep “${title}”`}
            className={BTN_QUIET}
            disabled={pending}
            onClick={() => setConfirming(false)}
            type="button"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          aria-label={`Delete “${title}”`}
          className={`${BTN_QUIET} shrink-0 self-start hover:bg-danger-50 hover:text-danger-600`}
          disabled={pending}
          onClick={() => setConfirming(true)}
          type="button"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Delete
        </button>
      )}
    </article>
  )
}
