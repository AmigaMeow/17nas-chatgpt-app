import {chromium} from 'playwright';
// Simulated responses validate card routing, not production statistics or IPv6 reachability.
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const fixture={connection:{protocol:'IPv4'},region:'US',ipv6Status:'unknown',ipv6Rate:null,sampleCount:118,status:'insufficient_data',updatedAt:'2026-10-14T12:00:00Z',stale:false,statisticsAvailable:true,globalRank:11,apnic:{ipv6Rate:61.84,globalRate:43.67,dataDate:'2026-10-11',rankingScope:'countries_and_territories',top5:[['FR',85.65],['IN',76.76],['FK',75.16],['MY',73.4],['DE',73.04]].map(([region,ipv6Rate],i)=>({region,ipv6Rate,globalRank:i+1}))}};
for(const kind of ['connection','network','nat','statistics','combined']){
 const page=await browser.newPage({viewport:{width:520,height:850}});const requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(value=>{window.heights=[];window.openai={locale:'zh-TW',toolOutput:value,notifyIntrinsicHeight:h=>window.heights.push(h)}},{...fixture,cardKind:kind,locale:'zh-CN',localeSource:'conversation',requestedCountry:kind==='statistics'?'DE':null});
 await page.route('**/api/**',async route=>{const req=route.request(),url=new URL(req.url());requests.push(req.method()+' '+url.hostname+url.pathname);let response;
 if(url.hostname==='ipv6only.17nas.com')response={ipv6Status:'supported',connection:{protocol:'IPv6'}};
 else if(url.pathname==='/api/config')response={probeUrl:'https://ipv6only.17nas.com/api/probe'};
 else response={...fixture,region:url.searchParams.get('region')??'US',...(url.searchParams.get('region')==='DE'?{globalRank:5,apnic:{...fixture.apnic,ipv6Rate:73.04}}:{})};
 await route.fulfill({json:response});});
 await page.goto((process.env.WIDGET_TEST_URL??'http://127.0.0.1:8788/widget.html'));await page.waitForTimeout(700);
 if(errors.length)throw Error(errors.join('\n'));
 const expected={connection:3,combined:3,network:1,nat:0,statistics:1}[kind];if(requests.length!==expected)throw Error(kind+' '+JSON.stringify(requests));
 if(['connection','combined'].includes(kind)&&!(await page.locator('#status').textContent()).includes('可连接'))throw Error('Missing result');
 if(['connection','combined'].includes(kind)){if(!(await page.locator('#connectionSummary').textContent()).includes('IPv4 和 IPv6'))throw Error('Protocol summary mismatch');if((await page.locator('#protocolRows').textContent()).includes('192.0.2')||(await page.locator('#protocolRows').textContent()).includes('2001:db8'))throw Error('Plaintext address leaked into protocol rows');}
 if(kind==='statistics'&&!(await page.locator('#regionalTitle').textContent()).includes('德国'))throw Error('Country override lost');
 if(['connection','combined'].includes(kind)&&!(await page.locator('#detection .section-icon').isVisible()))throw Error('Missing connection visual heading');
 if(['network','combined'].includes(kind)){
  await page.locator('#networkFlag img').evaluate(img=>img.decode());
  if(!(await page.locator('#networkFlag img').getAttribute('src')).endsWith('/us.svg'))throw Error('Attribution flag mismatch');
  if(await page.locator('#networkRegion').textContent()!=='美国')throw Error('Attribution label mismatch');
  console.log(kind+' fields: region=US, flag=us.svg, country=美国');
 }
 if(kind==='nat'){
  if(await page.locator('#natLink').getAttribute('href')!=='https://17nas.com/nat-test.php')throw Error('NAT destination changed');
  const style=await page.locator('#natLink').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,decoration:getComputedStyle(el).textDecorationLine}));
  if(style.bg!=='rgb(26, 95, 74)'||style.decoration!=='none')throw Error('NAT action missing button style');
 }

 if(await page.locator('#sampleModule').isVisible())throw Error('Insufficient samples visible');
 await page.waitForTimeout(50);
 const baseline=await page.evaluate(()=>window.heights.at(-1));
 for(let n=0;n<8;n++){
  await page.locator('#about > summary').click();await page.waitForTimeout(60);
  const expanded=await page.evaluate(()=>window.heights.at(-1));
  if(!(await page.locator('#privacy').isVisible())||expanded<=baseline)throw Error('Details did not expand/resize');
  await page.locator('#about > summary').click();await page.waitForTimeout(60);
  if(await page.evaluate(()=>window.heights.at(-1))!==baseline)throw Error('Collapsed height drift');
 }
 if(kind==='statistics'){
  if(!(await page.locator('#globalRate').textContent()).includes('43.67'))throw Error('Global rate missing from the visible card');
  if(!(await page.locator('#globalUpdated').isVisible()))throw Error('APNIC date is hidden from the main card');
  await page.locator('#top img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  const flags=await page.locator('#top li').evaluateAll(rows=>rows.map(row=>({country:row.querySelector('.rank-country').textContent,region:row.querySelector('img')?.src.split('/').at(-1).slice(0,-4).toUpperCase(),asset:row.querySelector('img')?.src.split('/').at(-1),loaded:!!row.querySelector('img')?.naturalWidth})));
  console.table(flags);
  if(flags.map(x=>x.region).join(',')!=='FR,IN,FK,MY,DE'||flags.some(x=>!x.loaded))throw Error('Flag binding/load mismatch');
 }
 await page.setViewportSize({width:320,height:780});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.setViewportSize({width:520,height:850});
 await page.locator('.card').screenshot({path:'artifacts/card-intent-'+kind+'-zh.png'});
 console.log(kind+' OK '+JSON.stringify(requests));await page.close();
}
for(const failure of ['probe','network']) {
 const page=await browser.newPage();
 await page.addInitScript(value=>window.openai={locale:'en',toolOutput:value},{...fixture,cardKind:'connection'});
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url());
  if((failure==='probe'&&url.hostname==='ipv6only.17nas.com')||(failure==='network'&&url.pathname==='/api/network')){await route.fulfill({status:503,json:{error:'unavailable'}});return;}
  await route.fulfill({json:url.pathname==='/api/config'?{probeUrl:'https://ipv6only.17nas.com/api/probe'}:url.hostname==='ipv6only.17nas.com'?{ipv6Status:'supported',connection:{protocol:'IPv6'}}:{...fixture}});
 });
 await page.goto(process.env.WIDGET_TEST_URL??'http://127.0.0.1:8788/widget.html');await page.waitForTimeout(700);
 const status=await page.locator('#status').getAttribute('data-state');
 if(status!==(failure==='probe'?'unknown':'supported'))throw Error('Incorrect '+failure+' failure state: '+status);
 console.log(failure+' failure OK');await page.close();
}
{
 const page=await browser.newPage();
 await page.addInitScript(value=>window.openai={locale:'zh-TW',toolOutput:value},{...fixture,cardKind:'network',locale:'zh-CN',localeSource:'conversation'});
 await page.route('**/api/**',r=>r.fulfill({json:fixture}));
 await page.goto(process.env.WIDGET_TEST_URL??'http://127.0.0.1:8788/widget.html');
 await page.waitForTimeout(500);
 if(await page.locator('html').getAttribute('lang')!=='zh-CN')throw Error('Conversation locale was overridden');
 if(!(await page.locator('#networkHelp').textContent()).includes('不展示 IP 地址和 ASN'))throw Error('Missing privacy note');
 await page.close();console.log('Conversation locale precedence and privacy note OK');
}
// Missing statistics and the 300-sample threshold, with no source substitution.
for(const count of [0,299,300,301]){
 const own=count>=300;
 const value={...fixture,cardKind:'statistics',sampleCount:count,ipv6Rate:own?50:null,status:own?'available':'insufficient_data',globalRank:null,apnic:{...fixture.apnic,ipv6Rate:null,globalRate:null,top5:[]}};
 const page=await browser.newPage({viewport:{width:320,height:780}});
 await page.addInitScript(value=>window.openai={locale:'zh-CN',toolOutput:value},value);
 await page.route('**/api/**',r=>r.fulfill({json:value}));
 await page.goto(process.env.WIDGET_TEST_URL??'http://127.0.0.1:8788/widget.html');await page.waitForTimeout(150);
 if(await page.locator('#sampleModule').isVisible()!==false)throw Error('Closed details exposed');
 if(await page.locator('#sampleModule').evaluate(el=>el.hidden)!==!own)throw Error('Sample boundary '+count);
 if(!(await page.locator('#topMissing').isVisible())||!(await page.locator('#regionalRate').textContent()).includes('暂'))throw Error('Missing statistics has no explanation');
 if(await page.locator('#regionalProgress').isVisible())throw Error('Missing rate displayed as zero');
 if(count===0)await page.locator('.card').screenshot({path:'artifacts/card-statistics-empty-zh.png'});
 await page.close();console.log('Sample boundary '+count+' OK');
}
// Known-but-failed assets and unrecognised codes keep the same-sized neutral placeholder.
for(const code of ['FK','XZ']){
 const page=await browser.newPage();const value={...fixture,cardKind:'statistics',apnic:{...fixture.apnic,top5:[{region:code,ipv6Rate:50,globalRank:1}]}};
 await page.addInitScript(value=>window.openai={locale:'en',toolOutput:value},value);
 await page.route('**/api/**',r=>r.fulfill({json:value}));
 await page.route('**/flags/fk.svg',r=>r.fulfill({status:404,body:''}));
 await page.goto(process.env.WIDGET_TEST_URL??'http://127.0.0.1:8788/widget.html');
 await page.locator('.flag-fallback').waitFor();
 if(await page.locator('.flag-fallback').textContent()!==code)throw Error('Flag fallback failed');
 await page.close();console.log('Flag fallback '+code+' OK');
}
// Exercise the actual MCP Apps size notification against a local iframe host.
const widgetUrl = new URL(process.env.WIDGET_TEST_URL ?? 'http://127.0.0.1:8788/widget.html');
const host=await browser.newPage({viewport:{width:520,height:900}});
await host.route('**/api/**',r=>r.fulfill({json:fixture}));
await host.goto(new URL('/privacy.html', widgetUrl).href);
await host.evaluate(value=>{
 window.sizes=[];
 const iframe=document.createElement('iframe');iframe.style='width:480px;height:850px;border:0';
 window.addEventListener('message',event=>{
  const msg=event.data;
  if(msg.method==='ui/initialize')event.source.postMessage({jsonrpc:'2.0',id:msg.id,result:{protocolVersion:msg.params.protocolVersion,hostInfo:{name:'local-test',version:'1'},hostCapabilities:{},hostContext:{locale:'zh-CN',displayMode:'inline'}}},'*');
  if(msg.method==='ui/notifications/initialized')event.source.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:value}},'*');
  if(msg.method==='ui/notifications/size-changed'){window.sizes.push(msg.params.height);iframe.style.height=msg.params.height+'px';}
 });
 iframe.src='/widget.html';document.body.replaceChildren(iframe);
},{...fixture,cardKind:'statistics'});
const embedded=host.frameLocator('iframe');await embedded.locator('#top li').first().waitFor();
await embedded.locator('#loading').waitFor({state:'hidden'});
const measuredHeight=await embedded.locator('.card').evaluate(card=>Math.ceil(card.getBoundingClientRect().bottom+parseFloat(getComputedStyle(document.body).paddingBottom)));
await host.waitForFunction(height=>window.sizes.at(-1)===height,measuredHeight,{timeout:5000});
const embeddedHeight=await host.evaluate(()=>window.sizes.at(-1));
if(!embeddedHeight||embeddedHeight>=850)throw Error('Host did not shrink initial frame');
for(let n=0;n<8;n++){
 await embedded.locator('#about > summary').click();await host.waitForFunction(height=>window.sizes.at(-1)>height,embeddedHeight,{timeout:5000});
 if(await host.evaluate(()=>window.sizes.at(-1))<=embeddedHeight)throw Error('Standard bridge did not grow');
 await embedded.locator('#about > summary').click();await host.waitForFunction(height=>window.sizes.at(-1)===height,embeddedHeight,{timeout:5000});
 if(await host.evaluate(()=>window.sizes.at(-1))!==embeddedHeight)throw Error('Standard bridge height drift');
}
await host.locator('iframe').evaluate(frame=>frame.style.width='300px');await host.waitForTimeout(100);
if(await embedded.locator('html').evaluate(el=>el.scrollWidth>innerWidth))throw Error('Embedded narrow overflow');
console.log('MCP Apps iframe resize and narrow layout OK, collapsed height '+embeddedHeight);await host.close();
await browser.close();
