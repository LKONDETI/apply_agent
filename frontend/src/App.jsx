import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, CheckCircle, XCircle, Play, Loader2, Briefcase, MapPin, Briefcase as RoleIcon } from 'lucide-react'

const API_Base = "http://localhost:8000"

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

  const startRun = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_Base}/run`, {
        resume_path: "resume.pdf",
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

      // Update jobs list if in selection mode
      if (res.data.jobs) {
        setJobs(res.data.jobs)
      }

      // Map LangGraph status to UI status
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
      // Fetch updated data with tailored content
      setTimeout(() => {
        fetchStatus(threadId)
      }, 500)
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

      // Update status from response
      setStatus(res.data.status)

      // If rejected and returned to selection, update job list
      if (action === "reject" && res.data.status === "awaiting_selection" && res.data.jobs) {
        setJobs(res.data.jobs)
        // Optionally fetch full status for updated data
        setTimeout(() => {
          fetchStatus(threadId)
        }, 500)
      } else if (action === "reject" && res.data.status === "paused") {
        // Old behavior - if still paused, fetch new job details
        setTimeout(() => {
          fetchStatus(threadId)
        }, 500)
      } else {
        // For approve or finished, refresh data
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

          {/* Filter Inputs */}
          {status === "idle" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-4">
              <h2 className="text-lg font-semibold mb-4">Search Preferences</h2>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <RoleIcon size={16} />
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
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

          {/* Application Review (existing paused state) */}
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
                      Approve & Submit
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
