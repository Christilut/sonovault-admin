import { apiClient } from './client'

export interface ImportDaySummary {
  date: string
  source: number
  artists: number
  labels: number
  releases: number
  tracks: number
  genres: number
  total: number
}

export async function getImportHistory(days: number = 30): Promise<ImportDaySummary[]> {
  const response = await apiClient.get<ImportDaySummary[]>('/admin/import-history', {
    params: { days }
  })
  return response.data
}
