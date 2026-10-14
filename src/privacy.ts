export interface Fingerprints { rate: string; current: string; previous: string; }
const encoder = new TextEncoder();
async function mac(secret: BufferSource, value: string) {
 const key = await crypto.subtle.importKey('raw', secret, {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
 return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}
const hex = (bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function fingerprints(source:string, secret:string, now:number):Promise<Fingerprints> {
 if(secret.length < 32 || !source) throw new Error('SOURCE_UNAVAILABLE');
 const hour = Math.floor(now/3600000), minute = Math.floor(now/60000);
 const digest = async (purpose:string, interval:number, timestamp:number)=> {
  const day = new Date(timestamp).toISOString().slice(0,10);
  const dailyKey = await mac(encoder.encode(secret), `17nas-app:${day}`);
  return hex(await mac(dailyKey, `${purpose}:${interval}:${source}`));
 };
 const [rate,current,previous] = await Promise.all([
  digest('rate',minute,now),digest('count',hour,now),digest('count',hour-1,now-3600000)
 ]);
 return {rate,current,previous};
}
