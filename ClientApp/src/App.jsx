import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest, clearSession, loadSession, saveSession } from './auth.js'
import LockedFeature from './components/ui/LockedFeature.jsx'
import NavIcon from './components/ui/navIcons.jsx'
import Toast from './components/ui/Toast.jsx'
import Admin from './pages/Admin.jsx'
import AgentPanel from './pages/AgentPanel.jsx'
import AiInterview from './pages/AiInterview.jsx'
import Applications from './pages/Applications.jsx'
import Community from './pages/Community.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Documents from './pages/Documents.jsx'
import Discovery from './pages/Discovery.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import Recommendations from './pages/Recommendations.jsx'
import Register from './pages/Register.jsx'
import Roadmap from './pages/Roadmap.jsx'
import Scholarships from './pages/Scholarships.jsx'
import Subscription from './pages/Subscription.jsx'
import VisaCheck from './pages/VisaCheck.jsx'
import OnboardingTour from './components/onboarding/OnboardingTour.jsx'
import ProfileCompletionPrompt from './components/profile/ProfileCompletionPrompt.jsx'
import ProfileIncompleteBanner from './components/profile/ProfileIncompleteBanner.jsx'
import NotificationBell from './components/notifications/NotificationBell.jsx'
import { isTourEligible, resetTourRecord } from './lib/onboardingStorage.js'
import {
  evaluateProfileCompletion,
  isProfilePromptDismissed,
  dismissProfilePrompt,
} from './lib/profileCompletion.js'
import { clearReturnTo, getReturnTo } from './lib/navigationStorage.js'
import { SparkleIcon } from './components/home/icons.jsx'

const studentPages = {
  Dashboard,
  Roadmap,
  Discovery,
  Documents,
  Profile,
  Recommendations,
  Applications,
  'Visa Check': VisaCheck,
  Scholarships,
  Community,
  'AI Interview': AiInterview,
  Plans: Subscription,
}

const ROLE_NAV_GROUPS = {
  Admin: [
    { label: 'Platform Governance', items: ['Dashboard', 'Revenue & Finance', 'User Management', 'Applications Oversight'] },
    { label: 'Academic Oversight', items: ['Academic Catalog', 'Scholarships Manager'] },
  ],
  Agent: [
    { label: 'Admissions CRM', items: ['Agent Panel'] },
    { label: 'Territory Catalog', items: ['Discovery', 'Scholarships'] },
    { label: 'Account', items: ['Profile'] },
  ],
  Student: [
    { label: 'Overview', items: ['Dashboard', 'Roadmap'] },
    { label: 'Explore', items: ['Discovery', 'Recommendations', 'Scholarships', 'Community'] },
    { label: 'Apply', items: ['Applications', 'Documents', 'Visa Check', 'AI Interview'] },
    { label: 'Account', items: ['Profile', 'Plans'] },
  ],
}

// Which paid feature each page needs for students.
const PAGE_FEATURE = {
  Roadmap: 'roadmap',
  'AI Interview': 'aiInterview',
}

const FEATURE_TIER = { roadmap: 'Pro', aiInterview: 'Premium' }

const getDefaultPage = (role) => {
  if (role === 'Admin') return 'Dashboard'
  if (role === 'Agent') return 'Agent Panel'
  return 'Dashboard'
}

const getWorkspaceTitle = (role) => {
  if (role === 'Admin') return 'Admin Console'
  if (role === 'Agent') return 'Country Agent Portal'
  return 'Student Workspace'
}

const initials = (session) =>
  `${session.firstName?.[0] ?? ''}${session.lastName?.[0] ?? ''}`.toUpperCase() || 'FW'

const pageToSlug = (page) => page.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')

const slugToPageMap = {
  dashboard: 'Dashboard',
  roadmap: 'Roadmap',
  discovery: 'Discovery',
  documents: 'Documents',
  profile: 'Profile',
  recommendations: 'Recommendations',
  applications: 'Applications',
  'visa-check': 'Visa Check',
  scholarships: 'Scholarships',
  community: 'Community',
  'ai-interview': 'AI Interview',
  plans: 'Plans',
  'agent-panel': 'Agent Panel',
  'revenue-finance': 'Revenue & Finance',
  'user-management': 'User Management',
  'applications-oversight': 'Applications Oversight',
  'academic-catalog': 'Academic Catalog',
  'scholarships-manager': 'Scholarships Manager',
  login: 'Login',
  register: 'Register',
  home: 'Home',
}

const getPageFromHash = () => {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase()
  return slugToPageMap[hash] || null
}

