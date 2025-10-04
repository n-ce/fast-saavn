# Fast JioSaavn API Proxy

This project (`fast-saavn`) serves as a lightweight, efficient proxy and wrapper for the unofficial JioSaavn API. It's designed to streamline the process of searching for songs and retrieving their playable media URLs, particularly for client-side applications that require simplified interaction with JioSaavn's services.

## The Problem It Solves

Directly integrating with unofficial APIs like JioSaavn's can present several challenges:
-   **Complex API Interactions**: Understanding and correctly utilizing specific endpoints (e.g., `search.getResults` vs. `autocomplete.get`) and their required parameters.
-   **Data Processing**: Raw API responses often contain nested or inconsistently structured data that needs to be parsed and transformed into a more usable format.
-   **Encrypted Media URLs**: JioSaavn's media URLs are typically encrypted, requiring specific decryption logic to obtain playable links.
-   **Client-Side Overhead**: Performing these complex operations directly on the client-side can lead to increased bundle sizes, slower performance, and potential exposure of API keys or sensitive logic.

## How It Works & What It Provides

The `fast-saavn` project addresses these challenges by acting as an intermediary layer:

1.  **Simplified Search Endpoint**: It exposes a single, clean API endpoint (`/api/find`) that accepts `title` and `artist` parameters.
2.  **Intelligent JioSaavn API Interaction**: Internally, it intelligently queries the appropriate JioSaavn endpoint (`search.getResults`) with optimized parameters (`p=0`, `n=10`) to fetch a comprehensive list of potential song matches.
3.  **Robust Finder Logic**: It incorporates a sophisticated finder mechanism that processes the raw JioSaavn results, applying normalization and matching logic (similar to established client-side parsers) to identify the most relevant song based on the provided `title` and `artist`.
4.  **Secure Media Decryption**: It handles the decryption of JioSaavn's `encrypted_media_url` using `node-forge`, providing direct, playable `downloadUrl` links in various quality formats.
5.  **Pre-processed Song Objects**: It transforms the raw JioSaavn data into a clean, consistent, and easily consumable song object format, reducing the parsing burden on the client-side application.
6.  **Vercel Optimized**: Designed for serverless deployment on platforms like Vercel, ensuring scalability and low-latency responses.

By centralizing these complexities, `fast-saavn` allows client applications to simply request a song by title and artist, and receive a ready-to-use song object with playable download links, without needing to manage the intricacies of the JioSaavn API directly.

## Usage

To use this API, send a `GET` request to the `/api/find` endpoint with `title` and `artist` query parameters.

**Example Request:**
```
GET /api/find?title=Sapphire&artist=Ed%20Sheeran
```

**Example Response (Success):**
```json
{
  "id": "UMqOCaDY",
  "name": "Sapphire",
  "type": "song",
  "year": "2025",
  "releaseDate": null,
  "duration": 179,
  "label": "Gingerbread Man Records / Atlantic Records UK",
  "explicitContent": true,
  "playCount": 8178641,
  "language": "english",
  "hasLyrics": false,
  "lyricsId": null,
  "url": "https://www.jiosaavn.com/song/sapphire/JSUafjdRc2o",
  "copyright": "Gingerbread Man Records and Atlantic Records UK release, under exclusive licence to Warner Music UK Limited, \u2117 2025 Ed Sheeran Limited",
  "album": {
    "id": "67953434",
    "name": "Play",
    "url": "https://www.jiosaavn.com/album/play/XIuzbN7P0XE_"
  },
  "artists": {
    "primary": [
      {
        "id": "578407",
        "name": "Ed Sheeran",
        "role": "primary_artists",
        "image": [ ... ],
        "type": "artist",
        "url": "https://www.jiosaavn.com/artist/ed-sheeran-songs/bWIDsVrU6DE_"
      }
    ],
    "featured": [],
    "all": [ ... ]
  },
  "image": [ ... ],
  "downloadUrl": [
    { "quality": "12kbps", "url": "..." },
    { "quality": "48kbps", "url": "..." },
    { "quality": "96kbps", "url": "..." },
    { "quality": "160kbps", "url": "..." },
    { "quality": "320kbps", "url": "..." }
  ]
}
```

**Example Response (Not Found):**
```json
"Music stream not found in JioSaavn results"
```

## Development

This project is built with Node.js and TypeScript, designed for deployment on Vercel.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd fast-saavn
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Local Development

To run the API locally:
```bash
npm run dev # Or your equivalent local development command
```

### Deployment to Vercel

Ensure your Vercel project is linked to this repository. Vercel will automatically deploy changes pushed to the main branch. Verify the `vercel.json` configuration for correct routing.