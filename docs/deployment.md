# Deployment runbook

Target: independent repository AmigaMeow/17nas-chatgpt-app, domain app.17nas.com. Do not deploy into the website Worker or reuse its storage bindings.

1. Confirm the correct Cloudflare account and zone. Inspect the current app.17nas.com DNS/service before changing it.
2. Create two App-only KV namespaces (`STATS`, `ABUSE`) and replace the placeholder IDs in wrangler.jsonc. Configure a random HMAC_SECRET of at least 32 characters with `wrangler secret put HMAC_SECRET`; never commit it.
3. Resolve the privacy/fault-tolerance launch gates. Disable application request logging and confirm platform logging/backups independently.
4. Set up and verify the isolated IPv6-only probe, then set IPV6_PROBE_URL. Its endpoint returns `{ "ipv6Status": "supported" }` only on IPv6, sends CORS headers and records no address. It must not touch website APIs.
5. Run build, type checks, tests, dependency audit, and deployment dry-run. Deploy with authenticated Wrangler only after the correct bindings/domain are established.
6. In the separate exporter environment, provision an App-scoped KV write token. Validate exported JSON with `npm run export:validate -- /tmp/app-snapshot.json`, push it, then install the independent hourly :30 job. No scheduled job is installed by this checkout.
7. Check health, API GET/POST/429 behavior, source separation, host MCP tools/list/resources/read, unknown location, cached/unavailable states, IPv6 success and IPv4 probe failure. Measure deployed latency; local measurements do not prove the requested <2 seconds.
8. Set the $10 monthly alert for hello@17nas.com using the account's available notification capability. Confirm delivery without assuming MX records prove mailbox delivery.
9. Connect https://app.17nas.com/mcp in ChatGPT developer mode, capture real-host screenshots, and submit through the actual OpenAI account. Save the issued submission identifier/link and approved version after approval.

Maintain semantic versions and CHANGELOG.md. Review current OpenAI update rules before publishing; a wording or bug fix is not assumed exempt from review. Preserve the approved release tag and compare code and data handling before every update. New capabilities and changed collection require an explicit review assessment.

The deploy script builds before running Wrangler. A successful dry-run uploads nothing.
