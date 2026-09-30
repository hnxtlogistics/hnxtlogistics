# HNXT Logistics

Official website and content management platform for HNXT Logistics, Bengaluru.

A React single-page site backed by a small Express API. Everything a visitor
reads — contact details, services, FAQs, the home page copy — is stored in
SQLite and edited by staff through `/admin`. No code change or redeploy is
needed to update the site's content.

---

## Running it locally

```bash
npm install
cp .env.example .env      # then fill in JWT_SECRET
npm run seed              # creates the database and the first admin account
npm run dev               # web on :5173, API on :4000
```

`npm run seed` prints the admin email and password on first run. Sign in at
<http://localhost:5173/admin> and change the password immediately.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server and API together, with hot reload |
| `npm run build` | Builds the frontend into `dist/` |
| `npm start` | Runs the production server (serves `dist/` and the API) |
| `npm run seed` | Creates tables and seeds content if empty |
| `npm run seed:force` | Resets content and services back to the shipped defaults |
| `npm test` | Every suite, against a throwaway server and database |

---

## How the content system works

The public site fetches everything from `GET /api/site` in one request. Staff
edit that same data through the admin console, so a change is live the moment
it saves — including in the HTML the server sends to search engines.

| Admin section | Controls |
|---|---|
| Enquiries | Every contact and quote submission, with status tracking |
| Contact details | Email, phone, WhatsApp, address, hours, GSTIN, social links |
| Home page | Headline, opening paragraph, buttons, figures, process steps |
| About page | Story paragraphs and the commitments list |
| Services | Full CRUD — add, edit, reorder, publish or hide |
| Lane board | The scrolling lane strip under the home page headline |
| FAQs | Questions and answers, ordered |
| Search listing | Page title, meta description and keywords |
| Your account | Password change and a recent-activity log |

Leaving a contact field empty hides it from the site rather than printing a
blank. The phone and WhatsApp numbers ship empty for exactly this reason —
fill them in from the admin panel when they are ready to publish.

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

The site sets exactly **one** cookie of its own — `hnxt_session`, the staff
sign-in token. It is strictly necessary and therefore outside the scope of
consent. There is no advertising, tracking, or third-party analytics.

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
Visitor submits  →  POST /api/enquiries  →  validated (Zod)  →  SQLite `enquiries` table
                                                             ↓
                                    ┌────────────────────────┴────────────────────┐
                                    ↓                                             ↓
                        Admin console → Enquiries                  Email copy (if SMTP set)
                          (always, immediately)                     reply-to = the customer
```

The database write happens first and is what the visitor's confirmation
depends on. Email is sent afterwards, without blocking the response, and a
failure is logged rather than shown to the customer — so a mail outage can
never lose an enquiry. Each enquiry is stamped with whether its email copy
went out, shown in the console as "Emailed to you" or "Saved here only".

Turn email on from **Admin → Email alerts**, which shows the current status
and can send a test message. It needs `SMTP_*` environment variables; for
Gmail that means a 16-character App Password, not the account password.

## Admin account

```bash
npm run admin:set -- <email> <password> "Display Name"
```

Run against the same `DATABASE_PATH` the server uses. Passwords are bcrypt
hashed and never stored in plain text.

## Tests

```bash
npm test
```

This boots a **separate server on port 4100 against a temporary database**,
runs all seven suites, then tears both down. Nothing touches your real
content, and the enquiry rate limit is lifted for the run — earlier versions
ran against the live server and both edited real data and tripped the
production limits when run back to back.

| Suite | Covers |
|---|---|
| `e2e` | Admin edit → live site → enquiry → inbox |
| `admin-test` | Every console section, CRUD, validation, session |
| `popup-test` | Timing, dialog semantics, dismissal, suppression |
| `quote-test` | District and country pickers, inter-state lanes, scope |
| `cookie-test` | Banner, per-category consent, persistence |
| `a11y` / `a11y-admin` | WCAG 2.1 AA across every page |

Individual suites need a server already running: `npm start`, then
`npm run test:quote` (and so on).

## Deploying

The app is a single Node process that serves both the API and the built
frontend, so it needs a host that runs Node — not a static-only host.

**Requirements**

- Node 22.5 or newer (the database uses the built-in `node:sqlite` module)
- A persistent disk mounted for the SQLite file
- `JWT_SECRET` set — the server refuses to start in production without it

**With Docker**

```bash
docker build -t hnxt .
docker run -d -p 4000:4000 \
  -e JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  -e PUBLIC_URL="https://hnxtlogistics.com" \
  -v hnxt-data:/data \
  hnxt
```

**On Render** — `render.yaml` is ready to use; it provisions the disk and
generates `JWT_SECRET` automatically. Set `PUBLIC_URL`, `ADMIN_EMAIL` and
`ADMIN_PASSWORD` in the dashboard before the first deploy.

**Without Docker**

```bash
npm ci && npm run build
NODE_ENV=production JWT_SECRET=... DATABASE_PATH=/var/lib/hnxt/site.db npm start
```

Put a TLS-terminating reverse proxy in front of it. Session cookies are
marked `secure` in production, so admin sign-in only works over HTTPS.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | yes, in production | Signs admin sessions. 24+ characters |
| `PORT` | no | Defaults to 4000 |
| `DATABASE_PATH` | recommended | SQLite file location. Point at a mounted volume |
| `PUBLIC_URL` | recommended | Canonical origin used in the sitemap and structured data |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | first run only | The initial admin account |
| `SMTP_*`, `ENQUIRY_INBOX` | no | Emails a copy of each enquiry. See `.env.example` |

Email is optional on purpose: enquiries are always written to the database
first, so a mail outage can never lose one.

---

## Backing up

The entire site — content and enquiries — is one SQLite file.

```bash
sqlite3 /data/site.db ".backup '/backups/site-$(date +%F).db'"
```

## Security notes

- Admin passwords are bcrypt hashed; sessions are httpOnly, SameSite cookies
- Sign-in is rate limited to 10 attempts per 15 minutes per IP
- All admin writes are validated server-side with Zod and recorded in an audit log
- Public form submissions are rate limited and honeypot-protected
- `/admin` is excluded from `robots.txt`
