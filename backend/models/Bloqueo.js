import mongoose from 'mongoose';

const bloqueoSchema = new mongoose.Schema({
  peluquero: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: ['dia_completo', 'rango_horas'],
    default: 'dia_completo'
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  horaInicio: String, // Solo si tipo es rango_horas (ej. "14:00")
  horaFin: String,    // Solo si tipo es rango_horas (ej. "16:00")
  razon: {
    type: String,
    default: 'No disponible'
  }
}, { timestamps: true });

export default mongoose.model('Bloqueo', bloqueoSchema);
