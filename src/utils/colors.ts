// Primary color
export const primaryColor = '#5ae168'

// Third party brand colors
export const thirdPartyColors = {
  beatport: '#00c271',
  beatsource: '#027edd',
  bandcamp: '#23687b',
  itunes: '#da5b69',
  juno: '#8c8c8c',
  traxsource: '#3486d8',
  soundcloud: '#ff5500',
  facebook: '#4267b2',
  discord: '#7289da',
  spotify: '#f9a8d4',
  youtube: '#c4302b',
  apple: '#ffffff',
  tidal: '#000000',
  deezer: '#a238ff',
  discogs: '#ff5500',
  musicbrainz: '#ba478f',
  applemusic: '#fa2d48',
  billboard: '#d4a843',
  shazam: '#08f',
} as const

// Source enum to color mapping (matches ExternalTrackSource + ChartSource)
export const sourceColors: Record<number, string> = {
  0: thirdPartyColors.spotify,      // Spotify
  1: thirdPartyColors.beatport,     // Beatport
  2: thirdPartyColors.discogs,      // Discogs
  3: thirdPartyColors.musicbrainz,  // Musicbrainz
  4: thirdPartyColors.applemusic,   // Apple Music
  10: thirdPartyColors.billboard,   // Billboard
  11: thirdPartyColors.shazam,      // Shazam Global
  12: thirdPartyColors.shazam,      // Shazam Local
  20: '#8b5cf6',                    // Historical
}

export const sourceLabels: Record<number, string> = {
  0: 'Spotify',
  1: 'Beatport',
  2: 'Discogs',
  3: 'Musicbrainz',
  4: 'Apple Music',
  10: 'Billboard',
  11: 'Shazam Global',
  12: 'Shazam Local',
  20: 'Historical',
}

export function getSourceColor(source: number): string {
  return sourceColors[source] || '#6b7280'
}

export function getSourceLabel(source: number): string {
  return sourceLabels[source] || `Source ${source}`
}

// Chart source colors (matches ChartSource enum from database-server)
export const chartSourceColors: Record<string, string> = {
  beatport: thirdPartyColors.beatport,
  applemusic: thirdPartyColors.applemusic,
  billboard: thirdPartyColors.billboard,
  'shazam-global': thirdPartyColors.shazam,
  'shazam-local': thirdPartyColors.shazam,
  historical: '#8b5cf6',
}

export const chartSourceLabels: Record<string, string> = {
  beatport: 'Beatport',
  applemusic: 'Apple Music',
  billboard: 'Billboard',
  'shazam-global': 'Shazam Global',
  'shazam-local': 'Shazam Local',
  historical: 'Historical',
}

export function getChartSourceColor(sourceName: string): string {
  return chartSourceColors[sourceName] || '#6b7280'
}

export function getChartSourceLabel(sourceName: string): string {
  return chartSourceLabels[sourceName] || sourceName
}
