# 17NAS IPv6 Checker & Stats

An independent ChatGPT inline card and MCP-over-HTTP service for IPv6 connection checks, country attribution, and separate 17NAS/APNIC statistics. It does not expose IP addresses, ASN, or NAT. Version 0.2.1 contains submission preparation fixes; publication and review approval remain separate steps.

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
| `POST /mcp` | Stateless MCP, five intent-specific tools and shared inline HTML resource |

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

Ranking flags use the SVG assets from [flag-icons](https://github.com/lipis/flag-icons), pinned to 7.2.3 (MIT). Assets and their license are bundled and served by the App origin; no flag CDN is contacted. Missing flag assets fall back to the country name.

### Intent-specific conversation cards

| Tool | Card behavior |
| --- | --- |
| `check_ipv6_connection` | Automatically probe this browser connection; optional recheck |
| `get_network_region` | Determine the current browser request country; no IP/ASN or IPv6 probe |
| `check_nat` | Explain the limitation and link to the separate browser NAT test; no detection or counting |
| `get_ipv6_statistics` | Country APNIC comparison and global Top 5; optional ISO country input; no probe or counting |
| `check_network` | Combine browser connection and country attribution |

Only cards that check connectivity automatically contact the configured IPv6-only endpoint. Counting applies to connection and country attribution requests, with hourly deduplication. Server tool calls originate from the AI host and cannot measure the user connection or locate the user. Browser results are sent through address-free `updateModelContext`; this does not rewrite an already delivered assistant message. Failed probes remain unknown, including sandbox/CORS/network failures. Real ChatGPT sandbox connectivity still requires deployment validation.

Cards follow the host locale without a language selector. Query ordinals, source dates, ranking scope, publishable own sample methodology and legal links are available through native expandable details. Own samples below the threshold are hidden entirely and never replaced by APNIC values. There is no development banner or unrelated NAS guidance. The standalone preview uses the same compact layout.
