import { useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { CONTROL, FOCUS } from '../components/ui/styles.js'
import { SparkleIcon } from '../components/home/icons.jsx'
import {
  evaluateProfileCompletion,
  validateProfileForm,
  VALID_DEGREE_LEVELS,
} from '../lib/profileCompletion.js'

const toForm = (profile) => ({
  firstName: profile?.firstName ?? '',
  lastName: profile?.lastName ?? '',
  cgpa: profile?.cgpa ?? '',
  major: profile?.major ?? '',
  budgetUsd: profile?.budgetUsd ?? '',
  degreeLevel: profile?.degreeLevel ?? '',
})

const toPayload = (form) => ({
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  cgpa: form.cgpa === '' || form.cgpa === null ? null : Number(form.cgpa),
  major: typeof form.major === 'string' && form.major.trim() === '' ? null : form.major?.trim(),
  budgetUsd: form.budgetUsd === '' || form.budgetUsd === null ? null : Number(form.budgetUsd),
  degreeLevel: typeof form.degreeLevel === 'string' && form.degreeLevel.trim() === '' ? null : form.degreeLevel,
})

export default function Profile({ session, onStartTour, onProfileUpdate }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/profile', { token: session.token })
      .then((profile) => {
        if (active) {
          setForm(toForm(profile))
          onProfileUpdate?.(profile)
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session.token, onProfileUpdate])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const setField = (name) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const save = async (event) => {
    event.preventDefault()
    setError('')

    const validation = validateProfileForm(form)
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      setError('Please resolve the highlighted profile validation errors before saving.')
      return
    }

    setSaving(true)
    try {
      const saved = await apiRequest('/profile', {
        token: session.token,
        method: 'PUT',
        body: JSON.stringify(toPayload(form)),
      })
      setForm(toForm(saved))
      setFieldErrors({})

      const completion = evaluateProfileCompletion(saved)
      if (completion.isComplete) {
        setToast('Profile updated successfully! Your academic profile is now complete.')
      } else {
        setToast('Profile updated successfully.')
      }

      onProfileUpdate?.(saved)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const completion = evaluateProfileCompletion(form)

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Header Banner */}
      <header
        data-tour="profile-header"
        className="relative overflow-hidden rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-4 sm:p-8 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
                <span className="h-2 w-2 rounded-full bg-primary-400" />
                Academic Profile
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Your Study & Academic Profile
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-secondary-300 max-w-xl">
              Accurate academic criteria unlock personalized recommendations, scholarship matches, and your study roadmap trajectory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onStartTour && (
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                onClick={onStartTour}
                type="button"
                data-testid="profile-take-tour-btn"
              >
                <SparkleIcon className="h-4 w-4 text-primary-400" />
                <span>Take Product Tour</span>
              </button>
            )}
            <div className="rounded-2xl bg-white/10 backdrop-blur-md px-5 py-3 border border-white/15 text-center min-w-[130px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary-300">Core Readiness</span>
              <span className="font-mono text-2xl font-black text-primary-400" data-testid="profile-completion-percent">
                {completion.completionPercent}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div
          className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-xs font-medium text-danger-800 shadow-sm"
          role="alert"
          data-testid="profile-error-alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-secondary-200 bg-white p-8 space-y-4 shadow-sm" aria-label="Loading profile">
          {[1, 2, 3, 4, 5].map((row) => (
            <div className="animate-pulse" key={row}>
              <div className="h-3 w-24 rounded bg-secondary-100" />
              <div className="mt-2 h-10 rounded-xl bg-secondary-100" />
            </div>
          ))}
        </div>
      ) : form ? (
        <form
          data-tour="profile-fields"
          className="rounded-3xl border border-secondary-200/80 bg-white p-4 sm:p-8 shadow-sm space-y-6"
          noValidate
          onSubmit={save}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-secondary-950">Personal & Academic Details</h2>
              <p className="text-xs text-secondary-500 mt-0.5">
                The four academic fields below are required for AI recommendation and roadmap matching.
              </p>
            </div>
            <span
              className={`text-xs font-bold border px-3 py-1 rounded-xl transition ${
                completion.isComplete
                  ? 'bg-success-50 text-success-800 border-success-200'
                  : 'bg-primary-50 text-primary-700 border-primary-200'
              }`}
              data-testid="profile-core-fields-badge"
            >
              {completion.completedCount} of {completion.totalRequired} Core Fields Completed
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field error={fieldErrors.firstName} id="firstName" isRequired label="First Name">
              <input
                className={`w-full ${CONTROL} ${FOCUS} ${fieldErrors.firstName ? 'border-danger-400 bg-danger-50/20' : ''}`}
                id="firstName"
                maxLength={100}
                onChange={setField('firstName')}
                type="text"
                value={form.firstName}
                data-testid="input-firstName"
              />
            </Field>

            <Field error={fieldErrors.lastName} id="lastName" isRequired label="Last Name">
              <input
                className={`w-full ${CONTROL} ${FOCUS} ${fieldErrors.lastName ? 'border-danger-400 bg-danger-50/20' : ''}`}
                id="lastName"
                maxLength={100}
                onChange={setField('lastName')}
                type="text"
                value={form.lastName}
                data-testid="input-lastName"
              />
            </Field>

            <Field
              error={fieldErrors.cgpa}
              hint="0.0 to 4.0 scale"
              id="cgpa"
              isRequired
              label="Undergraduate / High School CGPA"
            >
              <input
                className={`w-full ${CONTROL} ${FOCUS} ${fieldErrors.cgpa ? 'border-danger-400 bg-danger-50/20' : ''}`}
                id="cgpa"
                inputMode="decimal"
                max="4"
                min="0"
                onChange={setField('cgpa')}
                placeholder="e.g. 3.75"
                step="0.01"
                type="number"
                value={form.cgpa}
                data-testid="input-cgpa"
              />
            </Field>

            <Field error={fieldErrors.major} id="major" isRequired label="Target Academic Major">
              <input
                className={`w-full ${CONTROL} ${FOCUS} ${fieldErrors.major ? 'border-danger-400 bg-danger-50/20' : ''}`}
                id="major"
                maxLength={100}
                onChange={setField('major')}
                placeholder="e.g. Computer Science & AI"
                type="text"
                value={form.major}
                data-testid="input-major"
              />
            </Field>

            <Field
              error={fieldErrors.budgetUsd}
              hint="Annual liquid funds > $0 USD"
              id="budgetUsd"
              isRequired
              label="Annual Tuition & Living Budget (USD)"
            >
              <input
                className={`w-full ${CONTROL} ${FOCUS} ${fieldErrors.budgetUsd ? 'border-danger-400 bg-danger-50/20' : ''}`}
                id="budgetUsd"
                inputMode="numeric"
                min="1"
                onChange={setField('budgetUsd')}
                placeholder="e.g. 25000"
                step="500"
                type="number"
                value={form.budgetUsd}
                data-testid="input-budgetUsd"
              />
            </Field>

            <Field error={fieldErrors.degreeLevel} id="degreeLevel" isRequired label="Target Degree Level">
              <select
                className={`w-full ${CONTROL} ${FOCUS} ${fieldErrors.degreeLevel ? 'border-danger-400 bg-danger-50/20' : ''}`}
                id="degreeLevel"
                onChange={setField('degreeLevel')}
                value={form.degreeLevel}
                data-testid="select-degreeLevel"
              >
                <option value="">Select Degree Level</option>
                {VALID_DEGREE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-secondary-100 pt-5">
            <p className="text-xs text-secondary-500 font-medium leading-relaxed">
              Updating your profile automatically recalculates your scholarship &amp; admission matches and study roadmap.
            </p>
            <button
              className="w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] rounded-2xl bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 text-xs font-extrabold shadow-md shadow-primary-500/25 transition disabled:opacity-50 active:scale-[0.98]"
              disabled={saving}
              type="submit"
              data-testid="save-profile-btn"
            >
              {saving ? 'Saving Changes…' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl border border-secondary-200 bg-white p-12 text-center shadow-sm">
          <p className="font-bold text-secondary-950 text-base">Profile unavailable</p>
          <p className="mt-1 text-xs text-secondary-500">We could not load your profile. Please reload or verify connection.</p>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}

function Field({ id, label, hint, isRequired, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary-700" htmlFor={id}>
        {label}
        {isRequired && <span className="text-primary-500 ml-0.5" aria-hidden="true">*</span>}
        {hint && <span className="ml-1 text-[11px] font-normal text-secondary-400">({hint})</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-semibold text-danger-600" data-testid={`error-${id}`}>
          {error}
        </p>
      )}
    </div>
  )
}
