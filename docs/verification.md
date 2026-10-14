# Verification record

Verified locally on 2026-10-14. This is a development preview, not an approved or deployed ChatGPT App.

- App: 9 Worker tests passed, including atomic parallel query ordinals, UTC date rollover, rate limiting, rejected IP parameters, separate statistics sources, locale handling, and MCP initialization/resource access.
- TypeScript checks passed for the Worker and widget. Production dependency audit reported no vulnerabilities.
- MCP companion: 4 tests passed; stdio exposed all 7 tools. The 1.1.0 npm package passed packaging checks but has not been published.
- Independent aggregate exporter: 4 tests passed. The local App API read the filtered production snapshot without accessing the website's internal API.
- Chromium standalone preview: the card rendered, language selection switched to simplified Chinese, and the query button returned a country query ordinal. No browser errors were reported. The local development country is simulated and does not establish a real user's location.
- The card showed insufficient 17NAS samples for US separately from APNIC Labs rankings and displayed the missing IPv6 probe configuration as an unavailable result.
- Revised card layout: desktop and 390px mobile previews rendered without browser errors or horizontal overflow. Chinese language selection worked; an injected HTTP 503 displayed the diagnostics panel. All five APNIC ranking rows rendered progress bars. The initial state explicitly says the check has not started.
- Reference-based visual refinement: rebuilt and checked desktop and 390px previews, Chinese language switching and an injected HTTP 503. All information cards use 12px corners and 20px padding; the five ranking bars use dark, medium and pale green according to rank. Browser errors and horizontal overflow were absent. Screenshots were refreshed locally.

The browser check found an inline JavaScript build defect: string replacement interpreted literal replacement tokens in bundled JavaScript. The build now uses a callback and checks the final inline module syntax before writing output.

Local screenshots were saved under ignored `artifacts/card-en.png`, `artifacts/card-zh.png`, `artifacts/card-mobile.png`, and `artifacts/card-error.png`. They show a standalone preview, not a ChatGPT session.

Remaining production requirements are tracked in [launch-gates.md](launch-gates.md): correct Cloudflare account access, bindings and secrets, a verified IPv6-only probe endpoint, fault-safe abuse deduplication, platform retention/logging verification, translations, and directory submission. Budget alerts and the export schedule have not been activated.
