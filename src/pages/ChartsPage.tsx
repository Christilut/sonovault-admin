import { useState, useEffect, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import 'react-day-picker/style.css'
import { getChart, type ChartTrack, type ChartResponse } from '@/api/charts'
import type { TrackSearchResult } from '@/api/search'
import TrackResultRow from '@/components/TrackResultRow'
import { getChartSourceLabel, chartSourceLabels } from '@/utils/colors'

// ── Hardcoded chart definitions ──────────────────────────────────────────────

interface ChartOption {
  source: string
  chartType: string
  genre?: string
  country?: string
  city?: string
  label: string
}

const BEATPORT_GENRES = [
  'All Genres', 'Afro House', 'Amapiano', 'Bass', 'Bass House', 'Breaks',
  'Dance', 'Deep House', 'Drum & Bass', 'Dubstep', 'Electro', 'Electronica',
  'Funky House', 'Grime', 'Hardcore', 'Hard Techno', 'Hardstyle', 'House',
  'Indie Dance', 'Jackin House', 'Mainstage', 'Melodic House & Techno',
  'Minimal', 'Nu Disco', 'Downtempo', 'Progressive House', 'Psy-Trance',
  'Tech House', 'Techno Peak Time', 'Techno Hypnotic', 'Trance Main Floor',
  'Trance Hypnotic', 'Trap', 'UK Garage'
]

const BEATPORT_HYPE_GENRES = [
  'All Genres', 'Deep House', 'Drum & Bass', 'Electronica', 'House',
  'Indie Dance', 'Melodic House & Techno', 'Progressive House', 'Tech House'
]

const BILLBOARD_TYPES = [
  { type: 'hot100', label: 'Hot 100' },
  { type: 'rnb', label: 'R&B' },
  { type: 'country', label: 'Country' },
  { type: 'dance', label: 'Dance' },
  { type: 'latin', label: 'Latin' },
  { type: 'tiktok', label: 'TikTok' },
  { type: 'rap', label: 'Rap' },
  { type: 'afrobeats', label: 'Afrobeats' },
]

const APPLE_MUSIC_GENRES = [
  'Pop', 'Hip-Hop/Rap', 'R&B/Soul', 'Electronic', 'Dance', 'Rock',
  'Country', 'Latin', 'Jazz', 'Classical', 'Singer/Songwriter', 'Blues',
  'Reggae', 'K-Pop', 'Afrobeats'
]

const APPLE_MUSIC_COUNTRIES = ['us', 'gb', 'de', 'fr', 'au', 'ca', 'nl', 'br', 'mx', 'jp']

const SHAZAM_COUNTRIES = ['US', 'GB', 'DE', 'FR', 'AU', 'CA', 'NL', 'BR', 'MX', 'JP', 'KR', 'ES', 'IT', 'SE', 'IN', 'ZA', 'PL', 'TR', 'SA']

interface ShazamCity { country: string; cities: string[] }
const SHAZAM_CITIES: ShazamCity[] = [
  { country: 'US', cities: ['New York', 'Los Angeles', 'Chicago'] },
  { country: 'GB', cities: ['London'] },
  { country: 'DE', cities: ['Berlin'] },
  { country: 'FR', cities: ['Paris'] },
  { country: 'AU', cities: ['Sydney'] },
  { country: 'CA', cities: ['Toronto'] },
  { country: 'NL', cities: ['Amsterdam'] },
  { country: 'BR', cities: ['São Paulo'] },
  { country: 'MX', cities: ['Mexico City'] },
  { country: 'JP', cities: ['Tokyo'] },
  { country: 'KR', cities: ['Seoul'] },
]

function buildChartOptions(): Record<string, ChartOption[]> {
  const map: Record<string, ChartOption[]> = {}

  // Beatport
  const beatport: ChartOption[] = []
  for (const genre of BEATPORT_GENRES) {
    beatport.push({ source: 'beatport', chartType: 'top100', genre, label: `${genre} Top 100` })
  }
  for (const genre of BEATPORT_HYPE_GENRES) {
    beatport.push({ source: 'beatport', chartType: 'hype100', genre, label: `${genre} Hype 100` })
  }
  map.beatport = beatport

  // Billboard
  map.billboard = BILLBOARD_TYPES.map(t => ({
    source: 'billboard', chartType: t.type, label: t.label
  }))

  // Apple Music
  const apple: ChartOption[] = []
  for (const genre of APPLE_MUSIC_GENRES) {
    for (const country of APPLE_MUSIC_COUNTRIES) {
      apple.push({ source: 'applemusic', chartType: 'genre-top', genre, country, label: `${genre} - ${country.toUpperCase()}` })
    }
  }
  map.applemusic = apple

  // Shazam Global
  map['shazam-global'] = SHAZAM_COUNTRIES.map(c => ({
    source: 'shazam-global', chartType: 'top200', country: c, label: `Top 200 - ${c}`
  }))

  // Shazam Local
  const local: ChartOption[] = []
  for (const { country, cities } of SHAZAM_CITIES) {
    for (const city of cities) {
      local.push({ source: 'shazam-local', chartType: 'local', country, city, label: `${city}, ${country}` })
    }
  }
  map['shazam-local'] = local

  // Historical
  const years: ChartOption[] = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= 2000; y--) {
    years.push({ source: 'historical', chartType: 'yearly', genre: String(y), label: String(y) })
  }
  map.historical = years

  return map
}

