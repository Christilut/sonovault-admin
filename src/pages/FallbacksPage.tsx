import { useState, useEffect } from 'react'
import { subDays, format } from 'date-fns'
import DateRangePicker, { type DateRangeValue } from '@/components/DateRangePicker'
import { getFallbackLogs, type FallbackLogEntry } from '@/api/stats'

const today = new Date()
const defaultRange: DateRangeValue = {
  startDate: format(subDays(today, 6), 'yyyy-MM-dd'),
  endDate: format(today, 'yyyy-MM-dd')
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString()
}

function durationColor(ms: number): string {
  if (ms >= 15000) return 'text-error-500'
  if (ms >= 5000) return 'text-error-500'
  if (ms >= 2000) return 'text-warning-500'
  return 'text-gray-600 dark:text-gray-300'
}

function hasResult(entry: FallbackLogEntry): boolean {
  return entry.ingested > 0 || entry.spotifyCount > 0 || entry.beatportCount > 0
}

export default function FallbacksPage() {
  const [range, setRange] = useState<DateRangeValue>(defaultRange)
  const [entries, setEntries] = useState<FallbackLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getFallbackLogs(range.startDate, range.endDate)
      .then(result => { setEntries(result.entries); setTotal(result.total) })
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(message || 'Failed to load fallback logs')
      })
      .finally(() => setLoading(false))
  }, [range])

  const avgDuration = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + e.apiDurationMs, 0) / entries.length)
    : 0

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-1">Fallback Searches</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">External API searches when local DB has no results</p>

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
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Fallbacks</div>
              <div className="text-3xl font-semibold text-gray-800 dark:text-white/90">{total.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg API Duration</div>
              <div className="text-3xl font-semibold text-gray-800 dark:text-white/90">{avgDuration}ms</div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            {entries.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No fallback searches for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Original Query</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Spotify</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Beatport</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ingested</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {entries.map(entry => {
                      const got = hasResult(entry)
                      return (
                        <tr
                          key={entry.id}
                          className={got
                            ? 'bg-success-50 dark:bg-success-500/10'
                            : 'bg-error-50 dark:bg-error-500/10'
                          }
                        >
                          <td className={`py-3 pl-1 pr-4 whitespace-nowrap text-gray-600 dark:text-gray-300 border-l-4 ${got ? 'border-l-success-500' : 'border-l-error-400'}`}><span className="pl-3">{formatTimestamp(entry.createdAt)}</span></td>
                          <td className="px-4 py-3 text-gray-800 dark:text-white/90 max-w-xs truncate" title={entry.originalQuery}>{entry.originalQuery}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{entry.spotifyCount}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{entry.beatportCount}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{entry.ingested}</td>
                          <td className={`px-4 py-3 whitespace-nowrap font-medium ${durationColor(entry.apiDurationMs)}`}>
                            {Math.round(entry.apiDurationMs)}ms
                            {entry.apiDurationMs >= 15000 && (
                              <svg className="inline-block w-4 h-4 ml-1 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
