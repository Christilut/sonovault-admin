import { useState, useEffect, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'
import { getImportHistory, type ImportDaySummary } from '@/api/import-history'
import { getSourceLabel, getSourceColor } from '@/utils/colors'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function formatDate(dateStr: string): string {
  const dateOnly = dateStr.split('T')[0] || dateStr
  const parts = dateOnly.split('-')
  const year = parseInt(parts[0] || '0', 10)
  const month = parseInt(parts[1] || '1', 10)
  const day = parseInt(parts[2] || '1', 10)
  const date = new Date(year, month - 1, day)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === yesterday.getTime()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatShortDate(dateStr: string): string {
  const dateOnly = dateStr.split('T')[0] || dateStr
  const parts = dateOnly.split('-')
  const month = parseInt(parts[1] || '1', 10)
  const day = parseInt(parts[2] || '1', 10)
  return `${month}/${day}`
}

export default function ImportHistoryPage() {
  const [history, setHistory] = useState<ImportDaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getImportHistory(30)
      .then(setHistory)
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(message || 'Failed to load import history')
      })
      .finally(() => setLoading(false))
  }, [])

  // Build chart data: last 30 days with Spotify (0) and Beatport (1) track counts
  const chartData = useMemo(() => {
    const days: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      days.push(`${yyyy}-${mm}-${dd}`)
    }

    // Index track counts by date+source
    const tracksByDateSource: Record<string, Record<number, number>> = {}
    for (const item of history) {
      const dateKey = (item.date.split('T')[0] || item.date)
      if (!tracksByDateSource[dateKey]) tracksByDateSource[dateKey] = {}
      tracksByDateSource[dateKey][item.source] = item.tracks
    }

    const spotifyData = days.map(d => tracksByDateSource[d]?.[0] ?? 0)
    const beatportData = days.map(d => tracksByDateSource[d]?.[1] ?? 0)
    const labels = days.map(formatShortDate)

    return {
      labels,
      datasets: [
        {
          label: 'Spotify',
          data: spotifyData,
          backgroundColor: getSourceColor(0),
          borderRadius: 3,
        },
        {
          label: 'Beatport',
          data: beatportData,
          backgroundColor: getSourceColor(1),
          borderRadius: 3,
        }
      ]
    }
  }, [history])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded' as const,
          boxWidth: 10,
          boxHeight: 10,
          padding: 16,
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()} tracks`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        }
      }
    }
  }

  // Group by date for the list
  const grouped: Record<string, ImportDaySummary[]> = {}
  for (const item of history) {
    if (!grouped[item.date]) grouped[item.date] = []
    grouped[item.date].push(item)
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-1">Import History</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Daily import summary for the last 30 days</p>

      {loading && <div className="text-gray-500 dark:text-gray-400">Loading...</div>}

      {error && (
        <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 mb-6">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Tracks Imported Per Day</h2>
            <div className="h-64">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* History list */}
          {sortedDates.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              No import history found in the last 30 days
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedDates.map(date => (
                  grouped[date].map(item => (
                    <div key={`${date}-${item.source}`} className="flex items-center px-4 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-28 shrink-0">{formatDate(date)}</span>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white dark:text-gray-900 w-20 justify-center shrink-0 mr-6"
                        style={{ backgroundColor: getSourceColor(item.source) }}
                      >
                        {getSourceLabel(item.source)}
                      </span>
                      <div className="flex items-center gap-6 text-sm">
                        {item.tracks > 0 && <span className="text-gray-700 dark:text-gray-300 w-24"><span className="font-semibold">{item.tracks.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">tracks</span></span>}
                        {item.releases > 0 && <span className="text-gray-700 dark:text-gray-300 w-24"><span className="font-semibold">{item.releases.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">releases</span></span>}
                        {item.artists > 0 && <span className="text-gray-700 dark:text-gray-300 w-24"><span className="font-semibold">{item.artists.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">artists</span></span>}
                        {item.labels > 0 && <span className="text-gray-700 dark:text-gray-300 w-24"><span className="font-semibold">{item.labels.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">labels</span></span>}
                        {item.genres > 0 && <span className="text-gray-700 dark:text-gray-300 w-24"><span className="font-semibold">{item.genres.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">genres</span></span>}
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
