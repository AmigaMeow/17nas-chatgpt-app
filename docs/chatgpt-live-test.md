# Real ChatGPT test record

Public origin: https://mcp.17nas.com
MCP endpoint: https://mcp.17nas.com/mcp
Browser-only IPv6 probe: https://ipv6only.17nas.com/api/probe

## Preflight, 2026-10-14

The build and runtime origin both use mcp.17nas.com. TypeScript, build and 14 tests pass. Local MCP returns five tools and text/html;profile=mcp-app resources. Both standard ui.csp and compatibility openai/widgetCSP allow HTTPS connections to mcp.17nas.com and ipv6only.17nas.com. These checks do not prove that ChatGPT permits the requests. The independent probe's DNS, HTTPS and isolation verification are complete. Public HTTPS initialization, tools/list, all five tools/call requests, card resources, policy/flag assets and API CORS preflight were verified at 17:23 UTC. Cloudflare blocks the default Python-urllib user agent with error 1010, while curl succeeds; verify actual ChatGPT connector access before proceeding with iframe tests.

## ChatGPT account test

In an eligible ChatGPT account, enable developer mode under Settings / Apps / Advanced settings (workspace permissions and labels may vary), create a custom app using the MCP endpoint above, and select it in a new conversation. This service has no OAuth login. Do not enter credentials or API keys into the card. Refresh the app's tool definitions after server tool changes.

Official setup: https://developers.openai.com/plugins/deploy/connect-chatgpt
Official reference: https://developers.openai.com/plugins/reference

Test all five requests separately:

| Request | Expected card | Expected behavior |
| --- | --- | --- |
| Check my IPv6 connection | IPv6 connection | Automatic browser probe; no initial button click required |
| Which country is my network in? | Network region | Estimated country attribution; no IP address or ASN displayed |
| How can I check my NAT type? | NAT guidance | Styled external test link; no claimed NAT detection |
| Check my network | Combined check | Protocol connectivity (IPv4/IPv6), HTTP request latency, and estimated country attribution; no IP or ASN |
| Show IPv6 statistics and the global top five | Statistics | APNIC macro statistics, source/date/scope; own samples only when >=300 |

## Sandbox and network evidence

Inspect the iframe's browser Network and Console panels. Record whether the probe request starts automatically, its status and duration, and any CSP/CORS/timeout category. Do not save full HAR files, IP addresses, cookies, request headers or persistent user identifiers. A successful probe must report `ipv6Status: supported` and a transient `connection` with protocol `IPv6`. Do not save the address in test evidence. A failed or blocked request must show unknown/unconfirmed, never a definitive claim that IPv6 is unsupported. Country/API failures must not hide a successful probe.

Compare each result with the probe opened from the same device and network outside ChatGPT. Test an independently working IPv6 Wi-Fi connection, an IPv4-only network, a mobile hotspot and a VPN/proxy if available. DNS64/NAT64 and proxies can make an IPv6 destination reachable without native IPv6 on the device; a positive result establishes reachability through the active browser path. If the sandbox blocks a request that succeeds outside it, treat this as integration failure, not evidence against the user's IPv6.

Keep personal results separate from APNIC country averages. Check that model narration does not claim the tool server's initial unknown status is a completed browser test. The asynchronous widget context update may arrive after the initial model reply.

## Rendering and height

Test actual web conversations at narrow and wide widths, including 320/375/480px card widths when possible. Check country flags, long translations, loading, unknown status and missing statistics. Expand/collapse disclosures 10 times; the host iframe must shrink after collapse without clipping, scroll traps or accumulating blank space. Record actual card and iframe heights, not just local DOM height. Reopen a saved conversation and test re-detection.

Record native mobile and desktop availability before testing. If developer apps are unavailable on a client, mark unavailable; responsive web simulation does not count as a native-client pass.

## Real User Prompt Matrix & Intent Verification Checklist

Use this checklist during live ChatGPT client testing to verify prompt routing and response honesty:

