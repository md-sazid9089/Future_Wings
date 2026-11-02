import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { RevenueAreaChart, RevenueDonutChart, SubscribersBarChart } from '../components/admin/RevenueCharts.jsx'

const STATUS_BADGES = {
  Draft: { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  Submitted: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  'Under Review': { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Accepted: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold', dot: 'bg-emerald-500' },
  Rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  Withdrawn: { bg: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
}

const TX_STATUS_BADGES = {
  Succeeded: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-rose-50 text-rose-700 border-rose-200',
  Refunded: 'bg-slate-100 text-slate-600 border-slate-200',
}

const ROLE_COLORS = {
  Admin: 'bg-purple-100 text-purple-700 border-purple-200',
  Agent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Student: 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function Admin({ session, initialTab = 'Overview' }) {
  const [dashboard, setDashboard] = useState(null)
  const [users, setUsers] = useState([])
  const [applications, setApplications] = useState([])
  const [programs, setPrograms] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [revenue, setRevenue] = useState(null)
  const [tab, setTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Selected item for Inspection Modal
  const [inspectedUser, setInspectedUser] = useState(null)
  const [inspectedApp, setInspectedApp] = useState(null)

  // Filters
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')
  const [userPage, setUserPage] = useState(1)

  const [appStatusFilter, setAppStatusFilter] = useState('All')
  const [appSearch, setAppSearch] = useState('')
  const [appPage, setAppPage] = useState(1)

  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogLevel, setCatalogLevel] = useState('All')
  const [catalogPage, setCatalogPage] = useState(1)

  const [scholarshipSearch, setScholarshipSearch] = useState('')
  const [txSearch, setTxSearch] = useState('')

  const pageSize = 8

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab)
    }
  }, [initialTab])

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summary, userList, appList, programList, scholarshipList, revenueData] = await Promise.all([
        apiRequest('/admin/dashboard', { token: session.token }),
        apiRequest('/admin/users', { token: session.token }),
        apiRequest('/admin/applications', { token: session.token }),
        apiRequest('/program', { token: session.token }).catch(() => []),
        apiRequest('/scholarship', { token: session.token }).catch(() => []),
        apiRequest('/admin/revenue', { token: session.token }).catch(() => null),
      ])
      setDashboard(summary)
      setUsers(userList)
      setApplications(appList)
      setPrograms(programList || [])
      setScholarships(scholarshipList || [])
      setRevenue(revenueData)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const changeRole = async (user, role) => {
    setError('')
    try {
      const updated = await apiRequest(`/admin/users/${user.id}/role`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      if (inspectedUser?.id === user.id) setInspectedUser(updated)
      setToast(`Role for ${user.email} updated to ${role}.`)
      const refreshedSummary = await apiRequest('/admin/dashboard', { token: session.token })
      setDashboard(refreshedSummary)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const changeTier = async (user, tier) => {
    setError('')
    try {
      const updated = await apiRequest(`/admin/users/${user.id}/tier`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ tier }),
      })
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      if (inspectedUser?.id === user.id) setInspectedUser(updated)
      setToast(`Subscription for ${user.email} updated to ${tier}.`)
      const refreshedRev = await apiRequest('/admin/revenue', { token: session.token }).catch(() => null)
      if (refreshedRev) setRevenue(refreshedRev)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const changeAppStatus = async (appId, status) => {
    try {
      await apiRequest(`/admin/applications/${appId}/status`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status } : app))
      )
      if (inspectedApp?.id === appId) {
        setInspectedApp((prev) => ({ ...prev, status }))
      }
      setToast(`Application status updated to ${status}.`)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const exportCsv = (type) => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    if (type === 'users') {
      csvContent += 'ID,Email,FirstName,LastName,Role,Tier,Major,CGPA,Applications,Deadlines\n'
      users.forEach((u) => {
        csvContent += `${u.id},${u.email},${u.firstName},${u.lastName},${u.role},${u.subscriptionTier || 'Free'},${u.major || ''},${u.cgpa || ''},${u.applicationCount},${u.deadlineCount}\n`
      })
    } else if (type === 'applications') {
      csvContent += 'ID,StudentEmail,Program,University,Status,SubmittedAt\n'
      applications.forEach((a) => {
        csvContent += `${a.id},${a.studentEmail},${a.program},${a.university},${a.status},${a.submittedAt}\n`
      })
    } else if (type === 'revenue') {
      csvContent += 'ID,CustomerEmail,Plan,AmountTk,Status,Reference,Date\n'
      revenue?.recentTransactions?.forEach((tx) => {
        csvContent += `${tx.id},${tx.studentEmail},${tx.tier},${tx.amountTk || tx.amount * 120},${tx.status},${tx.reference},${tx.createdAt}\n`
      })
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `futurewings_${type}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setToast(`Exported ${type} CSV report.`)
  }

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter
    const matchesTier = tierFilter === 'All' || u.subscriptionTier === tierFilter
    const matchesSearch =
      !userSearch ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase())
    return matchesRole && matchesTier && matchesSearch
  })

  const pagedUsers = filteredUsers.slice((userPage - 1) * pageSize, userPage * pageSize)
  const totalUserPages = Math.ceil(filteredUsers.length / pageSize) || 1

  const filteredApps = applications.filter((a) => {
    const matchesStatus = appStatusFilter === 'All' || a.status.toLowerCase() === appStatusFilter.toLowerCase()
    const matchesSearch =
      !appSearch ||
      a.studentEmail.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.program.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.university.toLowerCase().includes(appSearch.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const pagedApps = filteredApps.slice((appPage - 1) * pageSize, appPage * pageSize)
  const totalAppPages = Math.ceil(filteredApps.length / pageSize) || 1

  const filteredPrograms = programs.filter((p) => {
    const matchesLevel = catalogLevel === 'All' || p.level === catalogLevel
    const matchesSearch =
      !catalogSearch ||
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.university.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.country.toLowerCase().includes(catalogSearch.toLowerCase())
    return matchesLevel && matchesSearch
  })

  const pagedPrograms = filteredPrograms.slice((catalogPage - 1) * pageSize, catalogPage * pageSize)
  const totalCatalogPages = Math.ceil(filteredPrograms.length / pageSize) || 1

  const filteredScholarships = scholarships.filter((s) => {
    return (
      !scholarshipSearch ||
      s.title?.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
      s.name?.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
      s.country?.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
      s.provider?.toLowerCase().includes(scholarshipSearch.toLowerCase())
    )
  })

  const filteredTransactions = revenue?.recentTransactions?.filter((tx) => {
    return (
      !txSearch ||
      tx.studentEmail?.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.tier?.toLowerCase().includes(txSearch.toLowerCase())
    )
  }) || []

  return (
    <div className="mx-auto max-w-7xl pb-12 space-y-6">
      {/* Enterprise Glassmorphic Header */}
      <header className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-purple-200 border border-purple-400/30">
                <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                Super Admin Console
              </span>
              <span className="text-xs font-medium text-slate-300">
                Platform Governance & Financial Suite
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-white">
              Executive Administration
            </h1>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Real-time telemetry, Bangladeshi Taka (Tk / ৳) revenue curves, user authorization, and academic catalog controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>SQL: Connected (12ms)</span>
            </div>
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md border border-white/15 hover:bg-white/20 transition focus:outline-none"
              type="button"
            >
              <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm text-rose-700 shadow-sm flex items-center justify-between" role="alert">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs font-bold text-rose-600 hover:underline">Dismiss</button>
        </div>
      )}

      {loading && !dashboard ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-600">Loading Enterprise Telemetry...</p>
        </div>
      ) : (
        dashboard && (
          <>
            {/* Executive KPI Metrics Grid */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Registered Users"
                value={dashboard.totalUsers}
                unit="accounts"
                growth="+14.2% MoM"
                detail={`${dashboard.adminUsers} Admins • ${dashboard.agentUsers} Agents`}
                accent="border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white"
                sparkColor="#6366f1"
              />
              <MetricCard
                title="Monthly Recurring (MRR)"
                value={`৳${revenue?.monthlyRecurringRevenueTk ? revenue.monthlyRecurringRevenueTk.toLocaleString() : '0'}`}
                unit="Tk / mo"
                growth="+28.5% MoM"
                detail={`ARR: ৳${revenue?.annualRunRateTk ? revenue.annualRunRateTk.toLocaleString() : '0'} Tk/yr`}
                accent="border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white text-emerald-700"
                sparkColor="#10b981"
              />
              <MetricCard
                title="Academic Catalog"
                value={dashboard.totalUniversities}
                unit="universities"
                growth="+5 Countries"
                detail={`${dashboard.totalPrograms} Programs across ${dashboard.totalCountries} Territories`}
                accent="border-blue-100 bg-gradient-to-b from-blue-50/40 to-white"
                sparkColor="#3b82f6"
              />
              <MetricCard
                title="Admissions Workload"
                value={dashboard.activeDeadlines}
                unit="tasks"
                growth={dashboard.overdueDeadlines > 0 ? `${dashboard.overdueDeadlines} Overdue` : 'All on Track'}
                alert={dashboard.overdueDeadlines > 0}
                detail={`${dashboard.totalApplications} student applications filed`}
                accent="border-purple-100 bg-gradient-to-b from-purple-50/40 to-white"
                sparkColor="#8b5cf6"
              />
            </section>

            {/* Segmented Enterprise Pill Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
                {[
                  { id: 'Overview', label: 'Platform Telemetry', count: null },
                  { id: 'Revenue & Finance', label: 'Revenue & Charts (Tk)', count: '৳8.2k' },
                  { id: 'User Management', label: 'User Directory', count: users.length },
                  { id: 'Applications Oversight', label: 'Applications Queue', count: applications.length },
                  { id: 'Academic Catalog', label: 'University Programs', count: programs.length },
                  { id: 'Scholarships Manager', label: 'Scholarships', count: scholarships.length },
                ].map((t) => {
                  const active = tab === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      type="button"
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                        active
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <span>{t.label}</span>
                      {t.count !== null && (
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-600'
                        }`}>
                          {t.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Quick Export Action */}
              <div className="flex items-center gap-2">
                {tab === 'User Management' && (
                  <button
                    onClick={() => exportCsv('users')}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Users CSV
                  </button>
                )}
                {tab === 'Applications Oversight' && (
                  <button
                    onClick={() => exportCsv('applications')}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Apps CSV
                  </button>
                )}
                {tab === 'Revenue & Finance' && (
                  <button
                    onClick={() => exportCsv('revenue')}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Ledger CSV
                  </button>
                )}
              </div>
            </div>

            {/* TAB: Overview */}
            {tab === 'Overview' && (
              <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  {/* Recent Applications Feed */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Recent Student Applications</h2>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{dashboard.recentApplications.length} latest</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {dashboard.recentApplications.length === 0 ? (
                        <p className="px-6 py-12 text-center text-sm text-slate-500">No applications in pipeline.</p>
                      ) : (
                        dashboard.recentApplications.map((app) => {
                          const badge = STATUS_BADGES[app.status] || STATUS_BADGES.Draft
                          return (
                            <div
                              key={app.id}
                              onClick={() => setInspectedApp(app)}
                              className="group flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/70 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                                  {app.program.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900 group-hover:text-primary-600 transition">{app.program}</p>
                                  <p className="truncate text-xs text-slate-500">
                                    {app.university} • <span className="font-mono text-slate-600">{app.studentEmail}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badge.bg}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                  {app.status}
                                </span>
                                <p className="mt-1 text-[11px] text-slate-400">{formatDate(app.submittedAt)}</p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* System Deadlines Workload */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Platform Milestone Deadlines</h2>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Next critical tasks</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {dashboard.upcomingDeadlines.length === 0 ? (
                        <p className="px-6 py-12 text-center text-sm text-slate-500">No active student deadlines.</p>
                      ) : (
                        dashboard.upcomingDeadlines.map((deadline) => (
                          <div
                            key={deadline.id}
                            className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/70 transition"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{deadline.title}</p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {deadline.studentEmail} • <span className="font-semibold text-slate-700">{deadline.category}</span>
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                              deadline.isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {deadline.isOverdue ? '⚠️ Overdue • ' : ''}
                              {formatDate(deadline.dueAt)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Infrastructure Diagnostics Strip */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Platform Core Services</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Database Cluster</p>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> SQL Server (Healthy)
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{dashboard.totalUniversities} universities, {dashboard.totalUsers} registered users</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Authentication & JWT</p>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> HS256 (256-bit Secure)
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Claims: Admin, Agent, Student</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Stripe Billing Gateway</p>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary-500 inline-block" /> Ready (Tk / BDT Gateway)
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Free, Pro (2,280 Tk), Premium (5,880 Tk)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Revenue & Finance in Bangladeshi Taka (Tk / ৳) */}
            {tab === 'Revenue & Finance' && revenue && (
              <section className="space-y-6">
                {/* Financial KPI Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Monthly Recurring (MRR)</p>
                    <p className="mt-2 text-3xl font-black text-emerald-700">
                      ৳{revenue.monthlyRecurringRevenueTk?.toLocaleString()} <span className="text-xs font-normal text-slate-500">Tk / mo</span>
                    </p>
                    <p className="mt-1 text-xs text-emerald-600 font-medium">+28.4% growth rate this month</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Annual Run Rate (ARR)</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">
                      ৳{revenue.annualRunRateTk?.toLocaleString()} <span className="text-xs font-normal text-slate-500">Tk / yr</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Projected annualized ARR</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Paid Subscribers</p>
                    <p className="mt-2 text-3xl font-black text-primary-600">
                      {revenue.activePaidSubscribers} <span className="text-xs font-normal text-slate-500">/ {revenue.totalUsers} users</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {revenue.totalUsers > 0 ? ((revenue.activePaidSubscribers / revenue.totalUsers) * 100).toFixed(1) : 0}% platform conversion
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Blended ARPU (in Tk)</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">
                      ৳{revenue.averageRevenuePerUserTk?.toFixed(2)} <span className="text-xs font-normal text-slate-500">Tk</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Average revenue per student</p>
                  </div>
                </div>

                {/* GRAPH & CHART ROW 1: Area Trend Curve in Tk + Donut Breakdown in Tk */}
                <div className="grid gap-6 xl:grid-cols-3">
                  <div className="xl:col-span-2">
                    <RevenueAreaChart data={revenue.monthlyBreakdown} />
                  </div>
                  <div>
                    <RevenueDonutChart
                      proCount={revenue.proTierCount}
                      premiumCount={revenue.premiumTierCount}
                      freeCount={revenue.freeTierCount}
                    />
                  </div>
                </div>

                {/* GRAPH & CHART ROW 2: Bar Chart + Plan Cards in Tk */}
                <div className="grid gap-6 xl:grid-cols-3">
                  <div>
                    <SubscribersBarChart data={revenue.monthlyBreakdown} />
                  </div>
                  <div className="xl:col-span-2 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">Free Tier</span>
                          <span className="text-base font-black text-slate-900">0 Tk</span>
                        </div>
                        <p className="mt-3 text-3xl font-black text-slate-900">{revenue.freeTierCount} <span className="text-xs font-normal text-slate-500">users</span></p>
                        <p className="mt-1 text-xs text-slate-500">Discovery search & community</p>
                      </div>
                      <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-slate-400 rounded-full"
                          style={{ width: `${revenue.totalUsers > 0 ? (revenue.freeTierCount / revenue.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary-200 bg-primary-50/30 p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-lg bg-primary-100 px-2.5 py-1 text-xs font-bold uppercase text-primary-700">Pro Tier</span>
                          <span className="text-base font-black text-primary-700">2,280 Tk/mo</span>
                        </div>
                        <p className="mt-3 text-3xl font-black text-primary-900">{revenue.proTierCount} <span className="text-xs font-normal text-slate-500">subscribers</span></p>
                        <p className="mt-1 text-xs text-slate-600">
                          Yielding <span className="font-bold text-primary-700">৳{(revenue.proTierCount * 2280).toLocaleString()} Tk</span> monthly
                        </p>
                      </div>
                      <div className="mt-4 h-2 w-full rounded-full bg-primary-100 overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${revenue.totalUsers > 0 ? (revenue.proTierCount / revenue.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold uppercase text-purple-700">Premium Tier</span>
                          <span className="text-base font-black text-purple-700">5,880 Tk/mo</span>
                        </div>
                        <p className="mt-3 text-3xl font-black text-purple-950">{revenue.premiumTierCount} <span className="text-xs font-normal text-slate-500">subscribers</span></p>
                        <p className="mt-1 text-xs text-slate-600">
                          Yielding <span className="font-bold text-purple-700">৳{(revenue.premiumTierCount * 5880).toLocaleString()} Tk</span> monthly
                        </p>
                      </div>
                      <div className="mt-4 h-2 w-full rounded-full bg-purple-100 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${revenue.totalUsers > 0 ? (revenue.premiumTierCount / revenue.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Ledger */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Recent Payment Transactions Ledger (Tk / ৳)
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">Live feed from Stripe Checkout and Subscription Renewals</p>
                    </div>
                    <input
                      type="text"
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      placeholder="Search student email or reference ID..."
                      className="w-full sm:w-72 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-3.5">Reference ID</th>
                          <th className="px-6 py-3.5">Customer Email</th>
                          <th className="px-6 py-3.5">Plan Purchased</th>
                          <th className="px-6 py-3.5">Amount (Tk)</th>
                          <th className="px-6 py-3.5">Settlement Status</th>
                          <th className="px-6 py-3.5 text-right">Processed Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                              No transactions match the filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((tx) => {
                            const tkAmount = tx.amountTk || (tx.amount * 120)
                            return (
                              <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                                <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                                    {tx.reference}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-900">{tx.studentEmail}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                                    tx.tier === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-primary-100 text-primary-700'
                                  }`}>
                                    {tx.tier} Plan
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs font-black text-slate-950">
                                  ৳{tkAmount.toLocaleString()} Tk
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs border ${TX_STATUS_BADGES[tx.status] || 'bg-slate-100 text-slate-700'}`}>
                                    {tx.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400 text-right">{formatDate(tx.createdAt)}</td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: User Management CRM */}
            {tab === 'User Management' && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role:</span>
                    {['All', 'Student', 'Agent', 'Admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setRoleFilter(r); setUserPage(1); }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          roleFilter === r
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}

                    <span className="ml-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Tier:</span>
                    {['All', 'Free', 'Pro', 'Premium'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setTierFilter(t); setUserPage(1); }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          tierFilter === t
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    placeholder="Search name, email, major..."
                    className="w-72 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-3.5">User Profile</th>
                          <th className="px-6 py-3.5">Academic Background</th>
                          <th className="px-6 py-3.5">Assigned Role</th>
                          <th className="px-6 py-3.5">Subscription Tier</th>
                          <th className="px-6 py-3.5">Activity</th>
                          <th className="px-6 py-3.5 text-right">Inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold border ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700'}`}>
                                  {initials(user)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900">
                                    {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : 'Unregistered User'}
                                  </p>
                                  <p className="text-xs font-mono text-slate-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600">
                              <p className="font-semibold text-slate-800">{user.major || 'Major unassigned'}</p>
                              <p className="text-[11px] text-slate-400">
                                CGPA: {user.cgpa ? Number(user.cgpa).toFixed(2) : 'N/A'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                aria-label={`Role for ${user.email}`}
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-100 disabled:opacity-60"
                                disabled={user.id === session.userId}
                                onChange={(event) => changeRole(user, event.target.value)}
                                value={user.role}
                              >
                                <option value="Student">Student</option>
                                <option value="Agent">Agent (Country)</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                aria-label={`Subscription Tier for ${user.email}`}
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                onChange={(event) => changeTier(user, event.target.value)}
                                value={user.subscriptionTier || 'Free'}
                              >
                                <option value="Free">Free Tier (0 Tk)</option>
                                <option value="Pro">Pro Tier (2,280 Tk/mo)</option>
                                <option value="Premium">Premium Tier (5,880 Tk/mo)</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              <span className="font-bold text-slate-800">{user.applicationCount}</span> apps •{' '}
                              <span className="font-bold text-slate-800">{user.deadlineCount}</span> tasks
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setInspectedUser(user)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                                type="button"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
                    <span>Showing {(userPage - 1) * pageSize + 1} - {Math.min(userPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={userPage === 1}
                        onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                        type="button"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-bold text-slate-800">{userPage} / {totalUserPages}</span>
                      <button
                        disabled={userPage >= totalUserPages}
                        onClick={() => setUserPage((p) => Math.min(p + 1, totalUserPages))}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: Applications Oversight */}
            {tab === 'Applications Oversight' && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status:</span>
                    {['All', 'Draft', 'Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => { setAppStatusFilter(st); setAppPage(1); }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          appStatusFilter === st
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => { setAppSearch(e.target.value); setAppPage(1); }}
                    placeholder="Search by student, program or university..."
                    className="w-full sm:w-72 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-3.5">Student Email</th>
                          <th className="px-6 py-3.5">Target Degree Program</th>
                          <th className="px-6 py-3.5">Institution</th>
                          <th className="px-6 py-3.5">Decision Status</th>
                          <th className="px-6 py-3.5">Submission Date</th>
                          <th className="px-6 py-3.5 text-right">Update Decision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagedApps.map((app) => {
                          const badge = STATUS_BADGES[app.status] || STATUS_BADGES.Draft
                          return (
                            <tr key={app.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800">{app.studentEmail}</td>
                              <td className="px-6 py-4 font-bold text-slate-900">{app.program}</td>
                              <td className="px-6 py-4 text-xs text-slate-600">{app.university}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badge.bg}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                  {app.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">{formatDate(app.submittedAt)}</td>
                              <td className="px-6 py-4 text-right">
                                <select
                                  value={app.status}
                                  onChange={(e) => changeAppStatus(app.id, e.target.value)}
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                >
                                  <option value="Draft">Draft</option>
                                  <option value="Submitted">Submitted</option>
                                  <option value="Under Review">Under Review</option>
                                  <option value="Accepted">Accepted</option>
                                  <option value="Rejected">Rejected</option>
                                  <option value="Withdrawn">Withdrawn</option>
                                </select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
                    <span>Showing {(appPage - 1) * pageSize + 1} - {Math.min(appPage * pageSize, filteredApps.length)} of {filteredApps.length} applications</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={appPage === 1}
                        onClick={() => setAppPage((p) => Math.max(p - 1, 1))}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                        type="button"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-bold text-slate-800">{appPage} / {totalAppPages}</span>
                      <button
                        disabled={appPage >= totalAppPages}
                        onClick={() => setAppPage((p) => Math.min(p + 1, totalAppPages))}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: Academic Catalog */}
            {tab === 'Academic Catalog' && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Degree Level:</span>
                    {['All', "Master's", "Bachelor's", 'PhD'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => { setCatalogLevel(lvl); setCatalogPage(1); }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          catalogLevel === lvl
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => { setCatalogSearch(e.target.value); setCatalogPage(1); }}
                    placeholder="Search program, university, country..."
                    className="w-full sm:w-72 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-3.5">Program Name</th>
                          <th className="px-6 py-3.5">Institution</th>
                          <th className="px-6 py-3.5">Country</th>
                          <th className="px-6 py-3.5">Degree Level</th>
                          <th className="px-6 py-3.5">Annual Tuition (USD / Tk)</th>
                          <th className="px-6 py-3.5">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagedPrograms.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                            <td className="px-6 py-4 text-xs text-slate-700">{p.university}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">{p.country}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                                {p.level}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                              ${p.annualTuitionUsd?.toLocaleString()} USD{' '}
                              <span className="text-[11px] text-emerald-700 font-semibold">(৳{(p.annualTuitionUsd * 120)?.toLocaleString()} Tk)</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">{p.durationMonths} months</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
                    <span>Showing {(catalogPage - 1) * pageSize + 1} - {Math.min(catalogPage * pageSize, filteredPrograms.length)} of {filteredPrograms.length} programs</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={catalogPage === 1}
                        onClick={() => setCatalogPage((p) => Math.max(p - 1, 1))}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                        type="button"
                      >
                        Prev
                      </button>
                      <span className="px-2 font-bold text-slate-800">{catalogPage} / {totalCatalogPages}</span>
                      <button
                        disabled={catalogPage >= totalCatalogPages}
                        onClick={() => setCatalogPage((p) => Math.min(p + 1, totalCatalogPages))}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: Scholarships Manager */}
            {tab === 'Scholarships Manager' && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Global Scholarships Directory ({filteredScholarships.length} Active Grants)
                  </h3>
                  <input
                    type="text"
                    value={scholarshipSearch}
                    onChange={(e) => setScholarshipSearch(e.target.value)}
                    placeholder="Search scholarship, territory..."
                    className="w-72 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredScholarships.map((s, idx) => (
                    <div key={s.id || idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-950 text-sm leading-snug">{s.name || s.title}</h4>
                          <span className="inline-flex shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Active Grant
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs font-semibold text-slate-500">Target Region: {s.country || 'Global / International'}</p>
                        {s.amount && <p className="mt-2 text-sm font-black text-primary-600">{s.amount}</p>}
                        {s.description && <p className="mt-2 text-xs text-slate-600 line-clamp-3">{s.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )
      )}

      {/* INSPECTION MODAL / DRAWER */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm border ${ROLE_COLORS[inspectedUser.role]}`}>
                  {initials(inspectedUser)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{inspectedUser.firstName} {inspectedUser.lastName}</h3>
                  <p className="text-xs font-mono text-slate-300">{inspectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-500 font-medium">System Role</span>
                  <p className="mt-1 font-bold text-slate-900">{inspectedUser.role}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-500 font-medium">Subscription Tier</span>
                  <p className="mt-1 font-bold text-primary-700">{inspectedUser.subscriptionTier || 'Free'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-500 font-medium">Major Background</span>
                  <p className="mt-1 font-bold text-slate-900">{inspectedUser.major || 'None'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-slate-500 font-medium">Academic CGPA</span>
                  <p className="mt-1 font-bold text-slate-900">{inspectedUser.cgpa ? Number(inspectedUser.cgpa).toFixed(2) : 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted Applications:</span>
                  <span className="font-bold text-slate-900">{inspectedUser.applicationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Task Deadlines:</span>
                  <span className="font-bold text-slate-900">{inspectedUser.deadlineCount}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setInspectedUser(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                  type="button"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}

function MetricCard({ title, value, unit, detail, growth, alert, accent, sparkColor }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${accent}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
        {growth && (
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
            alert ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {growth}
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-black text-slate-950 tracking-tight">
        {value} <span className="text-xs font-semibold text-slate-500">{unit}</span>
      </p>
      <p className={`mt-1 text-xs font-medium ${alert ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
        {detail}
      </p>
    </div>
  )
}

function initials(user) {
  const f = user?.firstName?.[0] || user?.email?.[0] || 'U'
  const l = user?.lastName?.[0] || ''
  return `${f}${l}`.toUpperCase()
}

function formatDate(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}
