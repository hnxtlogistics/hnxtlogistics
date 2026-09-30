const BASE = '/api';

/** Thrown for any non-2xx response. `fields` carries per-input messages. */
export class ApiError extends Error {
  constructor(message, { status = 0, fields = {} } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Check your connection and try again.');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    throw new ApiError(payload.error || `Request failed (${response.status}).`, {
      status: response.status,
      fields: payload.fields || {}
    });
  }
  return payload;
}

export const api = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' })
};
