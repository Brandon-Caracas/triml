import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config(); // Asegurar que .env esté cargado antes de crear el transporter

// Creamos el transporter de forma lazy para que lea el .env ya cargado
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Verificar conexión solo la primera vez
  _transporter.verify((error) => {
    if (error) {
      console.warn('⚠️ Error en la configuración de email:', error.message);
    } else {
      console.log('📧 Servidor de correo listo para enviar mensajes');
    }
  });

  return _transporter;
};

export const enviarEmail = async (para, asunto, html) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"Trimly" <${process.env.EMAIL_USER}>`,
      to: para,
      subject: asunto,
      html: html
    });

    console.log('✅ Email enviado:', info.messageId);
    return { exito: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { exito: false, error: error.message };
  }
};

// Plantillas de email
export const emailTemplates = {
  reservaConfirmada: (cliente, peluquero, fecha, hora, servicio) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>✓ Cita Confirmada</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <p>Hola <strong>${cliente}</strong>,</p>
        <p>Tu cita ha sido confirmada exitosamente.</p>
        <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
          <p><strong>📅 Fecha:</strong> ${fecha}</p>
          <p><strong>⏰ Hora:</strong> ${hora}</p>
          <p><strong>💈 Peluquero:</strong> ${peluquero}</p>
          <p><strong>✂️ Servicio:</strong> ${servicio}</p>
        </div>
        <p style="color: #666; font-size: 12px;">Por favor llega 5 minutos antes de tu cita.</p>
        <p style="color: #999; font-size: 11px; margin-top: 20px;">© 2026 Trimly. Todos los derechos reservados.</p>
      </div>
    </div>
  `,
  
  citaCancelada: (cliente, fecha, hora, razon) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>❌ Cita Cancelada</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <p>Hola <strong>${cliente}</strong>,</p>
        <p>Tu cita ha sido cancelada.</p>
        <div style="background: white; padding: 20px; border-left: 4px solid #f5576c; margin: 20px 0;">
          <p><strong>📅 Fecha:</strong> ${fecha}</p>
          <p><strong>⏰ Hora:</strong> ${hora}</p>
          <p><strong>Razón:</strong> ${razon}</p>
        </div>
        <p><a href="http://localhost:5173" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Agendar nueva cita</a></p>
      </div>
    </div>
  `,

  bienvenidaPerluquero: (nombre) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>👋 ¡Bienvenido a Trimly!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>¡Te damos la bienvenida a nuestra plataforma!</p>
        <p>Aquí podrás gestionar tu agenda, ver tus ingresos y conectar con tus clientes.</p>
        <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h3>Próximos pasos:</h3>
          <ul>
            <li>Completa tu perfil</li>
            <li>Agrega tus servicios</li>
            <li>Configura tu horario laboral</li>
            <li>¡Comienza a recibir citas!</li>
          </ul>
        </div>
        <p><a href="http://localhost:5173" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al panel</a></p>
      </div>
    </div>
  `
};

export default { enviarEmail, emailTemplates };
