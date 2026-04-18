import React, { useState, useEffect } from 'react';

export default function ConfiguracionGoogleCalendar() {
  const [estado, setEstado] = useState('cargando');
  const [conectado, setConectado] = useState(false);
  const [sincronizado, setSincronizado] = useState(false);
  const [ultimaSincro, setUltimaSincro] = useState(null);

  useEffect(() => {
    verificarEstado();
  }, []);

  const verificarEstado = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/google-calendar/estado', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setConectado(data.conectado);
      setSincronizado(data.sincronizado);
      setUltimaSincro(data.ultimaSincronizacion);
      setEstado('listo');
    } catch (error) {
      console.error('Error verificando estado:', error);
      setEstado('error');
    }
  };

  const handleAutenticar = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/google-calendar/auth', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      window.open(data.authUrl, '_blank');
      
      // Verificar estado después de 2 segundos
      setTimeout(verificarEstado, 2000);
    } catch (error) {
      console.error('Error autenticando:', error);
    }
  };

  const handleSincronizar = async () => {
    try {
      setEstado('sincronizando');
      const response = await fetch('http://localhost:5000/api/google-calendar/sincronizar', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSincronizado(true);
      setUltimaSincro(new Date().toISOString());
      setEstado('listo');
    } catch (error) {
      console.error('Error sincronizando:', error);
      setEstado('error');
    }
  };

  const handleDesconectar = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desconectar Google Calendar?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/google-calendar/desconectar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setConectado(false);
        setSincronizado(false);
      }
    } catch (error) {
      console.error('Error desconectando:', error);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">📅 Google Calendar</h3>
        {conectado ? (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            ✅ Conectado
          </span>
        ) : (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            ⚫ Desconectado
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Descripción */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
          <p className="font-semibold mb-1">¿Qué es esto?</p>
          <p>Sincroniza automáticamente tus citas con Google Calendar. Cuando un cliente reserva, la cita aparecerá en tu calendario.</p>
        </div>

        {/* Estado de sincronización */}
        {conectado && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Estado:</span> Sincronizando automáticamente
            </p>
            {ultimaSincro && (
              <p className="text-xs text-gray-500 mt-1">
                Última sincronización: {new Date(ultimaSincro).toLocaleString('es-AR')}
              </p>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!conectado ? (
            <button
              onClick={handleAutenticar}
              disabled={estado === 'cargando'}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
            >
              {estado === 'cargando' ? '⏳ Cargando...' : '🔗 Conectar Google Calendar'}
            </button>
          ) : (
            <>
              <button
                onClick={handleSincronizar}
                disabled={estado === 'sincronizando'}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
              >
                {estado === 'sincronizando' ? '⏳ Sincronizando...' : '🔄 Sincronizar Ahora'}
              </button>
              <button
                onClick={handleDesconectar}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                ❌ Desconectar
              </button>
            </>
          )}
        </div>

        {/* Ventajas */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-semibold mb-2">✨ Ventajas:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Las citas se crean automáticamente en Google Calendar</li>
            <li>• Recibe recordatorios por correo 24 horas antes</li>
            <li>• Notificaciones en tu teléfono 30 minutos antes</li>
            <li>• Ver disponibilidad en tiempo real desde Google Meet</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
