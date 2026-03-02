import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { FileText, CheckCircle, XCircle, Play, Loader2, Briefcase, MapPin, Upload, AlertCircle } from 'lucide-react'

const API_Base = "http://localhost:8000"

// ─── Resume Upload Component ───────────────────────────────────────────────
function ResumeUploader({ onUploadComplete }) {
  const [uploadStatus, setUploadStatus] = useState('idle') // idle | uploading | done | error
  const [uploadedFile, setUploadedFile] = useState(null)   // { filename, size_bytes }
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setUploadStatus('error')
      setErrorMsg(`"${file.name}" is not supported. Please upload a PDF, DOCX, or TXT file.`)
      return
    }

    setUploadStatus('uploading')
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post(`${API_Base}/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadedFile({ filename: res.data.filename, sizeBytes: res.data.size_bytes })
      setUploadStatus('done')
      onUploadComplete(res.data.resume_path)
    } catch (e) {
      const detail = e.response?.data?.detail || 'Upload failed. Please try again.'
      setErrorMsg(detail)
      setUploadStatus('error')
    }
  }

  const onInputChange = (e) => handleFile(e.target.files[0])

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const reset = () => {
    setUploadStatus('idle')
    setUploadedFile(null)
    setErrorMsg('')
    onUploadComplete(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Success State
  if (uploadStatus === 'done' && uploadedFile) {
    const sizeKB = (uploadedFile.sizeBytes / 1024).toFixed(1)
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">{uploadedFile.filename}</p>
            <p className="text-xs text-green-600">{sizeKB} KB · Ready to use</p>
          </div>
        </div>
        <button
          onClick={reset}
          title="Remove and upload a different file"
          className="text-green-500 hover:text-green-700 transition ml-4"
        >
          <XCircle size={18} />
        </button>
      </div>
    )
  }

  // ── Error State
  if (uploadStatus === 'error') {
    return (
      <div>
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{errorMsg}</p>
          <button onClick={reset} className="text-red-400 hover:text-red-600 transition ml-2">
            <XCircle size={18} />
          </button>
        </div>
      </div>
    )
  }

  // ── Upload Zone (idle or uploading)
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={onInputChange}
        id="resume-file-input"
      />
      <label
        htmlFor="resume-file-input"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-150
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        {uploadStatus === 'uploading' ? (
          <>
            <Loader2 size={24} className="text-blue-500 animate-spin" />
            <p className="text-sm font-medium text-blue-600">Uploading…</p>
          </>
        ) : (
          <>
            <Upload size={22} className="text-slate-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                <span className="text-blue-600">Click to upload</span> or drag &amp; drop
              </p>
              <p className="text-xs text-slate-400 mt-0.5">PDF, DOCX, or TXT</p>
            </div>
          </>
        )}
      </label>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────
function App() {
  const [threadId, setThreadId] = useState(null)
  const [status, setStatus] = useState("idle") // idle, awaiting_selection, paused, finished
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState("Remote")
  const [role, setRole] = useState("Software Engineer")
  const [jobType, setJobType] = useState("Full-time")
  const [timePosted, setTimePosted] = useState("any")
  const [jobs, setJobs] = useState([])

  // Resume upload state
  const [uploadedResumePath, setUploadedResumePath] = useState(null)

  const startRun = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_Base}/run`, {
        // Use the uploaded path, or fall back to the default resume.pdf
        resume_path: uploadedResumePath || "resume.pdf",
        location,
        role,
        job_type: jobType,
        time_posted: timePosted
      })
      setThreadId(res.data.thread_id)
      setStatus(res.data.status)

      if (res.data.status === "awaiting_selection" && res.data.jobs) {
        setJobs(res.data.jobs)
      } else if (res.data.status === "paused") {
        fetchStatus(res.data.thread_id)
      }
    } catch (e) {
      console.error(e)
      alert("Failed to start run")
    }
    setLoading(false)
  }

  const fetchStatus = async (tid) => {
    try {
      const res = await axios.get(`${API_Base}/status/${tid}`)
      setData(res.data)

      if (res.data.jobs) {
        setJobs(res.data.jobs)
      }

      if (res.data.current_status === "awaiting_selection") {
        setStatus("awaiting_selection")
      } else if (res.data.next_step && res.data.next_step.includes("submit_application")) {
        setStatus("paused")
      } else if (res.data.next_step === "done") {
        setStatus("finished")
      } else {
        setStatus("running")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleGenerateApplication = async (jobId) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_Base}/generate`, {
        thread_id: threadId,
        job_id: jobId
      })
      setStatus(res.data.status)
      setTimeout(() => { fetchStatus(threadId) }, 500)
    } catch (e) {
      console.error(e)
      alert("Failed to generate application")
    }
    setLoading(false)
  }

  const handleAction = async (action) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_Base}/approve`, {
        thread_id: threadId,
        action: action
      })

      setStatus(res.data.status)

      if (action === "reject" && res.data.status === "awaiting_selection" && res.data.jobs) {
        setJobs(res.data.jobs)
        setTimeout(() => { fetchStatus(threadId) }, 500)
      } else if (action === "reject" && res.data.status === "paused") {
        setTimeout(() => { fetchStatus(threadId) }, 500)
      } else {
        fetchStatus(threadId)
      }
    } catch (e) {
      console.error(e)
      alert("Failed to process action")
    }
    setLoading(false)
  }

  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchHistory()
  }, [status])

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_Base}/history`)
      setHistory(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Briefcase className="text-blue-600" />
            Job Agent Dashboard
          </h1>

          {/* Search Preferences Form */}
          {status === "idle" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-4">
              <h2 className="text-lg font-semibold mb-4">Search Preferences</h2>

              {/* Resume Upload */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <FileText size={16} />
                  Resume
                  <span className="ml-1 text-xs text-slate-400 font-normal">
                    {uploadedResumePath ? '· Uploaded ✓' : '· Using default resume.pdf if not uploaded'}
                  </span>
                </label>
                <ResumeUploader onUploadComplete={(path) => setUploadedResumePath(path)} />
              </div>

              {/* Job Filters */}
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <Briefcase size={16} />
                    Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <MapPin size={16} />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Remote, New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <Briefcase size={16} />
                    Job Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    Date Posted
                  </label>
                  <select
                    value={timePosted}
                    onChange={(e) => setTimePosted(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="any">Any time</option>
                    <option value="24h">Last 24 hrs</option>
                    <option value="3d">Last 3 days</option>
                    <option value="7d">Last 7 days</option>
                    <option value="14d">Last 14 days</option>
                    <option value="30d">Last one month</option>
                  </select>
                </div>
              </div>

              <button
                onClick={startRun}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50 transition"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                Start New Application
              </button>
            </div>
          )}

          {status !== "idle" && (
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => window.location.reload()}
                className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 border border-slate-300 rounded-lg"
              >
                Reset / New Search
              </button>
              {threadId && (
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-sm">
                  Thread: {threadId?.slice(0, 8)}...
                </div>
              )}
            </div>
          )}
        </header>

        <main className="space-y-8">
          {/* Job Selection List */}
          {status === "awaiting_selection" && jobs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b bg-slate-50">
                <h3 className="text-lg font-semibold text-slate-800">
                  Found {jobs.length} Matching Jobs
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Select a job to generate a tailored application
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <div key={job.id} className="p-6 hover:bg-slate-50 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-slate-900 mb-1">
                          {job.title}
                        </h4>
                        <p className="text-slate-600">{job.company}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin size={14} />
                          {job.location}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(job.score)}`}>
                        {job.score}
                      </span>
                    </div>
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm mb-3 block"
                      >
                        View Job Posting →
                      </a>
                    )}
                    <button
                      onClick={() => handleGenerateApplication(job.id)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                      Generate Application
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Review */}
          {(status === "paused") && data && data.job_details && (
            <div className="grid gap-6">
              {/* Status Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Current Job: {data.job_details?.title}</h2>
                    <p className="text-slate-500">{data.job_details?.company}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                    {status.toUpperCase()}
                  </span>
                </div>

                {data.job_details?.url && (
                  <a href={data.job_details.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mb-4 block">
                    View Job Posting →
                  </a>
                )}
              </div>

              {/* Approval Section */}
              {status === "paused" && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 ring-2 ring-amber-400">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="text-amber-600" />
                    Review Tailored Application
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-50 rounded-lg border text-sm max-h-96 overflow-y-auto">
                      <h4 className="font-medium text-slate-700 mb-2 sticky top-0 bg-slate-50 pb-2">Resume Summary</h4>
                      <pre className="whitespace-pre-wrap font-sans text-slate-600">
                        {data.tailored_resume || "No resume generated."}
                      </pre>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border text-sm max-h-96 overflow-y-auto">
                      <h4 className="font-medium text-slate-700 mb-2 sticky top-0 bg-slate-50 pb-2">Cover Letter</h4>
                      <pre className="whitespace-pre-wrap font-sans text-slate-600">
                        {data.cover_letter || "No cover letter generated."}
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end border-t pt-4">
                    <button
                      onClick={() => handleAction("reject")}
                      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction("approve")}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle size={18} />
                      Approve &amp; Submit
                    </button>
                  </div>
                </div>
              )}

              {status === "finished" && (
                <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
                  <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
                  <h3 className="text-lg font-semibold text-green-800">Application Submitted!</h3>
                  <p className="text-green-700">The agent has successfully applied to this position.</p>
                </div>
              )}
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b bg-slate-50">
                <h3 className="text-lg font-semibold text-slate-800">Application History</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Company</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{app.company}</td>
                      <td className="px-6 py-4">{app.title}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(app.fit_score)}`}>
                          {app.fit_score}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-600">{app.status}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(app.applied_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
