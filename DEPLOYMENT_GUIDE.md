# 🚀 Guía de Despliegue en Producción

## Descripción General

Esta guía detalla cómo desplegar la aplicación Peluquería SaaS en producción utilizando Docker, Docker Compose, Nginx como reverse proxy y Let's Encrypt para SSL.

---

## 📋 Prerequisitos

- **Servidor Linux** (Ubuntu 20.04+ recomendado)
- **Docker** (versión 20.10+)
- **Docker Compose** (versión 1.29+)
- **Dominio registrado** apuntando a tu servidor
- **SSH access** al servidor
- **4GB RAM** mínimo
- **20GB almacenamiento** mínimo

---

## 🔧 Instalación de Dependencias

### 1. Instalar Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Instalar Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 3. Instalar Certbot (SSL)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y
```

---

## 📁 Preparación del Servidor

### 1. Clonar o descargar el proyecto

```bash
cd /home/usuario
git clone https://github.com/tu-usuario/peluqueria-saas.git
cd peluqueria-saas
```

### 2. Crear archivo `.env.production`

```bash
cp .env.example .env.production
```

**Contenido del `.env.production`:**

```bash
# Database
MONGO_USER=admin
MONGO_PASSWORD=tu_password_super_seguro_cambiar_esto
MONGO_INITDB_DATABASE=peluqueria_saas

# JWT
JWT_SECRET=tu_jwt_secret_muy_largo_y_aleatorio_cambiar_esto
JWT_EXPIRE=7d

# Node
NODE_ENV=production
PORT=5000

# Frontend
FRONTEND_URL=https://tudominio.com

# Email (Nodemailer)
EMAIL_SERVICE=gmail  # o tu proveedor SMTP
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion

# Google Calendar
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=https://tudominio.com/api/google-calendar/callback

# Domain
DOMAIN=tudominio.com
```

### 3. Crear directorios necesarios

```bash
mkdir -p ./ssl
mkdir -p ./renewal-hooks
chmod 755 ./renewal-hooks
```

---

## 🔐 Configurar SSL con Let's Encrypt

### 1. Generar certificado SSL

```bash
sudo certbot certonly --standalone \
  -d tudominio.com \
  -d www.tudominio.com \
  --email tu_email@example.com \
  --agree-tos \
  --non-interactive
```

### 2. Copiar certificados

```bash
sudo mkdir -p ./ssl/live/tudominio.com
sudo cp /etc/letsencrypt/live/tudominio.com/fullchain.pem ./ssl/live/tudominio.com/
sudo cp /etc/letsencrypt/live/tudominio.com/privkey.pem ./ssl/live/tudominio.com/
sudo chown -R $USER:$USER ./ssl
```

### 3. Actualizar nginx.prod.conf

Reemplaza `example.com` con tu dominio:

```bash
sed -i 's/example.com/tudominio.com/g' nginx.prod.conf
```

---

## 🚀 Desplegar la Aplicación

### 1. Construir y iniciar contenedores

```bash
# Cargar variables de entorno
export $(cat .env.production | xargs)

# Iniciar con docker-compose de producción
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. Verificar que todo está corriendo

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Verificar contenedores
docker-compose -f docker-compose.prod.yml ps

# Verificar salud
curl http://localhost/health
```

### 3. Configurar auto-renovación de SSL

Crear script `/renewal-hooks/post-renewal.sh`:

```bash
#!/bin/bash
cp /etc/letsencrypt/live/tudominio.com/fullchain.pem /path/to/project/ssl/live/tudominio.com/
cp /etc/letsencrypt/live/tudominio.com/privkey.pem /path/to/project/ssl/live/tudominio.com/
docker exec peluqueria_nginx nginx -s reload
```

Hacer ejecutable:

```bash
chmod +x renewal-hooks/post-renewal.sh
```

Agregar a crontab:

```bash
0 3 1 * * cd /path/to/project && docker-compose -f docker-compose.prod.yml exec certbot certbot renew --quiet
```

---

## 📊 Monitoreo y Mantenimiento

### 1. Ver logs en tiempo real

```bash
# Todos los logs
docker-compose -f docker-compose.prod.yml logs -f

