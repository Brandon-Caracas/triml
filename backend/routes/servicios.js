import express from 'express';
import {
  obtenerServicios,
  crearServicio,
  actualizarServicio,
  eliminarServicio
} from '../controllers/serviciosController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', obtenerServicios);
router.post('/', authMiddleware, roleMiddleware(['peluquero']), crearServicio);
router.put('/:servicioId', authMiddleware, roleMiddleware(['peluquero']), actualizarServicio);
router.delete('/:servicioId', authMiddleware, roleMiddleware(['peluquero']), eliminarServicio);

export default router;
