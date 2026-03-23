import { useState, useEffect, useMemo, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import {
  getServerStatsHistory,
  getDbHealthStats,
  getLatencyStats,
  type ServerSnapshot,
  type DbHealth,
  type LatencyStats
} from '@/api/stats'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const RANGE_OPTIONS = [
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '7d', hours: 168 },
]

function formatTime(ts: number, hours: number): string {
  const d = new Date(ts * 1000)
  if (hours <= 24) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

function downsample(snapshots: ServerSnapshot[], maxPoints: number): ServerSnapshot[] {
  if (snapshots.length <= maxPoints) return snapshots
  const step = snapshots.length / maxPoints
  const result: ServerSnapshot[] = []
  for (let i = 0; i < maxPoints; i++) {
    result.push(snapshots[Math.floor(i * step)])
  }
  if (result[result.length - 1] !== snapshots[snapshots.length - 1]) {
    result.push(snapshots[snapshots.length - 1])
  }
  return result
}

const cardClass = 'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5'

function makeLineOptions(yLabel: string, unit: string, maxY?: number, stacked?: boolean) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      datalabels: { display: false },
      legend: {
        position: 'top' as const,
        labels: { usePointStyle: true, pointStyle: 'circle' as const, boxWidth: 6, boxHeight: 6, padding: 16 }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
      y: {
        beginAtZero: true,
        ...(maxY != null ? { max: maxY } : {}),
        ...(stacked ? { stacked: true } : {}),
        title: { display: true, text: yLabel },
        ticks: {
          callback: (value: string | number) => `${value}${unit}`
        }
      }
    },
    elements: {
      point: { radius: 0, hitRadius: 8, hoverRadius: 4 },
      line: { tension: 0.3, borderWidth: 1.5 }
    }
  }
}

