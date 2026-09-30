import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db, { setContent, getContent } from './db.js';

const company = {
  name: 'HNXT Logistics',
  legalName: 'HNXT Logistics',
  tagline: 'Freight that keeps its promises',
  email: 'hnxtlogistics@gmail.com',
  phone: '',
  whatsapp: '',
  addressLine1: 'No. 28, 1st Cross, Kalkere Main Road',
  addressLine2: 'Ramamurthy Nagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560016',
  country: 'India',
  hours: 'Mon–Sat, 9:00 – 19:00 IST',
  gstin: '',
  latitude: 13.017719211085238,
  longitude: 77.6787403091518,
  mapsUrl: '',
  instagram: 'https://www.instagram.com/hnxt_logistics?igsh=MTVqaHBqMHZiMDM3YQ==',
  linkedin: '',
  facebook: ''
};

const home = {
  eyebrow: 'Bengaluru · Pan-India · Import & Export',
  heading: 'Cargo moves. We make sure it arrives.',
  lede: 'Road, air and sea freight run out of one Bengaluru desk — with packing, customs support and last-mile delivery handled on the same file. One reference, one person to call.',
  primaryCta: { label: 'Get a quote', to: '/quote' },
  secondaryCta: { label: 'See what we move', to: '/services' },
  stats: [
    { value: '4', unit: 'modes', label: 'Road, air, sea and multi-modal on one file' },
    { value: '15', unit: 'services', label: 'From packing to customs clearance' },
    { value: '1', unit: 'contact', label: 'The same coordinator start to finish' }
  ],
  processHeading: 'How a shipment moves',
  processLede: 'Four stages, each with a named handoff. You always know which one your cargo is in.',
  process: [
    { code: 'S1', title: 'Booking', text: 'Send the lane, weight and dimensions. We confirm mode, transit window and price before anything moves.' },
    { code: 'S2', title: 'Pickup & packing', text: 'Cargo is collected, packed to the risk of the route, and logged against your reference number.' },
    { code: 'S3', title: 'Line haul', text: 'The load runs road, air or sea — or a combination — with status updates at each transfer point.' },
    { code: 'S4', title: 'Last mile', text: 'Delivery to the final door, with proof of delivery returned to you on the same file.' }
  ]
};

const lanes = [
  { origin: 'BLR', destination: 'DEL', mode: 'ROAD', service: 'FTL' },
  { origin: 'BLR', destination: 'NSA', mode: 'SEA', service: 'FCL' },
  { origin: 'BLR', destination: 'MAA', mode: 'ROAD', service: 'PTL' },
  { origin: 'BLR', destination: 'DXB', mode: 'AIR', service: 'EXPRESS' },
  { origin: 'BLR', destination: 'BOM', mode: 'AIR', service: 'CARGO' },
  { origin: 'BLR', destination: 'CCU', mode: 'ROAD', service: 'FTL' },
  { origin: 'BLR', destination: 'SIN', mode: 'SEA', service: 'LCL' },
  { origin: 'BLR', destination: 'HYD', mode: 'ROAD', service: 'LAST MILE' }
];

const popup = {
  enabled: 1,
  delaySeconds: 10,
  heading: 'Need a price on a shipment?',
  body: 'Send us the lane, the weight and rough dimensions. You get a mode, a transit window and a rate back — usually within one working day.',
  ctaLabel: 'Get a quote',
  ctaTo: '/quote',
  dismissDays: 1
};

const about = {
  heading: 'A small desk that runs like a large network',
  lede: 'HNXT Logistics coordinates freight from Ramamurthy Nagar, Bengaluru. We move our own road freight and forwarding, and bring in vetted partners for customs clearance and warehousing so you are never handed off to a stranger.',
  body: [
    'Most freight problems are handoff problems. A load sits at a hub because nobody owns the next step, or a document is missing and the person who knows is unreachable. We keep one coordinator on a shipment from booking to proof of delivery, so there is always someone who can answer where the cargo is.',
    'For customs clearance and warehousing we work through established CHA and warehouse partners rather than pretending to do everything in-house. You get the partner network without losing a single point of contact.'
  ],
  values: [
    { title: 'One reference, end to end', text: 'Every shipment gets a reference number that stays with it across every mode and every partner.' },
    { title: 'Honest transit windows', text: 'We quote the window we can hold, not the one that wins the enquiry. If a lane is tight, you hear it upfront.' },
    { title: 'Packed for the route', text: 'Packing is specified against the actual journey — a sea container and a two-day road run are not the same risk.' },
    { title: 'Partners, not black boxes', text: 'Where a partner handles a stage, we tell you who and stay accountable for the outcome.' }
  ]
};

