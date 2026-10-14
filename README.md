# 17NAS IPv6 Checker & Stats

An independent ChatGPT inline card and MCP-over-HTTP service for IPv6 connection checks, anonymous country query counts, and separate 17NAS/APNIC statistics. It does not expose IP addresses, ASN, or NAT. Version 0.1.0 is a local release candidate, not a submitted or approved directory App.

## Local run

Requires Node.js 22 or newer and Python 3 for the independent exporter.

```sh
npm ci
cp .dev.vars.example .dev.vars
npm run dev
```

Open `http://localhost:8787`. This is a standalone preview. The production MCP endpoint is `/mcp`; connect it through ChatGPT developer mode only after HTTPS deployment. The MCP tool supplies a cached card; only the browser card determines the user's country and records a query. AI-host source addresses are not used as user locations.

Local KV starts empty. To load a sanitized snapshot produced by the separate exporter:

```sh
npm run export:validate -- /tmp/app-snapshot.json
npx wrangler kv key put stats:fresh --binding STATS --path /tmp/app-snapshot.json --local
npx wrangler kv key put stats:last-good --binding STATS --path /tmp/app-snapshot.json --local
```

The sample test fixture is captured aggregate data, not live statistics. Its original timestamps are preserved. Data older than 24 hours is rejected.

## Architecture and isolation

- Cloudflare Worker serves `/mcp`, the card, and the dedicated App API.
- A Durable Object per country atomically assigns UTC daily query ordinals and stores only date/count rows.
- App-only `STATS` KV holds fresh (1 hour) and last-good (up to 24 hours) aggregate exports.
- App-only `ABUSE` KV holds minute HMAC request slots and hourly HMAC deduplication records. No plaintext address is written to either store.
- A separate exporter reads the website's existing aggregate snapshot locally and pushes whitelisted fields into the App store. This repository contains no website internal API fetch or exporter implementation.

Own samples use the existing hourly update and 30-day window. Fewer than 300 samples gives `ipv6Rate: null` and `insufficient_data`. APNIC Labs weekly data powers the global Top 5 and ranks, with data date and snapshot country/territory scope; it never fills missing own rates.

A dedicated **IPv6-only**, App-controlled probe URL must be provisioned separately. `IPV6_PROBE_URL` is deliberately blank until this exists. The existing website test domain is unsuitable. A failed probe returns unknown; it does not prove IPv6 is unsupported.

## API

No endpoint accepts an IP parameter, explicit country override for counting, cookie, or user identifier. Edge source information is used transiently for country selection and keyed HMAC abuse checks. Unknown country is `XX`.

| Endpoint | Behavior |
| --- | --- |
| `GET /health` | Service version and health |
| `GET /api/ipv6-rank?region=US&locale=en-US` | Read country totals and separated statistics, without counting |
| `POST /api/ipv6-query?locale=zh-CN` | Body `{}`; count the source country query once per hour |
| `GET /api/config` | Configured dedicated probe URL |
| `GET /api/probe` | Confirm whether the source connection reaching this endpoint was IPv6 |
| `POST /mcp` | Stateless MCP, `check_network` tool and inline HTML resource |

Results include `region`, `ipv6Status`, own `ipv6Rate`, `todayQueries`, `myRank`, `globalRank`, own sample metadata, separate `apnic` metadata/Top 5, source timestamps and cache state. POST also provides `rank`, `total`, and `counted`. A duplicate across midnight has no ordinal for the new day. Optional `locale` selects localized error messages. API CORS permits credentials-free browser calls. The eleventh request for one source in a UTC minute receives 429; other errors are sanitized and localized.

```sh
curl -fsS 'http://localhost:8787/api/ipv6-rank?region=US&locale=en-US'
curl -fsS -X POST 'http://localhost:8787/api/ipv6-query' -H 'Content-Type: application/json' --data '{}'
```

## Languages

Eight locale files: en, zh-CN, zh-TW, ja, ko, es, de, fr. `zh-HK` maps to `zh-TW`, bare `zh` to `zh-CN`, unknown/missing locale to English. Numbers, dates and country labels use locale-aware formatting; Chinese integer grouping is suppressed. All UI strings come from JSON.

English and Chinese await owner review. Japanese, Korean, Spanish, German and French intentionally display English with a pending-translation notice until professional translation is supplied. The requested AI examples live separately under `docs/translation-drafts` with confidence labels and are not production translations. See `docs/translations.md` and `docs/translation-handoff.csv`.

## Validation and release

```sh
npm run check
npm test
npm run dry-run
npm audit --omit=dev
```

Worker-runtime tests cover concurrency, midnight deduplication, request limiting, rejected IP input, absent IP output, data isolation, stale-cache limits, locale mapping, MCP initialization/tool listing/tool calls/resource reading. Browser screenshots are local preview evidence; they are not ChatGPT-directory approval evidence.

See `docs/deployment.md`, `docs/launch-gates.md`, `docs/submission.md`, and `docs/data-audit.md`. No production deployment, npm publication, registry update, OpenAI submission, budget alert or professional translation has been completed by preparing this checkout.
