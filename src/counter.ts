import { DurableObject } from 'cloudflare:workers';
import type { Fingerprints } from './privacy';
export interface CounterEnv { ABUSE: KVNamespace; }
interface Seen { day:string; rank:number; expires:number; }
export class CountryCounter extends DurableObject<CounterEnv> {
 private recent = new Map<string,Seen>();
 private rates = new Map<string,{count:number;expires:number}>();
 constructor(ctx:DurableObjectState,env:CounterEnv) {
  super(ctx,env);
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS totals (day TEXT PRIMARY KEY, total INTEGER NOT NULL)');
 }
 private total(day:string) {
  return this.ctx.storage.sql.exec<{total:number}>('SELECT total FROM totals WHERE day = ?',day).toArray()[0]?.total??0;
 }
 async read(now=Date.now()) {return {todayQueries:this.total(new Date(now).toISOString().slice(0,10)),myRank:null};}
 async visit(fp:Fingerprints,count:boolean,now=Date.now()) {
  return this.ctx.blockConcurrencyWhile(async ()=> {
   const day=new Date(now).toISOString().slice(0,10);
   for(const [key,value] of this.recent) if(value.expires<=now)this.recent.delete(key);
   for(const [key,value] of this.rates) if(value.expires<=now)this.rates.delete(key);
   // The SQL store never contains request identifiers: only UTC day and a total.
   let rate=this.rates.get(fp.rate);
   if(!rate) {
    const slots=await Promise.all(Array.from({length:10},(_,i)=>this.env.ABUSE.get(`rate:${fp.rate}:${i}`)));
    rate={count:slots.filter(Boolean).length,expires:(Math.floor(now/60000)+1)*60000};
   }
   if(rate.count>=10)return {limited:true,todayQueries:this.total(day),myRank:null};
   // A new key per request avoids KV's one write/second limit on the same key.
   await this.env.ABUSE.put(`rate:${fp.rate}:${rate.count}`,'1',{expirationTtl:60});
   rate.count++;this.rates.set(fp.rate,rate);
   if(!count)return {limited:false,todayQueries:this.total(day),myRank:null};
   for(const hash of [fp.current,fp.previous]) {
    const key=`count:${hash}`;
    let seen=this.recent.get(key);
    if(!seen)seen=await this.env.ABUSE.get<Seen>(key,'json')??undefined;
    if(seen&&seen.expires>now) {
     this.recent.set(key,seen);
     return {limited:false,rank:seen.day===day?seen.rank:null,myRank:seen.day===day?seen.rank:null,total:this.total(day),todayQueries:this.total(day),counted:false};
    }
   }
   const rank=this.total(day)+1;
   const seen={day,rank,expires:now+3600000};
   // Fail closed if the abuse store is unavailable. Cross-store writes are not a transaction.
   await this.env.ABUSE.put(`count:${fp.current}`,JSON.stringify(seen),{expirationTtl:3600});
   this.ctx.storage.transactionSync(()=>{
    this.ctx.storage.sql.exec('INSERT INTO totals(day,total) VALUES (?,1) ON CONFLICT(day) DO UPDATE SET total=total+1',day);
    this.ctx.storage.sql.exec('DELETE FROM totals WHERE day < ?',new Date(now-29*86400000).toISOString().slice(0,10));
   });
   this.recent.set(`count:${fp.current}`,seen);
   await this.ctx.storage.setAlarm((Math.floor(now/86400000)+1)*86400000);
   return {limited:false,rank,myRank:rank,total:rank,todayQueries:rank,counted:true};
  });
 }
 async alarm() {
  const now=Date.now();
  this.ctx.storage.sql.exec('DELETE FROM totals WHERE day < ?',new Date(now-29*86400000).toISOString().slice(0,10));
  if(this.ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) as n FROM totals').one().n>0)
   await this.ctx.storage.setAlarm((Math.floor(now/86400000)+1)*86400000);
 }
}
