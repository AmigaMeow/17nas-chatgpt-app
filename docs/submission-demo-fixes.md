# Submission demo fixes — 0.2.1

Prepared 2026-10-16 (Asia/Taipei), based on `cce022b806bf4ebd7605c2506b200d210a2459ba`.

## Observed in the real ChatGPT session

Three English prompts were run sequentially in ChatGPT on 2026-10-15. The browser card showed IPv4 connected, an unverified IPv6 probe and country South Korea. The model's initial prose supplemented a conflicting city-level location from other context. The English failure card also contained Chinese diagnostic text. The statistics card did not directly emphasize the global percentage. NAT displayed a guide rather than a measured NAT type.

Saved conversation: https://chatgpt.com/c/6ad0d045-8da4-83ec-beb3-c139d54fca10 (account access required; not the public demo URL).

## Changes

- Publish an allowlisted completed browser measurement after the host handshake, including measured country, observed transports and HTTP duration. No IP, ASN, ISP, city or raw error is forwarded.
- Add a user-triggered “Explain results in chat” action to send the measurement into the conversation. A context update alone does not trigger a model reply.
- Route combined IPv4/IPv6/country requests to one combined tool rather than three overlapping cards.
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

Rollback target: previous source `cce022b806bf4ebd7605c2506b200d210a2459ba` plus its existing built assets. Back up current `dist` before changing the service. The operator authorized deployment on 2026-10-16 Asia/Taipei. See the dated live record below.

## Outstanding evidence

The three demonstration flows and result sharing were exercised in real ChatGPT; see the dated record below. All five individual review cases have not been independently completed. A successful native IPv6 network comparison, native clients, provider log retention, final operator policy review and public review status remain unverified. The slideshow HTML is a supplementary presentation, not the actual-host demonstration recording. The final local v4 recording is complete; the owner supplied https://youtu.be/mxxj5gtbUA4. Actual remote playback remains unverified because YouTube showed a sign-in/bot check in the unauthenticated session. See docs/submission.md for current readiness.

## Live deployment and browser record — 2026-10-16 Asia/Taipei

- Initial deployment completed at 2026-10-15 17:01:08 UTC. Old `dist` and source SHA were backed up at `/var/backups/17nas-chatgpt-app/20261015T170105Z-pre-0.2.1`.
- The tool-routing follow-up was deployed from `d3b374854027ab6f3d99c139934f9204ab273c88`. Production checkout is detached at that SHA; original `codex/ipv6-app` branch is preserved. The service is active and `/health` reports 0.2.1. Environment, snapshots, GeoIP database and Nginx configuration were preserved.
- Public homepage, support, privacy and terms returned 200 with the correct app identity. Public MCP listed five tools, all using the v3 resource. Existing ChatGPT app tools were refreshed.
- Original three English queries were repeated in a real connected ChatGPT session. The broad first prompt initially caused three overlapping tool calls; routing descriptions were tightened, and a concise combined prompt then opened one combined card.
- The combined card observed IPv4, 675 ms HTTP duration, country KR/South Korea and an unverified IPv6-only probe with a network error. This does not prove a lack of IPv6 support.
- The user-triggered Explain results in chat action acknowledged delivery. The subsequent plain-text summary matched 675 ms, South Korea and the unverified probe, without IP, ASN, ISP or city disclosure.
- The APNIC card displayed global 43.67%, snapshot 2026-10-11, France 85.65%, India 76.76%, Falkland Islands 75.16%, Malaysia 73.4%, Germany 73.04%. This is a dated snapshot, not a claim of live worldwide measurement.
- NAT displayed an external test guide and explicitly stated NAT/CGNAT/packet loss/root cause had not been measured. The external test was not run.
- Some long-form model replies displayed ChatGPT's “This response couldn’t load” error while the app card remained available. A later plain-text summary rendered. Keep this host-rendering limitation open; this record does not establish general host reliability, all five review cases, native clients or review approval.
- Actual browser screencast frames were saved for an edited 20-second highlight and a longer walkthrough. Cuts/crops/scaling/fades shorten waiting time; the HTML slideshow is not the recording source.

Real conversations (account access required):

- https://chatgpt.com/c/6ad1076a-44c0-83ee-b726-004b96c221ca
- https://chatgpt.com/c/6ad1095f-cfd4-83ee-a6ba-b637162dcf61


## Submission material update — 2026-10-16

The owner rejected earlier edits for blur and composer overlap. The final local v4 video was re-recorded in real ChatGPT using a taller 1280×900 CSS viewport and native 1920×1350 PNG frames. A vertical 1920×1080 crop keeps each result card visible above the composer without spatial upscaling. The 20-second preview and 60-second walkthrough passed full decode and browser playback checks; actual encoded frames at10s/37s/58s showed the complete connection, statistics and NAT cards. The connection take measured319ms,KR,IPv4 observed and an unverified IPv6 probe timeout; the actual share click produced a matching model summary. This supersedes earlier edited-demo descriptions, not the historical individual measurement values above.

The owner supplied the YouTube URL above and confirmed individual identity, all platform-permitted countries and no commerce. The Personal organization shows Individual / Approved. The current saved Portal version is0.2.0, configured, not submitted and not published. New public-upload source and case definitions are in submission/ipv6-checker-stats. Privacy/terms operator acceptance, provider/support practices, remote playback and all exact saved-version cases remain gates. No legal attestation, draft replacement, final review submission or publication has occurred in this preparation pass.