const CHART_OPTIONS = buildChartOptions()

// ── Helpers ──────────────────────────────────────────────────────────────────

function chartTrackToSearchResult(track: ChartTrack): TrackSearchResult {
  return {
    id: track.track_id,
    title: track.title,
    artists: track.artists.map(a => ({ ...a, is_remixer: false })),
    release: track.release,
    isrc: track.isrc,
    bpm: track.bpm,
    key: track.key,
    duration: track.duration,
    popularity: track.popularity,
    energy: track.energy,
    genres: track.genres.map(g => ({ name: g.name, source: g.source })),
  }
}

function formatChartDate(dateStr: string): string {
  // Handle both "2026-03-21" and "2026-03-21T23:00:00.000Z" formats
  const dateOnly = dateStr.slice(0, 10)
  const d = new Date(dateOnly + 'T00:00:00')
  return format(d, 'MMMM d, yyyy')
}

function optionKey(opt: ChartOption): string {
  return `${opt.source}|${opt.chartType}|${opt.genre || ''}|${opt.country || ''}|${opt.city || ''}`
}

function todayDate(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

const ALL_SOURCES = Object.keys(chartSourceLabels)

// ── Component ────────────────────────────────────────────────────────────────

export default function ChartsPage() {
  const [activeSource, setActiveSource] = useState<string>('beatport')
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [date, setDate] = useState(todayDate())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [chartData, setChartData] = useState<ChartResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const calendarRef = useRef<HTMLDivElement>(null)

  const options = CHART_OPTIONS[activeSource] || []
  const selected = options.find(o => optionKey(o) === selectedKey)

  // Set default selection when source changes
  useEffect(() => {
    const opts = CHART_OPTIONS[activeSource]
    if (opts && opts.length > 0) {
      setSelectedKey(optionKey(opts[0]))
    } else {
      setSelectedKey('')
    }
    setChartData(null)
  }, [activeSource])

  // Auto-select first beatport chart on mount
  useEffect(() => {
    const opts = CHART_OPTIONS.beatport
    if (opts && opts.length > 0) {
      setSelectedKey(optionKey(opts[0]))
    }
  }, [])

  // Close calendar on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch chart data whenever selection or date changes
  useEffect(() => {
    if (!selected) return

    let cancelled = false
    setLoading(true)
    setError('')
    setChartData(null)

    getChart(selected.source, selected.chartType, {
      genre: selected.genre,
      country: selected.country,
      city: selected.city,
      date: fmt(date),
      limit: 200
    })
      .then(data => { if (!cancelled) setChartData(data) })
      .catch(err => {
        if (cancelled) return
        const status = (err as { response?: { status?: number } })?.response?.status
        setError(status === 404 ? 'No chart data for this date' : 'Failed to load chart')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [selected, date])

  const selectClass = 'rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white dark:focus:border-brand-800'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-6">Charts</h1>

      {/* Controls Row */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6">
        <div className="flex gap-3 flex-wrap items-start">
          {/* Date Picker */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className={`${selectClass} inline-flex items-center gap-2`}
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {format(date, 'MMM d, yyyy')}
            </button>

            {calendarOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                <div className="p-3">
                  <DayPicker
                    mode="single"
                    selected={date}
                    onSelect={d => { if (d) { setDate(d); setCalendarOpen(false) } }}
                    disabled={{ after: new Date() }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Source Dropdown */}
          <select
            value={activeSource}
            onChange={e => setActiveSource(e.target.value)}
            className={selectClass}
          >
            {ALL_SOURCES.map(source => (
              <option key={source} value={source}>
                {getChartSourceLabel(source)}
              </option>
            ))}
          </select>

          {/* Chart Type Dropdown */}
          <select
            value={selectedKey}
            onChange={e => setSelectedKey(e.target.value)}
            className={`${selectClass} flex-1 min-w-[200px]`}
          >
            {options.map(opt => (
              <option key={optionKey(opt)} value={optionKey(opt)}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Info */}
      {chartData && (
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>{chartData.tracks.length} tracks</span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span>{formatChartDate(chartData.date)}</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mb-4 rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading chart...</div>
      )}

      {/* Track List */}
      {!loading && chartData && chartData.tracks.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {chartData.tracks.map(track => (
              <TrackResultRow
                key={`${track.position}-${track.track_id}`}
                track={chartTrackToSearchResult(track)}
                position={track.position}
                artworkUrl={track.artwork_url}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && chartData && chartData.tracks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No tracks in this chart</div>
      )}
    </div>
  )
}
