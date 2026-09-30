import db, { getContent } from './db.js';

/** Paths the old site used, kept alive as permanent redirects. */
export const LEGACY_REDIRECTS = {
  '/get-a-quote': '/quote',
  '/service-details': '/services',
  '/index.html': '/',
  '/home': '/',
  '/services.html': '/services',
  '/contact.html': '/contact'
};

/* Services genuinely tied to a pickup city. Sea freight is not — putting a
   city in its title would be keyword stuffing, not a useful result. */
const LOCAL_SERVICE = new Set([
  'road-freight', 'domestic-transportation', 'packers-movers', 'door-to-door',
  'last-mile', 'warehousing', 'packaging', 'express-delivery'
]);

const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim();

/** Search results truncate around 155–160 characters. */
function trimDescription(text, limit = 158) {
  const value = clean(text);
  if (value.length <= limit) return value;
  const cut = value.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : limit).replace(/[,;:.\-\s]+$/, '')}…`;
}

function crumbs(origin, trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: origin + item.path
    }))
  };
}

function businessNode(origin) {
  const company = getContent('company', {});
  const socials = [company.instagram, company.linkedin, company.facebook].filter(Boolean);
  return {
    '@type': 'MovingCompany',
    '@id': `${origin}/#business`,
    name: company.name,
    legalName: company.legalName || company.name,
    url: origin,
    ...(company.email && { email: company.email }),
    ...(company.phone && { telephone: company.phone }),
    ...(company.tagline && { slogan: company.tagline }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: [company.addressLine1, company.addressLine2].filter(Boolean).join(', '),
      addressLocality: company.city,
      addressRegion: company.state,
      postalCode: company.pincode,
      addressCountry: company.country || 'IN'
    },
    ...(socials.length && { sameAs: socials }),
    ...(company.hours && { openingHours: company.hours }),
    /* Only emit coordinates that are actually set. A geo block carrying
       undefined is worse than none — it can pin the business at 0,0. */
    ...(Number.isFinite(Number(company.latitude)) &&
        Number.isFinite(Number(company.longitude)) &&
        company.latitude !== '' && company.longitude !== '' &&
        company.latitude != null && company.longitude != null && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: Number(company.latitude),
        longitude: Number(company.longitude)
      }
    }),
    ...(company.mapsUrl && { hasMap: company.mapsUrl }),
    priceRange: '₹₹',
    areaServed: [
      { '@type': 'Country', name: 'India' },
      { '@type': 'Place', name: 'International freight lanes' }
    ]
  };
}

/**
 * Everything the HTML shell needs for one URL. Returning this from the
 * server matters because a crawler that does not run JavaScript would
 * otherwise receive the same title and description for every route.
 */
export function metaForPath(pathname, origin) {
  const company = getContent('company', {});
  const seo = getContent('seo', {});
  const name = company.name || 'HNXT Logistics';
  /* Brand first, by request. Note the trade-off: search engines weight the
     opening words most, so leading with the company name rather than the
     service keyword gives up some ranking signal on generic queries. */
  const brand = `${name} | `;
  /* Local intent is where a single-office forwarder can actually rank, so
     the city goes in the title rather than being left to the body copy. */
  const city = company.city || '';
  const inCity = city ? ` in ${city}` : '';

  const base = {
    status: 200,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1',
    canonical: origin + pathname,
    image: `${origin}/img/og-card.png`,
    type: 'website',
    jsonLd: []
  };

  if (pathname === '/') {
    const faqs = db.prepare('SELECT question, answer FROM faqs WHERE published = 1 ORDER BY sort_order LIMIT 10').all();
    return {
      ...base,
      title: seo.title || `${brand}Freight Forwarding${inCity}`,
      description: trimDescription(seo.description),
      keywords: seo.keywords,
      jsonLd: [
        businessNode(origin),
        { '@type': 'WebSite', '@id': `${origin}/#website`, url: origin, name,
          publisher: { '@id': `${origin}/#business` } },
        faqs.length && {
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer }
          }))
        }
      ].filter(Boolean)
    };
  }

  if (pathname === '/services') {
    const services = db.prepare('SELECT slug, title, summary FROM services WHERE published = 1 ORDER BY sort_order').all();
    return {
      ...base,
      title: `${brand}Logistics & Transport Services${inCity}`,
      description: trimDescription(
        `${services.length} logistics services from ${name}: road freight, air and sea cargo, freight forwarding, packers and movers, customs support, warehousing and last-mile delivery across India.`
      ),
      jsonLd: [
        crumbs(origin, [{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }]),
        {
          '@type': 'ItemList',
          itemListElement: services.map((service, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${origin}/services/${service.slug}`,
            name: service.title
          }))
        }
      ]
    };
  }

  const serviceMatch = pathname.match(/^\/services\/([a-z0-9-]+)$/);
  if (serviceMatch) {
    const service = db
      .prepare('SELECT * FROM services WHERE slug = ? AND published = 1')
      .get(serviceMatch[1]);
    if (!service) return { ...base, status: 404, robots: 'noindex, follow', canonical: null,
                           title: `${brand}Page not found`, description: '' };
    return {
      ...base,
      type: 'article',
      title: `${brand}${service.title}${LOCAL_SERVICE.has(service.slug) ? inCity : ''}${
        service.lane ? ` — ${service.lane}` : ''
      }`,
      description: trimDescription(service.summary || service.body),
      jsonLd: [
        crumbs(origin, [
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
          { name: service.title, path: `/services/${service.slug}` }
        ]),
        {
          '@type': 'Service',
          name: service.title,
          description: clean(service.summary),
          serviceType: service.title,
          provider: { '@id': `${origin}/#business` },
          ...(service.lane && { areaServed: service.lane }),
          url: `${origin}/services/${service.slug}`
        }
      ]
    };
  }

  const PAGES = {
    '/about': {
      title: () => `${brand}About — Freight Forwarder${inCity}`,
      description: () => getContent('about', {}).lede,
      crumb: 'About'
    },
    '/contact': {
      title: () => `${brand}Contact — Freight Enquiries${inCity}`,
      description: () =>
        `Contact ${name}${company.city ? ` in ${company.city}` : ''} about road, air and sea freight, packing, customs support and delivery. We reply within one working day.`,
      crumb: 'Contact',
      extra: () => [businessNode(origin)]
    },
    '/quote': {
      title: () => `${brand}Freight & Transport Quote${inCity}`,
      description: () =>
        `Send your shipment details and get a mode, transit window and rate back from ${name} — usually within one working day. No obligation.`,
      crumb: 'Get a quote'
    },
    '/privacy': {
      title: () => `${brand}Privacy Notice`,
      description: () => `How ${name} collects, uses and stores the information you send through this website.`,
      crumb: 'Privacy',
      robots: 'noindex, follow'
    }
  };

  const page = PAGES[pathname];
  if (page) {
    return {
      ...base,
      ...(page.robots && { robots: page.robots }),
      title: page.title(),
      description: trimDescription(page.description()),
      jsonLd: [
        crumbs(origin, [{ name: 'Home', path: '/' }, { name: page.crumb, path: pathname }]),
        ...(page.extra ? page.extra() : [])
      ]
    };
  }

  return { ...base, status: 404, robots: 'noindex, follow', canonical: null,
           title: `${brand}Page not found`, description: '' };
}