| Category | Example User Prompt | Target Tool / Behavior | Expected Card & Response Standard |
| :--- | :--- | :--- | :--- |
| **1. IPv6 Direct** | "我的网络支持IPv6吗" / "测一下IPv6" / "check my ipv6" | `check_ipv6_connection` | 触发 IPv6 检测卡片。自动执行浏览器探针，成功显示“可连接”，失败显示“尚未确认”并客观说明可能原因，绝不误判“不支持”。 |
| **2. Region Direct** | "我在哪个国家/地区" / "我的网络归属是哪里" | `get_network_region` | 触发网络归属卡片。展示国家国旗与名称，文案明确提示“不展示 IP 地址和 ASN”。 |
| **2b. IP Lookup** | "查一下我的IP" / "我是哪里的IP" | `check_network` (or `get_network_region`) | 触发网络卡片。模型文字与卡片诚实说明：“出于隐私保护，本工具不展示具体 IP 地址和 ASN，当前已确认 IPv4/IPv6 协议连通状态，网络归属为 [国家]”。绝不捏造或下发明文 IP。 |
| **3. NAT Direct** | "我的NAT类型是什么" / "怎么测NAT" | `check_nat` | 触发 NAT 指引卡片。诚实说明卡片内不作伪测试，提供外链按钮引导至 17NAS 原生测试页。 |
| **3b. NAT Indirect** | "我连不上游戏总掉线，是不是NAT问题" / "P2P下载慢是什么原因" / "NAS端口映射连不上" | `check_nat` | 考验意图识别。模型识别出游戏联机掉线/P2P受阻可能与对称型 NAT 或端口转发有关，路由到 `check_nat`，给出排查建议并附带测试入口。 |
| **4. Combined Direct** | "帮我测一下网络" / "网络诊断" / "检查一下网络环境" | `check_network` | 兜底综合卡片。一次性展示协议连通性（IPv4/IPv6）、HTTP 请求耗时及国家归属，底端声明隐私边界。 |
| **5. Stats Direct** | "全球IPv6普及率" / "哪个国家IPv6用得最多" / "中国IPv6情况怎么样" | `get_ipv6_statistics` | 触发统计卡片。展示 APNIC 全球 Top 5 及指定国家普及率；自有样本不足 300 时自动隐藏。 |
| **6. General Intro** | "你能做什么" / "17NAS是什么" / "介绍一下这个工具" | **不调用任何工具卡片** | 纯文字清晰回复 17NAS 的核心功能清单（IPv6 探测、NAT 测试引导、全球普及率查询），引导用户提出具体网络诊断需求，避免卡片信息过载。 |

## Results (real environment only)

| Check | Status | Evidence |
| --- | --- | --- |
| Public MCP connection from ChatGPT | Passed (operator reported) | Operator confirmed “17nas 现已连接” on 2026-10-15 Asia/Taipei after selecting no authentication. Attached screenshots show creation/connection dialogs; a rendered tool card is not yet evidenced. |
| Probe allowed by ChatGPT iframe | Unresolved | Operator screenshot shows combined card with unconfirmed IPv6 and the probeUnknown message. This proves a failure state renders, but does not distinguish timeout, network failure or sandbox blocking. Requires actual iframe network/console evidence. |
| IPv6 and IPv4-only network comparison | Pending | Requires independent user networks |
| Web card rendering / height | Partially verified | Operator screenshot shows the combined card rendered in ChatGPT with country KR and no obvious large trailing blank area. Other four intents, narrow widths and repeated expansion/collapse remain unverified. Model prose still reports country unavailable while the card shows KR; asynchronous result consumption needs verification. |
| Native mobile client | Pending availability | Do not substitute browser emulation |
| Native desktop client | Pending availability | Do not substitute browser emulation |

No GitHub push, directory submission or real ChatGPT pass is claimed by this record.

Local upgrade verification (not a live ChatGPT capture): IPv4/IP lookup routes to `check_network`; explicit conversation locale has precedence; browser connection responses are no-store and excluded from statistics/config/MCP initial results. Probe timeout/network/HTTP failures stay unverified. Retest real iframe CSP, clipboard permissions, final model context, and mobile/desktop layout after a separately agreed deployment. No real ChatGPT console capture has been obtained by this local test.
