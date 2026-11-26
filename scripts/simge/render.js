const { chromium } = require('playwright'); const fs = require('fs');
const D = process.argv[2];
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
for (const n of ['icon', 'maskable', 'fg', 'bgonly', 'mono', 'splash']) {
  await p.setContent(`<html><body style="margin:0;background:transparent">${fs.readFileSync(D + '/' + n + '.svg', 'utf8')}</body></html>`);
  await p.locator('svg').screenshot({ path: D + '/' + n + '.png', omitBackground: true });
} await b.close(); })();
