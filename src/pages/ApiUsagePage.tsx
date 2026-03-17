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
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns'
import DateRangePicker, { type DateRangeValue } from '@/components/DateRangePicker'
import { getApiUsageStats, type ApiUsageEntry } from '@/api/stats'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const today = new Date()
const defaultRange: DateRangeValue = {
  startDate: format(subDays(today, 29), 'yyyy-MM-dd'),
  endDate: format(today, 'yyyy-MM-dd')
}

function formatDate(dateStr: string): string {
  const dateOnly = dateStr.split('T')[0] || dateStr
  const parts = dateOnly.split('-')
  const year = parseInt(parts[0] || '0', 10)
  const month = parseInt(parts[1] || '1', 10)
  const day = parseInt(parts[2] || '1', 10)
  const date = new Date(year, month - 1, day)

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.getTime() === now.getTime()) return 'Today'
  if (date.getTime() === yesterday.getTime()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-')
  const month = parseInt(parts[1] || '1', 10)
  const day = parseInt(parts[2] || '1', 10)
  return `${month}/${day}`
}

export default function ApiUsagePage() {
  const [range, setRange] = useState<DateRangeValue>(defaultRange)
  const [entries, setEntries] = useState<ApiUsageEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getApiUsageStats(range.startDate, range.endDate)
      .then(setEntries)
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(message || 'Failed to load API usage stats')
      })
      .finally(() => setLoading(false))
  }, [range])

  // Build stacked bar chart: requests_in, db_hits, db_misses per day
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(range.startDate),
      end: parseISO(range.endDate)
    }).map(d => format(d, 'yyyy-MM-dd'))

    // Index by date (sum across all API keys)
    const byDate: Record<string, { requestsIn: number; dbHits: number; dbMisses: number }> = {}
    for (const entry of entries) {
      const dateKey = entry.date.split('T')[0] || entry.date
      if (!byDate[dateKey]) byDate[dateKey] = { requestsIn: 0, dbHits: 0, dbMisses: 0 }
      byDate[dateKey].requestsIn += entry.requestsIn
      byDate[dateKey].dbHits += entry.dbHits
      byDate[dateKey].dbMisses += entry.dbMisses
    }

    const dbHitsData = days.map(d => byDate[d]?.dbHits ?? 0)
    const dbMissesData = days.map(d => byDate[d]?.dbMisses ?? 0)
    const requestsInData = days.map(d => byDate[d]?.requestsIn ?? 0)
    const labels = days.map(formatShortDate)

    return {
      labels,
      datasets: [
        {
          label: 'DB Hits',
          data: dbHitsData,
          backgroundColor: '#16A34A',
          borderRadius: 3,
        },
        {
          label: 'DB Misses',
          data: dbMissesData,
          backgroundColor: '#F59E0B',
          borderRadius: 3,
        }
      ],
      _requestsIn: requestsInData,
    }
  }, [entries, range])

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
        mode: 'index' as const,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()}`,
          footer: (items: { dataIndex: number }[]) => {
            if (items.length === 0) return ''
            const idx = items[0].dataIndex
            const total = (chartData as unknown as { _requestsIn: number[] })._requestsIn?.[idx] ?? 0
            return `Total Requests: ${total.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { precision: 0 },
      }
    }
  }

  // Sort entries by date desc for the list
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-1">API Usage</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Search request statistics per API key</p>

      <div className="flex items-center gap-4 mb-6">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

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
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Requests Per Day</h2>
            <div className="h-64">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Usage list */}
          {sortedEntries.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              No API usage data for this period
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedEntries.map(entry => (
                  <div key={`${entry.date}-${entry.apiKeyLabel}`} className="flex items-center gap-4 px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-28 shrink-0">{formatDate(entry.date)}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-white w-24 justify-center shrink-0">
                      {entry.apiKeyLabel}
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{entry.requestsIn.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">requests</span></span>
                      <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{entry.dbHits.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">db hits</span></span>
                      <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{entry.dbMisses.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">db misses</span></span>
                      {entry.spotifyHits > 0 && <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{entry.spotifyHits.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">spotify</span></span>}
                      {entry.beatportHits > 0 && <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{entry.beatportHits.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">beatport</span></span>}
                      <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{entry.results.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">results</span></span>
                      <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{entry.noResults.toLocaleString()}</span> <span className="text-gray-400 dark:text-gray-500">no results</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
