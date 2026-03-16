import { apiClient } from './client'

export interface EntityCounts {
  artists: number
  tracks: number
  releases: number
  labels: number
  externalTracks: number
}

export interface HealthCheck {
  status: 'ok' | 'error'
  message?: string
  usedPercent?: number
}

export interface HealthStatus {
  database: HealthCheck
  redis: HealthCheck
  disk: HealthCheck
}

export interface StatsResponse {
  entities: EntityCounts
  health: HealthStatus
}

export async function getStats(): Promise<StatsResponse> {
  const response = await apiClient.get<StatsResponse>('/admin/stats')
  return response.data
}
