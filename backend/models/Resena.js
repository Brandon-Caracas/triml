import mongoose from 'mongoose';

const resenaSchema = new mongoose.Schema({
  peluquero: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  cliente: {
    nombre: { type: String, required: true },
    email: { type: String, required: true },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  },
  reserva: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reserva'
  },
  calificacion: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comentario: {
    type: String,
    maxlength: 500
  },
  aspectos: {
    limpiem: { type: Number, min: 1, max: 5 },
    atencion: { type: Number, min: 1, max: 5 },
    puntualidad: { type: Number, min: 1, max: 5 }
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
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
resenaSchema.index({ peluquero: 1, estado: 1 });
resenaSchema.index({ cliente: 1 });
resenaSchema.index({ createdAt: -1 });

export default mongoose.model('Resena', resenaSchema);
