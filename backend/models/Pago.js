import mongoose from 'mongoose';

const pagoSchema = new mongoose.Schema({
  reserva: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reserva',
    required: true
  },
  peluquero: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  monto: {
    type: Number,
    required: true
  },
  metodo: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia', 'otro'],
    default: 'efectivo'
  },
  estado: {
    type: String,
    enum: ['pendiente', 'completado', 'reembolsado', 'fallido'],
    default: 'pendiente'
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  notas: String
}, {
  timestamps: true
});

// Índices para búsquedas y agregaciones
pagoSchema.index({ reserva: 1 });
pagoSchema.index({ peluquero: 1, fecha: 1 });
pagoSchema.index({ fecha: 1, estado: 1 });

export default mongoose.model('Pago', pagoSchema);
