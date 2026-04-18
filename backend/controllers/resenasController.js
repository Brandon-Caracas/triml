import Resena from '../models/Resena.js';
import Usuario from '../models/Usuario.js';
import Reserva from '../models/Reserva.js';
import { notificacionesEspeciales } from '../services/notificacionService.js';

// Crear reseña
export const crearResena = async (req, res) => {
  try {
    const { peluqueroId, reservaId, calificacion, comentario, aspectos, telefono, nombre, email } = req.body;

    if (!peluqueroId || !reservaId || !calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Verificar que el peluquero existe
    const peluquero = await Usuario.findById(peluqueroId);
    if (!peluquero) {
      return res.status(404).json({ error: 'Peluquero no encontrado' });
    }

    // Verificar que la reserva existe
    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.resena) {
        return res.status(400).json({ error: 'Esta reserva ya tiene una reseña.' });
    }

    const resena = new Resena({
      peluquero: peluqueroId,
      reserva: reservaId,
      cliente: {
        nombre,
        email,
        telefono
      },
      calificacion,
      comentario,
      aspectos: aspectos || {},
      estado: 'aprobada' // auto-approve for simplicity in MVP, or leave 'pendiente'. Let's auto-approve so it shows to the barber
    });

    await resena.save();

    // Link reseña back to reserva
    reserva.resena = resena._id;
    await reserva.save();

    // Notificar al peluquero
    await notificacionesEspeciales.nuevaResena(peluqueroId, nombre, calificacion);

    res.status(201).json({
      mensaje: '✓ Reseña enviada exitosamente',
      resena
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener reseñas de un peluquero
export const obtenerResenas = async (req, res) => {
  try {
    const { peluqueroId } = req.params;
    const { estado = 'aprobada' } = req.query;

    const resenas = await Resena.find({ peluquero: peluqueroId, estado })
      .sort({ createdAt: -1 });

    // Calcular promedio
    const promedio = resenas.length > 0
      ? (resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length).toFixed(1)
      : 0;

    res.json({ 
      resenas,
      promedio,
      total: resenas.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener estadísticas de reseñas (para admin)
export const obtenerResenasPendientes = async (req, res) => {
  try {
    const resenas = await Resena.find({ estado: 'pendiente' })
      .populate('peluquero', 'nombre email')
      .sort({ createdAt: -1 });

    res.json({ resenas, total: resenas.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Aprobar/Rechazar reseña (admin)
export const actualizarEstadoResena = async (req, res) => {
  try {
    const { resenaId } = req.params;
    const { estado } = req.body;

    if (!['aprobada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const resena = await Resena.findByIdAndUpdate(
      resenaId,
      { estado },
      { new: true }
    );

    if (!resena) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    res.json({
      mensaje: `Reseña ${estado} exitosamente`,
      resena
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  crearResena,
  obtenerResenas,
  obtenerResenasPendientes,
  actualizarEstadoResena
};
