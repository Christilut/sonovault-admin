import { v1Client } from './v1Client'

export interface ChartType {
  source: number
  source_name: string
  chart_type: string
  genre: string | null
  country: string | null
  city: string | null
  latest_date: string
}

export interface ChartTrack {
  position: number
  track_id: number
  title: string
  artists: { id: number; name: string; is_primary: boolean }[]
  release: { id: number; title: string; release_date: string | null } | null
  isrc: string | null
  bpm: number | null
  key: string | null
  duration: number | null
  popularity: number | null
  energy: number | null
  artwork_url: string | null
  genres: { id: number; name: string; source: number }[]
}

export interface ChartResponse {
  id: number
  source: number
  source_name: string
  chart_type: string
  genre: string | null
  country: string | null
  city: string | null
  date: string
  tracks: ChartTrack[]
}

export async function listCharts(source?: string): Promise<{ charts: ChartType[] }> {
  const params: Record<string, string> = {}
  if (source) params.source = source
  const response = await v1Client.get<{ charts: ChartType[] }>('/charts', { params })
  return response.data
}

export async function getChart(
  source: string,
  chartType: string,
  options?: {
    genre?: string
    country?: string
    city?: string
    date?: string
    limit?: number
  }
): Promise<ChartResponse> {
  const params: Record<string, string | number> = {}
  if (options?.genre) params.genre = options.genre
  if (options?.country) params.country = options.country
  if (options?.city) params.city = options.city
  if (options?.date) params.date = options.date
  if (options?.limit) params.limit = options.limit
  const response = await v1Client.get<ChartResponse>(
    `/charts/${encodeURIComponent(source)}/${encodeURIComponent(chartType)}`,
    { params }
  )
  return response.data
}
