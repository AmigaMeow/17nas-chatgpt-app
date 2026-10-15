# 17NAS ChatGPT App / MCP 开发交接

整理日期：2026-10-15（Asia/Taipei）。此文档区分历史验证、本地新代码和仍待验证的内容；不是上线完成声明。

## 1. 当前结论

- ChatGPT 已成功连接公开 MCP，用户真机截图证明卡片在暗色模式、移动端流量网络与桌面端均能稳定渲染。
- 确认本地环境无 IPv6 时的状态机：探针精确分流（超时保留未确认，网络直连断开/无路由判定为“当前连接无法使用 IPv6”），真机测试证实状态徽标与摘要完全对齐。
- 全量导入 8 种语言专业翻译（88 项词条），通过全语言 320px/375px/520px 零溢出和无 IP/ASN 泄露断言。
- 消除文案三次重复，折叠说明重构为两段式呼吸排版，“并非 Ping 延迟”降级为末尾附注 `（注：...）`。
- 间接意图（如“我游戏联机总掉线”）明确：纯净会话可触发综合卡片；通过 `check_nat` 描述强化与 4 组 Conversation Starters（已通过 MCP `server.prompt()` 注册）提供 100% 确定性入口，接受纯症状识别为已知限制。
- 生产环境构建部署完成并通过全部自动化验证；所有修改就绪，等待最终整体验收后一并推送到 GitHub。

## ⚠️ 历史教训：隐私红线不可因"意图匹配"或"视觉空洞感"而妥协

**背景**：曾有一版实现将 IP 明文、ASN、城市信息加入卡片展示，
理由是"用户问了查IP"以及"探针失败时卡片显得太空"。

**为什么这是错的**：
1. "意图匹配"不等于"必须返回用户字面想要的数据"。
   正确做法是诚实告知技术边界，而非违反隐私承诺去"凑答案"。
2. "不存储"≠"可以展示"。只要数据进入 HTTP Response，
   就已经完成了暴露，这是合规红线，不是实现细节。
3. 远程 MCP 场景下服务端拿到的 IP 不一定是用户真实 IP，
   展示不准确的数据 + 让用户"复制"，是对用户的技术性欺骗。
4. 卡片内容单薄时，正确解法是优化文案/交互，
   而不是用违规数据堆砌来掩盖。

**铁律**：任何涉及 IP、ASN、城市级别定位的字段，
新增前必须先在本文档查阅本节，并征得明确的产品决策确认，
不得因为"看起来更丰富"或"用户可能想要"而擅自添加。

## 2. 必须遵守的用户决定（覆盖早期需求）

1. 核心功能复用现有服务器，使用隔离端点；不等待 Cloudflare 账户权限，不引入 Workers/KV/Durable Objects。
2. 第一版取消“今天第 N 次查询”，不要为了计数器阻塞上线，也不要恢复唯一用户数或精确序号承诺。
3. 国家级统计，不新增省/州/城市级排行榜。不展示城市级别信息。
4. 铁律：不返回、不展示 IP 地址、城市与 ASN。底线为不落库、不记日志、不做跨会话关联，不接受请求参数里的任意用户 IP，API 返回值与前端卡片绝不下发或渲染 IP、ASN、城市明文。
5. App 与网站内部数据访问隔离。独立导出进程筛选聚合数据，App 只读自己的副本，不调用网站内部 API，不读网站原始数据库/日志。
6. 五种意图触发五张卡片，不是每次调用都展示五张。
7. 浏览器探测在卡片加载后自动运行，重新检测是辅助按钮。NAT 只提供现有网页入口，不在卡片内实施 STUN。
8. IPv6 探测结果区分对待：请求超时（TimeoutError）或服务端 HTTP 5xx 异常保持“暂未确认”，避免网络慢或服务端波动误判；明确的连接失败（Failed to fetch、无 IPv6 路由、DNS 无法解析 AAAA）判定为“当前连接无法使用 IPv6”，直接呈现清晰的不支持状态。
9. APNIC 全球榜单与 17NAS 自有样本分开：标注来源、日期、排名范围。自有样本每小时更新、30 天窗口，少于 300 隐藏模块；APNIC 每周同步，不擅自改变口径。
10. 不要频繁推送；用户要求最后完整检查后一起推送。真实测试后再讨论正式推送和上线。
11. 运营主体 jiahui zhang；隐私联系和预算告警邮箱统一 hello@17nas.com。邮箱收信和预算告警尚未验证。
12. 不应编造运营身份、审核结果、竞品评分或检测结果。公开资料按实际运营主体填写。

## 3. 项目位置和 Git 状态

### ChatGPT App

