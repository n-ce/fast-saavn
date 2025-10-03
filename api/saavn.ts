import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node-forge'; // Added import

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


export default async function (req: VercelRequest, res: VercelResponse) {
  const title = req.query.title as string;
  const artist = req.query.artist as string;

  if (!title || !artist) {
    return res.status(400).send('Missing title or artist parameters');
  }

  const jioSaavnApiUrl = `https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0&__call=autocomplete.get&query=${encodeURIComponent(`${title} ${artist}`)}`;

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

    let matchingTrack = null;

    // Prioritize topquery results
    if (data.topquery && data.topquery.data && data.topquery.data.length > 0) {
      matchingTrack = data.topquery.data.find((track: any) =>
        normalizeString(title).toLowerCase().startsWith(normalizeString(track.title).toLowerCase()) &&
        (normalizeString(track.more_info?.primary_artists || '').toLowerCase().includes(normalizeString(artist).toLowerCase()) ||
         normalizeString(track.more_info?.singers || '').toLowerCase().includes(normalizeString(artist).toLowerCase()))
      );
    }

    // If not found in topquery, check songs results
    if (!matchingTrack && data.songs && data.songs.data && data.songs.data.length > 0) {
      matchingTrack = data.songs.data.find((track: any) =>
        normalizeString(title).toLowerCase().startsWith(normalizeString(track.title).toLowerCase()) &&
        (normalizeString(track.more_info?.primary_artists || '').toLowerCase().includes(normalizeString(artist).toLowerCase()) ||
         normalizeString(track.more_info?.singers || '').toLowerCase().includes(normalizeString(artist).toLowerCase()))
      );
    }

    if (!matchingTrack) {
      return res.status(404).send('Music stream not found in JioSaavn results');
    }

    // Now, construct the downloadUrl using createDownloadLinks
    const downloadUrl = createDownloadLinks(matchingTrack.more_info.encrypted_media_url);

    // Return the matching track with the constructed downloadUrl
    return res.status(200).json({ ...matchingTrack, downloadUrl });

  } catch (error: any) {
    console.error("Error in fast-saavn API:", error); // Keep logging for local debugging if user runs it
    return res.status(500).send(error.message || 'Internal Server Error');
  }
}
