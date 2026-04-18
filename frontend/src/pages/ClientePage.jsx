import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { reservasAPI, resenasAPI } from '../services/api';
import { useAuthStore } from '../services/store';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { conectarSocket, desconectarSocket } from '../services/socketService';

export default function ClientePage() {
  const { usuario } = useAuthStore();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservaParaCalificar, setReservaParaCalificar] = useState(null);
  const [calificacion, setCalificacion] = useState({ estrellas: 5, comentario: '' });
  const [cancelandoId, setCancelandoId] = useState(null);
  
  // Utility para evitar el desfase de 1 día por zonas horarias (forzado UTC)
  const formatFechaSafe = (fechaISO) => {
    if (!fechaISO) return '';
    try {
      const dateStr = typeof fechaISO === 'string' ? fechaISO : new Date(fechaISO).toISOString();
      const [year, month, day] = dateStr.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      return 'Fecha invalida';
    }
  };

  useEffect(() => {
    cargarReservas();

    // Configurar Socket.io para actualización en tiempo real
    const socket = conectarSocket();
    
    // Escuchar eventos globales que afecten a las citas
    socket.on('nueva-reserva', cargarReservas);
    socket.on('reserva-confirmada', cargarReservas);
    socket.on('reserva-cancelada', cargarReservas);
    socket.on('reserva-completada', cargarReservas);

    return () => {
      // No desconectamos el socket global para evitar cerrar conexiones de otros componentes,
      // pero sí removemos los listeners específicos de esta página
      socket.off('nueva-reserva', cargarReservas);
      socket.off('reserva-confirmada', cargarReservas);
      socket.off('reserva-cancelada', cargarReservas);
      socket.off('reserva-completada', cargarReservas);
    };
  }, []);

  const cargarReservas = async () => {
    try {
      const res = await reservasAPI.obtenerMisCitasRegistradas();
      setReservas(res.data.reservas);
    } catch (error) {
      toast.error('Error al cargar tus citas');
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (id) => {
    // 1. VALIDAR CLICK
    console.log("CLICK DETECTADO");
    
    // 3. VALIDAR FUNCIÓN
    console.log("ID recibido:", id);

    // TEMPORAL: Quitando window.confirm para evitar que el navegador lo bloquee
    console.log("Saltando confirmación del navegador...");
    
    try {
      setCancelandoId(id);
      // 4. VALIDAR REQUEST
      console.log("Enviando request...");
      
      const token = sessionStorage.getItem('token');
      const res = await fetch(`/api/reservas/${id}/cancelar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      console.log("Respuesta:", data);
      
      if (res.ok) {
        toast.success('Reserva cancelada');
        // 7. ACTUALIZAR UI (optimista)
        setReservas(prev => prev.filter(r => r._id !== id));
        // Sincronizar desde base de datos
        await cargarReservas();
      } else {
        toast.error('No se pudo cancelar: ' + (data.error || 'Error'));
      }
    } catch (error) {
      console.error("Error al disparar request:", error);
      toast.error('Fallo en la comunicación con el servidor');
    } finally {
      setCancelandoId(null);
    }
  };

  const submitCalificacion = async (e) => {
    e.preventDefault();
    try {
      await resenasAPI.crear({
        reservaId: reservaParaCalificar._id,
        peluqueroId: reservaParaCalificar.peluquero._id,
        calificacion: calificacion.estrellas,
        comentario: calificacion.comentario,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono
      });
      toast.success('¡Gracias por tu valoración!');
      setReservaParaCalificar(null);
      cargarReservas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al enviar reseña');
    }
  };

  // Calculamos la hora 00:00:00 de hoy para filtrar próximas citas
  const hoy0Horas = new Date();
  hoy0Horas.setHours(0, 0, 0, 0);
  
  // Próxima cita: la más cercana en el futuro (hoy o después) que esté activa (pendiente o confirmada)
  const proximaCita = [...reservas]
    .filter(r => ['confirmada', 'pendiente'].includes(r.estado) && new Date(r.fecha) >= hoy0Horas)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || a.hora.localeCompare(b.hora))[0];

  // Separación de listas para mejor UX
  const citasActivas = reservas.filter(r => ['pendiente', 'confirmada'].includes(r.estado) && new Date(r.fecha) >= hoy0Horas);
  const historialCitas = reservas.filter(r => !['pendiente', 'confirmada'].includes(r.estado) || new Date(r.fecha) < hoy0Horas);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="container flex-grow py-12">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Hero / Greeting */}
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-3xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl font-black mb-2 tracking-tight">¡Hola, {usuario?.nombre}! 👋</h1>
              <p className="text-indigo-100 text-lg opacity-90 max-w-xl">
                Bienvenido a tu portal personal. Aquí puedes gestionar tus reservas y agendar nuevas sesiones.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link 
                  to="/reservar" 
                  className="bg-white text-indigo-900 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2 transform hover:-translate-y-1"
                >
                  <span className="text-xl">✨</span> Agendar Nueva Cita
                </Link>
                <div className="flex items-center gap-3 px-6 py-3 bg-indigo-800/50 rounded-2xl border border-indigo-400/30 backdrop-blur-sm">
                  <span className="text-2xl font-bold">{reservas.length}</span>
                  <span className="text-sm font-medium opacity-80 uppercase tracking-widest text-indigo-200">Total Reservas</span>
                </div>
              </div>
            </div>
            {/* Shapes decorativos */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500 rounded-full opacity-10 blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Proxima Cita destacada */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 h-full">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Próxima Cita
                </h2>
                
                {proximaCita ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">💈</div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Peluquero</p>
                        <p className="font-black text-indigo-950">{proximaCita.peluquero?.nombre}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Fecha y Hora</p>
                      <p className="text-2xl font-black text-slate-900">{formatFechaSafe(proximaCita.fecha)}</p>
                      <p className="text-indigo-600 font-bold text-lg">{proximaCita.hora}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Servicio contratado</p>
                      <p className="font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl inline-block border border-slate-100">{proximaCita.servicioNombre}</p>
                    </div>

                      <button 
                        disabled={cancelandoId === proximaCita._id}
                        onClick={(e) => {
                          e.preventDefault();
                          cancelarReserva(proximaCita._id);
                        }}
                        className={`text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-2 transition-colors ${cancelandoId === proximaCita._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {cancelandoId === proximaCita._id ? '⌛ Cancelando...' : '❌ Cancelar reserva'}
                      </button>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-4">🗓️</div>
                    <p className="text-slate-400 text-sm font-bold">No tienes citas pendientes.</p>
                  </div>
                )}
              </div>
            </aside>

            {/* Listado de citas */}
            <section className="lg:col-span-3">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Citas Activas</h2>
                  <div className="flex gap-2">
                     <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase">Próximas: {citasActivas.length}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full whitespace-nowrap">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                      <tr>
                        <th className="px-8 py-5 text-left">Reserva</th>
                        <th className="px-8 py-5 text-left">Peluquero</th>
                        <th className="px-8 py-5 text-left">Fecha / Hora</th>
                        <th className="px-8 py-5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr><td colSpan="4" className="p-20 text-center"><div className="animate-spin text-indigo-600 text-3xl">⌛</div></td></tr>
                      ) : citasActivas.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-slate-400 font-bold italic text-sm">No tienes citas activas en este momento.</td>
                        </tr>
                      ) : citasActivas.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="font-black text-slate-900">{r.servicioNombre}</div>
                            <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{r.estado}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shadow-sm">💈</div>
                              <div>
                                <div className="text-sm font-black text-slate-800">{r.peluquero?.nombre}</div>
                              </div>
                            </div>
                          </td>
                           <td className="px-8 py-6">
                            <div className="text-sm font-black text-indigo-900">{formatFechaSafe(r.fecha)}</div>
                            <div className="text-xs font-bold text-indigo-500">{r.hora}</div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button 
                               disabled={cancelandoId === r._id}
                               onClick={(e) => {
                                 e.preventDefault();
                                 cancelarReserva(r._id);
                               }}
                               className={`bg-red-50 text-red-500 hover:bg-red-100 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${cancelandoId === r._id ? 'opacity-50' : ''}`}
                             >
                               {cancelandoId === r._id ? '⌛...' : 'Cancelar'}
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historial de Citas */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-md">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Historial Pasado</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full whitespace-nowrap">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                      <tr>
                        <th className="px-8 py-5 text-left">Reserva</th>
                        <th className="px-8 py-5 text-left">Peluquero</th>
                        <th className="px-8 py-5 text-left">Fecha</th>
                        <th className="px-8 py-5 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {historialCitas.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-slate-400 font-bold italic text-sm">Tu historial está vacío.</td>
                        </tr>
                      ) : historialCitas.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors opacity-70 hover:opacity-100">
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-700">{r.servicioNombre}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm font-bold text-slate-600">{r.peluquero?.nombre}</div>
                          </td>
                           <td className="px-8 py-6">
                            <div className="text-sm font-bold text-slate-500">{formatFechaSafe(r.fecha)}</div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
                              r.estado === 'completada' ? 'bg-green-50 text-green-700 ring-green-200' :
                              r.estado === 'cancelada' ? 'bg-red-50 text-red-700 ring-red-200' :
                              'bg-slate-50 text-slate-700 ring-slate-200'
                            }`}>
                              {r.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Modal Calificar */}
      {reservaParaCalificar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-black text-slate-900 mb-2">Califica tu Corte</h3>
             <p className="text-sm text-slate-500 mb-6">¿Qué te pareció el servicio de {reservaParaCalificar.peluquero?.nombre}?</p>
             
             <form onSubmit={submitCalificacion} className="space-y-4">
               <div>
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Puntuación</label>
                 <div className="flex gap-2">
                   {[1,2,3,4,5].map(num => (
                     <button 
                       key={num} type="button"
                       onClick={() => setCalificacion({...calificacion, estrellas: num})}
                       className={`w-12 h-12 rounded-xl text-xl flex items-center justify-center transition-all ${num <= calificacion.estrellas ? 'bg-orange-100 text-orange-500' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}
                     >★</button>
                   ))}
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Comentario (opcional)</label>
                 <textarea 
                   rows="3" 
                   className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 font-medium text-sm resize-none"
                   placeholder="¡Excelente servicio!"
                   value={calificacion.comentario}
                   onChange={e => setCalificacion({...calificacion, comentario: e.target.value})}
                 ></textarea>
               </div>
               <div className="flex gap-2 pt-2">
                 <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Enviar</button>
                 <button type="button" onClick={() => setReservaParaCalificar(null)} className="px-6 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200">Cancelar</button>
               </div>
             </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
