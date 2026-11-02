/**
 * Centred card shell shared by the Login and Register pages.
 *
 * Includes an accessible "Back to Homepage" action to allow users to easily return
 * to the public landing page without relying on browser history.
 */
export default function AuthLayout({ title, subtitle, onBackToHome, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        {onBackToHome && (
          <div>
            <button
              aria-label="Back to Homepage"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-secondary-600 transition hover:bg-white hover:text-secondary-900 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={onBackToHome}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-secondary-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to Homepage</span>
            </button>
          </div>
        )}

        <section className="w-full rounded-2xl border border-secondary-200 bg-white p-5 sm:p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center"><img src="/logo.png" alt="AIgnite Buildathon Logo" className="h-12 sm:h-14 w-auto max-w-[200px] object-contain rounded-xl" /></div>
            <h1 className="text-2xl font-bold text-secondary-950">{title}</h1>
            <p className="mt-2 text-sm text-secondary-600">{subtitle}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  )
}
