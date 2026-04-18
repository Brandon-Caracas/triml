import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido']
  },
  contraseña: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: 6,
    select: false
  },
  rol: {
    type: String,
    enum: ['cliente', 'peluquero', 'admin'],
    default: 'cliente'
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'bloqueado'],
    default: 'activo'
  },
  negocioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Negocio'
  },
  // Campos específicos para peluqueros
  suscripcionActiva: {
    type: Boolean,
    default: false
  },
  fechaExpiracionSuscripcion: Date,
  salon: String,
  direccion: String,
  horarioLaboral: {
    lunes: { inicio: String, fin: String },
    martes: { inicio: String, fin: String },
    miercoles: { inicio: String, fin: String },
    jueves: { inicio: String, fin: String },
    viernes: { inicio: String, fin: String },
    sabado: { inicio: String, fin: String },
    domingo: { inicio: String, fin: String }
  },
  // Ingresos (opcional)
  ingresos: {
    total: { type: Number, default: 0 },
    mes: { type: Number, default: 0 }
  },
  // Suscripciones Web Push
  pushSubscriptions: {
    type: Array,
    default: []
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

// Hash de contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (this.isModified('contraseña')) {
    try {
      const salt = await bcryptjs.genSalt(10);
      this.contraseña = await bcryptjs.hash(this.contraseña, salt);
    } catch (error) {
      next(error);
    }
  }
  this.updatedAt = Date.now();
  next();
});

// Método para comparar contraseñas
usuarioSchema.methods.compararContraseña = async function(contrasenaIngresada) {
  return await bcryptjs.compare(contrasenaIngresada, this.contraseña);
};

// Método para ocultar datos sensibles
usuarioSchema.methods.toJSON = function() {
  const usuario = this.toObject();
  delete usuario.contraseña;
  return usuario;
};

export default mongoose.model('Usuario', usuarioSchema);
