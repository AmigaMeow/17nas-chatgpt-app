# Directory submission preparation — 0.2.1

Updated 2026-10-16 (Asia/Taipei). This is preparation evidence, not a claim of submission readiness or review approval.

## Identity and publication choices

- Stable name: `ipv6-checker-stats`.
- English display name: IPv6 Checker & Stats.
- Subtitle: IPv6 checks & global stats (26 characters).
- Intended category: Developer Tools; the existing Portal draft uses it.
- Owner chose an individual identity. The Personal organization general settings show Verified and Individual / Approved (checked 2026-10-16). The owner confirmed the exact operator name jiahui zhang / 17NAS and accepted the policies on 2026-10-16. The candidate uses jiahui zhang as developerName; verify it after import.
- Owner chose all platform-permitted countries. `publication.countries: []` represents no package country restriction; check the imported setting.
- Owner confirmed the plugin and linked NAT test are free, with no purchases/subscriptions. `review.commerce` is false.
- English is the base listing language. Do not claim professional translations for pending locales.

## URLs and demo

- Website: https://mcp.17nas.com/
- Support: https://mcp.17nas.com/support.html
- Privacy: https://mcp.17nas.com/privacy.html
- Terms: https://mcp.17nas.com/terms.html
- Reviewer demo: https://mcp.17nas.com/demo.html
- Original owner YouTube upload: https://youtu.be/mxxj5gtbUA4

All four product URLs returned 200 and their contents were checked on 2026-10-16. Owner-approved privacy and terms were published with the 2026-10-16 effective date; draft labels were removed. A Python default-user-agent request received 403 while curl received 200; unrestricted automated access is not established. The Portal's existing 0.2.0 draft reports a non-blocking failure to automatically assess the privacy policy.

YouTube displays the correct title and Unlisted status but asks the unauthenticated browser to sign in to confirm it is not a bot. YouTube playback was not verified; this is not evidence that the video was made private. The owner authorized hosting the same video on the app domain. Its downloadable bytes match the approved file, with 206 range support. Actual unauthenticated browser playback completed: duration/currentTime 60 seconds, ended true, 1920×1080, no media error. The full connection card was visually checked above the composer. Do not bypass the challenge or mark reviewer playback as passed. The local v4 60-second video was checked for playback and complete card visibility before the owner uploaded it.

## Upload source

`submission/ipv6-checker-stats/` contains the portable manifest, one no-auth Streamable HTTP MCP declaration and supplied 1600×1600 PNG icons. Metadata includes the owner's video URL, publication/commerce choices and five positive/three negative cases. Do not upload root `.app.json` or private app bindings. Preserve existing Portal-generated bindings and connection state when updating the existing draft.

The saved Portal plugin is `plugin_asdk_app_6ad0564497308191966b002b6dd55c37`, updated in place to version 0.2.1, Not submitted, Not published, MCP Configured. The associated app remains `asdk_app_6ad0564497308191966b002b6dd55c37`; developer jiahui zhang and all four listing links were read back. Metadata checks completed with No findings. It is different from the development installation used to record the video. Do not create a duplicate plugin because those IDs differ.

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

1. Read back all imported review/publication scalar fields and cases. The candidate ZIP includes the verified hosted demo, five positive/three negative cases, commerce false and all permitted countries. The current UI did not expose a persistent review-information editor after import; do not equate uploaded source with full readback.
2. Run all eight cases against the exact saved version. The logged-in ChatGPT plugin list currently shows only development connection `plugin_asdk_app_6ad03e262bf08191981d2a12806f50bf`, not the saved Portal plugin; development evidence is not substituted. Opening the settings route for the exact saved plugin returned “Unable to load plugin settings”; no duplicate installation was created.
3. The authorized developer personally completes the six current legal/policy attestations. The final dialog was opened for inspection; all boxes remain unchecked and final Submit was not clicked. It covers Terms/Guidelines, legal compliance, no money/crypto/investment execution, third-party rights, under-18 suitability and no targeting/sharing data of children under 13.
4. After these checks, perform the final authorized review submission. Publication is a separate later action after approval.

## GitHub and deployment

PR: https://github.com/AmigaMeow/17nas-chatgpt-app/pull/2 (draft, unmerged).

Production code is `593a4005b75e9f426b790d70fb9cd6233440439d`, service active, health 0.2.1 as checked on 2026-10-16. This is separate from main and from the saved Portal package. The naming patch was deployed under the owner’s existing authorization, with configuration/data preserved.

Official flow: https://developers.openai.com/plugins/deploy/submission

## MCP scan follow-up — 2026-10-16

The Portal scan reported an unclear name for `check_nat`. The candidate now advertises `get_nat_troubleshooting_guide` with an explicit NAT expansion and guide-only description. Cached `check_nat` calls are normalized before MCP dispatch. Deployment completed at code `7564cfa`. Public HTTPS tool listing advertises the canonical name, and both canonical and legacy calls returned `natStatus: not_tested`. Build, TypeScript and 23 existing tests passed. The first loopback MCP check was rejected with 429 because it lacked trusted proxy source metadata; the deployment script restored the old build. The corrected verification used the existing public HTTPS gateway and passed after redeployment. The completed follow-up Portal scan on 2026-10-16 showed “No findings in the latest MCP scan”, the canonical name in the five-tool list, and Domain verified. This is a scan result, not review approval. The old saved 0.2.0 package has since been replaced in place by the owner-authorized 0.2.1 candidate.

## Owner-approved policy and video hosting — 2026-10-16

Owner confirmed the operator name, accepted the proposed policy text and authorized publishing the same 60-second MP4 on the app domain. The policies and demo page were deployed. The MP4 is hosted by an exact Nginx alias from `/var/www/17nas-app-demo/ipv6-demo-60s.mp4`, outside protected app data; no app-data permissions were widened. Media checksum: `f7e6d940cef278015b5150d7e8ba883dbdb5a838f525aa6fcce9eba29a6b8cd9`. Initial media verification exposed Nginx lacking traversal of the protected app-data parent; the public media location fixed this. Nginx validation and health checks passed. Backups: `/var/backups/17nas-chatgpt-app/20261016T002931Z-pre-policy-demo` and `/var/backups/17nas-chatgpt-app/20261016T003109Z-pre-public-demo-path`.

## Saved draft update evidence

Uploaded archive SHA-256: `2a0c383df24b0507da86cbe9febbe27793cb20859c701255d887e210bfbfe598`. The draft is 0.2.1 with developer jiahui zhang, current app URLs, preserved MCP app and No findings from completed metadata checks. The MCP tab retained the canonical five tools and the prior clean scan. Download draft ZIP did not emit a browser download event, so no saved archive was obtained. Legal attestations remain unchecked; no review submission or publication occurred.
