import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3000';
const OUT  = path.join(__dirname, 'e2e-screenshots');
fs.mkdirSync(OUT, { recursive: true });

const STEPS = [
  { name: '01-landing',       url: '/',         wait: 2000 },
  { name: '02-sign-up',       url: '/sign-up',  wait: 1500 },
  { name: '03-sign-in',       url: '/sign-in',  wait: 1500 },
  { name: '04-pricing',       url: '/pricing',  wait: 1500 },
  { name: '05-missions',      url: '/missions', wait: 1500 },
  { name: '06-sign-in-mobile',url: '/sign-in',  wait: 1500, viewport: { width: 390, height: 844 } },
  { name: '07-landing-mobile',url: '/',         wait: 2000, viewport: { width: 390, height: 844 } },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const step of STEPS) {
    const ctx  = await browser.newContext({
      viewport: step.viewport ?? { width: 1440, height: 900 },
      colorScheme: 'dark',
    });
    const page = await ctx.newPage();

    console.log(`→ ${step.name}: ${BASE}${step.url}`);
    try {
      await page.goto(`${BASE}${step.url}`, { waitUntil: 'networkidle', timeout: 15000 });
    } catch {
      await page.goto(`${BASE}${step.url}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    }
    await page.waitForTimeout(step.wait);

    const file = path.join(OUT, `${step.name}.png`);
    await page.screenshot({ path: file, fullPage: step.name.includes('landing') });
    console.log(`  ✓ saved ${path.basename(file)}`);

    // Collect console errors
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    if (errors.length) console.log(`  ⚠ console errors: ${errors.join('; ')}`);

    await ctx.close();
  }

  // Extra: check redirect from protected route → sign-in
  console.log('\n→ auth-guard: /home should redirect to /sign-in');
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const page2 = await ctx2.newPage();
  await page2.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page2.waitForTimeout(2000);
  const finalUrl = page2.url();
  console.log(`  ✓ landed at: ${finalUrl}`);
  await page2.screenshot({ path: path.join(OUT, '08-auth-guard.png') });
  await ctx2.close();

  await browser.close();
  console.log(`\n✅ All screenshots saved to: ${OUT}`);
})();
