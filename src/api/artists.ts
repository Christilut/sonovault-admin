import { apiClient } from './client'

export interface ArtistRelease {
  id: number
  title: string
  release_date: string | null
  catalog_no: string | null
  track_count: number
}

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

export interface ArtistTrack {
  id: number
  title: string
  release_id: number
  release_title: string
  bpm: number | null
  key: string | null
  duration: number | null
  isrc: string | null
  popularity: number | null
  energy: number | null
  artists: TrackArtist[]
  genres: TrackGenre[]
}

export interface Artist {
  id: number
  name: string
  name_norm: string
  external_links: { source: number; url: string }[]
  created_at: string
  updated_at: string
}

export interface ArtistWithRelations {
  artist: Artist
  releases: ArtistRelease[]
  tracks: ArtistTrack[]
}

export async function getArtistById(id: number): Promise<ArtistWithRelations> {
  const response = await apiClient.get<ArtistWithRelations>(`/admin/artists/${id}`)
  return response.data
}
