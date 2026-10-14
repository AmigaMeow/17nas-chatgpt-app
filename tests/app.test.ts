import { describe,it,expect } from 'vitest';
import { env } from 'cloudflare:workers';
import { runInDurableObject } from 'cloudflare:test';
import worker from '../src/index';
import type { AppEnv } from '../src/index';
import { fingerprints } from '../src/privacy';
import { validateSnapshot,statsFor,loadStats } from '../src/stats';
import { normalizeLocale } from '../src/i18n';
import snapshot from './fixtures/snapshot.json';
const bindings=env as unknown as AppEnv;
const secret='test-only-secret-with-more-than-32-characters';
const time=Date.parse('2026-10-14T12:00:00Z');
describe('Country aggregation and privacy',()=>{
 it('assigns consecutive ordinals to concurrent queries and deduplicates repeats',async()=>{
  const stub=bindings.COUNTERS.get(bindings.COUNTERS.idFromName('counter-concurrency'));
  const fps=await Promise.all(Array.from({length:15},(_,i)=>fingerprints(`198.51.100.${i}`,secret,time)));
  const results=await Promise.all(fps.map(fp=>stub.visit(fp,true,time)));
  expect(results.map(r=>r.myRank).sort((a,b)=>a!-b!)).toEqual(Array.from({length:15},(_,i)=>i+1));
  const repeat=await stub.visit(fps[0],true,time+1000);expect(repeat.counted).toBe(false);expect(repeat.todayQueries).toBe(15);
  await runInDurableObject(stub,async(instance,state)=>{const rows=state.storage.sql.exec('SELECT * FROM totals').toArray();expect(rows).toEqual([{day:'2026-10-14',total:15}]);});
 });
 it('deduplicates across UTC midnight without attributing yesterday rank to today',async()=>{
  const stub=bindings.COUNTERS.get(bindings.COUNTERS.idFromName('counter-midnight'));
  const before=Date.parse('2026-10-14T23:59:00Z');await stub.visit(await fingerprints('198.51.100.100',secret,before),true,before);
  const after=before+120000;const repeat=await stub.visit(await fingerprints('198.51.100.100',secret,after),true,after);
  expect(repeat.counted).toBe(false);expect(repeat.myRank).toBeNull();expect(repeat.todayQueries).toBe(0);
 });
 it('limits the eleventh request in one minute',async()=>{
  const stub=bindings.COUNTERS.get(bindings.COUNTERS.idFromName('counter-limit'));const fp=await fingerprints('198.51.100.101',secret,time);
  for(let i=0;i<10;i++)expect((await stub.visit(fp,false,time)).limited).toBe(false);
  expect((await stub.visit(fp,false,time)).limited).toBe(true);
 });
 it('rejects IP parameters, invalid JSON, and never echoes source addresses',async()=>{
  const req=(path:string,init:RequestInit={})=>new Request('https://app.17nas.com'+path,{...init,headers:{'CF-Connecting-IP':'198.51.100.222',...init.headers}});
  expect((await worker.fetch(req('/api/ipv6-rank?ip=1.2.3.4'),bindings)).status).toBe(400);
  expect((await worker.fetch(req('/api/ipv6-query',{method:'POST',body:'{broken'}),bindings)).status).toBe(400);
  const result=await worker.fetch(req('/api/ipv6-rank'),bindings);expect(result.status).toBe(200);expect(await result.text()).not.toContain('198.51.100.222');
 });
});
describe('Separated statistical sources',()=>{
 it('does not substitute APNIC rates for insufficient own samples',()=>{
  const data=validateSnapshot(snapshot);const us=statsFor(data,'US');expect(us.ipv6Rate).toBeNull();expect(us.status).toBe('insufficient_data');expect(us.apnic.ipv6Rate).not.toBeNull();
  expect(statsFor(data,'CN').ipv6Rate).toBeGreaterThan(0);
 });
 it('rejects unexpected fields in exported snapshots',()=>{expect(()=>validateSnapshot({...snapshot,ip:'1.2.3.4'})).toThrow();});
 it('uses last-good data within 24 hours, rejects expired source data',async()=>{
  await bindings.STATS.put('stats:last-good',JSON.stringify(snapshot));const generated=Date.parse(snapshot.generatedAt);
  expect((await loadStats(bindings.STATS,generated+7200000))?.stale).toBe(true);
  expect(await loadStats(bindings.STATS,generated+86400001)).toBeNull();
 });
 it('maps Chinese variants and falls back to English for unknown locales',()=>{expect(normalizeLocale('zh-HK')).toBe('zh-TW');expect(normalizeLocale('zh')).toBe('zh-CN');expect(normalizeLocale('xx-AA')).toBe('en');});
});

describe('App MCP protocol',()=>{
 const rpc=async(method:string,params:unknown={})=>{
  const response=await worker.fetch(new Request('https://app.17nas.com/mcp',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}),bindings);
  expect(response.status).toBe(200);return response.json() as Promise<any>;
 };
 it('initializes and exposes the card without using host IP or counting',async()=>{
  const init=await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}});expect(init.result.serverInfo.name).toContain('17NAS');
  const list=await rpc('tools/list');expect(list.result.tools.map((t:any)=>t.name)).toEqual(['check_network']);
  const call=await rpc('tools/call',{name:'check_network',arguments:{locale:'zh-HK'}});expect(call.error).toBeUndefined();expect(call.result.structuredContent.locale).toBe('zh-TW');expect(call.result.structuredContent.region).toBe('XX');expect(call.result.structuredContent.myRank).toBeNull();
  const resource=await rpc('resources/read',{uri:'ui://17nas/ipv6-card.html'});expect(resource.result.contents[0].text).toContain('<html');
  const meta=resource.result.contents[0]._meta;
  expect(meta.ui.csp.resourceDomains).toEqual([bindings.PUBLIC_ORIGIN]);
  expect(meta['openai/widgetCSP'].resource_domains).toEqual([bindings.PUBLIC_ORIGIN]);
 });
});
