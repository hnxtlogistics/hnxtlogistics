/**
 * Shown when /api/site cannot be reached after retries. A blank page tells
 * a visitor nothing, so this states what happened and still gives them a
 * way to make contact.
 */
export default function SiteUnavailable({ onRetry }) {
  return (
    <main className="flex min-h-screen items-center bg-brand px-6 text-on-brand">
      <div className="mx-auto max-w-lg py-24">
        <p className="eyebrow text-accent-400">Connection problem</p>
        <h1 className="mt-5 text-[length:var(--text-display)]">We cannot load the site right now</h1>
        <p className="mt-6 text-lg leading-relaxed text-on-brand/74">
          This is a problem on our side, not yours. Try again in a moment — or reach us directly and
          we will pick it up from there.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <button type="button" onClick={onRetry} className="btn btn-accent">Try again</button>
          <a href="mailto:info@hnxtlogistics.com" className="btn btn-ghost-light">
            Email us
          </a>
        </div>
      </div>
    </main>
  );
}
