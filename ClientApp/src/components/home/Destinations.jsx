import { useRef } from 'react'
import SectionHeading from './SectionHeading.jsx'
import { ArrowRightIcon, TrophyIcon, ClockIcon } from './icons.jsx'
import { useScrollReveal } from '../../lib/useScrollAnimation.js'

const destinations = [
  {
    name: 'United States',
    flag: '🇺🇸',
    tier: 'Tier 1 Global Ivy',
    tierColor: 'bg-primary-50 text-primary-800 border-primary-200',
    avgCost: '$25k – $55k/yr',
    workRights: 'OPT 1–3 Years',
    acceptanceRate: 'Competitive (12–35%)',
    highlight: 'World-renowned research labs, Silicon Valley tech ecosystem & 36-month STEM OPT extension.',
    topUniversities: 'MIT, Stanford, Berkeley, NYU',
  },
  {
    name: 'United Kingdom',
    flag: '🇬🇧',
    tier: 'Tier 1 Heritage',
    tierColor: 'bg-blue-50 text-blue-800 border-blue-200',
    avgCost: '£14k – £32k/yr',
    workRights: '2-Yr Graduate Route',
    acceptanceRate: 'Selective (20–45%)',
    highlight: '1-Year accelerated Master’s programs and historic Russell Group research institutions.',
    topUniversities: 'Oxford, Cambridge, UCL, Imperial',
  },
  {
    name: 'Canada',
    flag: '🇨🇦',
    tier: 'Tier 1 Immigration',
    tierColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    avgCost: 'CAD $18k – $38k/yr',
    workRights: '3-Yr PGWP Available',
    acceptanceRate: 'Accessible (30–60%)',
    highlight: 'Clear post-graduation work permits, welcoming culture, and world-class co-op internships.',
    topUniversities: 'Toronto, UBC, McGill, Waterloo',
  },
  {
    name: 'Germany',
    flag: '🇩🇪',
    tier: 'Tier 2 Low Tuition',
    tierColor: 'bg-amber-50 text-amber-800 border-amber-200',
    avgCost: '€0 – €3k/yr',
    workRights: '18-Mo Job Seeker',
    acceptanceRate: 'Merit-Based (25–50%)',
    highlight: 'Virtually zero tuition fees at prestigious public technical universities (TU9) with robust engineering hubs.',
    topUniversities: 'TUM, RWTH Aachen, Heidelberg, KIT',
  },
  {
    name: 'Australia',
    flag: '🇦🇺',
    tier: 'Tier 1 Quality of Life',
    tierColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    avgCost: 'AUD $28k – $46k/yr',
    workRights: '2–4 Yr Post-Study',
    acceptanceRate: 'Balanced (35–65%)',
    highlight: 'High student minimum wages, Group of Eight prestige, and generous regional permanent residency perks.',
    topUniversities: 'Melbourne, Sydney, UNSW, ANU',
  },
  {
    name: 'Japan',
    flag: '🇯🇵',
    tier: 'Tier 2 High Tech',
    tierColor: 'bg-rose-50 text-rose-800 border-rose-200',
    avgCost: '$5k – $15k/yr',
    workRights: 'Designated Visa Track',
    acceptanceRate: 'Specific (20–40%)',
    highlight: 'Generous MEXT government scholarships, cutting-edge robotics & AI engineering, and safe student cities.',
    topUniversities: 'Tokyo, Kyoto, Osaka, Tohoku',
  },
]

export default function Destinations({ onViewDestination }) {
  const containerRef = useRef(null)
  useScrollReveal(containerRef, {
    direction: 'up',
    distance: 24,
    duration: 0.8,
    stagger: 0.1,
  })

  return (
    <section
      aria-labelledby="destinations-title"
      className="relative bg-white py-20 sm:py-28 overflow-hidden"
      id="destinations"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Global Destinations"
          badgeClassName="bg-primary-50 text-primary-700 border border-primary-200/80"
          description="Explore high-demand destination countries with clear admission tracks, vetted post-study work rights, and real cost profiles."
          id="destinations-title"
          title="Top international study destinations"
        />

        <div className="mt-14 sm:mt-18" ref={containerRef}>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map(
              ({
                name,
                flag,
                tier,
                tierColor,
                avgCost,
                workRights,
                highlight,
                topUniversities,
              }) => (
                <li
                  key={name}
                  className="group relative flex flex-col justify-between rounded-3xl border border-secondary-200/80 bg-surface p-4 sm:p-6 lg:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-300 hover:bg-white hover:shadow-xl hover:shadow-secondary-900/5"
                >
                  <div>
                    {/* Header: Flag, Name, Tier Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" role="img" aria-label={`${name} flag`}>
                          {flag}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold text-secondary-950 group-hover:text-primary-600 transition-colors">
                            {name}
                          </h3>
                          <span className="text-[11px] text-secondary-500 font-medium">
                            {topUniversities}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${tierColor}`}
                      >
                        {tier}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-white border border-secondary-200/70 p-3 shadow-xs">
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-secondary-400">
                          <TrophyIcon className="h-3 w-3 text-secondary-400" />
                          Avg. Tuition
                        </span>
                        <span className="mt-1 block font-bold text-secondary-900">
                          {avgCost}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white border border-secondary-200/70 p-3 shadow-xs">
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-secondary-400">
                          <ClockIcon className="h-3 w-3 text-secondary-400" />
                          Post-Study Visa
                        </span>
                        <span className="mt-1 block font-bold text-secondary-900">
                          {workRights}
                        </span>
                      </div>
                    </div>

                    {/* Description Highlight */}
                    <p className="mt-4 text-xs leading-relaxed text-secondary-600">
                      {highlight}
                    </p>
                  </div>

                  {/* Footer button */}
                  <div className="mt-6 pt-5 border-t border-secondary-200/60 flex items-center justify-between">
                    <button
                      className="inline-flex items-center gap-2 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors group/btn"
                      onClick={() => onViewDestination?.(name)}
                      type="button"
                    >
                      <span>Explore Universities in {name}</span>
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}