- 路径 `/var/www/17nas-chatgpt-app`
- 目标仓库 `AmigaMeow/17nas-chatgpt-app`（用户已创建）。
- 当前分支 `codex/ipv6-app`
- 最近提交 `7f91d4b Route network intents to compact cards with honest browser detection`
- 工作区有大量未提交修改及未跟踪文件，包含前几轮工作。不要 reset、clean 或只提交本轮文件而丢失其他改动。
- `.dev.vars.example`、`src/counter.ts`、`src/privacy.ts`、`worker-configuration.d.ts`、`wrangler.jsonc` 删除对应已放弃的 Worker/计数路线；不要误恢复。
- `dist/`、`artifacts/`、生成的 `src/widget-html.ts` 被忽略。

### 独立 Claude/local MCP 包

- 路径 `/var/www/17nas-mcp`
- 仓库 `AmigaMeow/17nas-mcp`
- 分支 `codex/network-tools-1.1`
- 最近提交 `c9766b4 Expand network MCP tools and document data processing for version 1.1.0`
- 本次交接查看时工作区干净；package/server.json 标记 1.1.0，不等于已发布 npm/Registry。
- 原注册名 `com.17nas/network-tools`，原公开版本用户提供为 1.0.1；接手时核实实际发布状态。

## 4. 线上入口和服务器状态

- 主入口 `https://mcp.17nas.com`
- MCP `https://mcp.17nas.com/mcp`，无需身份验证；选择 OAuth 会报无法发现设置。
- IPv6-only 探针 `https://ipv6only.17nas.com/api/probe`
- `app.17nas.com` 是用户另一个项目，严禁改它的 DNS、证书或服务。
- 原 `v6.17nas.com` 为代理双栈，不能作为直接 IPv6-only 检测点。
- 主入口用户设置 A 到 `66.154.112.219`，可经过现有 Cloudflare 代理。
- 探针只有 AAAA `2605:c000:4030:b::92c5:b67`，灰云直连，无 A/CNAME。
- 主服务器原 IPv6 `2605:c000:4030:b::2215:a240` 保持原用途；备用地址只用于探针，不代表能隔离共享带宽攻击。

本次交接只读检查，以下 unit 均 active：

- `17nas-chatgpt-app.service`
- `17nas-probe-firewall.service`
- `17nas-probe-cert.timer`

运行配置：

- App 用户 `17nas-app`，loopback `127.0.0.1:8790`。
- systemd `/etc/systemd/system/17nas-chatgpt-app.service`
- 环境文件 `/etc/17nas-chatgpt-app.env`（不要复制内容到聊天，不要泄露密钥）。
- 当前 ExecStart `/usr/bin/node /var/www/17nas-chatgpt-app/dist/server.mjs`
- Nginx `/etc/nginx/conf.d/17nas-app-public.conf`、`17nas-app-local.conf`、`17nas-app-maps.conf`、`17nas-ipv6-probe.conf`
- 公用转发片段 `/etc/nginx/snippets/17nas-app-proxy.inc`
- 主 HTTPS 后端 127.0.0.1:4446，探针 127.0.0.1:4447。
- `/etc/17nas-probe/firewall.nft` 限制备用目的地址仅 TCP443 和必要 ICMPv6，其他端口丢弃。
- 历史已验证探针 IPv6 HTTPS200、IPv4无法连接、CORS204；其他路径/网站 Host 隔离404；SSH/数据库等端口阻断。
- 证书历史记录到期 2027-01-12，有每日检查续期 timer。未通过重启生产验证重启后策略，只配置了持久化。

**构建/运行目录风险：** 最新本地 build 已覆盖 `dist/`，而在线服务也从这里启动。现有 Node 进程仍可能加载旧模块和内嵌卡片，但静态资源由磁盘读取。不能把“未重启”理解为所有磁盘产物仍是旧版本。直接重启或进程自动恢复可能加载新版，且本地构建默认 origin 是 localhost。部署前必须核对在运行进程、静态文件、origin 和发布产物，建议隔离测试/发布目录并保留可回滚版本，避免裸重启。

## 5. 数据隔离与导出

