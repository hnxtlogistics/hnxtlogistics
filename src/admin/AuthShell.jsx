/** Shared frame for the sign-in, forgot-password and reset screens. */
export default function AuthShell({ title, lede, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-sm">
        <img src="/img/logo.png" alt="" className="mx-auto h-12 w-auto" width="500" height="167" />
        <h1 className="mt-8 text-center text-2xl">{title}</h1>
        {lede && <p className="mt-2 text-center text-sm leading-relaxed text-content/68">{lede}</p>}
        <div className="mt-9">{children}</div>
        {footer}
        <a
          href="/"
          className="mt-8 block text-center font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-content/65 transition-colors hover:text-accent-600"
        >
          ← Back to website
        </a>
      </div>
    </div>
  );
}
