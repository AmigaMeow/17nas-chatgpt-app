# Directory submission draft

Name: **IPv6 Checker & Stats** (Chinese: **IPv6 检测与统计**).

Short description: Check IPv6 support and explore country statistics, APNIC Labs global rankings.

Long description: Run an IPv6 test in a simple inline card. View APNIC Labs global IPv6 rankings alongside separately labeled 17NAS regional samples. Browser protocol connectivity and HTTP duration are displayed without exposing IP addresses or ASNs; NAT testing opens the separate 17NAS page.

Keywords (关键词): IPv6, IPv6 test, IPv6 checker, network connectivity, network diagnostics, country rankings, network statistics, NAT test (IPv6检测, 网络诊断, 网络连通性, 国家统计, APNIC排行, NAT测试).

Desired category: Developer Tools, or Productivity if Developer Tools is not an available option. Verify the categories in the live form.

Icon: public/icon.svg (prepare required raster sizes after checking the actual submission form). Privacy and terms drafts: /privacy.html and /terms.html. Contact: hello@17nas.com; operator: jiahui zhang. The policy pages are served publicly; their draft operator-review status is visible. Confirm final policy content and provider logging before submission.

## Conversation Starters (开场白预设提示词)

在 OpenAI GPT Store / ChatGPT App 提审与配置后台直接填写的 4 个开场白按钮：

### 简体中文 (Chinese)
1. **🎮 排查游戏联机与 NAT 类型**
   - 触发提示词: 帮我排查游戏联机掉线问题，并说明如何测试 NAT 限制。
   - 命中工具: `check_nat`
2. **🌐 检测网络与 IPv6 连接**
   - 触发提示词: 测一下我的网络连接和 IPv6 支持情况。
   - 命中工具: `check_network` / `check_ipv6_connection`
3. **📊 查看全球 IPv6 普及率排行**
   - 触发提示词: 查看全球 IPv6 普及率与 APNIC 国家排行榜。
   - 命中工具: `get_ipv6_statistics`
4. **🔍 检测网络归属国家**
   - 触发提示词: 测一下我当前网络连接的归属国家。
   - 命中工具: `get_network_region`

### 英文 (English)
1. **🎮 Troubleshoot game matchmaking & NAT type**
   - Prompt: Show me how to check whether NAT restrictions could be involved in multiplayer game disconnections.
   - Tool target: `check_nat`
2. **🌐 Check network & IPv6 support**
   - Prompt: Check my current network connection and IPv6 reachability.
   - Tool target: `check_network` / `check_ipv6_connection`
3. **📊 View global IPv6 rankings**
   - Prompt: Show global IPv6 adoption statistics and APNIC country rankings.
   - Tool target: `get_ipv6_statistics`
4. **🔍 Check network country attribution**
   - Prompt: Check the country attribution for my current network connection.
   - Tool target: `get_network_region`

同时，MCP Server 已通过标准 `server.prompt()` 注册对应 Prompt 模板（`prompts/list` 与 `prompts/get`），客户端可自动发现。

## Competitor research status

Requested searches: IPv6, network test, connectivity check. Automated directory access encountered an access challenge. No authoritative competitor names, ratings, duplicate-name result or directory availability have been recorded. Complete these searches in the authenticated directory, record the observation date and links, and distinguish unrelated GPTs from directory Apps. Never invent ratings or claim name uniqueness from an unsuccessful search.

## Review evidence still needed

Real ChatGPT inline card; language behavior; successful IPv6 probe; missing-country and insufficient-sample states; cache fallback and friendly error; 429; independent storage/data export; owner-reviewed policies; source/date/ranking scope visible. Submit only after deployment and launch gates are resolved. No review URL exists yet.
