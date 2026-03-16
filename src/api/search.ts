import { apiClient } from './client'

export interface TrackArtist {
  id: number
  name: string
  is_primary: boolean
  is_remixer: boolean
}

export interface TrackSearchResult {
  id: number
  title: string
  release: {
    id: number
    title: string
    artist: {
      id: number
      name: string
    }
  }
  artists: TrackArtist[]
  isrc: string | null
  bpm: number | null
  key: string | null
  duration: number | null
  popularity: number | null
  energy: number | null
  genres: {
    name: string
    source: number
  }[]
}

export interface SearchResponse {
  results: TrackSearchResult[]
  nextCursor: string | null
}

export async function searchTracks(
  query: string,
  limit: number = 20,
  cursor?: string
): Promise<SearchResponse> {
  const params: Record<string, string | number> = { q: query, limit }
  if (cursor) {
    params.cursor = cursor
  }
  const response = await apiClient.get<SearchResponse>('/admin/tracks/search', { params })
  return response.data
}

export async function searchTracksByArtistTitle(
  artist: string,
  title: string,
  limit: number = 20,
  cursor?: string
): Promise<SearchResponse> {
  const params: Record<string, string | number> = { artist, title, limit }
  if (cursor) {
    params.cursor = cursor
  }
  const response = await apiClient.get<SearchResponse>('/admin/tracks/search', { params })
  return response.data
}

export interface IsrcSearchResponse {
  result: TrackSearchResult | null
}

export async function searchTrackByIsrc(isrc: string): Promise<IsrcSearchResponse> {
  const response = await apiClient.get<IsrcSearchResponse>(`/admin/tracks/isrc/${encodeURIComponent(isrc)}`)
  return response.data
}
