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

export interface ApiUsageEntry {
  date: string
  apiKey: string
  requestsIn: number
  results: number
  noResults: number
  dbHits: number
  dbMisses: number
  spotifyHits: number
  beatportHits: number
}

export async function getApiUsageStats(startDate: string, endDate: string): Promise<ApiUsageEntry[]> {
  const response = await apiClient.get<ApiUsageEntry[]>('/admin/stats/api-usage', {
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

export interface ServerSnapshot {
  ts: number
  cpu: number
  mem: { total_mb: number; used_mb: number; pct: number }
  disk: { total_gb: number; used_gb: number; pct: number }
  net: { rx_mb: number; tx_mb: number }
  load: [number, number, number]
}

export interface DbServerSnapshot {
  ts: number
  connections: { active: number; idle: number; total: number; max: number }
  cache_hit_ratio: number
  db_size_gb: number
  txn_rate: number
  dead_tuple_pct: number
}

export interface EsSnapshot {
  ts: number
  status: 'green' | 'yellow' | 'red'
  index_count: number
  doc_count: number
  store_size_mb: number
  jvm_heap_pct: number
}

export interface AlertThreshold {
  metric: string
  condition: string
}

export type AlertThresholds = Record<string, AlertThreshold[]>

interface StatsHistoryResponse<T> {
  server: string
  hours: number
  count: number
  snapshots: T[]
}

export async function getServerStatsHistory(hours: number): Promise<StatsHistoryResponse<ServerSnapshot>> {
  const response = await apiClient.get<StatsHistoryResponse<ServerSnapshot>>('/admin/stats/server/sv-app1/history', {
    params: { hours }
  })
  return response.data
}

export async function getDbStatsHistory(hours: number): Promise<StatsHistoryResponse<DbServerSnapshot>> {
  const response = await apiClient.get<StatsHistoryResponse<DbServerSnapshot>>('/admin/stats/server/sv-db1/history', {
    params: { hours }
  })
  return response.data
}

export async function getEsStatsHistory(hours: number): Promise<StatsHistoryResponse<EsSnapshot>> {
  const response = await apiClient.get<StatsHistoryResponse<EsSnapshot>>('/admin/stats/server/es/history', {
    params: { hours }
  })
  return response.data
}

export async function getAlertThresholds(): Promise<AlertThresholds> {
  const response = await apiClient.get<AlertThresholds>('/admin/stats/alert-thresholds')
  return response.data
}
