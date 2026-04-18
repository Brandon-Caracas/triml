import express from 'express';
import {
  crearResena,
  obtenerResenas,
  obtenerResenasPendientes,
  actualizarEstadoResena
} from '../controllers/resenasController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/', crearResena);
router.get('/:peluqueroId', obtenerResenas);

// Rutas protegidas (admin)
router.get('/admin/pendientes', authMiddleware, roleMiddleware(['admin']), obtenerResenasPendientes);
router.put('/:resenaId', authMiddleware, roleMiddleware(['admin']), actualizarEstadoResena);

export default router;
