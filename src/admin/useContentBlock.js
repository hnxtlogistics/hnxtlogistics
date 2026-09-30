import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';

/**
 * Loads one editable content block, tracks the draft against the saved
 * baseline, and PUTs it back. Field-level errors come from the server's
 * schema so the admin sees exactly which input is wrong.
 */
export function useContentBlock(key) {
  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let live = true;
    api
      .get(`/admin/content/${key}`)
      .then((value) => {
        if (!live) return;
        setDraft(value);
        setBaseline(value);
        setLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setError(err.message);
        setLoading(false);
      });
    return () => { live = false; };
  }, [key]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  const set = useCallback((patch) => {
    setSaved(false);
    setDraft((current) => (Array.isArray(current) ? patch : { ...current, ...patch }));
  }, []);

  const replace = useCallback((value) => {
    setSaved(false);
    setDraft(value);
  }, []);

  const reset = useCallback(() => {
    setDraft(baseline);
    setFieldErrors({});
    setError('');
  }, [baseline]);

  const save = useCallback(
    async (event) => {
      event?.preventDefault?.();
      setSaving(true);
      setError('');
      setFieldErrors({});
      try {
        const value = await api.put(`/admin/content/${key}`, draft);
        setDraft(value);
        setBaseline(value);
        setSaved(true);
      } catch (err) {
        if (err instanceof ApiError) {
          setFieldErrors(err.fields || {});
          setError(Object.keys(err.fields || {}).length ? 'Check the highlighted fields.' : err.message);
        } else {
          setError('Could not save. Try again.');
        }
      } finally {
        setSaving(false);
      }
    },
    [key, draft]
  );

  return { draft, set, replace, dirty, loading, saving, saved, error, fieldErrors, reset, save };
}
