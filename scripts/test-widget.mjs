import {chromium} from 'playwright';
// Simulated responses validate card routing, not production statistics or IPv6 reachability.
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const fixture={region:'US',ipv6Status:'unknown',ipv6Rate:null,sampleCount:118,status:'insufficient_data',updatedAt:'2026-10-14T12:00:00Z',stale:false,statisticsAvailable:true,globalRank:11,apnic:{ipv6Rate:61.84,globalRate:43.67,dataDate:'2026-10-11',rankingScope:'countries_and_territories',top5:[['FR',85.65],['IN',76.76],['FK',75.16],['MY',73.4],['DE',73.04]].map(([region,ipv6Rate],i)=>({region,ipv6Rate,globalRank:i+1}))}};
for(const kind of ['connection','network','nat','statistics','combined']){
 const page=await browser.newPage({viewport:{width:520,height:850}});const requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(value=>window.openai={locale:'zh-CN',toolOutput:value},{...fixture,cardKind:kind,requestedCountry:kind==='statistics'?'DE':null});
 await page.route('**/api/**',async route=>{const req=route.request(),url=new URL(req.url());requests.push(req.method()+' '+url.hostname+url.pathname);let response;
 if(url.hostname==='ipv6-probe.17nas.com')response={ipv6Status:'supported'};
 else if(url.pathname==='/api/config')response={probeUrl:'https://ipv6-probe.17nas.com/api/probe'};
 else response={...fixture,region:url.searchParams.get('region')??'US',myRank:1,todayQueries:1,counted:true};
 await route.fulfill({json:response});});
 await page.goto((process.env.WIDGET_TEST_URL??'http://127.0.0.1:8788/widget.html'));await page.waitForTimeout(700);
 if(errors.length)throw Error(errors.join('\n'));
 const expected={connection:4,combined:4,network:1,nat:0,statistics:1}[kind];if(requests.length!==expected)throw Error(kind+' '+JSON.stringify(requests));
 if(['connection','combined'].includes(kind)&&!(await page.locator('#status').textContent()).includes('可连接'))throw Error('Missing result');
 if(kind==='statistics'&&!(await page.locator('#regionalTitle').textContent()).includes('德国'))throw Error('Country override lost');
 if(await page.locator('#sampleModule').isVisible())throw Error('Insufficient samples visible');
 await page.locator('#about > summary').click();
 if(!(await page.locator('#privacy').isVisible()))throw Error('Legal details did not expand');
 await page.locator('#about > summary').click();
 await page.setViewportSize({width:360,height:780});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.setViewportSize({width:520,height:850});
 await page.screenshot({path:'artifacts/card-intent-'+kind+'-zh.png',fullPage:true});
 console.log(kind+' OK '+JSON.stringify(requests));await page.close();
}
for(const failure of ['probe','counter']) {
 const page=await browser.newPage();
 await page.addInitScript(value=>window.openai={locale:'en',toolOutput:value},{...fixture,cardKind:'connection'});
 await page.route('**/api/**',async route=>{
  const url=new URL(route.request().url());
  if((failure==='probe'&&url.hostname==='ipv6-probe.17nas.com')||(failure==='counter'&&url.pathname==='/api/ipv6-query')){await route.fulfill({status:503,json:{error:'unavailable'}});return;}
  await route.fulfill({json:url.pathname==='/api/config'?{probeUrl:'https://ipv6-probe.17nas.com/api/probe'}:url.hostname==='ipv6-probe.17nas.com'?{ipv6Status:'supported'}:{...fixture,myRank:1,todayQueries:1}});
 });
 await page.goto(process.env.WIDGET_TEST_URL??'http://127.0.0.1:8788/widget.html');await page.waitForTimeout(700);
 const status=await page.locator('#status').getAttribute('data-state');
 if(status!==(failure==='probe'?'unknown':'supported'))throw Error('Incorrect '+failure+' failure state: '+status);
 console.log(failure+' failure OK');await page.close();
}
await browser.close();
