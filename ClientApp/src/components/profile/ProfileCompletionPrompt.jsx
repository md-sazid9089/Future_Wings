import { useEffect, useRef } from 'react'
import { BTN_PRIMARY, CARD, FOCUS } from '../ui/styles.js'
import { CORE_ACADEMIC_FIELDS } from '../../lib/profileCompletion.js'

export default function ProfileCompletionPrompt({
  profileCompletion,
  onComplete,
  onSkip,
}) {
  const modalRef = useRef(null)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onSkip?.()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onSkip])

  const { completedCount, totalRequired, completionPercent, fieldStatus } = profileCompletion

  return (
    <div
      aria-labelledby="profile-prompt-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-secondary-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      data-testid="profile-completion-prompt-modal"
    >
      <div
        className={`${CARD} relative w-full max-w-lg max-h-[92vh] overflow-y-auto border-secondary-200/90 p-4 sm:p-8 shadow-2xl space-y-6`}
        ref={modalRef}
      >
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl" />

        {/* Badge & Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-warning-200 bg-warning-50 px-3 py-0.5 text-xs font-bold text-warning-800">
            <span className="h-1.5 w-1.5 rounded-full bg-warning-500 animate-pulse" />
            Academic Profile Required
          </div>
          <h2
            className="text-xl sm:text-2xl font-black tracking-tight text-secondary-950"
            id="profile-prompt-title"
          >
            Complete Your Academic Profile
          </h2>
          <p className="text-xs sm:text-sm text-secondary-600 leading-relaxed">
            Complete your academic profile to unlock personalized recommendations, scholarship matches, and your application roadmap.
          </p>
        </div>

        {/* Progress bar */}
        <div
          aria-label="Academic profile completion progress"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={completionPercent}
          className="space-y-2 rounded-2xl border border-secondary-100 bg-secondary-50/70 p-4"
          role="progressbar"
          data-testid="profile-prompt-progress"
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-secondary-700">
              {completedCount} of {totalRequired} core fields completed
            </span>
            <span className="text-primary-600 font-extrabold">{completionPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-200/80">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
              data-testid="profile-prompt-progress-bar"
            />
          </div>
        </div>

        {/* 4 Core Fields Checklist */}
        <div className="space-y-2" data-testid="profile-prompt-fields-list">
          <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-400">
            Required Core Fields
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {CORE_ACADEMIC_FIELDS.map((field) => {
              const isFilled = fieldStatus[field.key]
              return (
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 transition ${
                    isFilled
                      ? 'border-success-200 bg-success-50/40 text-success-900'
                      : 'border-secondary-200/80 bg-white text-secondary-700'
                  }`}
                  key={field.key}
                  data-testid={`prompt-field-${field.key}`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                      isFilled
                        ? 'bg-success-500 text-white'
                        : 'border border-secondary-300 bg-secondary-100 text-secondary-400'
                    }`}
                    aria-hidden="true"
                  >
                    {isFilled ? '✓' : '•'}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${isFilled ? 'text-success-800' : 'text-secondary-800'}`}>
                      {field.label}
                    </p>
                    <p className="text-[10px] text-secondary-400 truncate">
                      {isFilled ? 'Configured' : 'Missing'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-secondary-100">
          <button
            className={`w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-secondary-500 hover:text-secondary-800 transition ${FOCUS}`}
            onClick={onSkip}
            type="button"
            data-testid="profile-prompt-skip-btn"
          >
            Skip for Now
          </button>
          <button
            className={`${BTN_PRIMARY} w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold`}
            onClick={onComplete}
            type="button"
            data-testid="profile-prompt-complete-btn"
          >
            Complete Profile Now <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
