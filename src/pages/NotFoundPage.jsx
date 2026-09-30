import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { Eyebrow } from '../components/primitives';

export default function NotFoundPage() {
  useDocumentMeta({ title: 'Page not found — HNXT Logistics' });

  return (
    <section className="flex min-h-screen items-center bg-brand pt-[76px] text-on-brand">
      <div className="shell py-24">
        <Eyebrow className="text-accent-400">Error 404</Eyebrow>
        <h1 className="mt-5 max-w-3xl text-[length:var(--text-display)]">
          This consignment never arrived
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-brand/72">
          The page you asked for is not at this address. It may have moved, or the link may be wrong.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/" className="btn btn-accent">Back to home</Link>
          <Link to="/services" className="btn btn-ghost-light">Browse services</Link>
        </div>
      </div>
    </section>
  );
}
