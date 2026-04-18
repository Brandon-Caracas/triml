import Notificacion from '../models/Notificacion.js';
import Usuario from '../models/Usuario.js';
import { marcarComoLeida, obtenerNotificaciones, obtenerNoLeidas as obtenerNoLeidasService } from '../services/notificacionService.js';

export const obtenerMisNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { limite = 20 } = req.query;

    const notificaciones = await obtenerNotificaciones(usuarioId, parseInt(limite));
    
    res.json({ notificaciones });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerNoLeidas = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const notificaciones = await obtenerNoLeidasService(usuarioId);
    
    res.json({ 
      notificaciones,
      total: notificaciones.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const marcarNotificacionComoLeida = async (req, res) => {
  try {
    const { notificacionId } = req.params;
    const usuarioId = req.user.id;

    // Verificar que la notificación pertenece al usuario
    const notificacion = await Notificacion.findOne({ _id: notificacionId, usuario: usuarioId });
    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    const actualizada = await marcarComoLeida(notificacionId);
    
    res.json({ notificacion: actualizada });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const marcarTodasComoLeidas = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    await Notificacion.updateMany(
      { usuario: usuarioId, leida: false },
      { leida: true }
    );
    
    res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const eliminarNotificacion = async (req, res) => {
  try {
    const { notificacionId } = req.params;
    const usuarioId = req.user.id;

    const resultado = await Notificacion.findOneAndDelete({ _id: notificacionId, usuario: usuarioId });
    if (!resultado) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({ mensaje: 'Notificación eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Guardar suscripción Web Push
export const guardarSuscripcionPush = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const suscripcion = req.body;

    if (!suscripcion || !suscripcion.endpoint) {
      return res.status(400).json({ error: 'Suscripción inválida' });
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Comprobar si ya existe una suscripción para este endpoint
    const existe = usuario.pushSubscriptions.some(
      sub => sub.endpoint === suscripcion.endpoint
    );

    if (!existe) {
      usuario.pushSubscriptions.push(suscripcion);
      await usuario.save();
    }

    res.json({ mensaje: 'Suscripción guardada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Proveer la llave pública para el Frontend
export const obtenerVapidKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

export default {
  obtenerMisNotificaciones,
  obtenerNoLeidas,
  marcarNotificacionComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  guardarSuscripcionPush,
  obtenerVapidKey
};
