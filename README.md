# Fast Saavn

A lightweight, high-performance API proxy for JioSaavn, built with TypeScript and optimized for Vercel. This service specializes in resolving song titles and artists into direct JioSaavn media IDs.

## Features

- **Direct Media ID Extraction**: Returns the base path of the media file, which can be used to construct direct stream URLs.
- **Smart Matching**: Implements normalization, fuzzy artist matching, and duration-based filtering to ensure the correct track is found.
- **TripleDES Decryption**: Includes a custom, lightweight implementation of DES-ECB to decrypt JioSaavn's encrypted media URLs server-side.
- **Vercel Optimized**: Configured for low-latency responses with edge caching and deployment in the `bom1` (Mumbai) region.
- **CORS Enabled**: Ready to be consumed by web applications out of the box.

## API Usage

Send a `GET` request to the root endpoint with the following query parameters:

### Endpoint
`GET /`

### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Yes | The title of the song. |
| `artist` | `string` | Yes | The name of the artist. |
| `duration` | `string` | No | The expected duration (e.g., `3:45` or `225`). Matches within a 2-second tolerance. |

### Example Request
```bash
curl "https://fast-saavn.vercel.app/?title=Blinding+Lights&artist=The+Weeknd&duration=3:20"
```

### Response
Returns a `text/plain` response containing the media ID/path.

**Success (200 OK):**
```text
342/65e9f0a2e7c9f3e4e9b9f9a2e7c9f3e4
```
*Note: You can construct the full URL by appending the quality, e.g., `https://aac.saavncdn.com/342/65e9f0a2e7c9f3e4e9b9f9a2e7c9f3e4_160.mp4`*

**Error (404 Not Found):**
```text
Music stream not found in JioSaavn results
```

**Error (400 Bad Request):**
```text
Missing title or artist parameters
```

## Development

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/fast-saavn.git
   cd fast-saavn
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Local Execution

Run the Vercel development server:
```bash
npm start
```

## Architecture

- **`api/index.ts`**: The main and only entry point. Performs the search, matching, and response formatting.
- **`api/_jioSaavn.ts`**: Internal utility for processing JioSaavn API responses. Prefixed with `_` to be ignored by Vercel's routing.
- **`api/_*.ts`**: Self-contained TripleDES (DES-ECB) crypto utilities, moved from `api/crypto/` to the `api/` folder and prefixed with `_` for efficiency and to prevent exposure as API routes.
- **Runtime**: Node.js on Vercel.

## Deployment

This project is designed to be deployed on **Vercel**.
- The `vercel.json` ensures all requests are routed to the main API handler.
- It includes aggressive caching with `s-maxage=86400` (1 day) and `stale-while-revalidate=3600` (1 hour).
- It is pinned to the `bom1` region for proximity to JioSaavn's servers.