# Solo del API
docker-compose -f docker-compose.prod.yml logs -f api

# Solo del Nginx
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 2. Backup de base de datos

```bash
# Backup manual
docker-compose -f docker-compose.prod.yml exec mongodb mongodump --out /data/backup/$(date +%Y%m%d)

# Script de backup automático (crontab)
0 2 * * * cd /path/to/project && docker-compose -f docker-compose.prod.yml exec -T mongodb mongodump --out /data/backup/$(date +\%Y\%m\%d)
```

### 3. Monitoreo de recursos

```bash
# CPU, memoria, etc.
docker stats

# Espacio en disco
df -h

# Uso de MongoDB
docker-compose -f docker-compose.prod.yml exec mongodb du -sh /data/db
```

---

## 🔍 Troubleshooting

### El API no se conecta a MongoDB

```bash
# Verificar conexión
docker-compose -f docker-compose.prod.yml exec api node -e "
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado'))
    .catch(e => console.log('❌ Error:', e))
"
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar que API está arriba
docker-compose -f docker-compose.prod.yml exec api curl http://localhost:5000/api/health

# Reiniciar nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### SSL certificate expired

```bash
# Renovar manualmente
docker-compose -f docker-compose.prod.yml exec certbot certbot renew --force-renewal
```

### Problemas de memoria

```bash
# Limitar memoria de contenedores
# Editar docker-compose.prod.yml y agregar:
# services:
#   api:
#     mem_limit: 512m
#   web:
#     mem_limit: 512m

docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📈 Optimizaciones Recomendadas

### 1. Configurar CDN (CloudFlare)

- Registra el dominio en CloudFlare
- Apunta nameservers a CloudFlare
- Activa "Full" SSL mode
- Habilita cache y compresión

### 2. Aumentar límites de archivo

En `.env.production`:

```bash
# Tamaño máximo de archivo de upload
MAX_FILE_SIZE=50m
```

### 3. Configurar Rate Limiting

Ya configurado en `nginx.prod.conf`:
- API: 30 requests/segundo
- General: 10 requests/segundo

### 4. Habilitar Redis para sesiones (opcional)

```yaml
# En docker-compose.prod.yml
redis:
  image: redis:7-alpine
  container_name: peluqueria_redis
  restart: always
  volumes:
    - redis_data:/data
  networks:
    - peluqueria_network
```

---

## 🔐 Consideraciones de Seguridad

- ✅ Cambiar contraseñas por defecto
- ✅ Usar JWT_SECRET muy largo y aleatorio
- ✅ Habilitar HTTPS con certificado SSL
- ✅ Configurar firewall

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

- ✅ Backups regulares
- ✅ Logs centralizados
- ✅ Rate limiting en Nginx

---

## 📱 Escalado (Si es necesario)

### Balancer de carga con múltiples instancias

```yaml
# Agregar en docker-compose.prod.yml
  api-2:
    build: ./backend
    ...
  api-3:
    build: ./backend
    ...
```

Configurar upstream en nginx:

```nginx
upstream api_backend {
    least_conn;
    server api:5000;
    server api-2:5000;
    server api-3:5000;
}
```

---

## ✅ Checklist de Producción

- [ ] Variables de entorno configuradas
- [ ] SSL certificado instalado
- [ ] Backup de base de datos configurado
- [ ] Monitoreo configurado
- [ ] Logs centralizados
- [ ] Firewall configurado
- [ ] DNS apuntando correctamente
- [ ] Email configurado (SMTP)
- [ ] Google Calendar OAuth configurado
- [ ] Sistema de notificaciones dando ok
- [ ] WebSockets funcionando (verifica /socket.io)
- [ ] Todos los tests pasando

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verifica conectividad: `curl http://localhost/health`
3. Consulta la sección de Troubleshooting
4. Contacta con el equipo de desarrollo

---

**Última actualización**: 2024  
**Versión**: 1.0
