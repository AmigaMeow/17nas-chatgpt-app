import { describe,it,expect,vi } from 'vitest';
import {handleRequest,type AppEnv} from '../src/index';
import {validateSnapshot,statsFor,loadStats} from '../src/stats';
import {normalizeLocale} from '../src/i18n';
import snapshot from './fixtures/snapshot.json';
const bindings:AppEnv={STATS:{get:async()=>snapshot},ASSETS:{fetch:async()=>new Response(null,{status:404})},PUBLIC_ORIGIN:'https://app.17nas.com',IPV6_PROBE_URL:'',RELEASE:'0.1.0'};
describe('Separated statistical sources',()=>{
 it('does not substitute APNIC rates for insufficient own samples',()=>{
  const data=validateSnapshot(snapshot);const us=statsFor(data,'US');expect(us.ipv6Rate).toBeNull();expect(us.status).toBe('insufficient_data');expect(us.apnic.ipv6Rate).not.toBeNull();
  expect(statsFor(data,'CN').ipv6Rate).toBeGreaterThan(0);
 });
 it('publishes own rates starting at exactly 300 samples',()=>{
  for(const count of [299,300,301]){
   const value=structuredClone(snapshot);const successes=Math.floor(count/2);
   value.own.countries.US={sampleCount:count,successes,ipv6Rate:count>=300?Math.round(successes/count*1000)/10:null,status:count>=300?'available':'insufficient_data'};
   const stats=statsFor(validateSnapshot(value),'US');expect(stats.ipv6Rate!==null).toBe(count>=300);
   const invalid=structuredClone(value);invalid.own.countries.US.status=count>=300?'insufficient_data':'available';expect(()=>validateSnapshot(invalid)).toThrow();
  }
 });
 it('returns explicit missing values for an empty country dataset',()=>{
  const value=structuredClone(snapshot);value.own.countries={};value.apnic.countries=[];value.apnic.globalRate=null;
  const stats=statsFor(validateSnapshot(value),'US');expect(stats.ipv6Rate).toBeNull();expect(stats.apnic.ipv6Rate).toBeNull();expect(stats.globalRank).toBeNull();expect(stats.apnic.top5).toEqual([]);
 });
 it('rejects negative, non-integer or dirty sample counts in exported snapshots',()=>{
  for(const bad of [-1, 299.5, 'dirty', null, NaN, Infinity]){
   const value=structuredClone(snapshot);
   value.own.countries.US={sampleCount:bad as any,successes:0,ipv6Rate:null,status:'insufficient_data'};
   expect(()=>validateSnapshot(value)).toThrow();
  }
 });
 it('rejects unexpected fields in exported snapshots',()=>{expect(()=>validateSnapshot({...snapshot,ip:'1.2.3.4'})).toThrow();});
 it('uses last-good data within 24 hours, rejects expired source data',async()=>{
  bindings.STATS={get:async()=>snapshot};const generated=Date.parse(snapshot.generatedAt);
  expect((await loadStats(bindings.STATS,generated+7200000))?.stale).toBe(true);
  expect(await loadStats(bindings.STATS,generated+86400001)).toBeNull();
 });
 it('maps Chinese variants and falls back to English for unknown locales',()=>{expect(normalizeLocale('zh-HK')).toBe('zh-TW');expect(normalizeLocale('zh')).toBe('zh-CN');expect(normalizeLocale('xx-AA')).toBe('en');});
});

