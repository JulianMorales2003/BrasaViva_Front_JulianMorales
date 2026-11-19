import { api, qs } from './client.js';

/** Un servicio por controlador del backend (mismas rutas /api/v1/...). */

export const authService = {
  login: (email, password) => api.post('/api/v1/auth/login', { email, password }),
  registrar: (dto) => api.post('/api/v1/auth/register', dto),
  me: () => api.get('/api/v1/auth/me'),
};

export const menuService = {
  listar: (categoria) => api.get(`/api/v1/menu${qs({ categoria })}`),
};

export const platoService = {
  listar: () => api.get('/api/v1/platos'),
  crear: (dto) => api.post('/api/v1/platos', dto),
  actualizar: (id, dto) => api.put(`/api/v1/platos/${id}`, dto),
  cambiarDisponibilidad: (id, disponible) => api.patch(`/api/v1/platos/${id}/disponible`, { disponible }),
  eliminar: (id) => api.del(`/api/v1/platos/${id}`),
};

export const mesaService = {
  listar: (estado) => api.get(`/api/v1/mesas${qs({ estado })}`),
  crear: (dto) => api.post('/api/v1/mesas', dto),
};

export const cuentaService = {
  abrir: (idMesa) => api.post('/api/v1/cuentas', { idMesa }),
  abiertaPorMesa: (idMesa) => api.get(`/api/v1/cuentas/mesa/${idMesa}`),
  pagar: (id, medioPago, montoRecibido) => api.post(`/api/v1/cuentas/${id}/pago`, { medioPago, montoRecibido }),
};

export const pedidoService = {
  crear: (dto) => api.post('/api/v1/pedidos', dto),
  listar: (estado) => api.get(`/api/v1/pedidos${qs({ estado })}`),
  cocina: () => api.get('/api/v1/pedidos/cocina'),
  activosPorMesa: (idMesa) => api.get(`/api/v1/pedidos/mesa/${idMesa}`),
  obtener: (id) => api.get(`/api/v1/pedidos/${id}`),
  agregarItem: (id, item) => api.post(`/api/v1/pedidos/${id}/items`, item),
  cambiarEstado: (id, estado) => api.patch(`/api/v1/pedidos/${id}/estado`, { estado }),
  cancelar: (id) => api.del(`/api/v1/pedidos/${id}`),
};

export const reservaService = {
  listar: (cliente) => api.get(`/api/v1/reservas${qs({ cliente })}`),
  crear: (dto) => api.post('/api/v1/reservas', dto),
  actualizar: (id, dto) => api.put(`/api/v1/reservas/${id}`, dto),
  cancelar: (id) => api.del(`/api/v1/reservas/${id}`),
};

export const parqueaderoService = {
  disponibilidad: () => api.get('/api/v1/parqueadero/disponibilidad'),
  activos: () => api.get('/api/v1/parqueadero/activos'),
  entrada: (placa) => api.post('/api/v1/parqueadero/entrada', { placa }),
  salida: (placa) => api.post(`/api/v1/parqueadero/salida/${encodeURIComponent(placa)}`),
};

export const reporteService = {
  resumen: () => api.get('/api/v1/reportes/resumen'),
  populares: (top) => api.get(`/api/v1/reportes/platos-populares${qs({ top })}`),
  ingresos: (desde, hasta) => api.get(`/api/v1/reportes/ingresos${qs({ desde, hasta })}`),
};

export const usuarioService = {
  listar: () => api.get('/api/v1/usuarios'),
  crear: (dto) => api.post('/api/v1/usuarios', dto),
};
