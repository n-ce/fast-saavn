import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (req: VercelRequest, res: VercelResponse) {
  const title = req.query.title as string;
  const artist = req.query.artist as string;

  if (!title || !artist) {
    return res.status(400).send('Missing title or artist parameters');
  }

  // Placeholder for JioSaavn API URL - this needs to be the actual API endpoint
  // I'm assuming a structure like: https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0&reqtype=search&query=...
  // This will need to be replaced with the actual API endpoint found from Sumit Kolhe's project or similar.
  const jioSaavnApiUrl = `https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0&reqtype=search&query=${encodeURIComponent(`${title} ${artist}`)}`;

  try {
    const response = await fetch(jioSaavnApiUrl);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JioSaavn API returned ${response.status}: ${errorText}`);
    }
    const data = await response.json();

    // Now, implement the client-side parsing logic here
    // This part is adapted from src/lib/modules/jioSaavn.ts
    const normalizeString = (str: string) => str.normalize("NFD").replace(/[̀-ͯ]/g, "");

    const matchingTrack = data.results.find((track: any) =>
      normalizeString(title).toLowerCase().startsWith(normalizeString(track.title).toLowerCase()) &&
      track.artists.primary.some((art: any) => normalizeString(artist).toLowerCase().startsWith(normalizeString(art.name).toLowerCase()))
    );

    if (!matchingTrack) {
      return res.status(404).send('Music stream not found in JioSaavn results');
    }

    // Assuming the matchingTrack contains the necessary downloadUrl structure
    // This part might need adjustment based on the actual JioSaavn API response
    return res.status(200).json(matchingTrack);

  } catch (error: any) {
    return res.status(500).send(error.message || 'Internal Server Error');
  }
}
