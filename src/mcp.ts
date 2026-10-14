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
 registerAppTool(server,'check_network',{
  title:'IPv6 Checker & Stats',
  description:'Open an inline IPv6 check and country statistics card. Shows APNIC Labs global rankings separately from 17NAS regional samples. The user clicks Check in the card to detect their connection and count one regional query; server tool calls cannot detect the user connection. Does not expose IP addresses, ASN, or NAT.',
  inputSchema:z.object({country:z.string().refine(isCountry).optional(),locale:z.string().max(35).optional()}).strict(),
  annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},
  _meta:{ui:{resourceUri:uri},'openai/outputTemplate':uri}
 },async(args,extra)=>{
  const locale=normalizeLocale(args.locale??extra._meta?.['openai/locale']);
  const snapshot=await loadStats(env.STATS);
  const data={...statsFor(snapshot?.data??null,args.country??'XX',snapshot?.stale),locale,apiOrigin:env.PUBLIC_ORIGIN,probeUrl:env.IPV6_PROBE_URL||null,myRank:null,todayQueries:null};
  return {content:[{type:'text',text:strings(locale).queryPending}],structuredContent:data};
 });
 const domains=[env.PUBLIC_ORIGIN,...(env.IPV6_PROBE_URL?[new URL(env.IPV6_PROBE_URL).origin]:[])];
 registerAppResource(server,'ipv6-card',uri,{},async()=>({contents:[{
  uri,mimeType:RESOURCE_MIME_TYPE,text:html,
  _meta:{ui:{domain:env.PUBLIC_ORIGIN,csp:{connectDomains:domains,resourceDomains:[]}},
   'openai/widgetDomain':env.PUBLIC_ORIGIN,'openai/widgetDescription':'IPv6 detection, regional query counts, and separately sourced IPv6 statistics.',
   'openai/widgetCSP':{connect_domains:domains,resource_domains:[]}}
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
