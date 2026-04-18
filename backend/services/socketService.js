import { Server } from 'socket.io';

let io;
const usuariosConectados = new Map(); // userId -> socketId

export const inicializarSocket = (servidor) => {
  io = new Server(servidor, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Nuevo cliente conectado: ${socket.id}`);

    // Cuando un usuario se identifica
    socket.on('usuario-conectado', (usuarioId) => {
      usuariosConectados.set(usuarioId, socket.id);
      console.log(`✅ Usuario ${usuarioId} identificado`);
      
      // Notificar que el usuario está en línea
      io.emit('usuario-en-linea', { usuarioId, conectado: true });
    });

    // Cuando se desconecta
    socket.on('disconnect', () => {
      // Buscar el usuario y removerlo
      for (const [usuarioId, socketId] of usuariosConectados.entries()) {
        if (socketId === socket.id) {
          usuariosConectados.delete(usuarioId);
          io.emit('usuario-en-linea', { usuarioId, conectado: false });
          console.log(`❌ Usuario ${usuarioId} desconectado`);
          break;
        }
      }
    });
  });

  return io;
};

// Función para emitir eventos a todos los clientes
export const emitirATodos = (evento, datos) => {
  if (io) {
    io.emit(evento, datos);
  }
};

// Función para emitir a un usuario específico
export const emitirAlUsuario = (usuarioId, evento, datos) => {
  if (io) {
    const socketId = usuariosConectados.get(usuarioId);
    if (socketId) {
      io.to(socketId).emit(evento, datos);
    }
  }
};

// Función para emitir a múltiples usuarios
export const emitirAUsuarios = (usuarioIds, evento, datos) => {
  if (io) {
    usuarioIds.forEach(usuarioId => {
      const socketId = usuariosConectados.get(usuarioId);
      if (socketId) {
        io.to(socketId).emit(evento, datos);
      }
    });
  }
};

export const obtenerIO = () => io;

export default {
  inicializarSocket,
  emitirATodos,
  emitirAlUsuario,
  emitirAUsuarios,
  obtenerIO
};
