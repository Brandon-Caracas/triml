import React, { useState, useEffect, useRef } from 'react';
import { notificacionesAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { conectarSocket } from '../services/socketService';

export default function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const menuRef = useRef(null);

  const cargarNotificaciones = async () => {
    try {
      const [resTodas, resNoLeidas] = await Promise.all([
        notificacionesAPI.obtenerNuestras(),
        notificacionesAPI.obtenerNoLeidas()
      ]);
      setNotificaciones(resTodas.data.notificaciones);
      setNoLeidas(resNoLeidas.data.contador);
    } catch (error) {
      console.error('Error cargando notificaciones');
    }
  };

  useEffect(() => {
    cargarNotificaciones();
    const socket = conectarSocket();
    
    const handleNuevaNotificacion = (notif) => {
      setNotificaciones(prev => [notif, ...prev]);
      setNoLeidas(prev => prev + 1);
      toast.success(notif.titulo, {
        icon: '🔔',
        style: {
          background: '#0f172a',
          color: '#fff',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          borderRadius: '20px',
          fontFamily: 'Oswald'
        }
      });
    };

    socket.on('nueva-notificacion', handleNuevaNotificacion);

    const handleClickFuera = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);

    return () => {
      socket.off('nueva-notificacion', handleNuevaNotificacion);
      document.removeEventListener('mousedown', handleClickFuera);
    };
  }, []);

  const marcarComoLeida = async (id) => {
    try {
      await notificacionesAPI.marcarLeida(id);
      setNotificaciones(prev => prev.map(n => n._id === id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Error al marcar');
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await notificacionesAPI.marcarTodasLeidas();
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
      toast.success('Pizarra limpia 🧹');
    } catch (error) {
      toast.error('Error');
    }
  };

  const eliminarNotificacion = async (id) => {
    try {
      await notificacionesAPI.eliminar(id);
      setNotificaciones(prev => prev.filter(n => n._id !== id));
      // Re-check count if it was unread
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setAbierto(!abierto)}
        className="relative p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-blue-600/20 hover:border-blue-500/30 transition-all duration-300 group shadow-lg"
      >
        <span className="text-xl group-hover:scale-110 transition-transform inline-block">🔔</span>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-dark-bg text-[9px] font-anton items-center justify-center text-white shadow-glow-blue tracking-tighter">
              {noLeidas}
            </span>
          </span>
        )}
      </button>

      {abierto && (
        <>
          {/* Overlay para móvil / Fondo para cerrar al clicar fuera */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] sm:hidden"
            onClick={() => setAbierto(false)}
          ></div>

          <div className="
            fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 sm:pt-0 sm:items-center
            sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-6 sm:w-96
          ">
            <div className="
              glass-card overflow-hidden border-blue-500/20 shadow-glow-blue/10 animate-lux-fade
              w-full max-w-sm sm:max-w-none max-h-[85vh] sm:max-h-[500px] flex flex-col bg-dark-bg/95 backdrop-blur-xl
            ">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center sticky top-0 z-20">
                <h3 className="text-xl font-bebas text-white tracking-widest uppercase mb-0">Centro de Avisos</h3>
                <div className="flex items-center gap-4">
                  {noLeidas > 0 && (
                    <button onClick={marcarTodasLeidas} className="text-[10px] font-anton uppercase tracking-widest text-blue-400 hover:text-white transition-colors">Visto Todo</button>
                  )}
                  {/* Botón Cerrar (Solo Móvil) */}
                  <button onClick={() => setAbierto(false)} className="sm:hidden text-white/40 hover:text-white text-xl">✕</button>
                </div>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-grow bg-dark-bg/40">
                {notificaciones.length === 0 ? (
                  <div className="p-16 text-center italic text-white/20 font-anton uppercase tracking-widest text-[9px]">
                    Silencio absoluto...<br/><span className="mt-2 block opacity-10">💤</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notificaciones.map((n, i) => (
                      <div 
                        key={n._id} 
                        className={`p-6 border-b border-white/5 transition-all duration-500 hover:bg-white/[0.03] group relative animate-in slide-in-from-right-4 stagger-${(i%4)+1}`}
                      >
                        {!n.leida && <div className="absolute left-0 top-0 w-1 h-full bg-blue-600 shadow-glow-blue shadow-inner"></div>}
                        <div className="flex justify-between items-start gap-4">
                           <div className="flex-1">
                              <h4 className={`text-sm font-anton uppercase tracking-widest mb-1 ${n.leida ? 'text-white/40' : 'text-blue-400 group-hover:text-blue-300'}`}>{n.titulo}</h4>
                              <p className="text-xs text-white/60 font-oswald leading-relaxed">{n.mensaje}</p>
                              <span className="text-[9px] font-anton text-white/10 mt-3 block uppercase tracking-tighter">
                                {n.fecha ? new Date(n.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Recién'}
                              </span>
                           </div>
                           <div className="flex flex-col gap-2">
                              {!n.leida && (
                                <button onClick={() => marcarComoLeida(n._id)} className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/10 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all" title="Leída">✓</button>
                              )}
                              <button onClick={() => eliminarNotificacion(n._id)} className="w-8 h-8 rounded-xl bg-white/5 text-white/10 hover:bg-rose-600/20 hover:text-rose-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">✕</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 text-center bg-white/[0.02] border-t border-white/5">
                 <span className="text-[8px] font-anton text-white/10 uppercase tracking-[0.4em]">Fin del Historial</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
