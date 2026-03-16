import { useState, useEffect, useRef } from 'react'

export default function SystemMonitorPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setError(true)
      }
    }, 10000)
    return () => clearTimeout(timeoutRef.current)
  }, [loading])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">System Monitor</h1>
        </div>
        {!error && (
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${loading ? 'bg-warning-400' : 'bg-success-400'}`} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Connecting...' : 'Connected'}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400">
          Failed to connect to system monitor. Make sure the ttyd service is running.
        </div>
      )}

      {!error && (
        <iframe
          src="/ttyd/"
          className="flex-1 w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-950"
          style={{ display: error ? 'none' : 'block' }}
          onLoad={() => { setLoading(false); clearTimeout(timeoutRef.current) }}
          onError={() => { setLoading(false); setError(true) }}
        />
      )}
    </div>
  )
}
