# Live conversation checks — 0.2.1

Completed 2026-10-16, Asia/Taipei. The five positive and three negative prompts and expectations came from the exact downloaded saved Portal ZIP. Field readback and all four archived file contents matched the uploaded package. Tests ran through the owner’s logged-in real ChatGPT browser against the configured production MCP endpoint, not a simulated host.

## Version and setup

- Production source: `593a4005b75e9f426b790d70fb9cd6233440439d`, health 0.2.1.
- MCP: https://mcp.17nas.com/mcp, no authentication.
- Existing development connection was refreshed and its five tools verified, including get_nat_troubleshooting_guide.
- The unpublished Portal app has a different transport ID and is not directly installable. These are configured-server behavior tests, not a claim of testing an unpublished Portal installation.
- Positive prompts used the plugin selector. Negative prompts were exact natural requests, without a new @ mention, in the relevant prior positive conversation. Separate standalone nonactivation checks were also run.

## Results

| Case | Result | Evidence |
| --- | --- | --- |
| Browser IPv6 reachability | Passed | Dedicated IPv6 tool; IPv4 420 ms, IPv6 unverified. No unsupported IPv6 conclusion; initial narration stays pending until shared |
| Browser country | Passed | Region tool; completed browser card South Korea, IPv4 HTTP 786 ms; VPN/proxy caveat; no raw IP, ASN or city |
| Combined check and explicit share | Passed | One combined tool; IPv4 428 ms, KR, IPv6 unverified/probeNetwork. Actual share click; returned explanation matches all values and distinguishes HTTP duration from ping |
| APNIC global/top-five/Germany | Passed | Global 43.67%; DE 73.04%, rank 5, +29.37 percentage points. FR/IN/FK/MY/DE ranking and October 11 source date/scope visible; matches contemporaneous public MCP structured result. Own 18-sample rate hidden |
| NAT guide boundary | Passed | Canonical guide tool; external test link; card/reply say NAT untested and do not diagnose the disconnection cause; result requested before interpretation |
| Router modification request | Passed | Follow-up after NAT case; no additional plugin call; explicitly cannot change router settings; manual guidance and model clarification, no claimed change |
| Arbitrary IP/port scan | Passed | Follow-up after country case; no additional plugin call; scan not performed, no invented target ISP/city, no substitution of earlier KR browser attribution |
| Download/upload Mbps | Passed | Follow-up after combined measurement; no additional plugin call; app cannot measure throughput; no fabricated Mbps, external speed-test result needed |

## Additional observations

Explicitly prepending @IPv6 Checker & Stats to the router-change and target-scan requests opened a read-only guide/current-browser card before the reply explained that the requested operation was unsupported. These exploratory runs failed the no-tool expectation under that different setup and are retained separately. They are not counted as passes or attributed to actual router/scanning actions. The formal prompts contain no forced @ invocation and passed both standalone nonactivation checks and the relevant conversational capability-boundary checks.

Card probing can finish after initial narration. A failed IPv6 probe remains unverified; this run does not establish a successful independent client IPv6 path. Statistics narration did not reproduce numbers when absent from its text result; the visible card was checked against the actual structured MCP statistics instead. Mobile/native client behavior and universal model reliability are not established by this run.

The raw snapshots, screenshots, private conversation links and alternative setup observations are retained in the local outputs/review-cases directory. They are not published with this source repository. The owner personally completed attestations; final Portal review status is recorded separately in submission.md.
