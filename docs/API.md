# 📡 API REST - Documentación de Endpoints

## 🔗 Base URL
```
Local: http://localhost:5000/api
Producción: https://api.peluqueria-saas.com/api
```

---

## 🔐 Autenticación

Todos los endpoints protegidos requieren:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📚 Endpoints

### 🔑 AUTENTICACIÓN

#### POST `/auth/registro`
Crear nueva cuenta

**Parámetros:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "telefono": "+34 612 345 678",
  "contraseña": "contraseña123",
  "rol": "cliente"  // o "peluquero"
}
```

**Respuesta (201):**
```json
{
  "mensaje": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "rol": "cliente",
    "estado": "activo"
  }
}
```

---

#### POST `/auth/login`
Iniciar sesión

**Parámetros:**
```json
{
  "email": "juan@email.com",
  "contraseña": "contraseña123"
}
```

**Respuesta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "rol": "cliente",
    "estado": "activo"
  }
}
```

---

#### GET `/auth/verificar` ✅
Verifica que el token sea válido

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
{
  "mensaje": "Token válido",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "rol": "cliente",
    "email": "juan@email.com"
  }
}
```

---

### 📅 RESERVAS

#### GET `/reservas/horarios-disponibles`
Obtener horarios libres

**Parámetros Query:**
```
?peluqueroId=507f1f77bcf86cd799439011&fecha=2026-04-15
```

**Respuesta (200):**
```json
{
  "horariosDisponibles": [
    "09:00", "09:30", "10:00", "10:30", "11:00",
    "11:30", "14:00", "14:30", "15:00"
  ]
}
```

---

#### POST `/reservas/crear`
Crear nueva reserva

**Parámetros:**
```json
{
  "clienteNombre": "Juan Pérez",
  "clienteTelefono": "+34 612 345 678",
  "clienteEmail": "juan@email.com",
  "peluqueroId": "507f1f77bcf86cd799439011",
  "servicioId": "507f1f77bcf86cd799439012",
  "fecha": "2026-04-15",
  "hora": "10:30",
  "notas": "Sensible al cuero cabelludo"
}
```

**Respuesta (201):**
```json
{
  "mensaje": "Reserva creada exitosamente",
  "reserva": {
    "_id": "507f1f77bcf86cd799439013",
    "cliente": {
      "nombre": "Juan Pérez",
      "telefono": "+34 612 345 678"
    },
    "peluquero": "507f1f77bcf86cd799439011",
    "fecha": "2026-04-15T00:00:00Z",
    "hora": "10:30",
    "estado": "pendiente"
  }
}
```

---

#### GET `/reservas/mis-reservas`
Obtener reservas del cliente

**Parámetros Query:**
```
?telefono=+34612345678
```

**Respuesta (200):**
```json
{
  "reservas": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "cliente": { "nombre": "Juan", "telefono": "+34 612 345 678" },
      "peluquero": { "nombre": "María", "salon": "Salón María" },
      "servicio": { "nombre": "Corte", "precio": 25 },
      "fecha": "2026-04-15T00:00:00Z",
      "hora": "10:30",
      "estado": "pendiente",
      "createdAt": "2026-04-10T14:30:00Z"
    }
  ]
}
```

---

#### DELETE `/reservas/:reservaId/cancelar` ✅
Cancelar reserva

**Respuesta (200):**
```json
{
  "mensaje": "Reserva cancelada",
  "reserva": {
    "_id": "507f1f77bcf86cd799439013",
    "estado": "cancelada"
  }
}
```

---

### ✂️ SERVICIOS

#### GET `/servicios`
Obtener servicios de un peluquero

**Parámetros Query:**
```
?peluqueroId=507f1f77bcf86cd799439011
```

**Respuesta (200):**
```json
{
  "servicios": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "nombre": "Corte",
      "descripcion": "Corte clásico",
      "precio": 25,
      "duracion": 30,
      "activo": true
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "nombre": "Barba",
      "precio": 15,
      "duracion": 20,
      "activo": true
    }
  ]
}
```

---

#### POST `/servicios` ✅
Crear servicio (solo peluquero)

**Headers:**
```
Authorization: Bearer <token>
```

**Parámetros:**
```json
{
  "nombre": "Tinte",
  "descripcion": "Tinte castaño",
  "precio": 50,
  "duracion": 45
}
```

**Respuesta (201):**
```json
{
  "mensaje": "Servicio creado exitosamente",
  "servicio": {
    "_id": "507f1f77bcf86cd799439014",
    "nombre": "Tinte",
    "precio": 50,
    "duracion": 45,
    "peluquero": "507f1f77bcf86cd799439011",
    "activo": true
  }
}
```

---

#### PUT `/servicios/:servicioId` ✅
Actualizar servicio

**Parámetros:**
```json
{
  "nombre": "Tinte Premium",
  "precio": 60,
  "activo": true
}
```

**Respuesta (200):**
```json
{
  "mensaje": "Servicio actualizado",
  "servicio": { ... }
}
```

---

#### DELETE `/servicios/:servicioId` ✅
Eliminar servicio

**Respuesta (200):**
```json
{
  "mensaje": "Servicio eliminado"
}
```

---

### 💈 PELUQUERO (Dashboard)

#### GET `/peluqueros/agenda` ✅
Obtener agenda del día

**Parámetros Query (opcional):**
```
?fecha=2026-04-15
```

**Respuesta (200):**
```json
{
  "reservas": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "cliente": { "nombre": "Juan", "telefono": "+34 612 345 678" },
      "servicio": { "nombre": "Corte", "precio": 25 },
      "hora": "10:30",
      "estado": "pendiente"
    }
  ]
}
```

---

#### GET `/peluqueros/proximas-citas` ✅
Obtener próximas citas (próximos 10)

**Respuesta (200):**
```json
{
  "reservas": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "cliente": { "nombre": "Juan", "telefono": "+34 612 345 678" },
      "fecha": "2026-04-15T00:00:00Z",
      "hora": "10:30",
      "servicio": { "nombre": "Corte", "precio": 25 }
    }
  ]
}
```

---

#### PUT `/peluqueros/:reservaId/confirmar` ✅
Confirmar cita

**Respuesta (200):**
```json
{
  "mensaje": "Cita confirmada",
  "reserva": {
    "_id": "507f1f77bcf86cd799439013",
    "estado": "confirmada"
  }
}
```

---

#### PUT `/peluqueros/:reservaId/completar` ✅
Completar cita (registra ingreso)

**Respuesta (200):**
```json
{
  "mensaje": "Cita completada y ingreso registrado",
  "reserva": {
    "_id": "507f1f77bcf86cd799439013",
    "estado": "completada"
  }
}
```

---

#### GET `/peluqueros/ingresos` ✅
Obtener ingresos totales

**Respuesta (200):**
```json
{
  "ingresos": {
    "total": 1250.50,
    "mes": 450.00
  }
}
```

---

#### PUT `/peluqueros/horarios` ✅
Actualizar horarios disponibles

**Parámetros:**
```json
{
  "horarioLaboral": {
    "lunes": { "inicio": "09:00", "fin": "18:00" },
    "martes": { "inicio": "09:00", "fin": "18:00" },
    "miercoles": { "inicio": "09:00", "fin": "14:00" }
  }
}
```

**Respuesta (200):**
```json
{
  "mensaje": "Horarios actualizados",
  "horarios": { ... }
}
```

---

### 👑 ADMIN

#### GET `/admin/peluqueros` ✅
Obtener todos los peluqueros

**Headers:**
```
Authorization: Bearer <token> (Admin)
```

**Respuesta (200):**
```json
{
  "peluqueros": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Juan Cortes",
      "email": "juan@peluqueria.com",
      "telefono": "+34 600 111 111",
      "rol": "peluquero",
      "estado": "activo",
      "suscripcionActiva": true,
      "fechaExpiracionSuscripcion": "2026-05-10T00:00:00Z",
      "salon": "Salón Juan"
    }
  ]
}
```

---

#### POST `/admin/peluqueros/crear` ✅
Crear peluquero

**Parámetros:**
```json
{
  "nombre": "Juan Cortes",
  "email": "juan@peluqueria.com",
  "telefono": "+34 600 111 111",
  "contraseña": "peluquero123",
  "salon": "Salón Juan",
  "direccion": "Calle Principal 123"
}
```

**Respuesta (201):**
```json
{
  "mensaje": "Peluquero creado exitosamente",
  "peluquero": { ... }
}
```

---

#### PUT `/admin/peluqueros/:peluqueroId/bloquear` ✅
Bloquear peluquero

**Parámetros:**
```json
{
  "razon": "Suscripción vencida"
}
```

**Respuesta (200):**
```json
{
  "mensaje": "Peluquero bloqueado correctamente",
  "peluquero": {
    "_id": "507f1f77bcf86cd799439011",
    "estado": "bloqueado"
  }
}
```

---

#### PUT `/admin/peluqueros/:peluqueroId/desbloquear` ✅
Desbloquear peluquero

**Respuesta (200):**
```json
{
  "mensaje": "Peluquero desbloqueado correctamente",
  "peluquero": {
    "_id": "507f1f77bcf86cd799439011",
    "estado": "activo"
  }
}
```

---

#### PUT `/admin/peluqueros/:peluqueroId/renovar-suscripcion` ✅
Renovar suscripción

**Parámetros:**
```json
{
  "meses": 3
}
```

**Respuesta (200):**
```json
{
  "mensaje": "Suscripción renovada por 3 mes(es)",
  "peluquero": {
    "_id": "507f1f77bcf86cd799439011",
    "suscripcionActiva": true,
    "fechaExpiracionSuscripcion": "2026-07-10T00:00:00Z"
  }
}
```

---

#### GET `/admin/estadisticas` ✅
Obtener estadísticas del sistema

**Respuesta (200):**
```json
{
  "peluqueros": {
    "total": 5,
    "activos": 4,
    "bloqueados": 1
  },
  "reservas": {
    "total": 125,
    "completadas": 100,
    "pendientes": 20
  },
  "ingresos": 3250.50
}
```

---

#### GET `/admin/peluqueros/:peluqueroId/reporte` ✅
Obtener reporte de peluquero

**Respuesta (200):**
```json
{
  "peluquero": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Cortes",
    "email": "juan@peluqueria.com"
  },
  "estadisticas": {
    "totalReservas": 50,
    "completadas": 45,
    "ingresos": {
      "total": 1250.50,
      "mes": 450.00
    }
  }
}
```

---

## ⚠️ Códigos de Error

| Código | Significado |
|--------|------------|
| **200** | OK - Éxito |
| **201** | Created - Recurso creado |
| **400** | Bad Request - Datos inválidos |
| **401** | Unauthorized - Sin autenticación |
| **403** | Forbidden - Sin permisos / Suscripción vencida |
| **404** | Not Found - Recurso no existe |
| **500** | Server Error - Error interno |

---

## 🧪 Ejemplos con `curl`

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@email.com",
    "contraseña": "contraseña123"
  }'
```

### Crear Reserva
```bash
curl -X POST http://localhost:5000/api/reservas/crear \
  -H "Content-Type: application/json" \
  -d '{
    "clienteNombre": "Juan Pérez",
    "clienteTelefono": "+34 612 345 678",
    "peluqueroId": "507f1f77bcf86cd799439011",
    "servicioId": "507f1f77bcf86cd799439012",
    "fecha": "2026-04-15",
    "hora": "10:30"
  }'
```

### Con Autenticación
```bash
curl -X GET http://localhost:5000/api/peluqueros/agenda \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

**API completamente documentada y lista para usar** ✅
