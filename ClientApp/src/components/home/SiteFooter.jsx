const productLinks = [
  { label: 'Discovery & Search', href: '#features' },
  { label: 'Tier Recommendations', href: '#features' },
  { label: 'Application Tracker', href: '#features' },
  { label: 'Document Vault', href: '#features' },
  { label: 'AI Visa Readiness', href: '#features' },
  { label: 'AI Consular Interview', href: '#features' },
]

const destinationLinks = [
  { label: 'Study in United States', href: '#destinations' },
  { label: 'Study in United Kingdom', href: '#destinations' },
  { label: 'Study in Canada', href: '#destinations' },
  { label: 'Study in Germany', href: '#destinations' },
  { label: 'Study in Australia', href: '#destinations' },
  { label: 'Study in Japan', href: '#destinations' },
]

const resourceLinks = [
  { label: 'Scholarship Radar', href: '#features' },
  { label: 'How It Works', href: '#process' },
  { label: 'Student Stories', href: '#testimonials' },
  { label: 'Frequently Asked Questions', href: '#faq' },
]

const legalLinks = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Security & Encryption', href: '#security' },
  { label: 'Compliance & FERPA', href: '#compliance' },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-secondary-200/80 bg-white" id="contact">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-6">
          {/* Brand info (spans 2 columns) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="AIgnite Buildathon Logo" className="h-8 sm:h-9 w-auto max-w-[150px] object-contain rounded-lg" />
              <span className="text-xl font-extrabold tracking-tight text-secondary-950">
                FutureWings<span className="text-primary-500 font-semibold text-xs ml-1 uppercase tracking-widest">AI</span>
              </span>
            </div>

            <p className="mt-4 max-w-sm text-xs leading-relaxed text-secondary-600 font-normal">
              The intelligent end-to-end workspace for international students. Calibrate admission tiers, audit documents, simulate visa interviews, and discover funded scholarships.
            </p>

            {/* Contact details */}
            <div className="mt-6 space-y-1.5 text-xs text-secondary-600">
              <p>
                <span className="font-semibold text-secondary-800">Direct Support:</span>{' '}
                <a
                  href="mailto:futurewingshelp@gmail.com"
                  className="text-primary-600 hover:underline"
                >
                  futurewingshelp@gmail.com
                </a>
              </p>
              <p>
                <span className="font-semibold text-secondary-800">Helpline:</span>{' '}
                <a href="tel:+8801973685515" className="hover:underline">
                  +880 1973 685515
                </a>
              </p>
            </div>
          </div>

          {/* Nav columns */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-secondary-600 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900">
              Destinations
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {destinationLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-secondary-600 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-secondary-600 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900">
              Legal & Trust
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-secondary-600 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Systems 100% Operational</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright and social */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-secondary-100 pt-8 text-xs text-secondary-500">
          <p>© {new Date().getFullYear()} FutureWings Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6">
            <a
              href="https://github.com/md-sazid9089/Future_Wings"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-primary-600 transition-colors font-medium"
            >
              GitHub Repository
            </a>
            <a
              href="https://future-wings-smart-path-to-study-ab.vercel.app"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-primary-600 transition-colors font-medium"
            >
              Production Web App
            </a>
            <a
              href="https://futurewings-api-b099.azurewebsites.net/health"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-primary-600 transition-colors font-medium"
            >
              API Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
