import { Link } from 'react-router-dom';
import { Eyebrow } from './primitives';

/** Dark banner at the top of every interior page, with a breadcrumb trail. */
export default function PageHeader({ eyebrow, title, lede, crumbs = [] }) {
  return (
    <section className="relative isolate overflow-hidden bg-brand pt-[76px] text-on-brand">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-accent-500/10 blur-[120px]"
      />
      <div className="shell relative py-16 lg:py-24">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 font-label text-[11px] uppercase tracking-[0.14em] text-on-brand/72">
              {crumbs.map((crumb, index) => (
                <li key={crumb.label} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {crumb.to ? (
                    <Link to={crumb.to} className="transition-colors hover:text-accent-400">{crumb.label}</Link>
                  ) : (
                    <span className="text-on-brand/80">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && <Eyebrow className="text-accent-400">{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-4xl text-[length:var(--text-display)]">{title}</h1>
        {lede && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-on-brand/72">{lede}</p>}
      </div>
    </section>
  );
}
