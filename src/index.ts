import { normalizeLocale,strings } from './i18n';
import { isCountry,loadStats,statsFor,type StatsStore } from './stats';
import { handleMcp } from './mcp';
export interface AppEnv {
 STATS:StatsStore; ASSETS:{fetch(request:Request):Promise<Response>};
 PUBLIC_ORIGIN:string; IPV6_PROBE_URL:string; RELEASE:string;
}
export interface BrowserConnection {protocol:"IPv4"|"IPv6";}
export interface NetworkContext {region:string;ipv6:boolean;limited:boolean;connection?:BrowserConnection;}
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Accept, MCP-Protocol-Version','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
function json(body:unknown,status=200,extra:Record<string,string>={}){return Response.json(body,{status,headers:{...headers,...extra}});}
export async function handleRequest(request:Request,env:AppEnv,network:NetworkContext):Promise<Response> {
 const url=new URL(request.url),locale=normalizeLocale(url.searchParams.get('locale'));
 const fail=(code:'invalidRequest'|'rateLimit'|'networkError',status:number)=>json({error:{code,message:strings(locale)[code]}},status,status===429?{'Retry-After':'60'}:{});
 try {
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='OPTIONS'&&network.limited)return fail('rateLimit',429);
  if(url.pathname==='/health')return json({status:'ok',version:env.RELEASE});
  if(url.pathname==='/mcp'){
   if(request.method!=='POST')return fail('invalidRequest',405);
   const response=await handleMcp(request,env),result=new Response(response.body,response);
   for(const [k,v]of Object.entries(headers))result.headers.set(k,v);return result;
  }
  if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
  if(!['/api/ipv6-rank','/api/network','/api/probe','/api/config'].includes(url.pathname))return fail('invalidRequest',404);
  const allowed=new Set(url.pathname==='/api/ipv6-rank'?['region','locale']:['locale']);
  for(const key of url.searchParams.keys())if(!allowed.has(key))return fail('invalidRequest',400);
  if(request.method!=='GET')return fail('invalidRequest',405);
  if(url.pathname==='/api/config')return json({probeUrl:env.IPV6_PROBE_URL||null});
  if(url.pathname==='/api/probe')return json({ipv6Status:network.ipv6?'supported':'unknown',...(network.ipv6&&network.connection?{connection:network.connection}:{})});
  const requested=url.searchParams.get('region');if(requested&&!isCountry(requested))return fail('invalidRequest',400);
  const region=requested??(isCountry(network.region)?network.region:'XX');
  if(url.pathname==='/api/network')return json({...statsFor(null,region),locale,...(network.connection?{connection:network.connection}:{})});
  const data=await loadStats(env.STATS);
  return json({...statsFor(data?.data??null,region,data?.stale),locale});
 }catch{return fail('networkError',503);}
}