const seo = {
  title: 'HNXT Logistics | Logistics & Transport Company in Bengaluru',
  description:
    'Road, air and sea freight from Bengaluru across India and overseas. Freight forwarding, packers and movers, customs support, warehousing and last-mile delivery.',
  keywords:
    'logistics company in Bengaluru, transport company Bengaluru, freight forwarding Bengaluru, packers and movers Bengaluru, road freight India, air cargo Bengaluru, sea freight India, customs clearance, warehousing, last mile delivery'
};

const services = [
  ['road-freight', 'Road Freight', 'ROAD', 'Full-truck and part-load movement across short, medium and long-distance routes.', 'Our primary lane. FTL and PTL road movement across India with vehicles matched to the load rather than whatever is free. Cargo is logged at pickup and tracked to the delivery door.', 'Pan-India', '1–6 days', 1],
  ['domestic-transportation', 'Domestic Transportation', 'ROAD', 'Local and nationwide transport for businesses and individuals.', 'Scheduled and on-demand transport for businesses moving stock between branches, and for individuals with one-off consignments. Includes loading, transit and unloading coordination.', 'Pan-India', '1–6 days', 0],
  ['air-freight', 'Air Freight', 'AIR', 'Time-critical domestic and international air cargo.', 'For cargo where the transit window matters more than the rate. Booked against available capacity with documentation prepared ahead of cut-off so the shipment actually makes the flight.', 'Domestic & international', '1–4 days', 1],
  ['sea-freight', 'Sea Freight', 'SEA', 'FCL and LCL ocean freight for import and export cargo.', 'Full Container Load for volume shipments and Less than Container Load where a full box is not justified. Sailing schedules, documentation and port handoffs are coordinated on your behalf.', 'Import & export', '12–35 days', 1],
  ['freight-forwarding', 'Freight Forwarding', 'MULTI', 'End-to-end coordination across road, air and sea.', 'When a shipment crosses modes, forwarding is the work of making the joins invisible. We plan the route, book each leg, and manage the transfer points between them.', 'Multi-modal', 'Route dependent', 0],
  ['packers-movers', 'Packers & Movers', 'ROAD', 'Home and office relocation with secure packing and careful handling.', 'Full relocation service: survey, packing to the fragility of each item, loading, transport and reassembly at the destination. Office moves are sequenced so you lose the least working time.', 'Local & intercity', '1–5 days', 0],
  ['door-to-door', 'Door-to-Door Delivery', 'MULTI', 'Pickup to final drop with no coordination needed from your side.', 'A single booking that covers collection, line haul and final delivery. You hand over the cargo and receive proof of delivery — everything between is ours to manage.', 'Pan-India', 'Route dependent', 0],
  ['import-export', 'Import & Export Logistics', 'MULTI', 'Shipment planning, documentation and cargo movement for international trade.', 'Support for businesses moving goods across borders: routing, commercial documentation, coordination with customs agents and inland movement at both ends.', 'International', 'Route dependent', 0],
  ['customs-clearance', 'Customs Clearance', 'MULTI', 'Documentation and clearance handled through established CHA partners.', 'Customs work is coordinated through vetted Customs House Agent partners. We prepare and chase the documentation and stay accountable for the clearance timeline.', 'Ports & airports', '1–5 days', 0],
  ['warehousing', 'Warehousing & Distribution', 'MULTI', 'Secure storage and distribution via partner facilities.', 'Short and medium-term storage with distribution out to your delivery points, arranged through partner warehouses selected for the location and the goods.', 'Bengaluru & partner network', 'Ongoing', 0],
  ['packaging', 'Packaging & Cargo Handling', 'MULTI', 'Packing specified against the actual route and its risks.', 'Crating, palletising, wrapping and labelling. The specification is written against the journey, because a 30-day sea leg and an overnight road run damage cargo in different ways.', 'All modes', 'At pickup', 0],
  ['tracking', 'Shipment Tracking', 'MULTI', 'Status from pickup to delivery against your reference number.', 'Each shipment carries a reference that maps to its current stage. Status updates are issued at every transfer point rather than only on request.', 'All modes', 'Continuous', 0],
  ['express-delivery', 'Express Delivery', 'AIR', 'Tighter transit coordination for time-sensitive consignments.', 'For consignments where a missed date has a cost. Routing is chosen for speed, and the shipment is actively monitored rather than queued.', 'Domestic & international', 'Same day–3 days', 0],
  ['last-mile', 'Last-Mile Delivery', 'ROAD', 'Hub to customer doorstep with local delivery control.', 'The final leg from a distribution point to the end customer, run with local vehicles and drivers who know the delivery area.', 'Metro & tier-2', 'Same day–2 days', 0],
  ['multi-modal', 'Multi-Modal Transportation', 'MULTI', 'Road, air and sea combined to balance cost against speed.', 'Where no single mode fits the budget and the deadline, we combine them — sea for the long leg, road or air for the ends — and manage every transfer in between.', 'Domestic & international', 'Route dependent', 0]
];

