import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { getReleaseById, type ReleaseWithTracks } from '@/api/releases'
import TrackResultRow from '@/components/TrackResultRow'
import type { TrackSearchResult } from '@/api/search'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

function toTrackSearchResult(track: ReleaseWithTracks['tracks'][0]): TrackSearchResult {
  return {
    id: track.id,
    title: track.title,
    artists: track.artists,
    release: { id: 0, title: '', artist: { id: 0, name: '' } },
    bpm: track.bpm,
    key: track.key,
    duration: track.duration,
    isrc: track.isrc,
    popularity: track.popularity,
    energy: track.energy,
    genres: track.genres
  }
}

export default function ReleasePage() {
  const { id } = useParams()
  const [release, setRelease] = useState<ReleaseWithTracks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getReleaseById(Number(id))
      .then(setRelease)
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(message || 'Failed to load release')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-gray-500 dark:text-gray-400">Loading...</div>
  if (error) return <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400">{error}</div>
  if (!release) return null

  return (
    <div>
      <Link to="/search" className="inline-flex items-center text-brand-500 hover:text-brand-400 text-sm mb-4">
        &larr; Back to Search
      </Link>

      {/* Release Header */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row">
          {/* Album Art */}
          <div className="md:w-64 md:h-64 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
            {release.release.artwork_url ? (
              <img src={release.release.artwork_url} alt={release.release.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 p-6">
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-white/90">{release.release.title}</h1>
            <Link to={`/artists/${release.release.artist_id}`} className="text-xl text-brand-500 hover:text-brand-400 hover:underline mt-1 inline-block">
              {release.release.artist_name}
            </Link>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-gray-500 dark:text-gray-400">
              {release.release.label_name && <span>{release.release.label_name}</span>}
              {release.release.release_date && <span>{formatDate(release.release.release_date)}</span>}
              {release.release.catalog_no && (
                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {release.release.catalog_no}
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">
              {release.tracks.length} track{release.tracks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="font-medium text-gray-700 dark:text-gray-300">Tracks</span>
        </div>
        {release.tracks.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No tracks found</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {release.tracks.map(track => (
              <TrackResultRow key={track.id} track={toTrackSearchResult(track)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
