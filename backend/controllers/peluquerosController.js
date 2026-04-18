import Reserva from '../models/Reserva.js';
import Usuario from '../models/Usuario.js';
import Servicio from '../models/Servicio.js';

// Obtener agenda del peluquero (hoy + futuras si no se especifica fecha)
export const obtenerAgenda = async (req, res) => {
  try {
    const peluqueroId = req.user.id;
    const { fecha } = req.query;

    let query = { peluquero: peluqueroId };

    if (fecha) {
      // Si se pasa fecha específica, filtrar solo ese día
      const fechaInicio = new Date(fecha + 'T00:00:00.000Z');
      const fechaFin = new Date(fecha + 'T23:59:59.999Z');
      query.fecha = { $gte: fechaInicio, $lte: fechaFin };
    } else {
      // Sin filtro: cargar desde hoy en adelante (hoy + futuras)
      const hoyInicio = new Date();
      hoyInicio.setHours(0, 0, 0, 0);
      query.fecha = { $gte: hoyInicio };
      // Excluir canceladas de la agenda principal
      query.estado = { $ne: 'cancelada' };
    }

    const reservas = await Reserva.find(query)
      .populate('cliente', 'nombre telefono email')
      .populate('servicio', 'nombre precio duracion')
      .sort({ fecha: 1, hora: 1 });

    // Normalizar el campo servicioNombre para la UI
    const reservasNormalizadas = reservas.map(r => {
      const obj = r.toObject();
      obj.servicioNombre = obj.servicioNombre || obj.servicio?.nombre || 'Servicio';
      return obj;
    });

    res.json({ reservas: reservasNormalizadas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener próximas citas
export const obtenerProximasCitas = async (req, res) => {
  try {
    const peluqueroId = req.user.id;
    const ahora = new Date();

    const reservas = await Reserva.find({
      peluquero: peluqueroId,
      fecha: { $gte: ahora },
      estado: { $ne: 'cancelada' }
    })
      .populate('servicio', 'nombre precio duracion')
      .limit(10)
      .sort({ fecha: 1, hora: 1 });

    res.json({ reservas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Confirmar cita (OBSOLETO - Se confirma solo a los 20 min o se completa)
// Se mantiene vacío el export o se elimina para limpiar la API

// Completar cita y registrar ingreso
export const completarCita = async (req, res) => {
  try {
    const { reservaId } = req.params;
    const peluqueroId = req.user.id;

    const reserva = await Reserva.findOneAndUpdate(
      { _id: reservaId, peluquero: peluqueroId },
      { estado: 'completada' },
      { new: true }
    );

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Actualizar ingresos del peluquero
    await Usuario.findByIdAndUpdate(peluqueroId, {
      $inc: {
        'ingresos.total': reserva.precio,
        'ingresos.mes': reserva.precio
      }
    });

    res.json({
      mensaje: 'Cita completada y ingreso registrado',
      reserva
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Marcar cita como no asistida
export const marcarNoAsistio = async (req, res) => {
  try {
    const { reservaId } = req.params;
    const peluqueroId = req.user.id;

    const reserva = await Reserva.findOne({ _id: reservaId, peluquero: peluqueroId });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.estado === 'no_asistio') {
      return res.json({ mensaje: 'Cita ya estaba marcada como inasistencia', reserva });
    }

    const estadoAnterior = reserva.estado;
    reserva.estado = 'no_asistio';
    await reserva.save();

    // Si la cita ya había sido confirmada automáticamente por el cron (+20 min)
    // significa que el ingreso ya se había sumado. Debemos restarlo.
    if (estadoAnterior === 'confirmada' || estadoAnterior === 'completada') {
      await Usuario.findByIdAndUpdate(peluqueroId, {
        $inc: {
          'ingresos.total': -reserva.precio,
          'ingresos.mes': -reserva.precio
        }
      });
    }

    res.json({
      mensaje: 'Cita marcada como inasistencia',
      reserva
    });

    // 📡 Notificar actualización en tiempo real
    try {
      const { emitirATodos } = await import('../services/socketService.js');
      emitirATodos('horarios-actualizados', { peluqueroId, fecha: reserva.fecha });
    } catch (err) {
      console.error('Error emitiendo socket no-asistio:', err);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener ingresos del peluquero y su historial
export const obtenerIngresos = async (req, res) => {
  try {
    const peluqueroId = req.user.id;

    const usuario = await Usuario.findById(peluqueroId).select('ingresos');
    
    // Obtener todo el historial de cortes del peluquero (completadas, canceladas, no asistió, etc.)
    const historial = await Reserva.find({ peluquero: peluqueroId })
      .populate('cliente', 'nombre telefono')
      .populate('servicio', 'nombre')
      .sort({ fecha: -1, hora: -1 });

    res.json({ ingresos: usuario.ingresos, historial });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los peluqueros activos con sus servicios (para clientes)
export const obtenerPeluquerosActivos = async (req, res) => {
  try {
    // Filtro opcional por negocio slug (para links personalizados)
    const { negocio: negocioSlug } = req.query;
    let negocioFiltro = {};

    if (negocioSlug) {
      const Negocio = (await import('../models/Negocio.js')).default;
      const negocioDoc = await Negocio.findOne({ slug: negocioSlug, estado: 'activo' });
      if (!negocioDoc) {
        return res.status(404).json({ error: 'Negocio no encontrado o inactivo', peluqueros: [] });
      }
      negocioFiltro = { negocioId: negocioDoc._id };
    } else {
      // Sin filtro: solo mostrar peluqueros de negocios activos
      const Negocio = (await import('../models/Negocio.js')).default;
      const negociosActivos = await Negocio.find({ estado: 'activo' }).select('_id');
      const idsNegociosActivos = negociosActivos.map(n => n._id);
      // Si no tienen negocioId asignado (datos viejos) o su negocio está activo
      negocioFiltro = {
        $or: [
          { negocioId: { $in: idsNegociosActivos } },
          { negocioId: { $exists: false } }
        ]
      };
    }

    const peluqueros = await Usuario.find({
      rol: 'peluquero',
      estado: 'activo',
      suscripcionActiva: true,
      ...negocioFiltro
    }).select('_id nombre email salon');

    const peluquerosConServicios = await Promise.all(
      peluqueros.map(async (peluquero) => {
        const servicios = await Servicio.find({ peluquero: peluquero._id }).select('_id nombre precio duracion');
        return { ...peluquero.toObject(), servicios };
      })
    );

    res.json({ peluqueros: peluquerosConServicios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- GESTIÓN DE SERVICIOS (CRUD) ---

// Obtener mis servicios
export const obtenerMisServicios = async (req, res) => {
  try {
    const peluqueroId = req.user.id;
    const servicios = await Servicio.find({ peluquero: peluqueroId });
    res.json({ servicios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear servicio
export const crearServicioPeluquero = async (req, res) => {
  try {
    const peluqueroId = req.user.id;
    const { nombre, precio, duracion, descripcion, imagen } = req.body;

    const nuevoServicio = new Servicio({
      nombre,
      precio,
      duracion: duracion || 30,
      descripcion,
      imagen,
      peluquero: peluqueroId
    });

    await nuevoServicio.save();
    res.status(201).json({ mensaje: 'Servicio creado', servicio: nuevoServicio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Editar servicio
export const editarServicioPeluquero = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const peluqueroId = req.user.id;

    const servicio = await Servicio.findOneAndUpdate(
      { _id: servicioId, peluquero: peluqueroId },
      req.body,
      { new: true }
    );

    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ mensaje: 'Servicio actualizado', servicio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar servicio
export const eliminarServicioPeluquero = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const peluqueroId = req.user.id;

    const servicio = await Servicio.findOneAndDelete({ _id: servicioId, peluquero: peluqueroId });
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    res.json({ mensaje: 'Servicio eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar horarios disponibles
export const actualizarHorarios = async (req, res) => {
  try {
    const peluqueroId = req.user.id;
    const { horarioLaboral } = req.body;

    const usuario = await Usuario.findByIdAndUpdate(
      peluqueroId,
      { horarioLaboral },
      { new: true }
    );

    res.json({
      mensaje: 'Horarios actualizados',
      horarios: usuario.horarioLaboral
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  obtenerAgenda,
  obtenerProximasCitas,
  completarCita,
  marcarNoAsistio,
  obtenerIngresos,
  obtenerPeluquerosActivos,
  actualizarHorarios,
  obtenerMisServicios,
  crearServicioPeluquero,
  editarServicioPeluquero,
  eliminarServicioPeluquero
};
