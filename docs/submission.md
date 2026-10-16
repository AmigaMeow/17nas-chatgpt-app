# Directory submission preparation — 0.2.1

Updated 2026-10-16 (Asia/Taipei). This is preparation evidence, not a claim of submission readiness or review approval.

## Identity and publication choices

- Stable name: `ipv6-checker-stats`.
- English display name: IPv6 Checker & Stats.
- Subtitle: IPv6 checks & global stats (26 characters).
- Intended category: Developer Tools; the existing Portal draft uses it.
- Owner chose an individual identity. The Personal organization general settings show Verified and Individual / Approved (checked 2026-10-16). The exact public developer display name still needs reconciliation on the updated saved version; 17NAS is the current draft brand.
- Owner chose all platform-permitted countries. `publication.countries: []` represents no package country restriction; check the imported setting.
- Owner confirmed the plugin and linked NAT test are free, with no purchases/subscriptions. `review.commerce` is false.
- English is the base listing language. Do not claim professional translations for pending locales.

## URLs and demo

- Website: https://mcp.17nas.com/
- Support: https://mcp.17nas.com/support.html
- Privacy: https://mcp.17nas.com/privacy.html
- Terms: https://mcp.17nas.com/terms.html
- Demo supplied by owner: https://youtu.be/mxxj5gtbUA4

All four product URLs returned 200 and their contents were checked on 2026-10-16. A Python default-user-agent request received 403 while curl received 200; unrestricted automated access is not established. The Portal's existing 0.2.0 draft reports a non-blocking failure to automatically assess the privacy policy.

YouTube displays the correct title and Unlisted status but asks the unauthenticated browser to sign in to confirm it is not a bot. Playback was not verified; this is an access check blocker, not evidence that the video was made private. Do not bypass the challenge or mark reviewer playback as passed. The local v4 60-second video was checked for playback and complete card visibility before the owner uploaded it.

## Upload source

`submission/ipv6-checker-stats/` contains the portable manifest, one no-auth Streamable HTTP MCP declaration and supplied 1600×1600 PNG icons. Metadata includes the owner's video URL, publication/commerce choices and five positive/three negative cases. Do not upload root `.app.json` or private app bindings. Preserve existing Portal-generated bindings and connection state when updating the existing draft.

The saved Portal plugin is `plugin_asdk_app_6ad0564497308191966b002b6dd55c37`, currently version0.2.0, Not submitted, Not published, MCP Configured. It is different from the development installation used to record the video. Do not create a duplicate plugin because those IDs differ.

## Review case evidence

Five distinct positive cases and three out-of-scope negative cases are declared in the manifest. Natural prompts and expected tools/results are defined there.

| Case | Current evidence |
| --- | --- |
| Dedicated IPv6 check | Not run against the exact saved Portal version; earlier browser probes remained unverified |
| Browser country attribution | Not run as a separate case against the saved Portal version |
| Combined network and result sharing | Passed in development ChatGPT recording: IPv4,319ms,KR,IPv6 unverified; matching follow-up summary. Saved-Portal case not run |
| APNIC global/top-five/DE | Global/top-five passed in development recording. Exact DE case against saved Portal version not run |
| NAT boundary | Passed as external guide in development recording. Exact saved-Portal case not run |
| Router modification refusal | Not run |
| Arbitrary-IP/port-scan refusal | Not run |
| Download/upload speed-test refusal | Not run |

Live server tool annotations declare readOnlyHint true, openWorldHint true and destructiveHint false. Failed probes must remain unverified. A NAT guide is not a measured NAT type or root-cause diagnosis.

## Remaining gates

1. Confirm the exact verified individual developer name in the intended Personal organization/project.
2. Verify actual playback of the supplied YouTube recording without reviewer-specific access problems.
3. Resolve operator approval of the published privacy/terms drafts, provider processing/retention scope. Support reception and the 90-day-after-resolution deletion rule (with earlier deletion requests) were confirmed by the owner on 2026-10-16. Do not replace unknown practices with zero-retention claims.
4. Update the existing draft ZIP, check imported metadata, preserved connection and latest MCP scan. Reupload can reset attestations.
5. Run and record all eight cases against that exact saved version. Local harnesses and development recordings are not substitutes.
6. The authorized developer personally completes legal/policy attestations and approves the concrete final submission. No attestations or final submit action have been taken.

## GitHub and deployment

PR: https://github.com/AmigaMeow/17nas-chatgpt-app/pull/2 (draft, unmerged).

Production code is `7564cfafe0cca3b2a18c85f17bbede232539825b`, service active, health 0.2.1 as checked on 2026-10-16. This is separate from main and from the saved Portal package. The naming patch was deployed under the owner’s existing authorization, with configuration/data preserved.

Official flow: https://developers.openai.com/plugins/deploy/submission

## MCP scan follow-up — 2026-10-16

The Portal scan reported an unclear name for `check_nat`. The candidate now advertises `get_nat_troubleshooting_guide` with an explicit NAT expansion and guide-only description. Cached `check_nat` calls are normalized before MCP dispatch. Deployment completed at code `7564cfa`. Public HTTPS tool listing advertises the canonical name, and both canonical and legacy calls returned `natStatus: not_tested`. Build, TypeScript and 23 existing tests passed. The first loopback MCP check was rejected with 429 because it lacked trusted proxy source metadata; the deployment script restored the old build. The corrected verification used the existing public HTTPS gateway and passed after redeployment. The completed follow-up Portal scan on 2026-10-16 showed “No findings in the latest MCP scan”, the canonical name in the five-tool list, and Domain verified. This is a scan result, not review approval. The saved 0.2.0 draft has not been replaced.
