import express from 'express';
import {
  obtenerURLAutenticacion,
  handleCallback,
  sincronizarCalendar,
  desconectarGoogleCalendar,
  obtenerEstadoConexion
} from '../controllers/googleCalendarController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Obtener URL de autenticación con Google
router.get('/auth', authMiddleware, obtenerURLAutenticacion);

// Callback de Google OAuth
router.get('/callback', handleCallback);

// Sincronizar eventos del calendario
router.get('/sincronizar', authMiddleware, sincronizarCalendar);

// Obtener estado de la conexión
router.get('/estado', authMiddleware, obtenerEstadoConexion);

// Desconectar Google Calendar
router.post('/desconectar', authMiddleware, desconectarGoogleCalendar);

export default router;
