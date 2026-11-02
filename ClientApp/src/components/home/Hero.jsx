import {
  BadgeCheckIcon,
  GlobeIcon,
  ScholarshipIcon,
  SparkleIcon,
  StarFilledIcon,
} from './icons.jsx'
import { useParallaxFloat, useScrollReveal } from '../../lib/useScrollAnimation.js'

export default function Hero({ onGetRecommendations, onExploreCountries }) {
  const containerRef = useScrollReveal({ direction: 'up', distance: 24, duration: 0.85 })
  const floatCard1Ref = useParallaxFloat({ yDistance: 7, duration: 3.2, delay: 0.1 })
  const floatCard2Ref = useParallaxFloat({ yDistance: 6, duration: 3.8, delay: 0.4 })
  const floatCard3Ref = useParallaxFloat({ yDistance: 8, duration: 3.5, delay: 0.2 })
  const floatCard4Ref = useParallaxFloat({ yDistance: 5, duration: 4.0, delay: 0.5 })

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-surface pt-8 pb-20 sm:pt-14 sm:pb-32"
      id="home"
      ref={containerRef}
    >
      {/* Subtle Background Glow Spheres */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-24 h-[450px] w-[450px] rounded-full bg-primary-500/10 blur-3xl animate-pulse-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-16 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-96 h-72 w-[650px] rounded-full bg-sky-400/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main Headline & Subtitle */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-white/90 px-4 py-1.5 text-xs font-bold text-primary-700 shadow-xs backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-ping" />
            <span>AI-Driven Study Abroad Intelligence</span>
          </div>

          <h1
            className="mt-6 text-4xl font-black leading-tight tracking-tight text-secondary-950 sm:text-5xl lg:text-6xl"
            id="hero-title"
          >
            Your smarter path to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-600 to-amber-500">
              studying abroad.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary-600 sm:text-lg">
            Discover the right universities, plan every deadline, understand visa readiness, and move
            forward with confidence.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <button
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-primary-500/25 transition hover:shadow-xl hover:shadow-primary-500/35 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:w-auto"
              onClick={onGetRecommendations}
              type="button"
            >
              <SparkleIcon className="h-4 w-4" />
              <span>Get matched now</span>
            </button>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-secondary-200 bg-white px-8 py-3.5 text-sm font-bold text-secondary-800 shadow-xs transition hover:border-primary-300 hover:bg-primary-50/40 hover:text-primary-700 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:w-auto"
              onClick={onExploreCountries}
              type="button"
            >
              <GlobeIcon className="h-4 w-4 text-secondary-500" />
              <span>Explore destinations</span>
            </button>
          </div>

          {/* Trust Value Proof Strip */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-secondary-500 sm:gap-6">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheckIcon className="h-4 w-4 text-success-600" />
              Free on-device AI privacy
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheckIcon className="h-4 w-4 text-success-600" />
              1,200+ partner universities
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheckIcon className="h-4 w-4 text-success-600" />
              No credit card required
            </span>
          </div>
        </div>

        {/* Hero Product Visual Mockup */}
        <div className="relative mt-14 sm:mt-20">
          {/* Main Workspace Frame */}
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-secondary-200/90 bg-white/95 p-4 shadow-2xl shadow-secondary-900/10 backdrop-blur-xl sm:p-7">
            {/* Window Title Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary-100 pb-4 mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-3 w-3 rounded-full bg-rose-400/80 shrink-0" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80 shrink-0" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80 shrink-0" />
                <span className="ml-2 truncate text-xs font-bold text-secondary-400 font-mono max-w-[140px] min-[400px]:max-w-none">
                  futurewings.io/workspace/student
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-200 px-2.5 py-0.5 text-[11px] font-bold text-primary-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
                  Alex Morgan · Pro Workspace
                </span>
              </div>
            </div>

            {/* Inner Dashboard Layout Preview */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Application Tracking Card */}
              <div className="sm:col-span-2 rounded-2xl border border-secondary-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-400">
                      Target Institution
                    </span>
                    <h3 className="text-base font-extrabold text-secondary-950">University of Toronto</h3>
                    <p className="text-xs text-secondary-500">MSc in Computer Science · Fall 2027</p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    Application Ready
                  </span>
                </div>

                {/* Milestone Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-secondary-700 mb-1">
                    <span>Admissions Checklist Progress</span>
                    <span className="text-primary-600 font-bold">4 of 5 Completed (80%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-200/60">
                    <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-500" />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-secondary-600">
                  <span className="inline-flex items-center gap-1 bg-white border border-secondary-200/80 px-2 py-0.5 rounded-md">
                    ✓ SOP Polish Done
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-secondary-200/80 px-2 py-0.5 rounded-md">
                    ✓ 3 LORs Uploaded
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-secondary-200/80 px-2 py-0.5 rounded-md">
                    ✓ IELTS 7.5 Verified
                  </span>
                </div>
              </div>

              {/* Visa Readiness Gauge Card */}
              <div className="rounded-2xl border border-secondary-100 bg-white p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-400">
                    Pre-Flight Evaluation
                  </span>
                  <h4 className="mt-1 text-sm font-extrabold text-secondary-950">Visa Readiness</h4>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-emerald-600 font-mono">88</span>
                    <span className="text-xs text-secondary-400 font-bold">/ 100</span>
                    <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                      Low Risk
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-secondary-500 leading-snug">
                    Funding proof ($35,000 liquid) and strong family ties verified for Canadian embassy standards.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-secondary-100 text-[11px] font-bold text-primary-600">
                  Assessment Action Plan Ready →
                </div>
              </div>
            </div>
          </div>

          {/* Floating Callout Card 4: Verified Student Rating (Top Left) */}
          <div
            className="hidden lg:block absolute -top-6 -left-6 lg:-left-12 z-20 rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl shadow-secondary-900/10 backdrop-blur-md max-w-xs transition-transform"
            ref={floatCard4Ref}
          >
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                <StarFilledIcon className="h-3.5 w-3.5" />
                <StarFilledIcon className="h-3.5 w-3.5" />
                <StarFilledIcon className="h-3.5 w-3.5" />
                <StarFilledIcon className="h-3.5 w-3.5" />
                <StarFilledIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-secondary-900">4.9 / 5.0</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-secondary-500">
              Trusted by 12,000+ applicants
            </p>
          </div>

          {/* Floating Callout Card 1: University Fit (Top Right) */}
          <div
            className="hidden sm:block absolute -top-8 -right-6 lg:-right-10 z-20 rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl shadow-secondary-900/10 backdrop-blur-md max-w-xs transition-transform"
            ref={floatCard1Ref}
          >
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 font-black text-xs">
                98%
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                  Top Fit Match
                </span>
                <p className="text-xs font-bold text-secondary-950">University of Toronto</p>
                <p className="text-[11px] text-secondary-500">CAD $24,500/yr · 3-Yr PGWP</p>
              </div>
            </div>
          </div>

          {/* Floating Callout Card 2: Scholarship Deadline (Bottom Left) */}
          <div
            className="hidden sm:block absolute -bottom-6 -left-6 lg:-left-10 z-20 rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl shadow-secondary-900/10 backdrop-blur-md max-w-xs transition-transform"
            ref={floatCard2Ref}
          >
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ScholarshipIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Scholarship Deadline
                </span>
                <p className="text-xs font-bold text-secondary-950">Vanier Canada Graduate Award</p>
                <p className="text-[11px] font-semibold text-emerald-600">$50,000/yr · Due in 14 days</p>
              </div>
            </div>
          </div>

          {/* Floating Callout Card 3: AI Interview Score (Bottom Right) */}
          <div
            className="hidden md:block absolute -bottom-8 right-12 z-20 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl shadow-secondary-900/10 backdrop-blur-md transition-transform"
            ref={floatCard3Ref}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-secondary-800">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Mock Interview Feedback: Band 8.0</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
