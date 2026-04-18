import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { peluquerosAPI, adminAPI, notificacionesAPI, reservasAPI } from '../services/api';
import { conectarSocket, desconectarSocket } from '../services/socketService';
import { useAuthStore, useNegocioStore } from '../services/store';
import { toast } from 'react-hot-toast';

export default function PeluqueroDashboard() {
  const { usuario } = useAuthStore();
  const { negocio } = useNegocioStore();
  const [tab, setTab] = useState('agenda');
  const [citas, setCitas] = useState([]);

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
  const [servicios, setServicios] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [ingresos, setIngresos] = useState({ total: 0, mes: 0 });
  const [historialCortes, setHistorialCortes] = useState([]);
  const [filtroHistorial, setFiltroHistorial] = useState('');
  const [loading, setLoading] = useState(true);
  const [editandoServicio, setEditandoServicio] = useState(null);
  const [nuevoServicio, setNuevoServicio] = useState({
    nombre: '', precio: '', duracion: 30, descripcion: '', imagen: ''
  });
  const [nuevoBloqueo, setNuevoBloqueo] = useState({
    tipo: 'dia_completo', fechaInicio: '', fechaFin: '', horaInicio: null, horaFin: null, razon: 'Vacaciones/Inactividad'
  });

  const BLOQUEO_SLOTS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

  const seleccionarTramo = (hora) => {
    let { horaInicio, horaFin } = nuevoBloqueo;

    if (!horaInicio || (horaInicio && horaFin)) {
      // Primer clic o reinicio
      setNuevoBloqueo({ ...nuevoBloqueo, horaInicio: hora, horaFin: null, tipo: 'rango_horas' });
    } else {
      // Segundo clic: convertir a números para comparar y ordenar
      const hI = parseInt(horaInicio.split(':')[0]);
      const hS = parseInt(hora.split(':')[0]);
      
      if (hS < hI) {
        setNuevoBloqueo({ ...nuevoBloqueo, horaInicio: hora, horaFin: horaInicio });
      } else if (hS === hI) {
        setNuevoBloqueo({ ...nuevoBloqueo, horaInicio: null, horaFin: null });
      } else {
        setNuevoBloqueo({ ...nuevoBloqueo, horaInicio: horaInicio, horaFin: hora });
      }
    }
  };

  const estaEnRango = (hora) => {
    if (!nuevoBloqueo.horaInicio || !nuevoBloqueo.horaFin) return false;
    const h = parseInt(hora.split(':')[0]);
    const hI = parseInt(nuevoBloqueo.horaInicio.split(':')[0]);
    const hF = parseInt(nuevoBloqueo.horaFin.split(':')[0]);
    return h > hI && h < hF;
  };

  useEffect(() => {
    cargarDatos();
    
    // Conectar Sockets para actualizaciones en tiempo real
    const socket = conectarSocket();
    const refrescar = () => cargarDatos();

    socket.on('nueva-reserva', refrescar);
    socket.on('reserva-cancelada', refrescar);
    socket.on('horarios-actualizados', refrescar);

    // INICIAR SUSCRIPCION A WEB PUSH 
    const registrarWebPush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      if (Notification.permission === 'denied') return;

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const { data: { publicKey } } = await notificacionesAPI.obtenerVapidKey();
          const convertedVapidKey = urlBase64ToUint8Array(publicKey);
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
          await notificacionesAPI.suscribirPush(subscription);
          console.log('📱 Dispositivo vinculado exitosamente a Web Push');
        }
      } catch (err) {
        console.warn('Error gestionando Web Push Subscription:', err);
      }
    };

    registrarWebPush();

    return () => {
      socket.off('nueva-reserva', refrescar);
      socket.off('reserva-cancelada', refrescar);
      socket.off('horarios-actualizados', refrescar);
      desconectarSocket();
    };
  }, [tab]);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const format12H = (horaMilitary) => {
    if (!horaMilitary) return '';
    const [hrs, mins] = horaMilitary.split(':').map(Number);
    const suffix = hrs >= 12 ? 'PM' : 'AM';
    const hrs12 = hrs % 12 || 12;
    return `${hrs12}:${mins.toString().padStart(2, '0')} ${suffix}`;
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (tab === 'agenda') {
        const res = await peluquerosAPI.obtenerAgenda();
        setCitas(res.data.reservas || []);
      } else if (tab === 'ingresos') {
        const res = await peluquerosAPI.obtenerIngresos();
        setIngresos(res.data.ingresos || { total: 0, mes: 0 });
        setHistorialCortes(res.data.historial || []);
      } else if (tab === 'servicios') {
        const res = await peluquerosAPI.obtenerMisServicios();
        setServicios(res.data.servicios || []);
      } else if (tab === 'bloqueos') {
        const res = await peluquerosAPI.obtenerBloqueos();
        setBloqueos(res.data.bloqueos || []);
      }
    } catch (e) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (estado) => {
    const map = {
      confirmada: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-glow-blue/10',
      completada: 'bg-green-500/10 text-green-400 border-green-500/20 shadow-glow-green/10',
      cancelada: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-glow-rose/10',
      pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-glow-amber/10',
      no_asistio: 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-glow-orange/10'
    };
    return map[estado] || 'bg-white/5 text-white/30 border-white/10';
  };

  const completarCita = async (id) => {
    try {
      await peluquerosAPI.completarCita(id);
      toast.success('¡Cita completada! Ingreso registrado.');
      cargarDatos();
    } catch (e) {
      toast.error('Error al completar cita');
    }
  };

  const marcarNoAsistio = async (id) => {
    try {
      await peluquerosAPI.marcarNoAsistio(id);
      toast.success('Cliente marcado como No-Show.');
      cargarDatos();
    } catch (e) {
      console.error('Error no-asistio:', e.response?.data || e.message);
      toast.error(e.response?.data?.error || 'Error al registrar inasistencia');
    }
  };

  const cancelarCita = async (id) => {
    try {
      await reservasAPI.cancelar(id);
      toast.success('Cita cancelada correctamente.');
      cargarDatos();
    } catch (e) {
      console.error('Error cancelar:', e.response?.data || e.message);
      toast.error(e.response?.data?.error || 'Error al cancelar la cita');
    }
  };

  const handleCrearServicio = async (e) => {
    e.preventDefault();
    try {
      await peluquerosAPI.crearServicio({
        ...nuevoServicio,
        precio: parseFloat(nuevoServicio.precio) || 0,
        duracion: parseInt(nuevoServicio.duracion) || 30
      });
      toast.success('Servicio creado');
      setNuevoServicio({ nombre: '', precio: '', duracion: 30, descripcion: '', imagen: '' });
      cargarDatos();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al crear servicio');
    }
  };

  const handleEliminarServicio = async (id) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    try {
      await peluquerosAPI.eliminarServicio(id);
      toast.success('Servicio eliminado');
      cargarDatos();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  const handleEditarServicio = async (e) => {
    e.preventDefault();
    try {
      await peluquerosAPI.editarServicio(editandoServicio._id, editandoServicio);
      toast.success('Servicio actualizado');
      setEditandoServicio(null);
      cargarDatos();
    } catch (e) {
      toast.error('Error al actualizar');
    }
  };

  const handleGuardarConfiguracion = async (e) => {
    e.preventDefault();
    try {
      const { negociosAPI } = await import('../services/api');
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      const res = await negociosAPI.actualizarConfiguracion({
        colorPrimario: data.colorPrimario,
        colorSecundario: data.colorSecundario,
        logo: data.logo,
        fondo: data.fondo
      });
      const { useNegocioStore } = await import('../services/store');
      const setNegocio = useNegocioStore.getState().setNegocio;
      setNegocio({
        ...negocio,
        configuracionVisual: res.data.configuracion
      });
      toast.success('¡Diseño actualizado exitosamente!');
    } catch(err) {
      toast.error('Error guardando configuración');
    }
  };

  const handleCrearBloqueo = async (e) => {
    e.preventDefault();
    try {
      if (nuevoBloqueo.tipo === 'rango_horas' && (!nuevoBloqueo.horaInicio || !nuevoBloqueo.horaFin)) {
        return toast.error('Selecciona un rango válido');
      }
      await peluquerosAPI.crearBloqueo(nuevoBloqueo);
      toast.success('¡Disponibilidad actualizada! 🔒');
      setNuevoBloqueo({ tipo: 'dia_completo', fechaInicio: '', fechaFin: '', horaInicio: null, horaFin: null, razon: '' });
      cargarDatos();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al crear restricción');
    }
  };

  const handleEliminarBloqueo = async (id) => {
    // Usamos alert para depurar en dispositivos reales donde no se ve la consola
    window.alert("Intentando eliminar bloqueo ID: " + id);
    try {
      await peluquerosAPI.eliminarBloqueo(id);
      toast.success('¡Horario liberado! 🔓');
      window.alert("✅ Eliminado con éxito del servidor");
      cargarDatos();
    } catch (e) {
      console.error(e);
      window.alert("❌ Error en la API: " + (e.response?.data?.error || e.message));
      toast.error('Error al eliminar bloqueo');
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-oswald text-white">
      <Header />
      
      <main className="flex-grow pb-24">
        {/* Perfil Header ULTRA LUX */}
        <div className="relative overflow-hidden pt-16 pb-28 px-6 text-center sm:text-left">
           <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse"></div>
           <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-10 relative z-10 animate-lux-fade">
              <div className="relative group">
                 <div className="w-28 h-28 bg-blue-600/20 text-blue-400 rounded-[40px] flex items-center justify-center text-5xl shadow-glow-blue border border-blue-500/30 transform transition-transform group-hover:scale-110 duration-700">🧔</div>
                 <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-dark-bg"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-6xl font-bebas tracking-tighter text-white uppercase drop-shadow-glow-blue leading-none mb-2">{usuario?.nombre}</h1>
                <p className="text-white/40 font-anton text-[11px] uppercase tracking-[0.5em] mt-1">{usuario?.salon || 'Director Creativo Elite'}</p>
                <div className="flex gap-4 mt-6 justify-center sm:justify-start">
                   <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-2xl">
                      <span className="w-2 h-2 rounded-full bg-blue-400 shadow-glow-blue animate-ping"></span>
                      <span className="text-[10px] font-anton text-blue-400 uppercase tracking-widest">En Línea</span>
                   </div>
                   <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-2xl">
                      <span className="text-[10px] font-anton text-white/30 uppercase tracking-widest">SaaS Edition Lux</span>
                   </div>
                </div>
              </div>
           </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
           
           {/* Navigation Tabs LUX */}
            <div className="glass-card p-2 flex flex-wrap gap-2 border-white/10 bg-white/[0.03] backdrop-blur-[30px] rounded-[36px] mb-16 shadow-2xl">
              {[
                { id: 'agenda', label: '📅 Mi Agenda' },
                { id: 'servicios', label: '✂️ Catálogo' },
                { id: 'bloqueos', label: '🔒 Descansos' },
                { id: 'ingresos', label: '💰 Finanzas' },
                { id: 'configuracion', label: '🎨 Branding' }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 min-w-[110px] py-4 rounded-3xl font-anton text-[10px] uppercase tracking-widest transition-all duration-500 ${tab === t.id ? 'bg-blue-600/90 text-white shadow-glow-blue border border-blue-400/50' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-16">
               {/* ══ TAB: AGENDA ══ */}
               {tab === 'agenda' && (() => {
                 // ── Clasificar citas ──
                 const hoy = new Date().toISOString().split('T')[0];

                 const citasHoy = citas.filter(c => {
                   const fechaCita = typeof c.fecha === 'string'
                     ? c.fecha.split('T')[0]
                     : new Date(c.fecha).toISOString().split('T')[0];
                   return fechaCita === hoy;
                 });

                 const citasFuturas = citas.filter(c => {
                   const fechaCita = typeof c.fecha === 'string'
                     ? c.fecha.split('T')[0]
                     : new Date(c.fecha).toISOString().split('T')[0];
                   return fechaCita > hoy;
                 });

                 const pendientesHoy = citasHoy
                   .filter(c => c.estado === 'pendiente' || c.estado === 'confirmada')
                   .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

                 const completadasHoy = citasHoy
                   .filter(c => c.estado === 'completada')
                   .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

                 const noAsistioHoy = citasHoy
                   .filter(c => c.estado === 'no_asistio')
                   .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

                 // ── Colores por estado ──
                 const borderColor = (estado) => {
                   if (estado === 'pendiente' || estado === 'confirmada') return 'border-l-amber-500 shadow-amber-500/5';
                   if (estado === 'completada') return 'border-l-green-500 shadow-green-500/5';
                   if (estado === 'no_asistio') return 'border-l-rose-500 shadow-rose-500/5';
                   return 'border-l-white/10';
                 };

                 const timelineColor = (estado) => {
                   if (estado === 'pendiente' || estado === 'confirmada') return 'bg-amber-500';
                   if (estado === 'completada') return 'bg-green-500';
                   if (estado === 'no_asistio') return 'bg-rose-500';
                   return 'bg-white/20';
                 };

                 const horaBoxColor = (estado) => {
                   if (estado === 'pendiente' || estado === 'confirmada') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                   if (estado === 'completada') return 'bg-green-500/10 border-green-500/20 text-green-400';
                   if (estado === 'no_asistio') return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                   return 'bg-white/5 border-white/5 text-white/30';
                 };

                 // ── Componente de tarjeta de cita ──
                 const CitaCard = ({ cita, i, esFutura = false }) => (
                   <div
                     key={cita._id}
                     className={`glass-card-hover group overflow-hidden border-white/5 border-l-4 animate-in slide-in-from-right-8 duration-700 stagger-${(i%4)+1} ${
                       borderColor(cita.estado)
                     } ${cita.estado === 'no_asistio' || cita.estado === 'completada' ? 'opacity-70 hover:opacity-100' : ''}`}
                   >
                     <div className={`absolute top-0 left-0 w-1.5 h-full ${timelineColor(cita.estado)} opacity-0 group-hover:opacity-100 transition-all duration-700`} />
                     <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                       {/* Info lado izquierdo */}
                       <div className="flex items-center gap-6 sm:gap-10 flex-1">
                         {/* Hora */}
                         <div className={`text-center p-4 sm:p-5 rounded-[24px] min-w-[85px] border group-hover:scale-105 transition-all ${horaBoxColor(cita.estado)}`}>
                           {esFutura && (
                             <p className="text-[8px] font-anton uppercase tracking-widest mb-1 opacity-60">
                               {formatFechaSafe(cita.fecha)}
                             </p>
                           )}
                           <p className="text-[8px] font-anton uppercase tracking-widest mb-1 opacity-50">Hora</p>
                           <p className="text-xl sm:text-2xl font-anton tracking-tighter leading-none">{format12H(cita.hora)}</p>
                         </div>

                         {/* Datos cliente */}
                         <div className="flex-1 min-w-0">
                           <div className="flex flex-wrap items-center gap-3 mb-3">
                             <h3 className="text-2xl sm:text-3xl font-bebas text-white tracking-widest group-hover:text-blue-400 transition-all uppercase leading-none truncate">
                               {cita.cliente?.nombre || 'Cliente'}
                             </h3>
                             <span className={`text-[9px] font-anton px-3 py-1 rounded-xl uppercase tracking-widest border shrink-0 ${statusColor(cita.estado)}`}>
                               {cita.estado === 'no_asistio' ? 'No Asistió' : cita.estado}
                             </span>
                           </div>
                           <div className="flex flex-wrap gap-4 items-center">
                             <div className="flex items-center gap-2">
                               <span className="text-base opacity-40">✂️</span>
                               <p className="text-[11px] font-anton text-white/40 uppercase tracking-[0.2em]">{cita.servicioNombre}</p>
                             </div>
                             {cita.cliente?.telefono && (
                               <>
                                 <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                 <a
                                   href={`tel:${cita.cliente.telefono}`}
                                   className="text-[10px] font-anton text-blue-400/50 hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-2"
                                 >
                                   <span className="hover:animate-pulse">📞</span> Contactar
                                 </a>
                               </>
                             )}
                           </div>
                         </div>
                       </div>

                       {/* Acciones — depende del contexto */}
                        {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                          <div className="flex gap-4 w-full lg:w-auto shrink-0">
                            {/* Cita de HOY: Finalizar + No-Show */}
                            {!esFutura && (
                              <>
                                <button
                                  onClick={() => completarCita(cita._id)}
                                  className="flex-1 lg:flex-none bg-green-600/20 text-green-400 border border-green-500/20 hover:bg-green-600 hover:text-white px-8 py-4 text-[11px] font-anton tracking-widest rounded-2xl transition-all duration-300"
                                >
                                  ✓ FINALIZAR
                                </button>
                                <button
                                  onClick={() => marcarNoAsistio(cita._id)}
                                  className="flex-1 lg:flex-none bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white px-8 py-4 text-[11px] font-anton tracking-widest rounded-2xl transition-all duration-300"
                                >
                                  ✗ NO-SHOW
                                </button>
                              </>
                            )}
                            {/* Cita FUTURA: solo Cancelar */}
                            {esFutura && (
                              <button
                                onClick={() => cancelarCita(cita._id)}
                                className="flex-1 lg:flex-none bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white px-10 py-4 text-[11px] font-anton tracking-widest rounded-2xl transition-all duration-300"
                              >
                                ✕ CANCELAR CITA
                              </button>
                            )}
                          </div>
                        )}
                     </div>
                   </div>
                 );

                 return (
                   <section className="animate-lux-fade">
                     {/* ── STATS HOY ── */}
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-14 px-2">
                       <div className="glass-card p-6 sm:p-8 border-white/5 text-center group hover:border-blue-500/40 transition-all">
                         <p className="text-[10px] font-anton text-white/30 uppercase tracking-[0.3em] mb-3">Total Hoy</p>
                         <p className="text-4xl font-bebas text-white tracking-widest group-hover:text-blue-400 transition-colors">{citasHoy.length}</p>
                       </div>
                       <div className="glass-card p-6 sm:p-8 border-white/5 text-center group hover:border-amber-500/40 transition-all">
                         <p className="text-[10px] font-anton text-white/30 uppercase tracking-[0.3em] mb-3">Pendientes</p>
                         <p className="text-4xl font-bebas text-amber-400 tracking-widest">{pendientesHoy.length}</p>
                       </div>
                       <div className="glass-card p-6 sm:p-8 border-white/5 text-center group hover:border-green-500/40 transition-all">
                         <p className="text-[10px] font-anton text-white/30 uppercase tracking-[0.3em] mb-3">Completadas</p>
                         <p className="text-4xl font-bebas text-green-400 tracking-widest">{completadasHoy.length}</p>
                       </div>
                       <div className="glass-card p-6 sm:p-8 border-white/5 text-center group hover:border-blue-500/40 transition-all">
                         <p className="text-[10px] font-anton text-white/30 uppercase tracking-[0.3em] mb-3">Próximas</p>
                         <p className="text-4xl font-bebas text-blue-400 tracking-widest">{citasFuturas.length}</p>
                       </div>
                     </div>

                     {/* ── HEADER ── */}
                     <div className="flex justify-between items-end mb-10 px-4">
                       <div>
                         <h2 className="text-4xl font-bebas text-white tracking-widest uppercase leading-none mb-2">🔥 HOY</h2>
                         <p className="text-[10px] font-anton text-amber-400/60 uppercase tracking-widest">
                           {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                         </p>
                       </div>
                     </div>

                     {loading ? (
                       <div className="p-32 text-center bg-white/[0.01] rounded-[40px] border border-white/5 border-dashed">
                         <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-glow-blue" />
                         <p className="text-[10px] font-anton uppercase tracking-[0.4em] text-white/20">Sincronizando Agenda...</p>
                       </div>
                     ) : (
                       <div className="space-y-12">

                         {/* ──── PENDIENTES HOY ──── */}
                         <div>
                           <div className="flex items-center gap-4 mb-6 px-2">
                             <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] shrink-0" />
                             <h3 className="text-[11px] font-anton text-amber-400 uppercase tracking-[0.4em]">Pendientes de atención</h3>
                             <span className="text-[10px] font-anton text-white/20 ml-auto">{pendientesHoy.length} cita{pendientesHoy.length !== 1 ? 's' : ''}</span>
                           </div>
                           {pendientesHoy.length === 0 ? (
                             <div className="glass-card p-12 text-center border-dashed border-white/5 opacity-40">
                               <p className="font-anton text-[11px] uppercase tracking-[0.3em] text-white/40">Sin pendientes por atender</p>
                             </div>
                           ) : (
                             <div className="grid grid-cols-1 gap-6">
                               {pendientesHoy.map((cita, i) => <CitaCard key={cita._id} cita={cita} i={i} />)}
                             </div>
                           )}
                         </div>

                         {/* ──── COMPLETADAS HOY ──── */}
                         {completadasHoy.length > 0 && (
                           <div>
                             <div className="flex items-center gap-4 mb-6 px-2">
                               <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0" />
                               <h3 className="text-[11px] font-anton text-green-400 uppercase tracking-[0.4em]">Completadas hoy</h3>
                               <span className="text-[10px] font-anton text-white/20 ml-auto">{completadasHoy.length} sesión{completadasHoy.length !== 1 ? 'es' : ''}</span>
                             </div>
                             <div className="grid grid-cols-1 gap-6">
                               {completadasHoy.map((cita, i) => <CitaCard key={cita._id} cita={cita} i={i} />)}
                             </div>
                           </div>
                         )}

                         {/* ──── NO ASISTIÓ HOY ──── */}
                         {noAsistioHoy.length > 0 && (
                           <div>
                             <div className="flex items-center gap-4 mb-6 px-2">
                               <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0" />
                               <h3 className="text-[11px] font-anton text-rose-400 uppercase tracking-[0.4em]">No asistieron</h3>
                               <span className="text-[10px] font-anton text-white/20 ml-auto">{noAsistioHoy.length} inasistencia{noAsistioHoy.length !== 1 ? 's' : ''}</span>
                             </div>
                             <div className="grid grid-cols-1 gap-6">
                               {noAsistioHoy.map((cita, i) => <CitaCard key={cita._id} cita={cita} i={i} />)}
                             </div>
                           </div>
                         )}

                         {/* Mensaje si hoy no hay nada */}
                         {citasHoy.length === 0 && (
                           <div className="glass-card p-20 text-center border-dashed border-white/10 opacity-30 group hover:opacity-100 transition-opacity">
                             <div className="text-7xl mb-8 animate-float">🌬️</div>
                             <p className="font-anton text-[11px] uppercase tracking-[0.3em] text-white/50">Jornada despejada. Sin citas para hoy.</p>
                           </div>
                         )}

                         {/* ──── PRÓXIMAS CITAS ──── */}
                         {citasFuturas.length > 0 && (
                           <div className="mt-8 pt-8 border-t border-white/5">
                             <div className="flex items-center gap-4 mb-8 px-2">
                               <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] shrink-0" />
                               <h2 className="text-4xl font-bebas text-white tracking-widest uppercase leading-none">📅 Próximas Citas</h2>
                               <span className="text-[10px] font-anton text-white/20 ml-auto">{citasFuturas.length} programada{citasFuturas.length !== 1 ? 's' : ''}</span>
                             </div>
                             <div className="grid grid-cols-1 gap-6">
                               {citasFuturas.map((cita, i) => <CitaCard key={cita._id} cita={cita} i={i} esFutura={true} />)}
                             </div>
                           </div>
                         )}

                       </div>
                     )}
                   </section>
                 );
               })()}


               {/* ══ TAB: SERVICIOS ══ */}
               {tab === 'servicios' && (
                <section className="animate-lux-fade">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      <aside className="lg:col-span-1">
                        <div className="glass-card p-12 border-white/10 sticky top-28 bg-white/[0.04]">
                           <h2 className="text-4xl font-bebas text-white mb-10 tracking-[0.2em] uppercase leading-none">
                             {editandoServicio ? '✏️ Ajustar Arte' : '➕ Alta de Servicio'}
                           </h2>
                           <form onSubmit={editandoServicio ? handleEditarServicio : handleCrearServicio} className="space-y-8">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-blue-400 ml-1">Nombre Comercial</label>
                                 <input 
                                   type="text" required placeholder="EJ: FADE PREMIUM"
                                   className="input-field"
                                   value={editandoServicio ? editandoServicio.nombre : nuevoServicio.nombre}
                                   onChange={e => editandoServicio ? setEditandoServicio({...editandoServicio, nombre: e.target.value}) : setNuevoServicio({...nuevoServicio, nombre: e.target.value})}
                                 />
                              </div>
                              <div className="grid grid-cols-2 gap-8">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-blue-400 ml-1">Inversión ($)</label>
                                    <input 
                                      type="number" required placeholder="0.00"
                                      className="input-field text-center font-anton text-lg text-white bg-transparent outline-none focus:bg-white/[0.05] [color-scheme:dark]"
                                      value={editandoServicio ? editandoServicio.precio : nuevoServicio.precio}
                                      onChange={e => editandoServicio ? setEditandoServicio({...editandoServicio, precio: e.target.value}) : setNuevoServicio({...nuevoServicio, precio: e.target.value})}
                                    />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-blue-400 ml-1">Duración (min)</label>
                                    <input 
                                      type="number" required placeholder="30"
                                      className="input-field text-center font-anton text-lg text-white bg-transparent outline-none focus:bg-white/[0.05] [color-scheme:dark]"
                                      value={editandoServicio ? editandoServicio.duracion : nuevoServicio.duracion}
                                      onChange={e => editandoServicio ? setEditandoServicio({...editandoServicio, duracion: e.target.value}) : setNuevoServicio({...nuevoServicio, duracion: e.target.value})}
                                    />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-blue-400 ml-1">Galería URL</label>
                                 <input 
                                   type="text" placeholder="HTTPS://IMAGEN.JPG"
                                   className="input-field"
                                   value={editandoServicio ? editandoServicio.imagen : nuevoServicio.imagen}
                                   onChange={e => editandoServicio ? setEditandoServicio({...editandoServicio, imagen: e.target.value}) : setNuevoServicio({...nuevoServicio, imagen: e.target.value})}
                                 />
                              </div>
                              <div className="flex gap-4 pt-6">
                                 <button className="flex-1 btn-glow-blue py-5 text-[11px] uppercase font-anton tracking-widest shadow-lg active:scale-95 transition-all">
                                   {editandoServicio ? 'CONFIRMAR CAMBIOS' : 'PUBLICAR SERVICIO'}
                                 </button>
                                 {editandoServicio && (
                                   <button type="button" onClick={() => setEditandoServicio(null)} className="w-16 bg-white/5 text-white/20 rounded-2xl hover:bg-rose-500/20 hover:text-rose-500 transition-all flex items-center justify-center">✕</button>
                                 )}
                              </div>
                           </form>
                        </div>
                      </aside>

                      <section className="lg:col-span-2 space-y-12">
                         <div className="px-2">
                           <h2 className="text-4xl font-bebas text-white tracking-[0.2em] mb-2 uppercase leading-none">Galería de Creaciones</h2>
                           <p className="text-[10px] font-anton text-white/30 uppercase tracking-widest">Servicios activos en tu escaparate digital</p>
                         </div>

                         {servicios.length === 0 ? (
                           <div className="glass-card p-32 text-center border-dashed border-white/10 opacity-30">
                              <span className="text-6xl mb-8 block grayscale">✂️</span>
                              <p className="font-anton text-[11px] uppercase tracking-widest text-white/50">Tu catálogo está vacío. Comienza a registrar tus artes.</p>
                           </div>
                         ) : (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             {servicios.map((s, i) => (
                               <div key={s._id} className={`glass-card-hover group overflow-hidden border-white/5 animate-in slide-in-from-bottom-8 duration-700 stagger-${(i%4)+1}`}>
                                  <div className="h-56 overflow-hidden relative grayscale-[50%] group-hover:grayscale-0 transition-all duration-1000">
                                     <img src={s.imagen || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                     <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/95 via-dark-bg/20 to-transparent"></div>
                                     <div className="absolute top-4 right-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <button onClick={() => setEditandoServicio({...s})} className="w-10 h-10 rounded-xl bg-blue-600 shadow-glow-blue text-white flex items-center justify-center text-xs">✏️</button>
                                        <button onClick={() => handleEliminarServicio(s._id)} className="w-10 h-10 rounded-xl bg-rose-600 shadow-glow-rose text-white flex items-center justify-center text-xs">✕</button>
                                     </div>
                                  </div>
                                  <div className="p-8">
                                     <h4 className="text-3xl font-bebas text-white tracking-widest uppercase group-hover:text-blue-400 transition-colors leading-none mb-6">{s.nombre}</h4>
                                     <div className="flex justify-between items-end border-t border-white/5 pt-6">
                                        <div>
                                           <p className="text-[9px] font-anton text-white/20 uppercase tracking-[0.3em] mb-1">Precio</p>
                                           <span className="text-4xl font-anton text-white tracking-tighter shadow-glow-blue/10">${s.precio}</span>
                                        </div>
                                        <div className="text-right">
                                           <p className="text-[9px] font-anton text-white/20 uppercase tracking-[0.3em] mb-1">Sesión</p>
                                           <span className="text-[12px] font-anton text-blue-400 uppercase tracking-widest">{s.duracion} MIN</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                             ))}
                           </div>
                         )}
                      </section>
                   </div>
                </section>
               )}

               {/* ══ TAB: BLOQUEOS ══ */}
               {tab === 'bloqueos' && (
                <section className="animate-lux-fade">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                       <aside className="lg:col-span-1">
                          <div className="glass-card p-12 border-white/10 sticky top-28 bg-white/[0.04]">
                             <h2 className="text-4xl font-bebas text-white mb-10 tracking-[0.2em] uppercase leading-none">Pausa Operativa</h2>
                             <form onSubmit={handleCrearBloqueo} className="space-y-8">
                                <div className="space-y-3">
                                   <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-blue-400 ml-1">Tipo de Suspensión</label>
                                   <select 
                                     className="input-field text-dark-bg"
                                     value={nuevoBloqueo.tipo}
                                     onChange={e => setNuevoBloqueo({...nuevoBloqueo, tipo: e.target.value})}
                                   >
                                      <option value="dia_completo">Jornada Completa</option>
                                      <option value="rango_horas">Tramo Específico</option>
                                   </select>
                                </div>

                                <div className="space-y-3">
                                   <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-blue-400 ml-1">Fecha de Selección</label>
                                   <input 
                                     type="date" required
                                     className="input-field"
                                     value={nuevoBloqueo.fechaInicio}
                                     onChange={e => setNuevoBloqueo({...nuevoBloqueo, fechaInicio: e.target.value})}
                                   />
                                </div>

                                {nuevoBloqueo.tipo === 'rango_horas' && (
                                  <div className="space-y-6">
                                     <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-rose-400 ml-1">Selecciona Rango (Clic Inicio -> Clic Fin)</label>
                                     <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                        {BLOQUEO_SLOTS.map(hora => {
                                          const esInicio = nuevoBloqueo.horaInicio === hora;
                                          const esFin = nuevoBloqueo.horaFin === hora;
                                          const enRango = estaEnRango(hora);

                                          return (
                                            <button
                                              key={hora}
                                              type="button"
                                              onClick={() => seleccionarTramo(hora)}
                                              className={`
                                                py-3 rounded-xl font-anton text-[10px] transition-all duration-300 border
                                                ${esInicio || esFin 
                                                  ? 'bg-rose-600 border-rose-400 text-white shadow-glow-rose scale-105 z-10' 
                                                  : enRango 
                                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-200' 
                                                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'}
                                              `}
                                            >
                                              {hora}
                                            </button>
                                          );
                                        })}
                                     </div>
                                     
                                     <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center justify-between">
                                        <p className="text-[10px] font-anton uppercase tracking-widest text-rose-400">Tramo seleccionado</p>
                                        <p className="text-sm font-anton text-white">
                                           {nuevoBloqueo.horaInicio || '--:--'} → {nuevoBloqueo.horaFin || '--:--'}
                                        </p>
                                     </div>
                                  </div>
                                )}

                                <div className="space-y-3">
                                   <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-blue-400 ml-1">Concepto</label>
                                   <input 
                                      type="text" placeholder="EJ: FORMACIÓN TÉCNICA"
                                      className="input-field"
                                      value={nuevoBloqueo.razon}
                                      onChange={e => setNuevoBloqueo({...nuevoBloqueo, razon: e.target.value})}
                                   />
                                </div>

                                <button className="w-full btn-glow-blue py-5 text-[11px] uppercase font-anton tracking-widest mt-4">ACTIVAR RESTRICCIÓN</button>
                             </form>
                          </div>
                       </aside>

                       <div className="lg:col-span-2 space-y-12">
                          <div className="px-2">
                             <h2 className="text-4xl font-bebas text-white tracking-[0.2em] mb-2 uppercase leading-none">Estado de Disponibilidad</h2>
                             <p className="text-[10px] font-anton text-white/30 uppercase tracking-widest">Periodos de agenda cerrada</p>
                          </div>
                          
                          <div className="space-y-8">
                             {bloqueos.length === 0 ? (
                               <div className="glass-card p-32 text-center border-dashed border-white/10 opacity-30">
                                   <span className="text-6xl mb-10 block animate-lux-fade">🔓</span>
                                   <p className="font-anton text-[11px] uppercase tracking-[0.3em] text-white/50">Agenda 100% disponible. Sin bloqueos registrados.</p>
                               </div>
                             ) : bloqueos.map((b, i) => (
                               <div key={b._id} className={`glass-card-hover group overflow-hidden border-white/5 bg-white/[0.02] flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-10 gap-6 stagger-${(i%4)+1}`}>
                                  <div className="flex items-center gap-6 md:gap-10 w-full">
                                     <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-500/10 text-amber-500 rounded-[24px] md:rounded-[30px] flex items-center justify-center text-3xl md:text-4xl border border-amber-500/20 shadow-glow-rose/10 group-hover:scale-110 transition-transform duration-700">⚠️</div>
                                     <div className="flex-1">
                                        <h3 className="text-2xl md:text-3xl font-bebas text-white tracking-[0.2em] uppercase leading-none mb-3 md:mb-4 group-hover:text-amber-400 transition-colors">{b.razon || 'Suspensión de Actividad'}</h3>
                                        <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                           <div className="flex items-center gap-2">
                                              <span className="text-white/20 text-xs">📅</span>
                                              <span className="text-[10px] md:text-[11px] font-anton text-white/40 uppercase tracking-widest">{formatFechaSafe(b.fechaInicio)}</span>
                                           </div>
                                           <span className="hidden md:block w-2 h-2 rounded-full bg-white/10"></span>
                                           <div className="flex items-center gap-2">
                                              <span className="text-white/20 text-xs">⏰</span>
                                              <span className="text-[10px] md:text-[11px] font-anton text-amber-500 uppercase tracking-widest font-bold">
                                                 {b.tipo === 'dia_completo' ? 'Jornada Completa' : `${format12H(b.horaInicio)} - ${format12H(b.horaFin)}`}
                                              </span>
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleEliminarBloqueo(b._id); }}
                                    className="w-full md:w-14 h-12 md:h-14 bg-rose-600/90 text-white rounded-2xl hover:bg-rose-700 flex items-center justify-center border border-white/10 transition-all shadow-glow-rose z-50 cursor-pointer relative"
                                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                  >
                                    <span className="md:hidden mr-2 font-anton tracking-widest">ELIMINAR BLOQUEO</span> ✕
                                  </button>
                               </div>
                             ))}
                          </div>
                       </div>
                   </div>
                </section>
               )}

               {/* ══ TAB: INGRESOS ══ */}
               {tab === 'ingresos' && (
                <section className="animate-lux-fade">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-16">
                     <div className="glass-card p-12 bg-gradient-to-br from-green-600/10 via-transparent to-transparent border-green-500/20 shadow-glow-green/10 group hover:border-green-400/30">
                        <div className="flex justify-between items-start mb-10">
                           <p className="text-[11px] font-anton text-green-400 uppercase tracking-[0.4em]">Balance Global</p>
                           <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-125 transition-transform duration-700">💰</div>
                        </div>
                        <h3 className="text-7xl font-anton tracking-tighter text-white drop-shadow-glow-green/20 mb-10">${ingresos.total.toLocaleString()}</h3>
                        <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                           <span className="text-green-400">✓</span>
                           <p className="text-[10px] font-anton uppercase tracking-[0.2em] text-white/40">Fondos auditados y disponibles</p>
                        </div>
                     </div>
                     <div className="glass-card p-12 border-white/10 bg-white/[0.02] group hover:border-blue-500/30 transition-all">
                        <div className="flex justify-between items-start mb-10">
                           <p className="text-[11px] font-anton text-white/40 uppercase tracking-[0.4em]">Productividad Mes</p>
                           <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-125 transition-transform duration-700">📊</div>
                        </div>
                        <h3 className="text-7xl font-bebas tracking-widest text-white mb-10">${ingresos.mes.toLocaleString()}</h3>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                           <div className="h-full bg-blue-600 shadow-glow-blue w-[75%] animate-pulse"></div>
                        </div>
                     </div>
                  </div>

                  <div className="glass-card overflow-hidden border-white/5 bg-white/[0.01]">
                     <div className="p-12 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div>
                           <h2 className="text-4xl font-bebas text-white tracking-[0.2em] uppercase leading-none mb-2">Libro de Sesiones</h2>
                           <p className="text-[10px] font-anton text-white/30 uppercase tracking-widest">Historial completo de servicios liquidados</p>
                        </div>
                        <div className="relative group w-full lg:w-96">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 uppercase font-anton text-[9px] tracking-widest group-focus-within:text-blue-400 transition-colors">Filtrar</span>
                           <input 
                             type="text" 
                             placeholder="BUSCAR SOCIO O ARTE..." 
                             className="input-field pl-20"
                             value={filtroHistorial}
                             onChange={(e) => setFiltroHistorial(e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                           <thead className="bg-white/5 text-[11px] font-anton uppercase text-white/20 tracking-[0.3em]">
                              <tr>
                                 <th className="px-12 py-8 font-normal">Socio / Cliente</th>
                                 <th className="px-12 py-8 font-normal">Creación Realizada</th>
                                 <th className="px-12 py-8 font-normal">Cronología</th>
                                 <th className="px-12 py-8 text-right font-normal">Monto</th>
                                 <th className="px-12 py-8 text-center font-normal">Estatus</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5 text-white/80 font-oswald text-sm">
                              {historialCortes.filter(h => {
                                 if (!filtroHistorial) return true;
                                 const f = filtroHistorial.toLowerCase();
                                 const fechaLocal = formatFechaSafe(h.fecha);
                                 return (h.cliente?.nombre || '').toLowerCase().includes(f) ||
                                        (h.servicioNombre || '').toLowerCase().includes(f) ||
                                        fechaLocal.includes(f);
                              }).length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="px-12 py-32 text-center text-white/10 font-anton uppercase tracking-[0.4em] text-xs grayscale">Sin registros financieros</td>
                                </tr>
                              ) : historialCortes.filter(h => {
                                 if (!filtroHistorial) return true;
                                 const f = filtroHistorial.toLowerCase();
                                 const fechaLocal = formatFechaSafe(h.fecha);
                                 return (h.cliente?.nombre || '').toLowerCase().includes(f) ||
                                        (h.servicioNombre || '').toLowerCase().includes(f) ||
                                        fechaLocal.includes(f);
                              }).map((h, i) => (
                                <tr key={h._id} className={`hover:bg-white/[0.03] transition-all duration-300 group animate-lux-fade stagger-${(i%4)+1}`}>
                                   <td className="px-12 py-8">
                                      <p className="font-anton text-white uppercase tracking-wider text-base group-hover:text-blue-400 transition-colors">{h.cliente?.nombre}</p>
                                      <p className="text-[10px] text-white/30 font-anton mt-1 uppercase tracking-widest">{h.cliente?.telefono}</p>
                                   </td>
                                   <td className="px-12 py-8">
                                      <span className="font-anton text-[10px] text-blue-400 uppercase tracking-[0.2em] border border-blue-500/20 px-4 py-2 rounded-2xl bg-blue-500/5">{h.servicioNombre}</span>
                                   </td>
                                   <td className="px-12 py-8">
                                      <p className="text-white/60 uppercase text-xs tracking-widest">{formatFechaSafe(h.fecha)}</p>
                                      <p className="text-[10px] font-anton text-white/20 uppercase tracking-tighter mt-1">{h.hora}</p>
                                   </td>
                                   <td className="px-12 py-8 text-right">
                                      <span className="text-2xl font-anton text-white tracking-tighter shadow-glow-blue/5">${h.precio}</span>
                                   </td>
                                   <td className="px-12 py-8 text-center">
                                      <span className={`text-[9px] font-anton uppercase tracking-widest px-5 py-2.5 rounded-2xl border ${statusColor(h.estado)}`}>
                                         {h.estado}
                                      </span>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                </section>
               )}

               {/* ══ TAB: DISEÑO ══ */}
               {tab === 'configuracion' && (
                <section className="animate-lux-fade">
                   <div className="glass-card p-16 border-white/10 bg-white/[0.03] max-w-3xl mx-auto text-center relative overflow-hidden">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/5 blur-[100px] pointer-events-none"></div>
                     <div className="w-24 h-24 bg-blue-600/20 text-blue-400 rounded-full mx-auto flex items-center justify-center text-5xl mb-12 border border-blue-500/30 shadow-glow-blue animate-float relative z-10">🎨</div>
                     <h2 className="text-5xl font-bebas text-white tracking-[0.3em] mb-4 uppercase leading-none">Identidad de Marca</h2>
                     <p className="text-[11px] font-oswald text-white/30 uppercase tracking-[0.5em] mb-16">Personalización del ecosistema visual</p>
                     
                     <form onSubmit={handleGuardarConfiguracion} className="space-y-12 text-left relative z-10">
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                           <div className="space-y-5">
                             <label className="text-[11px] font-anton uppercase tracking-[0.4em] text-blue-400 ml-1">Tono Primario</label>
                             <div className="flex items-center gap-8 glass-card p-6 border-white/10 bg-white/[0.02]">
                               <input type="color" name="colorPrimario" defaultValue={negocio?.configuracionVisual?.colorPrimario || "#4f46e5"} className="w-20 h-20 rounded-2xl cursor-pointer bg-transparent border-0" />
                               <p className="text-[10px] font-anton text-white/30 uppercase leading-relaxed tracking-widest">Botones y Acentos</p>
                             </div>
                           </div>

                           <div className="space-y-5">
                             <label className="text-[11px] font-anton uppercase tracking-[0.4em] text-blue-400 ml-1">Tono Secundario</label>
                             <div className="flex items-center gap-8 glass-card p-6 border-white/10 bg-white/[0.02]">
                               <input type="color" name="colorSecundario" defaultValue={negocio?.configuracionVisual?.colorSecundario || "#0f172a"} className="w-20 h-20 rounded-2xl cursor-pointer bg-transparent border-0" />
                               <p className="text-[10px] font-anton text-white/30 uppercase leading-relaxed tracking-widest">Fondos y Sombras</p>
                             </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[11px] font-anton uppercase tracking-[0.4em] text-blue-400 ml-1">Firma / Logotipo (URL)</label>
                          <input type="url" name="logo" defaultValue={negocio?.configuracionVisual?.logo || ""} placeholder="HTTPS://BARBERHOUSE.COM/LOGO.PNG" className="input-field" />
                        </div>

                        <div className="space-y-4">
                          <label className="text-[11px] font-anton uppercase tracking-[0.4em] text-blue-400 ml-1">Atmósfera / Fondo (URL)</label>
                          <input type="url" name="fondo" defaultValue={negocio?.configuracionVisual?.fondo || ""} placeholder="HTTPS://BARBERHOUSE.COM/BG.JPG" className="input-field" />
                        </div>

                        <button className="w-full btn-glow-blue py-7 text-xs uppercase font-anton tracking-[0.4em] mt-8 shadow-2xl active:scale-95 transition-all">
                           ACTUALIZAR ADN VISUAL
                        </button>
                     </form>
                   </div>
                </section>
               )}
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
