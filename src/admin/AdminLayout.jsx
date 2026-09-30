import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from './AuthContext';

const GROUPS = [
  {
    title: 'Inbox',
    items: [{ to: '/admin', label: 'Enquiries', end: true, icon: 'mail' }]
  },
  {
    title: 'Website content',
    items: [
      { to: '/admin/company', label: 'Contact details', icon: 'pin' },
      { to: '/admin/homepage', label: 'Home page', icon: 'clipboard' },
      { to: '/admin/about', label: 'About page', icon: 'shield' },
      { to: '/admin/services', label: 'Services', icon: 'box' },
      { to: '/admin/lanes', label: 'Lane board', icon: 'route' },
      { to: '/admin/faqs', label: 'FAQs', icon: 'check' },
      { to: '/admin/popup', label: 'Contact pop-up', icon: 'bolt' }
    ]
  },
  {
    title: 'Settings',
    items: [
      { to: '/admin/seo', label: 'Search listing', icon: 'globe' },
      { to: '/admin/notifications', label: 'Email alerts', icon: 'mail' },
      { to: '/admin/account', label: 'Your account', icon: 'shield' }
    ]
  }
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 border-l-2 px-5 py-2.5 text-sm transition-colors ${
      isActive
        ? 'border-accent-400 bg-on-brand/10 font-semibold text-on-brand'
        : 'border-transparent text-on-brand/75 hover:bg-on-brand/5 hover:text-on-brand'
    }`;

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      {/* Small screens get a fixed bar plus a slide-in drawer; from lg the
          same markup is a permanent column. */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-brand/50 lg:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col bg-brand transition-transform duration-300 lg:static lg:z-auto lg:w-72 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* White band so the logo keeps its own colours here too. The mark
            already carries the company name, so only the tool name is set
            beside it. */}
        <div className="flex items-center justify-between gap-3 bg-surface px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src="/img/logo.png" alt="" className="h-8 w-auto shrink-0" width="500" height="167" />
            <p className="whitespace-nowrap font-display text-sm font-bold text-content">Site manager</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-content/70 transition-colors hover:bg-surface-2 hover:text-content lg:hidden"
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        <nav
          aria-label="Admin sections"
          className="flex-1 overflow-y-auto py-5"
        >
          {GROUPS.map((group) => (
            <div key={group.title} className="mb-6 last:mb-0">
              <p className="px-5 pb-2 font-label text-[10px] font-bold uppercase tracking-[0.14em] text-on-brand/45">
                {group.title}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  <Icon name={item.icon} size={17} className="opacity-70" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-on-brand/10 p-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500/20 font-display text-sm font-bold text-on-brand"
            >
              {(user?.name || user?.email || '?').trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-on-brand">{user?.name}</p>
              <p className="truncate font-label text-[11px] text-on-brand/55">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm border border-on-brand/25 px-4 py-2.5 font-display text-sm font-semibold text-on-brand transition-colors hover:border-accent-400 hover:bg-accent-500/15 hover:text-on-brand"
          >
            <Icon name="arrowRight" size={16} />
            Sign out
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-on-brand/60 transition-colors hover:text-on-brand"
          >
            <Icon name="globe" size={14} />
            View website
          </a>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line/12 bg-surface px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="admin-sidebar"
            className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-sm border border-line/20"
          >
            <span className="h-[2px] w-5 bg-content" />
            <span className="h-[2px] w-5 bg-content" />
            <span className="h-[2px] w-5 bg-content" />
          </button>
          <img src="/img/logo.png" alt="" className="h-8 w-auto" width="500" height="167" />
          <span className="font-display text-sm font-bold">Site manager</span>
        </div>

        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 lg:px-8 lg:py-14">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
