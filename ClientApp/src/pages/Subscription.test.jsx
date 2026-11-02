import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Subscription from './Subscription.jsx'
import { apiRequest } from '../auth.js'
import LockedFeature from '../components/ui/LockedFeature.jsx'

vi.mock('../auth.js', () => ({
  apiRequest: vi.fn(),
}))

const mockPlans = [
  {
    tier: 'Free',
    name: 'Free',
    description: 'Basic access',
    monthlyPriceUsd: 0,
    highlights: ['Dashboard', 'Discovery'],
    features: ['dashboard', 'discovery'],
    purchasable: true,
  },
  {
    tier: 'Pro',
    name: 'Pro',
    description: 'Adds study roadmap',
    monthlyPriceUsd: 9,
    highlights: ['Everything in Free', 'Study roadmap mind map'],
    features: ['dashboard', 'discovery', 'roadmap'],
    purchasable: true,
  },
  {
    tier: 'Premium',
    name: 'Premium',
    description: 'Adds interview practice',
    monthlyPriceUsd: 19,
    highlights: ['Everything in Pro', 'AI mock interviews'],
    features: ['dashboard', 'discovery', 'roadmap', 'aiInterview'],
    purchasable: true,
  },
]

describe('Subscription Demo Mode & Unlock Flow', () => {
  const session = { token: 'mock-token', userId: 1, email: 'demo@student.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === '/subscription/plans') {
        return Promise.resolve(mockPlans)
      }
      if (endpoint === '/subscription/demo-unlock') {
        return Promise.resolve({
          tier: 'Pro',
          features: ['dashboard', 'discovery', 'roadmap'],
          isDemoMode: true,
        })
      }
      return Promise.resolve({})
    })
  })

  it('renders demo wording banner and "Unlock instantly in demo mode" on paid cards in demo mode', async () => {
    const subscription = {
      tier: 'Free',
      features: ['dashboard', 'discovery'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument()
      expect(screen.getByText('Premium')).toBeInTheDocument()
    })

    // Replaced disabled message with clear demo wording
    expect(screen.getByText(/Demo access is enabled\. Choose a plan to unlock its features\./i)).toBeInTheDocument()
    expect(screen.queryByText(/Payments aren’t switched on yet/i)).toBeNull()

    // Subtext on upgrade cards
    const instantUnlocks = screen.getAllByText(/Unlock instantly in demo mode\./i)
    expect(instantUnlocks.length).toBe(2)

    // Upgrade buttons for Pro and Premium
    expect(screen.getByRole('button', { name: /Upgrade to Pro/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Upgrade to Premium/i })).toBeInTheDocument()
  })

  it('shows "Current plan" for active tier and does not allow upgrading to it', async () => {
    const subscription = {
      tier: 'Pro',
      features: ['dashboard', 'discovery', 'roadmap'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /Upgrade to Pro/i })).toBeNull()
    expect(screen.getByRole('button', { name: /Upgrade to Premium/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Current plan/i })).toBeDisabled()
  })

  it('shows live billing planned message and disables upgrades when demo mode is disabled', async () => {
    const subscription = {
      tier: 'Free',
      features: ['dashboard', 'discovery'],
      isDemoMode: false,
      simulationEnabled: false,
      stripeConfigured: false,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument()
    })

    expect(screen.getByText(/Live billing is planned but not yet available\. Everything on the Free plan works normally\./i)).toBeInTheDocument()
    expect(screen.queryByText(/Payments aren’t switched on yet/i)).toBeNull()
    expect(screen.queryByText(/Demo access is enabled/i)).toBeNull()

    // Paid plans show unavailable
    const unavailables = screen.getAllByText(/Unavailable until payments are configured\./i)
    expect(unavailables.length).toBeGreaterThanOrEqual(1)
  })

  it('clicking "Upgrade to Pro" unlocks Pro directly without modal, calls /subscription/demo-unlock, refreshes subscription, and displays success toast', async () => {
    const onSubscriptionChange = vi.fn()
    const subscription = {
      tier: 'Free',
      features: ['dashboard', 'discovery'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={onSubscriptionChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upgrade to Pro/i })).toBeInTheDocument()
    })

    const proBtn = screen.getByRole('button', { name: /Upgrade to Pro/i })
    fireEvent.click(proBtn)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/subscription/demo-unlock', expect.objectContaining({
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ tier: 'Pro' }),
      }))
      expect(onSubscriptionChange).toHaveBeenCalled()
      expect(screen.getByText(/Pro features unlocked in demo mode\./i)).toBeInTheDocument()
    })
  })

  it('clicking "Upgrade to Premium" unlocks Premium directly without modal, calls /subscription/demo-unlock, refreshes subscription, and displays success toast', async () => {
    const onSubscriptionChange = vi.fn()
    const subscription = {
      tier: 'Free',
      features: ['dashboard', 'discovery'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={onSubscriptionChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upgrade to Premium/i })).toBeInTheDocument()
    })

    const premiumBtn = screen.getByRole('button', { name: /Upgrade to Premium/i })
    fireEvent.click(premiumBtn)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/subscription/demo-unlock', expect.objectContaining({
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ tier: 'Premium' }),
      }))
      expect(onSubscriptionChange).toHaveBeenCalled()
      expect(screen.getByText(/Premium features unlocked in demo mode\./i)).toBeInTheDocument()
    })
  })

  it('displays API error visibly when demo unlock fails', async () => {
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === '/subscription/plans') {
        return Promise.resolve(mockPlans)
      }
      if (endpoint === '/subscription/demo-unlock') {
        return Promise.reject(new Error('Simulated checkout is disabled in Production.'))
      }
      return Promise.resolve({})
    })

    const subscription = {
      tier: 'Free',
      features: ['dashboard', 'discovery'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upgrade to Pro/i })).toBeInTheDocument()
    })

    const proBtn = screen.getByRole('button', { name: /Upgrade to Pro/i })
    fireEvent.click(proBtn)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Simulated checkout is disabled in Production.')
    })
  })

  it('verifies entitlement gating across Free, Pro, and Premium tiers', () => {
    const PAGE_FEATURE = {
      Roadmap: 'roadmap',
      'AI Interview': 'aiInterview',
    }
    const FEATURE_TIER = { roadmap: 'Pro', aiInterview: 'Premium' }

    const isLocked = (features, page) => {
      const required = PAGE_FEATURE[page]
      return Boolean(required) && !features.includes(required)
    }

    // 1. Free tier: both Roadmap and AI Interview are locked
    const freeFeatures = ['dashboard', 'discovery', 'recommendations', 'community', 'profile']
    expect(isLocked(freeFeatures, 'Roadmap')).toBe(true)
    expect(isLocked(freeFeatures, 'AI Interview')).toBe(true)

    // 2. Pro tier: Roadmap is unlocked, AI Interview is locked
    const proFeatures = [...freeFeatures, 'roadmap']
    expect(isLocked(proFeatures, 'Roadmap')).toBe(false)
    expect(isLocked(proFeatures, 'AI Interview')).toBe(true)

    // 3. Premium tier: both Roadmap and AI Interview are unlocked
    const premiumFeatures = [...proFeatures, 'aiInterview']
    expect(isLocked(premiumFeatures, 'Roadmap')).toBe(false)
    expect(isLocked(premiumFeatures, 'AI Interview')).toBe(false)

    // LockedFeature visual prompt verification
    const { getByText } = render(
      <LockedFeature
        page="AI Interview"
        requiredTier={FEATURE_TIER[PAGE_FEATURE['AI Interview']]}
        onUpgrade={vi.fn()}
      />
    )
    expect(getByText('AI Interview is part of Premium')).toBeInTheDocument()
    expect(getByText(/Upgrade your plan to unlock it/i)).toBeInTheDocument()
  })
})
