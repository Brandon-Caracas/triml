import Usuario from '../models/Usuario.js';
import jwt from 'jsonwebtoken';

const generarToken = (usuario) => {
  return jwt.sign(
    { 
      id: usuario._id, 
      rol: usuario.rol, 
      email: usuario.email,
      suscripcionActiva: usuario.suscripcionActiva
    },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export const registro = async (req, res) => {
  try {
    const { nombre, email, telefono, contraseña, rol } = req.body;

    // Validar que no exista el email
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Crear nuevo usuario - SOLO permitido rol cliente vía registro público
    const usuario = new Usuario({
      nombre,
      email,
      telefono,
      contraseña,
      rol: 'cliente'
    });

    await usuario.save();

    const token = generarToken(usuario);

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: usuario.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ email }).select('+contraseña');
    if (!usuario) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Validar estado
    if (usuario.estado === 'bloqueado') {
      return res.status(403).json({ 
        error: 'Cuenta bloqueada. Contacta con administrador' 
      });
    }

    if (usuario.estado === 'inactivo') {
      return res.status(403).json({ 
        error: 'Cuenta inactiva' 
      });
    }

    // Validar suscripción si es peluquero
    if (usuario.rol === 'peluquero' && !usuario.suscripcionActiva) {
      return res.status(403).json({
        error: 'Tu suscripción ha expirado',
        message: 'Por favor, renueva tu suscripción para continuar'
      });
    }

    // Comparar contraseña
    const esValida = await usuario.compararContraseña(contraseña);
    if (!esValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const token = generarToken(usuario);

    res.json({
      token,
      usuario: usuario.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verificarToken = (req, res) => {
  try {
    res.json({
      mensaje: 'Token válido',
      usuario: req.user
    });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

export default {
  registro,
  login,
  verificarToken
};
