import { App } from '@modelcontextprotocol/ext-apps';
import { countryName,normalizeLocale,number,strings,type Locale } from '../src/i18n';

type CardKind='connection'|'network'|'nat'|'statistics'|'combined';
type Data={region:string;ipv6Status:string;ipv6Rate:number|null;sampleCount:number;status:string;updatedAt:string|null;stale:boolean;statisticsAvailable:boolean;globalRank:number|null;apnic:{ipv6Rate:number|null;globalRate:number|null;dataDate:string|null;rankingScope:string|null;top5:{region:string;ipv6Rate:number;globalRank:number}[]}}&{cardKind?:CardKind;requestedCountry?:string|null;todayQueries?:number|null;myRank?:number|null;counted?:boolean;probeUrl?:string|null;apiOrigin?:string;locale?:string};
declare global {interface Window {openai?:{locale?:string;toolOutput?:Data};}}
let locale:Locale=normalizeLocale(window.openai?.locale);
let data:Data|undefined, busy=false, loading=true, errorKey='', connected=false, checked=false;
let clientStatus='unknown';
let cardKind:CardKind='combined',requestedCountry:string|null=null,started=false;
const hasProbe=()=>cardKind==='connection'||cardKind==='combined';
let origin=window.parent!==window?'https://app.17nas.com':location.origin,probeUrl:string|null=null;
const app=new App({name:'17NAS IPv6 Checker & Stats',version:'0.1.0'});
const el=(id:string)=>document.getElementById(id)!;
const text=(id:string,value:string)=>{el(id).textContent=value;};
const format=(key:keyof ReturnType<typeof strings>,args:Record<string,string>={})=>{
 let value=strings(locale)[key];for(const [k,v]of Object.entries(args))value=value.replaceAll(`{${k}}`,v);return value;
};
function date(value:string|null|undefined) {
 if(!value)return strings(locale).unknown;
 return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(value));
}
function render() {
 document.documentElement.lang=locale;
 const s=strings(locale);
 for(const id of ['title','aboutData','sampleDetails','sampleContext','ownTitle','apnicTitle','footerSummary','diagnosticsTitle','details','privacy','terms','networkTitle','networkHelp','natTitle','natDescription','natCaveat','natLink'])text(id,s[id as keyof typeof s]);
 text('translation',s._status==='pending_professional_translation'?s.translationPending:'');
 el('detection').hidden=!hasProbe();
 el('check').hidden=!hasProbe();
 el('networkPanel').hidden=cardKind!=='network'&&cardKind!=='combined';
 el('natPanel').hidden=cardKind!=='nat';
 el('statisticsPanel').hidden=cardKind!=='statistics';
 el('querySummary').hidden=true; // Query ordinals are secondary, available in the details only.
 el('sourceDetails').hidden=cardKind!=='statistics';
 el('regionalContext').hidden=cardKind!=='statistics';
 el('checkHelp').hidden=!hasProbe();
 el('country').hidden=cardKind==='nat'||cardKind==='statistics';
 const state=busy||loading?'checking':clientStatus;
 el('status').dataset.state=state;
 text('status',busy||loading?s.checking:state==='supported'?s.supported:state==='unsupported'?s.unsupported:s.unverified);
 text('check',s.recheck);(el('check') as HTMLButtonElement).disabled=busy||loading;
 text('loading',loading?(cardKind==='network'?s.networkPending:hasProbe()?s.checking:s.loading):'');
 text('checkHelp',!checked?s.checkHelp:state==='supported'?s.supportedHelp:s.unverifiedHelp);
 if(busy||loading)text('checkHelp',s.checking);
 const region=countryName(data?.region??'XX',locale);
 text('rank',data?.myRank!=null?format('queryRank',{rank:number(data.myRank,locale),region}):checked&&!busy?s.queryUnavailable:s.queryPending);
 text('count',data?.todayQueries!=null?`${s.queriesToday}: ${number(data.todayQueries,locale)}${data.counted===false?` · ${s.queryRepeated}`:''}`:'');
 text('detailRank',el('rank').textContent??'');text('detailCount',el('count').textContent??'');el('countDetails').hidden=cardKind==='statistics'||cardKind==='nat'||data?.myRank==null;
 text('error',errorKey?s[errorKey as keyof typeof s]??s.networkError:(!loading&&cardKind==='statistics'&&data&&!data.statisticsAvailable?s.statsError:''));
 el('diagnostics').hidden=!el('error').textContent;
 text('country',`${s.region}: ${region}`);
 text('networkRegion',loading?s.networkPending:region);
 (el('details') as HTMLAnchorElement).hidden=cardKind!=='statistics';
 text('regionalTitle',format('regionalTitle',{region}));
 text('regionalContext',s.regionalContext);
 const regionalRate=data?.apnic.ipv6Rate;
 const hasOwnRate=data?.ipv6Rate!=null;
 el('sampleModule').hidden=cardKind!=='statistics'||!hasOwnRate;
 el('regionalPanel').hidden=loading||(regionalRate==null&&!hasOwnRate);
 el('regionalRate').hidden=regionalRate==null;
 text('regionalRate',regionalRate!=null?`${s.regionalRate}: ${number(regionalRate,locale)}%`:s.regionalMissing);
 const regionalProgress=el('regionalProgress') as HTMLProgressElement;
 regionalProgress.hidden=regionalRate==null;if(regionalRate!=null)regionalProgress.value=regionalRate;regionalProgress.setAttribute('aria-label',s.regionalRate);
 const globalRate=data?.apnic.globalRate;
 const difference=regionalRate!=null&&globalRate!=null?Math.round((regionalRate-globalRate)*100)/100:null;
 text('comparison',difference==null?'':difference===0?s.equalGlobal:format(difference>0?'aboveGlobal':'belowGlobal',{difference:number(Math.abs(difference),locale)}));
 text('countryRank',data?.globalRank?format('globalRank',{rank:number(data.globalRank,locale)}):'');
 text('ownRate',data?.ipv6Rate!=null?`${s.ownRate}: ${number(data.ipv6Rate,locale)}%`:'');
 const progress=el('progress') as HTMLProgressElement;progress.hidden=data?.ipv6Rate==null;if(data?.ipv6Rate!=null)progress.value=data.ipv6Rate;progress.setAttribute('aria-label',s.ownRate);
 text('samples',format('samples',{count:number(data?.sampleCount??0,locale)}));
 text('ownUpdated',`${s.source}: 17NAS · ${s.updated}: ${date(data?.updatedAt)}`);
 el('top').replaceChildren(...(data?.apnic.top5??[]).map(row=>{
  const li=document.createElement('li'),position=document.createElement('span'),name=document.createElement('span'),rate=document.createElement('strong'),bar=document.createElement('progress');
  position.className='position';position.textContent=number(row.globalRank,locale);
  name.className='rank-country';
  const label=document.createElement('span');label.textContent=countryName(row.region,locale);
  if(/^[A-Z]{2}$/.test(row.region)&&row.region!=='XX'){
   const flag=document.createElement('img');flag.className='flag';flag.alt='';flag.setAttribute('aria-hidden','true');flag.width=20;flag.height=15;flag.decoding='async';flag.referrerPolicy='no-referrer';
   flag.onerror=()=>flag.remove();flag.src=`${origin}/flags/${row.region.toLowerCase()}.svg`;name.append(flag);
  }
  name.append(label);rate.className='rate';rate.textContent=`${number(row.ipv6Rate,locale)}%`;
  bar.max=100;bar.value=row.ipv6Rate;bar.setAttribute('aria-label',`${name.textContent}: ${s.ownRate}`);li.append(position,name,rate,bar);return li;
 }));
 text('apnicUpdated',`${s.source}: APNIC Labs · ${s.updated}: ${data?.apnic.dataDate?new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(data.apnic.dataDate)):s.unknown}`);
 // The scope's text is translated locally; the API also reports the exact scope for consumers.
 text('scope',s.rankingScope);
 text('cached',data?.stale?s.cached:'');
 (el('privacy') as HTMLAnchorElement).href=`${origin}/privacy.html`;
 (el('terms') as HTMLAnchorElement).href=`${origin}/terms.html`;
}
async function api(path:string,method='GET'):Promise<Data&{probeUrl?:string|null}> {
 const url=new URL(path,origin);url.searchParams.set('locale',locale);
 const response=await fetch(url,{method,credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(1800),...(method==='POST'?{headers:{'Content-Type':'application/json'},body:'{}'}:{})});
 if(!response.ok)throw new Error(response.status===429?'rateLimit':'networkError');
 return response.json();
}
function apply(value:Data) {
 // Late host tool results must not overwrite browser detection or the country counter.
 if(!started){data=value;cardKind=value.cardKind??'combined';requestedCountry=value.requestedCountry??null;}
 if(value.locale)locale=normalizeLocale(value.locale);
 // Only the trusted App origin (or the current standalone origin) can be contacted.
 if(value.apiOrigin==='https://app.17nas.com')origin=value.apiOrigin;
 probeUrl=value.probeUrl??probeUrl;
 render();
 if(connected&&!started)void start();
}
async function refresh() {
 loading=true;render();
 try {const [result,config]=await Promise.allSettled([api('/api/ipv6-rank'+(requestedCountry?'?region='+encodeURIComponent(requestedCountry):'')),hasProbe()?api('/api/config'):Promise.resolve({probeUrl:null})]);
  if(result.status==='fulfilled')data=result.value;
  if(config.status==='fulfilled')probeUrl=config.value.probeUrl??null;
  errorKey=result.status==='rejected'?'statsError':'';
 }
 catch(e){errorKey=e instanceof Error?e.message:'networkError';}
 finally{loading=false;render();}
}
async function check() {
 if(busy||loading)return;
 busy=true;checked=true;clientStatus='unknown';errorKey='';render();
 try {
  const probe=async()=>{
   if(!probeUrl)return 'unknown';
   try {const url=new URL(probeUrl);if(url.protocol!=='https:'||!url.hostname.endsWith('.17nas.com'))return 'unknown';
    const response=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(1800)});
    if(!response.ok)return 'unknown';const result=await response.json();return result.ipv6Status==='supported'?'supported':'unknown';
   }catch{return 'unknown';}
  };
  // Count failures must not discard a successful connectivity probe (or vice versa).
  const [query,status]=await Promise.allSettled([api('/api/ipv6-query','POST'),probe()]);
  clientStatus=status.status==='fulfilled'?status.value:'unknown';
  if(query.status==='fulfilled')data={...query.value,ipv6Status:clientStatus};
  else {if(data)data={...data,ipv6Status:clientStatus,myRank:null,todayQueries:null};errorKey=query.reason instanceof Error&&query.reason.message==='rateLimit'?'rateLimit':'queryUnavailable';}
  if(!errorKey&&clientStatus==='unknown')errorKey=probeUrl?'probeUnknown':'probeMissing';
  if(connected) {
   // Whitelist model context: no addresses, identifiers or request headers.
   const context={ipv6Status:clientStatus,region:data?.region??'XX',myRank:query.status==='fulfilled'?query.value.myRank:null,countryIpv6Rate:data?.apnic.ipv6Rate??null,source:'APNIC Labs',dataDate:data?.apnic.dataDate??null};
   void app.updateModelContext({content:[{type:'text',text:JSON.stringify(context)}]}).catch(()=>{});
  }
 }catch(e){errorKey=e instanceof Error?e.message:'networkError';}
 finally{busy=false;render();}
}
el('check').onclick=check;
app.ontoolresult=({structuredContent})=>{if(structuredContent)apply(structuredContent as Data);};
app.onhostcontextchanged=context=>{if(context.locale)locale=normalizeLocale(context.locale);render();};
render();
if(window.openai?.toolOutput)apply(window.openai.toolOutput);
if(window.parent!==window) {
 try {await Promise.race([app.connect(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('HOST_TIMEOUT')),1800))]);connected=true;locale=normalizeLocale(app.getHostContext()?.locale??window.openai?.locale);render();}
 catch {errorKey='networkError';render();}
}
async function start() {
 if(started)return;started=true;
 if(cardKind==='nat'){loading=false;render();return;}
 if(cardKind==='statistics'){await refresh();return;}
 if(cardKind==='network') {
  try{data=await api('/api/ipv6-query','POST');checked=true;
   if(connected)void app.updateModelContext({content:[{type:'text',text:JSON.stringify({region:data.region,source:'Current browser request',ipAndAsnNotAvailable:true})}]}).catch(()=>{});
  }
  catch(e){errorKey=e instanceof Error?e.message:'networkError';}
  finally{loading=false;render();}
  return;
 }
 await refresh();await check();
}
// Embedded cards wait for their tool payload, so NAT/statistics never accidentally probe.
if(window.parent===window||data)await start();
