# Existing-server deployment

1. Build on Node 22+ with `npm ci && npm run build`. Set `APP_PUBLIC_ORIGIN` to the same confirmed origin at build time and runtime; the widget pins this trusted API origin. The default is local validation only. Create an unprivileged `17nas-app` service user.
2. Create App-only `/var/lib/17nas-chatgpt-app/{stats,geo}` directories. Copy the country database once into the App directory; do not copy website logs or raw measurement records.
3. Run the independent aggregate exporter outside this checkout. Publish atomically to `stats/snapshot.json`, then validate with `npm run export:validate -- /var/lib/17nas-chatgpt-app/stats/snapshot.json`. Schedule hourly after the website's aggregate refresh. Retain no raw records in the App store.
4. Install `deploy/17nas-chatgpt-app.service` and an environment file based on `.env.example` at `/etc/17nas-chatgpt-app.env`. Set APP_TRUST_NGINX=1 only with the supplied proxy configuration. The service listens on loopback; systemd masks website files and logs.
5. The existing app.17nas.com belongs to another project and must not be changed. Route a dedicated, confirmed App hostname through an isolated HTTPS Nginx vhost. Disable access/error logs for it. Strip cookies, forwarding headers and identifiers; send only verified transport metadata and MCP/content headers. Validate Nginx before reload. If the server uses TLS stream routing, add the App SNI route to its independent backend port.
6. Reuse an existing IPv6-only entry point if one is available, serving the isolated `/api/probe` handler with transient address output and no logs. Otherwise an AAAA-only, unproxied hostname on the existing server is an option; The selected probe hostname is `ipv6only.17nas.com`. Verify HTTPS over IPv6 succeeds and IPv4 cannot connect before setting APP_IPV6_PROBE_URL. The current `v6.17nas.com` has both A and AAAA records and does not satisfy this check. Until verified leave the setting blank and show unknown.
7. Check HTTPS health, API, legal pages, MCP initialization/tools/resources, actual service filesystem isolation, 429 and browser automatic probing. Test in real ChatGPT separately; local host emulation is insufficient.

No Cloudflare account permissions, KV, Durable Objects or precise query counters are required. Cloudflare may remain an existing reverse proxy for the main App hostname. The probe must bypass it. This deployment adds no paid subscription; provider budget notifications and receipt by hello@17nas.com are not verified by code.

## Dedicated IPv6 probe address (2026-10-14)

The default outbound and website origin address remains `2605:c000:4030:b::2215:a240`. The already configured spare address `2605:c000:4030:b::92c5:b67` is reserved for the probe. Both addresses are persistent in netplan; no network restart or primary address change was made. A trial additional address failed connectivity and was removed.

DNS verified: `ipv6only.17nas.com` has only AAAA `2605:c000:4030:b::92c5:b67`; A and CNAME lookups are empty. The HTTPS endpoint `https://ipv6only.17nas.com/api/probe` is ready, and the running App environment now uses it as APP_IPV6_PROBE_URL.

`/etc/17nas-probe/firewall.nft` restricts inbound traffic to this destination address to TCP 443 and required ICMPv6 control traffic. All other traffic to it is dropped. The separate `17nas-probe-firewall.service` is active, enabled at boot and supports an idempotent reload without flushing other tables. Reboot persistence was configured but not tested by rebooting production.

Nginx's stream destination-address map directs traffic to the spare address into the dedicated HTTPS backend (127.0.0.1:4447), regardless of SNI. Only `/api/probe` is served; other paths and website Host headers return 404. Access/error logging is disabled. A TLS-ALPN-01 branch uses a PROXY-header stripping relay at 127.0.0.1:4448 to lego's temporary listener at 127.0.0.1:4449. Port 80 remains blocked. Let's Encrypt issuance succeeded; the certificate expires on 2027-01-12. The enabled `17nas-probe-cert.timer` checks renewal daily with a randomized delay, and a successful renewal validates and reloads Nginx. Its initial check exited successfully and skipped renewal because the certificate is fresh.

Verification from a temporary independent network namespace: probe TCP 443 connected and closed at the isolated backend; TCP 22, 80, 3306, 6379, 8790 and 4446 timed out with firewall drop counters increasing. The primary address still accepted SSH and HTTPS; the existing IPv6 test page returned HTTP 200 and the App health endpoint returned 200. The namespace and veth were removed after testing. This checks the host firewall, not public DNS/TLS or provider-level filtering. A separate address on a shared host does not isolate upstream bandwidth or resources from volumetric attacks.

## Public DNS and HTTPS verification (2026-10-14, 17:11 UTC)

Three consecutive IPv6 curl requests using normal public DNS and certificate verification returned HTTP 200 with `{"ipv6Status":"supported"}` (TLS verification result 0). IPv4 curl failed (exit 7, HTTP 000), consistent with the absence of an A record. One earlier IPv6 request encountered a transient DNS resolution failure before these three successful checks. HTTPS CORS preflight returned 204. Requests for `/ipv6-test.php` and requests with `Host: 17nas.com` returned 404 on the probe address. The existing website's IPv6 test page still returned 200.

The HTTPS requests were made from this server with its primary IPv6 bound as the source; successful certificate issuance also required the CA's external TLS-ALPN validation. These checks do not constitute a real ChatGPT iframe or an independent external browser connectivity test. The App configuration endpoint now returns the verified probe URL. The public App hostname is now confirmed as `mcp.17nas.com`; `app.17nas.com` is untouched.

## Connection-display upgrade — deployed 2026-10-16

The owner authorized deployment. Code `d3b374854027ab6f3d99c139934f9204ab273c88` is deployed at `/var/www/17nas-chatgpt-app`, and health reports0.2.1. Old dist/source evidence is backed up at `/var/backups/17nas-chatgpt-app/20261015T170105Z-pre-0.2.1`. The runtime reads GeoLite2-City only for country-level estimation; no ASN database is loaded. Environment, snapshots, GeoIP data and Nginx configuration were preserved. Real ChatGPT exercised combined measurement, explicit result sharing, statistics and NAT guidance; independent/native-client comparisons remain incomplete. Earlier probe checks above describe their dated deployed version. See docs/submission-demo-fixes.md and docs/submission.md for the current evidence and limits.

## NAT guide naming correction — 2026-10-16

Under the existing deployment authorization, `7564cfafe0cca3b2a18c85f17bbede232539825b` replaces `check_nat` in the advertised tools with `get_nat_troubleshooting_guide`. Cached legacy calls are normalized before dispatch. The prior build/source was saved to `/var/backups/17nas-chatgpt-app/20261016T002412Z-pre-nat-guide-name`. The first loopback MCP verification received 429 because no trusted proxy source header was present, triggering a full source/dist rollback. Redeployment then passed verification over the existing public HTTPS gateway: canonical listing, canonical/legacy guide calls, service active and health 0.2.1. No environment, Nginx, database, snapshot or widget changes were made.

The completed Portal rescan showed Domain verified, the new NAT guide action and “No findings in the latest MCP scan”. The saved 0.2.0 draft remains unchanged and unsubmitted.
