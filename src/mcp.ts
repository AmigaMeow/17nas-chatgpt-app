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
 const uri='ui://17nas/ipv6-card-v3.html';
 // Classify the actual interaction, including the automatically opened browser card.
 // NAT only returns a guide/link; statistics reads a bounded local country snapshot.
 // Connection and region cards observe the current browser's live public network.
 const intents=[
  {name:'check_ipv6_connection',openWorldHint:true,kind:'connection',title:'Check IPv6 connection',description:'Check whether the current browser can reach the dedicated IPv6-only probe. Use for IPv6-only reachability questions or evaluating IPv6 for NAS remote access or direct P2P. If IPv4, IPv6 and country are requested together, use check_network alone instead. Opens an automatic browser diagnostic. This server response is pending, not a measurement of the user network. Do not infer a country, city, ISP, IP, ASN or protocol status from host metadata or memory. The completed card can share measured results into the conversation. Success confirms reachability to this probe; failure remains unverified. IP addresses and ASNs are not retained, returned or displayed.'},
  {name:'get_network_region',openWorldHint:true,kind:'network',title:'Network region',description:'Show the current browser connection country, derived by the App service when the card loads. Use for questions only about network location or country attribution. If protocol connectivity and country are requested together, use check_network alone instead. The initial tool response is pending. Never infer country, city, IP or ASN from the AI host tool call, host metadata or memory. Use the completed browser card result. Country-level geolocation can differ from physical location because of VPNs or proxies. IP addresses and ASNs are not displayed.'},
  {name:'get_nat_troubleshooting_guide',openWorldHint:false,kind:'nat',title:'Get NAT troubleshooting guide',description:'Get a troubleshooting guide for network address translation (NAT) and a link to the external 17NAS test for NAT type, port forwarding, multiplayer disconnections, lobby or peer-to-peer matchmaking problems. This tool only provides an external test link; it does not measure NAT, CGNAT, packet loss, ping or jitter and cannot establish the cause of game disconnections. State that NAT is untested and ask for the dedicated test result before interpreting a NAT type. Do not claim that the card performed a NAT test.'},
  {name:'get_ipv6_statistics',openWorldHint:false,kind:'statistics',title:'IPv6 country statistics and rankings',description:'Show the APNIC Labs global IPv6 adoption rate, global Top 5, optional country adoption, snapshot date and ranking scope. Pass an ISO two-letter country code for a specific country. Separately show publishable 17NAS aggregate observations only when at least 300 samples exist. Reads a service-maintained local snapshot for a bounded country catalog; this tool does not fetch arbitrary websites or query APNIC live. This is population statistics, not a test of the user connection; no browser probe is performed.'},
  {name:'check_network',openWorldHint:true,kind:'combined',title:'Network connection check',description:'Use for general network diagnostics, check my network (测一下网络 / 网络诊断), IP lookup / check IPv4 (查 IP / 查 IPv4), or testing browser connectivity. Use this single tool for a combined IPv4, IPv6 and network-country breakdown; do not additionally call check_ipv6_connection or get_network_region for the same request. Opens a compact card that automatically probes browser IPv6 connection and displays country attribution. This initial server response is pending and cannot detect the user network. Do not infer country, city, ISP, IP, ASN or protocol results from host metadata or memory. Use only the completed browser card measurement; the user can share it into the conversation. To protect user privacy, raw IP addresses and ASNs are never displayed; when users ask for IP, explain that the tool protects privacy by not exposing raw IPs, and instead displays protocol reachability (IPv4/IPv6) and estimated country. For NAT questions or troubleshooting game drops / P2P, use get_nat_troubleshooting_guide; for macro adoption rankings, use get_ipv6_statistics.'}
 ] as const;
 for(const intent of intents)registerAppTool(server,intent.name,{
  title:intent.title,description:intent.description,
  inputSchema:z.object({...intent.kind==='statistics'?{country:z.string().refine(isCountry).optional()}:{},locale:z.string().max(35).describe("Language of the current user message, e.g. zh-CN for Simplified Chinese or zh-TW for Traditional Chinese. Prefer conversation language over account language.").optional()}).strict(),
  annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:intent.openWorldHint},
  _meta:{ui:{resourceUri:uri},'openai/outputTemplate':uri}
 },async(args,extra)=>{
  const locale=normalizeLocale(args.locale??extra._meta?.['openai/locale']);
  const country='country' in args?args.country as string|undefined:undefined;
  const snapshot=intent.kind==='statistics'?await loadStats(env.STATS):null;
  const data={...statsFor(snapshot?.data??null,country??'XX',snapshot?.stale),cardKind:intent.kind,requestedCountry:country??null,locale,localeSource:args.locale?'conversation':'host',apiOrigin:env.PUBLIC_ORIGIN,probeUrl:env.IPV6_PROBE_URL||null,...intent.kind==='nat'?{natTestUrl:'https://17nas.com/nat-test.php',natStatus:'not_tested'}:intent.kind==='statistics'?{}:{measurementStatus:'pending'}};
  const s=strings(locale);
  return {content:[{type:'text',text:intent.kind==='statistics'?s.regionalContext:intent.kind==='nat'?s.natDescription+' https://17nas.com/nat-test.php':s.modelPending}],structuredContent:data};
 });
 const domains=[env.PUBLIC_ORIGIN,...(env.IPV6_PROBE_URL?[new URL(env.IPV6_PROBE_URL).origin]:[])];
 
 const prompts=[
  {name:'troubleshoot_game_nat',description:'Open the NAT test guide for multiplayer troubleshooting',text:'I am getting disconnected from multiplayer games. Show me how to check whether NAT restrictions could be involved.'},
  {name:'check_network_ipv6',description:'Check browser network and IPv6 reachability',text:'Check my browser connection and IPv6 reachability.'},
  {name:'view_ipv6_rankings',description:'View global IPv6 adoption and country rankings',text:'Show global IPv6 adoption and the APNIC country rankings.'},
  {name:'check_network_region',description:'Check the browser connection country',text:'Check the country attributed to my browser connection.'}
 ];
 for(const p of prompts){server.prompt(p.name,p.description,async()=>({messages:[{role:'user',content:{type:'text',text:p.text}}]}));}
 for(const resUri of [uri,'ui://17nas/ipv6-card-v2.html','ui://17nas/ipv6-card.html']){
  registerAppResource(server,resUri===uri?'ipv6-card':resUri.endsWith('-v2.html')?'ipv6-card-v2':'ipv6-card-legacy',resUri,{},async()=>{
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
 let body=await request.text();
 if(body.length>16384){await server.close();return Response.json({error:{code:'invalid_request'}},{status:413});}
 // Existing development clients may still cache the old action name.
 try {
  const rpc=JSON.parse(body);
  if(rpc?.method==='tools/call'&&rpc.params?.name==='check_nat'){
   rpc.params.name='get_nat_troubleshooting_guide';
   body=JSON.stringify(rpc);
  }
 } catch { /* Let the MCP transport report malformed JSON. */ }
 try {return await transport.handleRequest(new Request(request.url,{method:'POST',headers:safeHeaders,body}));}
 finally {await server.close();}
}
