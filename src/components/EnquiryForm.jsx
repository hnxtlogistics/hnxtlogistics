import { useMemo, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { Field } from './primitives';
import LocationSelect from './LocationSelect';
import { DISTRICT_OPTIONS, DISTRICTS_BY_STATE, STATES } from '../data/districts';
import { COUNTRY_OPTIONS } from '../data/countries';

const MODE_OPTIONS = [
  { value: '', label: 'Not sure — advise me' },
  { value: 'ROAD', label: 'Road freight' },
  { value: 'AIR', label: 'Air freight' },
  { value: 'SEA', label: 'Sea freight' },
  { value: 'MULTI', label: 'Multi-modal' }
];

const BLANK = {
  name: '', email: '', phone: '', company: '', subject: '', message: '',
  scope: 'domestic', origin: '', destination: '',
  originState: '', destinationState: '',
  mode: '', weight: '', dimensions: '', website: ''
};

const SCOPES = [
  { value: 'domestic', label: 'Within India', detail: 'District to district' },
  { value: 'international', label: 'International', detail: 'Import or export' }
];

/* Deliberately a little looser than the server's check, so the browser never
   rejects an address the server would accept; it catches the common slips
   (missing @, missing domain ending, stray spaces) as the visitor types. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_ERROR = 'Please enter a valid email ID.';

const STATE_OPTIONS = STATES.map((state) => ({ value: state, label: state }));

export default function EnquiryForm({ kind = 'contact' }) {
  const [values, setValues] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [state, setState] = useState('idle');
  const [reference, setReference] = useState('');

  const isQuote = kind === 'quote';
  const isDomestic = values.scope === 'domestic';

  /* Each end of the lane gets its own state, so an inter-state move picks
     Karnataka at one end and Maharashtra at the other. Choosing a state
     narrows that end's district list; leaving it blank searches all 757. */
  const districtsFor = (state) => {
    if (!state) return DISTRICT_OPTIONS;
    return (DISTRICTS_BY_STATE[state] || []).map((district) => ({
      value: `${district}, ${state}`,
      label: district,
      meta: state
    }));
  };

  const originDistricts = useMemo(() => districtsFor(values.originState), [values.originState]);
  const destinationDistricts = useMemo(() => districtsFor(values.destinationState), [values.destinationState]);

  const modeOptions = useMemo(
    () => (isDomestic ? MODE_OPTIONS.filter((o) => o.value !== 'SEA') : MODE_OPTIONS),
    [isDomestic]
  );

  /* Switching scope invalidates every location already chosen. */
  function setScope(scope) {
    setValues((current) => ({
      ...current, scope,
      origin: '', destination: '', originState: '', destinationState: '', mode: ''
    }));
    setErrors((current) => ({ ...current, origin: undefined, destination: undefined }));
  }

  /* Changing a state clears only that end's district, never the other. */
  function setStateFor(end, state) {
    setValues((current) => ({
      ...current,
      [`${end}State`]: state,
      [end]: ''
    }));
  }

  const update = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  /* Checked when the visitor leaves the field, not on every keystroke, so
     the message does not appear while an address is still being typed. */
  const checkEmail = (event) => {
    const email = event.target.value.trim();
    if (email && !EMAIL_PATTERN.test(email)) {
      setErrors((current) => ({ ...current, email: EMAIL_ERROR }));
    }
  };

  async function onSubmit(event) {
    event.preventDefault();
    setState('sending');
    setErrors({});
    setFormError('');

    try {
      const payload = { ...values, kind };
      /* Scope describes a shipment. A general message does not have one, and
         stamping it "domestic" puts a misleading badge in the inbox. */
      if (!isQuote) payload.scope = '';
      const { ref } = await api.post('/enquiries', payload);
      setReference(ref);
      setState('sent');
      setValues(BLANK);
    } catch (err) {
      setState('idle');
      if (err instanceof ApiError) {
        setErrors(err.fields || {});
        setFormError(Object.keys(err.fields || {}).length ? '' : err.message);
      } else {
        setFormError('Something went wrong. Please try again, or email us directly.');
      }
    }
  }

  if (state === 'sent') {
    return (
      <div
        role="status"
        className="border border-sea/40 bg-sea/8 p-8 text-center lg:p-12"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sea/15">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" className="text-sea" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-6 text-2xl">Enquiry received</h3>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-content/68">
          We have logged it against reference{' '}
          <span className="font-label font-medium text-content">{reference}</span>. Quote the reference
          in any reply and we will pick up the same thread.
        </p>
        <button
          type="button"
          onClick={() => { setState('idle'); setReference(''); }}
          className="btn btn-ghost-dark mt-8"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <p role="alert" className="border border-accent-600/40 bg-accent-500/8 px-4 py-3 text-sm text-accent-700">
          {formError}
        </p>
      )}

      {isQuote && (
        <fieldset className="space-y-6 border border-line/14 bg-surface/60 p-6">
          <legend className="eyebrow px-2 text-content/70">Shipment</legend>

          {/* Whether the move crosses a border decides what the location
              fields even are, so it is asked first. */}
          <div role="radiogroup" aria-label="Where is this shipment going?">
            <span className="field-label">Type of shipment</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {SCOPES.map((option) => {
                const selected = values.scope === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                      selected
                        ? 'border-accent-500 bg-accent-500/8'
                        : 'border-line/18 bg-surface hover:border-line/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value={option.value}
                      checked={selected}
                      onChange={() => setScope(option.value)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent-500)]"
                    />
                    <span>
                      <span className="block font-display text-[15px] font-semibold">{option.label}</span>
                      <span className="mt-0.5 block text-[13px] text-content/70">{option.detail}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {isDomestic ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-5 border border-line/12 bg-canvas/60 p-4">
                <p className="eyebrow text-content/70">Collected from</p>
                <LocationSelect
                  label="State" name="originState" value={values.originState}
                  onChange={(e) => setStateFor('origin', e.target.value)}
                  options={STATE_OPTIONS} error={errors.originState}
                  placeholder="Start typing a state"
                  hint="Optional — narrows the districts below"
                  freeTextHint="Not in the list — we will confirm this with you."
                />
                <LocationSelect
                  label="District" name="origin" value={values.origin} onChange={update}
                  options={originDistricts} error={errors.origin} required
                  placeholder="Start typing a district"
                  hint={values.originState ? `Districts in ${values.originState}` : 'District or city in India'}
                  freeTextHint="Not in the list — we will confirm this location with you."
                />
              </div>

              <div className="space-y-5 border border-line/12 bg-canvas/60 p-4">
                <p className="eyebrow text-content/70">Delivered to</p>
                <LocationSelect
                  label="State" name="destinationState" value={values.destinationState}
                  onChange={(e) => setStateFor('destination', e.target.value)}
                  options={STATE_OPTIONS} error={errors.destinationState}
                  placeholder="Start typing a state"
                  hint="Optional — narrows the districts below"
                  freeTextHint="Not in the list — we will confirm this with you."
                />
                <LocationSelect
                  label="District" name="destination" value={values.destination} onChange={update}
                  options={destinationDistricts} error={errors.destination} required
                  placeholder="Start typing a district"
                  hint={values.destinationState ? `Districts in ${values.destinationState}` : 'District or city in India'}
                  freeTextHint="Not in the list — we will confirm this location with you."
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <LocationSelect
                label="Collected from" name="origin" value={values.origin} onChange={update}
                options={COUNTRY_OPTIONS} error={errors.origin} required
                placeholder="Start typing a country" hint="Country of origin"
                freeTextHint="Not in the list — we will confirm this location with you."
              />
              <LocationSelect
                label="Delivered to" name="destination" value={values.destination} onChange={update}
                options={COUNTRY_OPTIONS} error={errors.destination} required
                placeholder="Start typing a country" hint="Destination country"
                freeTextHint="Not in the list — we will confirm this location with you."
              />
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Total weight" name="weight" value={values.weight} onChange={update} error={errors.weight} placeholder="e.g. 850 kg" />
            <Field label="Dimensions" name="dimensions" value={values.dimensions} onChange={update} error={errors.dimensions} placeholder="e.g. 120 × 80 × 90 cm" />
            <Field label="Preferred mode" name="mode" value={values.mode} onChange={update} error={errors.mode} options={modeOptions} className="sm:col-span-2" />
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-6">
        <legend className="eyebrow text-content/66">{isQuote ? 'Your details' : 'Contact details'}</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Your name" name="name" value={values.name} onChange={update} error={errors.name} autoComplete="name" required />
          <Field label="Email" name="email" type="email" value={values.email} onChange={update} onBlur={checkEmail} error={errors.email} autoComplete="email" required />
          <Field label="Mobile number" name="phone" type="tel" value={values.phone} onChange={update} error={errors.phone} autoComplete="tel" required hint="So we can call you back about the shipment" />
          <Field label="Company" name="company" value={values.company} onChange={update} error={errors.company} autoComplete="organization" />
        </div>

        {!isQuote && (
          <Field label="Subject" name="subject" value={values.subject} onChange={update} error={errors.subject} placeholder="What is this about?" />
        )}

        <Field
          label={isQuote ? 'Anything else we should know' : 'Message'}
          name="message"
          rows={isQuote ? 4 : 6}
          value={values.message}
          onChange={update}
          error={errors.message}
          required={!isQuote}
          placeholder={isQuote ? 'Cargo type, handling requirements, target delivery date…' : 'Tell us what you need moved.'}
        />
      </fieldset>

      {/* Honeypot — off-screen and hidden from assistive tech. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={update} />
      </div>

      <div className="flex flex-wrap items-center gap-5 pt-2">
        <button type="submit" className="btn btn-accent" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : isQuote ? 'Request quote' : 'Send message'}
        </button>
        <p className="font-label text-[11px] leading-relaxed text-content/65">
          We reply within one working day.
        </p>
      </div>
    </form>
  );
}