const faqs = [
  ['Which services do you handle directly?', 'Road freight, domestic transportation, packers and movers, door-to-door delivery, freight forwarding, air freight, sea freight, packaging and cargo handling, shipment tracking, express delivery, last-mile delivery and multi-modal transportation are all handled directly by our team.'],
  ['How do customs clearance and warehousing work?', 'Both are coordinated through established partners — Customs House Agents for clearance, and partner facilities for warehousing. We prepare and chase the paperwork and remain your single point of contact, so a partner handoff never becomes your problem to manage.'],
  ['Can you handle import and export shipments?', 'Yes. We arrange shipment planning, commercial documentation, cargo movement and inland transport at both ends, coordinating with customs agents where clearance is required.'],
  ['How do I get a price?', 'Send the origin and destination, approximate weight and dimensions, and the date you need it delivered by. Use the quote form or email us directly. We confirm mode, transit window and price before anything moves.'],
  ['What information do you need to book a shipment?', 'Pickup and delivery addresses with contact numbers, cargo description, weight and dimensions, and any handling requirements. For international freight we will also need the commercial invoice and packing list.'],
  ['Where are you based?', 'Our office is at No. 28, 1st Cross, Kalkere Main Road, Ramamurthy Nagar, Bengaluru 560016. We operate pan-India lanes from there and handle international freight through port and airport partners.']
];

function seed({ force = false } = {}) {
  const has = (key) => getContent(key) !== null;

  if (force || !has('company')) setContent('company', company);
  if (force || !has('home')) setContent('home', home);
  if (force || !has('lanes')) setContent('lanes', lanes);
  if (force || !has('about')) setContent('about', about);
  if (force || !has('seo')) setContent('seo', seo);
  if (force || !has('popup')) setContent('popup', popup);

  const serviceCount = db.prepare('SELECT COUNT(*) AS n FROM services').get().n;
  if (force || serviceCount === 0) {
    if (force) db.exec('DELETE FROM services');
    const insert = db.prepare(
      `INSERT INTO services (slug, title, mode, summary, body, lane, transit, featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    services.forEach((s, i) => insert.run(...s, i));
  }

  const faqCount = db.prepare('SELECT COUNT(*) AS n FROM faqs').get().n;
  if (force || faqCount === 0) {
    if (force) db.exec('DELETE FROM faqs');
    const insert = db.prepare('INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)');
    faqs.forEach(([q, a], i) => insert.run(q, a, i));
  }

  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (userCount === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@hnxtlogistics.com';
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe!2026';
    db.prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)').run(
      email.toLowerCase(),
      process.env.ADMIN_NAME || 'Site Administrator',
      bcrypt.hashSync(password, 12),
      'owner'
    );
    console.log(`\n  Admin account created\n  ─────────────────────\n  Email:    ${email}\n  Password: ${password}\n  Change this password after first sign-in.\n`);
  }

  console.log('Seed complete.');
}

seed({ force: process.argv.includes('--force') });
