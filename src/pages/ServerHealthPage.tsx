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
  getDbStatsHistory,
  getEsStatsHistory,
  getDbHealthStats,
  getLatencyStats,
  getAlertThresholds,
  type ServerSnapshot,
  type DbServerSnapshot,
  type EsSnapshot,
  type DbHealth,
  type LatencyStats,
  type AlertThresholds
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

function downsample<T>(snapshots: T[], maxPoints: number): T[] {
  if (snapshots.length <= maxPoints) return snapshots
  const step = snapshots.length / maxPoints
  const result: T[] = []
  for (let i = 0; i < maxPoints; i++) {
    result.push(snapshots[Math.floor(i * step)])
  }
  if (result[result.length - 1] !== snapshots[snapshots.length - 1]) {
    result.push(snapshots[snapshots.length - 1])
  }
  return result
}

const cardClass = 'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5'
const sectionHeaderClass = 'flex items-center gap-3 mb-4 mt-8'
const sectionTitleClass = 'text-lg font-semibold text-gray-800 dark:text-white/90'
const sectionBadgeClass = 'px-2 py-0.5 text-xs font-medium rounded-full'

function makeLineOptions(yLabel: string, unit: string, maxY?: number) {
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
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
      y: {
        beginAtZero: true,
        ...(maxY != null ? { max: maxY } : {}),
        title: { display: true, text: yLabel },
        ticks: { callback: (value: string | number) => `${value}${unit}` }
      }
    },
    elements: {
      point: { radius: 0, hitRadius: 8, hoverRadius: 4 },
      line: { tension: 0.3, borderWidth: 1.5 }
    }
  }
}

function pctColor(pct: number, warn = 80, crit = 90) {
  if (pct >= crit) return 'text-red-500'
  if (pct >= warn) return 'text-yellow-500'
  return 'text-green-500'
}

function esStatusColor(status: string) {
  if (status === 'green') return 'text-green-500'
  if (status === 'yellow') return 'text-yellow-500'
  return 'text-red-500'
}

