import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import {
  PipelineFunnel,
  TopInstitutionsChart,
  DegreeDistributionDonut,
  CommissionMilestoneBar,
} from '../components/agent/AgentCharts.jsx'

import { STATUS_BADGES, COUNTRY_FLAGS } from '../components/agent/AgentConstants.js'

export default function AgentPanel({ session }) {
  // Navigation & State
  const [activeTab, setActiveTab] = useState('crm') // 'crm' | 'analytics' | 'catalog' | 'scholarships' | 'commission'
  const [countries, setCountries] = useState([])
  const [selectedCountryId, setSelectedCountryId] = useState('')
  const [overview, setOverview] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [universities, setUniversities] = useState([])
  const [programs, setPrograms] = useState([])
  const [scholarships, setScholarships] = useState([])

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [programSearch, setProgramSearch] = useState('')
  const [catalogUniFilter, setCatalogUniFilter] = useState('All')

  // Selection for Batch Actions
  const [selectedAppIds, setSelectedAppIds] = useState([])
  const [isBatchUpdating, setIsBatchUpdating] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Async states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  // Modals & Drawers
  const [inspectingApp, setInspectingApp] = useState(null)
  const [showAddProgram, setShowAddProgram] = useState(false)
  const [showAddUniversity, setShowAddUniversity] = useState(false)
  const [showAddScholarship, setShowAddScholarship] = useState(false)
  const [emailModalApp, setEmailModalApp] = useState(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  // Form states
  const [newUni, setNewUni] = useState({ name: '', city: '' })
  const [newProgram, setNewProgram] = useState({
    universityId: '',
    name: '',
    level: "Master's",
    annualTuitionUsd: 25000,
    durationMonths: 24,
    tags: 'STEM, Research',
  })
  const [newScholarship, setNewScholarship] = useState({ name: '' })

  // Load territory data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const countryList = await apiRequest('/agent/countries', { token: session.token })
      setCountries(countryList)

      const activeCountryId = selectedCountryId
        ? parseInt(selectedCountryId, 10)
        : countryList[0]?.id || null

      if (!selectedCountryId && activeCountryId) {
        setSelectedCountryId(activeCountryId.toString())
      }

      const q = activeCountryId ? ('?countryId=' + activeCountryId) : ''
      const [overviewData, applicantList, uniList, progList, scholarList] = await Promise.all([
        apiRequest('/agent/overview' + q, { token: session.token }),
        apiRequest('/agent/applicants' + q, { token: session.token }),
        apiRequest('/agent/universities' + q, { token: session.token }),
        apiRequest('/agent/programs' + q, { token: session.token }),
        apiRequest('/agent/scholarships' + q, { token: session.token }),
      ])

      setOverview(overviewData)
      setApplicants(applicantList)
      setUniversities(uniList)
      setPrograms(progList)
      setScholarships(scholarList)
      setSelectedAppIds([])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [session.token, selectedCountryId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCountryChange = (e) => {
    setSelectedCountryId(e.target.value)
    setCurrentPage(1)
  }

  // Single Status Change
  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId)
    try {
      await apiRequest('/agent/applications/' + applicationId + '/status', {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setApplicants((prev) =>
        prev.map((app) => (app.applicationId === applicationId ? { ...app, status: newStatus } : app))
      )
      if (inspectingApp && inspectingApp.applicationId === applicationId) {
        setInspectingApp((prev) => ({ ...prev, status: newStatus }))
      }
      setToast('Application status updated to "' + newStatus + '"!')

      // Refresh overview stats asynchronously
      const updatedOverview = await apiRequest(
        '/agent/overview' + (selectedCountryId ? '?countryId=' + selectedCountryId : ''),
        { token: session.token }
      )
      setOverview(updatedOverview)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // Batch Status Update
  const handleBatchStatus = async (newStatus) => {
    if (selectedAppIds.length === 0) return
    setIsBatchUpdating(true)
    try {
      await apiRequest('/agent/applications/batch-status', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ applicationIds: selectedAppIds, status: newStatus }),
      })
      setApplicants((prev) =>
        prev.map((app) =>
          selectedAppIds.includes(app.applicationId) ? { ...app, status: newStatus } : app
        )
      )
      setToast('Updated ' + selectedAppIds.length + ' applications to "' + newStatus + '"!')
      setSelectedAppIds([])
      const updatedOverview = await apiRequest(
        '/agent/overview' + (selectedCountryId ? '?countryId=' + selectedCountryId : ''),
        { token: session.token }
      )
      setOverview(updatedOverview)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsBatchUpdating(false)
    }
  }

  // Create University
  const handleCreateUniversity = async (e) => {
    e.preventDefault()
    if (!newUni.name || !selectedCountryId) return
    try {
      await apiRequest('/agent/universities', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({
          countryId: parseInt(selectedCountryId, 10),
          name: newUni.name,
          city: newUni.city,
        }),
      })
      setToast('University registered successfully!')
      setShowAddUniversity(false)
      setNewUni({ name: '', city: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Create Program
  const handleCreateProgram = async (e) => {
    e.preventDefault()
    if (!newProgram.name || !newProgram.universityId) return
    try {
      await apiRequest('/agent/programs', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({
          universityId: parseInt(newProgram.universityId, 10),
          name: newProgram.name,
          level: newProgram.level,
          annualTuitionUsd: Number(newProgram.annualTuitionUsd),
          durationMonths: Number(newProgram.durationMonths),
          tags: newProgram.tags,
        }),
      })
      setToast('Academic Program added to catalog!')
      setShowAddProgram(false)
      setNewProgram({
        universityId: '',
        name: '',
        level: "Master's",
        annualTuitionUsd: 25000,
        durationMonths: 24,
        tags: 'STEM, Research',
      })
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete Program
  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('Are you sure you want to remove this academic program?')) return
    try {
      await apiRequest('/agent/programs/' + programId, {
        token: session.token,
        method: 'DELETE',
      })
      setPrograms((prev) => prev.filter((p) => p.id !== programId))
      setToast('Program removed successfully.')
    } catch (err) {
      setError(err.message)
    }
  }

  // Create Scholarship
  const handleCreateScholarship = async (e) => {
    e.preventDefault()
    if (!newScholarship.name || !selectedCountryId) return
    try {
      await apiRequest('/agent/scholarships', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({
          countryId: parseInt(selectedCountryId, 10),
          name: newScholarship.name,
        }),
      })
      setToast('Scholarship published successfully!')
      setShowAddScholarship(false)
      setNewScholarship({ name: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete Scholarship
  const handleDeleteScholarship = async (scholarshipId) => {
    if (!window.confirm('Are you sure you want to remove this scholarship opportunity?')) return
    try {
      await apiRequest('/agent/scholarships/' + scholarshipId, {
        token: session.token,
        method: 'DELETE',
      })
      setScholarships((prev) => prev.filter((s) => s.id !== scholarshipId))
      setToast('Scholarship removed.')
    } catch (err) {
      setError(err.message)
    }
  }

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const matchesStatus =
        statusFilter === 'All' || app.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.major && app.major.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesStatus && matchesSearch
    })
  }, [applicants, statusFilter, searchQuery])

  // Pagination slice
  const paginatedApplicants = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredApplicants.slice(start, start + pageSize)
  }, [filteredApplicants, currentPage, pageSize])

  const totalPages = Math.ceil(filteredApplicants.length / pageSize) || 1

  // Export Applicants CSV
  const handleExportCsv = () => {
    if (applicants.length === 0) return
    const headers = [
      'Application ID',
      'Student Name',
      'Student Email',
      'GPA',
      'Major',
      'Target University',
      'Program Name',
      'Degree Level',
      'Country',
      'Status',
      'Tuition Tk',
      'Tuition USD',
      'Submitted At',
    ]

    const rows = filteredApplicants.map((app) => [
      app.applicationId,
      '"' + app.studentName.replace(/"/g, '""') + '"',
      app.studentEmail,
      app.cgpa ? Number(app.cgpa).toFixed(2) : 'N/A',
      '"' + (app.major || '').replace(/"/g, '""') + '"',
      '"' + app.universityName.replace(/"/g, '""') + '"',
      '"' + app.programName.replace(/"/g, '""') + '"',
      app.programLevel || "Master's",
      app.countryName,
      app.status,
      app.programTuitionTk || (app.programTuitionUsd ? app.programTuitionUsd * 120 : 0),
      app.programTuitionUsd || 0,
      new Date(app.submittedAt).toISOString().split('T')[0],
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      'futurewings_territory_' + (overview?.CountryName || 'applicants') + '_' + new Date().toISOString().split('T')[0] + '.csv'
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered programs for Catalog Tab
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchesUni = catalogUniFilter === 'All' || p.universityName === catalogUniFilter
      const matchesSearch =
        !programSearch ||
        p.name.toLowerCase().includes(programSearch.toLowerCase()) ||
        p.universityName.toLowerCase().includes(programSearch.toLowerCase()) ||
        (p.tags && p.tags.toLowerCase().includes(programSearch.toLowerCase()))
      return matchesUni && matchesSearch
    })
  }, [programs, catalogUniFilter, programSearch])

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAppIds(paginatedApplicants.map((a) => a.applicationId))
    } else {
      setSelectedAppIds([])
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const openEmailModal = (app) => {
    setEmailModalApp(app)
    setEmailSubject('FutureWings Admissions Update: ' + app.programName + ' at ' + app.universityName)
    setEmailBody(
      'Dear ' + app.studentName + ',\n\nWe are contacting you on behalf of the Regional Admissions Committee for ' + app.countryName + '. Your application for ' + app.programName + ' at ' + app.universityName + ' is currently marked as "' + app.status + '".\n\nPlease review your portal for required document submissions or contact your territory counselor for guidance.\n\nBest regards,\nCountry Admissions Office\nFutureWings Platform'
    )
  }

  const sendSimulatedEmail = () => {
    setToast('Official admissions dispatch transmitted to ' + (emailModalApp?.studentEmail || 'candidate') + '!')
    setEmailModalApp(null)
  }

  const flagEmoji = overview?.CountryCode
    ? COUNTRY_FLAGS[overview.CountryCode] || COUNTRY_FLAGS[overview.CountryName] || '🌍'
    : '🌍'

  return (
    <div className="mx-auto max-w-7xl pb-16">
      {/* Top Banner / Hero Header */}
      <header className="relative overflow-hidden rounded-3xl border border-secondary-200 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                Territory Admissions Command
              </span>
              <span className="text-xs text-slate-400 font-medium">Regional CRM & Intake Hub</span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <span className="text-4xl sm:text-5xl" role="img" aria-label="Country Flag">
                {flagEmoji}
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {overview?.CountryName || 'Territory'} Admissions Director
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Manage student recruitment pipelines, review institutional portfolios, and issue admissions decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Territory Switcher & Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 border border-white/15">
              <label htmlFor="country-selector" className="pl-2 text-xs font-semibold text-slate-300 uppercase">
                Territory:
              </label>
              <select
                id="country-selector"
                value={selectedCountryId}
                onChange={handleCountryChange}
                className="rounded-xl border-0 bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {(COUNTRY_FLAGS[c.code] || '🌍') + ' ' + c.name + ' (' + c.applicationsCount + ' applicants)'}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCsv}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition shadow-sm"
              title="Download CSV report of territory applicants"
            >
              <span>📥 Export CSV</span>
            </button>

            <button
              onClick={loadData}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 px-3.5 py-2 text-xs font-extrabold transition shadow-lg hover:shadow-teal-500/25"
            >
              <span>⚡ Refresh Live Data</span>
            </button>
          </div>
        </div>

        {/* Territory Snapshot Quick Bar */}
        {overview && (
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Territory Code:</span>
              <p className="font-bold text-teal-300">{overview.CountryCode || 'CA'}</p>
            </div>
            <div>
              <span className="text-slate-400">Acceptance Success:</span>
              <p className="font-bold text-emerald-300">{overview.AcceptanceRatePercent}%</p>
            </div>
            <div>
              <span className="text-slate-400">Total Pipeline Value:</span>
              <p className="font-bold text-cyan-300">
                {'৳' + Number(overview.TotalPipelineTuitionTk || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Estimated Commission:</span>
              <p className="font-bold text-amber-300">
                {'৳' + Number(overview.EstimatedCommissionTk || 0).toLocaleString() + ' (15%)'}
              </p>
            </div>
          </div>
        )}
      </header>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm" role="alert">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* KPI Stat Cards */}
      {overview && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Applicants */}
          <div className="relative overflow-hidden rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-500">
                Total Applicants
              </span>
              <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
                {overview.CountryName}
              </span>
            </div>
            <p className="mt-2 text-3xl font-black text-secondary-950">
              {overview.TotalApplicants}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-secondary-500 border-t border-secondary-100 pt-2">
              <span>{overview.SubmittedCount} submissions</span>
              <span className="font-semibold text-teal-700">{overview.DraftCount} in draft</span>
            </div>
          </div>

          {/* Pending Review */}
          <div
            onClick={() => {
              setActiveTab('crm')
              setStatusFilter('Under Review')
            }}
            className="cursor-pointer relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Admissions Queue
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
                Action Required
              </span>
            </div>
            <p className="mt-2 text-3xl font-black text-amber-900">
              {overview.PendingReviewCount}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-amber-800 border-t border-amber-200/60 pt-2">
              <span>Awaiting decision</span>
              <span className="font-bold underline text-amber-900">Filter Queue ➔</span>
            </div>
          </div>

          {/* Accepted Success */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Accepted Placements
              </span>
              <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {overview.AcceptanceRatePercent}% Success
              </span>
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-950">
              {overview.AcceptedCount}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-emerald-800 border-t border-emerald-200/60 pt-2">
              <span>Offers issued</span>
              <span className="font-semibold text-rose-600">{overview.RejectedCount} declined</span>
            </div>
          </div>

          {/* Agency Commission in Tk */}
          <div
            onClick={() => setActiveTab('commission')}
            className="cursor-pointer relative overflow-hidden rounded-2xl border border-teal-300 bg-gradient-to-br from-teal-50/70 via-white to-cyan-50/30 p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                Projected Commission
              </span>
              <span className="rounded-md bg-teal-600 text-white px-2 py-0.5 text-[10px] font-black uppercase">
                15% Tk Tier
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-teal-900">
              {'৳' + Number(overview.EstimatedCommissionTk || 0).toLocaleString()}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-teal-800 border-t border-teal-200/60 pt-2">
              <span>{'≈ $' + Number(overview.EstimatedCommissionUsd || 0).toLocaleString() + ' USD'}</span>
              <span className="font-bold underline text-teal-900">Ledger ➔</span>
            </div>
          </div>
        </section>
      )}

      {/* Segmented Workspace Pill Tabs */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-secondary-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'crm', label: 'Student Admissions CRM', count: applicants.length, icon: '👥' },
            { id: 'analytics', label: 'Territory Analytics & Funnel', icon: '📊' },
            { id: 'catalog', label: 'Institutions & Programs', count: programs.length, icon: '🏛️' },
            { id: 'scholarships', label: 'Scholarships & Grants', count: scholarships.length, icon: '🎓' },
            { id: 'commission', label: 'Commission Ledger', icon: '💰' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-sm ' + (
                activeTab === tab.id
                  ? 'bg-secondary-900 text-white shadow-md'
                  : 'bg-white text-secondary-600 border border-secondary-200 hover:bg-secondary-50'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={'rounded-full px-2 py-0.5 text-[10px] font-extrabold ' + (
                    activeTab === tab.id
                      ? 'bg-teal-400 text-slate-950'
                      : 'bg-secondary-100 text-secondary-700'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quick Action triggers */}
        <div className="flex items-center gap-2">
          {activeTab === 'catalog' && (
            <>
              <button
                type="button"
                onClick={() => setShowAddUniversity(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-secondary-300 px-3 py-1.5 text-xs font-bold text-secondary-700 hover:bg-secondary-50 transition shadow-sm"
              >
                + Add University
              </button>
              <button
                type="button"
                onClick={() => setShowAddProgram(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition shadow-sm"
              >
                + Add Academic Program
              </button>
            </>
          )}

          {activeTab === 'scholarships' && (
            <button
              type="button"
              onClick={() => setShowAddScholarship(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition shadow-sm"
            >
              + Add Scholarship
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && !overview ? (
        <div className="mt-12 rounded-3xl border border-secondary-200 bg-white p-16 text-center text-secondary-500 shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-3" />
          <p className="text-sm font-semibold">Synchronizing Territory Admissions Database...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: STUDENT ADMISSIONS CRM */}
          {activeTab === 'crm' && (
            <div className="mt-6 space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-secondary-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  {['All', 'Under Review', 'Submitted', 'Accepted', 'Rejected', 'Draft'].map((status) => {
                    const count =
                      status === 'All'
                        ? applicants.length
                        : applicants.filter((a) => a.status.toLowerCase() === status.toLowerCase()).length
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setStatusFilter(status)
                          setCurrentPage(1)
                        }}
                        className={'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ' + (
                          statusFilter === status
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200/70'
                        )}
                      >
                        <span>{status}</span>
                        <span className="rounded-full bg-white/30 px-1.5 py-0.2 text-[10px]">
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Search candidate, email, program, GPA..."
                      className="w-full min-[420px]:w-64 sm:w-72 rounded-xl border border-secondary-300 bg-white px-3.5 py-1.5 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-inner"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1.5 text-xs text-secondary-400 hover:text-secondary-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="rounded-xl border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-secondary-700 shadow-sm"
                  >
                    <option value={10}>10 rows</option>
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                  </select>
                </div>
              </div>

              {/* Batch Action Bar */}
              {selectedAppIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-300 bg-teal-50/90 px-4 py-3 shadow-sm animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                    <span className="rounded-full bg-teal-600 text-white px-2 py-0.5 text-[10px]">
                      {selectedAppIds.length}
                    </span>
                    <span>Candidates Selected for Batch Processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={isBatchUpdating}
                      onClick={() => handleBatchStatus('Accepted')}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      ✓ Batch Accept
                    </button>
                    <button
                      disabled={isBatchUpdating}
                      onClick={() => handleBatchStatus('Under Review')}
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      ⏳ Batch Move to Review
                    </button>
                    <button
                      disabled={isBatchUpdating}
                      onClick={() => handleBatchStatus('Rejected')}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      ✕ Batch Reject
                    </button>
                    <button
                      onClick={() => setSelectedAppIds([])}
                      className="rounded-xl border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-secondary-50"
                    >
                      Deselect
                    </button>
                  </div>
                </div>
              )}

              {/* Candidates Table */}
              <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary-50 text-[11px] font-bold uppercase tracking-wider text-secondary-500 border-b border-secondary-200">
                      <tr>
                        <th className="px-4 py-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              paginatedApplicants.length > 0 &&
                              paginatedApplicants.every((a) => selectedAppIds.includes(a.applicationId))
                            }
                            onChange={handleSelectAll}
                            className="rounded border-secondary-300 text-teal-600 focus:ring-teal-500"
                          />
                        </th>
                        <th className="px-4 py-3.5">Candidate Profile</th>
                        <th className="px-4 py-3.5">Academic Credentials</th>
                        <th className="px-4 py-3.5">Target Program & University</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Submission Date</th>
                        <th className="px-4 py-3.5 text-right">Admissions Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                      {paginatedApplicants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-16 text-center text-sm text-secondary-500">
                            No candidates found matching the active filters in this territory.
                          </td>
                        </tr>
                      ) : (
                        paginatedApplicants.map((app) => {
                          const isSelected = selectedAppIds.includes(app.applicationId)
                          const initials = app.studentName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()

                          return (
                            <tr
                              key={app.applicationId}
                              className={'transition ' + (
                                isSelected ? 'bg-teal-50/40' : 'hover:bg-secondary-50/70'
                              )}
                            >
                              <td className="px-4 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelect(app.applicationId)}
                                  className="rounded border-secondary-300 text-teal-600 focus:ring-teal-500"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-black text-white shadow-sm">
                                    {initials || 'ST'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-secondary-900 flex items-center gap-1.5">
                                      {app.studentName}
                                    </p>
                                    <p className="text-xs text-secondary-500">{app.studentEmail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-xs">
                                  <p className="font-semibold text-secondary-800">
                                    GPA:{' '}
                                    <strong className="font-bold text-teal-700">
                                      {app.cgpa ? Number(app.cgpa).toFixed(2) : '3.50'}
                                    </strong>{' '}
                                    <span className="text-[10px] text-secondary-400">/ 4.0</span>
                                  </p>
                                  <p className="text-[11px] text-secondary-500 mt-0.5">
                                    Major: {app.major || 'Computer Science & Engineering'}
                                  </p>
                                  <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                                    Budget: ৳
                                    {Number(
                                      app.budgetTk || (app.budgetUsd ? app.budgetUsd * 120 : 3000000)
                                    ).toLocaleString()}{' '}
                                    /yr
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="font-bold text-secondary-900">{app.programName}</p>
                                <p className="text-xs text-secondary-500">
                                  {app.universityName + ' (' + app.countryName + ')'}
                                </p>
                                <span className="inline-block mt-1 rounded bg-secondary-100 px-2 py-0.5 text-[10px] font-bold text-secondary-700">
                                  {app.programLevel || "Master's"}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={'inline-flex rounded-full px-2.5 py-0.5 text-xs ' + (
                                    STATUS_BADGES[app.status] || 'bg-secondary-100 text-secondary-700'
                                  )}
                                >
                                  {app.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-xs text-secondary-500 whitespace-nowrap">
                                {new Date(app.submittedAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <select
                                    aria-label={'Admissions decision for ' + app.studentName}
                                    value={app.status}
                                    disabled={updatingId === app.applicationId}
                                    onChange={(e) => handleStatusChange(app.applicationId, e.target.value)}
                                    className="rounded-lg border border-secondary-300 bg-white px-2 py-1 text-xs font-bold text-secondary-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                                  >
                                    <option value="Draft">Draft</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="Under Review">Under Review</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Withdrawn">Withdrawn</option>
                                  </select>

                                  <button
                                    onClick={() => setInspectingApp(app)}
                                    className="rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800 transition"
                                    title="Inspect Complete Candidate Dossier"
                                  >
                                    Dossier
                                  </button>

                                  <button
                                    onClick={() => openEmailModal(app)}
                                    className="rounded-lg border border-secondary-200 bg-white hover:bg-secondary-50 p-1 text-secondary-600 transition"
                                    title="Transmit Email Dispatch"
                                  >
                                    ✉️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary-200 bg-secondary-50/50 px-5 py-3 text-xs text-secondary-600">
                  <p>
                    Showing{' '}
                    <strong className="font-bold text-secondary-900">
                      {filteredApplicants.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="font-bold text-secondary-900">
                      {Math.min(currentPage * pageSize, filteredApplicants.length)}
                    </strong>{' '}
                    of <strong className="font-bold text-secondary-900">{filteredApplicants.length}</strong> candidates
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="rounded-lg border border-secondary-300 bg-white px-3 py-1 font-semibold text-secondary-700 hover:bg-secondary-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="font-bold text-secondary-800">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className="rounded-lg border border-secondary-300 bg-white px-3 py-1 font-semibold text-secondary-700 hover:bg-secondary-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TERRITORY ANALYTICS & FUNNEL */}
          {activeTab === 'analytics' && overview && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <PipelineFunnel
                  stages={overview.StageBreakdown || []}
                  totalApplicants={overview.TotalApplicants || 0}
                />
                <TopInstitutionsChart universities={overview.TopUniversities || []} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <DegreeDistributionDonut degrees={overview.DegreeBreakdown || []} />
                <CommissionMilestoneBar
                  commissionTk={overview.EstimatedCommissionTk || 0}
                  commissionUsd={overview.EstimatedCommissionUsd || 0}
                />
              </div>
            </div>
          )}

          {/* TAB 3: INSTITUTIONS & ACADEMIC CATALOG */}
          {activeTab === 'catalog' && (
            <div className="mt-6 space-y-6">
              {/* Filter and Search Bar for Catalog */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-secondary-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-secondary-600 uppercase">Institution:</span>
                  <select
                    value={catalogUniFilter}
                    onChange={(e) => setCatalogUniFilter(e.target.value)}
                    className="rounded-xl border border-secondary-300 bg-white px-3 py-1.5 text-xs font-bold text-secondary-800 shadow-sm"
                  >
                    <option value="All">{'All Partner Institutions (' + universities.length + ')'}</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name + ' (' + u.city + ')'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={programSearch}
                    onChange={(e) => setProgramSearch(e.target.value)}
                    placeholder="Search program, degree level, or tag..."
                    className="w-64 sm:w-80 rounded-xl border border-secondary-300 bg-white px-3.5 py-1.5 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Universities Showcase */}
              <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-secondary-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">
                      {'Partnered Universities in ' + (overview?.CountryName || 'Territory')}
                    </h3>
                    <p className="text-xs text-secondary-500">
                      Recognized degree-granting institutions with active articulation agreements
                    </p>
                  </div>
                  <span className="rounded-md bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 text-xs font-bold">
                    {universities.length} Institutions
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {universities.map((uni) => (
                    <div
                      key={uni.id}
                      className="rounded-2xl border border-secondary-200 bg-secondary-50/50 p-4 hover:border-teal-300 hover:bg-white transition shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-secondary-900">{uni.name}</h4>
                          <p className="text-xs text-secondary-500 flex items-center gap-1 mt-0.5">
                            {'📍 ' + uni.city + ', ' + uni.countryName}
                          </p>
                        </div>
                        <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-black text-teal-800">
                          {(uni.programsCount || 0) + ' Programs'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-secondary-600 border-t border-secondary-200/60 pt-2">
                        <span>Applicants routed:</span>
                        <strong className="font-bold text-teal-700">{uni.applicantsCount || 0}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Programs Catalog */}
              <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-secondary-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">
                      Degree Offerings & Program Catalog
                    </h3>
                    <p className="text-xs text-secondary-500">
                      Configured tuition structures in Bangladeshi Taka and USD
                    </p>
                  </div>
                  <span className="rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-1 text-xs font-bold">
                    {filteredPrograms.length} Offerings
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPrograms.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-xs text-secondary-400">
                      No degree programs match the selected filters.
                    </div>
                  ) : (
                    filteredPrograms.map((prog) => (
                      <div
                        key={prog.id}
                        className="flex flex-col justify-between rounded-2xl border border-secondary-200 bg-white p-5 hover:border-teal-400 hover:shadow-md transition"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-md bg-secondary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-700">
                              {prog.level}
                            </span>
                            <span className="text-xs text-secondary-400 font-medium">
                              {'⏱ ' + prog.durationMonths + ' Months'}
                            </span>
                          </div>

                          <h4 className="mt-2 text-base font-bold text-secondary-950">
                            {prog.name}
                          </h4>
                          <p className="text-xs text-secondary-600 mt-0.5">
                            {prog.universityName}
                          </p>

                          <div className="mt-3 rounded-xl bg-teal-50/60 border border-teal-100 p-2.5">
                            <p className="text-[11px] font-medium text-teal-800">Annual Tuition:</p>
                            <p className="text-base font-black text-teal-900">
                              {'৳' + Number(prog.annualTuitionTk || prog.annualTuitionUsd * 120).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-secondary-500">
                              {'≈ $' + Number(prog.annualTuitionUsd).toLocaleString() + ' USD / yr'}
                            </p>
                          </div>

                          {prog.tags && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {prog.tags.split(',').map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold text-secondary-600"
                                >
                                  {'#' + tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-3 text-xs">
                          <span className="text-secondary-500">
                            {(prog.applicantsCount || 0) + ' candidate applications'}
                          </span>
                          <button
                            onClick={() => handleDeleteProgram(prog.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SCHOLARSHIPS & FINANCIAL GRANTS */}
          {activeTab === 'scholarships' && (
            <div className="mt-6 rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-secondary-100 pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">
                    {'Territory Scholarships & Aid Grants (' + (overview?.CountryName || 'Territory') + ')'}
                  </h3>
                  <p className="text-xs text-secondary-500">
                    Government, institutional, and private aid opportunities for international applicants
                  </p>
                </div>
                <button
                  onClick={() => setShowAddScholarship(true)}
                  className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700 shadow-sm"
                >
                  + Add Territory Scholarship
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scholarships.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-secondary-400">
                    {'No active scholarships published for ' + (overview?.CountryName || 'this territory') + ". Click '+ Add Scholarship' to create one."}
                  </div>
                ) : (
                  scholarships.map((sch) => (
                    <div
                      key={sch.id}
                      className="flex flex-col justify-between rounded-2xl border border-secondary-200 bg-gradient-to-br from-amber-50/40 via-white to-teal-50/30 p-5 shadow-sm hover:shadow-md transition"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-amber-600 text-lg">
                          <span>🎓</span>
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">
                            Merit & Need Aid
                          </span>
                        </div>
                        <h4 className="mt-2 text-base font-bold text-secondary-900">{sch.name}</h4>
                        <p className="text-xs text-secondary-500 mt-1">
                          {'Applicable to admitted international scholars studying in ' + sch.countryName + '.'}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-3 text-xs">
                        <span className="text-emerald-700 font-bold">✓ Active in Catalog</span>
                        <button
                          onClick={() => handleDeleteScholarship(sch.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: COMMISSION LEDGER */}
          {activeTab === 'commission' && overview && (
            <div className="mt-6 space-y-6">
              <CommissionMilestoneBar
                commissionTk={overview.EstimatedCommissionTk || 0}
                commissionUsd={overview.EstimatedCommissionUsd || 0}
              />

              <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900 border-b border-secondary-100 pb-3">
                  Placed Student Incentive Breakdown (15% Commission Rate)
                </h3>
                <p className="text-xs text-secondary-500 mt-1 mb-4">
                  Commissions credited upon formal university enrolment confirmation in Bangladeshi Taka.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary-50 text-[11px] font-bold uppercase text-secondary-500">
                      <tr>
                        <th className="px-4 py-3">Candidate</th>
                        <th className="px-4 py-3">University & Program</th>
                        <th className="px-4 py-3">Tuition (Tk / USD)</th>
                        <th className="px-4 py-3">Agency Rate</th>
                        <th className="px-4 py-3">Projected Commission (Tk)</th>
                        <th className="px-4 py-3 text-right">Settlement Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                      {applicants
                        .filter((a) => a.status === 'Accepted' || a.status === 'Under Review')
                        .map((app) => {
                          const tuitionTk =
                            app.programTuitionTk ||
                            (app.programTuitionUsd ? app.programTuitionUsd * 120 : 3000000)
                          const commTk = Math.round(tuitionTk * 0.15)
                          const isAccepted = app.status === 'Accepted'

                          return (
                            <tr key={app.applicationId} className="hover:bg-secondary-50">
                              <td className="px-4 py-3.5 font-bold text-secondary-900">
                                {app.studentName}
                              </td>
                              <td className="px-4 py-3.5 text-secondary-600">
                                {app.programName + ' — ' + app.universityName}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="font-bold text-secondary-900">
                                  {'৳' + Number(tuitionTk).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-teal-700">15.0%</td>
                              <td className="px-4 py-3.5 font-black text-teal-800">
                                {'৳' + Number(commTk).toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <span
                                  className={'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ' + (
                                    isAccepted
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  )}
                                >
                                  {isAccepted ? 'Qualified Payout' : 'In Pipeline'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* STUDENT DOSSIER INSPECTION DRAWER / MODAL */}
      {inspectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-4 sm:p-8 shadow-2xl border border-secondary-200">
            <button
              onClick={() => setInspectingApp(null)}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 text-secondary-600 hover:bg-secondary-200 text-sm font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-secondary-100 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-base font-black text-white shadow">
                {inspectingApp.studentName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-secondary-950">
                  {inspectingApp.studentName}
                </h3>
                <p className="text-xs text-secondary-500">
                  {inspectingApp.studentEmail + ' • Application #' + inspectingApp.applicationId}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Academic Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-secondary-400">Cumulative GPA</span>
                  <p className="text-base font-black text-teal-700 mt-0.5">
                    {(inspectingApp.cgpa ? Number(inspectingApp.cgpa).toFixed(2) : '3.65') + ' / 4.0'}
                  </p>
                </div>

                <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-secondary-400">Field of Study</span>
                  <p className="text-xs font-bold text-secondary-900 mt-1 truncate">
                    {inspectingApp.major || 'Computer Science'}
                  </p>
                </div>

                <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-secondary-400">Annual Budget</span>
                  <p className="text-xs font-black text-emerald-700 mt-1">
                    {'৳' + Number(
                      inspectingApp.budgetTk || (inspectingApp.budgetUsd ? inspectingApp.budgetUsd * 120 : 3000000)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Program Choice */}
              <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4">
                <span className="text-[10px] font-bold uppercase text-teal-800">Target University Program</span>
                <h4 className="text-base font-bold text-secondary-950 mt-1">
                  {inspectingApp.programName}
                </h4>
                <p className="text-xs text-secondary-600">
                  {inspectingApp.universityName + ' (' + inspectingApp.countryName + ')'}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-teal-200/50">
                  <span>Tuition:</span>
                  <strong className="text-teal-900 font-extrabold">
                    {'৳' + Number(
                      inspectingApp.programTuitionTk ||
                        (inspectingApp.programTuitionUsd ? inspectingApp.programTuitionUsd * 120 : 3720000)
                    ).toLocaleString() + ' / year'}
                  </strong>
                </div>
              </div>

              {/* Document Readiness Checklist */}
              <div className="rounded-2xl border border-secondary-200 bg-white p-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary-800 mb-3">
                  Admissions Document Verification
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-600">Academic Transcripts & Certificates</span>
                    <span className="font-bold text-emerald-700">✓ Verified</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-600">English Proficiency (IELTS 7.5 / TOEFL 102)</span>
                    <span className="font-bold text-emerald-700">✓ Score Matched</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-600">Statement of Purpose & Reference Letters</span>
                    <span className="font-bold text-emerald-700">✓ Completed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-600">Financial Solvency Proof</span>
                    <span className="font-bold text-teal-700">Under Territory Review</span>
                  </div>
                </div>
              </div>

              {/* Status Decision Buttons */}
              <div className="pt-2 border-t border-secondary-200">
                <span className="block text-xs font-bold text-secondary-700 mb-2">
                  Execute Admissions Determination:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={updatingId === inspectingApp.applicationId}
                    onClick={() => handleStatusChange(inspectingApp.applicationId, 'Accepted')}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-bold shadow transition disabled:opacity-50"
                  >
                    ✓ Issue Acceptance Offer
                  </button>
                  <button
                    disabled={updatingId === inspectingApp.applicationId}
                    onClick={() => handleStatusChange(inspectingApp.applicationId, 'Under Review')}
                    className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-2 text-xs font-bold shadow transition disabled:opacity-50"
                  >
                    ⏳ Move to Committee Review
                  </button>
                  <button
                    disabled={updatingId === inspectingApp.applicationId}
                    onClick={() => handleStatusChange(inspectingApp.applicationId, 'Rejected')}
                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white py-2 text-xs font-bold shadow transition disabled:opacity-50"
                  >
                    ✕ Decline Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL TRANSMISSION MODAL */}
      {emailModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-8 shadow-2xl border border-secondary-200">
            <h3 className="text-lg font-extrabold text-secondary-950">
              Transmit Candidate Dispatch
            </h3>
            <p className="mt-1 text-xs text-secondary-500">
              {'Sending official territory message to ' + emailModalApp.studentEmail + '.'}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">Message Body</label>
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-xl border border-secondary-300 p-3 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalApp(null)}
                  className="rounded-xl border border-secondary-300 px-4 py-2 text-xs font-semibold text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendSimulatedEmail}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
                >
                  🚀 Transmit Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD UNIVERSITY MODAL */}
      {showAddUniversity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-8 shadow-2xl border border-secondary-200">
            <h3 className="text-lg font-extrabold text-secondary-950">
              Register Territory Institution
            </h3>
            <p className="mt-1 text-xs text-secondary-500">
              {'Add a partner university in ' + (overview?.CountryName || 'Territory') + '.'}
            </p>

            <form onSubmit={handleCreateUniversity} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">
                  University Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University of Waterloo"
                  value={newUni.name}
                  onChange={(e) => setNewUni({ ...newUni, name: e.target.value })}
                  className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">Campus City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Waterloo"
                  value={newUni.city}
                  onChange={(e) => setNewUni({ ...newUni, city: e.target.value })}
                  className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUniversity(false)}
                  className="rounded-xl border border-secondary-300 px-4 py-2 text-xs font-semibold text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
                >
                  Register Institution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROGRAM MODAL */}
      {showAddProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-8 shadow-2xl border border-secondary-200">
            <h3 className="text-lg font-extrabold text-secondary-950">
              Publish Academic Program
            </h3>
            <p className="mt-1 text-xs text-secondary-500">
              {'Add degree offering to ' + (overview?.CountryName || 'Territory') + ' academic catalog.'}
            </p>

            <form onSubmit={handleCreateProgram} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">
                  Host University
                </label>
                <select
                  required
                  value={newProgram.universityId}
                  onChange={(e) => setNewProgram({ ...newProgram, universityId: e.target.value })}
                  className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                >
                  <option value="">-- Select Institution --</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name + ' (' + u.city + ')'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">
                    Program Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master of Data Science"
                    value={newProgram.name}
                    onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                    className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">
                    Degree Level
                  </label>
                  <select
                    value={newProgram.level}
                    onChange={(e) => setNewProgram({ ...newProgram, level: e.target.value })}
                    className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Bachelor's">Bachelor's</option>
                    <option value="Master's">Master's</option>
                    <option value="PhD">PhD / Doctorate</option>
                    <option value="Diploma">Diploma / Certificate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">
                    Annual Tuition ($ USD)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={newProgram.annualTuitionUsd}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, annualTuitionUsd: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[10px] text-teal-700 font-bold mt-1">
                    {'≈ ৳' + Number(newProgram.annualTuitionUsd * 120).toLocaleString() + ' Tk / yr'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    required
                    min={6}
                    value={newProgram.durationMonths}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, durationMonths: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">
                  Discipline Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. STEM, AI, Machine Learning, Co-op"
                  value={newProgram.tags}
                  onChange={(e) => setNewProgram({ ...newProgram, tags: e.target.value })}
                  className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProgram(false)}
                  className="rounded-xl border border-secondary-300 px-4 py-2 text-xs font-semibold text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
                >
                  Publish Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SCHOLARSHIP MODAL */}
      {showAddScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-8 shadow-2xl border border-secondary-200">
            <h3 className="text-lg font-extrabold text-secondary-950">
              Publish Territory Scholarship
            </h3>
            <p className="mt-1 text-xs text-secondary-500">
              {'Publish funding opportunity for applicants in ' + (overview?.CountryName || 'Territory') + '.'}
            </p>

            <form onSubmit={handleCreateScholarship} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">
                  Scholarship Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premier Global Excellence Award"
                  value={newScholarship.name}
                  onChange={(e) => setNewScholarship({ ...newScholarship, name: e.target.value })}
                  className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-xs text-secondary-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddScholarship(false)}
                  className="rounded-xl border border-secondary-300 px-4 py-2 text-xs font-semibold text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
                >
                  Publish Scholarship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
