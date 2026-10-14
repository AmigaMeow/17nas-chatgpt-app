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
 const uri='ui://17nas/ipv6-card.html';
 const intents=[
  {name:'check_ipv6_connection',kind:'connection',title:'Check IPv6 connection',description:'Check whether the current browser can reach the dedicated IPv6-only probe. Opens a card that automatically runs the browser probe. The server tool itself cannot detect the user network. Success confirms reachability to this probe; failure remains unverified, not proof IPv6 is unsupported. No IP addresses or ASN are returned.'},
  {name:'get_network_region',kind:'network',title:'Network region',description:'Show the current browser connection country, derived by the App edge when the card loads. Use for questions about network location. This App cannot display the user IP address or ASN and does not infer them from the AI host tool call. Country-level geolocation can differ from physical location because of VPNs or proxies.'},
  {name:'check_nat',kind:'nat',title:'NAT test guide',description:'Provide a link to the 17NAS browser NAT test. This tool does not test or infer NAT type and does not start a connectivity probe. Use when the user asks about NAT type or how to test NAT.'},
  {name:'get_ipv6_statistics',kind:'statistics',title:'IPv6 country statistics and rankings',description:'Show APNIC Labs global Top 5 and optional country IPv6 adoption, data date and ranking scope. Pass an ISO two-letter country code for a specific country. Separately show publishable 17NAS aggregate observations only when at least 300 samples exist. This is population statistics, not a test of the user connection; no browser probe or query increment is performed.'},
  {name:'check_network',kind:'combined',title:'IPv6 network check',description:'Use for a general request to check the current network. Opens a compact card that automatically probes the browser IPv6 connection and displays its country. Server tool calls cannot detect the user network. Does not expose IP addresses, ASN or NAT type. For NAT questions use check_nat; for rankings use get_ipv6_statistics.'}
 ] as const;
 for(const intent of intents)registerAppTool(server,intent.name,{
  title:intent.title,description:intent.description,
  inputSchema:z.object({...intent.kind==='statistics'?{country:z.string().refine(isCountry).optional()}:{},locale:z.string().max(35).optional()}).strict(),
  annotations:{readOnlyHint:intent.kind==='statistics'||intent.kind==='nat',destructiveHint:false,idempotentHint:intent.kind==='statistics'||intent.kind==='nat',openWorldHint:true},
  _meta:{ui:{resourceUri:uri},'openai/outputTemplate':uri}
 },async(args,extra)=>{
  const locale=normalizeLocale(args.locale??extra._meta?.['openai/locale']);
  const country='country' in args?args.country as string|undefined:undefined;
  const snapshot=intent.kind==='statistics'?await loadStats(env.STATS):null;
  const data={...statsFor(snapshot?.data??null,country??'XX',snapshot?.stale),cardKind:intent.kind,requestedCountry:country??null,locale,apiOrigin:env.PUBLIC_ORIGIN,probeUrl:env.IPV6_PROBE_URL||null,myRank:null,todayQueries:null,...intent.kind==='nat'?{natTestUrl:'https://17nas.com/nat-test.php'}:{}};
  const s=strings(locale);
  return {content:[{type:'text',text:intent.kind==='statistics'?s.regionalContext:intent.kind==='nat'?s.natDescription+' https://17nas.com/nat-test.php':intent.kind==='network'?s.networkPending:s.checking}],structuredContent:data};
 });
 const domains=[env.PUBLIC_ORIGIN,...(env.IPV6_PROBE_URL?[new URL(env.IPV6_PROBE_URL).origin]:[])];
 registerAppResource(server,'ipv6-card',uri,{},async()=>({contents:[{
  uri,mimeType:RESOURCE_MIME_TYPE,text:html,
  _meta:{ui:{domain:env.PUBLIC_ORIGIN,csp:{connectDomains:domains,resourceDomains:[env.PUBLIC_ORIGIN]}},
   'openai/widgetDomain':env.PUBLIC_ORIGIN,'openai/widgetDescription':'IPv6 detection, regional query counts, and separately sourced IPv6 statistics.',
   'openai/widgetCSP':{connect_domains:domains,resource_domains:[env.PUBLIC_ORIGIN]}}
 }]}));
 const transport=new WebStandardStreamableHTTPServerTransport({enableJsonResponse:true});
 await server.connect(transport);
 // Deliberately exclude source address, user agent, cookies, and host location headers.
 const safeHeaders=new Headers();
 for(const key of ['content-type','accept','mcp-protocol-version']) {const value=request.headers.get(key);if(value)safeHeaders.set(key,value);}
 const body=await request.text();
 if(body.length>16384){await server.close();return Response.json({error:{code:'invalid_request'}},{status:413});}
 try {return await transport.handleRequest(new Request(request.url,{method:'POST',headers:safeHeaders,body}));}
 finally {await server.close();}
}
