import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, CheckCircle, XCircle, Play, Loader2, Briefcase } from 'lucide-react'

const API_Base = "http://localhost:8000"

function App() {
  const [threadId, setThreadId] = useState(null)
  const [status, setStatus] = useState("idle") // idle, running, paused, finished
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const startRun = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_Base}/run`, { resume_path: "resume.pdf" })
      setThreadId(res.data.thread_id)
      setStatus(res.data.status)
      if (res.data.status === "paused") {
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
      // Map LangGraph status to UI status
      if (res.data.next_step.includes("submit_application")) {
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

  const handleAction = async (action) => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_Base}/approve`, {
        thread_id: threadId,
        action: action
      })
      setStatus(res.data.status)
      // Refresh data
      fetchStatus(threadId)
    } catch (e) {
      console.error(e)
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="text-blue-600" />
            Job Agent Dashboard
          </h1>
          <div className="flex gap-2">
            {status === "idle" ? (
              <button
                onClick={startRun}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                Start New Application
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="text-slate-500 hover:text-slate-700 font-medium"
              >
                Reset / New Run
              </button>
            )}
            {status !== "idle" && (
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm font-mono text-sm">
                Thread: {threadId?.slice(0, 8)}...
              </div>
            )}
          </div>
        </header>

        <main className="space-y-8">
          {status === "idle" && (
            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-lg">Ready to find your next job? Click "Start" to begin agent.</p>
            </div>
          )}

          {(status === "paused" || status === "running" || status === "finished") && data && (
            <div className="grid gap-6">
              {/* Status Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Current Job: {data.job_details?.title}</h2>
                    <p className="text-slate-500">{data.job_details?.company}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${status === "paused" ? "bg-amber-100 text-amber-700" :
                      status === "finished" ? "bg-green-100 text-green-700" :
                        "bg-blue-100 text-blue-700"
                    }`}>
                    {status.toUpperCase()}
                  </span>
                </div>

                {data.job_details?.url && (
                  <a href={data.job_details.url} target="_blank" className="text-blue-600 hover:underline text-sm mb-4 block">
                    View Job Posting &rarr;
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${app.fit_score >= 80 ? 'bg-green-100 text-green-800' :
                            app.fit_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
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
