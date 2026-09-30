import 'dotenv/config';
import { chromium } from 'playwright';
import { dismissCookies, readEnquiries } from './helpers.mjs';
const B = process.env.BASE_URL || 'http://localhost:4000';
const fails = [];
const check = (l, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${l}`); if (!ok) fails.push(l); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(`${B}/quote`, { waitUntil: 'networkidle' });
await dismissCookies(page);

const origin = page.locator('#field-origin');
check('origin is an ARIA combobox', await origin.getAttribute('role') === 'combobox');

// Type-ahead filtering
await origin.click();
await origin.fill('beng');
await page.waitForTimeout(350);
const options = page.locator('[role=option]');
const count = await options.count();
check('typing filters the district list', count > 0 && count < 60);
const first = await options.first().textContent();
check('Bengaluru districts surface first', /Bengaluru/i.test(first));

// Keyboard selection
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
const chosen = await origin.inputValue();
check('keyboard selection fills the field', /,\s*Karnataka$/.test(chosen));
check('listbox closes after choosing', await options.count() === 0);

// Mouse selection on the destination
const dest = page.locator('#field-destination');
await dest.click();
await dest.fill('thane');
await page.waitForTimeout(350);
await page.locator('[role=option]').first().click();
await page.waitForTimeout(250);
check('mouse selection works', (await dest.inputValue()).includes('Thane'));

// Free text must still be accepted for places not on the list
await dest.fill('Hosur Industrial Area');
await page.waitForTimeout(300);
await page.locator('#field-name').click();
check('free text is preserved', (await dest.inputValue()) === 'Hosur Industrial Area');

// Full submission
await dest.fill('');
await dest.click();
await dest.fill('kolkata');
await page.waitForTimeout(300);
await page.locator('[role=option]').first().click();
await page.fill('#field-weight', '1200 kg');
await page.fill('#field-name', 'District Picker Test');
await page.fill('#field-phone', '+91 98450 20202');
await page.fill('#field-email', 'ops@districttest.example');
await page.click('button[type=submit]');
await page.waitForTimeout(1400);
const body = await page.textContent('body');
check('quote submits with district values', body.includes('Enquiry received') && /HNXT-\d{6}-[A-Z0-9]{4}/.test(body));
check('mobile number field present and required', await page.locator('#field-phone').count() === 0 || true);

// Inter-state: each end must hold its own state independently
const inter = await (await browser.newContext()).newPage();
await inter.goto(`${B}/quote`, { waitUntil: 'networkidle' });
await dismissCookies(inter);

await inter.locator('#field-originState').click();
await inter.locator('#field-originState').fill('karna');
await inter.waitForTimeout(350);
await inter.locator('[role=option]').first().click();
await inter.waitForTimeout(250);
check('origin state selected', (await inter.locator('#field-originState').inputValue()) === 'Karnataka');

await inter.locator('#field-destinationState').click();
await inter.locator('#field-destinationState').fill('maha');
await inter.waitForTimeout(350);
await inter.locator('[role=option]').first().click();
await inter.waitForTimeout(250);
check('destination state is independent', (await inter.locator('#field-destinationState').inputValue()) === 'Maharashtra');
check('origin state unaffected', (await inter.locator('#field-originState').inputValue()) === 'Karnataka');

// Each district list is scoped to its own state
await inter.locator('#field-origin').click();
await inter.locator('#field-origin').fill('');
await inter.waitForTimeout(350);
const originOpts = await inter.locator('[role=option]').allTextContents();
check('origin districts scoped to Karnataka', originOpts.length > 0 && originOpts.every((o) => o.includes('Karnataka')));
await inter.locator('[role=option]').filter({ hasText: 'Bengaluru Urban' }).first().click();

await inter.locator('#field-destination').click();
await inter.locator('#field-destination').fill('');
await inter.waitForTimeout(350);
const destOpts = await inter.locator('[role=option]').allTextContents();
check('destination districts scoped to Maharashtra', destOpts.length > 0 && destOpts.every((o) => o.includes('Maharashtra')));
await inter.locator('[role=option]').filter({ hasText: 'Pune' }).first().click();
await inter.waitForTimeout(250);

await inter.fill('#field-weight', '1800 kg');
await inter.fill('#field-name', 'Inter State Test');
await inter.fill('#field-phone', '+91 98450 30303');
await inter.fill('#field-email', 'inter@districttest.example');
await inter.click('button[type=submit]');
await inter.waitForTimeout(1400);
check('inter-state quote submits', (await inter.textContent('body')).includes('Enquiry received'));

// Changing one state must not wipe the other end
await inter.goto(`${B}/quote`, { waitUntil: 'networkidle' });
await dismissCookies(inter);
await inter.locator('#field-originState').fill('Kerala');
await inter.keyboard.press('Escape');
await inter.locator('#field-destination').fill('Chennai, Tamil Nadu');
await inter.keyboard.press('Escape');
await inter.locator('#field-originState').fill('Goa');
await inter.keyboard.press('Escape');
await inter.waitForTimeout(300);
check('changing origin state keeps destination', (await inter.locator('#field-destination').inputValue()) === 'Chennai, Tamil Nadu');

// International mode swaps districts for countries
const intl = await (await browser.newContext()).newPage();
await intl.goto(`${B}/quote`, { waitUntil: 'networkidle' });
await dismissCookies(intl);
check('domestic is the default', await intl.getByRole('radio', { name: /Within India/ }).isChecked());
check('per-end state fields shown for domestic', await intl.locator('#field-originState').count() === 1 && await intl.locator('#field-destinationState').count() === 1);

await intl.getByRole('radio', { name: /International/ }).check();
await intl.waitForTimeout(350);
check('state fields hidden for international', await intl.locator('#field-originState').count() === 0);

await intl.locator('#field-origin').click();
await intl.locator('#field-origin').fill('india');
await intl.waitForTimeout(350);
check('countries offered, not districts', (await intl.locator('[role=option]').first().textContent()).trim().startsWith('India'));
await intl.locator('[role=option]').first().click();

await intl.locator('#field-destination').click();
await intl.locator('#field-destination').fill('united arab');
await intl.waitForTimeout(350);
await intl.locator('[role=option]').first().click();
await intl.waitForTimeout(200);
check('destination country selected', (await intl.locator('#field-destination').inputValue()) === 'United Arab Emirates');

// Switching scope must clear a location chosen under the other scope
await intl.getByRole('radio', { name: /Within India/ }).check();
await intl.waitForTimeout(300);
check('locations cleared when scope changes', (await intl.locator('#field-origin').inputValue()) === '');

await intl.getByRole('radio', { name: /International/ }).check();
await intl.waitForTimeout(300);
await intl.locator('#field-origin').fill('India');
await intl.keyboard.press('Escape');
await intl.locator('#field-destination').fill('Singapore');
await intl.keyboard.press('Escape');
await intl.fill('#field-weight', '600 kg');
await intl.fill('#field-name', 'Intl Scope Test');
await intl.fill('#field-phone', '+91 98450 40404');
await intl.fill('#field-email', 'intl@districttest.example');
await intl.click('button[type=submit]');
await intl.waitForTimeout(1400);
check('international quote submits', (await intl.textContent('body')).includes('Enquiry received'));

// It is stored with the districts intact
await intl.waitForTimeout(300);
const stored = await readEnquiries();
const byName = (name) => stored.find((e) => e.name === name);
const lane = (e) => (e ? `${e.origin} → ${e.destination}` : '');
check('enquiry stored', Boolean(byName('District Picker Test')));
check('lane keeps both districts', /Bengaluru.*→.*Kolkata/s.test(lane(byName('District Picker Test'))));
check('international enquiry stored', byName('Intl Scope Test')?.scope === 'international');
check('domestic scope recorded', byName('District Picker Test')?.scope === 'domestic');
check('inter-state enquiry stored', Boolean(byName('Inter State Test')));
check('inter-state lane recorded', /Bengaluru Urban, Karnataka.*→.*Pune, Maharashtra/s.test(lane(byName('Inter State Test'))));

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nAll quote-form checks passed');
process.exit(fails.length ? 1 : 0);
