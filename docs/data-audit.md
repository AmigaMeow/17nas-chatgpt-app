# Existing data audit

Audit date: 2026-10-14 UTC.

## IP service and MCP

`https://ip.17nas.com/?format=json` returned HTTP 200. Ten keys: `ip`, `protocol`, `country` (zh/en/code), `asn`, `location` (zh/en), `priority` (zh/en), `region`, `city`, `datacenter`, `timezone`. This service is used only in the separate local MCP package, never in the App.

The original AmigaMeow/17nas-mcp entry point contained invalid JavaScript and three tools. The release candidate repairs the entry point and advertises seven tools; this does not imply npm or Registry publication.

## Statistics

Inspection of the site's implementation and existing snapshot establishes that own samples are refreshed hourly with a rolling 30-day window, while APNIC aggregate data is synchronized weekly. Snapshot example: generated 2026-10-14T13:25:01Z; APNIC data date 2026-10-11, fetched 2026-10-13T03:50:01Z. Rates are IPv6-capable rates from APNIC Labs. The production schedules were not changed.

Own rows contain sample count n, successful samples k, and rate. The independent export selects only country totals and success counts. It suppresses own rates for n < 300. APNIC QM/QO/QP aggregate region codes are excluded; ISO country/territory codes, including HK/TW, remain. Global ranks use competition ranking over countries and territories present in the snapshot, not an assertion that every country worldwide is covered.

The App reads only its dedicated exported local snapshot. It never crawls the page or calls the internal website statistics API.

## Browser tests

Existing NAT detection uses browser STUN; the first MCP release returns the browser page link only. Existing IPv6 website hosts cannot be reused as isolated App probes: the inspected v6 host was dual-stack and routed through the website. Dedicated probe provisioning is still required.

## Link verification

During the audit, the existing IP JSON API, 17nas.com statistics/NAT/IPv6 pages, public MCP repository and npm metadata responded successfully. This is point-in-time evidence. app.17nas.com is not a verified deployment of this new App. Directory access was challenged, so competitor research remains incomplete.
