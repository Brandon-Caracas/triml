import express from 'express';
import {
  obtenerPeluqueros,
  crearPeluquero,
  bloquearPeluquero,
  desbloquearPeluquero,
  renovarSuscripcion,
  obtenerEstadisticas,
  obtenerReportePeluquero,
  obtenerTodasLasCitas,
  obtenerClientesPorNegocio,
  asignarNegocioPeluquero
} from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Proteger todas las rutas - solo admin
router.use(authMiddleware, roleMiddleware(['admin']));

router.get('/peluqueros', obtenerPeluqueros);
router.post('/peluqueros/crear', crearPeluquero);
router.put('/peluqueros/:peluqueroId/bloquear', bloquearPeluquero);
router.put('/peluqueros/:peluqueroId/desbloquear', desbloquearPeluquero);
router.put('/peluqueros/:peluqueroId/renovar-suscripcion', renovarSuscripcion);
router.get('/estadisticas', obtenerEstadisticas);
router.get('/citas', obtenerTodasLasCitas);
router.get('/clientes', obtenerClientesPorNegocio);
router.put('/peluqueros/:peluqueroId/asignar-negocio', asignarNegocioPeluquero);
router.get('/peluqueros/:peluqueroId/reporte', obtenerReportePeluquero);

export default router;
