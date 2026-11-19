/**
 * Cliente HTTP de la API LA BRASA VIVA.
 * - Agrega el header Authorization: Bearer <token> cuando hay sesion.
 * - Convierte las respuestas de error del backend (ErrorResponse) en un Error legible.
 */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const TOKEN_KEY = 'brasaviva.token';

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (t) => sessionStorage.setItem(TOKEN_KEY, t),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const MENSAJES_POR_ESTADO = {
  401: 'Tu sesión expiró o no has iniciado sesión.',
  403: 'Tu rol no tiene permiso para esta acción.',
  404: 'El recurso no existe.',
  429: 'Demasiados intentos. Espera un momento e intenta de nuevo.',
};

async function request(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `No se pudo conectar con la API (${API_URL}). ¿Está corriendo el backend?`);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    const message =
      (data && typeof data === 'object' && data.message) ||
      MENSAJES_POR_ESTADO[res.status] ||
      `Error ${res.status}`;
    const details = (data && Array.isArray(data.details) && data.details) || [];
    throw new ApiError(res.status, message, details);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
};

export const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return s ? `?${s}` : '';
};