export default function ServerHealthPage() {
  // Server stats state
  const [hours, setHours] = useState(24)
  const [snapshots, setSnapshots] = useState<ServerSnapshot[]>([])
  const [serverLoading, setServerLoading] = useState(true)
  const [serverError, setServerError] = useState('')

  // DB health state
  const [health, setHealth] = useState<DbHealth | null>(null)
  const [latency, setLatency] = useState<LatencyStats | null>(null)
  const [dbLoading, setDbLoading] = useState(true)
  const [dbError, setDbError] = useState('')

  useEffect(() => {
    setServerLoading(true)
    setServerError('')
    getServerStatsHistory(hours)
      .then(res => setSnapshots(res.snapshots))
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setServerError(message || 'Failed to load server stats')
      })
      .finally(() => setServerLoading(false))
  }, [hours])

  const fetchDbHealth = useCallback(() => {
    Promise.all([getDbHealthStats(), getLatencyStats()])
      .then(([h, l]) => { setHealth(h); setLatency(l); setDbError('') })
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setDbError(message || 'Failed to load health data')
      })
      .finally(() => setDbLoading(false))
  }, [])

  useEffect(() => { fetchDbHealth() }, [fetchDbHealth])

  const data = useMemo(() => downsample(snapshots, 200), [snapshots])
  const labels = useMemo(() => data.map(s => formatTime(s.ts, hours)), [data, hours])
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null

  const cpuData = useMemo(() => ({
    labels,
    datasets: [{
      label: 'CPU',
      data: data.map(s => s.cpu),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
    }]
  }), [data, labels])

  const memData = useMemo(() => ({
    labels,
    datasets: [{
      label: 'Memory',
      data: data.map(s => s.mem.pct),
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139,92,246,0.1)',
      fill: true,
    }]
  }), [data, labels])

  const diskData = useMemo(() => ({
    labels,
    datasets: [{
      label: 'Disk',
      data: data.map(s => s.disk.pct),
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245,158,11,0.1)',
      fill: true,
    }]
  }), [data, labels])

  const netData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'RX',
        data: data.map(s => s.net.rx_mb),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
      },
      {
        label: 'TX',
        data: data.map(s => s.net.tx_mb),
        borderColor: '#F97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        fill: true,
      }
    ]
  }), [data, labels])

  const loadData = useMemo(() => ({
    labels,
    datasets: [
      { label: '1m', data: data.map(s => s.load[0]), borderColor: '#EF4444', backgroundColor: 'transparent' },
      { label: '5m', data: data.map(s => s.load[1]), borderColor: '#F59E0B', backgroundColor: 'transparent' },
      { label: '15m', data: data.map(s => s.load[2]), borderColor: '#10B981', backgroundColor: 'transparent' },
    ]
  }), [data, labels])

  const memOptions = useMemo(() => ({
    ...makeLineOptions('Usage', '%', 100),
    plugins: {
      ...makeLineOptions('Usage', '%', 100).plugins,
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (ctx: { parsed: { y: number | null }; dataIndex: number }) => {
            const y = ctx.parsed.y ?? 0
            const snap = data[ctx.dataIndex]
            if (!snap) return `${y.toFixed(1)}%`
            return `Memory: ${y.toFixed(1)}% (${(snap.mem.used_mb / 1024).toFixed(1)} / ${(snap.mem.total_mb / 1024).toFixed(1)} GB)`
          }
        }
      }
    }
  }), [data])

  const diskOptions = useMemo(() => ({
    ...makeLineOptions('Usage', '%', 100),
    plugins: {
      ...makeLineOptions('Usage', '%', 100).plugins,
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (ctx: { parsed: { y: number | null }; dataIndex: number }) => {
            const y = ctx.parsed.y ?? 0
            const snap = data[ctx.dataIndex]
            if (!snap) return `${y.toFixed(1)}%`
            return `Disk: ${y.toFixed(1)}% (${snap.disk.used_gb.toFixed(0)} / ${snap.disk.total_gb.toFixed(0)} GB)`
          }
        }
      }
    }
  }), [data])

  const netOptions = useMemo(() => ({
    ...makeLineOptions('MB/min', ' MB'),
    plugins: {
      ...makeLineOptions('MB/min', ' MB').plugins,
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(2)} MB`
        }
      }
    }
  }), [])

  function pctColor(pct: number, warn = 80, crit = 90) {
    if (pct >= crit) return 'text-red-500'
    if (pct >= warn) return 'text-yellow-500'
    return 'text-green-500'
  }

  function cacheHitColor(ratio: number): string {
    if (ratio >= 0.99) return 'text-success-500'
    if (ratio >= 0.95) return 'text-warning-500'
    return 'text-error-500'
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-1">Server Health</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">System metrics and database health</p>

      {/* Time range selector */}
      <div className="flex items-center gap-2 mb-6">
        {RANGE_OPTIONS.map(opt => (
          <button
            key={opt.hours}
            onClick={() => setHours(opt.hours)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              hours === opt.hours
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {serverLoading && <div className="text-gray-500 dark:text-gray-400">Loading...</div>}

      {serverError && (
        <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400 mb-6">
          {serverError}
        </div>
      )}

      {!serverLoading && !serverError && snapshots.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 mb-6">
          No server stats data available
        </div>
      )}

      {!serverLoading && !serverError && latest && (
        <>
          {/* Current status cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CPU</div>
              <div className={`text-2xl font-bold ${pctColor(latest.cpu)}`}>{latest.cpu.toFixed(1)}%</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Memory</div>
              <div className={`text-2xl font-bold ${pctColor(latest.mem.pct)}`}>{latest.mem.pct.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{(latest.mem.used_mb / 1024).toFixed(1)} / {(latest.mem.total_mb / 1024).toFixed(1)} GB</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Disk</div>
              <div className={`text-2xl font-bold ${pctColor(latest.disk.pct, 70, 85)}`}>{latest.disk.pct.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{latest.disk.used_gb.toFixed(0)} / {latest.disk.total_gb.toFixed(0)} GB</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Load (1m)</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{latest.load[0].toFixed(2)}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{latest.load[1].toFixed(2)} / {latest.load[2].toFixed(2)} (5m/15m)</div>
            </div>
          </div>

          {/* CPU chart */}
          <div className={`${cardClass} mb-4`}>
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">CPU Usage</h2>
            <div className="h-52">
              <Line data={cpuData} options={makeLineOptions('Usage', '%', 100)} />
            </div>
          </div>

          {/* Memory & Disk side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className={cardClass}>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Memory Usage</h2>
              <div className="h-52">
                <Line data={memData} options={memOptions} />
              </div>
            </div>
            <div className={cardClass}>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disk Usage</h2>
              <div className="h-52">
                <Line data={diskData} options={diskOptions} />
              </div>
            </div>
          </div>

          {/* Network & Load side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className={cardClass}>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Network I/O</h2>
              <div className="h-52">
                <Line data={netData} options={netOptions} />
              </div>
            </div>
            <div className={cardClass}>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Load Average</h2>
              <div className="h-52">
                <Line data={loadData} options={makeLineOptions('Load', '')} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Database Health Section */}
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">Database Health</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Connection pool, cache, and search performance</p>

      {dbLoading && <div className="text-gray-500 dark:text-gray-400">Loading...</div>}

      {dbError && (
        <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400">
          {dbError}
        </div>
      )}

      {!dbLoading && !dbError && health && latency && (
        <>
          {/* Top cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Connection Pool */}
            <div className={cardClass}>
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
            <div className={cardClass}>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Cache Hit Ratio</div>
              <div className={`text-4xl font-semibold ${cacheHitColor(health.cacheHitRatio)}`}>
                {(health.cacheHitRatio * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {health.cacheHitRatio >= 0.99 ? 'Excellent' : health.cacheHitRatio >= 0.95 ? 'Good' : 'Low - check shared_buffers'}
              </div>
            </div>

            {/* Search Latency */}
            <div className={cardClass}>
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
