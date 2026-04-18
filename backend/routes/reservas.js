import express from 'express';
import {
  obtenerHorariosDisponibles,
  crearReserva,
  misoReservas,
  cancelarReserva,
  obtenerMisReservasLogueado
} from '../controllers/reservasController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas — no requieren autenticación
router.get('/horarios-disponibles', obtenerHorariosDisponibles);
// Usar optionalAuthMiddleware: si hay token se vincula el usuario, si no pasa igual
router.post('/crear', optionalAuthMiddleware, crearReserva);
router.get('/mis-reservas', misoReservas);
router.put('/:reservaId/cancelar', cancelarReserva);

// Rutas protegidas para clientes logueados
router.get('/mis-citas-registradas', authMiddleware, obtenerMisReservasLogueado);

export default router;
