import { apiClient } from './client'

export interface TopTrackEntry {
  trackId: number
  title: string
  artistName: string
  releaseTitle: string
  hitCount: number
}

export interface TopArtistEntry {
  artistId: number
  name: string
  hitCount: number
}

export interface FallbackLogEntry {
  id: number
  date: string
  originalQuery: string
  spotifyQuery: string | null
  beatportQuery: string | null
  spotifyCount: number
  beatportCount: number
  ingested: number
  apiDurationMs: number
  createdAt: string
}

export interface FallbackLogsResponse {
  entries: FallbackLogEntry[]
  total: number
}

export interface LatencyStats {
  p50: number
  p95: number
  p99: number
  avg: number
  max: number
  count: number
}

export interface TableSize {
  name: string
  totalSize: string
  dataSize: string
  indexSize: string
  rowEstimate: number
}

export interface IndexUsage {
  indexName: string
  tableName: string
  indexScans: number
  size: string
}

export interface DbHealth {
  connections: {
    active: number
    idle: number
    total: number
    maxConnections: number
  }
  cacheHitRatio: number
  tables: TableSize[]
  indexes: IndexUsage[]
  deadTuples: { tableName: string; deadTuples: number; liveTuples: number }[]
}

export async function getTopTracks(startDate: string, endDate: string, limit?: number): Promise<TopTrackEntry[]> {
  const response = await apiClient.get<TopTrackEntry[]>('/admin/stats/top-tracks', {
    params: { startDate, endDate, limit }
  })
  return response.data
}

export async function getTopArtists(startDate: string, endDate: string, limit?: number): Promise<TopArtistEntry[]> {
  const response = await apiClient.get<TopArtistEntry[]>('/admin/stats/top-artists', {
    params: { startDate, endDate, limit }
  })
  return response.data
}

export async function getFallbackLogs(startDate: string, endDate: string): Promise<FallbackLogsResponse> {
  const response = await apiClient.get<FallbackLogsResponse>('/admin/stats/fallbacks', {
    params: { startDate, endDate }
  })
  return response.data
}

export async function getLatencyStats(): Promise<LatencyStats> {
  const response = await apiClient.get<LatencyStats>('/admin/stats/latency')
  return response.data
}

export async function getDbHealthStats(): Promise<DbHealth> {
  const response = await apiClient.get<DbHealth>('/admin/stats/db-health')
  return response.data
}
