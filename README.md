# 💈 Peluquería SaaS - Sistema de Gestión de Citas

Plataforma completa y escalable para gestión de citas de peluquerías. Permite que clientes agenden citas, peluqueros gestionen su agenda, y administradores controlen todo el sistema.

🎯 **Objetivo:** Crear un SaaS listo para producción que pueda monetizarse con suscripciones de peluqueros.

---

## 🚀 Características Principales

### 👤 Cliente
- ✅ Agendar citas (mismo día o futuros)
- ✅ Seleccionar peluquero, servicio, fecha y hora
- ✅ Ver horarios disponibles en tiempo real
- ✅ Gestionar sus citas
- ✅ Interfaz responsiva y mobile-first

### 💈 Peluquero  
- ✅ Panel personal con agenda del día
- ✅ Ver próximas citas
- ✅ Crear y gestionar servicios/precios
- ✅ Activar/desactivar horarios
- ✅ Ver ingresos (total y por mes)
- ✅ Propia cuenta y autenticación

### 👑 Administrador (TÚ)
- ✅ Ver lista de TODOS los peluqueros
- ✅ Crear cuentas de peluqueros
- ✅ Bloquear/desactivar cuentas
- ✅ Renovar suscripciones
- ✅ Ver estadísticas del sistema
- ✅ Control total

### 💳 Modelo de Negocio
- ✅ Sistema de suscripciones
- ✅ Bloqueo de acceso si no paga
- ✅ Mensaje: "Tu suscripción ha expirado"
- ✅ Renovación por meses

---

## 📋 Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| **Servidor** | Node.js + Express | 18+ |
| **Frontend** | React + Vite | 18 + 4 |
| **Base de Datos** | MongoDB | 4.4+ |
| **Autenticación** | JWT | - |
| **Estilos** | Tailwind CSS | 3+ |
| **HTTP** | Axios | - |
| **Estado** | Zustand | 4+ |

---

## 📁 Estructura del Proyecto

```
sofware-peluqueria-2/
│
├── backend/                 # Servidor Node.js/Express
│   ├── config/             # Configuración
│   ├── controllers/        # Lógica de negocio
│   ├── models/            # Esquemas MongoDB
│   ├── routes/            # Endpoints API
│   ├── middleware/        # Auth, roles, etc
│   ├── utils/             # Funciones auxiliares
│   ├── server.js          # Punto de entrada
│   ├── .env.example       # Variables de entorno
│   └── package.json
│
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/        # Páginas principales
│   │   ├── services/     # API calls y state management
│   │   ├── styles/       # Estilos CSS/Tailwind
│   │   ├── App.jsx       # Componente principal
│   │   └── main.jsx      # Punto de entrada
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── docs/                   # Documentación
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API.md
    └── DEPLOYMENT.md
```

---

## 🚀 Instalación y Setup

### 1️⃣ Clonar el Repositorio
```bash
git clone <url>
cd sofware-peluqueria-2
```

### 2️⃣ Configurar Backend

```bash
cd backend
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus valores
```

**Variables de entorno (.env):**
```env
MONGODB_URI=mongodb://localhost:27017/peluqueria_saas
JWT_SECRET=tu_super_secret_key_cambiar_en_produccion
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3️⃣ Configurar Frontend

```bash
cd frontend
npm install
```

### 4️⃣ Instalar MongoDB Localmente

**Windows:**
```bash
# Descargar desde https://www.mongodb.com/try/download/community
# O usar MongoDB Atlas (recomendado)
```

### 5️⃣ Ejecutar en Desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Escucha en http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Escucha en http://localhost:5173
```

---

## 🧪 Usar la Aplicación

### 📝 Crear Cuenta Admin (Primera Vez)

```bash
# En MongoDB, ejecutar:
use peluqueria_saas
db.usuarios.insertOne({
  nombre: "Admin",
  email: "admin@peluqueria.com",
  telefono: "+34 600 000 000",
  contraseña: bcrypt("admin123"),
  rol: "admin",
  estado: "activo",
  createdAt: new Date()
})
```

O usar la API:
```bash
POST http://localhost:5000/api/auth/registro
Body:
{
  "nombre": "Admin",
  "email": "admin@peluqueria.com",
  "telefono": "+34 600 000 000",
  "contraseña": "admin123",
  "rol": "admin"
}
```

### 👤 Crear Peluquero (Desde Admin)

```bash
POST http://localhost:5000/api/admin/peluqueros/crear
Headers: Authorization: Bearer {token}
Body:
{
  "nombre": "Juan Cortes",
  "email": "juan@peluqueria.com",
  "telefono": "+34 600 111 111",
  "contraseña": "peluquero123",
  "salon": "Salón Juan",
  "direccion": "Calle Principal 123"
}
```

---

## 📚 Documentación

- [🏗️ Arquitectura del Sistema](./docs/ARCHITECTURE.md)
- [🗄️ Esquema de Base de Datos](./docs/DATABASE.md)
- [📡 API REST Endpoints](./docs/API.md)
- [🚀 Guía de Deployment](./docs/DEPLOYMENT.md)

---

## 💡 Roadmap Futuro (PRO)

- [ ] Recordatorios por SMS/WhatsApp
- [ ] Sistema de calificaciones/reviews
- [ ] Dashboard de ingresos avanzado
- [ ] Integración de pagos (Stripe)
- [ ] App móvil nativa (React Native)
- [ ] Historial de transacciones
- [ ] Reportes PDF
- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Multi-idioma (i18n)
- [ ] Backup automático

---

## 🔐 Seguridad

✅ Contraseñas hasheadas con bcryptjs  
✅ Autenticación JWT  
✅ Validación de entrada  
✅ Protección de rutas por rol  
✅ CORS configurado  
✅ Variables de entorno  

---

## 📝 Licencia

Privado - Software propietario

---

## 📞 Soporte

Para preguntas o issues, contactar con soporte@peluqueria-saas.com

---

**Hecho con ❤️ por tu equipo de desarrollo**
