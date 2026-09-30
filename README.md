# HNXT Logistics

Official website for HNXT Logistics, Bengaluru.

A React single-page site backed by a small Express API. Everything a visitor
reads — contact details, services, FAQs, the home page copy — lives in
`server/seed.js`. To change the site's content, edit that file and redeploy.

---

## Running it locally

```bash
npm install
cp .env.example .env      # then fill in the SMTP settings
npm run dev               # web on :5173, API on :4000
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server and API together, with hot reload |
| `npm run build` | Builds the frontend into `dist/` |
| `npm start` | Runs the production server (serves `dist/` and the API) |
| `npm run mail:test -- you@example.com` | Sends a test email with the SMTP settings in `.env` |
| `npm test` | Every suite, against a throwaway server and database |

---

## How content works

The public site fetches everything from `GET /api/site` in one request. That
data is loaded from `server/seed.js` into SQLite **every time the server
starts**, replacing whatever was there. `seed.js` is the only place content
is changed; there is no admin console.

This is what lets the site run on hosts without a persistent disk (such as
Render's free plan): a restart wipes the filesystem, and the next boot
rebuilds the same content from `seed.js`.

Leaving a contact field empty in `seed.js` hides it from the site rather than
printing a blank. The phone and WhatsApp numbers ship empty for exactly this
reason — fill them in when they are ready to publish.

---

## Brand and colour

The palette is sampled from `public/img/logo.png` rather than chosen
independently, so the mark reads as the origin of the design.

| Token | Value | Taken from |
|---|---|---|
| `--color-content` | `#11143A` | the HNXT wordmark indigo |
| `--color-canvas` | `#F2F4F8` | neutral, tuned to sit under indigo |
| `--color-surface` | `#FFFFFF` | cards, header, footer |
| `--color-accent-500` | `#0090D8` | the azure globe arc |
| `--color-brand` | `#0A0C28` | hero, lane board, CTA |

The site is **light only**. Tokens are still split into *chrome*
(`canvas`, `surface`, `content`, `line`, `field`) and *brand* (`brand`,
`on-brand`, used by the always-dark hero and lane board), which keeps the
door open for a dark theme later without another migration.

### The logo is never recoloured

`logo.png` is used exactly as supplied — an indigo and mid-grey mark drawn
for a white ground. Every surface it appears on is light for that reason.
If you add a placement, put it on a light ground rather than producing a
recoloured variant.

`favicon.png`, `favicon-32.png` and `apple-touch-icon.png` are the globe
cropped out of the same file. The crop is found by locating the first tall
vertical stroke of the wordmark and stopping before it — a simple gap scan
swallows the "H", because the aeroplane overhangs it.

### Icons

`src/components/Icon.jsx` holds the whole set as inline SVG paths — nothing
to download, no icon font, and every glyph inherits `currentColor`.

## Cookies and consent

The site sets **no** cookies of its own. The only thing it stores is the
visitor's consent choice, in `localStorage`. There is no advertising,
tracking, or third-party analytics.

The consent banner is nevertheless a real gate, not decoration:
`src/lib/consent.js` records the visitor's choice and exposes
`hasConsent('analytics')`. **When you add analytics, load it behind that check**
rather than dropping a script tag into `index.html` — otherwise the banner
becomes a lie and the site stops being compliant.

```js
import { hasConsent, onConsentChange } from './lib/consent';
if (hasConsent('analytics')) loadAnalytics();
onConsentChange((c) => { if (c?.analytics) loadAnalytics(); });
```

The banner appears once. Once a visitor accepts or rejects, it does not
come back — the choice lives in their browser until they clear site data.

## Where form submissions go

```
Visitor submits  →  POST /api/enquiries  →  validated (Zod)  →  emailed to ENQUIRY_INBOX
                                                                reply-to = the customer
```

**Email is the only place enquiries are read**, so the `SMTP_*` settings are
required in production. Check them with `npm run mail:test -- you@example.com`
before deploying. For Gmail, use a 16-character App Password, not the account
password.

The email is sent after the visitor's confirmation, so a mail failure is
never shown to the customer. When one fails, the whole enquiry is written to
the server log as `[enquiry] HNXT-12345 NOT emailed (…)`, which is where it
can be recovered from. Enquiries are also written to the SQLite `enquiries`
table, but on a host without a persistent disk that is lost on restart.

## Tests

```bash
npm test
```

This boots a **separate server on port 4100 against a temporary database**,
runs every suite, then tears both down. The enquiry rate limit is lifted for
the run.

| Suite | Covers |
|---|---|
| `e2e` | Seeded content renders → enquiry → stored under its reference |
| `popup-test` | Timing, dialog semantics, dismissal, suppression |
| `quote-test` | District and country pickers, inter-state lanes, scope |
| `cookie-test` | Banner, per-category consent, persistence |
| `a11y` | WCAG 2.1 AA across every page |

Individual suites need a server already running: `npm start`, then
`npm run test:quote` (and so on).

## Deploying

The app is a single Node process that serves both the API and the built
frontend, so it needs a host that runs Node — not a static-only host.

**Requirements**

- Node 22.5 or newer (the database uses the built-in `node:sqlite` module)
- SMTP settings for enquiry email. No persistent disk is needed

**With Docker**

```bash
docker build -t hnxt .
docker run -d -p 4000:4000 \
  -e PUBLIC_URL="https://hnxtlogistics.com" \
  -e SMTP_HOST=... -e SMTP_USER=... -e SMTP_PASS=... -e ENQUIRY_INBOX=... \
  hnxt
```

**On Render** — `render.yaml` targets the free plan. Set `PUBLIC_URL` and the
`SMTP_*` / `ENQUIRY_INBOX` values in the dashboard before the first deploy.

Two things to know about the free plan:

- The service sleeps after about 15 idle minutes, and the next visitor waits
  roughly 30–60 seconds while it wakes.
- Outbound SMTP on ports 25, 465 and 587 is blocked, so Gmail SMTP will not
  work there. Use a provider that accepts port 2525 (for example Brevo,
  `smtp-relay.brevo.com:2525`), or move to a paid instance.

**Without Docker**

```bash
npm ci && npm run build
NODE_ENV=production SMTP_HOST=... npm start
```

Put a TLS-terminating reverse proxy in front of it.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no | Defaults to 4000 |
| `DATABASE_PATH` | no | SQLite file location. Rebuilt from `seed.js` on every boot |
| `PUBLIC_URL` | recommended | Canonical origin used in the sitemap and structured data |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | yes | Sends enquiry email. See `.env.example` |
| `SMTP_FROM`, `ENQUIRY_INBOX` | no | Sender, and recipient (defaults to the company email in `seed.js`) |

---

## Security notes

- There is no sign-in and no write API other than enquiry submission
- Public form submissions are validated with Zod, rate limited and honeypot-protected
