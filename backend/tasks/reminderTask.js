import cron from 'node-cron';
import Reserva from '../models/Reserva.js';
import Usuario from '../models/Usuario.js';
import { enviarEmail, emailTemplates } from '../services/emailService.js';

/**
 * Tarea programada para enviar recordatorios de citas.
 * Se ejecuta cada hora.
 */
export const iniciarReminderTask = () => {
  console.log('⏰ Sistema de recordatorios iniciado');
  
  // 1. Ejecutar cada minuto para el recordatorio de 15 minutos In-App / Futuro Push
  cron.schedule('* * * * *', async () => {
    try {
      const ahoraTs = Date.now();
      const citasPendientes = await Reserva.find({
        estado: { $in: ['pendiente', 'confirmada'] },
        'notificacionesEnviadas.recordatorio15m': { $ne: true }
      }).populate('peluquero', 'nombre salon');

      const { notificacionesEspeciales } = await import('../services/notificacionService.js');

      for (const cita of citasPendientes) {
        if (!cita.fecha || !cita.hora) continue;

        const fechaCita = new Date(cita.fecha);
        const [horas, minutos] = cita.hora.split(':').map(Number);
        
        // Construir fecha real asumiendo que fechaCita tiene el año/mes/dia correcto en contexto local
        const citaRealDate = new Date(
          fechaCita.getFullYear(),
          fechaCita.getMonth(),
          fechaCita.getDate(),
          horas,
          minutos,
          0
        );

        const diffMinutes = (citaRealDate.getTime() - ahoraTs) / 60000;

        // Validar si restan 15 min o menos (y la cita aún no pasa)
        if (diffMinutes > 0 && diffMinutes <= 15) {
           console.log(`⏰ Ejecutando Recordatorio 15m para la reserva ${cita._id}`);
           await notificacionesEspeciales.procesarRecordatorioCliente(cita);
           await Reserva.findByIdAndUpdate(cita._id, { 'notificacionesEnviadas.recordatorio15m': true });
        }
      }
    } catch (e) {
      console.error('❌ Error en cron 15min:', e.message);
    }
  });

  // 1.5 Ejecutar cada minuto para AUTOMATIZAR y CONFIRMAR las citas +20 mins pasadas
  cron.schedule('* * * * *', async () => {
    try {
      const ahoraTs = Date.now();
      const citasAConfirmar = await Reserva.find({
        estado: 'pendiente'
      });

      const { emitirATodos } = await import('../services/socketService.js');

      for (const cita of citasAConfirmar) {
        if (!cita.fecha || !cita.hora) continue;

        const fechaCita = new Date(cita.fecha);
        const [horas, minutos] = cita.hora.split(':').map(Number);
        const citaRealDate = new Date(
          fechaCita.getFullYear(),
          fechaCita.getMonth(),
          fechaCita.getDate(),
          horas,
          minutos,
          0
        );

        // Minutos de desfase (si es negativo, es que ya pasó la cita)
        const diffMinutes = (citaRealDate.getTime() - ahoraTs) / 60000;

        // Si ya pasaron 20 minutos de la hora de la cita (ej. cita a las 3:00 y ahora son 3:20 -> diff is -20)
        if (diffMinutes <= -20) {
           console.log(`✅ Confirmando automáticamente la reserva ${cita._id} por paso de +20 minutos`);
           
           cita.estado = 'confirmada';
           await cita.save();

           // Actualizar ingresos del peluquero automáticamente
           await Usuario.findByIdAndUpdate(cita.peluquero, {
             $inc: {
               'ingresos.total': cita.precio,
               'ingresos.mes': cita.precio
             }
           });

           // Mandar actualización por socket para que desaparezcan del dashboard o actualicen colores
           emitirATodos('horarios-actualizados', { peluqueroId: cita.peluquero, fecha: cita.fecha });
        }
      }
    } catch (e) {
      console.error('❌ Error en cron de confirmación +20min:', e.message);
    }
  });

  // 2. Ejecutar cada hora (Recordatorios de 24h y 2h por email original)
  cron.schedule('0 * * * *', async () => {
    try {
      const ahora = new Date();
      
      // 1. RECORDATORIO 24 HORAS ANTES
      const manana = new Date(ahora);
      manana.setHours(manana.getHours() + 24);
      
      const ventanaInicio24 = new Date(manana);
      ventanaInicio24.setMinutes(0, 0, 0);
      const ventanaFin24 = new Date(manana);
      ventanaFin24.setMinutes(59, 59, 999);

      const citas24h = await Reserva.find({
        fecha: { $gte: ventanaInicio24, $lte: ventanaFin24 },
        estado: { $in: ['pendiente', 'confirmada'] },
        'notificacionesEnviadas.recordatorio24h': { $ne: true }
      }).populate('peluquero', 'nombre salon');

      for (const cita of citas24h) {
        if (cita.cliente?.email) {
          await enviarEmail(
            cita.cliente.email,
            '📅 Recordatorio: Tu cita es mañana',
            emailTemplates.reservaConfirmada(
              cita.cliente.nombre, 
              cita.peluquero.nombre, 
              new Date(cita.fecha).toLocaleDateString(), 
              cita.hora, 
              cita.servicioNombre
            )
          );
          // Marcar como enviada
          await Reserva.findByIdAndUpdate(cita._id, { 'notificacionesEnviadas.recordatorio24h': true });
        }
      }

      // 2. RECORDATORIO 2 HORAS ANTES
      const enDosHoras = new Date(ahora);
      enDosHoras.setHours(enDosHoras.getHours() + 2);
      
      const ventanaInicio2 = new Date(enDosHoras);
      ventanaInicio2.setMinutes(0, 0, 0);
      const ventanaFin2 = new Date(enDosHoras);
      ventanaFin2.setMinutes(59, 59, 999);

      const citas2h = await Reserva.find({
        fecha: { $gte: ventanaInicio2, $lte: ventanaFin2 },
        estado: { $in: ['pendiente', 'confirmada'] },
        'notificacionesEnviadas.recordatorio2h': { $ne: true }
      }).populate('peluquero', 'nombre salon');

      for (const cita of citas2h) {
        if (cita.cliente?.email) {
          await enviarEmail(
            cita.cliente.email,
            '⏰ ¡Casi es hora! Tu cita es en 2 horas',
            emailTemplates.reservaConfirmada(
              cita.cliente.nombre, 
              cita.peluquero.nombre, 
              'Hoy', 
              cita.hora, 
              cita.servicioNombre
            )
          );
          // Marcar como enviada
          await Reserva.findByIdAndUpdate(cita._id, { 'notificacionesEnviadas.recordatorio2h': true });
        }
      }

    } catch (error) {
      console.error('❌ Error en reminder task:', error.message);
    }
  });
};
