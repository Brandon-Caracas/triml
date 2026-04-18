import express from 'express';
import {
  obtenerAgenda,
  obtenerProximasCitas,
  completarCita,
  obtenerIngresos,
  obtenerPeluquerosActivos,
  actualizarHorarios,
  obtenerMisServicios,
  crearServicioPeluquero,
  editarServicioPeluquero,
  eliminarServicioPeluquero,
  marcarNoAsistio
} from '../controllers/peluquerosController.js';
import {
  crearBloqueo,
  obtenerMisBloqueos,
  eliminarBloqueo
} from '../controllers/bloqueoController.js';
import { authMiddleware, roleMiddleware, subscriptionMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Ruta pública - obtener peluqueros activos (sin autentificación)
router.get('/activos', obtenerPeluquerosActivos);

// Proteger todas las rutas restantes - solo peluqueros
router.use(authMiddleware, roleMiddleware(['peluquero']), subscriptionMiddleware);

router.get('/agenda', obtenerAgenda);
router.get('/proximas-citas', obtenerProximasCitas);
router.put('/:reservaId/completar', completarCita);
router.put('/:reservaId/no-asistio', marcarNoAsistio);
router.get('/ingresos', obtenerIngresos);
router.put('/horarios', actualizarHorarios);

// Gestión de Servicios (CRUD)
router.get('/servicios', obtenerMisServicios);
router.post('/servicios', crearServicioPeluquero);
router.put('/servicios/:servicioId', editarServicioPeluquero);
router.delete('/servicios/:servicioId', eliminarServicioPeluquero);

// Gestión de Bloqueos
router.get('/bloqueos', obtenerMisBloqueos);
router.post('/bloqueos', crearBloqueo);
router.delete('/bloqueos/:bloqueoId', eliminarBloqueo);

export default router;
