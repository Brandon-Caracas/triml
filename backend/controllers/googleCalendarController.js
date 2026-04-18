import { google } from 'googleapis';
import GoogleCalendar from '../models/GoogleCalendar.js';
import dotenv from 'dotenv';

dotenv.config();

// Configurar cliente OAuth2 de Google
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/google-calendar/callback'
);

// 1. Generar URL para autenticación
export const obtenerURLAutenticacion = (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/calendar'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: req.user?.id || 'admin'
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generando URL de autenticación:', error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Callback después de autorizar
export const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const usuarioId = state;

    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Calcular expiración del token
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokens.expiry_in);

    // Guardar datos de Google Calendar en BD
    let googleCalendarDoc = await GoogleCalendar.findOne({ usuario: usuarioId });

    if (googleCalendarDoc) {
      googleCalendarDoc.access_token = tokens.access_token;
      googleCalendarDoc.refresh_token = tokens.refresh_token || googleCalendarDoc.refresh_token;
      googleCalendarDoc.token_expiry = tokenExpiry;
      googleCalendarDoc.sincronizado = true;
    } else {
      googleCalendarDoc = new GoogleCalendar({
        usuario: usuarioId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry,
        sincronizado: true
      });
    }

    await googleCalendarDoc.save();

    // Redirigir al cliente con estado de éxito
    res.redirect(`/dashboard?google_calendar=success`);
  } catch (error) {
    console.error('Error en callback de Google Calendar:', error);
    res.redirect(`/dashboard?google_calendar=error`);
  }
};

// 3. Crear evento en Google Calendar
export const crearEventoEnCalendar = async (usuarioId, reservaData) => {
  try {
    const googleCalendarDoc = await GoogleCalendar.findOne({ usuario: usuarioId });

    if (!googleCalendarDoc?.access_token) {
      console.warn('No Google Calendar token found for user:', usuarioId);
      return null;
    }

    // Refrescar token si es necesario
    oauth2Client.setCredentials({
      access_token: googleCalendarDoc.access_token,
      refresh_token: googleCalendarDoc.refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const evento = {
      summary: `${reservaData.servicio} - ${reservaData.clienteNombre}`,
      description: `Cita de ${reservaData.clienteNombre}\nTeléfono: ${reservaData.clienteTelefono}\nServicio: ${reservaData.servicio}`,
      start: {
        dateTime: new Date(reservaData.fecha).toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires'
      },
      end: {
        dateTime: new Date(new Date(reservaData.fecha).getTime() + reservaData.duracion * 60000).toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires'
      },
      attendees: [{ email: reservaData.clienteEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 horas antes
          { method: 'popup', minutes: 30 }        // 30 minutos antes
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: evento
    });

    // Guardar ID del evento
    googleCalendarDoc.eventos_creados = googleCalendarDoc.eventos_creados || [];
    googleCalendarDoc.eventos_creados.push({
      reserva_id: reservaData.reservaId,
      google_event_id: response.data.id,
      creado_en: new Date()
    });
    
    await googleCalendarDoc.save();

    return response.data;
  } catch (error) {
    console.error('Error creando evento en Google Calendar:', error);
    return null;
  }
};

// 4. Actualizar evento en Google Calendar
export const actualizarEventoEnCalendar = async (usuarioId, reservaId, nuevosdatos) => {
  try {
    const googleCalendarDoc = await GoogleCalendar.findOne({ usuario: usuarioId });

    if (!googleCalendarDoc?.access_token) {
      return null;
    }

    // Encontrar el evento asociado a esta reserva
    const eventoDoc = googleCalendarDoc.eventos_creados?.find(
      e => e.reserva_id.toString() === reservaId.toString()
    );

    if (!eventoDoc) {
      return null;
    }

    oauth2Client.setCredentials({
      access_token: googleCalendarDoc.access_token,
      refresh_token: googleCalendarDoc.refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const evento = {
      summary: nuevosdatos.servicio || 'Cita',
      start: {
        dateTime: new Date(nuevosData.fecha).toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires'
      },
      end: {
        dateTime: new Date(new Date(nuevosData.fecha).getTime() + (nuevosData.duracion || 60) * 60000).toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires'
      }
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventoDoc.google_event_id,
      resource: evento
    });

    return response.data;
  } catch (error) {
    console.error('Error actualizando evento en Google Calendar:', error);
    return null;
  }
};

// 5. Eliminar evento de Google Calendar
export const eliminarEventoDeCalendar = async (usuarioId, reservaId) => {
  try {
    const googleCalendarDoc = await GoogleCalendar.findOne({ usuario: usuarioId });

    if (!googleCalendarDoc?.access_token) {
      return null;
    }

    const eventoDoc = googleCalendarDoc.eventos_creados?.find(
      e => e.reserva_id.toString() === reservaId.toString()
    );

    if (!eventoDoc) {
      return null;
    }

    oauth2Client.setCredentials({
      access_token: googleCalendarDoc.access_token,
      refresh_token: googleCalendarDoc.refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventoDoc.google_event_id
    });

    // Remover del historial
    googleCalendarDoc.eventos_creados = googleCalendarDoc.eventos_creados.filter(
      e => e.reserva_id.toString() !== reservaId.toString()
    );
    
    await googleCalendarDoc.save();

    return true;
  } catch (error) {
    console.error('Error eliminando evento de Google Calendar:', error);
    return null;
  }
};

// 6. Sincronizar calendario (listar eventos)
export const sincronizarCalendar = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const googleCalendarDoc = await GoogleCalendar.findOne({ usuario: usuarioId });

    if (!googleCalendarDoc?.access_token) {
      return res.status(400).json({ error: 'Google Calendar no configurado' });
    }

    oauth2Client.setCredentials({
      access_token: googleCalendarDoc.access_token,
      refresh_token: googleCalendarDoc.refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    });

    res.json({
      eventos: response.data.items || [],
      sincronizado: true
    });
  } catch (error) {
    console.error('Error sincronizando Google Calendar:', error);
    res.status(500).json({ error: error.message });
  }
};

// 7. Desconectar Google Calendar
export const desconectarGoogleCalendar = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const googleCalendarDoc = await GoogleCalendar.findOne({ usuario: usuarioId });

    if (!googleCalendarDoc) {
      return res.status(404).json({ error: 'Google Calendar no configurado' });
    }

    // Revocar tokens
    try {
      await oauth2Client.revokeCredentials();
    } catch (e) {
      console.warn('Error revoking credentials:', e);
    }

    // Eliminar documento
    await GoogleCalendar.deleteOne({ usuario: usuarioId });

    res.json({ mensaje: 'Google Calendar desconectado correctamente' });
  } catch (error) {
    console.error('Error desconectando Google Calendar:', error);
    res.status(500).json({ error: error.message });
  }
};

// 8. Obtener estado de conexión
export const obtenerEstadoConexion = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const googleCalendarDoc = await GoogleCalendar.findOne({ usuario: usuarioId });

    if (!googleCalendarDoc) {
      return res.json({ conectado: false });
    }

    // Verificar si token está expirado
    const ahora = new Date();
    const tokenExpirado = googleCalendarDoc.token_expiry < ahora;

    res.json({
      conectado: !tokenExpirado,
      sincronizado: googleCalendarDoc.sincronizado,
      ultimaSincronizacion: googleCalendarDoc.updatedAt,
      tokenExpirado
    });
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({ error: error.message });
  }
};
