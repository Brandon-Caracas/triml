import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: [
      'reserva_creada',
      'reserva_confirmada',
      'reserva_cancelada',
      'reserva_completada',
      'suscripcion_renovada',
      'nueva_resena',
      'recordatorio_15m'
    ],
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  referencia: {
    tipo: String,
    id: mongoose.Schema.Types.ObjectId
  },
  leida: {
    type: Boolean,
    default: false
  },
  enviada_email: {
    type: Boolean,
    default: false
  },
  enviada_desktop: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Índices
notificacionSchema.index({ usuario: 1, leida: 1 });
notificacionSchema.index({ createdAt: -1 });

export default mongoose.model('Notificacion', notificacionSchema);
