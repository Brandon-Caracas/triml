⚡ GUÍA RÁPIDA DE PRUEBA - SISTEMA EN TIEMPO REAL
==============================================

## 🎬 DEMO EN 2 MINUTOS

### Estado actual:
```
✅ Backend corriendo en puerto 5000
✅ Frontend corriendo en puerto 5173
✅ MongoDB corriendo en Docker
✅ Datos de prueba cargados
```

---

## 🧪 TEST 1: Peluqueros y Servicios se cargan en VIVO

1. Abre: http://localhost:5173
2. Click en "📅 Agendar tu Cita"
3. Mira el selector "💈 Selecciona un Peluquero"

**RESULTADO ESPERADO:**
```
✅ Ves 2 peluqueros reales de la BD:
   - Juan
   - María
👉 NO son los 3 ficticios del antes
```

---

## 🧪 TEST 2: Servicios dinámicos por peluquero

1. Selecciona "Juan" del dropdown

**RESULTADO ESPERADO:**
```
✅ Aparece nuevo selector "✂️ Servicio"
✅ Ves 6 servicios de Juan:
   - Corte - $25 (30 min)
   - Peinado - $35 (45 min)
   - Tinte - $50 (90 min)
   - Ondulado - $40 (60 min)
   - Alisado - $45 (60 min)
   - Tratamiento - $55 (45 min)
```

---

## 🧪 TEST 3: Horarios cada 2 horas (NO input manual)

1. Ingresa:
   - Nombre: Tu Nombre
   - Teléfono: 3001234567
   - Peluquero: Juan
   - Servicio: Corte - $25

2. Click "Siguiente"

3. Selecciona una fecha futura

4. Mira los botones de horarios

**RESULTADO ESPERADO:**
```
✅ Solo 7 botones (no 48 como antes)
✅ Horarios:
   [7:00 AM] [9:00 AM] [11:00 AM] [1:00 PM] [3:00 PM] [5:00 PM] [7:00 PM]
```

---

## 🧪 TEST 4: Bloqueo de horas ocupadas

1. Crea UNA reserva para las 9:00 AM
2. Cancela y vuelve a intentar otras fechas...
3. En la misma fecha del paso 1, intenta agendar de nuevo
4. Mira los horarios

**RESULTADO ESPERADO:**
```
✅ El botón [9:00 AM] está ROJO
✅ Dice "Ocupada ❌"
✅ No se puede hacer click
✅ Los otros horarios están azules (disponibles)
```

---

## 🧪 TEST 5: TIEMPO REAL CADA 3 SEGUNDOS ⚡⚡⚡

🔑 **ESTE ES EL TEST MÁS IMPORTANTE**

### Paso 1: Abre 2 navegadores (o 2 pestañas)
```
Navegador 1: http://localhost:5173
Navegador 2: http://localhost:5173
```

### Paso 2: En Navegador 1
1. Ingresa teléfono: `3001234567`
2. Selecciona peluquero y servicio
3. Selecciona fecha
4. Selecciona hora
5. Click "✓ Confirmar Reserva"

**RESULTADO:**
```
✅ Reserva creada exitosamente
✅ Aparece en "Mis Citas" abajo
✅ Dice "En vivo 🔄"
✅ Estado: "pendiente" (amarillo)
```

### Paso 3: En Navegador 2
1. Ingresa el MISMO teléfono: `3001234567`
2. Mira la sección "Mis Citas"

**RESULTADO ESPERADO (0-3 segundos):**
```
❌ Al principio está vacío
```

**RESULTADO ESPERADO (después de 3 segundos):**
```
✅ ¡¡¡¡ APARECE LA MISMA CITA !!!
✅ Sin recargar la página
✅ Exactamente igual que en Navegador 1
✅ Misma hora, mismo peluquero, mismo precio
```

**RESULTADO ESPERADO (cada 3 segundos después):**
```
✅ Se sigue actualizando automáticamente
✅ Prueba cambiar el estado en Admin y verás que se refleja aquí
```

---

## 🧪 TEST 6: Estados de actualizaciones en tiempo real

1. Navega a Admin en otra pestaña
2. Confirma la cita que acabas de crear
3. Vuelve a la pestaña del cliente

**RESULTADO ESPERADO (en máx 3 segundos):**
```
✅ El estado cambia de "pendiente" a "confirmada"
✅ El color cambia de amarillo a verde
✅ TODO sin recargar la página
```

---

## 🧪 TEST 7: Cancelación de reserva

1. En la sección "Mis Citas"
2. Click en "❌ Cancelar" de la cita

**RESULTADO ESPERADO:**
```
✅ Confirmación: "¿Estás seguro?"
✅ Después de confirmar: "Reserva cancelada exitosamente"
✅ La cita desaparece automaticamente
✅ La hora vuelve a estar disponible (azul)
```

---

## 🧪 TEST 8: Validaciones obligatorias

1. Intenta NO seleccionar un peluquero
2. Intenta click en "Siguiente"

**RESULTADO ESPERADO:**
```
✅ Botón deshabilitado (gris)
✅ No hace nada
```

1. Selecciona peluquero pero NO selecciones servicio
2. Intenta click en "Siguiente"

