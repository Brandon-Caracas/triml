# 🚀 Guía de Deployment

Guía completa para desplegar tu aplicación SaaS en producción.

---

## 📋 Checklist Pre-Deployment

- [ ] Todas las variables `.env` configuradas
- [ ] Base de datos en producción (MongoDB Atlas)
- [ ] Compilación de frontend OK
- [ ] Tests pasando
- [ ] SSL/HTTPS configurado
- [ ] CORS configurado correctamente
- [ ] Backups automáticos configurados
- [ ] Monitoreo en producción

---

## 🌐 Opción 1: Heroku (Más Fácil)

### Paso 1: Instalar Heroku CLI
```bash
# Windows
choco install heroku-cli

# macOS
brew tap heroku/brew && brew install heroku
```

### Paso 2: Login
```bash
heroku login
```

### Paso 3: Crear Apps

**Backend:**
```bash
cd backend
heroku create peluqueria-api-prod
heroku config:set JWT_SECRET=tu_secret_key_muy_fuerte
heroku config:set MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/peluqueria
```

**Frontend:**
```bash
cd frontend
vercel deploy  # O: npm run build → deploy a Vercel
```

### Paso 4: Deploy
```bash
cd backend
git push heroku main

cd frontend
npm run build
# Commit a Vercel
```

---

## 🌐 Opción 2: Railway (Recomendado)

### Paso 1: Crear Proyecto

Ir a: https://railway.app

1. Conectar GitHub
2. Seleccionar repositorio
3. Configurar variables de entorno

### Paso 2: Variables de Entorno
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=tu_secret_key_muy_fuerte
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tudominio.com
```

### Paso 3: Deploy Automático
```bash
git push origin main
# Railway auto-deploya
```

---

## 🌐 Opción 3: DigitalOcean (Control Total)

### Paso 1: Crear Droplet

1. Ir a DigitalOcean
2. Create → Droplets
3. Seleccionar: Ubuntu 20.04 LTS
4. Tamaño: $4/mes mínimo
5. Region: Más cercana

### Paso 2: Configurar Servidor

```bash
# SSH al servidor
ssh root@186.233.xxx.xxx

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar Nginx
apt install -y nginx

# Instalar PM2
npm install -g pm2

# Instalar MongoDB (opcional, mejor usar Atlas)
apt install -y mongodb
```

### Paso 3: Clonar y Setup Backend

```bash
cd /home/ubuntu
git clone https://github.com/tu-usuario/peluqueria-saas.git
cd peluqueria-saas/backend
npm install

# Crear .env
nano .env
# Pegar variables de entorno

# Iniciar con PM2
pm2 start server.js --name "peluqueria-api"
pm2 startup
pm2 save
```

### Paso 4: Configurar Nginx

```bash
nano /etc/nginx/sites-available/default
```

```nginx
server {
  listen 80;
  server_name api.peluqueria-saas.com;

  location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

```bash
systemctl restart nginx
```

### Paso 5: SSL con Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.peluqueria-saas.com
```

---

## 📦 Opción 4: Docker + Docker Compose

### Backend Dockerfile

```dockerfile
# dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: peluqueria_saas

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/peluqueria_saas
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Lanzar

```bash
docker-compose up -d
```

---

## 🔧 Configuración de Producción

### Variables de Entorno (.env Producción)

```env
# Base de datos
MONGODB_URI=mongodb+srv://admin:SuperClaveSegura123@cluster-prod.mongodb.net/peluqueria_saas?retryWrites=true&w=majority

# Seguridad
JWT_SECRET=Este_Es_Un_Secret_MuySeguro_Cambiar_Por_Uno_Real_muy_largo_y_seguro
JWT_EXPIRE=30d

# Servidor
PORT=5000
NODE_ENV=production

# Frontend
FRONTEND_URL=https://www.peluqueria-saas.com
API_URL=https://api.peluqueria-saas.com

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@peluqueria-saas.com
SMTP_PASS=contraseña_de_app
```

---

## 📊 Monitoreo

### Monitorizar con PM2

```bash
pm2 monit
pm2 logs peluqueria-api
pm2 save
```

### Datadog / New Relic

```bash
npm install --save newrelic
```

---

## 🔐 Seguridad en Producción

### HTTPS Obligatorio
```nginx
server {
  listen 80;
  server_name api.peluqueria-saas.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.peluqueria-saas.com;
  
  ssl_certificate /etc/letsencrypt/live/api.peluqueria-saas.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.peluqueria-saas.com/privkey.pem;
}
```

### CORS Seguro
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting
```bash
npm install express-rate-limit
```

---

## 💾 Backups Automáticos

### MongoDB Atlas

1. Ir a: **Clusters** → **Automated Backup**
2. Habilitar backups automáticos (cada 12 horas)
3. Retención: 35 días

### Database Backups Locales

```bash
# Script: backup.sh
#!/bin/bash

BACKUP_DIR="/home/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mongodump \
  --uri="mongodb+srv://admin:pass@cluster.mongodb.net/peluqueria_saas" \
  --out="$BACKUP_DIR/backup_$DATE"

# Comprimir
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/backup_$DATE"
rm -rf "$BACKUP_DIR/backup_$DATE"

# Subir a S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.tar.gz" s3://tu-bucket/backups/
```

---

## ✅ Checklist Final

- [ ] HTTPS configurado
- [ ] Variables de entorno en secretos
- [ ] Backups automáticos activos
- [ ] Monitoreo activo
- [ ] Rate limiting habilitado
- [ ] CORS configurado
- [ ] Logs centralizados
- [ ] Alertas configuradas
- [ ] DNS apuntando correctamente
- [ ] SSL certificado válido

---

## 📞 Solución de Problemas

### Error de Conexión a BD
```bash
# Verificar conexión
mongo "mongodb+srv://admin:pass@cluster.mongodb.net/test" --username admin
```

### Puerto 5000 en uso
```bash
lsof -i :5000
kill -9 <PID>
```

### Permiso denegado
```bash
chmod +x backup.sh
sudo chown -R usuario:usuario /home/app
```

---

**¡Tu aplicación está lista para producción!** 🎉

Dominio: https://www.peluqueria-saas.com  
API: https://api.peluqueria-saas.com

Acceso Admin: admin@peluqueria.com
