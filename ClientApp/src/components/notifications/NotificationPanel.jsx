import { useEffect, useMemo, useRef, useState } from 'react'

function formatNotificationTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diffSec = Math.max(0, Math.floor((now - date) / 1000))

  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 172800) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getTypeConfig(type) {
  switch (type) {
    case 'deadline_overdue':
      return {
        label: 'Overdue',
        badgeClass: 'bg-danger-100 text-danger-700 border-danger-200',
        iconBg: 'bg-danger-50 text-danger-600',
      }
    case 'deadline_1d':
    case 'deadline_3d':
      return {
        label: 'Due Soon',
        badgeClass: 'bg-warning-100 text-warning-800 border-warning-200',
        iconBg: 'bg-warning-50 text-warning-600',
      }
    case 'deadline_7d':
    case 'deadline_30d':
      return {
        label: 'Deadline',
        badgeClass: 'bg-primary-50 text-primary-700 border-primary-200',
        iconBg: 'bg-primary-50 text-primary-600',
      }
    case 'scholarship_deadline':
      return {
        label: 'Scholarship',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        iconBg: 'bg-amber-50 text-amber-600',
      }
    case 'application_status':
      return {
        label: 'Application',
        badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        iconBg: 'bg-indigo-50 text-indigo-600',
      }
    case 'profile_reminder':
      return {
        label: 'Profile',
        badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
        iconBg: 'bg-purple-50 text-purple-600',
      }
    case 'subscription':
      return {
        label: 'Subscription',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        iconBg: 'bg-emerald-50 text-emerald-600',
      }
    default:
      return {
        label: 'Update',
        badgeClass: 'bg-secondary-100 text-secondary-700 border-secondary-200',
        iconBg: 'bg-secondary-100 text-secondary-600',
      }
  }
}

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  isLoading = false,
  connectionStatus = 'connected',
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNavigate,
}) {
  const panelRef = useRef(null)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'unread' | 'deadlines'
  const [styleOffset, setStyleOffset] = useState({})

  // Viewport edge collision detection to prevent any clipping on mobile, tablet or desktop
  useEffect(() => {
    if (!isOpen) {
      setStyleOffset({})
      return undefined
    }

    const clampToViewport = () => {
      const el = panelRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const padding = 12
      let deltaX = 0

      if (rect.left < padding) {
        deltaX = Math.round(padding - rect.left)
      } else if (rect.right > window.innerWidth - padding) {
        deltaX = Math.round(window.innerWidth - padding - rect.right)
      }

      if (deltaX !== 0) {
        setStyleOffset({ transform: `translateX(${deltaX}px)` })
      } else {
        setStyleOffset({})
      }
    }

    clampToViewport()
    const frameId = requestAnimationFrame(clampToViewport)
    window.addEventListener('resize', clampToViewport)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', clampToViewport)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Only close if not clicking the bell button (which toggles)
        const bell = document.querySelector('[data-testid="notification-bell-btn"]')
        if (bell && bell.contains(e.target)) return
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.isRead)
    }
    if (activeTab === 'deadlines') {
      return notifications.filter(
        (n) => n.type?.startsWith('deadline_') || n.type === 'scholarship_deadline'
      )
    }
    return notifications
  }, [notifications, activeTab])

  if (!isOpen) return null

  return (
    <div
      aria-label="Notifications panel"
      aria-modal="false"
      className="fixed inset-x-3 top-16 z-50 mt-2 sm:absolute sm:top-full sm:inset-x-auto sm:right-0 lg:left-0 lg:right-auto w-[min(24rem,calc(100vw-1.5rem))] max-w-sm sm:w-96 rounded-2xl border border-secondary-200/90 bg-white shadow-xl ring-1 ring-secondary-900/5 transition-all"
      data-testid="notification-panel"
      ref={panelRef}
      role="dialog"
      style={styleOffset}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-secondary-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-secondary-950">Notifications</h2>
          {unreadCount > 0 && (
            <span
              className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-bold text-primary-800"
              data-testid="panel-unread-pill"
            >
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              className="rounded px-2 py-1 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              data-testid="panel-mark-all-read-btn"
              onClick={onMarkAllAsRead}
              type="button"
            >
              Mark all read
            </button>
          )}
          <button
            aria-label="Close notification panel"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-secondary-400 transition hover:bg-secondary-100 hover:text-secondary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            data-testid="panel-close-btn"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-secondary-100 px-4 pt-1">
        <button
          className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
            activeTab === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-secondary-500 hover:text-secondary-800'
          }`}
          data-testid="tab-all"
          onClick={() => setActiveTab('all')}
          type="button"
        >
          All ({notifications.length})
        </button>
        <button
          className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
            activeTab === 'unread'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-secondary-500 hover:text-secondary-800'
          }`}
          data-testid="tab-unread"
          onClick={() => setActiveTab('unread')}
          type="button"
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
            activeTab === 'deadlines'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-secondary-500 hover:text-secondary-800'
          }`}
          data-testid="tab-deadlines"
          onClick={() => setActiveTab('deadlines')}
          type="button"
        >
          Deadlines
        </button>
      </div>

      {/* List Container */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-secondary-100" data-testid="notification-items-list">
        {isLoading && notifications.length === 0 ? (
          <div className="p-8 text-center" data-testid="panel-loading-state">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            <p className="mt-2 text-xs text-secondary-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center" data-testid="panel-empty-state">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-secondary-400">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-3 text-xs font-semibold text-secondary-800">
              {activeTab === 'unread' ? "You're all caught up!" : 'No notifications yet'}
            </p>
            <p className="mt-1 text-[11px] text-secondary-500">
              {activeTab === 'unread'
                ? 'No unread notifications at the moment.'
                : 'Deadline reminders and platform alerts will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const config = getTypeConfig(notification.type)
            return (
              <div
                className={`group relative flex items-start gap-3 p-3.5 transition hover:bg-secondary-50/70 ${
                  !notification.isRead ? 'bg-primary-50/25' : ''
                }`}
                data-testid={`notification-item-${notification.id}`}
                key={notification.id}
              >
                {/* Type Icon Badge */}
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.iconBg}`}>
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    {notification.type === 'deadline_overdue' ? (
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                    ) : notification.type?.startsWith('deadline_') ? (
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    ) : notification.type === 'scholarship_deadline' ? (
                      <path d="M12 4 2.8 8.6 12 13.2l9.2-4.6z M6.4 10.7v4.1c0 1.6 2.5 2.9 5.6 2.9s5.6-1.3 5.6-2.9v-4.1" strokeLinecap="round" strokeLinejoin="round" />
                    ) : notification.type === 'profile_reminder' ? (
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex rounded border px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-secondary-400">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-600 shrink-0" data-testid="unread-dot" />
                    )}
                  </div>

                  <p className="mt-1 text-xs font-semibold text-secondary-900 leading-snug">
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-secondary-600 line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>

                  {/* Contextual Action Link */}
                  {notification.targetPage && (
                    <button
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 transition hover:text-primary-700 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                      data-testid={`action-link-${notification.id}`}
                      onClick={() => {
                        if (!notification.isRead) {
                          onMarkAsRead?.(notification.id)
                        }
                        onClose?.()
                        onNavigate?.(notification.targetPage, notification.targetId)
                      }}
                      type="button"
                    >
                      <span>Open {notification.targetPage}</span>
                      <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Quick Item Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                  {!notification.isRead && (
                    <button
                      aria-label="Mark notification as read"
                      className="rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-primary-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                      data-testid={`mark-read-btn-${notification.id}`}
                      onClick={() => onMarkAsRead?.(notification.id)}
                      title="Mark as read"
                      type="button"
                    >
                      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  <button
                    aria-label="Delete notification"
                    className="rounded p-1 text-secondary-400 hover:bg-secondary-100 hover:text-danger-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-danger-500"
                    data-testid={`delete-btn-${notification.id}`}
                    onClick={() => onDelete?.(notification.id)}
                    title="Dismiss"
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer / Status */}
      <div className="flex items-center justify-between border-t border-secondary-100 bg-secondary-50/60 px-4 py-2 text-[10px] text-secondary-500 rounded-b-2xl">
        <div className="flex items-center gap-1.5" data-testid="panel-connection-status">
          <span
            className={`h-2 w-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500'
                : connectionStatus === 'reconnecting' || connectionStatus === 'connecting'
                ? 'bg-warning-500 animate-pulse'
                : 'bg-secondary-400'
            }`}
          />
          <span>
            {connectionStatus === 'connected'
              ? 'Real-time connected'
              : connectionStatus === 'reconnecting' || connectionStatus === 'connecting'
              ? 'Connecting updates...'
              : 'Auto-sync active'}
          </span>
        </div>
        <span>FutureWings Intelligence</span>
      </div>
    </div>
  )
}
