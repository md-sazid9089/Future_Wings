import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgramDetailsModal from './components/discovery/ProgramDetailsModal.jsx'
import NotificationPanel from './components/notifications/NotificationPanel.jsx'
import ProfileCompletionPrompt from './components/profile/ProfileCompletionPrompt.jsx'
import ReviewCard from './components/community/ReviewCard.jsx'
import DeadlineRow from './components/dashboard/DeadlineRow.jsx'

describe('Responsive Design Audit & Mobile Viewport Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ProgramDetailsModal renders responsive max-height and scrollable modal container', () => {
    const mockProgram = {
      id: 101,
      name: 'Master of Science in Artificial Intelligence',
      university: 'University of Toronto',
      country: 'Canada',
      city: 'Toronto',
      level: "Master's",
      annualTuitionUsd: 28000,
      durationMonths: 24,
      tags: ['AI', 'STEM', 'Machine Learning'],
      overview: 'Rigorous graduate curriculum in machine intelligence and deep learning.',
      admissionRequirements: 'Four-year bachelor degree with minimum 3.3 CGPA.',
      careerOutcomes: 'Machine Learning Engineer, Data Scientist, Research Scientist.',
      isSaved: false,
      isTracked: false,
    }

    render(
      <ProgramDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        program={mockProgram}
        session={{ token: 'mock-token', userId: 1 }}
      />
    )

    const modal = screen.getByTestId('program-details-modal')
    expect(modal).toBeInTheDocument()

    // Inner modal container must have responsive max-height and overflow
    const container = modal.querySelector('.max-h-\\[90vh\\]')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('overflow-hidden')

    // Action buttons must be present and accessible
    const returnBtn = screen.getByTestId('return-search-btn')
    expect(returnBtn).toBeInTheDocument()
    expect(returnBtn.className).toContain('min-h-[44px]')

    const trackBtn = screen.getByTestId('details-add-application-btn')
    expect(trackBtn).toBeInTheDocument()
    expect(trackBtn.className).toContain('min-h-[44px]')
  })

  it('NotificationPanel renders responsive width constrained for mobile viewports', () => {
    const mockNotifications = [
      {
        id: 1,
        title: 'Application deadline soon',
        message: 'Your fall intake deadline is due in 3 days.',
        type: 'deadline_3d',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]

    render(
      <NotificationPanel
        isOpen={true}
        onClose={vi.fn()}
        notifications={mockNotifications}
        unreadCount={1}
        isLoading={false}
      />
    )

    const panel = screen.getByTestId('notification-panel')
    expect(panel).toBeInTheDocument()

    // Must be responsive-constrained on mobile (not breaking viewport width)
    expect(panel.className).toContain('w-[min(24rem,calc(100vw-1.5rem))]')
    expect(panel.className).toContain('sm:w-96')
  })

  it('ProfileCompletionPrompt modal scales responsibly and allows vertical scrolling on short screens', () => {
    const mockCompletion = {
      isComplete: false,
      completedCount: 2,
      totalRequired: 4,
      completionPercent: 50,
      fieldStatus: {
        cgpa: true,
        major: true,
        budgetUsd: false,
        degreeLevel: false,
      },
    }

    render(
      <ProfileCompletionPrompt
        profileCompletion={mockCompletion}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />
    )

    const modal = screen.getByTestId('profile-completion-prompt-modal')
    expect(modal).toBeInTheDocument()

    // Check that inner container supports max-height and scrolling
    const modalBox = modal.firstChild
    expect(modalBox.className).toContain('max-h-[92vh]')
    expect(modalBox.className).toContain('overflow-y-auto')

    // Action buttons must have responsive widths
    const completeBtn = screen.getByTestId('profile-prompt-complete-btn')
    expect(completeBtn.className).toContain('w-full')
    expect(completeBtn.className).toContain('sm:w-auto')
  })

  it('ReviewCard breaks long unbreakable strings to prevent layout overflow', () => {
    const longStringReview = {
      id: 99,
      reviewerName: 'SuperLongStudentNameWithNoSpacesToTestOverflowPrevention',
      score: 5,
      comment: 'SuperLongUnbrokenStringWithoutAnyWhitespaceCharactersToVerifyBreakWordsClassWorksProperlyAcrossViewports',
      isMine: false,
    }

    render(<ReviewCard review={longStringReview} />)

    const commentEl = screen.getByTestId('review-comment')
    expect(commentEl).toBeInTheDocument()
    expect(commentEl.className).toContain('break-words')

    const reviewerName = screen.getByText('SuperLongStudentNameWithNoSpacesToTestOverflowPrevention')
    expect(reviewerName.className).toContain('break-words')
  })

  it('DeadlineRow renders with break-words and responsive touch targets', () => {
    const mockDeadline = {
      id: 42,
      title: 'VeryLongDeadlineTitleWithExtremelySpecificAcademicMilestoneNotesIncluded',
      category: 'Application',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      isCompleted: false,
      notes: 'SuperLongUnbrokenNotesStringTestingResponsiveWrappingBehaviourAcrossMobileViewports',
    }

    render(
      <DeadlineRow
        deadline={mockDeadline}
        now={Date.now()}
        pending={false}
        justAdded={false}
        onDelete={vi.fn()}
        onToggle={vi.fn()}
      />
    )

    const titleEl = screen.getByRole('heading', { level: 3 })
    expect(titleEl.className).toContain('break-words')
    expect(screen.getByText(mockDeadline.notes).className).toContain('break-words')
  })
})
