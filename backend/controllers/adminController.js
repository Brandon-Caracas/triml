import Usuario from '../models/Usuario.js';
import Reserva from '../models/Reserva.js';
import Negocio from '../models/Negocio.js';

// Obtener todos los peluqueros
export const obtenerPeluqueros = async (req, res) => {
  try {
    const peluqueros = await Usuario.find({ rol: 'peluquero' })
      .populate('negocioId', 'nombre')
      .select('-contraseña');

    res.json({ peluqueros });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear peluquero (solo admin)
export const crearPeluquero = async (req, res) => {
  try {
    const { nombre, email, telefono, contraseña, salon, direccion, negocioId } = req.body;

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const nuevoPeluquero = new Usuario({
      nombre,
      email,
      telefono,
      contraseña: contraseña || '123456',
      rol: 'peluquero',
      estado: 'activo',
      salon: salon || 'Mi Peluquería',
      direccion: direccion || 'Dirección por definir',
      negocioId: negocioId || null,
      suscripcionActiva: true,
      fechaExpiracionSuscripcion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });

    await nuevoPeluquero.save();

    res.status(201).json({
      mensaje: 'Peluquero creado exitosamente',
      peluquero: nuevoPeluquero.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todas las citas (solo admin)
export const obtenerTodasLasCitas = async (req, res) => {
  try {
    const citas = await Reserva.find()
      .populate('peluquero', 'nombre')
      .populate('servicio', 'nombre precio')
      .sort({ fecha: -1, hora: -1 });

    res.json({ citas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bloquear/desactivar peluquero
export const bloquearPeluquero = async (req, res) => {
  try {
    const { peluqueroId } = req.params;
    const { razon } = req.body;

    const peluquero = await Usuario.findByIdAndUpdate(
      peluqueroId,
      { estado: 'bloqueado' },
      { new: true }
    );

    if (!peluquero) {
      return res.status(404).json({ error: 'Peluquero no encontrado' });
    }

    res.json({
      mensaje: 'Peluquero bloqueado correctamente',
      peluquero: peluquero.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Desbloquear peluquero
export const desbloquearPeluquero = async (req, res) => {
  try {
    const { peluqueroId } = req.params;

    const peluquero = await Usuario.findByIdAndUpdate(
      peluqueroId,
      { estado: 'activo' },
      { new: true }
    );

    if (!peluquero) {
      return res.status(404).json({ error: 'Peluquero no encontrado' });
    }

    res.json({
      mensaje: 'Peluquero desbloqueado correctamente',
      peluquero: peluquero.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Renovar suscripción
export const renovarSuscripcion = async (req, res) => {
  try {
    const { peluqueroId } = req.params;
    const { meses } = req.body || { meses: 1 };

    const fechaExpiracion = new Date();
    fechaExpiracion.setMonth(fechaExpiracion.getMonth() + meses);

    const peluquero = await Usuario.findByIdAndUpdate(
      peluqueroId,
      {
        suscripcionActiva: true,
        fechaExpiracionSuscripcion: fechaExpiracion
      },
      { new: true }
    );

    if (!peluquero) {
      return res.status(404).json({ error: 'Peluquero no encontrado' });
    }

    res.json({
      mensaje: `Suscripción renovada por ${meses} mes(es)`,
      peluquero: peluquero.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener estadísticas
export const obtenerEstadisticas = async (req, res) => {
  try {
    const totalPeluqueros = await Usuario.countDocuments({ rol: 'peluquero' });
    const peluquerosActivos = await Usuario.countDocuments({ 
      rol: 'peluquero', 
      estado: 'activo' 
    });
    const peluquerosBloqueados = await Usuario.countDocuments({ 
      rol: 'peluquero', 
      estado: 'bloqueado' 
    });

    const totalReservas = await Reserva.countDocuments();
    const reservasCompletadas = await Reserva.countDocuments({ estado: 'completada' });
    const reservasPendientes = await Reserva.countDocuments({ estado: 'pendiente' });

    const ingresosTotales = await Reserva.aggregate([
      { $match: { estado: 'completada' } },
      { $group: { _id: null, total: { $sum: '$precio' } } }
    ]);

    res.json({
      peluqueros: {
        total: totalPeluqueros,
        activos: peluquerosActivos,
        bloqueados: peluquerosBloqueados
      },
      reservas: {
        total: totalReservas,
        completadas: reservasCompletadas,
        pendientes: reservasPendientes
      },
      ingresos: ingresosTotales[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener reportes del peluquero
export const obtenerReportePeluquero = async (req, res) => {
  try {
    const { peluqueroId } = req.params;

    const usuario = await Usuario.findById(peluqueroId);
    const reservas = await Reserva.find({ peluquero: peluqueroId });
    const reservasCompletadas = await Reserva.countDocuments({ 
      peluquero: peluqueroId, 
      estado: 'completada' 
    });

    res.json({
      peluquero: usuario.toJSON(),
      estadisticas: {
        totalReservas: reservas.length,
        completadas: reservasCompletadas,
        ingresos: usuario.ingresos
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener clientes agrupados por negocio (con filtro opcional por negocioId)
export const obtenerClientesPorNegocio = async (req, res) => {
  try {
    const { negocioId } = req.query;
    const matchQuery = negocioId ? { negocioId } : {};

    const reservas = await Reserva.find(matchQuery).select('cliente negocioId');
    const negocios = await Negocio.find({}).select('nombre slug _id');

    // Construir mapa base de grupos
    const agrupados = {};
    for (const negocio of negocios) {
      agrupados[negocio._id.toString()] = {
        negocio: { nombre: negocio.nombre, slug: negocio.slug, _id: negocio._id },
        clientes: []
      };
    }

    // Rellenar clientes desduplicados por teléfono
    const vistos = {};
    for (const reserva of reservas) {
      const nId = reserva.negocioId?.toString() || 'sin-negocio';
      const telefono = reserva.cliente?.telefono || '';
      const key = `${nId}-${telefono}`;

      if (!agrupados[nId]) {
        agrupados[nId] = { negocio: { nombre: 'Sin negocio asignado', slug: '', _id: nId }, clientes: [] };
      }

      if (!vistos[key]) {
        vistos[key] = true;
        agrupados[nId].clientes.push({
          nombre: reserva.cliente?.nombre,
          telefono,
          email: reserva.cliente?.email
        });
      }
    }

    res.json({ grupos: Object.values(agrupados).filter(g => g.clientes.length > 0) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Asignar peluquero a un negocio
export const asignarNegocioPeluquero = async (req, res) => {
  try {
    const { peluqueroId } = req.params;
    const { negocioId } = req.body;

    const peluquero = await Usuario.findById(peluqueroId);
    if (!peluquero || peluquero.rol !== 'peluquero') {
      return res.status(404).json({ error: 'Peluquero no encontrado' });
    }

    // Validar si el negocio existe
    if (negocioId) {
      const negocio = await Negocio.findById(negocioId);
      if (!negocio) return res.status(404).json({ error: 'Negocio no encontrado' });
      peluquero.negocioId = negocioId;
    } else {
      peluquero.negocioId = null; // Desvincular si se envía null
    }

    await peluquero.save();

    res.json({
      mensaje: 'Negocio asignado correctamente',
      peluquero: { _id: peluqueroId, negocioId: peluquero.negocioId }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
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
};
