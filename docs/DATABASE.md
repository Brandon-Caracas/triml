# 🗄️ Esquema de Base de Datos

## Conexión a MongoDB

### Local
```javascript
mongoose.connect('mongodb://localhost:27017/peluqueria_saas')
```

### Cloud (Recomendado - MongoDB Atlas)
```javascript
mongoose.connect('mongodb+srv://username:password@cluster.mongodb.net/peluqueria_saas')
```

---

## Colecciones

### 1. **usuarios** - Gestión de Usuarios

```javascript
{
  _id: ObjectId,
  
  // Datos básicos (Todos)
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  },
  telefono: {
    type: String,
    required: true
  },
  contraseña: {
    type: String,
    required: true,
    minlength: 6,
    select: false  // No incluir por defecto
  },
  
  // Control de Acceso
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
  
  // Suscripción (Solo Peluqueros)
  suscripcionActiva: {
    type: Boolean,
    default: false
  },
  fechaExpiracionSuscripcion: Date,
  
  // Datos del Salón (Solo Peluqueros)
  salon: String,
  direccion: String,
  
  // Horarios Laborales (Solo Peluqueros)
  horarioLaboral: {
    lunes: {
      inicio: String,    // "09:00"
      fin: String        // "18:00"
    },
    martes: { inicio: String, fin: String },
    miercoles: { inicio: String, fin: String },
    jueves: { inicio: String, fin: String },
    viernes: { inicio: String, fin: String },
    sabado: { inicio: String, fin: String },
    domingo: { inicio: String, fin: String }
  },
  
  // Ingresos (Solo Peluqueros - Opcional)
  ingresos: {
    total: {
      type: Number,
      default: 0
    },
    mes: {
      type: Number,
      default: 0
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Índices:**
```javascript
db.usuarios.createIndex({ email: 1 }, { unique: true })
db.usuarios.createIndex({ rol: 1 })
db.usuarios.createIndex({ estado: 1 })
```

---

### 2. **reservas** - Gestión de Citas

```javascript
{
  _id: ObjectId,
  
  // Información del Cliente
  cliente: {
    nombre: String,
    telefono: String,
    email: String,
    id: ObjectId  // ref: 'Usuario' (opcional)
  },
  
  // Referencia al Peluquero
  peluquero: {
    type: ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  // Referencia al Servicio
  servicio: {
    type: ObjectId,
    ref: 'Servicio',
    required: true
  },
  servicioNombre: String,  // Desnormalizado para búsqueda rápida
  
  // Fecha y Hora
  fecha: {
    type: Date,
    required: true
  },
  hora: {
    type: String,
    required: true,
    format: "HH:mm"  // "10:30"
  },
  
  // Duración
  duracion: {
    type: Number,
    default: 30,  // En minutos
    description: "Tiempo estimado del servicio"
  },
  
  // Precio
  precio: Number,
  
  // Estado de la Cita
  estado: {
    type: String,
    enum: [
      'pendiente',      // Creada, esperando confirmación
      'confirmada',     // Confirmada por peluquero
      'completada',     // Cita realizada, pagada
      'cancelada',      // Cancelada por cliente
      'no-show'         // Cliente no se presentó
    ],
    default: 'pendiente'
  },
  
  // Notas Adicionales
  notas: String,  // "Cliente es alérgico a..."
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Índices:**
```javascript
db.reservas.createIndex({ peluquero: 1, fecha: 1 })
db.reservas.createIndex({ "cliente.telefono": 1 })
db.reservas.createIndex({ fecha: 1 })
db.reservas.createIndex({ estado: 1 })
```

---

### 3. **servicios** - Servicios Ofrecidos

```javascript
{
  _id: ObjectId,
  
  // Información del Servicio
  nombre: {
    type: String,
    required: true,
    trim: true,
    examples: ["Corte", "Barba", "Tinte", "Peinado"]
  },
  
  descripcion: String,
  
  // Precio
  precio: {
    type: Number,
    required: true,
    min: 0,
    example: 25.50
  },
  
  // Duración
  duracion: {
    type: Number,
    default: 30,
    description: "Duración en minutos"
  },
  
  // Peluquero propietario
  peluquero: {
    type: ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  // Estado
  activo: {
    type: Boolean,
    default: true,
    description: "Si está disponible para reservas"
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Índices:**
```javascript
db.servicios.createIndex({ peluquero: 1 })
db.servicios.createIndex({ activo: 1 })
```

---

## 📊 Queries Importantes

### Obtener citas de un peluquero en una fecha

```javascript
db.reservas.find({
  peluquero: ObjectId("507f1f77bcf86cd799439011"),
  fecha: {
    $gte: new Date("2026-04-15"),
    $lt: new Date("2026-04-16")
  },
  estado: { $ne: 'cancelada' }
})
.sort({ hora: 1 })
```

### Obtener peluqueros activos con suscripción

```javascript
db.usuarios.find({
  rol: 'peluquero',
  estado: 'activo',
  suscripcionActiva: true
})
```

### Obtener citas completadas (ingresos)

```javascript
db.reservas.aggregate([
  {
    $match: {
      peluquero: ObjectId("507f1f77bcf86cd799439011"),
      estado: 'completada',
      fecha: {
        $gte: new Date("2026-04-01"),
        $lt: new Date("2026-05-01")
      }
    }
  },
  {
    $group: {
      _id: null,
      total: { $sum: "$precio" },
      cantidad: { $sum: 1 }
    }
  }
])
```

### Verificar doble reserva

```javascript
db.reservas.findOne({
  peluquero: ObjectId("507f1f77bcf86cd799439011"),
  fecha: new Date("2026-04-15"),
  hora: "10:30",
  estado: { $ne: 'cancelada' }
})
```

---

## 🔄 Operaciones CRUD

### CREATE - Crear Reserva

```javascript
db.reservas.insertOne({
  cliente: {
    nombre: "Juan Pérez",
    telefono: "+34 612 345 678"
  },
  peluquero: ObjectId("507f1f77bcf86cd799439011"),
  servicio: ObjectId("507f1f77bcf86cd799439012"),
  servicioNombre: "Corte",
  fecha: new Date("2026-04-15"),
  hora: "10:30",
  precio: 25,
  duracion: 30,
  estado: "pendiente",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### READ - Obtener Reservas

```javascript
db.reservas.find({
  peluquero: ObjectId("507f1f77bcf86cd799439011")
}).populate('servicio')
```

### UPDATE - Confirmar Cita

```javascript
db.reservas.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439013") },
  {
    $set: {
      estado: 'confirmada',
      updatedAt: new Date()
    }
  }
)
```

### DELETE - Cancelar Cita

```javascript
db.reservas.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439013") },
  {
    $set: {
      estado: 'cancelada',
      updatedAt: new Date()
    }
  }
)
```

---

## 🔒 Relaciones entre Colecciones

```
usuarios (Peluquero)
    ↑
    | 1-Many
    |
reservas ←─── servicios (creados por peluquero)
    ↓
    | Many-1
    |
usuarios (Cliente)
```

---

## 💾 Backup y Mantenimiento

### Backup MongoDB Atlas
```bash
# Automático cada 12 horas
# Configurar en: Atlas Dashboard → Backup
```

### Backup Local
```bash
mongodump --db peluqueria_saas --out ./backups

# Restore
mongorestore --db peluqueria_saas ./backups/peluqueria_saas
```

---

## 📈 Optimización

✅ Crear índices en campos de búsqueda frecuente
✅ Limitar proyección de campos
✅ Usar agregaciones para reportes
✅ Desnormalizar datos no frecuentemente actualizados
✅ Limpiar datos obsoletos periódicamente

---

**Base de datos diseñada para escalabilidad y rendimiento** 🚀
