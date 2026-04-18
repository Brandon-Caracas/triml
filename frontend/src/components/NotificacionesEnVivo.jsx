import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function NotificacionesEnVivo() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [conteoNoLeidas, setConteoNoLeidas] = useState(0);

  useEffect(() => {
    // Conectarse al socket
    const usuarioId = sessionStorage.getItem('usuarioId');
    if (usuarioId) {
      socket.emit('usuario-conectado', usuarioId);
    }

    // Escuchar nuevas notificaciones
    socket.on('nueva-notificacion', (notificacion) => {
      setNotificaciones(prev => [notificacion, ...prev]);
      setConteoNoLeidas(prev => prev + 1);

      // Notificación del navegador
      if (Notification.permission === 'granted') {
        new Notification(notificacion.titulo, {
          body: notificacion.mensaje,
          icon: '🔔'
        });
      }
    });

    // Cargar notificaciones existentes
    cargarNotificaciones();

    return () => {
      socket.off('nueva-notificacion');
    };
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notificaciones', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.notificaciones) {
        setNotificaciones(data.notificaciones);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const marcarComoLeida = async (notificacionId) => {
    try {
      await fetch(`http://localhost:5000/api/notificaciones/${notificacionId}/leida`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      setNotificaciones(prev =>
        prev.map(n => n._id === notificacionId ? { ...n, leida: true } : n)
      );
      setConteoNoLeidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  const solicitarPermisoNotificaciones = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        alert('Ya tienes notificaciones habilitadas');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            alert('¡Notificaciones habilitadas!');
          }
        });
      }
    }
  };

  return (
    <div>
      {/* Botón campana */}
      <div className="relative">
        <button
          onClick={() => setMostrarPanel(!mostrarPanel)}
          className="relative p-2 text-gray-600 hover:text-gray-900 transition"
          title="Notificaciones"
        >
          🔔
          {conteoNoLeidas > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {conteoNoLeidas}
            </span>
          )}
        </button>

        {/* Panel de notificaciones */}
        {mostrarPanel && (
          <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg">🔔 Notificaciones</h3>
              <button
                onClick={solicitarPermisoNotificaciones}
                className="text-xs text-blue-600 hover:underline mt-2"
              >
                📲 Habilitar notificaciones desktop
              </button>
            </div>

            {notificaciones.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No tienes notificaciones
              </div>
            ) : (
              <div className="divide-y">
                {notificaciones.map(notif => (
                  <div
                    key={notif._id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition ${
                      notif.leida ? 'opacity-60' : 'bg-blue-50'
                    }`}
                    onClick={() => !notif.leida && marcarComoLeida(notif._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{notif.titulo}</p>
                        <p className="text-xs text-gray-600 mt-1">{notif.mensaje}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notif.leida && (
                        <span className="bg-blue-500 w-2 h-2 rounded-full mt-1 ml-2"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
