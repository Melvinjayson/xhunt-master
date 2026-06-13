import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
  });

  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const page = await ctx.newPage();

  // Capture JS console errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() =>
    page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  );
  await page.waitForTimeout(3000);

  // Screenshot viewport only (hero section)
  await page.screenshot({ path: path.join(__dirname, 'e2e-screenshots', 'hero-viewport.png'), fullPage: false });

  // Scroll down to trigger useInView for all sections, then full-page screenshot
  await page.evaluate(() => {
    return new Promise(resolve => {
      let pos = 0;
      const step = () => {
        pos += 400;
        window.scrollTo(0, pos);
        if (pos < document.body.scrollHeight) setTimeout(step, 80);
        else resolve(undefined);
      };
      step();
    });
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, 'e2e-screenshots', 'landing-after-scroll.png'), fullPage: true });

  console.log('Errors:', errors.length ? errors : 'none');

  // Sign-in page
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() =>
    page.goto(`${BASE}/sign-in`, { waitUntil: 'domcontentloaded' })
  );
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, 'e2e-screenshots', 'sign-in-fixed.png'), fullPage: false });

  // Sign-up page
  await page.goto(`${BASE}/sign-up`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() =>
    page.goto(`${BASE}/sign-up`, { waitUntil: 'domcontentloaded' })
  );
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, 'e2e-screenshots', 'sign-up-fixed.png'), fullPage: false });

  await browser.close();
  console.log('Done');
})();
