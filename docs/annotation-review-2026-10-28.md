# Annotation review — 2026-10-28

The owner reported an annotation-related rejection. The initial public `tools/list`
already contained all four annotations as explicit booleans for all five tools.
This patch corrects the blanket open-world classification; it does not claim to
identify the exact tool or descriptor snapshot flagged by the reviewer.

Production baseline: `593a4005b75e9f426b790d70fb9cd6233440439d`.
The five relevant source files matched the local candidate before edits.
`codex/network-tools-1.1` was absent from local, remote and production refs in
the identified repository. The owner authorized proceeding with the verified
production implementation instead.

All five tools use `readOnlyHint=true`, `destructiveHint=false`, and
`idempotentHint=true`: they retrieve/compute without persisting user results,
modifying network settings, starting stateful jobs, or sending messages.
A later observation may differ; idempotency concerns repeated side effects,
not an immutable response.

| Tool | openWorldHint | Observed scope |
| --- | --- | --- |
| check_ipv6_connection | true | Opens a card that observes the current browser transport and reaches a public IPv6-only probe. |
| get_network_region | true | Opens a card that observes the live current browser connection, with country attribution by the app service. Its subject is the caller's changing public network, not a lookup of a supplied country in the static catalog. It does not probe IPv6 or accept arbitrary lookup addresses. |
| get_nat_troubleshooting_guide | false | Returns a fixed troubleshooting guide and URL with NAT explicitly untested. Card startup returns without any NAT or connectivity test. External navigation requires a separate user click. |
| get_ipv6_statistics | false | Reads the validated local FileStats snapshot; optional input is confined to the ISO country catalog. Card refresh reads the same own-service catalog, with no browser connectivity probe or live third-party fetch. APNIC ingestion occurs outside this tool operation. |
| check_network | true | Opens a card that observes current browser transport and public IPv6-only reachability. |

Open-world classification includes the automatically opened card, not only the
initial pending server result. A fixed source URL is not by itself proof of an
open-world operation. Statistics source links and the NAT test link are not
requests performed by these tool invocations.

Reference checked on 2026-10-28:
[OpenAI correct annotation requirements](https://developers.openai.com/plugins/plugin-guidelines#correct-annotation).
The guideline permits false for a bounded catalog and states that connectivity
alone does not determine classification. The live-network classifications above
are based on the observation subject, not merely the use of HTTP.

Registration requires each intent to specify its openWorldHint explicitly.
The regression check enumerates the exact tool set, verifies the per-tool matrix,
and requires each of the 20 annotation cells to be an own boolean property.
The legacy check_nat call alias remains accepted but is not separately listed.

The app identity, schemas, UI resource URI, policies and hosting are unchanged.
Portal rescan and resubmission are owner actions; public endpoint verification
cannot establish that a previously cached Portal scan has been refreshed.