describe('App MCP protocol',()=>{
 const rpc=async(method:string,params:unknown={})=>{
  const response=await handleRequest(new Request('https://app.17nas.com/mcp',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}),bindings,{region:'US',ipv6:false,limited:false});
  expect(response.status).toBe(200);return response.json() as Promise<any>;
 };
 it('initializes and exposes the card without using host IP or counting',async()=>{
  const init=await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}});expect(init.result.serverInfo.name).toContain('17NAS');
  const list=await rpc('tools/list');expect(list.result.tools.map((t:any)=>t.name)).toEqual(['check_ipv6_connection','get_network_region','get_nat_troubleshooting_guide','get_ipv6_statistics','check_network']);
  const prompts=await rpc('prompts/list');expect(prompts.result.prompts.map((p:any)=>p.name)).toEqual(['troubleshoot_game_nat','check_network_ipv6','view_ipv6_rankings','check_network_region']);
  const call=await rpc('tools/call',{name:'check_network',arguments:{locale:'zh-HK'}});expect(call.error).toBeUndefined();expect(call.result.structuredContent.locale).toBe('zh-TW');expect(call.result.structuredContent.localeSource).toBe('conversation');expect(call.result.content[0].text).toContain('佔位');expect(list.result.tools.find((t:any)=>t.name==='check_network').description).toContain('IPv4');expect(call.result.structuredContent.region).toBe('XX');expect(call.result.structuredContent.myRank).toBeUndefined();expect(call.result.structuredContent.cardKind).toBe('combined');
  for(const [name,kind] of [['get_nat_troubleshooting_guide','nat'],['get_network_region','network'],['check_ipv6_connection','connection'],['get_ipv6_statistics','statistics']]){
   const result=await rpc('tools/call',{name,arguments:name==='get_ipv6_statistics'?{country:'DE'}:{}});expect(result.result.structuredContent.cardKind).toBe(kind);expect(result.result.structuredContent.myRank).toBeUndefined();
   expect(result.result.structuredContent.requestedCountry).toBe(name==='get_ipv6_statistics'?'DE':null);
  }
  const invalid=await rpc('tools/call',{name:'get_network_region',arguments:{ip:'1.2.3.4'}});expect(invalid.result.isError).toBe(true);
  const resource=await rpc('resources/read',{uri:'ui://17nas/ipv6-card.html'});expect(resource.result.contents[0].text).toContain('<html');
  const meta=resource.result.contents[0]._meta;
  expect(meta.ui.csp.resourceDomains).toEqual([bindings.PUBLIC_ORIGIN]);
  expect(meta['openai/widgetCSP'].resource_domains).toEqual([bindings.PUBLIC_ORIGIN]);
 });
 it('returns explicit pending/untested boundaries and uses a fresh cached-resource identity',async()=>{
  const list=await rpc('tools/list');
  const openWorldByName:Record<string,boolean>={
   check_ipv6_connection:true,get_network_region:true,
   get_nat_troubleshooting_guide:false,get_ipv6_statistics:false,check_network:true
  };
  expect(list.result.tools.map((tool:any)=>tool.name).sort()).toEqual(Object.keys(openWorldByName).sort());
  for(const tool of list.result.tools){
   expect(tool._meta.ui.resourceUri).toBe('ui://17nas/ipv6-card-v3.html');
   expect(tool.annotations).toMatchObject({readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:openWorldByName[tool.name]});
   for(const key of ['readOnlyHint','destructiveHint','idempotentHint','openWorldHint']){
    expect(Object.hasOwn(tool.annotations,key)).toBe(true);
    expect(typeof tool.annotations[key]).toBe('boolean');
   }
  }
  const check=await rpc('tools/call',{name:'check_network',arguments:{locale:'en'}});
  expect(check.result.structuredContent.measurementStatus).toBe('pending');
  expect(check.result.content[0].text).toContain('host location, memory');
  const nat=await rpc('tools/call',{name:'check_nat',arguments:{locale:'en'}});
  expect(nat.result.structuredContent.natStatus).toBe('not_tested');
  expect(nat.result.content[0].text).toContain('does not determine NAT type');
  const prompts=await rpc('prompts/get',{name:'check_network_ipv6'});
  expect(prompts.result.messages[0].content.text).toBe('Check my browser connection and IPv6 reachability.');
 });
 it('does not write arbitrary MCP parameters or tool arguments to logs',async()=>{
  const log=vi.spyOn(console,'log').mockImplementation(()=>{});
  try{
   await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'192.0.2.7 AS64500 Ipswich',version:'1'}});
   const result=await rpc('tools/call',{name:'check_network',arguments:{locale:'192.0.2.7'}});
   expect(JSON.stringify(result)).not.toContain('192.0.2.7');
   const output=JSON.stringify(log.mock.calls);
   for(const sensitive of ['192.0.2.7','AS64500','Ipswich'])expect(output).not.toContain(sensitive);
  }finally{log.mockRestore();}
 });
});
