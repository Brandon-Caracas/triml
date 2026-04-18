import mongoose from 'mongoose';

const negocioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del negocio es requerido'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'El identificador (slug) es requerido'],
    unique: true,
    lowercase: true,
    trim: true
  },
  // --- NUEVO: Campos para control del Admin ---
  email: {
    type: String,
    trim: true,
    default: ''
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  // -------------------------------------------
  configuracionVisual: {
    colorPrimario: {
      type: String,
      default: '#4f46e5'
    },
    colorSecundario: {
      type: String,
      default: '#0f172a'
    },
    logo: {
      type: String,
      default: ''
    },
    fondo: {
      type: String,
      default: ''
    }
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

// Auto-actualizar updatedAt
negocioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Negocio', negocioSchema);
