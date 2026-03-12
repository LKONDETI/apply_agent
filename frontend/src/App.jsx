import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  FileText, CheckCircle, XCircle, Play, Loader2,
  Briefcase, MapPin, Upload, AlertCircle, LayoutDashboard,
  Search, ClipboardList, TrendingUp, Award, Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'

const API_Base = "http://localhost:8000"

// ─── Resume Upload Component ───────────────────────────────────────────────
function ResumeUploader({ onUploadComplete }) {
  const [uploadStatus, setUploadStatus] = useState('idle')
  const [uploadedFile, setUploadedFile] = useState(null)
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
        <button onClick={reset} title="Remove and upload a different file" className="text-green-500 hover:text-green-700 transition ml-4">
          <XCircle size={18} />
        </button>
      </div>
    )
  }

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

  return (
    <div>
      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={onInputChange} id="resume-file-input" />
      <label
        htmlFor="resume-file-input"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-150
          ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'}
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

// ─── Helpers ───────────────────────────────────────────────────────────────
const SCORE_COLORS = { high: '#22c55e', mid: '#f59e0b', low: '#ef4444' }
const STATUS_COLORS = { approved: '#22c55e', rejected: '#ef4444', pending: '#f59e0b', submitted: '#3b82f6' }

function scoreColor(s) {
  if (s >= 80) return SCORE_COLORS.high
  if (s >= 60) return SCORE_COLORS.mid
  return SCORE_COLORS.low
}

function scoreBadge(s) {
  if (s >= 80) return 'bg-green-100 text-green-800'
  if (s >= 60) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function relativeDate(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────
function DashboardTab() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_Base}/history`)
      .then(r => setHistory(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <Loader2 size={32} className="animate-spin mr-3" />
        <span>Loading dashboard…</span>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 select-none">
        <LayoutDashboard size={56} strokeWidth={1.2} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-500 mb-1">No data yet</h2>
        <p className="text-sm">Start a job search to populate your dashboard.</p>
      </div>
    )
  }

  // ── Computed values ──────────────────────────────────────────────────────
  const approved = history.filter(a => a.status === 'approved' || a.status === 'submitted').length
  const rejected = history.filter(a => a.status === 'rejected').length
  const avgScore = Math.round(history.reduce((s, a) => s + (a.fit_score || 0), 0) / history.length)
  const recent = [...history].sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at)).slice(0, 5)

  // Fit score buckets
  const scoreBuckets = [
    { name: '< 60', count: history.filter(a => a.fit_score < 60).length, fill: SCORE_COLORS.low },
    { name: '60–79', count: history.filter(a => a.fit_score >= 60 && a.fit_score < 80).length, fill: SCORE_COLORS.mid },
    { name: '≥ 80', count: history.filter(a => a.fit_score >= 80).length, fill: SCORE_COLORS.high },
  ]

  // Status donut
  const statusGroups = Object.entries(
    history.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || '#94a3b8' }))

  // Applications over time
  const byDate = history.reduce((acc, a) => {
    const d = new Date(a.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    acc[d] = (acc[d] || 0) + 1
    return acc
  }, {})
  const timelineData = Object.entries(byDate)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, count]) => ({ date, count }))

  // Top companies
  const companyCounts = Object.entries(
    history.reduce((acc, a) => { acc[a.company] = (acc[a.company] || 0) + 1; return acc }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([company, count]) => ({ company, count }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-2 text-xs">
        <p className="font-semibold text-slate-700">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.fill || p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Applied" value={history.length} icon={Briefcase} color="bg-blue-500" />
        <StatCard label="Approved" value={approved} icon={CheckCircle} color="bg-green-500" />
        <StatCard label="Rejected" value={rejected} icon={XCircle} color="bg-red-400" />
        <StatCard label="Avg Fit Score" value={`${avgScore}%`} icon={Award} color="bg-purple-500" />
      </div>

      {/* ── Recent Activity + Score Distribution ────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-slate-50 flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800">Recent Activity</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {recent.map(app => (
              <li key={app.id} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{app.company}</p>
                  <p className="text-xs text-slate-500 truncate">{app.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{relativeDate(app.applied_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBadge(app.fit_score)}`}>
                    {app.fit_score}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                    style={{ background: (STATUS_COLORS[app.status] || '#94a3b8') + '22', color: STATUS_COLORS[app.status] || '#94a3b8' }}
                  >
                    {app.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Fit Score Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800">Fit Score Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={scoreBuckets} barSize={48}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Jobs" radius={[6, 6, 0, 0]}>
                {scoreBuckets.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Status Donut + Applications Over Time ───────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Status Breakdown Donut */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800">Status Breakdown</h3>
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusGroups} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {statusGroups.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2 text-sm">
              {statusGroups.map(s => (
                <li key={s.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.fill }} />
                  <span className="text-slate-600 capitalize">{s.name}</span>
                  <span className="font-bold text-slate-800 ml-auto pl-4">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Applications Over Time */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800">Applications Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Applications" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top Companies ───────────────────────────────────────────── */}
      {companyCounts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800">Top Companies Applied To</h3>
          </div>
          <ResponsiveContainer width="100%" height={companyCounts.length * 44}>
            <BarChart data={companyCounts} layout="vertical" barSize={20}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="company" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Applications" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}

// ─── Job Search Tab ────────────────────────────────────────────────────────
function JobSearchTab() {
  const [threadId, setThreadId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState('Remote')
  const [role, setRole] = useState('Software Engineer')
  const [jobType, setJobType] = useState('Full-time')
  const [timePosted, setTimePosted] = useState('any')
  const [searchSite, setSearchSite] = useState('')
  const [jobs, setJobs] = useState([])
  const [uploadedResumePath, setUploadedResumePath] = useState(null)

  const startRun = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_Base}/run`, {
        resume_path: uploadedResumePath || 'resume.pdf',
        location,
        role,
        job_type: jobType,
        time_posted: timePosted,
        search_site: searchSite
      })
      setThreadId(res.data.thread_id)
      setStatus(res.data.status)
      if (res.data.status === 'awaiting_selection' && res.data.jobs) {
        setJobs(res.data.jobs)
      } else if (res.data.status === 'paused') {
        fetchStatus(res.data.thread_id)
      }
    } catch (e) {
      console.error(e)
      alert('Failed to start run')
    }
    setLoading(false)
  }

  const fetchStatus = async (tid) => {
    try {
      const res = await axios.get(`${API_Base}/status/${tid}`)
      setData(res.data)
      if (res.data.jobs) setJobs(res.data.jobs)
      if (res.data.current_status === 'awaiting_selection') {
        setStatus('awaiting_selection')
      } else if (res.data.next_step && res.data.next_step.includes('submit_application')) {
        setStatus('paused')
      } else if (res.data.next_step === 'done') {
        setStatus('finished')
      } else {
        setStatus('running')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleGenerateApplication = async (jobId) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_Base}/generate`, { thread_id: threadId, job_id: jobId })
      setStatus(res.data.status)
      setTimeout(() => { fetchStatus(threadId) }, 500)
    } catch (e) {
      console.error(e)
      alert('Failed to generate application')
    }
    setLoading(false)
  }

  const handleAction = async (action) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_Base}/approve`, { thread_id: threadId, action })
      setStatus(res.data.status)
      if (action === 'reject' && res.data.status === 'awaiting_selection' && res.data.jobs) {
        setJobs(res.data.jobs)
        setTimeout(() => { fetchStatus(threadId) }, 500)
      } else if (action === 'reject' && res.data.status === 'paused') {
        setTimeout(() => { fetchStatus(threadId) }, 500)
      } else {
        fetchStatus(threadId)
      }
    } catch (e) {
      console.error(e)
      alert('Failed to process action')
    }
    setLoading(false)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-8">
      {/* Search form — only while idle */}
      {status === 'idle' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
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

          {/* Filters — row 1 */}
          <div className="grid md:grid-cols-4 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Briefcase size={16} /> Role
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
                <MapPin size={16} /> Location
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
                <Briefcase size={16} /> Job Type
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

          {/* Filters — row 2: Job Site */}
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Search size={16} /> Job Site
              </label>
              <select
                value={searchSite}
                onChange={(e) => setSearchSite(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">🌐 All Sites</option>
                <option value="linkedin.com/jobs">💼 LinkedIn</option>
                <option value="indeed.com">🔍 Indeed</option>
                <option value="glassdoor.com">🪟 Glassdoor</option>
                <option value="weworkremotely.com">🌍 WeWorkRemotely</option>
                <option value="greenhouse.io">🌿 Greenhouse</option>
                <option value="lever.co">🎯 Lever</option>
                <option value="builtin.com">🏗️ Built In</option>
                <option value="simplyhired.com">✅ SimplyHired</option>
              </select>
            </div>
            {searchSite && (
              <div className="flex items-end pb-0.5">
                <button
                  onClick={() => setSearchSite('')}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Clear site filter
                </button>
              </div>
            )}
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

      {/* Reset / thread display */}
      {status !== 'idle' && (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setStatus('idle'); setThreadId(null); setData(null); setJobs([]) }}
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

      {/* Job selection list */}
      {status === 'awaiting_selection' && jobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">Found {jobs.length} Matching Jobs</h3>
            <p className="text-sm text-slate-600 mt-1">Select a job to generate a tailored application</p>
          </div>
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-slate-50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">{job.title}</h4>
                    <p className="text-slate-600">{job.company}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {job.location}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(job.score)}`}>
                    {job.score}
                  </span>
                </div>
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mb-3 block">
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

      {/* Application review */}
      {status === 'paused' && data && data.job_details && (
        <div className="grid gap-6">
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

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 ring-2 ring-amber-400">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="text-amber-600" />
              Review Tailored Application
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg border text-sm max-h-96 overflow-y-auto">
                <h4 className="font-medium text-slate-700 mb-2 sticky top-0 bg-slate-50 pb-2">Resume Summary</h4>
                <pre className="whitespace-pre-wrap font-sans text-slate-600">{data.tailored_resume || 'No resume generated.'}</pre>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border text-sm max-h-96 overflow-y-auto">
                <h4 className="font-medium text-slate-700 mb-2 sticky top-0 bg-slate-50 pb-2">Cover Letter</h4>
                <pre className="whitespace-pre-wrap font-sans text-slate-600">{data.cover_letter || 'No cover letter generated.'}</pre>
              </div>
            </div>
            <div className="flex gap-3 justify-end border-t pt-4">
              <button
                onClick={() => handleAction('reject')}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
              >
                <XCircle size={18} /> Reject
              </button>
              <button
                onClick={() => handleAction('approve')}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm"
              >
                <CheckCircle size={18} /> Approve &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'finished' && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
          <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
          <h3 className="text-lg font-semibold text-green-800">Application Submitted!</h3>
          <p className="text-green-700">The agent has successfully applied to this position.</p>
        </div>
      )}
    </div>
  )
}

// ─── Applications Tab ──────────────────────────────────────────────────────
function ApplicationsTab() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    axios.get(`${API_Base}/history`).then((res) => setHistory(res.data)).catch(console.error)
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 select-none">
        <ClipboardList size={56} strokeWidth={1.2} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-500 mb-1">No applications yet</h2>
        <p className="text-sm">Start a job search and apply to see your history here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-800">Application History</h3>
        <p className="text-sm text-slate-500 mt-1">{history.length} application{history.length !== 1 ? 's' : ''} recorded</p>
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
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'job-search', label: 'Job Search', icon: Search },
  { id: 'applications', label: 'Applications', icon: ClipboardList },
]

function App() {
  const [activeTab, setActiveTab] = useState('job-search')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

      {/* ── Top Header / Nav ──────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-8 h-16">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <Briefcase size={22} className="text-blue-600" />
            <span className="text-lg font-bold text-slate-800 tracking-tight">Job Agent</span>
          </div>

          {/* Tab nav */}
          <nav className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}
                `}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Page Content ──────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'job-search' && <JobSearchTab />}
        {activeTab === 'applications' && <ApplicationsTab />}
      </main>
    </div>
  )
}

export default App
