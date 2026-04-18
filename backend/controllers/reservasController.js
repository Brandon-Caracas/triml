import Reserva from '../models/Reserva.js';
import Servicio from '../models/Servicio.js';
import Usuario from '../models/Usuario.js';
import Bloqueo from '../models/Bloqueo.js';

// Horarios fijos: 7 AM - 7 PM cada 2 horas
const HORAS_DISPONIBLES = [7, 9, 11, 13, 15, 17, 19];

// Obtener horarios disponibles
export const obtenerHorariosDisponibles = async (req, res) => {
  try {
    const { peluqueroId, fecha } = req.query;

    if (!peluqueroId || !fecha) {
      return res.status(400).json({ error: 'Peluquero y fecha requeridos' });
    }

    const fechaInicio = new Date(fecha);
    fechaInicio.setUTCHours(0,0,0,0);
    const fechaFin = new Date(fecha);
    fechaFin.setUTCHours(23,59,59,999);

    console.log(`🔍 [HORARIOS] Buscando para: ${peluqueroId} | Fecha: ${fecha}`);
    console.log(`📅 Rango query: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`);

    // 1. Buscar citas existentes para ese día
    const reservasExistentes = await Reserva.find({
      peluquero: peluqueroId,
      fecha: { $gte: fechaInicio, $lt: fechaFin },
      estado: { $ne: 'cancelada' }
    });

    // 2. Buscar bloqueos del peluquero para ese día
    const bloqueos = await Bloqueo.find({
      peluquero: peluqueroId,
      fechaInicio: { $lte: fechaFin },
      fechaFin: { $gte: fechaInicio }
    });

    console.log(`🚫 Bloqueos encontrados: ${bloqueos.length}`);
    bloqueos.forEach(b => console.log(`   - Tipo: ${b.tipo} | ${b.horaInicio || ''} - ${b.horaFin || ''}`));

    const horasOcupadas = reservasExistentes.map(r => r.hora);
    
    // 3. Filtrar horarios disponibles
    const horariosDisponibles = HORAS_DISPONIBLES.filter(horaNum => {
      const horaStr = `${horaNum.toString().padStart(2, '0')}:00`;
      
      // Bloqueado si ya hay una cita
      if (horasOcupadas.includes(horaStr)) return false;

      // Bloqueado si hay un bloqueo activo
      const estaBloqueado = bloqueos.some(b => {
        if (b.tipo === 'dia_completo') return true;
        if (b.tipo === 'rango_horas') {
          // Comparación de strings de horas "HH:mm" es segura
          return horaStr >= b.horaInicio && horaStr < b.horaFin;
        }
        return false;
      });

      return !estaBloqueado;
    }).map(h => `${h.toString().padStart(2, '0')}:00`);

    res.json({ 
      horariosDisponibles, 
      horasOcupadas, 
      totalDisponibles: horariosDisponibles.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear reserva
export const crearReserva = async (req, res) => {
  try {
    const {
      clienteNombre, clienteTelefono, clienteEmail,
      peluqueroId, servicioId, fecha, hora, notas
    } = req.body;

    if (!clienteNombre || !clienteTelefono || !peluqueroId || !servicioId || !fecha || !hora) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const servicio = await Servicio.findById(servicioId);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // 🔒 Validar que el negocio del peluquero esté activo
    const peluquero = await Usuario.findById(peluqueroId).select('negocioId estado');
    if (peluquero?.estado !== 'activo') {
      return res.status(403).json({ error: 'El peluquero no está disponible actualmente' });
    }
    if (peluquero?.negocioId) {
      const { default: Negocio } = await import('../models/Negocio.js');
      const negocio = await Negocio.findById(peluquero.negocioId).select('estado');
      if (negocio && negocio.estado === 'inactivo') {
        return res.status(403).json({ error: 'Este negocio está temporalmente inactivo y no acepta reservas' });
      }
    }

    // Verificar doble reserva usando rango de fecha (inicio y fin del día)
    const fechaObj = new Date(fecha);
    const fechaInicio = new Date(fechaObj);
    fechaInicio.setUTCHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaObj);
    fechaFin.setUTCHours(23, 59, 59, 999);

    console.log(`📅 Creando reserva: ${clienteNombre} | ${fecha} | ${hora} | peluquero: ${peluqueroId}`);

    const reservaExistente = await Reserva.findOne({
      peluquero: peluqueroId,
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      hora,
      estado: { $ne: 'cancelada' }
    });

    if (reservaExistente) {
      return res.status(400).json({ error: 'Este horario ya está reservado. Elige otra hora.' });
    }

    // 🔒 [NUEVA VALIDACIÓN] Verificar si el horario está bloqueado por el peluquero (descanso)
    const bloqueoActivo = await Bloqueo.findOne({
      peluquero: peluqueroId,
      fechaInicio: { $lte: fechaFin },
      fechaFin: { $gte: fechaInicio },
      $or: [
        { tipo: 'dia_completo' },
        { 
          tipo: 'rango_horas',
          $and: [
            { horaInicio: { $lte: hora } },
            { horaFin: { $gt: hora } }
          ]
        }
      ]
    });

    if (bloqueoActivo) {
      return res.status(400).json({ error: 'Este horario está bloqueado por el barbero (descanso/personal).' });
    }

    // Auto-vincular cuenta si existe registro con ese teléfono o email
    let clientIdFinal = req.user?.id || null;
    if (!clientIdFinal) {
      const matchUsuario = await Usuario.findOne({
        $or: [
          { email: clienteEmail || '---' },
          { telefono: clienteTelefono }
        ],
        rol: 'cliente'
      });
      if (matchUsuario) {
        clientIdFinal = matchUsuario._id;
      }
    }

    const nuevaReserva = new Reserva({
      cliente: {
        nombre: clienteNombre,
        telefono: clienteTelefono,
        email: clienteEmail,
        id: clientIdFinal
      },
      peluquero: peluqueroId,
      servicio: servicioId,
      servicioNombre: servicio.nombre,
      fecha: new Date(fecha),
      hora,
      precio: servicio.precio,
      duracion: servicio.duracion,
      notas,
      estado: 'pendiente'
    });

    await nuevaReserva.save();

    const reservaConDatos = await Reserva.findById(nuevaReserva._id)
      .populate('peluquero', 'nombre salon')
      .populate('servicio', 'nombre precio duracion');

    // 🔔 NOTIFICACIÓN AUTOMÁTICA: Notificar al peluquero
    try {
      const { notificacionesEspeciales } = await import('../services/notificacionService.js');
      const peluquero = await Usuario.findById(peluqueroId);
      
      if (peluquero) {
        await notificacionesEspeciales.reservaCreada(
          peluqueroId,
          clienteNombre,
          fecha,
          hora,
          peluquero.nombre,
          clienteTelefono,
          peluquero.email, // Enviar email al peluquero
          servicio.nombre  // Pasar el corte
        );
      }
    } catch (e) {
      console.warn('Notification error:', e.message);
    }

    // 🔄 TIEMPO REAL: Emitir a todos los clientes por Socket.io
    try {
      const { emitirATodos } = await import('../services/socketService.js');
      emitirATodos('nueva-reserva', { reserva: reservaConDatos, peluqueroId, fecha, hora });
      emitirATodos('horarios-actualizados', { peluqueroId, fecha });
    } catch (e) {
      console.warn('Socket emit error:', e.message);
    }

    res.status(201).json({ mensaje: 'Reserva creada exitosamente', reserva: reservaConDatos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mis reservas por teléfono
export const misoReservas = async (req, res) => {
  try {
    const { telefono } = req.query;

    if (!telefono) {
      return res.status(400).json({ error: 'Teléfono requerido' });
    }

    const reservas = await Reserva.find({ 'cliente.telefono': telefono })
      .populate('peluquero', 'nombre salon')
      .populate('servicio', 'nombre precio duracion')
      .sort({ fecha: -1 });

    res.json({ reservas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancelar reserva — SIN auth, accesible para clientes públicos
export const cancelarReserva = async (req, res) => {
  try {
    const { reservaId } = req.params;
    // 5. VALIDAR BACKEND
    console.log("Cancelando reserva en backend:", req.params.reservaId || req.params.id);

    const reserva = await Reserva.findById(reservaId);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // 6. VALIDAR GUARDADO
    reserva.estado = "cancelada";
    await reserva.save();

    // 🔄 TIEMPO REAL: Notificar a todos los clientes
    try {
      const { emitirATodos } = await import('../services/socketService.js');
      emitirATodos('reserva-cancelada', {
        reservaId,
        peluqueroId: reserva.peluquero,
        fecha: reserva.fecha,
        hora: reserva.hora
      });
      emitirATodos('horarios-actualizados', { peluqueroId: reserva.peluquero, fecha: reserva.fecha });
    } catch (e) {
      console.warn('Socket emit error:', e.message);
    }

    // 🔔 NOTIFICACIÓN: Notificar al peluquero de la cancelación
    try {
      const { notificacionesEspeciales } = await import('../services/notificacionService.js');
      await notificacionesEspeciales.reservaCancelada(
        reserva.peluquero,
        reserva.fecha,
        reserva.hora,
        'Cancelada por el cliente'
      ).catch(e => console.warn('Non-blocking notification error:', e.message));
    } catch (e) {
      console.warn('Notification service import failed:', e.message);
    }

    console.log("✅ [BACKEND] Respuesta enviada exitosamente para ID:", reservaId);
    res.json({ mensaje: 'Reserva cancelada', reserva });
  } catch (error) {
    console.error("❌ [BACKEND] Error en proceso de cancelación:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Obtener reservas del usuario logueado (Historial y Próximas)
export const obtenerMisReservasLogueado = async (req, res) => {
  try {
    const usuarioId = req.user.id || req.user._id;
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Buscamos por ID, Email o Teléfono para asegurar que no se pierdan citas
    const query = {
      $or: [
        { 'cliente.id': usuarioId },
        { 'cliente.email': { $regex: new RegExp(`^${usuario.email}$`, 'i') } },
        { 'cliente.telefono': usuario.telefono }
      ]
    };

    const reservas = await Reserva.find(query)
      .populate('peluquero', 'nombre salon telefono')
      .populate('servicio', 'nombre precio duracion')
      .sort({ fecha: -1, hora: -1 });

    res.json({ reservas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { 
  obtenerHorariosDisponibles, 
  crearReserva, 
  misoReservas, 
  cancelarReserva,
  obtenerMisReservasLogueado
};
