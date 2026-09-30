import { Router } from 'express';
import db, { getContent } from '../db.js';

const router = Router();

/** The public origin, needed for absolute URLs in the sitemap. */
function origin(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

const escapeXml = (value) =>
  String(value).replace(/[<>&'"]/g, (char) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char])
  );

/* Generated from the database, so a service the admin adds or unpublishes
   is reflected without anyone editing a static file. */
router.get('/sitemap.xml', (req, res) => {
  const base = origin(req);
  const services = db
    .prepare('SELECT slug, updated_at FROM services WHERE published = 1 ORDER BY sort_order, id')
    .all();

  const staticPages = [
    ['/', '1.0', 'weekly'],
    ['/services', '0.9', 'weekly'],
    ['/about', '0.7', 'monthly'],
    ['/contact', '0.8', 'monthly'],
    ['/quote', '0.8', 'monthly'],
    ['/privacy', '0.3', 'yearly']
  ];

  const urls = [
    ...staticPages.map(([path, priority, freq]) =>
      `  <url><loc>${escapeXml(base + path)}</loc><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`
    ),
    ...services.map((service) =>
      `  <url><loc>${escapeXml(`${base}/services/${service.slug}`)}</loc><lastmod>${
        String(service.updated_at).slice(0, 10)
      }</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
    )
  ];

  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  );
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${origin(req)}/sitemap.xml\n`
  );
});

/** LocalBusiness structured data, so search engines get the real NAP. */
router.get('/business.jsonld', (req, res) => {
  const company = getContent('company', {});
  const services = db
    .prepare('SELECT title, summary FROM services WHERE published = 1 ORDER BY sort_order LIMIT 20')
    .all();

  const socials = [company.instagram, company.linkedin, company.facebook].filter(Boolean);

  res.type('application/ld+json').json({
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    name: company.name,
    legalName: company.legalName || company.name,
    description: getContent('seo', {}).description,
    url: origin(req),
    ...(company.email && { email: company.email }),
    ...(company.phone && { telephone: company.phone }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: [company.addressLine1, company.addressLine2].filter(Boolean).join(', '),
      addressLocality: company.city,
      addressRegion: company.state,
      postalCode: company.pincode,
      addressCountry: company.country
    },
    ...(socials.length && { sameAs: socials }),
    ...(company.hours && { openingHours: company.hours }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Logistics services',
      itemListElement: services.map((service) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: service.title, description: service.summary }
      }))
    }
  });
});

export default router;
