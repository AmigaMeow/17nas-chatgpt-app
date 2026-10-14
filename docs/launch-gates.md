# Launch gates

These are concrete unresolved checks, not claims of approval.

1. **Abuse state under failures:** normal concurrent counting is serialized and tested. KV is eventually consistent; its HMAC write and the SQL increment are not a single transaction. A restart can permit a duplicate or retain a dedup marker for an increment that failed. Minute limiting also depends on memory plus KV. Strict crash-proof per-IP limits need a strongly consistent, short-retention store whose backup policy meets the one-hour identifier requirement. Do not put HMACs into SQLite-backed DO storage without resolving its point-in-time recovery retention.
2. **Storage retention:** SQL alarms logically retain 30 UTC daily totals, KV HMAC TTL is at most one hour, fresh statistics TTL one hour, last-good TTL 24 hours. Verify Cloudflare backup and security/platform log retention before claiming physical deletion after these periods. SQLite recovery history may retain logically deleted totals longer.
3. **IPv6 probe:** provision an independent IPv6-only host, with no A record and no website/internal API routing. Verify both successful IPv6 access and IPv4 failure. DNS alone is insufficient, especially with a Cloudflare-proxied hostname. Leave detection unknown until verified.
4. **Account and credentials:** correct 17NAS Cloudflare account/zone access is not available in the connected account; CLI credentials need renewal. Do not use an unrelated account. Both KV namespaces, HMAC secret, Worker/custom domain, and exporter write token remain unprovisioned.
5. **Repositories and release:** independent App repository needs creation/access; npm and Registry publisher authentication remain required. MCP is a 1.1.0 release candidate until published and discoverable.
6. **Directory:** OpenAI account/developer connector review is required for real-host card validation and submission. Directory search was challenged; no uniqueness or competitor ratings were verified. English/Chinese wording and legal drafts need owner review; five languages need professional translation.
7. **Budget/contact:** verify hello@17nas.com receives mail and configure an available Cloudflare notification or external monitoring mechanism for monthly usage above $10. This repository does not install a budget alert.

No launch is complete while these gates remain open. A passed local test does not establish fault tolerance, legal compliance, production latency, or marketplace acceptance.
