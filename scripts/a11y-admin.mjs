import 'dotenv/config';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const B = process.env.BASE_URL || 'http://localhost:4000';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
let total = 0;

const scan = async (label) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  total += violations.length;
  console.log(`${violations.length ? '✗' : '✓'} ${label}${violations.length ? '' : '  clean'}`);
  for (const v of violations) {
    console.log(`    [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 2)) {
      console.log(`      ${n.target.join(' ')}`);
      console.log(`        ${n.any?.[0]?.message?.replace(/\s+/g, ' ').slice(0, 170)}`);
    }
  }
};

await page.goto(B + '/admin', { waitUntil: 'networkidle' });
await scan('/admin (sign-in)');

await page.fill('#field-email', process.env.ADMIN_EMAIL);
await page.fill('#field-password', process.env.ADMIN_PASSWORD);
await page.click('button[type=submit]');
await page.waitForTimeout(1200);
await scan('/admin (enquiries)');

for (const path of ['company', 'homepage', 'about', 'services', 'lanes', 'faqs', 'seo', 'account']) {
  await page.goto(`${B}/admin/${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await scan(`/admin/${path}`);
}

await browser.close();
console.log(total ? `\n${total} violation type(s)` : '\nNo WCAG 2.1 AA violations found.');