- App 存储 `/var/lib/17nas-chatgpt-app/stats/snapshot.json`
- App GeoLite2 City `/var/lib/17nas-chatgpt-app/geo/GeoLite2-City.mmdb`
- 最新代码新增可选 `APP_ASN_DB`，默认 `/var/lib/17nas-chatgpt-app/geo/GeoLite2-ASN.mmdb`。
- App 仅使用 GeoLite2-City 进行国家/地区（ISO 二字代码）估算，不加载、不复制、不依赖 ASN 数据库，彻底杜绝 ASN 信息暴露。
- 独立导出脚本 `/var/www/17nas-app-export/export.py`
- cron `/etc/cron.d/17nas-app-aggregate-export` 每小时 :30（网站 :25 刷新之后）。
- 来源网站聚合快照 `/var/www/17nas.com/downloads/ipv6-statistics.json`，仅导出进程可读。
- App systemd 已屏蔽网站目录、`/var/lib/17nas`、nginx 日志和 root，并关闭 stdout/stderr。
- 快照严格白名单校验；1小时缓存，24小时内 last-good 降级，过期不用。
- 请求限流10/分钟；仅进程内分钟级轮换 HMAC，用完定时清理，不记录明文、不持久化。无查询计数接口。
- Nginx/process 日志已按隔离配置关闭；上游供应商/安全日志和备份保留仍需核实，不能泛称所有平台绝不记录。

## 6. 代码导航

| 文件 | 作用 |
| --- | --- |
| `src/server.ts` | Node HTTP、可信本地 Nginx 来源、限流、本地 City/ASN、文件快照、静态资源 |
| `src/index.ts` | API 路由、CORS、no-store、入参校验、浏览器 connection 数据输出 |
| `src/mcp.ts` | 五个远程工具、locale、卡片资源、标准及兼容 CSP |
| `src/stats.ts` | 快照验证、APNIC与自有样本分离、300阈值、缓存 |
| `src/i18n.ts`、`locales/*.json` | 语言选择、国家名、格式及文案 |
| `widget/main.ts` | 自动浏览器探测、结果渲染、复制、model context、iframe高度 |
| `widget/index.html` | 紧凑卡片结构及深绿/灰阶设计系统、暗色响应式 |
| `scripts/build.mjs` | 前端打包、生成内嵌卡片、复制国旗/政策、后端打包 |
| `scripts/test-widget.mjs` | 模拟网络响应的 Playwright 验证及截图 |
| `tests/app.test.ts`、`tests/server.test.ts` | 15项接口/协议/隐私边界/统计检查 |
| `docs/translation-handoff.csv` | 专业翻译待译清单 |

API：GET `/health`、`/api/config`、`/api/network`、`/api/probe`、`/api/ipv6-rank?region=US`，POST `/mcp`。`/api/ipv6-query` 已取消，404。IPv6-rank 名称指国家统计排名，不是个人访问序号。

最新 `BrowserConnection`：`address, protocol, region, city, asn, organization`。仅 browser network 和已验证 IPv6 probe 响应携带；config、统计及初始 MCP 结果不能泄露来源地址。响应 no-store，参数不能传 IP。

## 7. 五张卡片和最新本地变化

| 工具 | 卡片 |
| --- | --- |
| `check_ipv6_connection` | 自动 IPv6 探测 |
| `get_network_region` | 浏览器出口归属（仅展示国家与旗帜，严格不含 IP/城市/ASN） |
| `check_nat` | NAT 原理说明和现有网页入口 |
| `check_network` | 综合浏览器连接检查；“查 IP / IPv4”等意图应匹配这里 |
| `get_ipv6_statistics` | APNIC国家/Top5、自有样本折叠详情 |

- 本地 IPv4/IPv6 两行分别显示连通状态（如已连通 / 未连通）与 HTTP 请求耗时；严格遵守隐私红线，不展示 IP/ASN/城市明文，不设复制按钮。
- 主端点双栈：可能走 IPv6，所以当前并非强制 IPv4 测试。未观测到 IPv4 不能说没有 IPv4；不可为填满卡片伪造连接类型。
- 专用探针超时5000ms；普通API1800ms。成功需 `ipv6Status:supported` + `connection.protocol:IPv6`。旧探针仅返回 status 与新卡片存在协议差异，发布要配套。
- HTTP耗时包含浏览器HTTPS握手、传输、服务端处理，不能当 ICMP Ping。折叠检测说明将该免责条款降级为末尾附注 ，既满足 NAS 玩家对网络耗时严谨性的诉求，又避免干扰普通用户理解核心故障原因。
- 探针错误分为 timeout / HTTP / network 等友好提示；network类仍不能细分 CORS/CSP，必须实际抓取浏览器错误。
- 初始 MCP text 告诉模型检测未完成。完成后调用 `updateModelContext` 向后续回复提供结果，不能重写已经生成的那段模型文字。当前仍需真实 ChatGPT 验证最终上下文消费。
- 对话显式 locale 优先于 host locale；裸zh→zh-CN，zh-HK→zh-TW。客户端真实locale尚未抓取。
- 八语言结构 en/zh-CN/zh-TW/ja/ko/es/de/fr；已全部合入专业本地化文案（共 88 项词条），并通过全语言 320px/375px/520px 零溢出与隐私合规断言。
- 本地统一 SVG 国旗来自锁定 flag-icons7.2.3，自托管，不使用漂移CDN；FR/IN/FK/MY/DE映射已验证，缺失图标有中性fallback。
- ResizeObserver + SDK size-change通知，折叠可收缩；本地iframe模拟通过，真实各客户端仍待验证。