function esStatusBg(status: string) {
  if (status === 'green') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (status === 'yellow') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

export default function ServerHealthPage() {
  const [hours, setHours] = useState(24)

  // sv-app1 state
  const [app1Snapshots, setApp1Snapshots] = useState<ServerSnapshot[]>([])
  const [app1Loading, setApp1Loading] = useState(true)
  const [app1Error, setApp1Error] = useState('')

  // sv-db1 state
  const [db1Snapshots, setDb1Snapshots] = useState<DbServerSnapshot[]>([])
  const [db1Loading, setDb1Loading] = useState(true)
  const [db1Error, setDb1Error] = useState('')

  // ES state
  const [esSnapshots, setEsSnapshots] = useState<EsSnapshot[]>([])
  const [esLoading, setEsLoading] = useState(true)
  const [esError, setEsError] = useState('')

  // DB health state (tables, indexes, etc.)
  const [health, setHealth] = useState<DbHealth | null>(null)
  const [latency, setLatency] = useState<LatencyStats | null>(null)
  const [dbHealthLoading, setDbHealthLoading] = useState(true)
  const [dbHealthError, setDbHealthError] = useState('')

  // Alert thresholds
  const [alertThresholds, setAlertThresholds] = useState<AlertThresholds | null>(null)

  // Fetch all time-series data when hours changes
  useEffect(() => {
    setApp1Loading(true)
    setDb1Loading(true)
    setEsLoading(true)

    getServerStatsHistory(hours)
      .then(res => { setApp1Snapshots(res.snapshots); setApp1Error('') })
      .catch(() => setApp1Error('Failed to load sv-app1 stats'))
      .finally(() => setApp1Loading(false))

    getDbStatsHistory(hours)
      .then(res => { setDb1Snapshots(res.snapshots); setDb1Error('') })
      .catch(() => setDb1Error('Failed to load sv-db1 stats'))
      .finally(() => setDb1Loading(false))

    getEsStatsHistory(hours)
      .then(res => { setEsSnapshots(res.snapshots); setEsError('') })
      .catch(() => setEsError('Failed to load Elasticsearch stats'))
      .finally(() => setEsLoading(false))
  }, [hours])

  // Fetch DB health and alert thresholds once
  const fetchDbHealth = useCallback(() => {
    Promise.all([getDbHealthStats(), getLatencyStats()])
      .then(([h, l]) => { setHealth(h); setLatency(l); setDbHealthError('') })
      .catch(() => setDbHealthError('Failed to load health data'))
      .finally(() => setDbHealthLoading(false))
  }, [])

  useEffect(() => { fetchDbHealth() }, [fetchDbHealth])
  useEffect(() => { getAlertThresholds().then(setAlertThresholds).catch(() => {}) }, [])

  // --- sv-app1 chart data ---
  const app1Data = useMemo(() => downsample(app1Snapshots, 200), [app1Snapshots])
  const app1Labels = useMemo(() => app1Data.map(s => formatTime(s.ts, hours)), [app1Data, hours])
  const app1Latest = app1Snapshots.length > 0 ? app1Snapshots[app1Snapshots.length - 1] : null

  const cpuData = useMemo(() => ({
    labels: app1Labels,
    datasets: [{ label: 'CPU', data: app1Data.map(s => s.cpu), borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true }]
  }), [app1Data, app1Labels])

  const memData = useMemo(() => ({
    labels: app1Labels,
    datasets: [{ label: 'Memory', data: app1Data.map(s => s.mem.pct), borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true }]
  }), [app1Data, app1Labels])

  const diskData = useMemo(() => ({
    labels: app1Labels,
    datasets: [{ label: 'Disk', data: app1Data.map(s => s.disk.pct), borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)', fill: true }]
  }), [app1Data, app1Labels])

  const netData = useMemo(() => ({
    labels: app1Labels,
    datasets: [
      { label: 'RX', data: app1Data.map(s => s.net.rx_mb), borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true },
      { label: 'TX', data: app1Data.map(s => s.net.tx_mb), borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,0.1)', fill: true },
    ]
  }), [app1Data, app1Labels])

  const loadData = useMemo(() => ({
    labels: app1Labels,
    datasets: [
      { label: '1m', data: app1Data.map(s => s.load[0]), borderColor: '#EF4444', backgroundColor: 'transparent' },
      { label: '5m', data: app1Data.map(s => s.load[1]), borderColor: '#F59E0B', backgroundColor: 'transparent' },
      { label: '15m', data: app1Data.map(s => s.load[2]), borderColor: '#10B981', backgroundColor: 'transparent' },
    ]
  }), [app1Data, app1Labels])

  const memOptions = useMemo(() => ({
    ...makeLineOptions('Usage', '%', 100),
    plugins: {
      ...makeLineOptions('Usage', '%', 100).plugins,
      tooltip: {
        mode: 'index' as const, intersect: false,
        callbacks: {
          label: (ctx: { parsed: { y: number | null }; dataIndex: number }) => {
            const y = ctx.parsed.y ?? 0
            const snap = app1Data[ctx.dataIndex]
            if (!snap) return `${y.toFixed(1)}%`
            return `Memory: ${y.toFixed(1)}% (${(snap.mem.used_mb / 1024).toFixed(1)} / ${(snap.mem.total_mb / 1024).toFixed(1)} GB)`
          }
        }
      }
    }
  }), [app1Data])

  const diskOptions = useMemo(() => ({
    ...makeLineOptions('Usage', '%', 100),
    plugins: {
      ...makeLineOptions('Usage', '%', 100).plugins,
      tooltip: {
        mode: 'index' as const, intersect: false,
        callbacks: {
          label: (ctx: { parsed: { y: number | null }; dataIndex: number }) => {
            const y = ctx.parsed.y ?? 0
            const snap = app1Data[ctx.dataIndex]
            if (!snap) return `${y.toFixed(1)}%`
            return `Disk: ${y.toFixed(1)}% (${snap.disk.used_gb.toFixed(0)} / ${snap.disk.total_gb.toFixed(0)} GB)`
          }
        }
      }
    }
  }), [app1Data])

  const netOptions = useMemo(() => ({
    ...makeLineOptions('MB/min', ' MB'),
    plugins: {
      ...makeLineOptions('MB/min', ' MB').plugins,
      tooltip: {
        mode: 'index' as const, intersect: false,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(2)} MB`
        }
      }
    }
  }), [])

  // --- sv-db1 chart data ---
  const db1Data = useMemo(() => downsample(db1Snapshots, 200), [db1Snapshots])
  const db1Labels = useMemo(() => db1Data.map(s => formatTime(s.ts, hours)), [db1Data, hours])
  const db1Latest = db1Snapshots.length > 0 ? db1Snapshots[db1Snapshots.length - 1] : null

  const connData = useMemo(() => ({
    labels: db1Labels,
    datasets: [{
      label: 'Connections %',
      data: db1Data.map(s => s.connections.max > 0 ? Math.round((s.connections.total / s.connections.max) * 1000) / 10 : 0),
      borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true,
    }]
  }), [db1Data, db1Labels])

  const connOptions = useMemo(() => ({
    ...makeLineOptions('Usage', '%', 100),
    plugins: {
      ...makeLineOptions('Usage', '%', 100).plugins,
      tooltip: {
        mode: 'index' as const, intersect: false,
        callbacks: {
          label: (ctx: { parsed: { y: number | null }; dataIndex: number }) => {
            const snap = db1Data[ctx.dataIndex]
            if (!snap) return `${(ctx.parsed.y ?? 0).toFixed(1)}%`
            return `Connections: ${snap.connections.total} / ${snap.connections.max} (${(ctx.parsed.y ?? 0).toFixed(1)}%)`
          }
        }
      }
    }
  }), [db1Data])

  const cacheHitData = useMemo(() => ({
    labels: db1Labels,
    datasets: [{
      label: 'Cache Hit Ratio',
      data: db1Data.map(s => Math.round(s.cache_hit_ratio * 10000) / 100),
      borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true,
    }]
  }), [db1Data, db1Labels])

  const dbSizeData = useMemo(() => ({
    labels: db1Labels,
    datasets: [{
      label: 'Database Size',
      data: db1Data.map(s => s.db_size_gb),
      borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)', fill: true,
    }]
  }), [db1Data, db1Labels])

  const txnData = useMemo(() => ({
    labels: db1Labels,
    datasets: [{
      label: 'Transactions',
      data: db1Data.map(s => s.txn_rate),
      borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true,
    }]
  }), [db1Data, db1Labels])

  // --- ES chart data ---
  const esData = useMemo(() => downsample(esSnapshots, 200), [esSnapshots])
  const esLabels = useMemo(() => esData.map(s => formatTime(s.ts, hours)), [esData, hours])
  const esLatest = esSnapshots.length > 0 ? esSnapshots[esSnapshots.length - 1] : null

  const jvmData = useMemo(() => ({
    labels: esLabels,
    datasets: [{
      label: 'JVM Heap',
      data: esData.map(s => s.jvm_heap_pct),
      borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true,
    }]
  }), [esData, esLabels])

  const esDocData = useMemo(() => ({
    labels: esLabels,
    datasets: [{
      label: 'Documents',
      data: esData.map(s => s.doc_count),
      borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true,
    }]
  }), [esData, esLabels])

  function renderError(msg: string) {
    return (
      <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400 mb-6">
        {msg}
      </div>
    )
  }

  function renderNoData() {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 mb-6">
        No data available
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-1">Server Health</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">System metrics across all servers</p>

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

      {/* ──────────── sv-app1 ──────────── */}
      <div className={sectionHeaderClass}>
        <h2 className={sectionTitleClass}>sv-app1</h2>
        <span className={`${sectionBadgeClass} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`}>Application Server</span>
      </div>

      {app1Loading && <div className="text-gray-500 dark:text-gray-400 mb-4">Loading...</div>}
      {app1Error && renderError(app1Error)}

      {!app1Loading && !app1Error && !app1Latest && renderNoData()}

      {!app1Loading && !app1Error && app1Latest && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CPU</div>
              <div className={`text-2xl font-bold ${pctColor(app1Latest.cpu)}`}>{app1Latest.cpu.toFixed(1)}%</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Memory</div>
              <div className={`text-2xl font-bold ${pctColor(app1Latest.mem.pct)}`}>{app1Latest.mem.pct.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{(app1Latest.mem.used_mb / 1024).toFixed(1)} / {(app1Latest.mem.total_mb / 1024).toFixed(1)} GB</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Disk</div>
              <div className={`text-2xl font-bold ${pctColor(app1Latest.disk.pct, 70, 85)}`}>{app1Latest.disk.pct.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{app1Latest.disk.used_gb.toFixed(0)} / {app1Latest.disk.total_gb.toFixed(0)} GB</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Load (1m)</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{app1Latest.load[0].toFixed(2)}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{app1Latest.load[1].toFixed(2)} / {app1Latest.load[2].toFixed(2)} (5m/15m)</div>
            </div>
          </div>

          <div className={`${cardClass} mb-4`}>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">CPU Usage</h3>
            <div className="h-52"><Line data={cpuData} options={makeLineOptions('Usage', '%', 100)} /></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Memory Usage</h3>
              <div className="h-52"><Line data={memData} options={memOptions} /></div>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disk Usage</h3>
              <div className="h-52"><Line data={diskData} options={diskOptions} /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Network I/O</h3>
              <div className="h-52"><Line data={netData} options={netOptions} /></div>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Load Average</h3>
              <div className="h-52"><Line data={loadData} options={makeLineOptions('Load', '')} /></div>
            </div>
          </div>
        </>
      )}

      {/* Elasticsearch (runs on sv-app1) */}
      <div className={`${sectionHeaderClass} mt-6`}>
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">Elasticsearch</h3>
        {esLatest && <span className={`${sectionBadgeClass} ${esStatusBg(esLatest.status)}`}>{esLatest.status.toUpperCase()}</span>}
      </div>

      {esLoading && <div className="text-gray-500 dark:text-gray-400 mb-4">Loading...</div>}
      {esError && renderError(esError)}

      {!esLoading && !esError && !esLatest && renderNoData()}

      {!esLoading && !esError && esLatest && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cluster Status</div>
              <div className={`text-2xl font-bold ${esStatusColor(esLatest.status)}`}>{esLatest.status.toUpperCase()}</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Documents</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{esLatest.doc_count.toLocaleString()}</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Store Size</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{esLatest.store_size_mb >= 1024 ? `${(esLatest.store_size_mb / 1024).toFixed(1)} GB` : `${esLatest.store_size_mb} MB`}</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">JVM Heap</div>
              <div className={`text-2xl font-bold ${pctColor(esLatest.jvm_heap_pct, 70, 85)}`}>{esLatest.jvm_heap_pct.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">JVM Heap Usage</h3>
              <div className="h-44"><Line data={jvmData} options={makeLineOptions('Usage', '%', 100)} /></div>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Document Count</h3>
              <div className="h-44"><Line data={esDocData} options={makeLineOptions('Docs', '')} /></div>
            </div>
          </div>
        </>
      )}

      {/* Search Latency (powered by sv-app1, queries sv-db1) */}
      {latency && (
        <div className={`${cardClass} mb-4`}>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Search Latency</div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <span className="text-gray-600 dark:text-gray-300 text-sm">p50</span>
              <div className="font-semibold text-gray-800 dark:text-white/90">{latency.p50.toFixed(1)}ms</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-300 text-sm">p95</span>
              <div className="font-semibold text-gray-800 dark:text-white/90">{latency.p95.toFixed(1)}ms</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-300 text-sm">p99</span>
              <div className="font-semibold text-gray-800 dark:text-white/90">{latency.p99.toFixed(1)}ms</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-300 text-sm">Samples</span>
              <div className="text-sm text-gray-500 dark:text-gray-400">{latency.count.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────── sv-db1 ──────────── */}
      <div className={sectionHeaderClass}>
        <h2 className={sectionTitleClass}>sv-db1</h2>
        <span className={`${sectionBadgeClass} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400`}>Database Server</span>
      </div>

      {db1Loading && <div className="text-gray-500 dark:text-gray-400 mb-4">Loading...</div>}
      {db1Error && renderError(db1Error)}

      {!db1Loading && !db1Error && !db1Latest && renderNoData()}

      {!db1Loading && !db1Error && db1Latest && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Connections</div>
              <div className={`text-2xl font-bold ${pctColor(db1Latest.connections.max > 0 ? (db1Latest.connections.total / db1Latest.connections.max) * 100 : 0)}`}>
                {db1Latest.connections.max > 0 ? ((db1Latest.connections.total / db1Latest.connections.max) * 100).toFixed(0) : 0}%
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{db1Latest.connections.total} / {db1Latest.connections.max}</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cache Hit Ratio</div>
              <div className={`text-2xl font-bold ${db1Latest.cache_hit_ratio >= 0.99 ? 'text-green-500' : db1Latest.cache_hit_ratio >= 0.95 ? 'text-yellow-500' : 'text-red-500'}`}>
                {(db1Latest.cache_hit_ratio * 100).toFixed(2)}%
              </div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Database Size</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{db1Latest.db_size_gb.toFixed(1)} GB</div>
            </div>
            <div className={cardClass}>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Dead Tuples</div>
              <div className={`text-2xl font-bold ${pctColor(db1Latest.dead_tuple_pct, 5, 10)}`}>{db1Latest.dead_tuple_pct.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Connection Utilization</h3>
              <div className="h-52"><Line data={connData} options={connOptions} /></div>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Cache Hit Ratio</h3>
              <div className="h-52"><Line data={cacheHitData} options={makeLineOptions('Ratio', '%', 100)} /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Database Size</h3>
              <div className="h-52"><Line data={dbSizeData} options={makeLineOptions('Size', ' GB')} /></div>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Transactions / min</h3>
              <div className="h-52"><Line data={txnData} options={makeLineOptions('Txns', '')} /></div>
            </div>
          </div>
        </>
      )}

      {/* DB Health tables (from sv-db1) */}
      {dbHealthLoading && <div className="text-gray-500 dark:text-gray-400 mb-4">Loading database details...</div>}
      {dbHealthError && renderError(dbHealthError)}

      {!dbHealthLoading && !dbHealthError && health && (
        <>
          {/* Table Sizes */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Table Sizes</h3>
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
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Index Usage (Top 50)</h3>
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
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">Dead Tuples</h3>
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

      {/* ──────────── Alert Thresholds ──────────── */}
      <div className={sectionHeaderClass}>
        <h2 className={sectionTitleClass}>Slack Alert Thresholds</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Alerts fire with a 15-minute cooldown per metric</p>

      {alertThresholds && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(alertThresholds).map(([server, thresholds]) => (
            <div key={server} className={cardClass}>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{server}</div>
              <div className="space-y-2">
                {thresholds.map(t => (
                  <div key={t.metric} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t.metric}</span>
                    <span className="text-gray-800 dark:text-white/80 font-medium">{t.condition}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
