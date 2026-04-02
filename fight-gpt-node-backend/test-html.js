const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://wiki.supercombo.gg/w/Street_Fighter_6/Ryu', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  const html = await page.$eval('.movedata-container', el => el.innerHTML).catch(() => 'not found');
  fs.writeFileSync('test-html-output.html', html);
  await browser.close();
})();
