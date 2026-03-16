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
  spotify: '#1db954',
  youtube: '#c4302b',
  apple: '#ffffff',
  tidal: '#000000',
  deezer: '#a238ff',
  discogs: '#ff5500',
  musicbrainz: '#ba478f'
} as const

// Source enum to color mapping (matches ExternalTrackSource)
export const sourceColors: Record<number, string> = {
  0: thirdPartyColors.spotify,     // Spotify
  1: thirdPartyColors.beatport,    // Beatport
  2: thirdPartyColors.discogs,     // Discogs
  3: thirdPartyColors.musicbrainz  // Musicbrainz
}

export const sourceLabels: Record<number, string> = {
  0: 'Spotify',
  1: 'Beatport',
  2: 'Discogs',
  3: 'Musicbrainz'
}

export function getSourceColor(source: number): string {
  return sourceColors[source] || '#6b7280'
}

export function getSourceLabel(source: number): string {
  return sourceLabels[source] || `Source ${source}`
}
