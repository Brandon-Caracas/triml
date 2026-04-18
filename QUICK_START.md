# 🎯 Quick Start Guide

## ⚡ Comenzar en 5 minutos

### 1️⃣ Clonar/Descargar el Proyecto
```bash
git clone <url>
cd sofware-peluqueria-2
```

### 2️⃣ Ejecutar Setup (Windows o Mac/Linux)

**Windows:**
```bash
# Verifica Node.js (debe ser versión 16 o superior)
node -v

# Verifica npm
npm -v

# Si no tienes Node.js, descárgalo desde: https://nodejs.org
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

O **manualmente:**
```bash
cd backend && npm install && cp .env.example .env
cd ../frontend && npm install
```

### 3️⃣ Inicializar Base de Datos

**Opción A: MongoDB Local**
```bash
# Asegúrate de tener MongoDB corriendo
mongod

# En otra terminal
cd backend
npm run seed
```

**Opción B: MongoDB Atlas (Recomendado)**
1. Ir a https://www.mongodb.com/cloud/atlas
2. Crear cuenta gratuita
3. Crear cluster
4. Copiar connection string
5. Pegarlo en `backend/.env` → `MONGODB_URI`

### 4️⃣ Configurar .env

**backend/.env:**
```env
MONGODB_URI=mongodb://localhost:27017/peluqueria_saas
JWT_SECRET=tu_secret_super_seguro
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 5️⃣ Iniciar Servidores

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
# Abre en http://localhost:5173
```

---

## 🔑 Credenciales de Prueba

Si ejecutaste `npm run seed`:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| 👑 Admin | `admin@peluqueria.com` | `admin123` |
| 💈 Peluquero | `juan@peluqueria.com` | `peluquero123` |
| 👤 Cliente | `pedro@email.com` | `cliente123` |

---

## 🧪 Probar la API

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@peluqueria.com","contraseña":"admin123"}'
```

### Ver Peluqueros (Admin)
```bash
curl -X GET http://localhost:5000/api/admin/peluqueros \
  -H "Authorization: Bearer {token}"
```

---

## 📂 Estructura Importante

```
backend/
├── server.js          ← Inicia aquí
├── .env              ← Variables de entorno
├── controllers/      ← Lógica de negocio
├── models/           ← Esquemas MongoDB
└── routes/           ← Endpoints

frontend/
├── src/
│   ├── pages/        ← Páginas principales
│   ├── components/   ← Componentes reutilizables
│   ├── services/     ← API calls
│   └── App.jsx       ← Componente raíz
└── vite.config.js    ← Configuración
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'mongoose'"
```bash
cd backend
npm install
```

### Error: "EADDRINUSE: address already in use :::5000"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Error: "Cannot connect to MongoDB"
- ✅ Verifica que MongoDB esté corriendo
- ✅ Verifica la URL en .env
- ✅ Verifica credenciales de MongoDB Atlas

---

## 📚 Documentación Completa

- [🏗️ Arquitectura](./docs/ARCHITECTURE.md)
- [🗄️ Base de Datos](./docs/DATABASE.md)
- [📡 API Endpoints](./docs/API.md)
- [🚀 Deployment](./docs/DEPLOYMENT.md)

---

## 🎯 Próximos Pasos

1. ✅ Crear primera cuenta de peluquero desde Admin
2. ✅ Crear servicios en el panel del peluquero
3. ✅ Agendar cita desde cliente
4. ✅ Confirmar cita desde peluquero
5. ✅ Ver ingresos

---

## 🚀 ¡Listo!

Tu plataforma SaaS está corriendo. ¡Ahora a monetizar! 💰

Preguntas: Revisa la documentación en `/docs`
