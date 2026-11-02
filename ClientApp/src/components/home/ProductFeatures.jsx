import { BadgeCheckIcon, BotIcon } from './icons.jsx'
import { useScrollReveal } from '../../lib/useScrollAnimation.js'

const features = [
  {
    id: 'recommendations',
    eyebrow: 'Algorithmic Precision',
    title: 'AI-Powered University Matching Tailored to Your Profile',
    description:
      'Stop guessing your odds. Our matching algorithm computes quantitative fit scores using your CGPA, target major, and budget to group institutions into Reach, Target, and Safety tiers.',
    bullets: [
      'Multi-variable profile analysis across academic history and financial readiness',
      'Dynamic match percentages updated in real-time as your credentials evolve',
      'Direct shortlisting to your personal study dashboard with a single click',
    ],
    badgeColor: 'bg-primary-50 text-primary-700 border-primary-200',
    mockup: (
      <div className="rounded-2xl border border-secondary-200/90 bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-secondary-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600 font-extrabold text-xs">
              95%
            </span>
            <div>
              <p className="text-xs font-bold text-secondary-950">Technical University of Munich</p>
              <p className="text-[11px] text-secondary-500">MSc Informatics · Germany</p>
            </div>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            High Probability
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl bg-secondary-50 p-2">
            <span className="block text-[10px] font-bold text-secondary-400">Tuition</span>
            <span className="font-extrabold text-secondary-900">€0 / yr</span>
          </div>
          <div className="rounded-xl bg-secondary-50 p-2">
            <span className="block text-[10px] font-bold text-secondary-400">Min. CGPA</span>
            <span className="font-extrabold text-secondary-900">3.5 / 4.0</span>
          </div>
          <div className="rounded-xl bg-secondary-50 p-2">
            <span className="block text-[10px] font-bold text-secondary-400">Post-Study Visa</span>
            <span className="font-extrabold text-secondary-900">18 Months</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'discovery',
    eyebrow: 'Transparent Exploration',
    title: 'Comprehensive Global Program Discovery & Comparison',
    description:
      'Search across 1,200+ degree programs with faceted filters for tuition ceilings, destination countries, degree levels, and language requirements.',
    bullets: [
      'Side-by-side comparison of annual tuition and living expenses in USD or local currency',
      'On-device semantic search understanding natural queries like "Affordable STEM in Canada"',
      'Instant breakdown of post-study work permits (OPT, PGWP, and Graduate Route)',
    ],
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    mockup: (
      <div className="rounded-2xl border border-secondary-200/90 bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-secondary-700">
          <span>Catalog Comparison</span>
          <span className="text-indigo-600">3 Programs Selected</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-secondary-100 p-2.5 bg-slate-50">
            <div>
              <p className="font-bold text-secondary-950">University of British Columbia</p>
              <p className="text-[10px] text-secondary-500">MSc Data Science · Canada</p>
            </div>
            <span className="font-mono font-bold text-secondary-800">$22,400/yr</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-secondary-100 p-2.5 bg-white">
            <div>
              <p className="font-bold text-secondary-950">University of Edinburgh</p>
              <p className="text-[10px] text-secondary-500">MSc Artificial Intelligence · UK</p>
            </div>
            <span className="font-mono font-bold text-secondary-800">£31,200/yr</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'tracking',
    eyebrow: 'Admissions Workspace',
    title: 'Unified Application Tracking with Synchronized Deadlines',
    description:
      'Manage multiple university submissions without dropped steps. Move applications through structured lifecycle states while automated calendar alerts keep deadlines front and center.',
    bullets: [
      'Status stages: Draft, Submitted, Under Review, Accepted, and Visa Stage',
      'Integrated countdown timers for admissions, language score transmissions, and scholarship cutoffs',
      'Instant completion toggles that calculate your personal milestone completion percentage',
    ],
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    mockup: (
      <div className="rounded-2xl border border-secondary-200/90 bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold text-secondary-950">Active Milestones</span>
          <span className="rounded bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">
            2 Due This Week
          </span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                ✓
              </span>
              <span className="font-semibold text-secondary-800 line-through truncate">IELTS TRF Transmission</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 shrink-0">Completed</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-4 w-4 shrink-0 rounded-full border border-amber-400 text-transparent" />
              <span className="font-bold text-secondary-950 truncate">Official Sealed Transcripts</span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 shrink-0">Due Nov 23</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'visa',
    eyebrow: 'Risk Mitigation',
    title: 'Predictive 4-Factor Visa Readiness Scoring & Assessment',
    description:
      'Never walk into an embassy appointment unprepared. Our audit algorithm assesses financial adequacy, home-country economic ties, language certifications, and prior filing histories.',
    bullets: [
      'Comprehensive risk categorization: Low, Moderate, or High risk with transparent scoring',
      'Actionable recommendations explaining exactly what additional proof to prepare before filing',
      'Pre-departure financial guarantee calculations customized to destination country cost benchmarks',
    ],
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    mockup: (
      <div className="rounded-2xl border border-secondary-200/90 bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-secondary-100 pb-3 mb-3">
          <span className="text-xs font-extrabold text-secondary-950">Embassy Readiness Audit</span>
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
            Low Risk (Score 88/100)
          </span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-secondary-600">
            <span>Liquid Funds Adequacy:</span>
            <span className="font-bold text-emerald-600">$35,000 / $25,000 req (✓ Strong)</span>
          </div>
          <div className="flex justify-between text-secondary-600">
            <span>Ties to Home Country:</span>
            <span className="font-bold text-secondary-900">80 / 100 (✓ Stable)</span>
          </div>
          <div className="flex justify-between text-secondary-600">
            <span>Language Requirement:</span>
            <span className="font-bold text-emerald-600">IELTS 7.5 (Exceeds baseline)</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'interview',
    eyebrow: 'AI Mock Coaching',
    title: 'Private On-Device AI Interview Simulator & Rubric Scoring',
    description:
      'Build confidence for university admissions interviews and embassy visa officer dialogues with realistic scenario questions and instant feedback.',
    bullets: [
      'Tailored question sets for F-1 visa ties, academic rationale, and funding justification',
      'Real-time text-to-speech audio delivery and automated rubric evaluation',
      'Strict local execution ensuring your private practice answers never leave your browser',
    ],
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    mockup: (
      <div className="rounded-2xl border border-secondary-200/90 bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-secondary-100 pb-2 mb-3">
          <span className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
            <BotIcon className="h-4 w-4" />
            AI Visa Interview Simulator
          </span>
          <span className="text-[10px] font-mono text-secondary-400">Question 3 of 5</span>
        </div>
        <p className="text-xs font-bold text-secondary-900 leading-snug">
          “Why did you select this specific master’s degree instead of continuing your studies in your home country?”
        </p>
        <div className="mt-3 rounded-xl bg-purple-50/60 border border-purple-200 p-2.5 text-[11px] text-purple-950 font-medium">
          💡 Rubric Tip: Emphasize specialized labs, curriculum depth, and exact post-degree career trajectories back home.
        </div>
      </div>
    ),
  },
]

export default function ProductFeatures() {
  const containerRef = useScrollReveal({ direction: 'up', distance: 28 })

  return (
    <section
      aria-labelledby="features-title"
      className="bg-white py-20 sm:py-28 relative"
      id="product"
      ref={containerRef}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-24">
          <span className="rounded-full bg-primary-50 border border-primary-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary-700">
            Intelligent Platform Capabilities
          </span>
          <h2
            className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-secondary-950"
            id="features-title"
          >
            Engineered for every milestone of your{' '}
            <span className="text-primary-600">study-abroad journey.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-secondary-600 leading-relaxed">
            From initial university discovery to visa filing and mock interview coaching, FutureWings
            replaces scattered tools with a single, synchronized platform.
          </p>
        </div>

        {/* Alternating Feature Rows */}
        <div className="space-y-20 sm:space-y-28">
          {features.map((item, index) => {
            const isReversed = index % 2 === 1
            return (
              <div
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
                  isReversed ? 'lg:grid-flow-dense' : ''
                }`}
                key={item.id}
              >
                {/* Text Content */}
                <div className={isReversed ? 'lg:col-start-2' : ''}>
                  <span
                    className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${item.badgeColor}`}
                  >
                    {item.eyebrow}
                  </span>
                  <h3 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-secondary-950">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-xs sm:text-sm text-secondary-600 leading-relaxed">
                    {item.description}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {item.bullets.map((bullet, bIndex) => (
                      <li className="flex items-start gap-2.5 text-xs sm:text-sm text-secondary-700" key={bIndex}>
                        <BadgeCheckIcon className="h-4 w-4 shrink-0 text-primary-600 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mockup Card */}
                <div
                  className={`rounded-3xl border border-secondary-200/80 bg-slate-50/70 p-4 sm:p-6 shadow-sm ${
                    isReversed ? 'lg:col-start-1' : ''
                  }`}
                >
                  {item.mockup}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
