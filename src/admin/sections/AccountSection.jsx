import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../AuthContext';
import { Field } from '../../components/primitives';
import { Card, Empty, PanelHeader } from '../ui';

export default function AccountSection() {
  const { user } = useAuth();
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get('/admin/activity').then(setActivity).catch(() => {});
  }, [state]);

  const set = (patch) => { setValues((current) => ({ ...current, ...patch })); setError(''); setState('idle'); };

  async function submit(event) {
    event.preventDefault();
    if (values.newPassword !== values.confirmPassword) {
      setError('The two new passwords do not match.');
      return;
    }
    setState('saving');
    try {
      await api.post('/admin/account/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setState('saved');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the password.');
      setState('idle');
    }
  }

  return (
    <div>
      <PanelHeader title="Your account" description="Signed in as the site administrator." />

      <Card title="Account">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="font-label text-[10px] uppercase tracking-[0.12em] text-content/62">Name</dt>
            <dd className="mt-1">{user?.name}</dd>
          </div>
          <div>
            <dt className="font-label text-[10px] uppercase tracking-[0.12em] text-content/62">Email</dt>
            <dd className="mt-1 break-all">{user?.email}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Change password">
        <form onSubmit={submit} noValidate className="max-w-md space-y-5">
          {error && <p role="alert" className="border border-accent-600/40 bg-accent-500/8 px-4 py-2.5 text-sm text-accent-700">{error}</p>}
          {state === 'saved' && <p role="status" className="border border-sea/40 bg-sea/8 px-4 py-2.5 text-sm text-sea">Password changed.</p>}

          <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" required value={values.currentPassword} onChange={(e) => set({ currentPassword: e.target.value })} />
          <Field label="New password" name="newPassword" type="password" autoComplete="new-password" required hint="At least 10 characters" value={values.newPassword} onChange={(e) => set({ newPassword: e.target.value })} />
          <Field label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required value={values.confirmPassword} onChange={(e) => set({ confirmPassword: e.target.value })} />

          <button type="submit" className="btn btn-ink !py-2.5 !text-sm" disabled={state === 'saving'}>
            {state === 'saving' ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </Card>

      <Card title="Recent activity">
        {activity.length === 0 ? (
          <Empty>No activity recorded yet.</Empty>
        ) : (
          <ul className="divide-y divide-line/10 font-label text-[12px]">
            {activity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-4 py-2.5">
                <span className="text-content/62">{entry.created_at}</span>
                <span className="text-accent-700">{entry.action}</span>
                {entry.entity && <span className="text-content/66">{entry.entity}</span>}
                <span className="ml-auto truncate text-content/62">{entry.user_email}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
