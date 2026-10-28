import {chromium} from 'playwright';
import assert from 'node:assert/strict';

// All API and probe responses are simulated. This is regression coverage,
// not evidence of production reachability or real ChatGPT host support.
const widgetUrl=process.env.WIDGET_TEST_URL??'http://127.0.0.1:8791/widget.html';
const fixture={region:'XX',ipv6Status:'unknown',sampleCount:0,status:'insufficient_data',statisticsAvailable:false,stale:false,cardKind:'combined',locale:'en',localeSource:'conversation',apiOrigin:'https://mcp.17nas.com',probeUrl:'https://ipv6only.17nas.com/api/probe',apnic:{ipv6Rate:null,globalRate:null,dataDate:null,top5:[]}};
const network={...fixture,region:'KR',connection:{protocol:'IPv4'}};
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
try {
 for(const failure of ['network-error','timeout','both-failed']){
  const page=await browser.newPage();
  await page.addInitScript(value=>window.openai={locale:'en',toolOutput:value},fixture);
  await page.route('**/api/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/config')return route.fulfill({json:{probeUrl:fixture.probeUrl}});
   if(url.hostname==='ipv6only.17nas.com'){
    if(failure==='timeout'){
     await new Promise(resolve=>setTimeout(resolve,5500));
     try{await route.fulfill({json:{ipv6Status:'supported',connection:{protocol:'IPv6'}}});}catch{}
     return;
    }
    return route.abort('failed');
   }
   if(failure==='both-failed')return route.fulfill({status:503,json:{error:{code:'networkError'}}});
   return route.fulfill({json:network});
  });
  await page.goto(widgetUrl);
  await page.locator('#status[data-state="unknown"]').waitFor();
  const error=await page.locator('#error').textContent();
  assert(!/[\u4e00-\u9fff]/.test(error),'English diagnostic contains Chinese');
  assert.equal(await page.locator('#networkRegion').textContent(),failure==='both-failed'?'Unknown':'South Korea');
  assert.match(error,failure==='timeout'?/timed out/:failure==='both-failed'?/complete the check/:/could not complete/);
  assert(!(await page.locator('#connectionSummary').textContent()).includes('unavailable'));
  await page.close();
  console.log(failure+' stays unverified with a localized explanation');
 }

 // Simulate a measurement finishing BEFORE the host handshake, then a retry
 // losing the base connection. Assert model context and the user-clicked message.
 const host=await browser.newPage();
 await host.addInitScript(value=>window.openai={locale:'en',toolOutput:value},fixture);
 let failedRetry=false;
 await host.route('**/api/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/config')return route.fulfill({json:{probeUrl:fixture.probeUrl}});
  if(url.hostname==='ipv6only.17nas.com')return route.abort('failed');
  if(failedRetry)return route.fulfill({status:503,json:{error:{code:'networkError'}}});
  return route.fulfill({json:network});
 });
 await host.goto(new URL('/privacy.html',widgetUrl).href);
 await host.evaluate(()=>{
  window.contexts=[];window.messages=[];
  const iframe=document.createElement('iframe');iframe.style='width:520px;height:900px;border:0';
  window.addEventListener('message',event=>{
   const msg=event.data;
   const respond=result=>event.source.postMessage({jsonrpc:'2.0',id:msg.id,result},'*');
   if(msg.method==='ui/initialize')setTimeout(()=>respond({protocolVersion:msg.params.protocolVersion,hostInfo:{name:'regression-host',version:'1'},hostCapabilities:{updateModelContext:{text:{}},message:{text:{}}},hostContext:{locale:'en',displayMode:'inline'}}),700);
   if(msg.method==='ui/update-model-context'){window.contexts.push(msg.params.structuredContent);respond({});}
   if(msg.method==='ui/message'){window.messages.push(msg.params);respond({});}
  });
  iframe.src='/widget.html';document.body.replaceChildren(iframe);
 });
 const card=host.frameLocator('iframe');
 await host.waitForFunction(()=>window.contexts.some(c=>c.status==='completed'));
 let result=await host.evaluate(()=>window.contexts.at(-1));
 assert.equal(result.region,'KR');assert.equal(result.ipv6ProbeStatus,'unknown');
 assert.equal(result.errorCode,'probeNetwork');assert.equal(result.protocols[0].protocol,'IPv4');
 await card.locator('#share').click();
 await host.waitForFunction(()=>window.messages.length===1);
 const message=await host.evaluate(()=>window.messages[0].content[0].text);
 assert(message.includes('"region":"KR"')&&message.includes('"ipv6ProbeStatus":"unknown"'));
 assert.equal(await card.locator('#shareFeedback').textContent(),'Results sent to this conversation.');
 failedRetry=true;
 await card.locator('#check').click();
 await host.waitForFunction(()=>window.contexts.at(-1)?.status==='completed'&&window.contexts.at(-1)?.region==='XX');
 result=await host.evaluate(()=>window.contexts.at(-1));
 assert.deepEqual(result.protocols,[]);assert.equal(result.errorCode,'networkError');
 assert.equal(await card.locator('#networkRegion').textContent(),'Unknown');
 assert((await host.evaluate(()=>window.contexts)).some(c=>c.status==='pending'));
 console.log('Delayed handshake, explicit message sharing and stale-country invalidation passed');
 await host.close();
} finally {
 await browser.close();
}
