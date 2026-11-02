import { useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { CONTROL, FOCUS } from '../components/ui/styles.js'

const steps = [
  { title: 'Study Plan', hint: 'Country & Major' },
  { title: 'Funding', hint: 'Tuition & Proof' },
  { title: 'Language', hint: 'IELTS / PTE' },
  { title: 'Visa History', hint: 'Ties & Prior Filings' },
]

const initial = {
  applicationId: '', destinationCountry: '', degreeLevel: "Master's", intendedMajor: '',
  annualTuitionUsd: '', availableFundsUsd: '', hasFundingProof: false,
  financialAdequacyScore: 50, hasLanguageScore: false, ieltsOverallScore: '',
  tiesToHomeCountryScore: 50, hasPriorVisaRefusal: false,
}

const meter = {
  Low: { label: 'Low Risk', color: 'bg-success-500', text: 'text-success-700', bg: 'bg-success-50 border-success-200' },
  Medium: { label: 'Moderate Risk', color: 'bg-warning-500', text: 'text-warning-700', bg: 'bg-warning-50 border-warning-200' },
  High: { label: 'High Risk', color: 'bg-danger-500', text: 'text-danger-700', bg: 'bg-danger-50 border-danger-200' },
}

function previewScore(form) {
  let score = 8
  if (!form.hasFundingProof) score += 22
  if (form.availableFundsUsd !== '' && form.annualTuitionUsd !== '') {
    if (Number(form.availableFundsUsd) < Number(form.annualTuitionUsd) + 18000) score += 24
  } else if (Number(form.financialAdequacyScore) < 70) score += 12
  if (!form.hasLanguageScore) score += 18
  if (form.hasLanguageScore && form.ieltsOverallScore !== '' && Number(form.ieltsOverallScore) < 6.5) score += 14
  if (Number(form.tiesToHomeCountryScore) < 40) score += 12
  else if (Number(form.tiesToHomeCountryScore) < 70) score += 6
  if (form.hasPriorVisaRefusal) score += 14
  return Math.min(100, score)
}

export default function VisaCheck({ session }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initial)
  const [applications, setApplications] = useState([])
  const [programs, setPrograms] = useState([])
  const [result, setResult] = useState(null)
  const [reportSource, setReportSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      apiRequest('/applications', { token: session.token }),
      apiRequest('/discovery', { token: session.token }),
    ]).then(([tracked, discovery]) => {
      if (active) { setApplications(tracked); setPrograms(discovery.programs ?? []) }
    }).catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [session.token])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value,
      ...(key === 'hasLanguageScore' && !value ? { ieltsOverallScore: '' } : {}) }))
    setResult(null)
    setError('')
  }

  const selectApplication = (id) => {
    const application = applications.find((item) => String(item.applicationId) === id)
    const program = programs.find((item) => item.id === application?.programId)
    setForm((current) => ({ ...current, applicationId: id,
      destinationCountry: program?.country ?? current.destinationCountry,
      degreeLevel: program?.level ?? current.degreeLevel,
      annualTuitionUsd: program?.annualTuitionUsd ?? current.annualTuitionUsd }))
    setResult(null)
  }

  const checkApplication = async () => {
    if (!form.applicationId) return
    setLoading(true); setError('')
    try {
      const report = await apiRequest(`/visa/application/${form.applicationId}/risk`, { token: session.token })
      setResult(report); setReportSource('saved'); setToast('Application readiness report loaded')
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  const evaluate = async (event) => {
    event.preventDefault()
    if (step === 0 && !form.destinationCountry?.trim()) {
      setError('Please provide a destination country.')
      return
    }
    if (step < steps.length - 1) { setStep(step + 1); return }
    setLoading(true); setError('')
    const payload = {
      ...form,
      applicationId: form.applicationId ? Number(form.applicationId) : null,
      annualTuitionUsd: form.annualTuitionUsd === '' ? null : Number(form.annualTuitionUsd),
      availableFundsUsd: form.availableFundsUsd === '' ? null : Number(form.availableFundsUsd),
      ieltsOverallScore: form.ieltsOverallScore === '' ? null : Number(form.ieltsOverallScore),
      financialAdequacyScore: Number(form.financialAdequacyScore),
      tiesToHomeCountryScore: Number(form.tiesToHomeCountryScore),
    }
    try {
      const report = await apiRequest('/visa/evaluate', {
        token: session.token, method: 'POST', body: JSON.stringify(payload),
      })
      setResult(report); setReportSource('manual'); setToast('Assessment ready')
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  const currentMeter = result ? meter[result.riskLevel] ?? meter.High : null
  const preview = previewScore(form)
  const previewLevel = preview < 30 ? 'Low' : preview < 60 ? 'Medium' : 'High'

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* Header Banner */}
      <header
        data-tour="visa-check-header"
        className="relative overflow-hidden rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-4 text-white shadow-xl sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
            <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
            Consular Risk Simulator
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Visa Readiness Assessment
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-secondary-300">
            Audit your financial coverage, funding documents, language test scores, and ties to home country prior to filing.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 shadow-sm" role="alert">
          {error}
        </div>
      )}

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-2xl border p-3 sm:p-4 text-left transition shadow-sm ${
              index === step
                ? 'border-primary-500 bg-white ring-2 ring-primary-200'
                : index < step
                ? 'border-success-200 bg-success-50/40 text-secondary-900'
                : 'border-secondary-200 bg-white text-secondary-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                index === step
                  ? 'bg-primary-500 text-white'
                  : index < step
                  ? 'bg-success-600 text-white'
                  : 'bg-secondary-100 text-secondary-600'
              }`}>
                {index < step ? '✓' : index + 1}
              </span>
              <span className="text-[10px] font-bold uppercase text-secondary-400">Step {index + 1}</span>
            </div>
            <p className="mt-2 font-bold text-secondary-950 text-sm">{item.title}</p>
            <p className="text-[11px] text-secondary-400 font-medium">{item.hint}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Form Wizard */}
        <form className="rounded-3xl border border-secondary-200/80 bg-white p-4 sm:p-8 shadow-sm space-y-6" onSubmit={evaluate}>
          <div className="flex items-center justify-between border-b border-secondary-100 pb-4">
            <h2 className="text-base font-extrabold text-secondary-950">{steps[step].title} Details</h2>
            <span className="text-xs font-bold text-secondary-500">Step {step + 1} of {steps.length}</span>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <Field label="Import from Tracked Application (Optional)" id="visa-application">
                <select className={`${CONTROL} w-full`} id="visa-application" onChange={(event) => selectApplication(event.target.value)} value={form.applicationId}>
                  <option value="">Assess a new study plan</option>
                  {applications.map((item) => (
                    <option key={item.applicationId} value={item.applicationId}>
                      {item.programName} — {item.universityName}
                    </option>
                  ))}
                </select>
              </Field>
              {form.applicationId && (
                <button className={`text-xs font-bold text-primary-600 hover:underline ${FOCUS}`} disabled={loading} onClick={checkApplication} type="button">
                  Load report from saved application details <span aria-hidden="true">→</span>
                </button>
              )}
              <Field label="Destination Country" id="visa-country">
                <input className={`${CONTROL} w-full`} id="visa-country" maxLength={100} onChange={(event) => update('destinationCountry', event.target.value)} placeholder="e.g. Canada" required value={form.destinationCountry} />
              </Field>
              <Field label="Degree Level" id="visa-degree">
                <select className={`${CONTROL} w-full`} id="visa-degree" onChange={(event) => update('degreeLevel', event.target.value)} value={form.degreeLevel}>
                  {["Bachelor's", "Master's", 'PhD', 'Diploma', 'Certificate'].map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </Field>
              <Field label="Intended Academic Major" id="visa-major">
                <input className={`${CONTROL} w-full`} id="visa-major" maxLength={100} onChange={(event) => update('intendedMajor', event.target.value)} placeholder="e.g. Computer Science" value={form.intendedMajor} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="Annual Tuition (USD)" id="visa-tuition">
                <input className={`${CONTROL} w-full`} id="visa-tuition" min="0" onChange={(event) => update('annualTuitionUsd', event.target.value)} step="1" type="number" value={form.annualTuitionUsd} />
              </Field>
              <Field label="Liquid Available Funds (USD)" id="visa-funds">
                <input className={`${CONTROL} w-full`} id="visa-funds" min="0" onChange={(event) => update('availableFundsUsd', event.target.value)} step="1" type="number" value={form.availableFundsUsd} />
              </Field>
              <Check label="I hold verifiable 6-month bank statements or approved sponsor affidavit" checked={form.hasFundingProof} onChange={(value) => update('hasFundingProof', value)} />
              <Slider label="Self-Assessed Living & Travel Coverage Adequacy" id="visa-financial" value={form.financialAdequacyScore} onChange={(value) => update('financialAdequacyScore', value)} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Check label="I have taken an official English proficiency exam (IELTS/PTE/TOEFL)" checked={form.hasLanguageScore} onChange={(value) => update('hasLanguageScore', value)} />
              <Field label="Overall Exam Score (e.g. IELTS Overall)" id="visa-ielts">
                <input className={`${CONTROL} w-full`} disabled={!form.hasLanguageScore} id="visa-ielts" max="9" min="0" onChange={(event) => update('ieltsOverallScore', event.target.value)} step="0.5" type="number" value={form.ieltsOverallScore} />
              </Field>
              <p className="text-xs text-secondary-500">
                Most student visa streams (SDS Canada, UK Student Route, US F-1) expect 6.0–6.5+ overall.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Check label="I have a prior visa refusal in any country" checked={form.hasPriorVisaRefusal} onChange={(value) => update('hasPriorVisaRefusal', value)} />
              <Slider label="Home Country Ties & Post-Study Intent Clarity" id="visa-ties" value={form.tiesToHomeCountryScore} onChange={(value) => update('tiesToHomeCountryScore', value)} />
              <p className="text-xs text-secondary-500">
                Honesty is essential. Previous refusals must be declared and explained with updated documentation.
              </p>
            </div>
          )}

          <div className="flex flex-col min-[380px]:flex-row justify-between gap-3 border-t border-secondary-100 pt-5">
            <button
              className={`inline-flex items-center justify-center min-h-[44px] rounded-2xl border border-secondary-300 px-5 py-2.5 text-xs font-bold text-secondary-700 hover:bg-secondary-50 disabled:opacity-40 transition ${FOCUS}`}
              disabled={step === 0 || loading}
              onClick={() => setStep(step - 1)}
              type="button"
            >
              Previous Step
            </button>
            <button
              className={`inline-flex items-center justify-center min-h-[44px] rounded-2xl bg-primary-500 hover:bg-primary-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-primary-500/25 transition disabled:opacity-50 ${FOCUS}`}
              disabled={loading}
              type="submit"
            >
              {loading ? (
                'Evaluating…'
              ) : step === steps.length - 1 ? (
                'Calculate Visa Readiness'
              ) : (
                <>
                  Continue <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Readiness Report Card */}
        <section aria-live="polite" className="rounded-3xl border border-secondary-200/80 bg-white p-4 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-secondary-100 pb-3">
            <h2 className="text-base font-extrabold text-secondary-950">Readiness Risk Analysis</h2>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  className={`rounded-lg border border-secondary-200 px-2.5 py-1 text-xs font-bold text-secondary-600 hover:bg-secondary-50 transition ${FOCUS}`}
                  onClick={() => {
                    setResult(null)
                    setStep(0)
                  }}
                  type="button"
                >
                  Start Over
                </button>
                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-black uppercase ${currentMeter.bg} ${currentMeter.text}`}>
                  {currentMeter.label}
                </span>
              </div>
            )}
          </div>

          {loading && (
            <div className="space-y-4 py-8 text-center" role="status">
              <div className="h-3 w-3/4 mx-auto animate-pulse rounded-full bg-primary-200" />
              <div className="h-3 w-1/2 mx-auto animate-pulse rounded-full bg-secondary-200" />
              <p className="text-xs font-bold text-secondary-600">Simulating embassy risk matrix…</p>
            </div>
          )}

          {!loading && !result && (
            <div className="space-y-4">
              <p className="text-xs text-secondary-500 leading-relaxed">
                This provisional risk meter updates dynamically as you complete the wizard. Submit to generate your full advisory report.
              </p>
              <div className="flex items-end justify-between">
                <span className={`text-base font-black ${meter[previewLevel].text}`}>{meter[previewLevel].label}</span>
                <span className="font-mono text-sm font-bold text-secondary-700">{preview}/100</span>
              </div>
              <div aria-label={`Provisional risk score ${preview} of 100`} className="h-3 overflow-hidden rounded-full bg-secondary-100" role="progressbar">
                <div className={`h-full rounded-full transition-all duration-300 ${meter[previewLevel].color}`} style={{ width: `${preview}%` }} />
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <div className="flex items-end justify-between">
                  <span className={`text-xl font-black ${currentMeter.text}`}>{currentMeter.label}</span>
                  <span className="font-mono text-sm font-bold text-secondary-700">{result.riskScore}/100</span>
                </div>
                <div aria-label={`Risk score ${result.riskScore} of 100`} className="mt-2.5 h-3 overflow-hidden rounded-full bg-secondary-100" role="progressbar">
                  <div className={`h-full rounded-full transition-all duration-700 ${currentMeter.color}`} style={{ width: `${result.riskScore}%` }} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900">Key Risk Indicators</h3>
                <ul className="mt-2.5 space-y-2">
                  {result.reasons.map((reason) => (
                    <li className="flex items-start gap-2 text-xs text-secondary-700 bg-secondary-50 border border-secondary-200/70 rounded-xl p-2.5" key={reason}>
                      <span className={`font-bold mt-0.5 ${reason.startsWith('Check destination') ? 'text-success-600' : 'text-amber-600'}`}>
                        {reason.startsWith('Check destination') ? '✓' : '•'}
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-900">Recommended Action Plan</h3>
                <ul className="mt-2.5 space-y-2">
                  {result.recommendations.map((item) => (
                    <li className="flex items-start gap-2 text-xs text-secondary-700 bg-primary-50/50 border border-primary-200/60 rounded-xl p-2.5" key={item}>
                      <span aria-hidden="true" className="text-primary-600 font-bold mt-0.5">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      <Toast message={toast} />
    </div>
  )
}

function Field({ label, id, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary-700" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 text-xs font-medium text-secondary-700 cursor-pointer bg-secondary-50/80 border border-secondary-200/70 p-3 rounded-xl hover:bg-secondary-50">
      <input
        checked={checked}
        className="h-4 w-4 rounded accent-primary-500 mt-0.5 shrink-0"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}

function Slider({ label, id, value, onChange }) {
  return (
    <Field id={id} label={`${label} (${value}/100)`}>
      <input
        className="w-full accent-primary-500 cursor-pointer"
        id={id}
        max="100"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        type="range"
        value={value}
      />
    </Field>
  )
}
