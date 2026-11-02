import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../auth.js'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const formatSize = (bytes) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

export default function Documents({ session }) {
  const [documents, setDocuments] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const load = useCallback(async () => {
    try {
      setDocuments(await apiRequest('/documents', { token: session.token }))
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [session.token])

  useEffect(() => { load() }, [load])

  const uploadFile = async (file) => {
    if (!file) return
    const data = new FormData()
    data.append('file', file)
    setBusy(true)
    setError('')
    try {
      await apiRequest('/documents', { token: session.token, method: 'POST', body: data })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleFormSubmit = async (event) => {
    event.preventDefault()
    const file = inputRef.current?.files?.[0]
    if (file) {
      await uploadFile(file)
      event.currentTarget.reset()
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const download = async (document) => {
    setError('')
    try {
      const response = await fetch(`${API_URL}/documents/${document.id}/download`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (!response.ok) throw new Error('The document could not be downloaded.')
      const url = URL.createObjectURL(await response.blob())
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const remove = async (id) => {
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/documents/${id}`, { token: session.token, method: 'DELETE' })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') {
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-50 text-danger-600 font-extrabold text-xs border border-danger-200">
          PDF
        </span>
      )
    }
    if (ext === 'doc' || ext === 'docx') {
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 font-extrabold text-xs border border-primary-200">
          DOC
        </span>
      )
    }
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600 font-extrabold text-xs border border-secondary-200">
        FILE
      </span>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-4 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
            <span className="h-2 w-2 rounded-full bg-primary-400" />
            Verified File Vault
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Document Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-secondary-300">
            Upload and organize official academic transcripts, SOPs, recommendation letters, and financial affidavits (up to 10 MB).
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 shadow-sm" role="alert">
          {error}
        </div>
      )}

      {/* Upload Dropzone */}
      <form
        className={`rounded-3xl border-2 border-dashed p-4 sm:p-8 text-center transition ${
          dragOver
            ? 'border-primary-500 bg-primary-50/50'
            : 'border-secondary-300 bg-white hover:border-primary-300'
        } shadow-sm`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onSubmit={handleFormSubmit}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mb-3 border border-primary-200 shadow-sm">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-secondary-950">Upload Application Document</h3>
        <p className="mt-1 text-xs text-secondary-500">Drag & drop your files here, or browse from device</p>
        
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          <label className="rounded-xl border border-secondary-300 bg-white px-5 py-2.5 text-xs font-bold text-secondary-700 hover:bg-secondary-50 transition cursor-pointer shadow-sm">
            <span>Browse Files</span>
            <input
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              id="document-file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadFile(file)
              }}
              ref={inputRef}
              type="file"
            />
          </label>
          <span className="text-[11px] text-secondary-400 font-medium">Supports PDF, DOCX, PNG (Max 10MB)</span>
        </div>
      </form>

      {/* Uploaded Documents List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-secondary-950">
            Vault Documents ({documents.length})
          </h2>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-secondary-200 bg-white p-12 text-center text-xs text-secondary-500">
            No documents uploaded yet. Upload your transcripts and certificates above to have them ready for applications.
          </div>
        ) : (
          <div className="grid gap-3">
            {documents.map((doc) => (
              <article
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-secondary-200/80 bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-md"
                key={doc.id}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {getFileIcon(doc.fileName)}
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-secondary-950 text-sm group-hover:text-primary-600 transition">
                      {doc.fileName}
                    </h3>
                    <p className="mt-0.5 text-xs text-secondary-400 font-medium">
                      {formatSize(doc.sizeBytes)} &bull; Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center justify-center min-h-[44px] rounded-xl bg-secondary-100 hover:bg-primary-50 hover:text-primary-700 px-3.5 py-2 text-xs font-bold text-secondary-700 transition"
                    onClick={() => download(doc)}
                    type="button"
                  >
                    Download
                  </button>
                  <button
                    className="inline-flex items-center justify-center min-h-[44px] rounded-xl border border-secondary-200 px-3.5 py-2 text-xs font-semibold text-danger-600 hover:bg-danger-50 transition disabled:opacity-50"
                    disabled={busy}
                    onClick={() => remove(doc.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