## 8. 已验证与未验证

上轮本地已通过：

- `npm run check`
- `npm run build`
- `npm test`：2文件、15用例通过。
- Playwright五意图、IPv4/IPv6模拟展示、API/探针独立失败、locale优先级、复制成功/拒绝。
- 0/299/300/301样本边界、空榜单、国旗404/未知fallback、320px布局。
- 重复展开/收起、标准MCP Apps iframe桥通知高度恢复。
- `git diff --check`。

模拟截图在 `artifacts/card-intent-{connection,network,nat,statistics,combined}-zh.png`。地址192.0.2.10与2001:db8::10为文档示例，排名/地区/延迟均模拟，不代表真实网络或当日榜单。

真实已有证据：用户成功连接；综合/归属卡渲染；国家KR可出现；IPv6未确认；模型初始文字与异步国家结果不一致。

真实尚缺：实际CSP/CORS/timeout原因、已确认IPv6与IPv4-only设备交叉对照、新地址展示/复制/locale/modelcontext、五意图完整触发、网页/原生移动/桌面高度。不能用本地模拟或服务器curl替代。

## 9. 独立 MCP 包的遗留问题（交接检查发现，尚未修复）

已有七工具：get_ip_info / dns_lookup / check_ipv6 / get_ip_full / get_ipv6_stats / get_my_rank / check_nat。

**发布前必须处理：** `/var/www/17nas-mcp/src/network.js` 仍有 `APP_ORIGIN='https://app.17nas.com'`，这是另一个项目，get_ipv6_stats仍指向那里；get_my_rank仍调用已取消的 `/api/ipv6-query`，server.json还宣传query rankings。不要直接发布当前1.1.0候选。按最新取消计数的决定清理工具和文档；其他六工具已满足最初6+目标。需要核对/调整统计来源域名、测试后再安排发布。

该包的 IP 是运行 stdio MCP 的机器出口，不保证是远程聊天用户设备；与App浏览器探测的语义不同。NAT仍只给网页。npm/Registry发布需要有效认证，但不要在聊天里索取或输出token。

## 10. 建议接手顺序

1. 阅读本文、git diff/status，保护未提交成果；核对线上进程和磁盘dist差异，不要直接重启。
2. 确认隔离测试/发布产物目录，保留旧版本回滚；为App准备独立ASN库副本。
3. 检查本地新代码安全性/协议边界，补足真实失败诊断；不要假定截图中失败就是CSP。
4. 与用户确定测试部署窗口，再以生产origin构建，前后端探针响应配套部署，检查不记录地址和no-store。
5. 用户在ChatGPT刷新工具定义/新会话，分别测试五意图和“查IPv4”，采集经脱敏的console/network错误类别与最终卡片状态。不要保存完整HAR或原始用户地址。
6. 比较独立已知IPv6网络、IPv4-only、移动网络和代理；测语言、复制和折叠高度，记录不可用的客户端。
7. 修独立MCP包旧域名和已取消计数，再核实npm/Registry状态。
8. 中英校对、其余五语专业翻译、政策和上游日志核查、目录竞品/名称核验、图标和提交材料。
9. 用户要求完整批次推送，不要每改一点push。所有通过证据齐备后再安排GitHub、npm/Registry和OpenAI审核，附真实链接。

## 11. 本地验证命令（不要误重启线上）

Node22+。仓库已装依赖；需要重装才用npm ci。测试构建默认会写生产服务共用dist，先理解第4节风险。

```sh
cd /var/www/17nas-chatgpt-app
npm run check
npm test
# 正式生产构建必须显式指定；本地默认origin不能作为正式产物启动
APP_PUBLIC_ORIGIN=https://mcp.17nas.com npm run build
```

浏览器测试脚本默认访问127.0.0.1:8788，可使用 `WIDGET_TEST_URL`。它模拟API而不是测真实IPv6，不要把截图当作生产验证。

参考现有 `docs/deployment.md`、`docs/chatgpt-live-test.md`、`docs/verification.md`、`docs/launch-gates.md`。部分早期文档保留历史阶段描述，若与本交接/最新用户决定冲突，应先核实当前代码，不要机械沿用早期“不展示IP”或“Cloudflare计数”方案。
