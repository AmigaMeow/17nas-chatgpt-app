import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 320, height: 850 } });

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
  cardKind: 'combined',
  locale: 'de',
  localeSource: 'conversation',
  apnic: {
    ipv6Rate: 73.04,
    globalRate: 43.67,
    dataDate: '2026-10-11',
    rankingScope: 'countries_and_territories',
    top5: [
      { region: 'FR', ipv6Rate: 85.65, globalRank: 1 },
      { region: 'DE', ipv6Rate: 73.04, globalRank: 5 }
    ]
  }
};

await page.addInitScript(val => {
  window.openai = {
    locale: 'de',
    toolOutput: val,
    notifyIntrinsicHeight: () => {}
  };
}, fixture);

await page.route('**/api/**', async route => {
  const url = new URL(route.request().url());
  if (url.hostname === 'ipv6only.17nas.com') {
    await route.fulfill({ json: { ipv6Status: 'supported', connection: { protocol: 'IPv6' } } });
  } else if (url.pathname === '/api/config') {
    await route.fulfill({ json: { probeUrl: 'https://ipv6only.17nas.com/api/probe' } });
  } else {
    await route.fulfill({ json: fixture });
  }
});

await page.goto(process.env.WIDGET_TEST_URL ?? 'http://127.0.0.1:8790/widget.html');
await page.waitForTimeout(700);

// Inject long German texts into DOM elements
await page.evaluate(() => {
  const v4row = document.querySelector('#protocolRows .protocol-row');
  if (v4row) {
    const meta = v4row.querySelector('.protocol-meta');
    if (meta) meta.textContent = '128 ms · HTTP-Anfrage';
    const status = v4row.querySelector('.protocol-status');
    if (status) status.textContent = 'Verbunden';
  }
  const summary = document.querySelector('#connectionSummary');
  if (summary) summary.textContent = 'IPv4 und IPv6 festgestellt';
  const help = document.querySelector('#networkHelp');
  if (help) help.textContent = 'Aus Datenschutzgründen werden IP-Adressen und ASNs nicht angezeigt.';
});

await page.waitForTimeout(100);

const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
const innerWidth = await page.evaluate(() => window.innerWidth);
const hasOverflow = scrollWidth > innerWidth;

const rowMetrics = await page.evaluate(() => {
  const row = document.querySelector('#protocolRows .protocol-row');
  if (!row) return null;
  const label = row.querySelector('.protocol-label');
  const meta = row.querySelector('.protocol-meta');
  return {
    rowWidth: row.clientWidth,
    labelRect: label.getBoundingClientRect(),
    metaRect: meta.getBoundingClientRect(),
    overlap: label.getBoundingClientRect().right > meta.getBoundingClientRect().left
  };
});

console.log(JSON.stringify({ innerWidth, scrollWidth, hasOverflow, rowMetrics }, null, 2));

await page.screenshot({ path: 'artifacts/card-german-stress-320px.png' });

await page.setViewportSize({ width: 520, height: 850 });
await page.screenshot({ path: 'artifacts/card-german-stress-520px.png' });

await browser.close();
