import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { registerAppTool,registerAppResource,RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import html from './widget-html';
import type { AppEnv } from './index';
import { loadStats,statsFor,isCountry } from './stats';
import { normalizeLocale,strings } from './i18n';
export async function handleMcp(request:Request,env:AppEnv) {
 const server=new McpServer({name:'17NAS IPv6 Checker & Stats',version:env.RELEASE});
 const uri='ui://17nas/ipv6-card-v2.html';
 const intents=[
  {name:'check_ipv6_connection',kind:'connection',title:'Check IPv6 connection',description:'Check whether the current browser can reach the dedicated IPv6-only probe. Use when the user asks about IPv6 reachability, whether IPv6 is enabled, or evaluating IPv6 for NAS remote access or direct P2P connections. Opens a card that automatically runs the browser probe. The server tool itself cannot detect the user network. Success confirms reachability to this probe; failure remains unverified, not proof IPv6 is unsupported. IP addresses and ASNs are never collected, returned, or displayed.'},
  {name:'get_network_region',kind:'network',title:'Network region',description:'Show the current browser connection country, derived by the App service when the card loads. Use for questions about network location or country attribution. Never infer the user address from the AI host tool call. Country-level geolocation can differ from physical location because of VPNs or proxies. IP addresses and ASNs are not displayed.'},
  {name:'check_nat',kind:'nat',title:'NAT test guide',description:'Diagnose network restrictions and provide the 17NAS NAT test guide. Trigger whenever the user asks about NAT type, port forwarding, or reports multiplayer gaming issues (e.g., game disconnections, unable to join lobbies, strict NAT / P2P matchmaking problems) to check if Symmetric or Restricted NAT is the root cause. This tool does not test NAT directly inside the card; it provides an external test link with diagnostic guidance.'},
  {name:'get_ipv6_statistics',kind:'statistics',title:'IPv6 country statistics and rankings',description:'Show APNIC Labs global Top 5 and optional country IPv6 adoption, data date and ranking scope. Pass an ISO two-letter country code for a specific country. Separately show publishable 17NAS aggregate observations only when at least 300 samples exist. This is population statistics, not a test of the user connection; no browser probe is performed.'},
  {name:'check_network',kind:'combined',title:'Network connection check',description:'Use for general network diagnostics, check my network (测一下网络 / 网络诊断), IP lookup / check IPv4 (查 IP / 查 IPv4), or testing browser connectivity. Opens a compact card that automatically probes browser IPv6 connection and displays country attribution. Server tool calls cannot detect the user network. To protect user privacy, raw IP addresses and ASNs are never displayed; when users ask for IP, explain that the tool protects privacy by not exposing raw IPs, and instead displays protocol reachability (IPv4/IPv6) and estimated country. For NAT questions or troubleshooting game drops / P2P, use check_nat; for macro adoption rankings, use get_ipv6_statistics.'}
 ] as const;
 for(const intent of intents)registerAppTool(server,intent.name,{
  title:intent.title,description:intent.description,
  inputSchema:z.object({...intent.kind==='statistics'?{country:z.string().refine(isCountry).optional()}:{},locale:z.string().max(35).describe("Language of the current user message, e.g. zh-CN for Simplified Chinese or zh-TW for Traditional Chinese. Prefer conversation language over account language.").optional()}).strict(),
  annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:true},
  _meta:{ui:{resourceUri:uri},'openai/outputTemplate':uri}
 },async(args,extra)=>{
  console.log('[17NAS MCP] tools/call', intent.name, JSON.stringify(args));
  const locale=normalizeLocale(args.locale??extra._meta?.['openai/locale']);
  const country='country' in args?args.country as string|undefined:undefined;
  const snapshot=intent.kind==='statistics'?await loadStats(env.STATS):null;
  const data={...statsFor(snapshot?.data??null,country??'XX',snapshot?.stale),cardKind:intent.kind,requestedCountry:country??null,locale,localeSource:args.locale?'conversation':'host',apiOrigin:env.PUBLIC_ORIGIN,probeUrl:env.IPV6_PROBE_URL||null,...intent.kind==='nat'?{natTestUrl:'https://17nas.com/nat-test.php'}:{}};
  const s=strings(locale);
  return {content:[{type:'text',text:intent.kind==='statistics'?s.regionalContext:intent.kind==='nat'?s.natDescription+' https://17nas.com/nat-test.php':s.modelPending}],structuredContent:data};
 });
 const domains=[env.PUBLIC_ORIGIN,...(env.IPV6_PROBE_URL?[new URL(env.IPV6_PROBE_URL).origin]:[])];
 
 const prompts=[
  {name:'troubleshoot_game_nat',description:'Troubleshoot game matchmaking & NAT type (排查游戏联机与 NAT 类型)',text:'帮我排查游戏联机掉线问题，并测试我的 NAT 类型。'},
  {name:'check_network_ipv6',description:'Check network & IPv6 support (检测网络与 IPv6 支持)',text:'测一下我的网络连接和 IPv6 支持情况。'},
  {name:'view_ipv6_rankings',description:'View global IPv6 rankings (查看全球 IPv6 普及率排行)',text:'查看全球 IPv6 普及率与 APNIC 国家排行榜。'},
  {name:'check_network_region',description:'Check network connection region (查询网络连接归属国家)',text:'测一下我当前网络连接的归属国家。'}
 ];
 for(const p of prompts){server.prompt(p.name,p.description,async()=>({messages:[{role:'user',content:{type:'text',text:p.text}}]}));}
 for(const resUri of [uri,'ui://17nas/ipv6-card.html']){
  registerAppResource(server,resUri==='ui://17nas/ipv6-card.html'?'ipv6-card-legacy':'ipv6-card',resUri,{},async()=>{
  console.log('[17NAS MCP] resources/read for', resUri);
  return {contents:[{
   uri:resUri,mimeType:RESOURCE_MIME_TYPE,text:html,
   _meta:{ui:{domain:env.PUBLIC_ORIGIN,csp:{connectDomains:domains,resourceDomains:[env.PUBLIC_ORIGIN]}},
    'openai/widgetDomain':env.PUBLIC_ORIGIN,'openai/widgetDescription':'Browser network detection with protocol reachability, country attribution, and separately sourced IPv6 statistics. No IP addresses or ASNs are displayed.',
    'openai/widgetCSP':{connect_domains:domains,resource_domains:[env.PUBLIC_ORIGIN]}}
  }]};
 });
 }
 const transport=new WebStandardStreamableHTTPServerTransport({enableJsonResponse:true});
 await server.connect(transport);
 // Deliberately exclude source address, user agent, cookies, and host location headers.
 const safeHeaders=new Headers();
 for(const key of ['content-type','accept','mcp-protocol-version']) {const value=request.headers.get(key);if(value)safeHeaders.set(key,value);}
 const body=await request.text();
 try {
  const parsed = JSON.parse(body);
  console.log(`[17NAS MCP] method=${parsed.method} params=${JSON.stringify(parsed.params??{}).slice(0, 300)}`);
 }catch{}
 if(body.length>16384){await server.close();return Response.json({error:{code:'invalid_request'}},{status:413});}
 try {return await transport.handleRequest(new Request(request.url,{method:'POST',headers:safeHeaders,body}));}
 finally {await server.close();}
}