**RESULTADO ESPERADO:**
```
✅ Botón SIGUE deshabilitado (gris)
✅ El campo ✂️ Servicio es OBLIGATORIO
```

---

## 📊 RESUMEN DE CAMBIOS VISIBLES

| Elemento | Antes | Ahora |
|----------|-------|-------|
| **Peluqueros** | "Salón María", "Juan Cortes", "Estética Plus" (ficticios) | Juan, María (reales de BD) |
| **Servicios** | Dropdown fijo con 4 opciones | Dropdown dinámico con 6 servicios por peluquero |
| **Horarios** | 48 botones (9 AM - 6 PM, cada 30 min) | 7 botones (7 AM - 7 PM, cada 2 horas) |
| **Horas ocupadas** | No visible | Botón rojo, deshabilitado, con label |
| **Mis Citas** | Reserva de mock | Actualiza cada 3 segundos en VIVO |
| **Interfaz** | Colores aburridos | Gradientes, bordes de colores, mejor diseño |

---

## 🔍 VERIFICACIÓN TÉCNICA (Para developers)

### Abre la consola del navegador (F12 → Console)

**TEST 1: Verifica que se cargan peluqueros**
```javascript
// Deberías ver llamadas tipo:
// GET http://localhost:5000/api/peluqueros/activos
// 200 OK
```

**TEST 2: Verifica que se actualiza cada 3 segundos**
```javascript
// Deberías ver REPETIDAMENTE:
// GET http://localhost:5000/api/reservas/mis-reservas?telefono=...
// 200 OK
// Cada 3 segundos sin parar
```

### Ve a DevTools → Network Tab

1. Ingresa el teléfono
2. Mira Network
3. Verás muchas llamadas GET a `/api/reservas/mis-reservas`
4. Una cada 3 segundos

**PRUEBA:** Abre el inspector de red y cuéntalas:
```
Segundo 0: GET mis-reservas ✓
Segundo 3: GET mis-reservas ✓
Segundo 6: GET mis-reservas ✓
Segundo 9: GET mis-reservas ✓
Segundo 12: GET mis-reservas ✓
```

---

## 🎯 CRITERIOS DE ÉXITO

Marca cada uno:

- [ ] ✅ Peluqueros se cargan desde API (no hardcodeados)
- [ ] ✅ Servicios aparecen dinámicamente al seleccionar peluquero
- [ ] ✅ Solo 7 horarios (cada 2 horas de 7 AM - 7 PM)
- [ ] ✅ Horarios ocupados están bloqueados (rojo, deshabilitado)
- [ ] ✅ Reserva se crea exitosamente
- [ ] ✅ Peluquero es OBLIGATORIO para continuar
- [ ] ✅ Servicio es OBLIGATORIO para continuar
- [ ] ✅ "Mis Citas" se actualiza cada 3 segundos
- [ ] ✅ Segunda pestaña ve la misma reserva (en vivo)
- [ ] ✅ Estados se actualizan sin recargar
- [ ] ✅ Cancelación de reservas funciona
- [ ] ✅ No hay errores en consola
- [ ] ✅ Interfaz es responsive (probado en móvil)
- [ ] ✅ Los 7 servicios de Juan se ven
- [ ] ✅ Los 7 servicios de María se ven

---

## 🐛 Si algo no funciona

### Paso 1: Verifica que todo está corriendo
```powershell
# Terminal 1: Backend
docker ps
# Debe mostrar: peluqueria_mongodb

# Terminal 2: Backend
# Debe mostrar: "🚀 Servidor ejecutándose en puerto 5000"

# Terminal 3: Frontend
# Debe mostrar: "➜  Local:   http://localhost:5173/"
```

### Paso 2: Limpia caché del navegador
```
Ctrl+Shift+Delete → Borrar todo
O: F12 → DevTools → Application → Clear Storage
```

### Paso 3: Recarga la página
```
Ctrl+Shift+R (recarga forzada ignorando caché)
```

### Paso 4: Verifica errores
```
F12 → Console → Busca errores rojo
F12 → Network → Busca requests fallidas (rojo)
```

---

## ✨ RESULTADO FINAL

Si todo funciona correctamente, tu aplicación ahora tiene:

🎯 **PROFESIONAL:**
- Interfaz moderna y limpia
- Horarios organizados
- Datos reales de la base de datos

⚡ **RÁPIDO:**
- No necesita recargar
- Se actualiza automáticamente

🔄 **EN TIEMPO REAL:**
- Cambios aparecen al instante
- Múltiples clientes ven lo mismo

🛡️ **ROBUSTO:**
- Validaciones completas
- Bloqueo de horas ocupadas
- Manejo de errores

---

## 📞 CREDENCIALES PARA TODA PRUEBA

```
CLIENTE (para "Mis Citas"):
- Teléfono: 3001234567
- Email: pedro@email.com

PELUQUEROS EN BD:
- Juan: juan@peluqueria.com
- María: maria@peluqueria.com

ADMIN (para confirmar citas):
- Email: admin@peluqueria.com
- Password: admin123
```

---

**¡Listo para probar!** 🚀

Ejecuta los 8 tests y marcalos. ¿Todos verde? ¡Perfecto! 
Tu sistema está 100% funcional.
