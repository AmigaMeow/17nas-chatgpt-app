export interface StatsStore { get(key:string,format:'json'):Promise<unknown>; }
export interface CountryStats {sampleCount:number; successes:number; ipv6Rate:number|null; status:'available'|'insufficient_data';}
export interface APNICCountry {region:string; ipv6Rate:number; sampleCount:number; globalRank:number;}
export interface Snapshot {schemaVersion:1; generatedAt:string; own:{source:'17NAS';updatedAt:string;windowDays:30;minimumSamples:300;countries:Record<string,CountryStats>};apnic:{source:'APNIC Labs';updatedAt:string;dataDate:string;rankingScope:string;globalRate:number|null;countries:APNICCountry[]};}
const codes = new Set('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' '));
export const isCountry=(x:unknown):x is string=>typeof x==='string'&&codes.has(x);
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
function exact(value:unknown,keys:string[]) {if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))throw new Error('INVALID_SNAPSHOT');}
export function validateSnapshot(data:unknown): Snapshot {
 exact(data,['schemaVersion','generatedAt','own','apnic']);
 const d=data as Snapshot;
 exact(d.own,['source','updatedAt','windowDays','minimumSamples','countries']);
 exact(d.apnic,['source','updatedAt','dataDate','rankingScope','globalRate','countries']);
 if(!d||d.schemaVersion!==1||!Number.isFinite(Date.parse(d.generatedAt))||d.own?.source!=='17NAS'||d.own.windowDays!==30||d.own.minimumSamples!==300||d.apnic?.source!=='APNIC Labs'||d.apnic.rankingScope!=='countries_and_territories_in_snapshot'||!Number.isFinite(Date.parse(d.own.updatedAt))||!Number.isFinite(Date.parse(d.apnic.updatedAt))||!Number.isFinite(Date.parse(d.apnic.dataDate)))throw new Error('INVALID_SNAPSHOT');
 for(const [code,c] of Object.entries(d.own.countries)) {
  exact(c,['sampleCount','successes','ipv6Rate','status']);
  if(!isCountry(code)||!Number.isSafeInteger(c.sampleCount)||c.sampleCount<0||!Number.isSafeInteger(c.successes)||c.successes<0||c.successes>c.sampleCount)throw new Error('INVALID_SNAPSHOT');
  if(c.sampleCount<300?(c.ipv6Rate!==null||c.status!=='insufficient_data'):(!finite(c.ipv6Rate)||Math.abs(c.ipv6Rate-Math.round(c.successes/c.sampleCount*1000)/10)>0.01||c.status!=='available'))throw new Error('INVALID_SNAPSHOT');
 }
 const seen=new Set<string>();
 for(const c of d.apnic.countries){exact(c,['region','ipv6Rate','sampleCount','globalRank']);if(!isCountry(c.region)||seen.has(c.region)||!finite(c.ipv6Rate)||c.ipv6Rate<0||c.ipv6Rate>100||!Number.isSafeInteger(c.sampleCount)||c.sampleCount<0||!Number.isSafeInteger(c.globalRank)||c.globalRank!==1+d.apnic.countries.filter(x=>x.ipv6Rate>c.ipv6Rate).length)throw new Error('INVALID_SNAPSHOT');seen.add(c.region);}
 if(d.apnic.globalRate!==null&&(!finite(d.apnic.globalRate)||d.apnic.globalRate<0||d.apnic.globalRate>100))throw new Error('INVALID_SNAPSHOT');
 return d;
}
export async function loadStats(kv:StatsStore,now=Date.now()) {
 for(const key of ['stats:fresh','stats:last-good']){
  try {const raw=await kv.get(key,'json'); if(!raw)continue; const data=validateSnapshot(raw);const age=Math.max(now-Date.parse(data.generatedAt),now-Date.parse(data.own.updatedAt));if(Date.parse(data.generatedAt)>now+300000||Date.parse(data.own.updatedAt)>now+300000||age>86400000)continue;return {data,stale:age>3600000};}catch{/* Never log exception payloads. */}
 }
 return null;
}
export function statsFor(snapshot:Snapshot|null,region:string,stale=false) {
 const own=snapshot?.own.countries[region];
 const apnic=snapshot?.apnic.countries.find(c=>c.region===region);
 return {region,ipv6Status:'unknown' as string,ipv6Rate:own?.ipv6Rate??null,sampleCount:own?.sampleCount??0,status:own?.status??'insufficient_data',source:'17NAS',updatedAt:snapshot?.own.updatedAt??null,windowDays:30,minimumSamples:300,globalRank:apnic?.globalRank??null,apnic:{source:'APNIC Labs',ipv6Rate:apnic?.ipv6Rate??null,globalRate:snapshot?.apnic.globalRate??null,dataDate:snapshot?.apnic.dataDate??null,updatedAt:snapshot?.apnic.updatedAt??null,rankingScope:snapshot?.apnic.rankingScope??null,top5:snapshot?.apnic.countries.toSorted((a,b)=>a.globalRank-b.globalRank||a.region.localeCompare(b.region)).slice(0,5)??[]},stale,statisticsAvailable:!!snapshot};
}
