import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node-forge';

// createDownloadLinks function copied from jiosaavn-api/src/common/helpers/link.helper.ts
const createDownloadLinks = (encryptedMediaUrl: string) => {
  if (!encryptedMediaUrl) return [];

  const qualities = [
    { id: '_12', bitrate: '12kbps' },
    { id: '_48', bitrate: '48kbps' },
    { id: '_96', bitrate: '96kbps' },
    { id: '_160', bitrate: '160kbps' },
    { id: '_320', bitrate: '320kbps' }
  ];

  const key = '38346591';
  const iv = '00000000';

  const encrypted = crypto.util.decode64(encryptedMediaUrl);
  const decipher = crypto.cipher.createDecipher('DES-ECB', crypto.util.createBuffer(key));
  decipher.start({ iv: crypto.util.createBuffer(iv) });
  decipher.update(crypto.util.createBuffer(encrypted));
  decipher.finish();
  const decryptedLink = decipher.output.getBytes();

  return qualities.map((quality) => ({
    quality: quality.bitrate,
    url: decryptedLink.replace('_96', quality.id)
  }));
};

// createImageLinks function copied from jiosaavn-api/src/common/helpers/link.helper.ts
const createImageLinks = (link: string) => {
  if (!link) return [];

  const qualities = ['50x50', '150x150', '500x500'];
  const qualityRegex = /150x150|50x50/;
  const protocolRegex = /^http:\/\//;

  return qualities.map((quality) => ({
    quality,
    url: link.replace(qualityRegex, quality).replace(protocolRegex, 'https://')
  }));
};

// createArtistMapPayload function copied from jiosaavn-api/src/modules/artists/helpers/artist.helper.ts
const createArtistMapPayload = (artist: any) => ({
  id: artist.id,
  name: artist.name,
  role: artist.role,
  image: createImageLinks(artist.image),
  type: artist.type,
  url: artist.perma_url
});

// createSongPayload function copied from jiosaavn-api/src/modules/songs/helpers/song.helper.ts
const createSongPayload = (song: any) => ({
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


export default async function (req: VercelRequest, res: VercelResponse) {
  const title = req.query.title as string;
  const artist = req.query.artist as string;

  if (!title || !artist) {
    return res.status(400).send('Missing title or artist parameters');
  }

  const jioSaavnApiUrl = `https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0&__call=search.getResults&q=${encodeURIComponent(`${title} ${artist}`)}&p=1&n=10`; // Fetch 10 results

  try {
    const response = await fetch(jioSaavnApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JioSaavn API returned ${response.status}: ${errorText}`);
    }
    const data = await response.json();

    const normalizeString = (str: string) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");

    if (!data.results || data.results.length === 0) {
      return res.status(404).send('Music stream not found in JioSaavn results');
    }

    const matchingTrack = data.results.find((track: any) => {
      const primaryArtists = track.more_info?.primary_artists?.split(',').map((name: string) => name.trim()) || [];
      const singers = track.more_info?.singers?.split(',').map((name: string) => name.trim()) || [];
      const allArtists = [...primaryArtists, ...singers];

      const artistMatches = allArtists.some((trackArtistName: string) =>
        normalizeString(artist).toLowerCase().startsWith(normalizeString(trackArtistName).toLowerCase())
      );

      return normalizeString(title).toLowerCase().startsWith(normalizeString(track.title).toLowerCase()) && artistMatches;
    });

    if (!matchingTrack) {
      return res.status(404).send('Music stream not found in JioSaavn results');
    }

    const processedSong = createSongPayload(matchingTrack);

    return res.status(200).json(processedSong);

  } catch (error: any) {
    console.error("Error in fast-saavn API:", error);
    return res.status(500).send(error.message || 'Internal Server Error');
  }
}
