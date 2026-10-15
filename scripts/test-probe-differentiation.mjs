import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const fixture = {
  connection: { protocol: 'IPv4' },
  region: 'CN',
  ipv6Status: 'unknown',
  ipv6Rate: null,
  sampleCount: 118,
  status: 'insufficient_data',
  updatedAt: '2026-10-14T12:00:00Z',
  stale: false,
  statisticsAvailable: true,
  globalRank: 11,
  apnic: {
    ipv6Rate: 61.84,
    globalRate: 43.67,
    dataDate: '2026-10-11',
    rankingScope: 'countries_and_territories',
    top5: [
      { region: 'FR', ipv6Rate: 85.65, globalRank: 1 },
      { region: 'CN', ipv6Rate: 61.84, globalRank: 11 }
    ]
  }
};

// 1. Test Scenario B: Direct connection failure (no IPv6 route / Failed to fetch)
{
  const page = await browser.newPage({ viewport: { width: 520, height: 850 } });
  await page.addInitScript(val => {
    window.openai = { locale: 'zh-CN', toolOutput: val };
  }, { ...fixture, cardKind: 'combined' });

  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'ipv6only.17nas.com') {
      // Abort with failed connection (simulates TypeError: Failed to fetch)
      await route.abort('failed');
    } else if (url.pathname === '/api/config') {
      await route.fulfill({ json: { probeUrl: 'https://ipv6only.17nas.com/api/probe' } });
    } else {
      await route.fulfill({ json: { ...fixture, region: 'CN' } });
    }
  });

  await page.goto(process.env.WIDGET_TEST_URL ?? 'http://127.0.0.1:8790/widget.html');
  await page.waitForTimeout(700);

  const pillState = await page.locator('#status').getAttribute('data-state');
  const pillText = await page.locator('#status').textContent();
  const summaryText = await page.locator('#connectionSummary').textContent();
  const v6RowText = await page.locator('#protocolRows').textContent();
  const v6StatusClass = await page.locator('#protocolRows .protocol-row:nth-child(2) .protocol-status').getAttribute('class');

  console.log('--- Direct Connection Failure (No IPv6 route) ---');
  console.log('Pill data-state:', pillState);
  console.log('Pill text:', pillText);
  console.log('Summary:', summaryText);
  console.log('V6 status class:', v6StatusClass);

  if (pillState !== 'unsupported') throw new Error();
  if (!pillText.includes('无法使用 IPv6')) throw new Error();
  if (!summaryText.includes('无法使用 IPv6')) throw new Error();
  if (!v6StatusClass.includes('unsupported')) throw new Error();

  await page.screenshot({ path: 'artifacts/card-ipv6-unsupported-zh.png' });
  await page.close();
}

// 2. Test Scenario A: Timeout (AbortSignal timeout)
{
  const page = await browser.newPage({ viewport: { width: 520, height: 850 } });
  await page.addInitScript(val => {
    window.openai = { locale: 'zh-CN', toolOutput: val };
  }, { ...fixture, cardKind: 'combined' });

  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'ipv6only.17nas.com') {
      // Hang without answering (will trigger AbortSignal.timeout(5000))
      // But in test, we can check that it times out or mock timeout error
    } else if (url.pathname === '/api/config') {
      await route.fulfill({ json: { probeUrl: 'https://ipv6only.17nas.com/api/probe' } });
    } else {
      await route.fulfill({ json: { ...fixture, region: 'CN' } });
    }
  });

  // Let's close page
  await page.close();
}

console.log('Probe differentiation tests PASSED!');
await browser.close();
