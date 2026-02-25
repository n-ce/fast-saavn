import { createSongPayload, SaavnSong, SongPayload } from './_jioSaavn';

// --- Helper Functions ---

const parseDurationToSeconds = (durationStr: string): number | null => {
  if (!durationStr) return null;
  const parts = durationStr.split(':').map(Number);
  if (parts.some(isNaN)) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return null;
};

// --- API Route Handler (Vercel Bun Convention) ---

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const title = url.searchParams.get('title');
  const artist = url.searchParams.get('artist');
  const durationParam = url.searchParams.get('duration');

  if (!title || !artist) {
    return new Response('Missing title or artist parameters', { status: 400 });
  }

  // Sanitize title for search
  const searchQuery = `${title.replace(/\(.*?\)/g, '')} ${artist}`;
  const jioSaavnApiUrl = `https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0&__call=search.getResults&q=${encodeURIComponent(searchQuery)}&p=0&n=10`;

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

    const data = await response.json() as { results: SaavnSong[] };

    if (!data.results || data.results.length === 0) {
      return new Response('Music stream not found in JioSaavn results', { status: 404 });
    }

    // Process results using the typed helper
    const processedResults: SongPayload[] = data.results.map((rawSong) => createSongPayload(rawSong));

    const matchingTrack = processedResults.find((track) => {
      const normalizeString = (str: string) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");

      const primaryArtists = track.artists?.primary?.map((a) => a.name.trim()) || [];
      const singers = track.artists?.all?.filter((a) => a.role === 'singer').map((a) => a.name.trim()) || [];
      const allArtists = [...primaryArtists, ...singers];

      // Match artist
      const artistMatches = allArtists.some((trackArtistName: string) =>
        normalizeString(trackArtistName).toLowerCase().startsWith(normalizeString(artist).toLowerCase())
      );

      const clean = (str: string) => normalizeString(str).toLowerCase().replace(/&amp;/g, ' ').replace(/&/g, ' ').replace(/\s+/g, ' ').trim();

      // Match title
      const titleMatches = clean(track.name).startsWith(clean(title));

      // Match duration (within 2 seconds tolerance)
      let durationMatches = true;
      if (durationParam) {
        const targetDurationSeconds = parseDurationToSeconds(durationParam);
        if (targetDurationSeconds !== null && track.duration !== null) {
          durationMatches = Math.abs(track.duration - targetDurationSeconds) < 2;
        } else {
          durationMatches = false;
        }
      }

      return titleMatches && artistMatches && durationMatches;
    });

    if (!matchingTrack || !matchingTrack.downloadUrl) {
      return new Response('Music stream not found in JioSaavn results', { status: 404 });
    }

    // Extract the base media ID from the decrypted URL
    const fullDownloadUrl: string = matchingTrack.downloadUrl;
    const trimmedDownloadUrl = fullDownloadUrl.replace(/^https:\/\/aac\.saavncdn\.com\/(.*?)_\d+\.mp4$/, '$1');

    return new Response(trimmedDownloadUrl, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error("Error in fast-saavn API:", errorMessage);
    return new Response(errorMessage, { status: 500 });
  }
}
