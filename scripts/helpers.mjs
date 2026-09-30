/** Shared helpers for the browser test suites. */

/**
 * Answers the cookie banner so it stops covering the bottom of the viewport.
 * Every visitor-facing test needs this before interacting with the page.
 */
export async function dismissCookies(page) {
  const button = page.getByRole('button', { name: 'Necessary only' });
  if (await button.count()) {
    await button.click();
    await page.waitForTimeout(300);
  }
}

/** Pre-accepts consent for a context, so no banner appears at all. */
export async function preAcceptCookies(context, baseUrl) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'hnxt.cookieConsent',
        JSON.stringify({ version: 1, decidedAt: new Date().toISOString(), necessary: true, analytics: false })
      );
    } catch { /* ignore */ }
  });
  return context;
}

/**
 * Enquiries as stored by the server under test. There is no inbox UI, so
 * suites check submissions against the database the server was started on.
 */
export async function readEnquiries() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(process.env.DATABASE_PATH, { readOnly: true });
  try {
    return db.prepare('SELECT * FROM enquiries ORDER BY id').all();
  } finally {
    db.close();
  }
}
