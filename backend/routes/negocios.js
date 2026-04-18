import express from 'express';
import {
  obtenerPorSlug,
  actualizarConfiguracion,
  obtenerTodosNegocios,
  crearNegocio,
  editarNegocio,
  eliminarNegocio,
  toggleEstadoNegocio
} from '../controllers/negociosController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── RUTAS ADMIN ────────────────────────────────
router.get('/', authMiddleware, roleMiddleware(['admin']), obtenerTodosNegocios);
router.post('/', authMiddleware, roleMiddleware(['admin']), crearNegocio);
router.put('/admin/:id', authMiddleware, roleMiddleware(['admin']), editarNegocio);
router.delete('/admin/:id', authMiddleware, roleMiddleware(['admin']), eliminarNegocio);
router.put('/admin/:id/toggle', authMiddleware, roleMiddleware(['admin']), toggleEstadoNegocio);

// ── RUTA PELUQUERO ─────────────────────────────
router.put('/config', authMiddleware, roleMiddleware(['peluquero']), actualizarConfiguracion);

// ── RUTA PÚBLICA (al final para no conflictuar) ─
router.get('/:slug', obtenerPorSlug);

export default router;
