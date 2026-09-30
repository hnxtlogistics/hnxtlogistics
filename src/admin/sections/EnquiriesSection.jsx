import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card, Empty, PanelHeader } from '../ui';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'closed', label: 'Closed' }
];

const STATUS_STYLE = {
  new: 'border-accent-500/45 bg-accent-500/10 text-accent-700',
  'in-progress': 'border-beacon/50 bg-beacon/12 text-[#8a6200]',
  closed: 'border-line/20 bg-line/6 text-content/66'
};

const SCOPE_LABEL = { domestic: 'Within India', international: 'International' };

const DETAIL_FIELDS = [
  ['scopeLabel', 'Shipment type'],
  ['origin', 'From'], ['destination', 'To'], ['mode', 'Mode'],
  ['weight', 'Weight'], ['dimensions', 'Dimensions'], ['company', 'Company'],
  ['subject', 'Subject']
];

function formatDate(value) {
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function EnquiriesSection() {
  const [data, setData] = useState({ enquiries: [], counts: {}, total: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const query = filter === 'all' ? '' : `?status=${filter}`;
    api
      .get(`/admin/enquiries${query}`)
      .then((payload) => { setData(payload); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id, status) {
    await api.patch(`/admin/enquiries/${id}`, { status }).catch((err) => setError(err.message));
    load();
  }

  async function destroy(id) {
    await api.del(`/admin/enquiries/${id}`).catch((err) => setError(err.message));
    setConfirmId(null);
    load();
  }

  return (
    <div>
      <PanelHeader
        title="Enquiries"
        description="Every message sent through the contact and quote forms. Nothing is lost even if email delivery fails."
      />
      {error && <p className="mb-6 text-sm text-accent-700">{error}</p>}

      <div className="mb-8 flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => {
          const active = filter === option.value;
          const count = option.value === 'all' ? data.total : data.counts[option.value] ?? 0;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={active}
              className={`border px-4 py-2 font-label text-[11px] uppercase tracking-[0.12em] transition-colors ${
                active ? 'border-line bg-brand-2 text-on-brand' : 'border-line/20 text-content/72 hover:border-line/45'
              }`}
            >
              {option.label}
              {count > 0 && <span className="ml-2 opacity-65">{count}</span>}
            </button>
          );
        })}
      </div>

      <Card title={loading ? 'Loading…' : `${data.enquiries.length} shown`}>
        {!loading && data.enquiries.length === 0 ? (
          <Empty>
            {filter === 'all'
              ? 'No enquiries yet. Messages sent through the website land here.'
              : `Nothing marked “${FILTERS.find((f) => f.value === filter)?.label}”.`}
          </Empty>
        ) : (
          <ul className="divide-y divide-line/10">
            {data.enquiries.map((enquiry) => {
              const open = openId === enquiry.id;
              const row = { ...enquiry, scopeLabel: SCOPE_LABEL[enquiry.scope] || '' };
              const details = DETAIL_FIELDS.filter(([key]) => row[key]);
              return (
                <li key={enquiry.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className={`border px-2 py-[3px] font-label text-[10px] uppercase tracking-[0.12em] ${STATUS_STYLE[enquiry.status]}`}>
                      {enquiry.status}
                    </span>
                    <span className="font-label text-[11px] tracking-[0.1em] text-content/62">{enquiry.ref}</span>
                    <span className="font-label text-[10px] uppercase tracking-[0.12em] text-content/62">{enquiry.kind}</span>
                    {enquiry.scope && (
                      <span className="border border-accent-700/35 bg-accent-500/8 px-1.5 py-[2px] font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-700">
                        {enquiry.scope === 'international' ? 'INTL' : 'DOMESTIC'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : enquiry.id)}
                      aria-expanded={open}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate font-medium">{enquiry.name}</span>
                      <span className="block truncate text-sm text-content/66">
                        {enquiry.subject || (enquiry.origin && enquiry.destination ? `${enquiry.origin} → ${enquiry.destination}` : enquiry.email)}
                      </span>
                    </button>

                    <span className="font-label text-[11px] text-content/62">{formatDate(enquiry.created_at)}</span>
                    <span aria-hidden="true" className={`text-content/62 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
                  </div>

                  {open && (
                    <div className="mt-5 border border-line/12 bg-on-brand/60 p-5">
                      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                        <div>
                          <dt className="font-label text-[10px] uppercase tracking-[0.12em] text-content/62">Email</dt>
                          <dd className="mt-0.5 text-sm"><a href={`mailto:${enquiry.email}`} className="break-all hover:text-accent-500">{enquiry.email}</a></dd>
                        </div>
                        {enquiry.phone && (
                          <div>
                            <dt className="font-label text-[10px] uppercase tracking-[0.12em] text-content/62">Phone</dt>
                            <dd className="mt-0.5 text-sm"><a href={`tel:${enquiry.phone}`} className="hover:text-accent-500">{enquiry.phone}</a></dd>
                          </div>
                        )}
                        {details.map(([key, label]) => (
                          <div key={key}>
                            <dt className="font-label text-[10px] uppercase tracking-[0.12em] text-content/62">{label}</dt>
                            <dd className="mt-0.5 text-sm">{row[key]}</dd>
                          </div>
                        ))}
                      </dl>

                      {enquiry.message && (
                        <div className="mt-5 border-t border-line/12 pt-4">
                          <p className="font-label text-[10px] uppercase tracking-[0.12em] text-content/62">Message</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{enquiry.message}</p>
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line/12 pt-4">
                        <a href={`mailto:${enquiry.email}?subject=Re:%20${enquiry.ref}`} className="btn btn-ink !py-2 !px-4 !text-xs">
                          Reply by email
                        </a>
                        <span className="font-label text-[10px] uppercase tracking-[0.12em] text-content/62">
                          {enquiry.mailed ? 'Emailed to you' : 'Saved here only'}
                        </span>
                        {['new', 'in-progress', 'closed']
                          .filter((status) => status !== enquiry.status)
                          .map((status) => (
                            <button key={status} type="button" onClick={() => setStatus(enquiry.id, status)} className="btn btn-ghost-dark !py-2 !px-4 !text-xs">
                              Mark {status}
                            </button>
                          ))}
                        {confirmId === enquiry.id ? (
                          <span className="ml-auto flex items-center gap-3 font-label text-[11px] uppercase tracking-[0.1em]">
                            <span className="text-content/72">Delete permanently?</span>
                            <button type="button" onClick={() => destroy(enquiry.id)} className="text-accent-700 hover:text-accent-500">Yes</button>
                            <button type="button" onClick={() => setConfirmId(null)} className="text-content/65 hover:text-content">No</button>
                          </span>
                        ) : (
                          <button type="button" onClick={() => setConfirmId(enquiry.id)} className="ml-auto font-label text-[11px] uppercase tracking-[0.1em] text-accent-700 hover:text-accent-500">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
