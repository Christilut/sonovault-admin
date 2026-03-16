import { apiClient } from './client'

export interface TrackArtist {
  id: number
  name: string
  is_primary: boolean
  is_remixer: boolean
}

export interface TrackGenre {
  name: string
  source: number
}

export interface ReleaseTrack {
  id: number
  title: string
  bpm: number | null
  key: string | null
  duration: number | null
  isrc: string | null
  popularity: number | null
  energy: number | null
  artists: TrackArtist[]
  genres: TrackGenre[]
}

export interface ReleaseDetails {
  id: number
  title: string
  artist_name: string
  artist_id: number
  label_name: string | null
  label_id: number | null
  release_date: string | null
  catalog_no: string | null
  artwork_url: string | null
}

export interface ReleaseWithTracks {
  release: ReleaseDetails
  tracks: ReleaseTrack[]
}

export async function getReleaseById(id: number): Promise<ReleaseWithTracks> {
  const response = await apiClient.get<ReleaseWithTracks>(`/admin/releases/${id}`)
  return response.data
}
