import { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, CloseIcon, MenuIcon } from './icons.jsx'
import { setReturnTo } from '../../lib/navigationStorage.js'

const navLinks = [
  { label: 'Product', href: '#product' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Destinations', href: '#destinations' },
  { label: 'Scholarships', page: 'Scholarships' },
  { label: 'Community', page: 'Community' },
  { label: 'FAQ', href: '#faq' },
]

export default function SiteHeader({
  onSignIn,
  onSignUp,
  onNavigate,
  isAuthenticated = false,
  session = null,
}) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const toggleRef = useRef(null)
  const panelRef = useRef(null)

  const authenticated = Boolean(isAuthenticated || session?.token || session?.userId)

  const handleProtectedNav = (destination) => {
    if (open) setOpen(false)
    if (authenticated) {
      onNavigate?.(destination)
    } else {
      setReturnTo(destination)
      if (onNavigate) {
        onNavigate('Login')
      } else if (onSignIn) {
        onSignIn()
      }
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Keyboard navigation & Escape handling
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Focus trap into mobile drawer
  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector('a, button')?.focus()
    }
  }, [open])

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-secondary-200/80 bg-white/90 shadow-xs backdrop-blur-md'
          : 'border-b border-transparent bg-white/70 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand Logo */}
        <a
          className="flex shrink-0 items-center gap-2.5 rounded-xl text-primary-500 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          href="#home"
        >
          <img
            src="/logo.png"
            alt="AIgnite Buildathon Logo"
            className="h-8 sm:h-9 w-auto max-w-[130px] sm:max-w-[160px] object-contain rounded-lg"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black tracking-tight text-secondary-950">FutureWings</span>
            <span className="rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-700 ring-1 ring-primary-500/20">
              AI
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1 rounded-full border border-secondary-200/70 bg-white/80 p-1 shadow-xs backdrop-blur-sm">
            {navLinks.map((link) => (
              <li key={link.label}>
                {link.page ? (
                  <button
                    className="rounded-full px-4 py-1.5 text-xs font-semibold text-secondary-600 transition hover:bg-secondary-100 hover:text-secondary-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
                    onClick={() => handleProtectedNav(link.page)}
                    type="button"
                  >
                    {link.label}
                  </button>
                ) : (
                  <a
                    className="rounded-full px-4 py-1.5 text-xs font-semibold text-secondary-600 transition hover:bg-secondary-100 hover:text-secondary-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    href={link.href}
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Authentication & CTA Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            className="hidden sm:inline-flex rounded-full px-4 py-2 text-xs sm:text-sm font-bold text-secondary-700 transition hover:bg-secondary-100/80 hover:text-secondary-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            onClick={onSignIn}
            type="button"
          >
            Sign In
          </button>
          <button
            className="hidden sm:inline-flex group relative items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-primary-500/25 transition hover:shadow-lg hover:shadow-primary-500/35 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            onClick={onSignUp}
            type="button"
          >
            <span>Get Started</span>
            <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </button>

          {/* Mobile Menu Button */}
          <button
            aria-controls="mobile-nav"
            aria-expanded={open}
            aria-label={open ? 'Close mobile navigation menu' : 'Open mobile navigation menu'}
            className="rounded-xl border border-secondary-200 p-2 text-secondary-700 transition hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
            onClick={() => setOpen((current) => !current)}
            ref={toggleRef}
            type="button"
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {open && (
        <div
          className="fixed inset-0 top-16 sm:top-20 z-50 bg-secondary-950/40 backdrop-blur-xs lg:hidden animate-fadeIn"
          onClick={() => setOpen(false)}
        >
          <div
            aria-label="Mobile Navigation Menu"
            role="dialog"
            className="mx-4 mt-3 rounded-3xl border border-secondary-200 bg-white p-6 shadow-2xl"
            id="mobile-nav"
            onClick={(e) => e.stopPropagation()}
            ref={panelRef}
          >
            <nav>
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    {link.page ? (
                      <button
                        className="w-full text-left block rounded-xl px-4 py-2.5 text-sm font-bold text-secondary-800 transition hover:bg-secondary-50 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
                        onClick={() => handleProtectedNav(link.page)}
                        type="button"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a
                        className="block rounded-xl px-4 py-2.5 text-sm font-bold text-secondary-800 transition hover:bg-secondary-50 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        href={link.href}
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 border-t border-secondary-100 pt-5 space-y-2">
              <button
                className="w-full inline-flex items-center justify-center min-h-[44px] rounded-xl border border-secondary-200 py-2.5 text-sm font-bold text-secondary-800 transition hover:bg-secondary-50"
                onClick={() => {
                  setOpen(false)
                  onSignIn?.()
                }}
                type="button"
              >
                Sign In
              </button>
              <button
                className="w-full inline-flex items-center justify-center min-h-[44px] rounded-xl bg-primary-500 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:bg-primary-600"
                onClick={() => {
                  setOpen(false)
                  onSignUp?.()
                }}
                type="button"
              >
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
