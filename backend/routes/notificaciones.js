import express from 'express';
import {
  obtenerMisNotificaciones,
  obtenerNoLeidas,
  marcarNotificacionComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  guardarSuscripcionPush,
  obtenerVapidKey
} from '../controllers/notificacionesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', obtenerMisNotificaciones);
router.get('/no-leidas', obtenerNoLeidas);
router.get('/vapid-public-key', obtenerVapidKey);
router.post('/subscribe', guardarSuscripcionPush);
router.put('/:notificacionId/leida', marcarNotificacionComoLeida);
router.put('/marcar-todas-leidas', marcarTodasComoLeidas);
router.delete('/:notificacionId', eliminarNotificacion);

export default router;
