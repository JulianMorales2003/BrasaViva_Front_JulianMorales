const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const dinero = (v) => (v === null || v === undefined ? '—' : cop.format(v));

export const fechaHora = (s) =>
  s ? new Date(s).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const hora = (s) => (s ? new Date(s).toLocaleTimeString('es-CO', { timeStyle: 'short' }) : '—');

export const minutosDesde = (s) => (s ? Math.max(0, Math.floor((Date.now() - new Date(s).getTime()) / 60000)) : 0);

export const CATEGORIAS = {
  ENTRADA: 'Entradas',
  CORTE: 'Cortes a la brasa',
  PLATO_FUERTE: 'Platos fuertes',
  ACOMPANAMIENTO: 'Acompañamientos',
  POSTRE: 'Postres',
  BEBIDA: 'Bebidas',
};

export const TERMINOS = { AZUL: 'Azul', TRES_CUARTOS: 'Tres cuartos', BIEN_ASADO: 'Bien asado' };

export const ESTADOS_PEDIDO = {
  RECIBIDO: 'Recibido',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const ROLES = { CLIENTE: 'Cliente', MESERO: 'Mesero', PARRILLERO: 'Parrillero', ADMIN: 'Administrador' };

/** "2026-11-20T19:30" (input datetime-local) -> LocalDateTime del backend */
export const aLocalDateTime = (v) => (v && v.length === 16 ? `${v}:00` : v);
export const deLocalDateTime = (v) => (v ? v.slice(0, 16) : '');
export const hoyISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
