import { useState, useEffect, useCallback } from 'react'
import { getDbHealthStats, getLatencyStats, type DbHealth, type LatencyStats } from '@/api/stats'

export default function DbHealthPage() {
  const [health, setHealth] = useState<DbHealth | null>(null)
  const [latency, setLatency] = useState<LatencyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchData = useCallback(() => {
    Promise.all([getDbHealthStats(), getLatencyStats()])
      .then(([h, l]) => { setHealth(h); setLatency(l); setError('') })
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(message || 'Failed to load health data')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  function cacheHitColor(ratio: number): string {
    if (ratio >= 0.99) return 'text-success-500'
    if (ratio >= 0.95) return 'text-warning-500'
    return 'text-error-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-1">Database Health</h1>
          <p className="text-gray-500 dark:text-gray-400">Connection pool, cache, and search performance</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          Auto-refresh (60s)
        </label>
      </div>

      {loading && <div className="text-gray-500 dark:text-gray-400">Loading...</div>}

      {error && (
        <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {!loading && !error && health && latency && (
        <>
          {/* Top cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Connection Pool */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Connection Pool</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Active</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{health.connections.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Idle</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{health.connections.idle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{health.connections.total}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2">
                  <span className="text-gray-600 dark:text-gray-300">Max</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{health.connections.maxConnections}</span>
                </div>
              </div>
            </div>

            {/* Cache Hit Ratio */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Cache Hit Ratio</div>
              <div className={`text-4xl font-semibold ${cacheHitColor(health.cacheHitRatio)}`}>
                {(health.cacheHitRatio * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {health.cacheHitRatio >= 0.99 ? 'Excellent' : health.cacheHitRatio >= 0.95 ? 'Good' : 'Low - check shared_buffers'}
              </div>
            </div>

            {/* Search Latency */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Search Latency</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">p50</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{latency.p50.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">p95</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{latency.p95.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">p99</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{latency.p99.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2">
                  <span className="text-gray-600 dark:text-gray-300">Samples</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{latency.count.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Sizes */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-medium text-gray-700 dark:text-gray-300">Table Sizes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Table</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Total</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Data</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Indexes</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Rows (est.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {health.tables.map(t => (
                    <tr key={t.name} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{t.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.totalSize}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.dataSize}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.indexSize}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.rowEstimate.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Index Usage */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-medium text-gray-700 dark:text-gray-300">Index Usage (Top 50)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Index</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Table</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Scans</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {health.indexes.map(idx => (
                    <tr key={idx.indexName} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-white/90">{idx.indexName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{idx.tableName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{idx.indexScans.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{idx.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dead Tuples */}
          {health.deadTuples.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-medium text-gray-700 dark:text-gray-300">Dead Tuples</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Table</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Dead</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Live</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {health.deadTuples.map(dt => (
                      <tr key={dt.tableName} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{dt.tableName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{dt.deadTuples.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{dt.liveTuples.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {dt.liveTuples > 0 ? ((dt.deadTuples / dt.liveTuples) * 100).toFixed(2) + '%' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
