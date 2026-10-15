# Submission demo fixes — 0.2.1

Prepared 2026-10-16 (Asia/Taipei), based on `cce022b806bf4ebd7605c2506b200d210a2459ba`.

## Observed in the real ChatGPT session

Three English prompts were run sequentially in ChatGPT on 2026-10-15. The browser card showed IPv4 connected, an unverified IPv6 probe and country South Korea. The model's initial prose supplemented a conflicting city-level location from other context. The English failure card also contained Chinese diagnostic text. The statistics card did not directly emphasize the global percentage. NAT displayed a guide rather than a measured NAT type.

Saved conversation: https://chatgpt.com/c/6ad0d045-8da4-83ec-beb3-c139d54fca10 (account access required; not the public demo URL).

## Changes

- Publish an allowlisted completed browser measurement after the host handshake, including measured country, observed transports and HTTP duration. No IP, ASN, ISP, city or raw error is forwarded.
- Add a user-triggered “Explain results in chat” action to send the measurement into the conversation. A context update alone does not trigger a model reply.
- Mark the initial server tool result as pending and prohibit filling it with host location or memory. Clear stale country/protocol observations on recheck.
- Keep timeout, fetch, policy and HTTP failures unverified. Fetch TypeError does not identify an IPv6 routing failure conclusively.
- Remove raw diagnostics and request/tool parameter logging; retain localized friendly errors.
- Display APNIC global rate, progress bar, source and date in the statistics card.
- Describe NAT as an external test guide, with NAT/CGNAT/packet loss and root cause unmeasured.
- Add English app overview and support pages; the old app-domain root returned 404.
- Use resource `ui://17nas/ipv6-card-v3.html`; retain v2 and legacy URI compatibility.
- Correct privacy wording about transient source-address processing and remove the false claim that five pending languages have professional translations.

## Local verification

All results below use local or simulated data, not the production ChatGPT iframe.

- TypeScript and production-origin build passed.
- Vitest: 23 tests passed, including sanitized result projection, pending/NAT metadata, resource version and request-log privacy checks.
- Chrome browser harness: all five intents, country flags, sample threshold, HTTP failures, locale precedence, 320px layout and repeated expand/collapse passed.
- Probe harness: fetch failure, 5-second timeout, base outage, late host handshake, conversation send and stale-country clearing passed.
- `git diff --check` passed.

## Deployment and rollback

Target: existing `/var/www/17nas-chatgpt-app` on `cloudcone-yinian`, service `17nas-chatgpt-app.service`. Rebuild with `APP_PUBLIC_ORIGIN=https://mcp.17nas.com`; preserve environment, aggregate snapshots, GeoIP database and Nginx configuration. Refresh the existing ChatGPT app tool definitions after update.

Rollback target: previous source `cce022b806bf4ebd7605c2506b200d210a2459ba` plus its existing built assets. Back up current `dist` before changing the service. No production write or restart has yet been performed for this release.

## Outstanding evidence

Verify the new resource, message action, model narration and all three English demonstration flows in actual ChatGPT after update. A successful native IPv6 network comparison, native clients, provider log retention, final operator policy review and public review status remain unverified. The slideshow HTML is a supplementary presentation, not the actual-host demonstration recording. A real recording and reviewer-accessible playback URL remain required.
