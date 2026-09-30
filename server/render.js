import { readFileSync, statSync } from 'node:fs';
import { getContent, getContentVersion } from './db.js';
import { metaForPath } from './seo-meta.js';

let cachedTemplate = null;
let cachedTemplateMtime = 0;
const pageCache = new Map();
let cacheStamp = '';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])
  );

const tag = (html) => (html ? `    ${html}\n` : '');

/**
 * Serves index.html with the title, description, canonical URL and
 * structured data for the specific route being requested. A crawler that
 * does not run JavaScript would otherwise receive identical metadata for
 * every page on the site.
 */
export function renderShell(indexPath, origin, pathname) {
  /* Re-read when the build output changes. Caching the template for the
     whole process lifetime means a rebuild against a running server keeps
     serving HTML that points at deleted asset hashes — a blank page. */
  const mtime = statSync(indexPath).mtimeMs;
  if (cachedTemplate === null || mtime !== cachedTemplateMtime) {
    cachedTemplate = readFileSync(indexPath, 'utf8');
    cachedTemplateMtime = mtime;
    pageCache.clear();
  }

  const stamp = `${getContentVersion()}|${origin}`;
  if (stamp !== cacheStamp) {
    pageCache.clear();
    cacheStamp = stamp;
  }

  const cached = pageCache.get(pathname);
  if (cached) return cached;

  const meta = metaForPath(pathname, origin);
  const company = getContent('company', {});
  const siteName = company.name || 'HNXT Logistics';

  let head = '';
  head += tag(`<meta name="description" content="${escapeHtml(meta.description)}" />`);
  head += tag(`<meta name="robots" content="${escapeHtml(meta.robots)}" />`);
  if (meta.keywords) head += tag(`<meta name="keywords" content="${escapeHtml(meta.keywords)}" />`);
  if (meta.canonical) head += tag(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`);

  head += tag(`<meta property="og:type" content="${escapeHtml(meta.type)}" />`);
  head += tag(`<meta property="og:site_name" content="${escapeHtml(siteName)}" />`);
  head += tag(`<meta property="og:locale" content="en_IN" />`);
  head += tag(`<meta property="og:title" content="${escapeHtml(meta.title)}" />`);
  head += tag(`<meta property="og:description" content="${escapeHtml(meta.description)}" />`);
  head += tag(`<meta property="og:image" content="${escapeHtml(meta.image)}" />`);
  head += tag(`<meta property="og:image:width" content="1200" />`);
  head += tag(`<meta property="og:image:height" content="630" />`);
  if (meta.canonical) head += tag(`<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`);

  head += tag(`<meta name="twitter:card" content="summary_large_image" />`);
  head += tag(`<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`);
  head += tag(`<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`);
  head += tag(`<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`);

  if (meta.jsonLd.length) {
    const graph = { '@context': 'https://schema.org', '@graph': meta.jsonLd };
    head += tag(
      `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`
    );
  }

  const html = cachedTemplate
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    // Strip the build-time placeholders; every one is re-emitted above.
    .replace(/\n\s*<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/\n\s*<meta\s+property="og:[^"]*"[^>]*\/>/g, '')
    .replace(/\n\s*<meta\s+name="twitter:[^"]*"[^>]*\/>/g, '')
    .replace('</head>', `${head}  </head>`);

  const result = { html, status: meta.status };
  if (pageCache.size < 200) pageCache.set(pathname, result);
  return result;
}
