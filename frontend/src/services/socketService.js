import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:5000';

let socket = null;

/**
 * Inicializa la conexión Socket.io con el backend.
 * Devuelve el socket para que los componentes puedan suscribirse a eventos.
 */
export const conectarSocket = () => {
  if (socket && socket.connected) return socket;

  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket.io conectado:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('⚡ Socket.io desconectado:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('⚠️ Error Socket.io:', err.message);
  });

  return socket;
};

/**
 * Devuelve el socket activo o lo inicializa.
 */
export const obtenerSocket = () => {
  if (!socket) return conectarSocket();
  return socket;
};

/**
 * Desconecta el socket.
 */
export const desconectarSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { conectarSocket, obtenerSocket, desconectarSocket };
