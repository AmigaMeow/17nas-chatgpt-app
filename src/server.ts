import {createServer,type IncomingMessage} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHmac} from 'node:crypto';
import {isIP} from 'node:net';
import {open,type CityResponse,type Reader} from 'maxmind';
import {handleRequest,type AppEnv,type BrowserConnection} from './index';
import {strings} from './i18n';
import {validateSnapshot,type StatsStore} from './stats';

// Minute-scoped HMACs only; neither keys nor exceptions are logged or persisted.
export class RateLimiter {
 private minute=-1; private secret=randomBytes(32); private entries=new Map<string,number>(); private expiry:ReturnType<typeof setTimeout>|undefined;
 limited(address:string,now=Date.now()) {
  const minute=Math.floor(now/60000);
  if(minute!==this.minute){
   if(this.expiry)clearTimeout(this.expiry);
   this.entries.clear();this.secret=randomBytes(32);this.minute=minute;
   this.expiry=setTimeout(()=>{this.entries.clear();this.secret=randomBytes(32);this.minute=-1;this.expiry=undefined;},60000-now%60000);
   this.expiry.unref();
  }
  const key=createHmac('sha256',this.secret).update(address).digest('hex');
  if(this.entries.size>=100000&&!this.entries.has(key))return true;
  const count=(this.entries.get(key)??0)+1;this.entries.set(key,count);return count>10;
 }
}
export class FileStats implements StatsStore {
 private cached:unknown=null;private checked=0;
 constructor(private path:string){}
 async get(_key:string,_format:'json') {
  const now=Date.now();
  if(now-this.checked>=3600000){this.checked=now;try{
   const info=await stat(this.path);if(info.size>2000000)throw new Error('INVALID_SNAPSHOT');
   const candidate=validateSnapshot(JSON.parse(await readFile(this.path,'utf8')));
   if(Date.parse(candidate.generatedAt)>now+300000||Date.parse(candidate.own.updatedAt)>now+300000||now-Date.parse(candidate.generatedAt)>86400000||now-Date.parse(candidate.own.updatedAt)>86400000)throw new Error('INVALID_SNAPSHOT');
   this.cached=candidate;
  }catch{/* Keep last validated copy, age checked by loadStats. */}}
  return this.cached;
 }
}
export function sourceAddress(req:IncomingMessage,trustNginx:boolean) {
 let source=req.socket.remoteAddress??'';
 if(trustNginx&&(source==='127.0.0.1'||source==='::1'||source==='::ffff:127.0.0.1')){
  const header=req.headers['x-17nas-source-ip'];source=typeof header==='string'&&isIP(header)?header:'';
 }
 if(source.startsWith('::ffff:')&&isIP(source.slice(7))===4)source=source.slice(7);
 return isIP(source)?source:'';
}
export async function startServer() {
 const root=resolve(process.env.APP_ASSETS_DIR??dirname(fileURLToPath(import.meta.url)));
 let geo:Reader<CityResponse>|null=null;
 try{geo=await open<CityResponse>(process.env.APP_GEO_DB??'/var/lib/17nas-chatgpt-app/geo/GeoLite2-City.mmdb');}catch{/* Country falls back to Unknown. */}
 const env:AppEnv={PUBLIC_ORIGIN:process.env.APP_PUBLIC_ORIGIN??'http://127.0.0.1:8791',IPV6_PROBE_URL:process.env.APP_IPV6_PROBE_URL??'',RELEASE:'0.2.0',STATS:new FileStats(process.env.APP_STATS_FILE??'/var/lib/17nas-chatgpt-app/stats/snapshot.json'),ASSETS:{async fetch(request){
  const path=new URL(request.url).pathname;
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response(null,{status:405});
  if(!/^\/(?:widget\.html|privacy\.html|terms\.html|flags\/[a-z]{2}\.svg)$/.test(path))return new Response(null,{status:404});
  try{return new Response(request.method==='HEAD'?null:await readFile(resolve(root,'.'+path)),{headers:{'Content-Type':path.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8','Cache-Control':path.endsWith('.html')?'no-cache, no-store, must-revalidate':'public, max-age=3600','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}catch{return new Response(null,{status:404});}
 }}};
 const limiter=new RateLimiter(),trustNginx=process.env.APP_TRUST_NGINX==='1';
 const server=createServer(async(req,res)=>{
  try{
   let source=sourceAddress(req,trustNginx);
   const route=new URL(req.url??'/',env.PUBLIC_ORIGIN).pathname;
   const limited=(route.startsWith('/api/')||route==='/mcp')&&req.method!=='OPTIONS'&&(!source||limiter.limited(source));
   console.log(`[17NAS Server] ${new Date().toISOString()} ${req.method} ${route} limited=${limited} isIP=${isIP(source)}`);
   let region='XX';try{const place=geo?.get(source);region=place?.country?.iso_code??'XX';}catch{}
   let connection:BrowserConnection|undefined;
   if(!limited&&req.method==='GET'&&['/api/network','/api/probe'].includes(route)&&source){
    connection={protocol:isIP(source)===6?'IPv6':'IPv4'};
   }
   const ipv6=isIP(source)===6&&(!trustNginx||req.headers['x-17nas-direct-ipv6']==='1');source='';
   const method=req.method??'GET',chunks:Buffer[]=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);res.end();return;}chunks.push(chunk);}
   // No inbound headers except protocol headers enter application logic.
   const headers=new Headers();for(const key of ['content-type','accept','mcp-protocol-version']){const value=req.headers[key];if(typeof value==='string')headers.set(key,value);}
   const body=Buffer.concat(chunks).toString('utf8');
   const request=new Request(new URL(req.url??'/',env.PUBLIC_ORIGIN),{method,headers,...(method==='GET'||method==='HEAD'?{}:{body})});
   const response=await handleRequest(request,env,{region,ipv6,limited,connection});
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{
   let locale='en';try{locale=new URL(req.url??'/',env.PUBLIC_ORIGIN).searchParams.get('locale')??'en';}catch{}
   res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Cache-Control':'no-store','Retry-After':'60'});
   res.end(JSON.stringify({error:{code:'networkError',message:strings(locale).networkError}}));
  }
 });
 server.requestTimeout=5000;server.headersTimeout=5000;
 server.listen(Number(process.env.APP_PORT??8790),process.env.APP_BIND??'127.0.0.1');
 return server;
}
if(process.env.APP_NO_START!=='1')void startServer();
