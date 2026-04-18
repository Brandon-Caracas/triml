import Reserva from '../models/Reserva.js';
import Resena from '../models/Resena.js';
import Pago from '../models/Pago.js';

// Obtener estadísticas del negocio
export const obtenerEstadisticas = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    
    // Calcular rango de fechas
    const ahora = new Date();
    let fechaInicio;
    
    switch (periodo) {
      case 'dia':
        fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
        break;
      case 'semana':
        fechaInicio = new Date(ahora.setDate(ahora.getDate() - ahora.getDay()));
        break;
      case 'mes':
      default:
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    // 1. Total de citas en el período
    const totalCitas = await Reserva.countDocuments({
      fecha: { $gte: fechaInicio },
      estado: 'confirmada'
    });

    // 2. Ingresos totales
    const ingresoData = await Pago.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio },
          estado: 'completado'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$monto' }
        }
      }
    ]);

    const ingresoTotal = ingresoData[0]?.total || 0;

    // 3. Distribución por día
    const ingresosPorDia = await Pago.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio },
          estado: 'completado'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$fecha' }
          },
          ingreso: { $sum: '$monto' },
          citas: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Servicios más populares
    const servicioPopular = await Reserva.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio },
          estado: 'confirmada'
        }
      },
      {
        $group: {
          _id: '$servicio',
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { cantidad: -1 } },
      { $limit: 5 }
    ]);

    // 5. Clientes frecuentes
    const clientesFrecuentes = await Reserva.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio },
          estado: 'confirmada'
        }
      },
      {
        $group: {
          _id: '$cliente',
          citas: { $sum: 1 },
          gasto: { $sum: '$precio' }
        }
      },
      { $sort: { citas: -1 } },
      { $limit: 10 }
    ]);

    // 6. Promedio de calificación
    const resenas = await Resena.find({
      createdAt: { $gte: fechaInicio },
      estado: 'aprobada'
    });

    const promedioCalificacion = 
      resenas.length > 0
        ? (resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length).toFixed(1)
        : 0;

    // 7. Peluqueros por desempeño
    const peluqueroPorDesempeno = await Reserva.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio },
          estado: 'confirmada'
        }
      },
      {
        $group: {
          _id: '$peluquero',
          citas: { $sum: 1 },
          ingresos: { $sum: '$precio' }
        }
      },
      { $sort: { ingresos: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'peluqueros',
          localField: '_id',
          foreignField: '_id',
          as: 'datos'
        }
      }
    ]);

    // 8. Tasa de cancelación
    const totalReservas = await Reserva.countDocuments({
      fecha: { $gte: fechaInicio }
    });

    const canceladas = await Reserva.countDocuments({
      fecha: { $gte: fechaInicio },
      estado: 'cancelada'
    });

    const tasaCancelacion = totalReservas > 0 
      ? ((canceladas / totalReservas) * 100).toFixed(1)
      : 0;

    res.json({
      periodo,
      resumen: {
        totalCitas,
        ingresoTotal,
        promedioCalificacion,
        tasaCancelacion: `${tasaCancelacion}%`,
        totalReservas
      },
      ingresosPorDia,
      servicioPopular,
      clientesFrecuentes,
      peluqueroPorDesempeno,
      totalResenas: resenas.length
    });
  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener estadísticas de un peluquero específico
export const obtenerEstadisticasPeluquero = async (req, res) => {
  try {
    const { peluqueroId } = req.params;

    // Total de citas
    const totalCitas = await Reserva.countDocuments({
      peluquero: peluqueroId,
      estado: 'confirmada'
    });

    // Ingresos del peluquero
    const ingresos = await Pago.aggregate([
      {
        $lookup: {
          from: 'reservas',
          localField: 'reserva',
          foreignField: '_id',
          as: 'reserva_data'
        }
      },
      {
        $match: {
          'reserva_data.peluquero': peluqueroId,
          estado: 'completado'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$monto' }
        }
      }
    ]);

    // Rating promedio
    const resenas = await Resena.find({
      peluquero: peluqueroId,
      estado: 'aprobada'
    });

    const rating = resenas.length > 0
      ? (resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length).toFixed(1)
      : 0;

    // Servicios más solicitados
    const serviciosFrecuentes = await Reserva.aggregate([
      {
        $match: {
          peluquero: peluqueroId,
          estado: 'confirmada'
        }
      },
      {
        $group: {
          _id: '$servicio',
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { cantidad: -1 } }
    ]);

    res.json({
      peluqueroId,
      totalCitas,
      ingresoTotal: ingresos[0]?.total || 0,
      ratingPromedio: rating,
      totalResenas: resenas.length,
      serviciosFrecuentes
    });
  } catch (error) {
    console.error('Error en obtenerEstadisticasPeluquero:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener reportes de cliente
export const obtenerReportesCliente = async (req, res) => {
  try {
    // Clientes más activos
    const clientesMasActivos = await Reserva.aggregate([
      {
        $group: {
          _id: '$cliente',
          citas: { $sum: 1 },
          ultimaCita: { $max: '$fecha' }
        }
      },
      { $sort: { citas: -1 } },
      { $limit: 10 }
    ]);

    // Clientes inactivos (no reservan hace más de 30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const clientesInactivos = await Reserva.aggregate([
      {
        $group: {
          _id: '$cliente',
          ultimaCita: { $max: '$fecha' }
        }
      },
      {
        $match: {
          ultimaCita: { $lt: hace30Dias }
        }
      },
      { $sort: { ultimaCita: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      clientesMasActivos,
      clientesInactivos,
      totalClickes: clientesMasActivos.length + clientesInactivos.length
    });
  } catch (error) {
    console.error('Error en obtenerReportesCliente:', error);
    res.status(500).json({ error: error.message });
  }
};
