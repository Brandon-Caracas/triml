import webpush from 'web-push';
import Usuario from '../models/Usuario.js';

let configurado = false;

// Inicializa las llaves VAPID si existen
const initWebPush = () => {
  if (configurado) return;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = process.env;
  
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_EMAIL) {
    webpush.setVapidDetails(
      VAPID_EMAIL,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    configurado = true;
    console.log('✅ Web Push Service configurado');
  } else {
    console.warn('⚠️ Web Push Key no encontradas. No se enviarán notificaciones push.');
  }
};

/**
 * Envia notificaciones push a un usuario en todos sus dispositivos suscritos.
 * Limpia automáticamente las suscripciones rotas.
 */
export const enviarPush = async (usuarioId, payloadParams) => {
  try {
    initWebPush();
    if (!configurado) return;

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario || !usuario.pushSubscriptions || usuario.pushSubscriptions.length === 0) {
      return; // No hay dispositivos que notificar
    }

    const payload = JSON.stringify({
      title: payloadParams.title || 'Nueva Notificación',
      body: payloadParams.body || '',
      data: payloadParams.data || {},
      icon: payloadParams.icon || '/icon.png' // Requiere que el frontend ponga un icon.png en public
    });

    let suscripcionesRotas = false;

    // Enviar a todos los dispositivos registrados del usuario
    const promesasEnvio = usuario.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        // HTTP 410 (Gone) y 404 (Not Found) indican que la suscripción ha caducado
        if (err.statusCode === 410 || err.statusCode === 404) {
          suscripcionesRotas = true;
          // Devolvemos el endpoint para filtrarlo luego
          return sub.endpoint;
        } else {
          console.error('Error enviando push a un dispositivo:', err.message);
        }
      }
      return null; // OK
    });

    const resultados = await Promise.all(promesasEnvio);
    
    // Auto-limpieza de suscripciones rotas
    if (suscripcionesRotas) {
      const endpointsRotos = resultados.filter(e => e !== null);
      if (endpointsRotos.length > 0) {
        usuario.pushSubscriptions = usuario.pushSubscriptions.filter(
          s => !endpointsRotos.includes(s.endpoint)
        );
        await usuario.save();
        console.log(`🧹 Limpiadas ${endpointsRotos.length} suscripciones rotas del usuario ${usuarioId}`);
      }
    }
  } catch (error) {
    console.error('❌ Error general en Push Service:', error.message);
  }
};

export default {
  enviarPush,
  initWebPush
};
