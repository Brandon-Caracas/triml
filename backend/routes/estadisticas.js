import express from 'express';
import { 
  obtenerEstadisticas, 
  obtenerEstadisticasPeluquero, 
  obtenerReportesCliente 
} from '../controllers/estadisticasController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Rutas protegidas - solo admin
router.get('/', authMiddleware, adminMiddleware, obtenerEstadisticas);

// Estadísticas por peluquero - admin puede ver todas, peluqueros sus propias estadísticas
router.get('/peluquero/:peluqueroId', authMiddleware, obtenerEstadisticasPeluquero);

// Reportes de clientes
router.get('/clientes/reportes', authMiddleware, adminMiddleware, obtenerReportesCliente);

export default router;
