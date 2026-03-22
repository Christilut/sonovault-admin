import { Link } from 'react-router'
import { getSourceColor, getSourceLabel } from '@/utils/colors'
import type { TrackSearchResult, TrackArtist } from '@/api/search'

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getSortedArtists(artists: TrackArtist[]): TrackArtist[] {
  return [...artists].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    if (a.is_remixer !== b.is_remixer) return a.is_remixer ? 1 : -1
    return a.name.localeCompare(b.name)
  })
}

function getSourceLetter(source: number): string {
  return getSourceLabel(source).charAt(0)
}

interface Props {
  track: TrackSearchResult
  position?: number
  artworkUrl?: string | null
}

export default function TrackResultRow({ track, position, artworkUrl }: Props) {
  const sortedArtists = track.artists ? getSortedArtists(track.artists) : []

  return (
    <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
      {/* Position */}
      {position != null && (
        <span className="w-8 shrink-0 text-right text-sm font-medium text-gray-400 dark:text-gray-500 tabular-nums pt-0.5">
          #{position}
        </span>
      )}

      {/* Artwork */}
      {artworkUrl !== undefined && (
        artworkUrl ? (
          <img src={artworkUrl} alt="" className="w-10 h-10 rounded shrink-0 object-cover" />
        ) : (
          <div className="w-10 h-10 rounded shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )
      )}

      <div className="min-w-0 flex-1">
        {/* Row 1: Title - Artists | Release */}
        <div className="flex items-center gap-2 text-sm overflow-hidden">
          <span className="font-medium text-gray-800 dark:text-white/90 truncate shrink-0 max-w-[40%]">
            {track.title}
          </span>

          {sortedArtists.length > 0 && (
            <>
              <span className="text-gray-300 dark:text-gray-700 shrink-0">-</span>
              <span className="flex items-center gap-1 truncate">
                {sortedArtists.map((artist, idx) => (
                  <span key={artist.id} className="flex items-center gap-1">
                    <Link
                      to={`/artists/${artist.id}`}
                      className={`hover:underline truncate ${
                        artist.is_remixer
                          ? 'text-gray-400 hover:text-gray-300 italic'
                          : 'text-brand-500 hover:text-brand-400'
                      }`}
                    >
                      {artist.name}
                    </Link>
                    {idx < sortedArtists.length - 1 && <span className="text-gray-400">,</span>}
                  </span>
                ))}
              </span>
            </>
          )}

          {track.release && (
            <>
              <span className="text-gray-300 dark:text-gray-700 shrink-0">|</span>
              <Link
                to={`/releases/${track.release.id}`}
                className="text-brand-500 hover:text-brand-400 hover:underline truncate"
              >
                {track.release.title}
              </Link>
            </>
          )}
        </div>

        {/* Row 2: Metadata + Genres */}
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          {track.duration && <span className="tabular-nums">{formatDuration(track.duration)}</span>}
          {track.bpm && <span className="tabular-nums">{Math.round(track.bpm)} BPM</span>}
          {track.key && <span>{track.key}</span>}
          {track.popularity != null && <span className="text-success-500">Pop {track.popularity}</span>}
          {track.energy != null && <span className="text-orange-500">E {track.energy.toFixed(2)}</span>}
          {track.isrc && <span className="font-mono text-gray-400 dark:text-gray-600">{track.isrc}</span>}
          {track.genres && track.genres.length > 0 && (
            <>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              {track.genres.map((genre, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white dark:text-gray-900"
                  style={{ backgroundColor: getSourceColor(genre.source) }}
                >
                  {genre.name}
                  <span className="opacity-60">({getSourceLetter(genre.source)})</span>
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
