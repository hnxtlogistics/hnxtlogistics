import 'dotenv/config';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const B = process.env.BASE_URL || 'http://localhost:4000';
const PAGES = ['/', '/services', '/services/sea-freight', '/about', '/contact', '/quote', '/privacy', '/nope'];
const browser = await chromium.launch();
let total = 0;

for (const path of PAGES) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(B + path, { waitUntil: 'networkidle' });
  const consent = page.getByRole('button', { name: 'Necessary only' });
  if (await consent.count()) { await consent.click(); await page.waitForTimeout(250); }
  await page.waitForTimeout(500);
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  total += violations.length;
  console.log(`${violations.length ? '✗' : '✓'} ${path}${violations.length ? '' : '  clean'}`);
  for (const v of violations) {
    console.log(`    [${v.impact}] ${v.id}: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`      ${node.target.join(' ')}`);
      console.log(`        ${node.any?.[0]?.message?.replace(/\s+/g,' ').slice(0,190)}`);
    }
  }
  await context.close();
}
await browser.close();
console.log(total ? `\n${total} violation type(s)` : '\nNo WCAG 2.1 AA violations found.');
