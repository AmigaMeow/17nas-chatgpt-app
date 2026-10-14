import { CountryCounter } from './counter';
import { fingerprints } from './privacy';
import { normalizeLocale,strings } from './i18n';
import { isCountry,loadStats,statsFor } from './stats';
import { handleMcp } from './mcp';
export { CountryCounter };
export interface AppEnv {
 STATS:KVNamespace; ABUSE:KVNamespace; COUNTERS:DurableObjectNamespace<CountryCounter>;
 ASSETS:Fetcher; PUBLIC_ORIGIN:string; IPV6_PROBE_URL:string; RELEASE:string; HMAC_SECRET:string;
}
const headers={
 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
 'Access-Control-Allow-Headers':'Content-Type, Accept, MCP-Protocol-Version',
 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'
};
function json(body:unknown,status=200,extra:Record<string,string>={}){return Response.json(body,{status,headers:{...headers,...extra}});}
export default {
 async fetch(request:Request,env:AppEnv):Promise<Response> {
  const url=new URL(request.url), locale=normalizeLocale(url.searchParams.get('locale'));
  const fail=(code:'invalidRequest'|'rateLimit'|'networkError',status:number)=>json({error:{code,message:strings(locale)[code]}},status,status===429?{'Retry-After':'60'}:{});
  try {
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
   if(url.pathname==='/health')return json({status:'ok',version:env.RELEASE});
   if(url.pathname==='/mcp') {
    // Model requests originate at the AI host. They never determine the user's region or count.
    if(request.method!=='POST')return json({error:{code:'method_not_allowed'}},405,{'Allow':'POST, OPTIONS'});
    const response=await handleMcp(request,env);
    const result=new Response(response.body,response);for(const [k,v] of Object.entries(headers))result.headers.set(k,v);
    return result;
   }
   if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
   if(!['/api/ipv6-rank','/api/ipv6-query','/api/probe','/api/config'].includes(url.pathname))return fail('invalidRequest',404);
   const allowed=new Set(url.pathname==='/api/ipv6-rank'?['region','locale']:['locale']);
   for(const key of url.searchParams.keys())if(!allowed.has(key))return fail('invalidRequest',400);
   const increment=url.pathname==='/api/ipv6-query';
   if(request.method!==(increment?'POST':'GET'))return fail('invalidRequest',405);
   if(increment) {
    // Accept no IP, location overrides, identifiers, or other caller-controlled fields.
    const body=await request.text();if(body.length>256)return fail('invalidRequest',400);
    if(body.trim()) {let parsed:unknown;try{parsed=JSON.parse(body);}catch{return fail('invalidRequest',400);}if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||Object.keys(parsed).length)return fail('invalidRequest',400);}
   }
   const country=request.cf?.country;
   const region=isCountry(country)?country:'XX';
   const counter=env.COUNTERS.get(env.COUNTERS.idFromName(region));
   let ip=request.headers.get('CF-Connecting-IP');
   if(!ip)return fail('networkError',503);
   const fp=await fingerprints(ip,env.HMAC_SECRET,Date.now());ip=null;
   const counted=await counter.visit(fp,increment);
   if(counted.limited)return fail('rateLimit',429);
   if(url.pathname==='/api/config')return json({probeUrl:env.IPV6_PROBE_URL||null});
   if(url.pathname==='/api/probe') {
    // The component accepts success only when this request actually reached us over IPv6.
    const connecting=request.headers.get('CF-Connecting-IP');
    return json({ipv6Status:connecting?.includes(':')?'supported':'unknown'});
   }
   const requested=url.searchParams.get('region');
   if(requested&&!isCountry(requested))return fail('invalidRequest',400);
   const target=increment?region:(requested??region);
   const data=await loadStats(env.STATS);
   const totals=target===region?counted:await env.COUNTERS.get(env.COUNTERS.idFromName(target)).read();
   return json({...statsFor(data?.data??null,target,data?.stale),...totals,locale,date:new Date().toISOString().slice(0,10)});
  } catch {return fail('networkError',503);}
 }
} satisfies ExportedHandler<AppEnv>;
