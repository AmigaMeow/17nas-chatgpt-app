import type { BrowserConnection } from '../src/index';
import flagCodes from './flag-codes.json';
import { App } from '@modelcontextprotocol/ext-apps';
import { countryName,normalizeLocale,number,strings,type Locale } from '../src/i18n';
import { connectionResult } from './connection-result';

type CardKind='connection'|'network'|'nat'|'statistics'|'combined';
type Data={region:string;ipv6Status:string;ipv6Rate:number|null;sampleCount:number;status:string;updatedAt:string|null;stale:boolean;statisticsAvailable:boolean;globalRank:number|null;apnic:{ipv6Rate:number|null;globalRate:number|null;dataDate:string|null;rankingScope:string|null;top5:{region:string;ipv6Rate:number;globalRank:number}[]}}&{cardKind?:CardKind;requestedCountry?:string|null;probeUrl?:string|null;apiOrigin?:string;locale?:string;localeSource?:'conversation'|'host';connection?:BrowserConnection};
declare global {interface Window {openai?:{locale?:string;toolOutput?:Data;notifyIntrinsicHeight?:(height:number)=>void;sendFollowUpMessage?:(message:{prompt:string})=>Promise<void>};}}
let locale:Locale=normalizeLocale(window.openai?.locale);
let data:Data|undefined, busy=false, loading=true, errorKey='', connected=false, checked=false;
let clientStatus='unknown',conversationLocale=false;
const observations=new Map<string,{protocol:'IPv4'|'IPv6';requestMs:number}>();
function observe(value:{connection?:BrowserConnection},requestMs:number){if(value.connection&&['IPv4','IPv6'].includes(value.connection.protocol))observations.set(value.connection.protocol,{protocol:value.connection.protocol,requestMs});}
let measurement:ReturnType<typeof connectionResult>|undefined,sharing=false,shareFeedback='';
function canShare(){return !!((connected&&app.getHostCapabilities()?.message)||window.openai?.sendFollowUpMessage);}
async function publishContext(){
 if(!connected||!started||(!hasProbe()&&cardKind!=='network')||!app.getHostCapabilities()?.updateModelContext)return;
 const value=measurement??{kind:'browser_network_measurement',status:'pending',note:'The browser check is running. Do not use any earlier measurement or infer country, city, IP, ASN or protocol status.'};
 try{await app.updateModelContext({structuredContent:value,content:[{type:'text',text:JSON.stringify(value)}]});}catch{/* The card remains usable if the host does not accept context updates. */}
}
async function shareResults(){
 if(!measurement||busy||loading||sharing)return;
 const result=measurement;
 sharing=true;shareFeedback='';render();
 const prompt=strings(locale).sharePrompt+'\n'+JSON.stringify(result);
 try{
  if(connected&&app.getHostCapabilities()?.message){
   await publishContext();
   const response=await app.sendMessage({role:'user',content:[{type:'text',text:prompt}]});
   if(response.isError)throw new Error('messageRejected');
  }else if(window.openai?.sendFollowUpMessage){await window.openai.sendFollowUpMessage({prompt});}
  else{throw new Error('messageUnavailable');}
  shareFeedback='shareSent';
 }catch{shareFeedback='shareFailed';}
 finally{sharing=false;render();}
}
let cardKind:CardKind='combined',requestedCountry:string|null=null,started=false;
const hasProbe=()=>cardKind==='connection'||cardKind==='combined';
declare const APP_PUBLIC_ORIGIN:string;
let origin=window.parent!==window?APP_PUBLIC_ORIGIN:location.origin,probeUrl:string|null=null;
const app=new App({name:'17NAS IPv6 Checker & Stats',version:'0.2.1'},{},{autoResize:false});
const supportedFlags=new Set(flagCodes);
// Measure content, never the host viewport: a tall iframe must also shrink on collapse.
let resizePending=false,lastSize='';
function notifyHeight() {
 if(resizePending)return;resizePending=true;
 requestAnimationFrame(()=>{
  resizePending=false;
  const card=document.querySelector('.card')!;
  const height=Math.ceil(card.getBoundingClientRect().bottom+parseFloat(getComputedStyle(document.body).paddingBottom));
  const width=window.innerWidth,key=`${connected}:${width}:${height}`;
  if(key===lastSize)return;lastSize=key;
  if(connected)void app.sendSizeChanged({width,height}).catch(()=>{lastSize='';});
  else {try{window.openai?.notifyIntrinsicHeight?.(height);}catch{lastSize='';}}
 });
}
new ResizeObserver(notifyHeight).observe(document.querySelector('.card')!);
document.addEventListener('toggle',notifyHeight,true);
window.addEventListener('resize',notifyHeight);
const el=(id:string)=>document.getElementById(id)!;
const text=(id:string,value:string)=>{el(id).textContent=value;};
const format=(key:keyof ReturnType<typeof strings>,args:Record<string,string>={})=>{
 let value=strings(locale)[key];for(const [k,v]of Object.entries(args))value=value.replaceAll(`{${k}}`,v);return value;
};
function date(value:string|null|undefined) {
 if(!value)return strings(locale).unknown;
 return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(value));
}
// One asset lookup and fallback for attribution and ranking cards.
function countryFlag(region:string):HTMLElement {
 const code=region.toLowerCase();
 const fallback=()=>{const placeholder=document.createElement('span');placeholder.className='flag flag-fallback';placeholder.textContent=/^[a-z]{2}$/.test(code)?code.toUpperCase():'–';placeholder.setAttribute('aria-hidden','true');return placeholder;};
 if(!supportedFlags.has(code))return fallback();
 const flag=document.createElement('img');flag.className='flag';flag.alt='';flag.setAttribute('aria-hidden','true');flag.width=20;flag.height=15;flag.decoding='async';flag.referrerPolicy='no-referrer';
 flag.onerror=()=>flag.replaceWith(fallback());flag.src=`${origin}/flags/${code}.svg`;return flag;
}
function render() {
 document.documentElement.lang=locale;
 const s=strings(locale);
 for(const id of ['title','aboutData','sampleDetails','sampleContext','ownTitle','apnicTitle','footerSummary','diagnosticsTitle','details','privacy','terms','connectionTitle','networkTitle','networkHelp','natTitle','natDescription','natCaveat','natLink'])text(id,s[id as keyof typeof s]);
 renderConnections();
 text('translation',s._status==='pending_professional_translation'?s.translationPending:'');
 el('detection').hidden=!hasProbe();
 el('check').hidden=!hasProbe();
 el('networkPanel').hidden=cardKind!=='network'&&cardKind!=='combined';
 el('natPanel').hidden=cardKind!=='nat';
 el('statisticsPanel').hidden=cardKind!=='statistics';
 el('sourceDetails').hidden=cardKind!=='statistics';
 el('regionalContext').hidden=cardKind!=='statistics';
 el('checkHelp').hidden=!hasProbe();
 el('country').hidden=cardKind==='nat'||cardKind==='statistics';
 const state=busy||loading?'checking':clientStatus;
 el('status').dataset.state=state;
 text('status',busy||loading?s.checking:state==='supported'?s.supported:state==='unsupported'?s.unsupported:s.unverified);
 text('check',s.recheck);(el('check') as HTMLButtonElement).disabled=busy||loading;
 el('share').hidden=(!hasProbe()&&cardKind!=='network')||!canShare();
 text('share',sharing?s.sharingResults:s.shareResults);
 (el('share') as HTMLButtonElement).disabled=busy||loading||sharing||!measurement;
 text('shareFeedback',shareFeedback?s[shareFeedback as 'shareSent'|'shareFailed']:'');
 el('shareHelp').hidden=el('share').hidden; text('shareHelp',s.shareHelp);
 text('loading',loading?(cardKind==='network'?s.networkPending:hasProbe()?s.checking:s.loading):'');
 text('checkHelp',!checked?s.checkHelp:state==='supported'?s.supportedHelp:state==='unsupported'?s.unsupportedHelp:s.unverifiedHelp);
 if(busy||loading)text('checkHelp',s.checking);
 const region=countryName(data?.region??'XX',locale);
 const baseError=errorKey?s[errorKey as keyof typeof s]??s.networkError:(!loading&&cardKind==='statistics'&&data&&!data.statisticsAvailable?s.statsError:'');
 text('error',baseError);
 el('diagnostics').hidden=!el('error').textContent;
 text('country',`${s.region}: ${region}`);
 text('networkRegion',loading?s.networkPending:region);
 el('networkFlag').hidden=loading;el('networkFlag').replaceChildren(countryFlag(data?.region??'XX'));
 (el('details') as HTMLAnchorElement).hidden=cardKind!=='statistics';
 text('regionalTitle',format('regionalTitle',{region}));
 text('regionalContext',s.regionalContext);
 const regionalRate=data?.apnic?.ipv6Rate;
 const hasOwnRate=typeof data?.sampleCount==='number'&&Number.isFinite(data.sampleCount)&&data.sampleCount>=300&&data?.ipv6Rate!=null&&data.status==='available';
 el('sampleModule').hidden=cardKind!=='statistics'||!hasOwnRate;
 el('regionalPanel').hidden=loading;
 el('regionalRate').hidden=loading;
 text('regionalRate',regionalRate!=null?`${s.regionalRate}: ${number(regionalRate,locale)}%`:s.regionalMissing);
 const regionalProgress=el('regionalProgress') as HTMLProgressElement;
 regionalProgress.hidden=regionalRate==null;if(regionalRate!=null)regionalProgress.value=regionalRate;regionalProgress.setAttribute('aria-label',s.regionalRate);
 const globalRate=data?.apnic?.globalRate;
 el('globalPanel').hidden=cardKind!=='statistics';
 text('globalTitle',s.globalTitle);
 text('globalRate',globalRate!=null?`${number(globalRate,locale)}%`:s.globalUnavailable);
 const globalProgress=el('globalProgress') as HTMLProgressElement;
 globalProgress.hidden=globalRate==null;if(globalRate!=null)globalProgress.value=globalRate;
 globalProgress.setAttribute('aria-label',s.globalTitle);
 text('globalUpdated',`${s.source}: APNIC Labs · ${s.updated}: ${data?.apnic?.dataDate?new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(data.apnic.dataDate)):s.unknown}`);
 const difference=regionalRate!=null&&globalRate!=null?Math.round((regionalRate-globalRate)*100)/100:null;
 text('comparison',difference==null?'':difference===0?s.equalGlobal:format(difference>0?'aboveGlobal':'belowGlobal',{difference:number(Math.abs(difference),locale)}));
 text('countryRank',data?.globalRank?format('globalRank',{rank:number(data.globalRank,locale)}):'');
 text('ownRate',data?.ipv6Rate!=null?`${s.ownRate}: ${number(data.ipv6Rate,locale)}%`:'');
 const progress=el('progress') as HTMLProgressElement;progress.hidden=data?.ipv6Rate==null;if(data?.ipv6Rate!=null)progress.value=data.ipv6Rate;progress.setAttribute('aria-label',s.ownRate);
 text('samples',format('samples',{count:number(data?.sampleCount??0,locale)}));
 text('topMissing',s.rankingUnavailable);el('topMissing').hidden=loading||!!(data?.apnic?.top5?.length);
 text('ownUpdated',`${s.source}: 17NAS · ${s.updated}: ${date(data?.updatedAt)}`);
 el('top').replaceChildren(...(data?.apnic?.top5??[]).map(row=>{
  const li=document.createElement('li'),position=document.createElement('span'),name=document.createElement('span'),rate=document.createElement('strong'),bar=document.createElement('progress');
  position.className='position';position.textContent=number(row.globalRank,locale);
  name.className='rank-country';
  const label=document.createElement('span');label.textContent=countryName(row.region,locale);
  name.append(countryFlag(row.region));
  name.append(label);rate.className='rate';rate.textContent=`${number(row.ipv6Rate,locale)}%`;
  bar.max=100;bar.value=row.ipv6Rate;bar.setAttribute('aria-label',`${name.textContent}: ${s.ownRate}`);li.append(position,name,rate,bar);return li;
 }));
 text('apnicUpdated',`${s.source}: APNIC Labs · ${s.updated}: ${data?.apnic?.dataDate?new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(data.apnic.dataDate)):s.unknown}`);
 // The scope's text is translated locally; the API also reports the exact scope for consumers.
 text('scope',s.rankingScope);
 text('cached',data?.stale?s.cached:'');
 (el('privacy') as HTMLAnchorElement).href=`${origin}/privacy.html`;
 (el('terms') as HTMLAnchorElement).href=`${origin}/terms.html`;
 notifyHeight();
}
async function api(path:string,method='GET'):Promise<Data&{probeUrl?:string|null}> {
 const url=new URL(path,origin);url.searchParams.set('locale',locale);
 const response=await fetch(url,{method,credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(5000),...(method==='POST'?{headers:{'Content-Type':'application/json'},body:'{}'}:{})});
 if(!response.ok)throw new Error(response.status===429?'rateLimit':'networkError');
 return response.json();
}
function apply(value:Data) {
 // Late host tool results must not overwrite browser detection or the country result.
 if(!started){data=value;cardKind=value.cardKind??'combined';requestedCountry=value.requestedCountry??null;}
 if(value.locale){locale=normalizeLocale(value.locale);conversationLocale=value.localeSource==='conversation';}
 // Only the trusted App origin (or the current standalone origin) can be contacted.
 if(value.apiOrigin===APP_PUBLIC_ORIGIN)origin=value.apiOrigin;
 probeUrl=value.probeUrl??probeUrl;
 render();
 if(!started)void start();
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
async function readConnection(){
 const began=performance.now();
 const result=await api('/api/network');
 observe(result,Math.round(performance.now()-began));
 return result;
}
function renderConnections(){
 const visible=hasProbe()||cardKind==='network',s=strings(locale);
 el('networkResults').hidden=!visible;
 const v4=observations.has('IPv4'),v6=observations.has('IPv6');
 const summaryEl=el('connectionSummary');
 if(busy||loading){
  summaryEl.textContent=s.checking;
 }else if(v4&&v6){
  summaryEl.textContent=s.dualStack;
 }else if(v4&&clientStatus==='unsupported'){
  const v4Tag=document.createElement('span');v4Tag.className='summary-item success';v4Tag.textContent=`✓ ${s.ipv4} ${s.observed}`;
  const sep=document.createElement('span');sep.className='summary-sep';sep.textContent=' · ';
  const v6Tag=document.createElement('span');v6Tag.className='summary-item failure';v6Tag.textContent=`✕ ${s.unsupported}`;
  summaryEl.replaceChildren(v4Tag,sep,v6Tag);
 }else if(v4){
  summaryEl.textContent=s.observedV4;
 }else if(v6){
  summaryEl.textContent=s.observedV6;
 }else{
  summaryEl.textContent=s.connectionUnknown;
 }
 text('connectionAdvice',busy||loading?'':clientStatus==='supported'?s.networkAdvice:clientStatus==='unsupported'?s.natAdviceUnsupported:s.natAdvice);
 text('protocolDetails',s.measurementDetails);
 const statusNote=clientStatus==='supported'?s.supportedHelp:clientStatus==='unsupported'?s.unsupportedHelp:clientStatus==='unknown'?s.unverifiedHelp:'';
 text('protocolNote',statusNote?`${statusNote}

${s.protocolNote}`:s.protocolNote);
 el('protocolRows').replaceChildren(...['IPv4','IPv6'].map(protocol=>{
  const row=document.createElement('div');row.className='protocol-row';
  const labelGroup=document.createElement('div');labelGroup.className='protocol-label';
  const label=document.createElement('strong');label.textContent=protocol;
  const item=observations.get(protocol);
  const statusEl=document.createElement('span');
  statusEl.className=item?'protocol-status':'protocol-status unverified';
  if(item){statusEl.className='protocol-status';statusEl.textContent=s.observed;}else if(busy||loading){statusEl.className='protocol-status unverified';statusEl.textContent=s.checking;}else if(protocol==='IPv6'&&clientStatus==='unsupported'){statusEl.className='protocol-status unsupported';statusEl.textContent=s.protocolUnsupported;}else{statusEl.className='protocol-status unverified';statusEl.textContent=s.notVerified;}
  labelGroup.append(label,statusEl);
  const meta=document.createElement('div');meta.className='protocol-meta muted';
  if(item){
   meta.textContent=format('requestTime',{ms:number(item.requestMs,locale)});
  }
  row.append(labelGroup,meta);return row;
 }));
}
async function check() {
 if(busy||loading)return;
 busy=true;checked=true;clientStatus='unknown';errorKey='';measurement=undefined;shareFeedback='';observations.clear();render();void publishContext();
 let probeError='';
 try {
  const probe=async()=>{
   if(!probeUrl){
    probeError='probeMissing';return 'unknown';
   }
   const began=performance.now();
   try {
    const url=new URL(probeUrl);
    if(url.protocol!=='https:'||!url.hostname.endsWith('.17nas.com')){
     probeError='probeUnknown';return 'unknown';
    }
    const response=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(5000)});
    const ms=Math.round(performance.now()-began);
    if(!response.ok){
     probeError='probeHttp';return 'unknown';
    }
    const result=await response.json();
    if(result.ipv6Status==='supported'&&result.connection?.protocol==='IPv6'){
     observe(result,ms);return 'supported';
    }
    probeError='probeUnknown';return 'unknown';
   }catch(e){
    if(e instanceof DOMException&&e.name==='TimeoutError'){probeError='probeTimeout';return 'unknown';}
    // Fetch TypeError also covers CORS, TLS and sandbox policy failures, not just routing.
    probeError='probeNetwork';return 'unknown';
   }
  };
  const [query,status]=await Promise.allSettled([readConnection(),probe()]);
  const queryOk=query.status==='fulfilled';
  const probeVal=status.status==='fulfilled'?status.value:'unknown';

  clientStatus=probeVal;

  if(queryOk){
   data={...query.value,ipv6Status:clientStatus};
  } else {
   if(data)data={...data,region:'XX',ipv6Status:clientStatus};
   const err=query.reason;
   if(err instanceof DOMException&&err.name==='TimeoutError'){
    errorKey='networkError';
   } else if(err instanceof Error&&err.message==='rateLimit'){
    errorKey='rateLimit';
   } else {
    errorKey='networkError';
   }
  }
  if(!errorKey&&clientStatus==='unknown'){
   errorKey=probeError||'probeUnknown';
  }
 }catch{errorKey='networkError';}
 finally{
  busy=false;
  measurement=connectionResult({region:data?.region,observations:observations.values(),probePerformed:true,probeStatus:clientStatus,errorCode:errorKey});
  render();void publishContext();
 }
}
el('check').onclick=check;
el('share').onclick=shareResults;
app.ontoolresult=({structuredContent})=>{if(structuredContent)apply(structuredContent as Data);};
app.onhostcontextchanged=context=>{if(context.locale&&!conversationLocale)locale=normalizeLocale(context.locale);render();};
render();
if(window.openai?.toolOutput)apply(window.openai.toolOutput);
if(window.parent!==window) {
 try {
  await Promise.race([app.connect(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('HOST_TIMEOUT')),8000))]);
  connected=true;
  if(!conversationLocale)locale=normalizeLocale(app.getHostContext()?.locale??window.openai?.locale);
  render();void publishContext();
 } catch(e) {
  render();
 }
}
async function start() {
 if(started)return;started=true;
 if(cardKind==='nat'){loading=false;render();return;}
 if(cardKind==='statistics'){await refresh();return;}
 if(cardKind==='network') {
  try{data=await readConnection();checked=true;
  }
  catch(e){errorKey=e instanceof Error&&e.message==='rateLimit'?'rateLimit':'networkError';if(data)data={...data,region:'XX'};}
  finally{loading=false;measurement=connectionResult({region:data?.region,observations:observations.values(),probePerformed:false,probeStatus:clientStatus,errorCode:errorKey});render();void publishContext();}
  return;
 }
 try{const config=await api('/api/config');probeUrl=config.probeUrl??probeUrl;}catch{/* A missing configuration leaves the probe unverified. */}
 loading=false;await check();
}
// Embedded cards wait for their tool payload, so NAT/statistics never accidentally probe.
if(window.parent===window||data)await start();
