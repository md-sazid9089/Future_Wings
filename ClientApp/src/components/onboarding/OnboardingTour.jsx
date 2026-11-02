import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { ONBOARDING_STEPS } from './tourSteps.js'
import {
  loadTourRecord,
  saveTourRecord,
} from '../../lib/onboardingStorage.js'
import {
  SparkleIcon,
  CheckIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  CloseIcon,
  BadgeCheckIcon,
} from '../home/icons.jsx'

export default function OnboardingTour({
  session,
  activePage,
  onNavigate,
  onClose,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const existing = loadTourRecord(session?.userId)
    return typeof existing?.currentStepIndex === 'number' ? existing.currentStepIndex : 0
  })

  const [targetRect, setTargetRect] = useState(null)
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })

  const popoverRef = useRef(null)
  const [popoverSize, setPopoverSize] = useState({ width: 440, height: 320 })

  const totalSteps = ONBOARDING_STEPS.length
  const currentStep = ONBOARDING_STEPS[currentStepIndex] || ONBOARDING_STEPS[0]

  // Track viewport resize
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Measure popover dimensions
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setPopoverSize({ width: rect.width, height: rect.height })
      }
    }
  }, [currentStepIndex])

  // Synchronize navigation and target element spotlight
  const updateTargetElement = useCallback(() => {
    if (!currentStep || !currentStep.selector) {
      setTargetRect(null)
      return
    }

    // Attempt primary selector, then fallback selector
    let element = document.querySelector(currentStep.selector)
    if (!element && currentStep.fallbackSelector) {
      element = document.querySelector(currentStep.fallbackSelector)
    }

    if (element) {
      const rect = element.getBoundingClientRect()
      // Only set if element is visible
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect)
        // Smoothly scroll target into view if outside comfortable viewport area
        if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return
      }
    }

    setTargetRect(null)
  }, [currentStep])

  // If the step belongs to a different page, request navigation
  useEffect(() => {
    if (currentStep && currentStep.page && currentStep.page !== activePage) {
      onNavigate?.(currentStep.page)
    }
  }, [currentStep, activePage, onNavigate])

  // Poll/listen for target element after page renders
  useEffect(() => {
    updateTargetElement()

    // Poll briefly to handle asynchronous page loading / animation
    let attempts = 0
    const interval = setInterval(() => {
      attempts += 1
      updateTargetElement()
      if (attempts >= 12) clearInterval(interval)
    }, 150)

    return () => clearInterval(interval)
  }, [currentStepIndex, activePage, updateTargetElement])

  // Save progress whenever step changes
  useEffect(() => {
    if (session?.userId) {
      const completedSteps = Array.from(
        { length: currentStepIndex },
        (_, i) => i
      )
      saveTourRecord(session.userId, {
        status: 'in_progress',
        currentStepIndex,
        completedSteps,
      })
    }
  }, [currentStepIndex, session?.userId])

  // Advance to next step
  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      // Completed!
      if (session?.userId) {
        saveTourRecord(session.userId, {
          status: 'completed',
          currentStepIndex: totalSteps - 1,
          completedSteps: Array.from({ length: totalSteps }, (_, i) => i),
        })
      }
      onNavigate?.('Dashboard')
      onClose?.()
    }
  }

  // Go back to previous step
  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  // Skip tour
  const handleSkip = () => {
    if (session?.userId) {
      saveTourRecord(session.userId, {
        status: 'skipped',
        currentStepIndex,
      })
    }
    onClose?.()
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleSkip()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleNext()
      } else if (event.key === 'ArrowLeft' && currentStepIndex > 0) {
        event.preventDefault()
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStepIndex, totalSteps])

  // Compute popover placement coordinates
  const popoverStyle = useMemo(() => {
    const isMobile = viewport.width < 640
    const padding = 16

    // Centered modal for steps with no target, placement: center, or on mobile
    if (!targetRect || currentStep.placement === 'center' || isMobile) {
      if (isMobile) {
        return {
          position: 'fixed',
          left: `${padding}px`,
          right: `${padding}px`,
          bottom: `${padding}px`,
          maxWidth: `calc(100vw - ${padding * 2}px)`,
          zIndex: 9999,
        }
      }

      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '480px',
        width: '92vw',
        zIndex: 9999,
      }
    }

    // Desktop targeted placement (anchored relative to spotlighted element)
    const cardW = popoverSize.width || 440
    const cardH = popoverSize.height || 320
    const gap = 16

    // Default to positioning below the target
    let top = targetRect.bottom + gap
    let left = targetRect.left

    // If overflowing bottom of viewport, position above target
    if (top + cardH > viewport.height - padding) {
      top = Math.max(padding, targetRect.top - cardH - gap)
    }

    // Keep horizontally constrained inside viewport
    if (left + cardW > viewport.width - padding) {
      left = Math.max(padding, viewport.width - cardW - padding)
    }
    if (left < padding) {
      left = padding
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: '460px',
      width: '90vw',
      zIndex: 9999,
    }
  }, [targetRect, currentStep, viewport, popoverSize])

  // Compute spotlight highlight cutout coordinates
  const spotlightStyle = useMemo(() => {
    if (!targetRect || currentStep.placement === 'center') return null

    const margin = 8
    return {
      top: `${Math.max(0, targetRect.top - margin)}px`,
      left: `${Math.max(0, targetRect.left - margin)}px`,
      width: `${targetRect.width + margin * 2}px`,
      height: `${targetRect.height + margin * 2}px`,
      borderRadius: '20px',
      boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
    }
  }, [targetRect, currentStep])

  return (
    <div
      aria-label="Product tour"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
    >
      {/* Full screen backdrop with blur */}
      <div
        className="fixed inset-0 bg-secondary-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleSkip}
      />

      {/* Spotlight cutout around target element */}
      {spotlightStyle && (
        <div
          aria-hidden="true"
          className="fixed pointer-events-none transition-all duration-300 ease-out ring-2 ring-primary-500/80 z-[9998]"
          style={spotlightStyle}
        />
      )}

      {/* Popover Card */}
      <div
        className="rounded-3xl border border-secondary-200/90 bg-white shadow-2xl shadow-secondary-950/25 p-4 sm:p-7 max-h-[92vh] overflow-y-auto flex flex-col justify-between transition-all duration-200"
        ref={popoverRef}
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header row: Category Pill + Progress bar + Close */}
          <div className="flex items-center justify-between gap-3 border-b border-secondary-100 pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${currentStep.badgeColor}`}
              >
                <SparkleIcon className="h-3 w-3" />
                <span>{currentStep.category}</span>
              </span>
              <span className="text-xs font-bold text-secondary-400">
                {currentStepIndex + 1} of {totalSteps}
              </span>
            </div>

            <button
              aria-label="Skip tour and close"
              className="rounded-xl p-1.5 text-secondary-400 transition hover:bg-secondary-100 hover:text-secondary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={handleSkip}
              type="button"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Progress track */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary-100">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Main Title & Description */}
          <div className="mt-5">
            <h3 className="text-lg sm:text-xl font-extrabold text-secondary-950 tracking-tight leading-snug">
              {currentStep.title}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-secondary-600 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Highlights checklist */}
          {currentStep.highlights && currentStep.highlights.length > 0 && (
            <div className="mt-4 rounded-2xl bg-secondary-50/70 border border-secondary-100 p-3.5">
              <ul className="space-y-2 text-xs text-secondary-700 font-medium">
                {currentStep.highlights.map((item, idx) => (
                  <li className="flex items-start gap-2" key={idx}>
                    <CheckIcon className="h-3.5 w-3.5 text-primary-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-secondary-100 flex items-center justify-between gap-3">
          <button
            className="text-xs font-semibold text-secondary-400 hover:text-secondary-600 transition"
            onClick={handleSkip}
            type="button"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                className="inline-flex items-center gap-1 rounded-xl border border-secondary-200 px-3 py-2 text-xs font-bold text-secondary-700 hover:bg-secondary-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={handlePrev}
                type="button"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 px-5 py-2 text-xs font-extrabold text-white shadow-md shadow-primary-500/20 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={handleNext}
              type="button"
            >
              <span>{currentStep.primaryAction}</span>
              {currentStepIndex < totalSteps - 1 ? (
                <ArrowRightIcon className="h-3.5 w-3.5" />
              ) : (
                <BadgeCheckIcon className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
