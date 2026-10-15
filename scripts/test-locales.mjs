import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

const locales = ['zh-CN', 'zh-TW', 'en', 'de', 'es', 'fr', 'ja', 'ko'];
const fixture = {
  connection: { protocol: 'IPv4' },
  region: 'DE',
  ipv6Status: 'unknown',
  ipv6Rate: null,
  sampleCount: 118,
  status: 'insufficient_data',
  updatedAt: '2026-10-14T12:00:00Z',
  stale: false,
  statisticsAvailable: true,
  globalRank: 5,
  apnic: {
    ipv6Rate: 73.04,
    globalRate: 43.67,
    dataDate: '2026-10-11',
    rankingScope: 'countries_and_territories',
    top5: [
      { region: 'FR', ipv6Rate: 85.65, globalRank: 1 },
      { region: 'IN', ipv6Rate: 76.76, globalRank: 2 },
      { region: 'FK', ipv6Rate: 75.16, globalRank: 3 },
      { region: 'MY', ipv6Rate: 73.4, globalRank: 4 },
      { region: 'DE', ipv6Rate: 73.04, globalRank: 5 }
    ]
  }
};

const results = [];

for (const loc of locales) {
  const page = await browser.newPage({ viewport: { width: 520, height: 850 } });
  
  await page.addInitScript(val => {
    window.heights = [];
    window.openai = {
      locale: val.locale,
      toolOutput: val,
      notifyIntrinsicHeight: h => window.heights.push(h)
    };
  }, { ...fixture, cardKind: 'combined', locale: loc, localeSource: 'conversation' });

  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'ipv6only.17nas.com') {
      await route.fulfill({ json: { ipv6Status: 'supported', connection: { protocol: 'IPv6' } } });
    } else if (url.pathname === '/api/config') {
      await route.fulfill({ json: { probeUrl: 'https://ipv6only.17nas.com/api/probe' } });
    } else {
      await route.fulfill({ json: { ...fixture, locale: loc, region: 'DE' } });
    }
  });

  await page.goto(process.env.WIDGET_TEST_URL ?? 'http://127.0.0.1:8788/widget.html');
  await page.waitForTimeout(700);

  // Check 320px narrow mobile overflow
  await page.setViewportSize({ width: 320, height: 850 });
  await page.waitForTimeout(100);
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  // Check 375px iPhone width
  await page.setViewportSize({ width: 375, height: 850 });
  await page.waitForTimeout(100);
  const overflow375 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  // Return to 520px and screenshot
  await page.setViewportSize({ width: 520, height: 850 });
  await page.waitForTimeout(100);
  await page.locator('.card').screenshot({ path: `artifacts/card-lang-${loc}.png` });

  // Read privacy note text rendered in this locale
  const privacyText = await page.locator('#networkHelp').textContent();
  const summaryText = await page.locator('#connectionSummary').textContent();
  const v4RowText = await page.locator('#protocolRows').textContent();

  results.push({
    locale: loc,
    overflow320,
    overflow375,
    summaryText,
    hasPrivacyNote: privacyText.length > 0,
    hasNoIpLeaked: !v4RowText.includes('192.') && !v4RowText.includes('2001:')
  });

  await page.close();
}

console.table(results);
await browser.close();
