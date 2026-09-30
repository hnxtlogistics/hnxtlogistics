import { useContentBlock } from '../useContentBlock';
import { Field } from '../../components/primitives';
import { Card, PanelHeader, SaveBar } from '../ui';

const GROUPS = [
  {
    title: 'Identity',
    fields: [
      { name: 'name', label: 'Company name', required: true },
      { name: 'legalName', label: 'Registered legal name', hint: 'Shown in the footer copyright' },
      { name: 'tagline', label: 'Tagline', hint: 'One line, shown in the footer' },
      { name: 'gstin', label: 'GSTIN', hint: 'Leave empty to hide it' }
    ]
  },
  {
    title: 'How people reach you',
    fields: [
      { name: 'email', label: 'Email address', type: 'email' },
      { name: 'phone', label: 'Phone number', hint: 'Appears in the header, footer and contact page' },
      { name: 'whatsapp', label: 'WhatsApp number', hint: 'With country code, e.g. +91 98860 12345' },
      { name: 'hours', label: 'Opening hours' }
    ]
  },
  {
    title: 'Office address',
    fields: [
      { name: 'addressLine1', label: 'Address line 1' },
      { name: 'addressLine2', label: 'Address line 2' },
      { name: 'city', label: 'City' },
      { name: 'state', label: 'State' },
      { name: 'pincode', label: 'PIN code' },
      { name: 'country', label: 'Country' }
    ]
  },
  {
    title: 'Map and local search',
    fields: [
      { name: 'mapsUrl', label: 'Google Maps / Business Profile URL', hint: 'Helps you appear in local map results' },
      { name: 'latitude', label: 'Latitude', hint: 'e.g. 13.0186 — leave empty if unsure' },
      { name: 'longitude', label: 'Longitude', hint: 'e.g. 77.6786 — leave empty if unsure' }
    ]
  },
  {
    title: 'Social profiles',
    fields: [
      { name: 'instagram', label: 'Instagram URL', hint: 'Full URL including https://' },
      { name: 'linkedin', label: 'LinkedIn URL' },
      { name: 'facebook', label: 'Facebook URL' }
    ]
  }
];

export default function CompanySection() {
  const block = useContentBlock('company');
  if (block.loading) return <p className="text-sm text-content/66">Loading…</p>;
  if (!block.draft) return <p className="text-sm text-accent-700">{block.error}</p>;

  return (
    <form onSubmit={block.save} noValidate>
      <PanelHeader
        title="Contact details"
        description="These values appear everywhere on the site — header, footer, contact page and the map. Change one here and it updates everywhere at once. Leave a field empty to hide it from the site."
      />

      {GROUPS.map((group) => (
        <Card key={group.title} title={group.title}>
          <div className="grid gap-6 sm:grid-cols-2">
            {group.fields.map((field) => (
              <Field
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type}
                hint={field.hint}
                required={field.required}
                value={block.draft[field.name] ?? ''}
                error={block.fieldErrors[field.name]}
                onChange={(e) => block.set({ [field.name]: e.target.value })}
              />
            ))}
          </div>
        </Card>
      ))}

      <SaveBar dirty={block.dirty} saving={block.saving} saved={block.saved} error={block.error} onReset={block.reset} />
    </form>
  );
}
