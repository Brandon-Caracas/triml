import mongoose from 'mongoose';

const reservaSchema = new mongoose.Schema({
  cliente: {
    nombre: { type: String, required: true },
    telefono: { type: String, required: true },
    email: String,
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  },
  peluquero: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  negocioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Negocio'
  },
  servicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: true
  },
  servicioNombre: String,
  fecha: {
    type: Date,
    required: true
  },
  hora: {
    type: String,
    required: true
  },
  duracion: {
    type: Number,
    default: 30 // en minutos
  },
  precio: Number,
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'completada', 'cancelada', 'no-show', 'no_asistio'],
    default: 'pendiente'
  },
  notas: String,
  resena: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resena'
  },
  notificacionesEnviadas: {
    recordatorio24h: { type: Boolean, default: false },
    recordatorio2h: { type: Boolean, default: false },
    recordatorio15m: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para búsquedas rápidas
reservaSchema.index({ peluquero: 1, fecha: 1 });
reservaSchema.index({ 'cliente.telefono': 1 });
reservaSchema.index({ fecha: 1 });

export default mongoose.model('Reserva', reservaSchema);
