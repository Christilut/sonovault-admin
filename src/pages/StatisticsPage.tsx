import { useState, useEffect } from 'react'
import { subDays, format } from 'date-fns'
import DateRangePicker, { type DateRangeValue } from '@/components/DateRangePicker'
import HorizontalBarChart from '@/components/HorizontalBarChart'
import { getTopTracks, getTopArtists, type TopTrackEntry, type TopArtistEntry } from '@/api/stats'

const today = new Date()
const defaultRange: DateRangeValue = {
  startDate: format(subDays(today, 6), 'yyyy-MM-dd'),
  endDate: format(today, 'yyyy-MM-dd')
}

export default function StatisticsPage() {
  const [range, setRange] = useState<DateRangeValue>(defaultRange)
  const [activeTab, setActiveTab] = useState<'tracks' | 'artists'>('tracks')
  const [tracks, setTracks] = useState<TopTrackEntry[]>([])
  const [artists, setArtists] = useState<TopArtistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      getTopTracks(range.startDate, range.endDate),
      getTopArtists(range.startDate, range.endDate)
    ])
      .then(([t, a]) => { setTracks(t); setArtists(a) })
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(message || 'Failed to load statistics')
      })
      .finally(() => setLoading(false))
  }, [range])

  const tabClass = (tab: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'bg-brand-500 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
    }`

  const trackChartData = tracks.map(t => ({
    label: `${t.artistName} - ${t.title}`,
    value: t.hitCount,
    id: t.trackId
  }))

  const artistChartData = artists.map(a => ({
    label: a.name,
    value: a.hitCount,
    id: a.artistId
  }))

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-1">Search Statistics</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Most searched tracks and artists</p>

      <div className="flex items-center gap-4 mb-6">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('tracks')} className={tabClass('tracks')}>
          Top Tracks {tracks.length > 0 && `(${tracks.length})`}
        </button>
        <button onClick={() => setActiveTab('artists')} className={tabClass('artists')}>
          Top Artists {artists.length > 0 && `(${artists.length})`}
        </button>
      </div>

      {loading && <div className="text-gray-500 dark:text-gray-400">Loading...</div>}

      {error && (
        <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
          {activeTab === 'tracks' && (
            tracks.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No track search data for this period</div>
            ) : (
              <HorizontalBarChart data={trackChartData} />
            )
          )}
          {activeTab === 'artists' && (
            artists.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No artist search data for this period</div>
            ) : (
              <HorizontalBarChart data={artistChartData} />
            )
          )}
        </div>
      )}
    </div>
  )
}
