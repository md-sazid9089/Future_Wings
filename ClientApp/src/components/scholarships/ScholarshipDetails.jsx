import { BTN_PRIMARY, BTN_QUIET, CARD, FOCUS } from '../ui/styles.js'
import { flag, money, date, getDeadlineStatus } from '../../lib/scholarshipUtils.js'

export default function ScholarshipDetails({
  scholarship,
  loading,
  error,
  onBack,
  onAddDeadline,
  addingDeadline,
  onExpressInterest,
  interestLoading,
  onToggleStep,
  togglingStepId,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6" data-testid="scholarship-details-loading">
        <div className="flex items-center gap-3">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-secondary-200" />
        </div>
        <div className={`${CARD} p-6 sm:p-8 space-y-4`}>
          <div className="h-5 w-28 animate-pulse rounded bg-secondary-200" />
          <div className="h-9 w-2/3 animate-pulse rounded bg-secondary-200" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-secondary-200" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="h-28 animate-pulse rounded-xl bg-secondary-100" />
            <div className="h-28 animate-pulse rounded-xl bg-secondary-100" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6" data-testid="scholarship-details-error">
        <button
          className={`${BTN_QUIET} ${FOCUS} inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900`}
          onClick={onBack}
          type="button"
          data-testid="back-to-scholarships"
        >
          <span aria-hidden="true">&larr;</span> Back to all scholarships
        </button>
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-6 text-danger-800" role="alert">
          <h2 className="text-base font-bold">Unable to load scholarship details</h2>
          <p className="mt-2 text-sm text-danger-700 leading-relaxed">{error}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {onRetry && (
              <button
                className="rounded-lg bg-danger-600 px-4 py-2 text-xs font-bold text-white hover:bg-danger-700 transition"
                onClick={onRetry}
                type="button"
              >
                Retry
              </button>
            )}
            <button
              className="rounded-lg border border-danger-300 bg-white px-4 py-2 text-xs font-bold text-danger-700 hover:bg-danger-50 transition"
              onClick={onBack}
              type="button"
            >
              Return to Scholarships
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!scholarship) {
    return (
      <div className="mx-auto max-w-5xl space-y-6" data-testid="scholarship-not-found">
        <button
          className={`${BTN_QUIET} ${FOCUS} inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900`}
          onClick={onBack}
          type="button"
          data-testid="back-to-scholarships"
        >
          <span aria-hidden="true">&larr;</span> Back to all scholarships
        </button>
        <section className={`${CARD} border-dashed px-6 py-14 text-center space-y-2`}>
          <p className="font-bold text-secondary-900 text-lg">Scholarship not found</p>
          <p className="text-sm text-secondary-500">The scholarship you requested could not be located.</p>
          <button className={`${BTN_PRIMARY} mt-4`} onClick={onBack} type="button">
            Back to Directory
          </button>
        </section>
      </div>
    )
  }

  const deadlineInfo = getDeadlineStatus(scholarship.deadline)
  const isInterested = Boolean(scholarship.isInterested || scholarship.interest)
  const steps = scholarship.interest?.steps || []
  const completedSteps = steps.filter((step) => step.isCompleted)
  const totalSteps = steps.length
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0
  const allStepsComplete = isInterested && totalSteps > 0 && completedSteps.length === totalSteps

  return (
    <div className="mx-auto max-w-7xl space-y-8" data-testid="scholarship-details-view">
      {/* Top back navigation and status row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          className={`${BTN_QUIET} ${FOCUS} inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700`}
          onClick={onBack}
          type="button"
          data-testid="back-to-scholarships"
        >
          <span aria-hidden="true">&larr;</span> Back to all scholarships
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {deadlineInfo.isExpired && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-danger-200 bg-danger-50 px-3 py-1 text-xs font-bold text-danger-700"
              data-testid="badge-deadline-passed"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-danger-500" aria-hidden="true" />
              Deadline passed
            </span>
          )}
          {deadlineInfo.isApproaching && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-warning-200 bg-warning-50 px-3 py-1 text-xs font-bold text-warning-700"
              data-testid="badge-deadline-approaching"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-warning-500" aria-hidden="true" />
              {deadlineInfo.label}
            </span>
          )}
          {isInterested && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700"
              data-testid="badge-already-interested"
            >
              &#10003; Interested
            </span>
          )}
        </div>
      </div>

      {/* Main hero card */}
      <header className={`${CARD} overflow-hidden p-4 sm:p-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-secondary-600">
              <span className="text-2xl" role="img" aria-label={scholarship.countryName}>
                {flag(scholarship.countryName)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                {scholarship.countryName}
              </span>
              {scholarship.countryCode && (
                <span className="rounded bg-secondary-100 px-1.5 py-0.5 text-xs font-mono font-bold text-secondary-600">
                  {scholarship.countryCode}
                </span>
              )}
            </div>

            <h1
              className="text-2xl font-black tracking-tight text-secondary-950 sm:text-3xl leading-snug"
              data-testid="scholarship-name"
            >
              {scholarship.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-success-50 border border-success-200/80 px-3.5 py-1 text-xs font-bold text-success-700">
                <span className="text-[11px] uppercase tracking-wider text-success-600">Award:</span>
                <span data-testid="scholarship-award">{money(scholarship.awardAmount)}</span>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${deadlineInfo.badgeClass}`}
              >
                <span className="text-[11px] uppercase tracking-wider">Deadline:</span>
                <span data-testid="scholarship-deadline">{date(scholarship.deadline)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons: Primary Orange actions */}
          <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-stretch lg:min-w-[230px] shrink-0">
            {/* I'm Interested CTA: Solid primary orange button */}
            <button
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition active:scale-[0.98] ${FOCUS} ${
                isInterested
                  ? 'border-2 border-success-500 bg-success-50 text-success-700 hover:bg-success-100'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              disabled={interestLoading}
              onClick={onExpressInterest}
              type="button"
              data-testid="im-interested-btn"
            >
              {interestLoading ? 'Updating process…' : isInterested ? 'Interested ✓' : "I'm Interested"}
            </button>

            {/* Add to Deadlines: Distinct outlined button with primary orange accent */}
            <button
              className={`w-full rounded-xl border-2 border-primary-500 bg-white px-4 py-3 text-sm font-bold text-primary-600 shadow-sm transition hover:bg-primary-50 active:scale-[0.98] disabled:border-secondary-200 disabled:text-secondary-400 disabled:bg-secondary-50 disabled:cursor-not-allowed disabled:shadow-none ${FOCUS}`}
              disabled={!scholarship.deadline || addingDeadline}
              onClick={onAddDeadline}
              type="button"
              data-testid="add-to-deadlines-btn"
            >
              {addingDeadline ? 'Adding to Deadlines…' : 'Add to Deadlines'}
            </button>

            {scholarship.officialLink && (
              <a
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline transition"
                href={scholarship.officialLink}
                rel="noopener noreferrer"
                target="_blank"
                data-testid="official-link-btn"
              >
                Official Website <span aria-hidden="true">&nearr;</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid: Details (Left 7 cols) + Process & Checklist (Right 5 cols) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column: Structured Scholarship Information */}
        <div className="space-y-6 lg:col-span-7">
          {/* Section: Award & Deadline Highlights */}
          <section className={`${CARD} p-6 space-y-4`} aria-labelledby="section-award-deadline">
            <h2 id="section-award-deadline" className="text-xs font-bold uppercase tracking-wider text-secondary-400">
              Award & Deadline
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-secondary-200 bg-secondary-50/60 p-4">
                <p className="text-xs font-semibold text-secondary-500">Award Amount</p>
                <p className="mt-1 text-2xl font-black text-success-700">{money(scholarship.awardAmount)}</p>
                <p className="mt-1 text-xs text-secondary-500">Direct academic grant / tuition funding</p>
              </div>
              <div className="rounded-xl border border-secondary-200 bg-secondary-50/60 p-4">
                <p className="text-xs font-semibold text-secondary-500">Application Deadline</p>
                <p className="mt-1 text-2xl font-black text-secondary-950">{date(scholarship.deadline)}</p>
                <p className="mt-1 text-xs text-secondary-500">
                  {deadlineInfo.isExpired
                    ? 'Submissions for this cycle are closed'
                    : deadlineInfo.isApproaching
                    ? 'Approaching deadline — submit soon'
                    : 'Standard international deadline'}
                </p>
              </div>
            </div>
          </section>

          {/* Section: Overview */}
          <section className={`${CARD} p-6`} aria-labelledby="section-overview">
            <h2 id="section-overview" className="text-xs font-bold uppercase tracking-wider text-secondary-400">
              Overview
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary-700 whitespace-pre-line" data-testid="scholarship-description">
              {scholarship.description || 'Not specified'}
            </p>

            {/* Scope metadata */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t border-secondary-100 pt-4">
              <div>
                <p className="text-xs font-semibold text-secondary-400">Study Level Restrictions</p>
                <p className="mt-1 text-sm font-bold text-secondary-900" data-testid="scholarship-study-level">
                  {scholarship.studyLevel || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary-400">Field of Study</p>
                <p className="mt-1 text-sm font-bold text-secondary-900" data-testid="scholarship-field">
                  {scholarship.fieldOfStudy || 'Not specified'}
                </p>
              </div>
            </div>
          </section>

          {/* Section: Eligibility Criteria */}
          <section className={`${CARD} p-6`} aria-labelledby="section-eligibility">
            <h2 id="section-eligibility" className="text-xs font-bold uppercase tracking-wider text-secondary-400">
              Eligibility Criteria
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary-700 whitespace-pre-line" data-testid="scholarship-eligibility">
              {scholarship.eligibilityCriteria || 'Not specified'}
            </p>
          </section>

          {/* Section: Required Documents */}
          <section className={`${CARD} p-6`} aria-labelledby="section-documents">
            <h2 id="section-documents" className="text-xs font-bold uppercase tracking-wider text-secondary-400">
              Required Documents
            </h2>
            <div className="mt-3 text-sm leading-relaxed text-secondary-700" data-testid="scholarship-documents">
              {scholarship.requiredDocuments ? (
                <ul className="list-inside list-disc space-y-1.5 text-secondary-700">
                  {scholarship.requiredDocuments.split(/,\s*/).map((doc, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {doc}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary-500">Not specified</p>
              )}
            </div>

            {/* Official link & instructions subtext */}
            <div className="mt-5 border-t border-secondary-100 pt-4" data-testid="scholarship-official-instructions">
              <p className="text-xs font-semibold text-secondary-400">Application Portal & Instructions</p>
              {scholarship.officialLink ? (
                <div className="mt-1 text-sm text-secondary-700">
                  <p>Complete your package directly through the official scholarship portal before the deadline:</p>
                  <a
                    className="mt-1.5 inline-flex items-center gap-1 font-bold text-primary-600 hover:text-primary-700 hover:underline break-all"
                    href={scholarship.officialLink}
                    rel="noopener noreferrer"
                    target="_blank"
                    data-testid="scholarship-official-link"
                  >
                    {scholarship.officialLink} <span aria-hidden="true">&nearr;</span>
                  </a>
                </div>
              ) : (
                <p className="mt-1 text-sm text-secondary-500">Not specified</p>
              )}
            </div>
          </section>
        </div>

        {/* Right column: Application Process Checklist */}
        <div className="space-y-6 lg:col-span-5">
          <section
            className={`${CARD} p-6 space-y-5 sticky top-6`}
            aria-labelledby="section-process"
            data-testid="scholarship-checklist-section"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="section-process" className="text-lg font-bold text-secondary-950">
                  Application Process
                </h2>
                <p className="text-xs text-secondary-500">Personalized preparation & submission tracker</p>
              </div>
              {isInterested && (
                <span
                  className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700 border border-primary-200/80"
                  data-testid="checklist-progress-pill"
                >
                  {completedSteps.length}/{totalSteps}
                </span>
              )}
            </div>

            {/* Accessible Progress Bar when interested */}
            {isInterested && totalSteps > 0 && (
              <div
                aria-label="Scholarship preparation progress"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progressPercent}
                className="space-y-2"
                data-testid="checklist-progress-bar-container"
                role="progressbar"
              >
                <div className="flex justify-between text-xs font-bold text-secondary-600">
                  <span>{progressPercent}% completed</span>
                  <span>
                    {completedSteps.length} of {totalSteps} milestones
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary-100">
                  <div
                    className="h-full bg-success-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                    data-testid="checklist-progress-bar"
                  />
                </div>
              </div>
            )}

            {/* All Steps Completed banner */}
            {allStepsComplete && (
              <div
                className="rounded-xl border border-success-200 bg-success-50 p-4 text-success-800 flex items-start gap-3"
                data-testid="all-steps-complete-banner"
              >
                <span className="text-xl leading-none" role="img" aria-label="Celebrate">
                  🎉
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-success-700">All Milestones Complete</p>
                  <p className="text-xs mt-0.5 text-success-600 leading-relaxed">
                    You have finished every milestone in this scholarship checklist. Keep tracking your application results!
                  </p>
                </div>
              </div>
            )}

            {/* Uninterested state: Clear Call to Action */}
            {!isInterested ? (
              <div
                className="rounded-xl border border-secondary-200 bg-secondary-50/70 p-6 text-center space-y-3"
                data-testid="checklist-uninterested-prompt"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-base font-bold text-secondary-900">Track your application progress</h3>
                <p className="text-xs text-secondary-600 leading-relaxed">
                  Click <strong>&ldquo;I&apos;m Interested&rdquo;</strong> to generate an ordered, scholarship-specific preparation checklist with deadline alerts and progress tracking.
                </p>
                <button
                  className={`${BTN_PRIMARY} mt-2 w-full`}
                  disabled={interestLoading}
                  onClick={onExpressInterest}
                  type="button"
                  data-testid="cta-im-interested-btn"
                >
                  {interestLoading ? 'Generating checklist…' : "I'm Interested"}
                </button>
              </div>
            ) : steps.length === 0 ? (
              <div className="p-6 text-center text-sm text-secondary-500" data-testid="checklist-empty">
                No checklist steps available for this scholarship.
              </div>
            ) : (
              /* Checklist Steps list */
              <div className="space-y-3" data-testid="checklist-steps-list">
                {steps.map((step) => {
                  const isToggling = togglingStepId === step.id
                  return (
                    <div
                      className={`rounded-xl border p-3.5 flex items-start gap-3 transition bg-white ${
                        step.isCompleted
                          ? 'border-success-200 bg-success-50/30'
                          : 'border-secondary-200/90 hover:border-secondary-300'
                      }`}
                      key={step.id}
                      data-testid={`checklist-step-item-${step.id}`}
                    >
                      <div className="pt-0.5">
                        <input
                          checked={step.isCompleted}
                          className="h-4 w-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
                          disabled={isToggling}
                          id={`step-check-${step.id}`}
                          onChange={() => onToggleStep(step)}
                          type="checkbox"
                          data-testid={`checkbox-step-${step.id}`}
                          aria-label={`Mark ${step.title} as ${step.isCompleted ? 'incomplete' : 'complete'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label
                          className={`text-sm font-semibold cursor-pointer select-none leading-snug block ${
                            step.isCompleted ? 'line-through text-secondary-400' : 'text-secondary-900'
                          }`}
                          htmlFor={`step-check-${step.id}`}
                          data-testid={`step-title-${step.id}`}
                        >
                          {step.stepOrder}. {step.title}
                        </label>
                        {step.description && (
                          <p className="mt-1 text-xs text-secondary-500 leading-relaxed" data-testid={`step-desc-${step.id}`}>
                            {step.description}
                          </p>
                        )}
                        {step.isCompleted && (
                          <p
                            className="mt-1.5 text-[11px] font-bold text-success-700"
                            data-testid={`step-completed-badge-${step.id}`}
                          >
                            &#10003; Completed
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