function App() {
  const [session, setSession] = useState(loadSession)
  const [activePage, setActivePage] = useState(() => {
    const s = loadSession()
    const fromHash = getPageFromHash()
    if (fromHash) return fromHash
    return s ? getDefaultPage(s.role) : 'Home'
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [promptDismissed, setPromptDismissed] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [returnTo, setReturnToState] = useState(getReturnTo)
  const [appToast, setAppToast] = useState('')
  const menuButtonRef = useRef(null)

  const isStudent = session && session.role !== 'Admin' && session.role !== 'Agent'

  // Server-side profile completion source of truth
  const loadProfile = useCallback(async () => {
    if (!session?.token || session?.role === 'Admin' || session?.role === 'Agent') {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    try {
      const data = await apiRequest('/profile', { token: session.token })
      setProfile(data)
    } catch {
      // Profile load failure fallback
    } finally {
      setProfileLoading(false)
    }
  }, [session])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (session?.userId) {
      setPromptDismissed(isProfilePromptDismissed(session.userId))
    }
  }, [session?.userId])

  const profileCompletion = useMemo(
    () => evaluateProfileCompletion(profile),
    [profile],
  )

  // Automatic onboarding tour for first-time login — only after profile is complete
  useEffect(() => {
    if (!session || session.role === 'Admin' || session.role === 'Agent') return
    // If profile is incomplete, suppress automatic tour prompt
    if (profile && !profileCompletion.isComplete) return
    if (isTourEligible(session)) {
      const timer = setTimeout(() => {
        setTourOpen(true)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [session, profile, profileCompletion.isComplete])

  const handleStartTour = useCallback(() => {
    if (!session?.userId) return
    resetTourRecord(session.userId)
    setTourOpen(true)
  }, [session])

  // Entitlements for students
  const loadSubscription = useCallback(() => {
    if (!session?.token || session?.role === 'Admin' || session?.role === 'Agent') return
    apiRequest('/subscription/me', { token: session.token })
      .then(setSubscription)
      .catch(() => setSubscription({ tier: 'Free', features: [] }))
  }, [session])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession()
      setSession(null)
      setSubscription(null)
      setProfile(null)
      setActivePage('Login')
      setMenuOpen(false)
    }
    window.addEventListener('futurewings:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('futurewings:unauthorized', handleUnauthorized)
  }, [])

  // Guard against unauthorized page access
  useEffect(() => {
    if (!session) return
    if ((activePage === 'User Management' || activePage === 'Applications Oversight' || activePage === 'Revenue & Finance' || activePage === 'Academic Catalog' || activePage === 'Scholarships Manager') && session.role !== 'Admin') {
      setActivePage(getDefaultPage(session.role))
    } else if (activePage === 'Agent Panel' && session.role !== 'Agent') {
      setActivePage(getDefaultPage(session.role))
    }
  }, [activePage, session])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    if (!appToast) return undefined
    const timer = setTimeout(() => setAppToast(''), 4000)
    return () => clearTimeout(timer)
  }, [appToast])

  const features = subscription?.features ?? []
  // All features are unlocked across all roles and tiers
  const isLocked = () => false

  const handleAuthenticated = (nextSession) => {
    saveSession(nextSession)
    setSession(nextSession)
    const pendingDestination = returnTo || getReturnTo()
    clearReturnTo()
    setReturnToState(null)
    const defaultPage = getDefaultPage(nextSession.role)
    const target =
      pendingDestination && (nextSession.role === 'Student' || nextSession.role === 'Agent')
        ? pendingDestination
        : defaultPage
    goTo(target)
    if (nextSession?.userId) {
      setPromptDismissed(isProfilePromptDismissed(nextSession.userId))
    }
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setSubscription(null)
    setProfile(null)
    goTo('Home')
  }

  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash()
      if (page) setActivePage(page)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const goTo = (page) => {
    setActivePage(page)
    setMenuOpen(false)
    if (typeof window !== 'undefined') {
      window.location.hash = `#/${pageToSlug(page)}`
    }
  }

  const handleCompleteProfilePrompt = () => {
    goTo('Profile')
  }

  const handleSkipProfilePrompt = () => {
    if (session?.userId) {
      dismissProfilePrompt(session.userId)
    }
    setPromptDismissed(true)
    setAppToast('Your profile is incomplete. Recommendations, scholarship matching, and the roadmap may not work correctly until you complete it.')
  }

  const handleHomeNavigate = (page) => {
    if (!session && (page === 'Scholarships' || page === 'Community')) {
      setReturnToState(page)
      goTo('Login')
    } else {
      goTo(page)
    }
  }

  if (activePage === 'Home' || (!session && activePage !== 'Login' && activePage !== 'Register')) {
    return (
      <Home
        isAuthenticated={Boolean(session)}
        onExploreCountries={() => goTo(session ? 'Discovery' : 'Register')}
        onGetRecommendations={() => goTo(session ? 'Recommendations' : 'Register')}
        onNavigate={handleHomeNavigate}
        onSignIn={() => goTo('Login')}
        onSignUp={() => goTo('Register')}
        onViewDestination={() => goTo(session ? 'Discovery' : 'Register')}
        session={session}
      />
    )
  }

  if (!session) {
    const AuthPage = activePage === 'Register' ? Register : Login
    return (
      <AuthPage
        onAuthenticated={handleAuthenticated}
        onNavigate={(page) => {
          if (page === 'Home') {
            goTo('Home')
          } else if (page === 'Login' || page === 'Register') {
            goTo(page)
          } else {
            goTo(activePage === 'Register' ? 'Login' : 'Register')
          }
        }}
        onBackToHome={() => {
          clearReturnTo()
          setReturnToState(null)
          goTo('Home')
        }}
      />
    )
  }

  const role = session.role === 'Admin' || session.role === 'Agent' ? session.role : 'Student'
  const visibleGroups = ROLE_NAV_GROUPS[role] || ROLE_NAV_GROUPS.Student

  const showProfilePrompt =
    isStudent &&
    !profileLoading &&
    profile !== null &&
    !profileCompletion.isComplete &&
    !promptDismissed &&
    activePage !== 'Profile'

  // Resolve component dynamically per role
  const renderActiveContent = () => {
    if (session.role === 'Admin') {
      if (activePage === 'Dashboard') {
        return <Admin initialTab="Overview" onNavigate={goTo} session={session} />
      }
      if (activePage === 'Revenue & Finance') {
        return <Admin initialTab="Revenue & Finance" onNavigate={goTo} session={session} />
      }
      if (activePage === 'User Management') {
        return <Admin initialTab="User Management" onNavigate={goTo} session={session} />
      }
      if (activePage === 'Applications Oversight') {
        return <Admin initialTab="Applications Oversight" onNavigate={goTo} session={session} />
      }
      if (activePage === 'Academic Catalog') {
        return <Admin initialTab="Academic Catalog" onNavigate={goTo} session={session} />
      }
      if (activePage === 'Scholarships Manager') {
        return <Admin initialTab="Scholarships Manager" onNavigate={goTo} session={session} />
      }
      return <Admin initialTab="Overview" onNavigate={goTo} session={session} />
    }

    if (session.role === 'Agent') {
      if (activePage === 'Agent Panel') {
        return <AgentPanel onNavigate={goTo} session={session} />
      }
      if (activePage === 'Discovery') {
        return <Discovery onNavigate={goTo} session={session} />
      }
      if (activePage === 'Scholarships') {
        return <Scholarships onNavigate={goTo} session={session} />
      }
      if (activePage === 'Profile') {
        return <Profile onNavigate={goTo} onProfileUpdate={loadProfile} session={session} />
      }
      return <AgentPanel onNavigate={goTo} session={session} />
    }

    // Student role
    const StudentComponent = studentPages[activePage] || Dashboard
    if (isLocked(activePage)) {
      return (
        <LockedFeature
          onUpgrade={() => goTo('Plans')}
          page={activePage}
          requiredTier={FEATURE_TIER[PAGE_FEATURE[activePage]] ?? 'Pro'}
        />
      )
    }

    return (
      <StudentComponent
        onNavigate={goTo}
        onProfileUpdate={loadProfile}
        onStartTour={handleStartTour}
        onSubscriptionChange={loadSubscription}
        profile={profile}
        session={session}
        subscription={subscription}
      />
    )
  }

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-secondary-200/80 bg-white px-3 py-3 lg:static lg:flex lg:min-h-screen lg:flex-col lg:border-b-0 lg:border-r lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 px-1">
            <img src="/logo.png" alt="AIgnite Buildathon Logo" className="h-8 w-auto max-w-[85px] shrink-0 object-contain rounded-md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-secondary-950">FutureWings</p>
              <p className={`truncate text-[11px] font-bold ${
                session.role === 'Admin'
                  ? 'text-purple-600'
                  : session.role === 'Agent'
                  ? 'text-emerald-600'
                  : 'text-primary-600'
              }`}>
                {getWorkspaceTitle(session.role)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell onNavigate={goTo} session={session} />
            <button
              aria-controls="workspace-nav"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-secondary-500 transition hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              ref={menuButtonRef}
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" viewBox="0 0 24 24">
                {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        <div className={`${menuOpen ? 'block' : 'hidden'} lg:flex lg:min-h-0 lg:flex-1 lg:flex-col`} id="workspace-nav">
          <nav aria-label="Main navigation" className="mt-3 lg:mt-5 lg:flex-1 lg:overflow-y-auto">
            {visibleGroups.map((group) => (
              <div className="mb-4 last:mb-0" key={group.label}>
                <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-secondary-400">
                  {group.label}
                </p>
                <ul className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-0.5 sm:grid-cols-3 lg:grid-cols-1">
                  {group.items.map((page) => {
                    const active = activePage === page
                    const locked = isLocked(page)
                    return (
                      <li key={page}>
                        <button
                          aria-current={active ? 'page' : undefined}
                          className={`group flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                            active
                              ? session.role === 'Admin'
                                ? 'bg-purple-50 text-purple-900 font-semibold'
                                : session.role === 'Agent'
                                ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                : 'bg-secondary-100 text-secondary-950 font-semibold'
                              : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-950'
                          }`}
                          onClick={() => goTo(page)}
                          type="button"
                        >
                          <span className={active ? (session.role === 'Admin' ? 'text-purple-600' : session.role === 'Agent' ? 'text-emerald-600' : 'text-primary-600') : 'text-secondary-400 group-hover:text-secondary-600'}>
                            <NavIcon page={page} />
                          </span>
                          <span className="flex-1 truncate">{page}</span>
                          {locked && (
                            <span aria-label="(requires an upgrade)" className="shrink-0 text-secondary-300" role="img" title="Requires an upgrade">
                              <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                <rect height="10" rx="2" width="14" x="5" y="11" />
                                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                              </svg>
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-4 border-t border-secondary-200/80 pt-3 lg:mt-0">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                session.role === 'Admin'
                  ? 'bg-purple-100 text-purple-700'
                  : session.role === 'Agent'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-secondary-100 text-secondary-600'
              }`}>
                {initials(session)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-secondary-900">{session.firstName} {session.lastName}</p>
                <p className="truncate text-[11px] text-secondary-400">{session.email}</p>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 px-2">
              {session.role === 'Admin' ? (
                <span className="inline-flex rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-purple-700">
                  Super Admin
                </span>
              ) : session.role === 'Agent' ? (
                <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                  Country Agent
                </span>
              ) : (
                <>
                  <span className="inline-flex rounded-md bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-500">
                    Student
                  </span>
                  <button
                    className="inline-flex rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700 transition hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() => goTo('Plans')}
                    type="button"
                  >
                    {subscription?.tier ?? 'Free'}
                  </button>
                </>
              )}
            </div>

            {/* Profile completion / Tour button */}
            {isStudent && (
              <>
                {!profileCompletion.isComplete ? (
                  <button
                    className="mt-2.5 flex min-h-9 w-full items-center justify-between gap-2 rounded-lg bg-warning-50 border border-warning-200 px-2.5 py-2 text-[13px] font-bold text-warning-800 transition hover:bg-warning-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning-500"
                    onClick={() => goTo('Profile')}
                    type="button"
                    data-testid="sidebar-complete-profile-btn"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-warning-500 animate-pulse shrink-0" />
                      <span className="truncate">Complete Your Profile</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-warning-200/80 px-2 py-0.5 text-[11px] font-extrabold text-warning-900" data-testid="sidebar-profile-progress-pill">
                      {profileCompletion.completedCount}/{profileCompletion.totalRequired}
                    </span>
                  </button>
                ) : (
                  <button
                    className="mt-2.5 flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-secondary-600 transition hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={handleStartTour}
                    type="button"
                    data-testid="sidebar-take-tour-btn"
                  >
                    <SparkleIcon className="h-4 w-4 text-primary-500" />
                    <span>Take Product Tour</span>
                  </button>
                )}
              </>
            )}

            <button
              className="mt-1 flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-secondary-500 transition hover:bg-secondary-50 hover:text-danger-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={handleLogout}
              type="button"
            >
              <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M14.5 8.5V6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2.5" />
                <path d="M10 12h10M17 9l3 3-3 3" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 max-w-full overflow-x-clip p-3.5 sm:p-6 lg:p-8 xl:p-10">
        {/* Workspace Incomplete Profile Notice Banner */}
        {isStudent && activePage !== 'Profile' && (
          <ProfileIncompleteBanner
            onNavigateToProfile={() => goTo('Profile')}
            profileCompletion={profileCompletion}
          />
        )}
        {renderActiveContent()}
      </main>

      {/* Prominent Profile Completion Prompt modal for students with incomplete profiles */}
      {showProfilePrompt && (
        <ProfileCompletionPrompt
          onComplete={handleCompleteProfilePrompt}
          onSkip={handleSkipProfilePrompt}
          profileCompletion={profileCompletion}
        />
      )}

      {tourOpen && session && session.role !== 'Admin' && session.role !== 'Agent' && (
        <OnboardingTour
          activePage={activePage}
          onClose={() => setTourOpen(false)}
          onNavigate={goTo}
          session={session}
        />
      )}

      <Toast message={appToast} />
    </div>
  )
}

export default App
