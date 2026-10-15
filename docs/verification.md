# Verification record

Verified on 2026-10-14. The independent service runs on the existing server. The production IPv6-only probe is verified. Public HTTPS MCP hosting at mcp.17nas.com is verified; real ChatGPT integration remains pending. See [real-environment checklist](chatgpt-live-test.md).

- TypeScript checks and build pass. Fourteen App/server tests cover tools, source separation, the 300-sample threshold, rejected IP parameters, statistics cache expiry, country fallback, trusted proxy handling and rate limiting. Idle rate-limit state expires automatically.
- The independent aggregate exporter passes four tests. Its hourly export is installed; the App reads only its filtered copy and its own GeoIP database.
- The systemd service cannot read the website directory, website state, Nginx logs or root home. Runtime access checks confirmed these restrictions. Access/error logs are disabled for the isolated local proxy.
- Local Nginx integration returned HTTP 200 for health, network, statistics, probe, widget, policy and flag assets. MCP initialization, resource listing and all five tools passed. The eleventh request in a minute returned a localized HTTP 429. Spoofed client-IP headers did not override trusted transport metadata.
- Browser regression passed all five card kinds, automatic detection, missing statistics, probe/network failures, flags, sample counts 0/299/300/301, repeated disclosure toggles and narrow layouts. Simulated iframe height returned to 321px after eight disclosure cycles. Screenshots and probe responses are simulated; they do not prove production IPv6 connectivity or real ChatGPT sizing.
- Flag bindings were FR → fr.svg, IN → in.svg, FK → fk.svg, MY → my.svg and DE → de.svg. Assets are bundled from pinned flag-icons 7.2.3; unsupported or failed flags use neutral placeholders.
- Query counters are removed from this release. No KV, Durable Objects or Cloudflare account access is required.

## Existing website capability audit

Both https://17nas.com/ipv6-test.php and https://17nas.com/ip-test.php returned HTTP 200. The IPv6 browser code probes third-party IPv6 endpoints that return addresses, then uses website-specific metadata and result-recording logic. The IP page calls /api/ip/detect.php, whose implementation returns IP/ASN and caches per-IP result data. These interfaces are not used by the App.

The existing v6.17nas.com name resolves to both A and AAAA records. Its successful HTTP response alone does not establish an IPv6-only browser path. A dedicated isolated probe must avoid IP responses, website recording and IPv4 fallback.

app.17nas.com belongs to another project. The newly prepared local HTTP vhost for it has been disabled; no DNS change was made. The service and widget now pin https://mcp.17nas.com at build time and runtime. DNS was added by the operator; public TLS/MCP verification is tracked separately from real ChatGPT testing.

No GitHub push, directory submission or production ChatGPT verification is claimed here. Five languages remain pending professional translation.

## Public endpoint verification, 2026-10-14 17:23 UTC

- Nginx uses a dedicated MCP TLS listener and SNI route. The probe destination-address route and existing website listeners are unchanged. App access/error logs remain disabled.
- The mcp.17nas.com certificate was issued successfully, expires 2027-01-12, and has automatic renewal configured.
- Public health/config returned 200. Public MCP initialization negotiated 2025-06-18; tools/list returned all five tools; all five tools/call requests succeeded. Resource metadata uses text/html;profile=mcp-app and allows only the App origin and IPv6 probe for connections.
- Public widget, privacy, terms and MY/DE/FK flag assets returned 200. API OPTIONS returned 204 with Access-Control-Allow-Origin: *.
- Existing website returned 200. The probe returned 200 over IPv6 with valid TLS and only {"ipv6Status":"supported"}; IPv4 connection failed (curl exit 7, HTTP 000). This test originates on the server, not a real ChatGPT user's network.
- Cloudflare returned 403 / error 1010 (browser_signature_banned) to the default Python-urllib user agent. Curl and a request using its user agent succeeded. Actual ChatGPT connector access must be checked before treating the proxy as compatible with production AI clients; no Cloudflare account settings were changed.

Public availability is verified separately from the pending authenticated ChatGPT iframe and multi-network tests.

## Local browser connection display upgrade

TypeScript checks, bundle build and 15 Vitest cases passed. Chromium simulated fixtures cover all five card intents, reserved IPv4/IPv6 address display, independent probe/API failures, conversation locale precedence over host locale, clipboard success/denial, flag code bindings/fallbacks, own-sample boundaries 0/299/300/301, 320px layout and repeated standard bridge resize. Images in `artifacts/card-intent-*-zh.png` use simulated documentation addresses, not live user data. No GitHub push, production deploy or authenticated ChatGPT console capture was performed for this upgrade.
