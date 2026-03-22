import { v1Client } from './v1Client'

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
    artist?: {
      id: number
      name: string
    }
  } | null
  artists: TrackArtist[]
  isrc: string | null
  bpm: number | null
  key: string | null
  duration: number | null
  popularity?: number | null
  energy?: number | null
  genres?: {
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
  const response = await v1Client.get<SearchResponse>('/tracks/search', { params })
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
  const response = await v1Client.get<SearchResponse>('/tracks/search', { params })
  return response.data
}

export interface IsrcSearchResponse {
  result: TrackSearchResult | null
}

export async function searchTrackByIsrc(isrc: string): Promise<IsrcSearchResponse> {
  try {
    const response = await v1Client.get<TrackSearchResult>('/tracks/isrc', {
      params: { isrc }
    })
    return { result: response.data }
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      return { result: null }
    }
    throw err
  }
}
