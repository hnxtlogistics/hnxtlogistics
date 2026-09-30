/**
 * Inline SVG icon set.
 *
 * Drawn as paths rather than pulled from an icon font or CDN: nothing extra
 * to download, no flash of missing glyphs, and each one inherits the current
 * text colour so it themes automatically.
 */
const PATHS = {
  phone: 'M6.6 2.5 8.4 6 6.9 7.9a12 12 0 0 0 5.2 5.2L14 11.6l3.5 1.8v3.1a1.6 1.6 0 0 1-1.8 1.5A14.6 14.6 0 0 1 3 5.3 1.6 1.6 0 0 1 4.5 3.5h2.1Z',
  mail: 'M2.5 5.5h15v9h-15zM2.5 6l7.5 5 7.5-5',
  whatsapp: 'M3 17l1-3.6A7 7 0 1 1 6.6 16L3 17Zm4.6-8.4c0 3 3.8 5.4 5.4 4.6.6-.3 1-1 .8-1.4l-1.3-.7-.9.9c-1-.4-1.7-1.1-2-2.1l.9-.9-.7-1.3c-.4-.2-1.1.1-1.5.7-.2.2-.3.4-.3.6Z',
  pin: 'M10 18s6-5.2 6-9.5A6 6 0 0 0 4 8.5C4 12.8 10 18 10 18Z M10 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  clock: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM10 6v4.2l2.8 1.7',
  instagram: 'M6.5 2.5h7a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4v-7a4 4 0 0 1 4-4Z M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M14.4 5.6h.01',
  linkedin: 'M3 7.5h2.6V17H3zM4.3 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM8 7.5h2.5v1.3a2.9 2.9 0 0 1 2.6-1.4c2 0 3.4 1.3 3.4 3.9V17h-2.6v-5.2c0-1.3-.5-2.1-1.6-2.1s-1.8.8-1.8 2.1V17H8Z',
  facebook: 'M12.5 6.5h2V3.8h-2c-2 0-3.3 1.3-3.3 3.4v1.5H7.5V11h1.7v6h2.6v-6h2l.4-2.3h-2.4V7.4c0-.6.3-.9.7-.9Z',
  truck: 'M2.5 5.5h9v8h-9zM11.5 8.5h3l3 3v2h-6zM6 16a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 6 16ZM14.5 16a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z',
  plane: 'M17.5 3.4a1.6 1.6 0 0 0-2.3 0l-2.8 2.8L4 4.3 2.6 5.7l6.6 3.8-2.6 2.6-2.7-.6-1.1 1.1 3 1.7 1.7 3 1.1-1.1-.6-2.7 2.6-2.6 3.8 6.6 1.4-1.4-1.9-8.4 2.8-2.8a1.6 1.6 0 0 0 0-2.3Z',
  ship: 'M3 13.5 4.5 9h11l1.5 4.5M6 9V5.5h8V9M10 3v2M2.5 13.5c1.7 1.6 3.3 1.6 5 0 1.7 1.6 3.3 1.6 5 0 1.7 1.6 3.3 1.6 5 0v3.2c-1.7 1.6-3.3 1.6-5 0-1.7 1.6-3.3 1.6-5 0-1.7 1.6-3.3 1.6-5 0Z',
  box: 'M10 2.5 17.5 6v8L10 17.5 2.5 14V6ZM2.5 6 10 9.6 17.5 6M10 9.6v7.9',
  globe: 'M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM2.5 10h15M10 2.5c2 2 3 4.6 3 7.5s-1 5.5-3 7.5c-2-2-3-4.6-3-7.5s1-5.5 3-7.5Z',
  shield: 'M10 2.5 16 5v5c0 3.6-2.4 6.6-6 7.5-3.6-.9-6-3.9-6-7.5V5ZM7.4 10l1.9 1.9 3.4-3.6',
  route: 'M5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 12.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5 7.5v2a3 3 0 0 0 3 3h4a3 3 0 0 1 3 3',
  warehouse: 'M2.5 8 10 3.5 17.5 8v9.5h-15Zm4 9.5v-6h7v6',
  sun: 'M10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM10 1.8v1.7M10 16.5v1.7M3.4 3.4l1.2 1.2M15.4 15.4l1.2 1.2M1.8 10h1.7M16.5 10h1.7M3.4 16.6l1.2-1.2M15.4 4.6l1.2-1.2',
  moon: 'M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z',
  monitor: 'M3 4h14v9H3zM7.5 17h5M10 13v4',
  arrowRight: 'M4 10h12M11 5l5 5-5 5',
  check: 'M4 10.5 8 14.5l8-9',
  clipboard: 'M7.5 3.5h5v2h-5zM6 4.5H4.5v13h11v-13H14M7 9.5h6M7 12.5h6',
  bolt: 'M11.5 2.5 4.5 11h4l-.5 6.5 7-8.5h-4z',
  layers: 'M10 2.5 2.5 6.5 10 10.5l7.5-4zM2.5 10.5 10 14.5l7.5-4M2.5 14 10 18l7.5-4',
  close: 'M4 4l12 12M16 4L4 16',
  eye: 'M1.5 10S4.6 4.5 10 4.5 18.5 10 18.5 10 15.4 15.5 10 15.5 1.5 10 1.5 10Z M10 12.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z',
  eyeOff: 'M8.1 5a6.8 6.8 0 0 1 1.9-.3c5.4 0 8.5 5.3 8.5 5.3a14 14 0 0 1-2.4 3M4.6 6.3A14.4 14.4 0 0 0 1.5 10S4.6 15.3 10 15.3a7 7 0 0 0 3.1-.7M8.4 8.5a2.3 2.3 0 0 0 3.2 3.2M2.5 2.5l15 15'
};

export default function Icon({ name, size = 18, className = '', strokeWidth = 1.6 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d={d} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS);
