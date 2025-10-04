import { createDownloadLinks, createImageLinks } from './link.helper'; // Import from link.helper
import { createArtistMapPayload } from './artist.helper'; // Import from artist.helper

export const createSongPayload = (song: any) => ({
  id: song.id,
  name: song.title,
  type: song.type,
  year: song.year || null,
  releaseDate: song.more_info?.release_date || null,
  duration: song.more_info?.duration ? Number(song.more_info?.duration) : null,
  label: song.more_info?.label || null,
  explicitContent: song.explicit_content === '1',
  playCount: song.play_count ? Number(song.play_count) : null,
  language: song.language,
  hasLyrics: song.more_info?.has_lyrics === 'true',
  lyricsId: song.more_info?.lyrics_id || null,
  url: song.perma_url,
  copyright: song.more_info?.copyright_text || null,
  album: {
    id: song.more_info?.album_id || null,
    name: song.more_info?.album || null,
    url: song.more_info?.album_url || null
  },
  artists: {
    primary: song.more_info?.artistMap?.primary_artists?.map(createArtistMapPayload),
    featured: song.more_info?.artistMap?.featured_artists?.map(createArtistMapPayload),
    all: song.more_info?.artistMap?.artists?.map(createArtistMapPayload)
  },
  image: createImageLinks(song.image),
  downloadUrl: createDownloadLinks(song.more_info?.encrypted_media_url)
});