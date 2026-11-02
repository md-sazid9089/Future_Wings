import { useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, FOCUS } from '../components/ui/styles.js'

const tierAccent = {
  Free: 'text-secondary-600',
  Pro: 'text-primary-600',
  Premium: 'text-accent-600',
}

export default function Subscription({ session, subscription, onSubscriptionChange }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyTier, setBusyTier] = useState('')

  // Stripe returns the browser here with ?checkout=success|cancelled. Read it once
  // during initialisation (and strip it from the URL) rather than in an effect.
  const [checkoutOutcome] = useState(() => {
    const outcome = new URLSearchParams(window.location.search).get('checkout')
    if (outcome) window.history.replaceState({}, '', window.location.pathname)
    return outcome
  })
  const [toast, setToast] = useState(() =>
    checkoutOutcome === 'success' ? 'Payment received — your plan is being activated.'
      : checkoutOutcome === 'cancelled' ? 'Checkout cancelled.'
        : '')

  useEffect(() => {
    let active = true
    apiRequest('/subscription/plans', { token: session?.token })
      .then((data) => { if (active) setPlans(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session?.token])

  // Re-fetch entitlements after a successful payment
  useEffect(() => {
    if (checkoutOutcome === 'success') onSubscriptionChange?.()
  }, [checkoutOutcome, onSubscriptionChange])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const simulated = subscription?.simulationEnabled === true || subscription?.isDemoMode === true
  const currentTier = subscription?.tier ?? 'Free'

  const handleUnlockDemo = async (tier, planName) => {
    setBusyTier(tier)
    setError('')
    try {
      await apiRequest('/subscription/demo-unlock', {
        token: session?.token,
        method: 'POST',
        body: JSON.stringify({ tier }),
      })
      onSubscriptionChange?.()
      setToast(`${planName || tier} features unlocked in demo mode.`)
    } catch (requestError) {
      setError(requestError.message || `Failed to unlock ${planName || tier} demo.`)
    } finally {
      setBusyTier('')
    }
  }

  // Direct checkout path for production when configured
  const executeDirectCheckout = async (tier) => {
    setBusyTier(tier)
    setError('')
    try {
      const { checkoutUrl } = await apiRequest('/subscription/checkout', {
        token: session?.token,
        method: 'POST',
        body: JSON.stringify({ tier, returnUrl: window.location.origin }),
      })
      window.location.assign(checkoutUrl)
    } catch (requestError) {
      setError(requestError.message)
      setBusyTier('')
    }
  }

  const handleUpgradeClick = (plan) => {
    if (simulated) {
      handleUnlockDemo(plan.tier, plan.name)
    } else {
      executeDirectCheckout(plan.tier)
    }
  }

  // Test-mode only: lets the tiers be demoed repeatedly without a database edit.
  const handleDowngrade = async () => {
    setBusyTier('Free')
    setError('')
    try {
      await apiRequest('/subscription/demo-unlock', {
        token: session?.token,
        method: 'POST',
        body: JSON.stringify({ tier: 'Free' }),
      })
      onSubscriptionChange?.()
      setToast('Returned to Free tier.')
    } catch (requestError) {
      setError(requestError.message || 'Failed to reset plan.')
    } finally {
      setBusyTier('')
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Plans & Billing</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">Choose your plan</h1>
        <p className="mt-2 text-secondary-500">
          You&rsquo;re currently on the <span className="font-semibold text-secondary-900">{currentTier}</span> plan.
          {subscription?.renewsAt && ` Renews ${new Date(subscription.renewsAt).toLocaleDateString()}.`}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {/* Demo Mode Notice Banner */}
      {subscription && simulated && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
              ★
            </span>
            <div>
              <p className="font-bold text-indigo-950">Demo access is enabled. Choose a plan to unlock its features.</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Click Upgrade on Pro or Premium to unlock study roadmaps and AI interview features immediately.
              </p>
            </div>
          </div>
          {currentTier !== 'Free' && (
            <button
              onClick={handleDowngrade}
              disabled={Boolean(busyTier)}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 transition disabled:opacity-60"
              type="button"
            >
              {busyTier === 'Free' ? 'Resetting...' : 'Reset to Free Tier (Demo)'}
            </button>
          )}
        </div>
      )}

      {/* Live Billing Disabled Notice when demo mode is inactive */}
      {subscription && !simulated && subscription.stripeConfigured === false && (
        <div className="mb-6 rounded-2xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          Live billing is planned but not yet available. Everything on the Free plan works normally.
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((card) => <div className={`h-80 animate-pulse ${CARD}`} key={card} />)}
        </div>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.tier === currentTier
            const isFree = plan.monthlyPriceUsd === 0
            return (
              <li className={`flex flex-col p-5 sm:p-6 ${CARD} ${isCurrent ? 'ring-2 ring-primary-500 shadow-md' : ''}`} key={plan.tier}>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className={`text-lg font-bold ${tierAccent[plan.tier] ?? 'text-secondary-900'}`}>{plan.name}</h2>
                  {isCurrent && (
                    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-700">
                      Current plan
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-secondary-500">{plan.description}</p>
                <div className="mt-4">
                  <p className="text-3xl font-black text-secondary-950">
                    ৳{plan.monthlyPriceUsd === 0 ? '0' : (plan.monthlyPriceUsd * 120).toLocaleString()} Tk
                    <span className="text-sm font-medium text-secondary-500"> / month</span>
                  </p>
                  {plan.monthlyPriceUsd > 0 && (
                    <p className="text-xs font-semibold text-secondary-400 mt-0.5">
                      (${plan.monthlyPriceUsd} USD)
                    </p>
                  )}
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.highlights.map((highlight) => (
                    <li className="flex items-start gap-2 text-sm text-secondary-600" key={highlight}>
                      <span aria-hidden="true" className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                        <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                          <path d="m5 12.5 4.5 4.5L19 7" />
                        </svg>
                      </span>
                      {highlight}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-xl border border-secondary-200 bg-secondary-100/70 px-4 py-2.5 text-sm font-semibold text-secondary-500 cursor-default"
                      >
                        Current plan
                      </button>
                      {simulated && !isFree && (
                        <button
                          className="text-xs font-semibold text-secondary-500 hover:text-secondary-700 underline text-left"
                          disabled={Boolean(busyTier)}
                          onClick={handleDowngrade}
                          type="button"
                        >
                          {busyTier === 'Free' ? 'Resetting…' : 'Switch back to Free (Demo)'}
                        </button>
                      )}
                    </div>
                  ) : isFree ? (
                    simulated ? (
                      <button
                        className={`w-full rounded-lg border border-secondary-200 px-4 py-2.5 text-sm font-semibold text-secondary-700 transition hover:border-secondary-300 disabled:opacity-60 ${FOCUS}`}
                        disabled={Boolean(busyTier)}
                        onClick={handleDowngrade}
                        type="button"
                      >
                        {busyTier === 'Free' ? 'Applying…' : 'Switch back to Free'}
                      </button>
                    ) : (
                      <p className="text-sm text-secondary-500">Included by default.</p>
                    )
                  ) : simulated ? (
                    <div className="flex flex-col gap-1.5">
                      <button
                        className={`w-full ${BTN_PRIMARY} ${FOCUS}`}
                        disabled={Boolean(busyTier)}
                        onClick={() => handleUpgradeClick(plan)}
                        type="button"
                        data-testid={`unlock-${plan.tier.toLowerCase()}-demo-btn`}
                      >
                        {busyTier === plan.tier ? 'Unlocking...' : `Upgrade to ${plan.name}`}
                      </button>
                      <p className="text-xs text-secondary-500 text-center">
                        Unlock instantly in demo mode.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <button
                        className={`w-full ${BTN_PRIMARY} ${FOCUS} ${!plan.purchasable || !subscription?.stripeConfigured ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={!plan.purchasable || !subscription?.stripeConfigured || Boolean(busyTier)}
                        onClick={() => handleUpgradeClick(plan)}
                        type="button"
                      >
                        {busyTier === plan.tier ? 'Processing...' : `Upgrade to ${plan.name}`}
                      </button>
                      {(!plan.purchasable || !subscription?.stripeConfigured) && (
                        <p className="text-xs text-secondary-400 text-center">
                          Unavailable until payments are configured.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Toast message={toast} />
    </div>
  )
}
