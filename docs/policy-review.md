# Policy wording for owner review

Prepared 2026-10-16. This is a proposed revision, not a deployed policy or a legal attestation. Current public privacy and terms pages remain marked as drafts. The owner must review the factual statements and resolve the decisions below before the draft labels are removed.

## Proposed privacy text

Operator: jiahui zhang, trading as 17NAS. Contact: hello@17nas.com. Confirm the exact operator name matches the intended publishing identity before deployment.

IPv6 Checker & Stats checks browser connection reachability, estimates country-level network attribution and displays aggregate IPv6 statistics. Network requests carry a source address. The application processes it transiently for country attribution, observed protocol and abuse prevention. The application does not return raw IP addresses, ASNs, ISP names or cities in its results, and does not persist individual connection measurements.

The application's rate limiter keeps minute-scoped HMAC entries only in process memory. Its keys rotate and entries expire at the UTC minute boundary. Application code does not create user accounts, query ordinals or persistent user identifiers, and does not set cookies, write LocalStorage or persist widget measurement state.

The browser card displays country, observed protocols, HTTP request duration and probe status. Completed measurements may be provided to ChatGPT as app context or shared using Explain results in chat. OpenAI processes conversations according to its own policies and user settings; the app's storage practices do not control OpenAI conversation retention. HTTP duration is not ping latency. VPNs or proxies can affect country attribution, and a failed IPv6 probe remains unverified.

The application reads country-level aggregates from a separate exporter. Own aggregate statistics use a 30-day source window and are hidden below 300 samples. APNIC figures are separately labeled, dated population statistics. The app caches aggregate snapshots for one hour and uses last-good data for at most24hours. These are aggregate records, not retained individual browser measurements.

The service uses Cloudflare and a hosting provider to deliver requests. Those providers handle source addresses and other connection/security information under their own policies and settings. Cloudflare can use security-related cookies. The statement that the application does not store raw addresses does not promise that every infrastructure provider has zero logs or zero retention. OpenAI's and the providers' records are outside the application's own measurement store.

The external NAT test opens on a separate website. Its processing and results are separate from this inline app. The app does not itself determine NAT type, CGNAT, packet loss or a disconnection cause.

If you contact support, your message and contact information are processed to answer your request. Do not send IP addresses, ASNs, precise location, credentials or full network captures. The operator must confirm support-message retention and deletion practices before this paragraph is finalized.

For privacy questions and requests concerning records held by the operator, contact hello@17nas.com. The operator can explain what it holds and how a request can be handled without asking for unnecessary information. Requests concerning OpenAI conversations or infrastructure-provider records must also follow the relevant provider's processes. No sale of app data or advertising use is part of the stated service; the owner must confirm this statement before publication.

## Proposed terms text

Operator: jiahui zhang / 17NAS. Contact: hello@17nas.com. Effective date is set when the operator accepts the final text.

IPv6 Checker & Stats and its linked NAT test are free and offer no purchase or subscription flow. The app checks browser connectivity, displays country attribution and HTTP request duration, and provides dated IPv6 population statistics. The NAT card opens a separate external test guide.

Results depend on network conditions, browser restrictions, VPNs, proxies, geolocation and provider availability. A successful probe establishes reachability to that probe through the active browser path. A failed probe is unverified, not proof that IPv6 is unavailable. HTTP request duration is not ping. The app does not diagnose a game disconnection cause or change router settings.

APNIC and eligible 17NAS aggregates are separate datasets and are labeled with source dates and scope. Own samples below300 are hidden. Statistics are estimates for reference, not measurements of an individual user's connection.

Use the service responsibly. Do not bypass rate limits, scan arbitrary targets or attempt unauthorized access. The service may restrict abusive requests. Availability, uninterrupted operation and perfect accuracy are not guaranteed. Mandatory rights under applicable law are not waived by these terms.

English and Simplified/Traditional Chinese are supported. Other listed locales currently use English fallback while translation review is pending. Report problems or ask questions at hello@17nas.com. The owner must confirm the support address works before publication.

## Owner decisions still required

1. Confirm operator/publishing name and that hello@17nas.com receives support and privacy requests.
2. Confirm support-message retention and deletion handling, plus any additional collection/analytics/commerce not described above. No extra practices should be silently omitted.
3. Review provider security logs, backup settings and processor terms; retain the provider limitation rather than claiming universal zero retention.
4. Review and accept final policy text. The authorized developer personally completes the Portal's current legal/policy attestations; accepting a code change is not an attestation.

## Primary references checked

- https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/
- https://openai.com/policies/privacy-policy/
- https://developers.openai.com/plugins/deploy/submission
