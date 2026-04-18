import Notificacion from '../models/Notificacion.js';
import { emitirAlUsuario } from './socketService.js';
import { enviarEmail, emailTemplates } from './emailService.js';
import { enviarPush } from './pushService.js';

// Utility para evitar el desfase de 1 día por zonas horarias del servidor
const formatFechaSafe = (fechaISO) => {
  if (!fechaISO) return '';
  try {
    const dateStr = typeof fechaISO === 'string' ? fechaISO : new Date(fechaISO).toISOString();
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  } catch (e) {
    return 'Fecha invalida';
  }
};

export const crearNotificacion = async (usuarioId, tipo, titulo, mensaje, referencia = null) => {
  try {
    const notificacion = new Notificacion({
      usuario: usuarioId,
      tipo,
      titulo,
      mensaje,
      referencia
    });

    await notificacion.save();

    // Emitir por WebSocket inmediatamente
    emitirAlUsuario(usuarioId, 'nueva-notificacion', {
      _id: notificacion._id,
      tipo,
      titulo,
      mensaje,
      leida: false,
      createdAt: notificacion.createdAt
    });

    return notificacion;
  } catch (error) {
    console.error('❌ Error creando notificación:', error);
  }
};

export const marcarComoLeida = async (notificacionId) => {
  try {
    const notificacion = await Notificacion.findByIdAndUpdate(
      notificacionId,
      { leida: true },
      { new: true }
    );
    return notificacion;
  } catch (error) {
    console.error('❌ Error marcando como leída:', error);
  }
};

export const obtenerNotificaciones = async (usuarioId, limite = 20) => {
  try {
    const notificaciones = await Notificacion.find({ usuario: usuarioId })
      .sort({ createdAt: -1 })
      .limit(limite);
    return notificaciones;
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    return [];
  }
};

export const obtenerNoLeidas = async (usuarioId) => {
  try {
    const notificaciones = await Notificacion.find({ usuario: usuarioId, leida: false });
    return notificaciones;
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones no leídas:', error);
    return [];
  }
};

export const notificacionesEspeciales = {
  reservaCreada: async (usuarioId, cliente, fecha, hora, peluquero, telefono, peluqueroEmail, corte = 'Servicio General') => {
    // 1. Notificación en el sistema para el peluquero
    await crearNotificacion(
      usuarioId,
      'reserva_creada',
      '📅 Nueva reserva',
      `${cliente} ha agendado una cita para el ${formatFechaSafe(fecha)} a las ${hora}`
    );
    
    // 2. Email al Peluquero (Notificación Automática)
    if (process.env.EMAIL_USER && peluqueroEmail) {
      try {
        const fechaFmt = formatFechaSafe(fecha);

        await enviarEmail(
          peluqueroEmail,
          '📅 Nueva Cita Recibida',
          `
            <div style="font-family: sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 15px; max-width: 500px; margin: 0 auto; background-color: #ffffff;">
              <h2 style="color: #1e293b; margin-top: 0;">Nueva cita 💈</h2>
              <div style="font-size: 16px; color: #475569; line-height: 1.6;">
                <p style="margin: 8px 0;"><strong>Cliente:</strong> ${cliente}</p>
                <p style="margin: 8px 0;"><strong>Teléfono:</strong> ${telefono}</p>
                <p style="margin: 8px 0;"><strong>Corte:</strong> ${corte}</p>
                <p style="margin: 8px 0;"><strong>Fecha:</strong> ${fechaFmt}</p>
                <p style="margin: 8px 0;"><strong>Hora:</strong> ${hora}</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este es un mensaje automático del Sistema de Reservas.</p>
            </div>
          `
        );
      } catch (err) {
        console.warn('Error enviando email al peluquero:', err.message);
      }
    }

    // 3. Notificación Web Push Nativa al Peluquero
    try {
      await enviarPush(usuarioId, {
        title: '💈 Nueva cita agendada',
        body: `Tienes un nuevo cliente agendado: ${cliente}`,
        data: {
          cliente,
          hora,
          fecha: formatFechaSafe(fecha),
          url: '/peluquero'
        }
      });
    } catch (pushErr) {
      console.warn('Error enviando notificacion Web Push al peluquero:', pushErr.message);
    }

    // 4. Email de confirmación al Cliente
    if (process.env.EMAIL_USER && (telefono || 'cliente@email.com').includes('@')) {
      try {
        await enviarEmail(
          telefono, // Si el 'telefono' contiene un email o si tenemos el email del cliente
          'Tu cita ha sido agendada',
          emailTemplates.reservaConfirmada(cliente, peluquero, formatFechaSafe(fecha), hora, 'Servicio Profesional')
        );
      } catch (err) {
        console.warn('Email al cliente no enviado');
      }
    }
  },

  reservaConfirmada: async (usuarioId, cliente, fecha, hora) => {
    await crearNotificacion(
      usuarioId,
      'reserva_confirmada',
      '✓ Cita confirmada',
      `Tu cita para el ${formatFechaSafe(fecha)} a las ${hora} ha sido confirmada`
    );
  },

  reservaCancelada: async (usuarioId, fecha, hora, razon) => {
    await crearNotificacion(
      usuarioId,
      'reserva_cancelada',
      '❌ Cita cancelada',
      `Tu cita para el ${formatFechaSafe(fecha)} a las ${hora} fue cancelada. Razón: ${razon}`
    );
  },

  suscripcionRenovada: async (usuarioId, proximoVencimiento) => {
    await crearNotificacion(
      usuarioId,
      'suscripcion_renovada',
      '💳 Suscripción renovada',
      `Tu suscripción ha sido renovada. Próximo vencimiento: ${new Date(proximoVencimiento).toLocaleDateString()}`
    );
  },

  nuevaResena: async (usuarioId, cliente, calificacion) => {
    await crearNotificacion(
      usuarioId,
      'nueva_resena',
      `⭐ Nueva reseña (${calificacion} estrellas)`,
      `${cliente} dejó una reseña con ${calificacion} estrellas`
    );
  },

  // === SISTEMA DE RECORDATORIOS AUTOMÁTICOS (Arquitectura Expandible) ===
  // Preparado para Push notification, in-app socket y otros canales
  procesarRecordatorioCliente: async (cita) => {
    const mensaje = `⏰ Tu cita para ${cita.servicioNombre} es en 15 minutos!`;
    const titulo = 'Recordatorio de Cita';

    // 1. Notificación In-App (Solo para clientes autenticados / con ID en DB)
    if (cita.cliente?.id) {
       await crearNotificacion(
         cita.cliente.id,
         'recordatorio_15m',
         titulo,
         mensaje,
         cita._id
       );
    }

    // 2. [FUTURO] Integración con Notificaciones Push (Web Push API / Firebase Cloud Messaging)
    // if (cita.cliente?.pushToken) {
    //   await sendPushNotification(cita.cliente.pushToken, titulo, mensaje);
    // }

    // 3. [FUTURO] Integración con SMS o WhatsApp (Especialmente útil para usuarios GUEST)
    // if (cita.cliente?.telefono) {
    //   await sendWhatsapp(cita.cliente.telefono, mensaje);
    // }
  }
};

export default {
  crearNotificacion,
  marcarComoLeida,
  obtenerNotificaciones,
  obtenerNoLeidas,
  notificacionesEspeciales
};
