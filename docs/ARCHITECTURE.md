# 🏗️ Arquitectura del Sistema

## Visión General

```
┌─────────────────┐                 ┌──────────────────┐
│   Frontend      │──── HTTP ────→  │  Backend         │
│   (React/Vite)  │◄─── JSON ────   │  (Express.js)    │
└─────────────────┘                 └──────────────────┘
                                            │
                                            │
                                    ┌──────▼─────────┐
                                    │   MongoDB      │
                                    │   (Database)   │
                                    └────────────────┘
```

---

## Capas de la Aplicación

### 1. **Frontend (React + Vite)**

**Responsabilidades:**
- Interfaz de usuario responsiva
- Manejo de estado local (Zustand)
- Llamadas a API (Axios)
- Autenticación en cliente
- Enrutamiento (React Router)

**Páginas Principales:**
- `LoginPage.jsx` - Iniciar sesión
- `RegistroPage.jsx` - Crear cuenta
- `ClientePage.jsx` - Panel cliente
- `PeluqueroDashboard.jsx` - Panel peluquero
- `AdminDashboard.jsx` - Panel admin

**Estructura de Carpetas:**
```
frontend/src/
├── components/        # Componentes reutilizables
├── pages/            # Páginas principales
├── services/         # API calls y state
├── styles/           # CSS/Tailwind
└── App.jsx
```

---

### 2. **Backend (Node.js + Express)**

**Responsabilidades:**
- API REST
- Lógica de negocio
- Autenticación y autorización
- Validación de datos
- Gestión de base de datos

**Estructura de Carpetas:**
```
backend/
├── controllers/      # Lógica de negocio
├── models/          # Esquemas MongoDB
├── routes/          # Endpoints
├── middleware/      # Auth, roles, validación
├── config/          # Configuración
└── server.js        # Punto de entrada
```

---

### 3. **Base de Datos (MongoDB)**

**Colecciones Principales:**

#### `usuarios`
```javascript
{
  _id: ObjectId,
  nombre: String,
  email: String (único),
  telefono: String,
  contraseña: String (hasheada),
  rol: String ["cliente", "peluquero", "admin"],
  estado: String ["activo", "inactivo", "bloqueado"],
  
  // Solo peluqueros
  suscripcionActiva: Boolean,
  fechaExpiracionSuscripcion: Date,
  salon: String,
  direccion: String,
  horarioLaboral: {
    lunes: { inicio: String, fin: String },
    ...
  },
  ingresos: {
    total: Number,
    mes: Number
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

#### `reservas`
```javascript
{
  _id: ObjectId,
  cliente: {
    nombre: String,
    telefono: String,
    email: String,
    id: ObjectId (ref Usuario)
  },
  peluquero: ObjectId (ref Usuario),
  servicio: ObjectId (ref Servicio),
  servicioNombre: String,
  fecha: Date,
  hora: String,
  duracion: Number,
  precio: Number,
  estado: String ["pendiente", "confirmada", "completada", "cancelada"],
  notas: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### `servicios`
```javascript
{
  _id: ObjectId,
  nombre: String,
  descripcion: String,
  precio: Number,
  duracion: Number,
  peluquero: ObjectId (ref Usuario),
  activo: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Sistema de Autenticación

### Flujo de Login:

```
1. Cliente envía email + contraseña
                    ↓
2. Backend valida credenciales
                    ↓
3. Genera JWT con: { id, rol, email }
                    ↓
4. Frontend guarda token en localStorage
                    ↓
5. Todas las peticiones incluyen: Header "Authorization: Bearer {token}"
```

### Roles y Permisos:

| Rol | Ver Agenda | Agendar | Gestionar | Ver Admin |
|-----|-----------|---------|-----------|-----------|
| **Cliente** | ❌ | ✅ | Propia | ❌ |
| **Peluquero** | ✅ | ❌ | Su Panel | ❌ |
| **Admin** | ✅ | ❌ | Todo | ✅ |

---

## 📡 Comunicación API

### Request/Response Pattern:

**Request:**
```javascript
POST /api/reservas/crear
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "clienteNombre": "Juan Pérez",
  "clienteTelefono": "+34 612 345 678",
  "peluqueroId": "507f1f77bcf86cd799439011",
  "servicioId": "507f1f77bcf86cd799439012",
  "fecha": "2026-04-15",
  "hora": "10:30",
  "notas": "Sensible al cuero cabelludo"
}
```

**Response Success:**
```javascript
{
  "mensaje": "Reserva creada exitosamente",
  "reserva": {
    "_id": "507f1f77bcf86cd799439013",
    "cliente": { ... },
    "peluquero": "507f1f77bcf86cd799439011",
    "fecha": "2026-04-15T00:00:00Z",
    "hora": "10:30",
    "estado": "pendiente",
    ...
  }
}
```

**Response Error:**
```javascript
{
  "error": "Este horario ya está reservado"
}
```

---

## 🔄 Flujos Principales

### 1. Agendar Cita (Cliente)

```
Cliente
  ↓
[Selecciona peluquero, fecha, hora]
  ↓
GET /api/reservas/horarios-disponibles
  ↓
Backend valida disponibilidad
  ↓
POST /api/reservas/crear
  ↓
[Reserva creada]
  ↓
Cliente ve confirmación
```

### 2. Gestionar Horarios (Peluquero)

```
Peluquero
  ↓
GET /api/peluqueros/agenda
  ↓
Backend devuelve citas del día
  ↓
Peluquero confirma/completa cita
  ↓
PUT /api/peluqueros/{id}/confirmar
  ↓
[Cita actualizada + ingresos registrados]
```

### 3. Bloquear Peluquero (Admin)

```
Admin
  ↓
GET /api/admin/peluqueros
  ↓
Selecciona peluquero a bloquear
  ↓
PUT /api/admin/peluqueros/{id}/bloquear
  ↓
PUT /api/admin/peluqueros/{id}/renovar-suscripcion
  ↓
[Peluquero bloqueado/desbloqueado]
```

---

## ⚙️ Middleware Importante

### `authMiddleware`
- Verifica que existe JWT
- Decodifica token
- Agrega usuario a `req.user`

### `roleMiddleware`
- Verifica rol del usuario
- Solo permite acceso a roles específicos

### `subscriptionMiddleware`
- Valida suscripción activa
- Bloquea si expiró
- Devuelve: "Tu suscripción ha expirado"

---

## 🚀 Despliegue

### Arquitectura en Producción:

```
┌─────────────────────────────────────────┐
│  Frontend (React) → Vercel/Netlify     │
└────────────────┬────────────────────────┘
                 │
                 ↓ HTTPS
        ┌────────────────────┐
        │  API Gateway/Load  │
        │    Balancer        │
        └────────┬───────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Backend (Node.js) → Heroku/Railway    │
│  - Múltiples instancias                 │
│  - Auto-scaling                         │
└────────────────┬────────────────────────┘
                 ↓
        ┌────────────────────┐
        │  MongoDB Atlas     │
        │  (Cloud Database)  │
        └────────────────────┘
```

---

## 📊 Métricas de Rendimiento

- **Frontend:** < 3s carga inicial
- **API:** < 200ms respuesta
- **BD:** Índices en peluquero + fecha
- **Caché:** JWT en localStorage + sessión

---

Esta arquitectura es **escalable, segura y lista para producción**. ✅
