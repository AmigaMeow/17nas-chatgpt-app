# 17NAS ChatGPT App / MCP 完整工程移交文档（供接收 AI 专用）

**整理时间**：2026-10-15  
**当前状态**：生产环境已部署就绪，单元与真机测试 100% 通过，已推送 GitHub 并完成 OpenAI 域名认证配置，处于提审发布阶段。

---

## 一、项目基础信息与代码仓库

| 配置项 | 详细信息 |
| :--- | :--- |
| **项目名称** | 17NAS IPv6 Checker & Stats (`ipv6-checker-stats`) |
| **项目定位** | 专为 ChatGPT 打造的隐私优先网络检测 MCP 插件，具备端侧真实协议连通性探测与 APNIC 全球统计数据展示。 |
| **公网接入域名** | `https://mcp.17nas.com` (前端静态资产、API、MCP 服务端) |
| **专用 IPv6 探针** | `https://ipv6only.17nas.com/api/probe` (纯 IPv6 探测源) |
| **GitHub 仓库** | `https://github.com/AmigaMeow/17nas-chatgpt-app` (主分支: `main`，开发分支: `codex/ipv6-app`) |
| **Git 认证主体** | `AmigaMeow <240840432+AmigaMeow@users.noreply.github.com>`<br>⚠️ **注意**：本地保留 `DragonKingIO` 凭证，**严禁删除 DragonKingIO**，向 GitHub 推送时使用 `AmigaMeow` 身份。 |

---

## 二、服务器与本地连接信息

### 1. 远程服务器登录
- **SSH 别名**：`cloudcone-yinian`
- **服务器真实 IP**：`66.154.112.219`
- **操作系统**：Ubuntu 22.04 LTS
- **连接命令**（本地已配置好 SSH Key）：
  ```bash
  ssh cloudcone-yinian
  ```
- **远程工程根目录**：`/var/www/17nas-chatgpt-app`

### 2. 本地开发环境
- 本地路径（用户 Mac）：`/Users/jiahui`
- 本地已配置 `gh` CLI，当前活跃认证账户为 `AmigaMeow`（具备 repo 权限）。

---

## 三、系统架构与运行模式

整个系统采用 **极简、高内聚、无外部重依赖** 的 Node.js 原生架构：

### 1. 前端卡片 (MCP UI Widget)
- **源码文件**：
  - `widget/index.html`：卡片 HTML 模板与内联响应式 CSS。
  - `widget/main.ts`：前端业务逻辑、@modelcontextprotocol/ext-apps 通信、端侧并行探针。
- **构建机制** (`scripts/build.mjs`)：
  - 由 esbuild 编译混淆为单文件内联 JS，并内嵌到 `dist/widget.html`。
  - 同时导出字符串常量至 `src/widget-html.ts`，供后端 MCP 注册为资源直接交付给 ChatGPT。
  - **核心机制**：前端直接在用户浏览器发起双并行探测：
    - `fetch("https://mcp.17nas.com/api/network")` -> 测算 IPv4/IPv6 协议栈连通性与实际往返 HTTP 耗时 (ms)。
    - `fetch("https://ipv6only.17nas.com/api/probe")` -> 严格测算 IPv6 路由可达性。
  - **当前活动 UI 资源 URI**：`ui://17nas/ipv6-card-v2.html`（兼容旧 URI `ui://17nas/ipv6-card.html`）。

### 2. 后端服务 (Node.js & MCP Server)
- **源码文件**：
  - `src/server.ts`：生产 HTTP 监听服务、速率限制、静态文件分发、国家归属解析。
  - `src/mcp.ts`：MCP 协议入口，注册 5 个工具、Prompts（开场白）与卡片资源。
  - `src/stats.ts`：APNIC 与 17NAS 本地聚合统计数据读取。
- **服务监听**：本地监听 `127.0.0.1:8790`（通过 Nginx 对外透传）。
- **环境变量文件**：`/etc/17nas-chatgpt-app.env`
- **Systemd 服务**：`17nas-chatgpt-app.service`
  - 启动用户：`17nas-app`
  - 日志输出：系统 `journald`（实时无敏感数据脱敏日志）。

### 3. 反向代理与边缘网关 (Nginx & Cloudflare)
- **网关**：前置 Cloudflare CDN（代理模式）。
- **Nginx 配置文件**：`/etc/nginx/conf.d/17nas-app-public.conf`
- **代理配置**：`/etc/nginx/snippets/17nas-app-proxy.inc`
- **域名验证端点**：
  - 路径：`/.well-known/openai-apps-challenge`
  - 响应：返回纯文本 Token `mU1t8DneY9m-bDWgAt2RgxRD20lqQKvBgMmF2NLeqkk`（由 Nginx 和 Node.js 双重保障响应）。

---

## 四、核心业务铁律与隐私红线

任何后续接收开发的 AI 必须严格遵守以下准则：

1. **绝对禁止记录、展示任何明文 IP 与 ASN**：
   - 严禁在服务端日志中打印用户真实 IP。
   - 严禁在卡片 UI 或回复中展示用户的公网 IP、ASN 或精确城市信息。
   - 仅允许展示：协议连通状态（IPv4/IPv6）、HTTP 请求耗时 (ms)、国家级归属（如“南韩 🇰🇷”）。
2. **状态机自洽判定原则**：
   - 当基础服务器连接失败（如网络超时）时，卡片必须显示“未确认”（unknown），绝对不可误判为“无法使用 IPv6”。
   - 仅在基础连接已确认连通（IPv4 OK），而 IPv6 探针确证抛出 TypeError / 无路由异常时，才下达确定性结论“目前连线无法使用 IPv6”。
3. **客户端会话级缓存防坑指南**：
   - ChatGPT 移动端对同一 Resource URI 会强制缓存。若修改了前端 UI 且希望真机立刻生效，需更新资源 URI（如 `v3`）或提醒用户在 ChatGPT 设置中点击 Refresh / 重新拉取定义。

---

## 五、常用维护与调试指令

所有命令在远程服务器 `/var/www/17nas-chatgpt-app` 路径下执行：

```bash
# 1. 编译构建（自动将前端压入后端并编译 server.mjs）
npm run build

# 2. 运行自动化测试套件（16 项 Vitest 单元测试）
npm test

# 3. 运行 Playwright 浏览器端到端模拟测试
WIDGET_TEST_URL=http://127.0.0.1:8790/widget.html node scripts/test-widget.mjs

# 4. 重启生产服务并查看运行状态
sudo systemctl restart 17nas-chatgpt-app.service
sudo systemctl status 17nas-chatgpt-app.service

# 5. 查看实时脱敏业务与网络请求日志
journalctl -u 17nas-chatgpt-app.service -n 50 --no-pager -f

# 6. 本地公网接口连通性测试
curl -i -s "https://mcp.17nas.com/api/network?locale=zh-CN"
curl -i -s "https://mcp.17nas.com/.well-known/openai-apps-challenge"
```

---

## 六、提审资料包与交付物状态

- **提审资料草稿**：`docs/submission.md`（包含中英文名称、描述、4 组开场白、分类）。
- **提审离线插件包**：已按规范打包为 `/Volumes/Lexar256/Chrome_ Downloads/ipv6-checker-stats-0.2.0.zip`（内含修正后的 `plugin.json`、`.mcp.json` 与 1600px 矢量高清 Logo）。
- **用户自办事项**：开发者本人完成 OpenAI 账号 Tier 1 绑卡实名，并录制 20 秒真机演示短视频。
