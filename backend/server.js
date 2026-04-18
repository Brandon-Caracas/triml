import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './routes/auth.js';
import reservasRoutes from './routes/reservas.js';
import peluquerosRoutes from './routes/peluqueros.js';
import adminRoutes from './routes/admin.js';
import serviciosRoutes from './routes/servicios.js';
import resenasRoutes from './routes/resenas.js';
import notificacionesRoutes from './routes/notificaciones.js';
import estadisticasRoutes from './routes/estadisticas.js';
import googleCalendarRoutes from './routes/googleCalendar.js';
import negociosRoutes from './routes/negocios.js';
import { inicializarSocket } from './services/socketService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Inicializar WebSockets
inicializarSocket(server);

// Inicializar Tareas Programadas
import { iniciarReminderTask } from './tasks/reminderTask.js';
iniciarReminderTask();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de peticiones para depuración
app.use((req, res, next) => {
  console.log(`📡 [SERVER] ${req.method} ${req.url}`);
  next();
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peluqueria_saas')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/peluqueros', peluquerosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/admin/estadisticas', estadisticasRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/negocios', negociosRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: '✅ API funcionando correctamente' });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor con WebSocket
server.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`   http://localhost:${PORT}/api/health`);
});
