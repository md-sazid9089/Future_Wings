import { useRef } from 'react'
import { ArrowRightIcon, SparkleIcon, CheckIcon } from './icons.jsx'
import { useScrollReveal } from '../../lib/useScrollAnimation.js'

export default function ClosingCta({ onSignUp, onSignIn }) {
  const containerRef = useRef(null)

  useScrollReveal(containerRef, {
    direction: 'up',
    distance: 24,
    duration: 0.8,
  })

  return (
    <section
      aria-labelledby="cta-title"
      className="relative bg-surface py-20 sm:py-28 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary-950 via-secondary-900 to-[#0e172a] px-5 py-12 sm:px-16 sm:py-20 text-center shadow-2xl shadow-secondary-950/20 border border-secondary-800"
        >
          {/* Luminous background gradients */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          />

          <div className="relative z-10 mx-auto max-w-3xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md border border-white/15">
              <SparkleIcon className="h-4 w-4 text-primary-400" />
              <span>Begin Your Academic Migration Today</span>
            </div>

            {/* Headline */}
            <h2
              className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-tight"
              id="cta-title"
            >
              Your next chapter starts with a better plan.
            </h2>

            {/* Description */}
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-secondary-300">
              Join thousands of international applicants mapping admissions, securing funded scholarships, and achieving 98.4% visa confidence with FutureWings.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition duration-200 hover:bg-primary-600 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                onClick={onSignUp}
                type="button"
              >
                <span>Create Free Account</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>

              <button
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-md transition duration-200 hover:bg-white/20 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={onSignIn}
                type="button"
              >
                <span>Sign in to Workspace</span>
              </button>
            </div>

            {/* Reassurance points */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-secondary-300">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-400" />
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-400" />
                <span>Instant profile evaluation</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-400" />
                <span>Free student tier included</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
