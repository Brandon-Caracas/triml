import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware de autenticación OPCIONAL: si hay token lo decodifica, si no sigue sin bloquear
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Token inválido o ausente — se ignora silenciosamente
    req.user = null;
  }
  next();
};

export const roleMiddleware = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    next();
  };
};

export const subscriptionMiddleware = (req, res, next) => {
  try {
    // Verificar si la suscripción está activa
    if (req.user.rol === 'peluquero' && !req.user.suscripcionActiva) {
      return res.status(403).json({ 
        error: 'Tu suscripción ha expirado',
        message: 'Por favor, renueva tu suscripción para continuar'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verificando suscripción' });
  }
};

export default {
  authMiddleware,
  roleMiddleware,
  subscriptionMiddleware
};
