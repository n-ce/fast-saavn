# Fast Saavn

A lightweight, ultra-fast API proxy for JioSaavn, built with TypeScript and optimized for the **Bun** runtime on Vercel. This service specializes in resolving song titles and artists into direct JioSaavn media IDs with extreme efficiency.

## Features

- **High Performance**: Powered by **Bun**, providing significantly faster startup and execution times compared to standard Node.js.
- **Direct Media ID Extraction**: Returns the base path of the media file, which can be used to construct direct stream URLs.
- **Smart Matching**: Implements normalization, fuzzy artist matching, and duration-based filtering to ensure the correct track is found.
- **Lightweight Crypto**: Self-contained TripleDES (DES-ECB) implementation for server-side media URL decryption without heavy dependencies.
- **Vercel Optimized**: Deployed in the `bom1` (Mumbai) region with aggressive edge caching for minimal latency.

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

## Architecture

- **`api/index.ts`**: The primary entry point, adhering to Vercel's Bun convention using standard `Request` and `Response` objects.
- **`api/_jioSaavn.ts`**: Internal utility for processing JioSaavn API responses. Prefixed with `_` to prevent Vercel from exposing it as a separate API route.
- **`api/_*.ts`**: Modularized crypto utilities for TripleDES decryption, all prefixed with `_` for internal-only use.
- **TypeScript Imports**: Optimized for Bun, utilizing direct `.ts` file extensions in imports for native resolution.

## Deployment

This project is optimized for **Vercel** with the following configuration:
- **Runtime**: **Bun** (specified via `bunVersion: "1.x"` in `vercel.json`).
- **Caching**: Aggressive edge caching with `s-maxage=86400` (1 day) and `stale-while-revalidate=3600` (1 hour).
- **Region**: Pinned to `bom1` (Mumbai) for the lowest possible latency when communicating with JioSaavn's servers.

## Development

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/n-ce/fast-saavn.git
   cd fast-saavn
   ```
2. Install dependencies (using Bun):
   ```bash
   bun install
   ```

### Local Execution

Run the Vercel development server:
```bash
vercel dev
```
