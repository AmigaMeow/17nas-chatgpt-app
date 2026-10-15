import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
// Local visual review only. These are fixture codes, not a live APNIC ranking.
const snapshot=JSON.parse(await readFile('tests/fixtures/snapshot.json','utf8'));
const codes=JSON.parse(await readFile('widget/flag-codes.json','utf8'));
const ranked=snapshot.apnic.countries.toSorted((a,b)=>a.globalRank-b.globalRank).slice(0,5);
console.table(ranked.map(row=>({region:row.region,flag:row.region.toLowerCase()+'.svg',rank:row.globalRank})));
const origin=process.env.WIDGET_TEST_URL?new URL(process.env.WIDGET_TEST_URL).origin:'http://127.0.0.1:8788';
const cell=(code)=>`<div><img src="${origin}/flags/${code.toLowerCase()}.svg" alt=""><strong>${code}</strong><span>${new Intl.DisplayNames(['zh-CN'],{type:'region'}).of(code.toUpperCase())}</span></div>`;
const html=`<!doctype html><meta charset="utf-8"><style>body{margin:24px;background:#f7f7f7;color:#333;font:14px sans-serif}h1{font-size:20px}p{color:#777}.ranked,.all{display:grid;gap:12px}.ranked{grid-template-columns:repeat(5,1fr)}.all{grid-template-columns:repeat(6,1fr)}.ranked img{width:100px;height:75px}img{width:36px;height:27px;object-fit:contain}strong,span{display:block;margin-top:8px}div>div{background:white;padding:12px;border-radius:8px}h2{font-size:16px;margin-top:24px}</style><h1>国旗映射核对 · flag-icons 7.2.3</h1><p>本地测试榜单（非实时 APNIC 数据），名称与 SVG 使用同一条 region 字段。</p><section class="ranked">${ranked.map(row=>cell(row.region)).join('')}</section><h2>已打包国旗批量预览</h2><p>完整资产清单；冷门代码也检查加载。该页面只用于本地审核。</p><section class="all">${codes.filter(code=>/^[a-z]{2}$/.test(code)).map(cell).join('')}</section>`;
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/flags-review.html',html);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:960,height:600}});await page.setContent(html);
await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
await page.locator('.ranked').screenshot({path:'artifacts/flags-top5-review.png'});
await page.screenshot({path:'artifacts/flags-all-review.png',fullPage:true});
console.log('All '+await page.locator('img').count()+' SVG references decoded successfully');await browser.close();
