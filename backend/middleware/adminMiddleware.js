export const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verificar que el rol sea admin
    if (req.user.rol !== 'admin' && req.user.rol !== 'dueno') {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'Solo administradores pueden acceder a este recurso' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verificando permisos de administrador' });
  }
};

export default adminMiddleware;
