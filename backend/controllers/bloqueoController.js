import Bloqueo from '../models/Bloqueo.js';
import { emitirATodos } from '../services/socketService.js';

export const crearBloqueo = async (req, res) => {
  try {
    const peluqueroId = req.user.id;
    const { tipo, fechaInicio, fechaFin, horaInicio, horaFin, razon } = req.body;

    const fInicio = new Date(fechaInicio);
    fInicio.setUTCHours(0,0,0,0);
    const fFin = new Date(fechaFin || fechaInicio);
    fFin.setUTCHours(23,59,59,999);

    const nuevoBloqueo = new Bloqueo({
      peluquero: peluqueroId,
      tipo,
      fechaInicio: fInicio,
      fechaFin: fFin,
      horaInicio,
      horaFin,
      razon
    });

    await nuevoBloqueo.save();

    // 🔄 Notificar en tiempo real para que los clientes actualicen su calendario
    emitirATodos('horarios-actualizados', { peluqueroId });

    res.status(201).json({ mensaje: 'Bloqueo creado exitosamente', bloqueo: nuevoBloqueo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerMisBloqueos = async (req, res) => {
  try {
    const peluqueroId = req.user.id;
    const bloqueos = await Bloqueo.find({ peluquero: peluqueroId }).sort({ fechaInicio: -1 });
    res.json({ bloqueos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const eliminarBloqueo = async (req, res) => {
  try {
    const { bloqueoId } = req.params;
    const peluqueroId = req.user.id;
    console.log(`🗑️ Intentando eliminar bloqueo: ${bloqueoId} para peluquero: ${peluqueroId}`);

    const bloqueo = await Bloqueo.findOneAndDelete({ _id: bloqueoId, peluquero: peluqueroId });
    if (!bloqueo) return res.status(404).json({ error: 'Bloqueo no encontrado' });

    res.json({ mensaje: 'Bloqueo eliminado' });

    // 🔄 Notificar en tiempo real
    emitirATodos('horarios-actualizados', { peluqueroId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
    crearBloqueo,
    obtenerMisBloqueos,
    eliminarBloqueo
};
