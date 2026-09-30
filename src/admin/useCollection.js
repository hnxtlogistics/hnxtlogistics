import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

/** Loads a CRUD collection and keeps it in sync after each mutation. */
export function useCollection(path) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(
    () =>
      api
        .get(path)
        .then((data) => { setItems(data); setLoading(false); })
        .catch((err) => { setError(err.message); setLoading(false); }),
    [path]
  );

  useEffect(() => { reload(); }, [reload]);

  const create = async (body) => { await api.post(path, body); await reload(); };
  const update = async (id, body) => { await api.put(`${path}/${id}`, body); await reload(); };
  const remove = async (id) => { await api.del(`${path}/${id}`); await reload(); };

  return { items, loading, error, setError, create, update, remove, reload };
}
