import {describe,it,expect,vi,afterEach} from 'vitest';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {handleRequest,type AppEnv,type NetworkContext} from '../src/index';
import snapshot from './fixtures/snapshot.json';
process.env.APP_NO_START='1';
const {RateLimiter,sourceAddress,FileStats}=await import('../src/server');
const env:AppEnv={STATS:{get:async()=>snapshot},ASSETS:{fetch:async()=>new Response('asset')},PUBLIC_ORIGIN:'https://app.17nas.com',IPV6_PROBE_URL:'',RELEASE:'0.1.0'};
const request=(path:string,context:NetworkContext={region:'US',ipv6:false,limited:false},method='GET')=>handleRequest(new Request(env.PUBLIC_ORIGIN+path,{method}),env,context);
afterEach(()=>vi.useRealTimers());
describe('Isolated server API',()=>{
 it('has no count endpoint, ordinal or plaintext address output',async()=>{
  expect((await request('/api/ipv6-query',undefined,'POST')).status).toBe(404);
  const body=await(await request('/api/network')).json();
  expect(body.region).toBe('US');expect(body.ipv6Status).toBe('unknown');
  expect(body).not.toHaveProperty('myRank');expect(body).not.toHaveProperty('todayQueries');expect(body).not.toHaveProperty('ip');expect(body).not.toHaveProperty('address');expect(body).not.toHaveProperty('asn');
  expect((await request('/api/network?ip=1.2.3.4')).status).toBe(400);
 });
 it('returns only protocol capability on dedicated no-store responses without IP or ASN',async()=>{
  const connection={protocol:'IPv4' as const};
  const context={region:'US',ipv6:false,limited:false,connection};
  const response=await request('/api/network',context);expect(response.headers.get('Cache-Control')).toBe('no-store');
  const body=await response.json();
  expect(body.connection).toEqual(connection);
  expect(body.connection).not.toHaveProperty('address');
  expect(body.connection).not.toHaveProperty('asn');
  expect(body.connection).not.toHaveProperty('city');
  for(const path of ['/api/config','/api/ipv6-rank','/api/probe']){
   const text=await(await request(path,context)).text();
   expect(text).not.toContain('address');
   expect(text).not.toContain('asn');
  }
  const probe=await request('/api/probe',{...context,ipv6:true,connection:{protocol:'IPv6'}});
  const probeBody=await probe.json();
  expect(probeBody.connection).toEqual({protocol:'IPv6'});
  expect(probeBody.connection).not.toHaveProperty('address');
 });
 it('only confirms supported on a verified IPv6 connection',async()=>{
  expect(await(await request('/api/probe')).json()).toEqual({ipv6Status:'unknown'});
  expect(await(await request('/api/probe',{region:'US',ipv6:true,limited:false})).json()).toEqual({ipv6Status:'supported'});
  expect((await(await request('/api/network',{region:'',ipv6:false,limited:false})).json()).region).toBe('XX');
 });
 it('responds with CORS and localized rate errors',async()=>{
  const response=await request('/api/network?locale=zh-CN',{region:'US',ipv6:false,limited:true});
  expect(response.status).toBe(429);expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');expect(response.headers.get('Retry-After')).toBe('60');
  expect((await response.json()).error.message).toMatch(/[\u4e00-\u9fff]/);
 });
 it('limits ten requests and discards minute identifiers',()=>{
  const limiter=new RateLimiter();for(let n=0;n<10;n++)expect(limiter.limited('192.0.2.1',60000)).toBe(false);
  expect(limiter.limited('192.0.2.1',60000)).toBe(true);expect(limiter.limited('192.0.2.2',60000)).toBe(false);expect(limiter.limited('192.0.2.1',120000)).toBe(false);
 });
 it('expires abuse identifiers during idle periods without another request',()=>{
  vi.useFakeTimers();vi.setSystemTime(60001);const limiter=new RateLimiter();limiter.limited('192.0.2.1');
  expect((limiter as any).entries.size).toBe(1);const secret=(limiter as any).secret;
  vi.advanceTimersByTime(59999);
  expect((limiter as any).entries.size).toBe(0);expect((limiter as any).secret).not.toEqual(secret);
  expect(limiter.limited('192.0.2.1')).toBe(false);
 });
 it('does not trust a remote caller geo header',()=>{
  const req:any={socket:{remoteAddress:'192.0.2.1'},headers:{'x-17nas-source-ip':'2001:db8::1'}};
  expect(sourceAddress(req,true)).toBe('192.0.2.1');req.socket.remoteAddress='127.0.0.1';expect(sourceAddress(req,true)).toBe('2001:db8::1');expect(sourceAddress(req,false)).toBe('127.0.0.1');
 });
 it('uses a validated own copy, keeps last good on a broken refresh',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'app-stats-'));const path=join(dir,'snapshot.json');
  try{
   const now=Date.parse(snapshot.generatedAt);vi.useFakeTimers();vi.setSystemTime(now);
   await writeFile(path,JSON.stringify(snapshot));const store=new FileStats(path);expect(await store.get('stats:fresh','json')).toEqual(snapshot);
   await writeFile(path,JSON.stringify({...snapshot,ip:'192.0.2.1'}));vi.setSystemTime(now+3600001);expect(await store.get('stats:fresh','json')).toEqual(snapshot);
  }finally{await rm(dir,{recursive:true,force:true});}
 });
});
