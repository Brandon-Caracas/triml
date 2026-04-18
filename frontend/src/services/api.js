import axios from 'axios';

const API = axios.create({
  baseURL: "https://triml.onrender.com/api",
  timeout: 10000
});

// Agregar token a cada request
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  registro: (datos) => API.post('/auth/registro', datos),
  login: (email, contraseña) => API.post('/auth/login', { email, contraseña }),
  verificar: () => API.get('/auth/verificar')
};

// Reservas API
export const reservasAPI = {
  obtenerHorarios: (peluqueroId, fecha) =>
    API.get('/reservas/horarios-disponibles', { params: { peluqueroId, fecha } }),
  crear: (datos) => API.post('/reservas/crear', datos),
  obtenerMias: (telefono) => API.get('/reservas/mis-reservas', { params: { telefono } }),
  obtenerMisCitasRegistradas: () => API.get('/reservas/mis-citas-registradas'),
  cancelar: (reservaId) => API.put(`/reservas/${reservaId}/cancelar`)
};

// Servicios API
export const serviciosAPI = {
  obtener: (peluqueroId) => API.get('/servicios', { params: { peluqueroId } }),
  crear: (datos) => API.post('/servicios', datos),
  actualizar: (servicioId, datos) => API.put(`/servicios/${servicioId}`, datos),
  eliminar: (servicioId) => API.delete(`/servicios/${servicioId}`)
};

// Peluqueros API
export const peluquerosAPI = {
  obtenerAgenda: (fecha) => API.get('/peluqueros/agenda', { params: { fecha } }),
  obtenerProximas: () => API.get('/peluqueros/proximas-citas'),
  completarCita: (reservaId) => API.put(`/peluqueros/${reservaId}/completar`),
  marcarNoAsistio: (reservaId) => API.put(`/peluqueros/${reservaId}/no-asistio`),
  obtenerIngresos: () => API.get('/peluqueros/ingresos'),
  actualizarHorarios: (datos) => API.put('/peluqueros/horarios', datos),
  // Gestión de servicios
  obtenerMisServicios: () => API.get('/peluqueros/servicios'),
  crearServicio: (datos) => API.post('/peluqueros/servicios', datos),
  editarServicio: (id, datos) => API.put(`/peluqueros/servicios/${id}`, datos),
  eliminarServicio: (id) => API.delete(`/peluqueros/servicios/${id}`),
  // Gestión de bloqueos
  obtenerBloqueos: () => API.get('/peluqueros/bloqueos'),
  crearBloqueo: (datos) => API.post('/peluqueros/bloqueos', datos),
  eliminarBloqueo: (id) => API.delete(`/peluqueros/bloqueos/${id}`),
  // Público
  obtenerActivos: (negocio) => API.get('/peluqueros/activos', { params: { negocio } })
};

// Admin API
export const adminAPI = {
  obtenerPeluqueros: () => API.get('/admin/peluqueros'),
  crearPeluquero: (datos) => API.post('/admin/peluqueros/crear', datos),
  bloquearPeluquero: (peluqueroId, razon) => 
    API.put(`/admin/peluqueros/${peluqueroId}/bloquear`, { razon }),
  desbloquearPeluquero: (peluqueroId) => 
    API.put(`/admin/peluqueros/${peluqueroId}/desbloquear`),
  renovarSuscripcion: (peluqueroId, meses) => 
    API.put(`/admin/peluqueros/${peluqueroId}/renovar-suscripcion`, { meses }),
  obtenerEstadisticas: () => API.get('/admin/estadisticas'),
  obtenerTodasLasCitas: () => API.get('/admin/citas'),
  obtenerReporte: (peluqueroId) => API.get(`/admin/peluqueros/${peluqueroId}/reporte`),
  obtenerClientes: (negocioId) => API.get('/admin/clientes', { params: negocioId ? { negocioId } : {} }),
  asignarNegocio: (peluqueroId, negocioId) => API.put(`/admin/peluqueros/${peluqueroId}/asignar-negocio`, { negocioId })
};

// Reseñas API
export const resenasAPI = {
  crear: (datos) => API.post('/resenas', datos),
  obtenerPorPeluquero: (peluqueroId) => API.get(`/resenas/${peluqueroId}`)
};

// Negocios API (Multi-tenant)
export const negociosAPI = {
  obtenerConfiguracion: (slug) => API.get(`/negocios/${slug}`),
  actualizarConfiguracion: (datos) => API.put('/negocios/config', datos),
  // Admin
  obtenerTodos: () => API.get('/negocios'),
  crear: (datos) => API.post('/negocios', datos),
  editar: (id, datos) => API.put(`/negocios/admin/${id}`, datos),
  eliminar: (id) => API.delete(`/negocios/admin/${id}`),
  toggleEstado: (id) => API.put(`/negocios/admin/${id}/toggle`)
};

// Notificaciones API
export const notificacionesAPI = {
  obtenerNuestras: () => API.get('/notificaciones'),
  obtenerNoLeidas: () => API.get('/notificaciones/no-leidas'),
  marcarLeida: (id) => API.put(`/notificaciones/${id}/leida`),
  marcarTodasLeidas: () => API.put('/notificaciones/marcar-todas-leidas'),
  eliminar: (id) => API.delete(`/notificaciones/${id}`),
  obtenerVapidKey: () => API.get('/notificaciones/vapid-public-key'),
  suscribirPush: (suscripcion) => API.post('/notificaciones/subscribe', suscripcion)
};

export default API;
