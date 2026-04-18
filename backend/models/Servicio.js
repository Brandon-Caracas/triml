import mongoose from 'mongoose';

const servicioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del servicio es requerido'],
    trim: true
  },
  descripcion: String,
  imagen: {
    type: String,
    default: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop'
  },
  precio: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: 0
  },
  duracion: {
    type: Number,
    default: 30,
    description: 'Duración en minutos'
  },
  peluquero: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  activo: {
    type: Boolean,
    default: true
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

servicioSchema.index({ peluquero: 1 });

export default mongoose.model('Servicio', servicioSchema);
