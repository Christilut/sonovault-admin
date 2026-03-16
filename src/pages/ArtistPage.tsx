import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { getArtistById, type ArtistWithRelations } from '@/api/artists'
import TrackResultRow from '@/components/TrackResultRow'
import type { TrackSearchResult } from '@/api/search'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

function toTrackSearchResult(track: ArtistWithRelations['tracks'][0]): TrackSearchResult {
  return {
    id: track.id,
    title: track.title,
    artists: track.artists,
    release: { id: track.release_id, title: track.release_title, artist: { id: 0, name: '' } },
    bpm: track.bpm,
    key: track.key,
    duration: track.duration,
    isrc: track.isrc,
    popularity: track.popularity,
    energy: track.energy,
    genres: track.genres
  }
}

export default function ArtistPage() {
  const { id } = useParams()
  const [artist, setArtist] = useState<ArtistWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'albums' | 'tracks'>('albums')

  useEffect(() => {
    setLoading(true)
    getArtistById(Number(id))
      .then(setArtist)
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(message || 'Failed to load artist')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-gray-500 dark:text-gray-400">Loading...</div>
  if (error) return <div className="rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-700 dark:bg-error-500/10 dark:text-error-400">{error}</div>
  if (!artist) return null

  const tabClass = (tab: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'bg-brand-500 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
    }`

  return (
    <div>
      <Link to="/search" className="inline-flex items-center text-brand-500 hover:text-brand-400 text-sm mb-4">
        &larr; Back to Search
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white/90">{artist.artist.name}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {artist.releases.length} albums &bull; {artist.tracks.length} tracks
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('albums')} className={tabClass('albums')}>
          Albums ({artist.releases.length})
        </button>
        <button onClick={() => setActiveTab('tracks')} className={tabClass('tracks')}>
          Tracks ({artist.tracks.length})
        </button>
      </div>

      {/* Albums */}
      {activeTab === 'albums' && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {artist.releases.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No albums found</div>
          ) : (
            artist.releases.map(release => (
              <Link
                key={release.id}
                to={`/releases/${release.id}`}
                className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-white/90">{release.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(release.release_date)} &bull; {release.track_count} tracks
                  </p>
                </div>
                <span className="text-gray-400">&rarr;</span>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Tracks */}
      {activeTab === 'tracks' && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {artist.tracks.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No tracks found</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {artist.tracks.map(track => (
                <TrackResultRow key={track.id} track={toTrackSearchResult(track)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
