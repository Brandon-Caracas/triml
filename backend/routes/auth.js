import express from 'express';
import { registro, login, verificarToken } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/registro', registro);
router.post('/login', login);
router.get('/verificar', authMiddleware, verificarToken);

export default router;
