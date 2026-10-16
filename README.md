# 17NAS IPv6 Checker & Stats

A ChatGPT MCP app for browser IPv4/IPv6 connectivity, country-level network attribution and APNIC IPv6 adoption statistics. The NAT tool opens an external testing guide; it does not measure NAT type or diagnose game disconnections.

## Service and demo

- App website: https://mcp.17nas.com/
- Support: https://mcp.17nas.com/support.html
- Remote MCP: https://mcp.17nas.com/mcp (Streamable HTTP, no app sign-in)
- Dedicated IPv6-only probe: https://ipv6only.17nas.com/api/probe
- 60-second ChatGPT demonstration: https://youtu.be/mxxj5gtbUA4

The supplied YouTube page is unlisted. During the 2026-10-16 preparation check, YouTube required a sign-in/bot check in the unauthenticated browser, so remote playback remains unverified. Local v4 video playback and complete card visibility were checked before upload.

## Current implementation

Node.js serves the app on loopback behind the existing Nginx and Cloudflare proxy. It is not a Cloudflare Worker deployment and does not use KV, Durable Objects, daily query counters or hourly user deduplication.

- `src/server.ts`: HTTP entry point, transient source-address handling, country lookup and minute-scoped in-memory HMAC rate limiting.
- `src/index.ts`: allowlisted public API routes and sanitized responses.
- `src/mcp.ts`: five read-only MCP tools, four prompt templates and inline resource registration.
- `src/stats.ts`: validated, country-aggregate snapshots and APNIC data.
- `widget/index.html`, `widget/main.ts`: browser probes, compact cards and explicit result sharing.
- `widget/connection-result.ts`: allowlisted projection for conversation context.
- `scripts/build.mjs`: inline widget bundle, generated module and `dist/server.mjs`.

The active resource is `ui://17nas/ipv6-card-v3.html`; older v2 and legacy URIs remain compatible. ChatGPT may cache resources and tool definitions; refresh the existing development connection after metadata changes.

## Run locally

Use Node.js 22 or newer. From the repository root:

```sh
npm ci
export APP_PUBLIC_ORIGIN=http://127.0.0.1:8790
npm run build
npm start
```

Open `http://127.0.0.1:8790/`. Build-time and runtime `APP_PUBLIC_ORIGIN` must match. See `.env.example` for paths and the optional IPv6 probe. Missing GeoIP data produces Unknown country; absent or stale aggregates produce unavailable statistics rather than invented values. Local preview is not evidence of browser connectivity inside ChatGPT.

Production listens on `127.0.0.1:8790` under `17nas-chatgpt-app.service`. Environment and data are kept outside the checkout. Deployment instructions and historical evidence are in [docs/deployment.md](docs/deployment.md); the latest deployed code is recorded in [docs/submission-demo-fixes.md](docs/submission-demo-fixes.md).

## Tools and measurement limits

| Tool | Purpose |
| --- | --- |
| `check_ipv6_connection` | Probe this browser against the IPv6-only endpoint |
| `get_network_region` | Country attributed to this browser request |
| `check_network` | Combined protocol, country and HTTP-duration card |
| `get_ipv6_statistics` | Global adoption, top five and optional country statistics |
| `check_nat` | External NAT test guide and limitation notice |

AI-host calls cannot identify the user's browser connection. Network tool responses begin as pending; the browser performs the measurement. “Explain results in chat” shares the completed sanitized result and triggers a follow-up explanation. Reopening or rechecking a card can produce a new measurement.

Failed, timed-out or browser-blocked IPv6 probes remain unverified. They do not prove IPv6 is unavailable. HTTP request time includes HTTPS and service processing; it is not ping. Country attribution can reflect VPN or proxy routing. The NAT card does not measure NAT, CGNAT, packet loss, ping, jitter or a disconnection cause.

## Public API

| Endpoint | Behavior |
| --- | --- |
| `GET /health` | Health and service version |
| `GET /api/network?locale=en` | Observed HTTP transport and country, without statistics |
| `GET /api/probe?locale=en` | Probe reachability and observed IPv6 transport when confirmed |
| `GET /api/ipv6-rank?region=DE&locale=en` | Aggregate/APNIC statistics for an optional ISO country |
| `GET /api/config` | Configured dedicated probe URL |
| `POST /mcp` | Stateless MCP protocol |

API parameters are allowlisted. There is no arbitrary-IP lookup, port scan, speed test, router-control API or counting endpoint. Browser APIs use no-store responses and credentials-free CORS. The service applies a per-minute request limit; errors are localized and sanitized.

## Data and privacy

The application processes source addresses transiently for protocol/country estimation and abuse prevention. Raw addresses, ASNs, ISP names and cities are excluded from app results and the widget-to-conversation projection. The limiter holds minute-scoped HMAC entries only in process memory, with rotating keys and expiry. There are no application user accounts or persistent widget measurement records.

Own country aggregates use a 30-day source window and are hidden below 300 samples. APNIC adoption and rankings are a separate dated snapshot; they do not fill unavailable own measurements. The app reads a separately exported aggregate file, cached for one hour with last-good use limited to 24 hours. It does not access website raw records or internal APIs.

Application/Nginx logging controls do not establish provider-level retention. Cloudflare, hosting and OpenAI process requests under their own policies. Provider logging, final operator policy acceptance and support-mail reception remain preparation items. The published policy/terms currently still identify themselves as drafts; this repository does not claim legal approval.

## Languages

The interface has English and Simplified/Traditional Chinese strings. Japanese, Korean, Spanish, German and French currently use English fallback pending professional translation. Locale comes from the conversation where supplied, otherwise the host. See [docs/translations.md](docs/translations.md).

## Submission package and verification

The portable upload source is [submission/ipv6-checker-stats](submission/ipv6-checker-stats). It contains root `plugin.json`, `mcp.json` and the two supplied PNG icons. It deliberately excludes private `.app.json` bindings; Portal-generated bindings belong to the saved submission, not the author-upload ZIP.

```sh
cd submission/ipv6-checker-stats
zip -r /tmp/ipv6-checker-stats-0.2.1.zip plugin.json mcp.json assets
```

The user selected a verified individual identity, all platform-permitted countries and no commerce. The Personal organization shows Individual / Approved. The exact public display name and imported portal values must still be checked on the updated saved version before submission. Case definitions are five positive and three negative; definitions are not execution evidence. See [docs/submission.md](docs/submission.md) for status and remaining gates.

Previously completed local checks at the deployed source: TypeScript, build, 23 Vitest tests and browser harnesses. Real ChatGPT checks covered the combined card, measured-result sharing, APNIC statistics and NAT guidance. These do not establish all saved-portal review cases, a successful independent IPv6 path, native clients or review approval. Run checks only when appropriate to the requested verification scope:

```sh
npm run check
npm run build
npm test
```

GitHub PR #2 remains a draft until the outstanding review gates are resolved; it has not been merged into `main`. Production is deployed separately at code SHA `d3b374854027ab6f3d99c139934f9204ab273c88` (0.2.1). No public plugin release or review submission is implied by that deployment.

Country flags are bundled from [flag-icons](https://github.com/lipis/flag-icons), pinned to 7.2.3 (MIT), with their license. No flag CDN is used.
