import { useState } from 'react'
import { searchTracks, searchTracksByArtistTitle, searchTrackByIsrc, type TrackSearchResult } from '@/api/search'
import TrackResultRow from '@/components/TrackResultRow'

type SearchMode = 'query' | 'artist-title' | 'isrc'

export default function SearchPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>('artist-title')
  const [query, setQuery] = useState('')
  const [artistQuery, setArtistQuery] = useState('')
  const [titleQuery, setTitleQuery] = useState('')
  const [isrcQuery, setIsrcQuery] = useState('')
  const [results, setResults] = useState<TrackSearchResult[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchDuration, setSearchDuration] = useState<number | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const performSearch = async (append = false) => {
    if (!append) {
      setResults([])
      setNextCursor(null)
      setSearchDuration(null)
    }
    setLoading(true)
    setError('')
    setHasSearched(true)

    const startTime = performance.now()
    try {
      if (searchMode === 'isrc') {
        const q = isrcQuery.trim()
        if (!q) return
        const response = await searchTrackByIsrc(q)
        setSearchDuration(Math.round(performance.now() - startTime))
        setResults(response.result ? [response.result] : [])
        setNextCursor(null)
      } else if (searchMode === 'artist-title') {
        const a = artistQuery.trim()
        const t = titleQuery.trim()
        if (!a || !t) { setError('Both artist and title are required'); return }
        const cursor = append ? nextCursor : undefined
        const response = await searchTracksByArtistTitle(a, t, 20, cursor || undefined)
        if (!append) setSearchDuration(Math.round(performance.now() - startTime))
        setResults(prev => append ? [...prev, ...response.results] : response.results)
        setNextCursor(response.nextCursor)
      } else {
        const q = query.trim()
        if (!q) return
        const cursor = append ? nextCursor : undefined
        const response = await searchTracks(q, 20, cursor || undefined)
        if (!append) setSearchDuration(Math.round(performance.now() - startTime))
        setResults(prev => append ? [...prev, ...response.results] : response.results)
        setNextCursor(response.nextCursor)
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') performSearch()
  }

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode)
    setResults([])
    setNextCursor(null)
    setSearchDuration(null)
    setHasSearched(false)
    setQuery('')
    setArtistQuery('')
    setTitleQuery('')
    setIsrcQuery('')
  }

  const modeButton = (mode: SearchMode, label: string, disabled = false) => (
    <button
      onClick={() => !disabled && handleModeChange(mode)}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        disabled
          ? 'text-gray-400 cursor-not-allowed dark:text-gray-600'
          : searchMode === mode
            ? 'bg-brand-500 text-white'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  )

  const inputClass = 'w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-800'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-6">Search Tracks</h1>

      {/* Search Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mb-6">
        <div className="flex gap-2 mb-4">
          {modeButton('artist-title', 'Artist + Title')}
          {modeButton('query', 'Query', true)}
          {modeButton('isrc', 'ISRC')}
        </div>

        {searchMode === 'query' && (
          <div className="flex gap-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for tracks..."
              className={`flex-1 ${inputClass}`}
            />
            <button onClick={() => performSearch()} disabled={loading} className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        )}

        {searchMode === 'artist-title' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={artistQuery} onChange={e => setArtistQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Artist name..." className={inputClass} />
              <input value={titleQuery} onChange={e => setTitleQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Track title..." className={inputClass} />
            </div>
            <button onClick={() => performSearch()} disabled={loading} className="w-full rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        )}

        {searchMode === 'isrc' && (
          <div className="flex gap-3">
            <input value={isrcQuery} onChange={e => setIsrcQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter ISRC code (e.g., USRC12345678)" className={`flex-1 font-mono ${inputClass}`} />
            <button onClick={() => performSearch()} disabled={loading} className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Stats */}
      {searchDuration !== null && (
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>{results.length} result{results.length !== 1 ? 's' : ''}{nextCursor ? '+' : ''}</span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span>{searchDuration}ms</span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {results.map(result => (
              <TrackResultRow key={result.id} track={result} />
            ))}
          </div>
          {nextCursor && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => performSearch(true)}
                disabled={loading}
                className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && hasSearched && results.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No results found</div>
      )}

      {/* Loading */}
      {loading && results.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Searching...</div>
      )}
    </div>
  )
}
