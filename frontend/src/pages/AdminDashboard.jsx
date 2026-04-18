import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { adminAPI, negociosAPI } from '../services/api';
import { conectarSocket, desconectarSocket } from '../services/socketService';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const [tab, setTab] = useState('resumen');
  const [peluqueros, setPeluqueros] = useState([]);
  const [citas, setCitas] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Negocios state ────────────────────────────
  const [negocios, setNegocios] = useState([]);
  const [editandoNegocio, setEditandoNegocio] = useState(null);
  const [nuevoNegocio, setNuevoNegocio] = useState({ nombre: '', slug: '', email: '', estado: 'activo' });
  const [showFormNegocio, setShowFormNegocio] = useState(false);

  // ── Clientes state ────────────────────────────
  const [gruposClientes, setGruposClientes] = useState([]);
  const [filtroNegocioId, setFiltroNegocioId] = useState('');

  // ── Peluqueros state ──────────────────────────
  const [nuevoPeluquero, setNuevoPeluquero] = useState({ nombre: '', email: '', telefono: '', contraseña: '', negocioId: '' });

  useEffect(() => {
    cargarDatos();
    const socket = conectarSocket();
    const refrescar = () => cargarDatos();
    socket.on('nueva-reserva', refrescar);
    socket.on('reserva-cancelada', refrescar);
    return () => {
      socket.off('nueva-reserva', refrescar);
      socket.off('reserva-cancelada', refrescar);
      desconectarSocket();
    };
  }, [tab, filtroNegocioId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (tab === 'resumen') {
        const res = await adminAPI.obtenerEstadisticas();
        setStats(res.data);
      } else if (tab === 'peluqueros') {
        const [resPel, resNeg] = await Promise.all([
          adminAPI.obtenerPeluqueros(),
          negociosAPI.obtenerTodos()
        ]);
        setPeluqueros(resPel.data.peluqueros);
        setNegocios(resNeg.data.negocios);
      } else if (tab === 'citas') {
        const res = await adminAPI.obtenerTodasLasCitas();
        setCitas(res.data.citas);
      } else if (tab === 'negocios') {
        const res = await negociosAPI.obtenerTodos();
        setNegocios(res.data.negocios);
      } else if (tab === 'clientes') {
        const [resClientes, resNegocios] = await Promise.all([
          adminAPI.obtenerClientes(filtroNegocioId || undefined),
          negociosAPI.obtenerTodos()
        ]);
        setGruposClientes(resClientes.data.grupos);
        setNegocios(resNegocios.data.negocios);
      }
    } catch (error) {
      toast.error('Error cargando panel administrativo');
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers Peluqueros ───────────────────────
  const handleCrearPeluquero = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.crearPeluquero(nuevoPeluquero);
      toast.success('Peluquero creado y activo');
      setNuevoPeluquero({ nombre: '', email: '', telefono: '', contraseña: '', negocioId: '' });
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear');
    }
  };

  const toggleEstadoPeluquero = async (id, estadoActual) => {
    try {
      if (estadoActual === 'activo') {
        await adminAPI.bloquearPeluquero(id, 'Desactivado por administración');
      } else {
        await adminAPI.desbloquearPeluquero(id);
      }
      toast.success('Estado actualizado ✓');
      cargarDatos();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleCambioNegocio = async (peluqueroId, negocioId) => {
    try {
      await adminAPI.asignarNegocio(peluqueroId, negocioId || null);
      toast.success('Negocio reasignado ✓');
      cargarDatos();
    } catch (error) {
      toast.error('Error al reasignar negocio');
    }
  };

  // ── Handlers Negocios ─────────────────────────
  const handleCrearNegocio = async (e) => {
    e.preventDefault();
    try {
      await negociosAPI.crear(nuevoNegocio);
      toast.success('Negocio creado ✓');
      setNuevoNegocio({ nombre: '', slug: '', email: '', estado: 'activo' });
      setShowFormNegocio(false);
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear negocio');
    }
  };

  const handleEditarNegocio = async (e) => {
    e.preventDefault();
    try {
      await negociosAPI.editar(editandoNegocio._id, editandoNegocio);
      toast.success('Negocio actualizado ✓');
      setEditandoNegocio(null);
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const handleToggleNegocio = async (id, estadoActual) => {
    try {
      await negociosAPI.toggleEstado(id);
      toast.success(`Negocio ${estadoActual === 'activo' ? 'desactivado' : 'activado'} ✓`);
      cargarDatos();
    } catch (err) {
      toast.error('Error al cambiar estado del negocio');
    }
  };

  const handleEliminarNegocio = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await negociosAPI.eliminar(id);
      toast.success('Negocio eliminado');
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const copiarLink = (slug) => {
    const url = `${window.location.origin}/?negocio=${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado al portapapeles 📋');
  };

  // ── Agrupar citas ─────────────────────────────
  const citasAgrupadas = citas.reduce((acc, c) => {
    const f = new Date(c.fecha);
    const fechaFormat = new Date(f.getTime() + f.getTimezoneOffset() * 60000)
      .toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const pel = c.peluquero?.nombre || 'General';
    if (!acc[fechaFormat]) acc[fechaFormat] = {};
    if (!acc[fechaFormat][pel]) acc[fechaFormat][pel] = [];
    acc[fechaFormat][pel].push(c);
    return acc;
  }, {});

  const fechasOrdenadas = Object.keys(citasAgrupadas).sort((a, b) => {
    const [d1, m1, y1] = a.split('/');
    const [d2, m2, y2] = b.split('/');
    return new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1);
  });

  const TABS = [
    { key: 'resumen',    label: '📊 Global' },
    { key: 'negocios',   label: '🏪 Sucursales' },
    { key: 'peluqueros', label: '💈 Equipo' },
    { key: 'clientes',   label: '👤 Socios' },
    { key: 'citas',      label: '📅 Registro' },
  ];

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-oswald text-white">
      <Header />
      
      <main className="flex-grow pb-24">
        {/* Hero Admin ULTRA LUX */}
        <div className="relative overflow-hidden pt-16 pb-28 px-6">
           <div className="absolute top-0 right-1/4 translate-x-1/2 w-[700px] h-[700px] bg-indigo-600/10 blur-[180px] rounded-full animate-pulse"></div>
           <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-16 relative z-10 animate-lux-fade">
              <div className="text-center lg:text-left">
                <h1 className="text-7xl font-bebas tracking-tighter text-white uppercase drop-shadow-glow-blue leading-none mb-4">Mando Central <span className="text-indigo-400">SaaS</span></h1>
                <p className="text-white/40 font-anton text-xs uppercase tracking-[0.6em] mb-2 leading-relaxed">Ecosistema Global de Negocios Barber <br/> <span className="text-[10px] text-indigo-500/40 opacity-100">Full Cloud Synchronization</span></p>
              </div>
              
              <div className="glass-card p-2 flex flex-wrap gap-2 border-white/10 bg-white/[0.03] backdrop-blur-[30px] rounded-[36px] shadow-2xl">
                {TABS.map(t => (
                  <button 
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-10 py-4 rounded-3xl font-anton text-[10px] uppercase tracking-widest transition-all duration-500 ${tab === t.key ? 'bg-indigo-600/90 text-white shadow-glow-blue border border-indigo-400/50' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
           </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20">

           {/* ══ TAB: RESUMEN ══ */}
           {tab === 'resumen' && (
             <div className="animate-lux-fade space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <StatCard title="Ganancia Consolidada" val={`$${stats?.ingresos?.toLocaleString() || 0}`} icon="💰" sub="Procesado en toda la red" glow="green" />
                   <StatCard title="Recurso Humano" val={stats?.peluqueros?.total || 0} icon="💈" sub={`${stats?.peluqueros?.activos} talentos activos`} glow="indigo" />
                   <StatCard title="Impacto Semanal" val={stats?.reservas?.total || 0} icon="📅" sub={`${stats?.reservas?.completadas} sesiones cerradas`} glow="blue" />
                </div>

                <div className="glass-card p-16 overflow-hidden flex flex-col lg:flex-row items-center gap-16 border-white/10 group bg-white/[0.02] hover:bg-white/[0.04]">
                   <div className="flex-1 text-center lg:text-left">
                      <h2 className="text-5xl font-bebas text-white tracking-[0.3em] mb-8 uppercase leading-tight">Escalabilidad de Red <br/> <span className="text-indigo-500">Activa 🚀</span></h2>
                      <p className="text-white/40 font-oswald text-sm uppercase tracking-widest leading-relaxed mb-12 max-w-2xl">Control de rendimiento multi-tenant habilitado. Optimiza la distribución de carga y visualiza el crecimiento orgánico de cada sucursal en tiempo real.</p>
                      <div className="flex gap-8 justify-center lg:justify-start">
                         <button onClick={() => setTab('negocios')} className="btn-glow-blue px-12 py-5 text-[11px] uppercase font-anton tracking-[0.3em]">Nodos Operativos</button>
                         <button onClick={() => setTab('peluqueros')} className="bg-white/5 border border-white/10 text-white/40 hover:text-white px-12 py-5 rounded-2xl text-[11px] uppercase font-anton tracking-[0.3em] transition-all">Capital Humano</button>
                      </div>
                   </div>
                   <div className="w-80 h-80 bg-indigo-600/10 rounded-[60px] border border-white/5 flex items-center justify-center text-8xl shadow-inner group-hover:scale-110 transition-transform duration-1000 animate-float">📈</div>
                </div>
             </div>
           )}

           {/* ══ TAB: NEGOCIOS ══ */}
           {tab === 'negocios' && (
             <div className="animate-lux-fade space-y-12">
                
                {editandoNegocio && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/90 backdrop-blur-3xl p-4">
                     <div className="glass-card p-16 w-full max-w-lg border-white/10 shadow-glow-blue/20 border-indigo-500/30">
                        <h3 className="text-4xl font-bebas text-white mb-10 tracking-[0.3em] uppercase leading-none">Ajustar Nodo SaaS</h3>
                        <form onSubmit={handleEditarNegocio} className="space-y-8">
                           <input type="text" required placeholder="Nombre Comercial" value={editandoNegocio.nombre}
                             onChange={e => setEditandoNegocio({ ...editandoNegocio, nombre: e.target.value })}
                             className="input-field" />
                           <input type="text" placeholder="Slug de Acceso" value={editandoNegocio.slug}
                             onChange={e => setEditandoNegocio({ ...editandoNegocio, slug: e.target.value })}
                             className="input-field" />
                           <input type="email" placeholder="Email Master" value={editandoNegocio.email || ''}
                             onChange={e => setEditandoNegocio({ ...editandoNegocio, email: e.target.value })}
                             className="input-field" />
                           <select value={editandoNegocio.estado}
                             onChange={e => setEditandoNegocio({ ...editandoNegocio, estado: e.target.value })}
                             className="input-field text-dark-bg">
                             <option value="activo">Operativo</option>
                             <option value="inactivo">Suspendido</option>
                           </select>
                           <div className="flex gap-6 pt-6 font-anton">
                             <button type="submit" className="flex-1 btn-glow-blue py-5 text-[11px] tracking-widest uppercase shadow-2xl">CONFIRMAR</button>
                             <button type="button" onClick={() => setEditandoNegocio(null)} className="flex-1 bg-white/5 text-white/40 rounded-2xl py-5 text-[11px] tracking-widest uppercase">DESCARTAR</button>
                           </div>
                        </form>
                     </div>
                  </div>
                )}

                <div className="glass-card p-12 border-white/5 bg-white/[0.03]">
                   <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-12">
                      <div>
                        <h2 className="text-4xl font-bebas text-white tracking-[0.2em] uppercase leading-none mb-2">🏪 Catálogo de Sucursales</h2>
                        <p className="text-[10px] font-anton text-white/30 uppercase tracking-widest">Despliegue y monitorización de puntos de venta</p>
                      </div>
                      <button onClick={() => setShowFormNegocio(!showFormNegocio)}
                        className="btn-glow-blue px-12 py-4 rounded-2xl text-[11px] uppercase font-anton tracking-widest shadow-2xl">
                        {showFormNegocio ? '✕ Cancelar Operación' : '＋ Desplegar Nueva Unidad'}
                      </button>
                   </div>
                   {showFormNegocio && (
                     <form onSubmit={handleCrearNegocio} className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-12 border-t border-white/5 animate-in slide-in-from-bottom-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-indigo-400 ml-1">Identidad Comercial</label>
                           <input type="text" required placeholder="BARBER LUX" value={nuevoNegocio.nombre}
                             onChange={e => setNuevoNegocio({ ...nuevoNegocio, nombre: e.target.value })}
                             className="input-field" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-indigo-400 ml-1">Slug de Red</label>
                           <input type="text" required placeholder="barber-lux" value={nuevoNegocio.slug}
                             onChange={e => setNuevoNegocio({ ...nuevoNegocio, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                             className="input-field" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-indigo-400 ml-1">Email Administrativo</label>
                           <input type="email" placeholder="ADMIN@LUX.COM" value={nuevoNegocio.email}
                             onChange={e => setNuevoNegocio({ ...nuevoNegocio, email: e.target.value })}
                             className="input-field" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-indigo-400 ml-1">Estatus Inicial</label>
                           <select value={nuevoNegocio.estado}
                             onChange={e => setNuevoNegocio({ ...nuevoNegocio, estado: e.target.value })}
                             className="input-field text-dark-bg">
                             <option value="activo">Operativo Instantáneo</option>
                             <option value="inactivo">En Pausa de Despliegue</option>
                           </select>
                        </div>
                        <div className="sm:col-span-2 pt-8">
                          <button type="submit" className="w-full btn-glow-blue py-6 text-xs uppercase font-anton tracking-[0.3em] shadow-2xl">EJECUTAR ALTA DE UNIDAD</button>
                        </div>
                     </form>
                   )}
                </div>

                <div className="glass-card overflow-hidden border-white/5 bg-white/[0.01]">
                   <div className="overflow-x-auto">
                      <table className="w-full whitespace-nowrap">
                         <thead className="bg-white/5 text-white/20 text-[11px] uppercase font-anton tracking-[0.3em]">
                            <tr>
                               <th className="px-12 py-8 text-left font-normal">Sucursal / Nodo</th>
                               <th className="px-12 py-8 text-left font-normal">Acceso Público</th>
                               <th className="px-12 py-8 text-center font-normal">Equipo</th>
                               <th className="px-12 py-8 text-center font-normal">Estado</th>
                               <th className="px-12 py-8 text-right font-normal">Gestión</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5 text-white/80 font-oswald text-sm">
                            {loading ? (
                              <tr><td colSpan="5" className="px-12 py-32 text-center grayscale opacity-50">
                                 <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-8 rounded-full shadow-glow-blue"></div>
                                 <p className="text-[11px] font-anton uppercase tracking-[0.5em] text-white/20">Sincronizando Nodos Centrales...</p>
                              </td></tr>
                            ) : negocios.length === 0 ? (
                              <tr><td colSpan="5" className="px-12 py-32 text-center text-white/10 font-anton uppercase tracking-[0.4em] italic">Red en blanco</td></tr>
                            ) : negocios.map((n, i) => (
                              <tr key={n._id} className={`hover:bg-white/[0.03] transition-all duration-300 group animate-lux-fade stagger-${(i%4)+1}`}>
                                 <td className="px-12 py-8">
                                    <div className="flex items-center gap-6">
                                       <div className="w-16 h-16 bg-indigo-600/10 text-indigo-400 rounded-3xl flex items-center justify-center text-3xl border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-glow-blue/5">🏪</div>
                                       <div>
                                          <p className="font-anton text-white uppercase tracking-[0.1em] text-lg mb-1 group-hover:text-indigo-400 transition-colors">{n.nombre}</p>
                                          <p className="text-[11px] text-white/30 font-anton uppercase tracking-widest">{n.email || 'Admin general'}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-12 py-8">
                                    <div className="flex items-center gap-6">
                                       <code className="text-[11px] bg-white/5 px-4 py-2 rounded-xl font-anton text-indigo-400 border border-white/5">LUX://{n.slug}</code>
                                       <button onClick={() => copiarLink(n.slug)} 
                                         className="text-white/20 hover:text-white transition-colors text-lg" title="Copiar URL">📋</button>
                                    </div>
                                 </td>
                                 <td className="px-12 py-8 text-center">
                                    <span className="font-anton text-2xl text-white/60 drop-shadow-glow-blue/10">{n.totalPeluqueros}</span>
                                 </td>
                                 <td className="px-12 py-8 text-center">
                                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-anton uppercase tracking-widest border ${n.estado === 'activo' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-glow-green/10' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-glow-rose/10'}`}>{n.estado}</span>
                                 </td>
                                 <td className="px-12 py-8 text-right">
                                    <div className="flex items-center justify-end gap-4 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                       <button onClick={() => handleToggleNegocio(n._id, n.estado)}
                                         className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${n.estado === 'activo' ? 'text-amber-500 border-amber-500/20 hover:bg-amber-500/10' : 'text-green-500 border-green-500/20 hover:bg-green-500/10'}`} title={n.estado === 'activo' ? 'Pausar' : 'Activar'}>
                                         {n.estado === 'activo' ? '⏸️' : '▶️'}
                                       </button>
                                       <button onClick={() => setEditandoNegocio({ ...n })}
                                         className="w-12 h-12 rounded-2xl border border-white/10 text-white/20 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-500/30 flex items-center justify-center transition-all shadow-lg">✏️</button>
                                       <button onClick={() => handleEliminarNegocio(n._id, n.nombre)}
                                         className="w-12 h-12 rounded-2xl border border-rose-500/20 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all shadow-lg font-bold">✕</button>
                                    </div>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
           )}

           {/* ══ TAB: PELUQUEROS ══ */}
           {tab === 'peluqueros' && (
             <div className="animate-lux-fade space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                   <aside className="lg:col-span-1">
                      <div className="glass-card p-12 border-white/10 sticky top-28 bg-white/[0.03]">
                         <h2 className="text-4xl font-bebas text-white mb-10 tracking-[0.2em] uppercase leading-none">⚡ Fichaje</h2>
                         <form onSubmit={handleCrearPeluquero} className="space-y-8">
                            <div className="space-y-3">
                               <label className="text-[10px] font-anton text-indigo-400 uppercase tracking-widest ml-1">Nombre Escénico</label>
                               <input type="text" required placeholder="FADE MASTER"
                                 className="input-field"
                                 value={nuevoPeluquero.nombre} onChange={e => setNuevoPeluquero({ ...nuevoPeluquero, nombre: e.target.value })} />
                            </div>
                            <input type="email" required placeholder="ACCESO EMAIL"
                              className="input-field"
                              value={nuevoPeluquero.email} onChange={e => setNuevoPeluquero({ ...nuevoPeluquero, email: e.target.value })} />
                            <input type="tel" required placeholder="CONTACTO"
                              className="input-field"
                              value={nuevoPeluquero.telefono} onChange={e => setNuevoPeluquero({ ...nuevoPeluquero, telefono: e.target.value })} />
                            <input type="password" required placeholder="CONTRASEÑA"
                              className="input-field"
                              value={nuevoPeluquero.contraseña} onChange={e => setNuevoPeluquero({ ...nuevoPeluquero, contraseña: e.target.value })} />
                            
                            <div className="space-y-3">
                               <label className="text-[10px] font-anton text-indigo-400 uppercase tracking-widest ml-1">Nodo de Destino</label>
                               <select 
                                 className="input-field text-dark-bg"
                                 value={nuevoPeluquero.negocioId}
                                 onChange={e => setNuevoPeluquero({ ...nuevoPeluquero, negocioId: e.target.value })}
                               >
                                 <option value="">Global / Master</option>
                                 {negocios.map(n => (
                                   <option key={n._id} value={n._id}>{n.nombre}</option>
                                 ))}
                               </select>
                            </div>

                            <button className="w-full btn-glow-blue py-6 text-[11px] uppercase font-anton tracking-widest mt-4 shadow-2xl">VINCULAR TALENTO</button>
                         </form>
                      </div>
                   </aside>
                   <section className="lg:col-span-3">
                      <div className="glass-card overflow-hidden border-white/10">
                         <div className="p-12 border-b border-white/5">
                            <h2 className="text-4xl font-bebas text-white tracking-[0.2em] uppercase">💈 Staff de Especialistas</h2>
                            <p className="text-[10px] font-anton text-white/30 uppercase tracking-widest">Gestión de permisos y asignaciones operativas</p>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap">
                               <thead className="bg-white/5 text-white/20 text-[11px] uppercase font-anton tracking-[0.3em]">
                                  <tr>
                                     <th className="px-12 py-8 text-left font-normal">Artista / Perfil</th>
                                     <th className="px-12 py-8 text-left font-normal">Unidad de Enlace</th>
                                     <th className="px-12 py-8 text-center font-normal">Estatus</th>
                                     <th className="px-12 py-8 text-right font-normal">Acción</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-white/5 text-white/80 font-oswald text-sm">
                                  {peluqueros.map((p, i) => (
                                    <tr key={p._id} className={`hover:bg-white/[0.03] transition-all duration-300 group animate-lux-fade stagger-${(i%4)+1}`}>
                                       <td className="px-12 py-8">
                                          <div className="flex items-center gap-6">
                                             <div className="w-16 h-16 bg-blue-600/10 text-blue-400 rounded-3xl flex items-center justify-center text-3xl border border-blue-500/20 shadow-glow-blue/5">🧔</div>
                                             <div>
                                                <p className="font-anton text-white uppercase tracking-[0.1em] text-lg mb-1 group-hover:text-blue-400 transition-colors">{p.nombre}</p>
                                                <p className="text-[11px] font-anton text-white/30 uppercase tracking-widest">{p.email}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-12 py-8">
                                          <select 
                                            className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl font-anton text-[10px] text-indigo-400 uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                                            value={p.negocioId?._id || ''}
                                            onChange={(e) => handleCambioNegocio(p._id, e.target.value)}
                                          >
                                            <option value="" className="text-dark-bg">Desvinculado</option>
                                            {negocios.map(n => (
                                              <option key={n._id} value={n._id} className="text-dark-bg">{n.nombre}</option>
                                            ))}
                                          </select>
                                          {p.negocioId?.nombre && (
                                            <p className="text-[9px] font-anton text-indigo-500/40 mt-3 uppercase tracking-tighter italic">
                                               Base: {p.negocioId.nombre}
                                            </p>
                                          )}
                                       </td>
                                       <td className="px-12 py-8 text-center">
                                          <span className={`px-5 py-2 rounded-2xl text-[10px] font-anton uppercase tracking-widest border ${p.estado === 'activo' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-glow-green/10' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-glow-rose/10'}`}>{p.estado}</span>
                                       </td>
                                       <td className="px-12 py-8 text-right">
                                          <button onClick={() => toggleEstadoPeluquero(p._id, p.estado)}
                                            className={`px-8 py-3 rounded-2xl text-[10px] font-anton uppercase tracking-widest transition-all ${p.estado === 'activo' ? 'text-rose-500 border border-rose-500/20 hover:bg-rose-500/10' : 'btn-glow-blue'}`}>
                                            {p.estado === 'activo' ? 'Suspender' : 'Habilitar'}
                                          </button>
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
           )}

           {/* ══ TAB: CLIENTES ══ */}
           {tab === 'clientes' && (
             <div className="animate-lux-fade space-y-12">
                <div className="glass-card p-12 border-white/5 bg-white/[0.03]">
                   <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
                      <div>
                        <h2 className="text-4xl font-bebas text-white tracking-[0.2em] uppercase leading-none mb-2">👤 Inteligencia de Socios</h2>
                        <p className="text-[10px] font-anton text-white/30 uppercase tracking-widest">Base de datos centralizada de clientes por nodo</p>
                      </div>
                      <div className="flex items-center gap-6 bg-white/[0.02] p-2 rounded-3xl border border-white/5">
                         <span className="text-[10px] font-anton text-white/20 uppercase tracking-widest ml-6">Sucursal Destino:</span>
                         <select value={filtroNegocioId} onChange={e => setFiltroNegocioId(e.target.value)}
                           className="p-4 bg-dark-bg/40 border border-white/10 rounded-2xl outline-none focus:border-indigo-500 font-anton text-[10px] uppercase tracking-widest text-indigo-400 shadow-inner">
                           <option value="" className="text-dark-bg">Ecosistema Completo</option>
                           {negocios.map(n => (
                             <option key={n._id} value={n._id} className="text-dark-bg">{n.nombre}</option>
                           ))}
                         </select>
                      </div>
                   </div>
                </div>

                {loading ? (
                  <div className="p-32 text-center opacity-50 italic animate-pulse">
                     <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-10 shadow-glow-blue"></div>
                     <p className="font-anton text-[11px] uppercase tracking-[0.6em] text-white/20">Accediendo a la Capa de Datos...</p>
                  </div>
                ) : gruposClientes.length === 0 ? (
                  <div className="glass-card p-32 text-center border-dashed border-white/10 grayscale opacity-40">
                     <div className="text-7xl mb-10 block animate-float">👥</div>
                     <p className="font-anton text-[11px] uppercase tracking-[0.3em] text-white/50">Base de datos desierta para este nodo.</p>
                  </div>
                ) : gruposClientes.map(grupo => (
                  <div key={grupo.negocio._id} className="glass-card overflow-hidden border-white/10 bg-white/[0.02] animate-in slide-in-from-bottom-12 duration-1000">
                     <div className="p-10 bg-indigo-600/[0.05] border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                           <span className="text-4xl drop-shadow-glow-blue/40">🏪</span>
                           <div>
                              <h3 className="font-bebas text-white text-3xl tracking-[0.2em] uppercase leading-none group-hover:text-indigo-400 transition-colors">{grupo.negocio.nombre}</h3>
                              <code className="text-[10px] text-indigo-400/50 font-anton uppercase tracking-widest mt-2 block">HASH_CORE: {grupo.negocio._id.slice(-8)}</code>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="bg-indigo-600/20 text-indigo-400 px-6 py-3 rounded-2xl text-[10px] font-anton uppercase tracking-widest border border-indigo-500/20 shadow-glow-blue/20">
                              {grupo.clientes.length} SOCIOS ACTIVOS
                           </span>
                        </div>
                     </div>
                     <div className="divide-y divide-white/5 bg-dark-bg/20">
                        {grupo.clientes.map((cliente, idx) => (
                          <div key={idx} className={`px-12 py-8 flex items-center justify-between hover:bg-white/[0.03] transition-all duration-300 group stagger-${(idx%4)+1}`}>
                             <div className="flex items-center gap-8">
                                <div className="w-14 h-14 bg-white/[0.03] rounded-[24px] flex items-center justify-center font-anton text-white/20 text-lg border border-white/5 group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all">
                                   {cliente.nombre?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex flex-col">
                                   <p className="font-anton text-white uppercase tracking-wider text-lg mb-1 group-hover:text-indigo-400 transition-colors leading-none">{cliente.nombre || 'Reservado'}</p>
                                   <p className="text-[10px] font-anton text-white/20 uppercase tracking-widest">{cliente.email || 'NO_DATA_CHANNEL'}</p>
                                </div>
                             </div>
                             {cliente.telefono && (
                               <a href={`tel:${cliente.telefono}`}
                                 className="text-[10px] font-anton text-indigo-400 border border-indigo-500/20 px-6 py-3 rounded-2xl hover:bg-indigo-600/20 hover:text-white transition-all uppercase tracking-widest group shadow-lg">
                                 <span className="group-hover:animate-pulse mr-2">📞</span> {cliente.telefono}
                               </a>
                             )}
                          </div>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
           )}

           {/* ══ TAB: CITAS ══ */}
           {tab === 'citas' && (
             <div className="animate-lux-fade">
                <div className="glass-card overflow-hidden border-white/10 bg-white/[0.02]">
                   <div className="p-12 border-b border-white/5 flex flex-col lg:flex-row justify-between items-center gap-10">
                      <div>
                        <h2 className="text-5xl font-bebas text-white tracking-[0.2em] uppercase leading-none mb-3">Libro de Órdenes <span className="text-indigo-500">Master</span></h2>
                        <p className="text-[10px] font-anton text-white/30 uppercase tracking-widest">Cronología completa de la red distribuida</p>
                      </div>
                      <div className="bg-white/5 px-8 py-4 rounded-3xl border border-white/10 flex items-center gap-4">
                         <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-glow-blue animate-ping"></div>
                         <span className="text-[11px] font-anton text-white/50 uppercase tracking-[0.2em]">{citas.length} TRANSACCIONES SINCRO</span>
                      </div>
                   </div>
                   <div className="p-12">
                      {citas.length === 0 ? (
                        <div className="text-center p-32 text-white/10 font-anton uppercase tracking-[0.5em] italic border-2 border-dashed border-white/5 rounded-[40px] grayscale opacity-30 select-none">Pizarra Operativa Desierta</div>
                      ) : fechasOrdenadas.map(fecha => (
                        <div key={fecha} className="mb-20 last:mb-0">
                           <h3 className="text-2xl font-bebas text-indigo-400 mb-10 bg-indigo-600/10 px-8 py-4 rounded-2xl inline-block border border-indigo-500/20 uppercase tracking-[0.4em] shadow-glow-blue/10">📅 Registro: {fecha}</h3>
                           <div className="space-y-12">
                             {Object.keys(citasAgrupadas[fecha]).map(peluquero => (
                               <div key={peluquero} className="ml-2 sm:ml-10 border-l border-white/5 pl-12 py-2 relative">
                                  <div className="absolute left-[-1px] top-4 w-[2px] h-10 bg-gradient-to-b from-indigo-500 to-transparent"></div>
                                  <h4 className="font-anton text-white/30 mb-8 flex items-center gap-4 text-sm tracking-[0.3em] uppercase">💈 Terminal: <span className="text-white/60">{peluquero}</span></h4>
                                  <div className="space-y-6">
                                    {citasAgrupadas[fecha][peluquero].map((cita, i) => (
                                      <div key={cita._id} className={`glass-card-hover text-sm border-white/5 bg-white/[0.01] p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 animate-lux-fade stagger-${(i%4)+1}`}>
                                        <div className="flex items-center gap-10">
                                          <div className="flex flex-col items-center justify-center p-3 bg-indigo-600/5 rounded-2xl border border-indigo-500/10 w-24">
                                             <span className="font-anton text-indigo-400 text-lg tracking-tighter leading-none">{cita.hora}</span>
                                             <span className="text-[8px] font-anton text-white/20 uppercase mt-1 tracking-widest">Local Time</span>
                                          </div>
                                          <div>
                                             <p className="font-anton text-white uppercase tracking-[0.1em] text-lg mb-1 group-hover:text-indigo-400 transition-colors leading-none">{cita.cliente.nombre}</p>
                                             <p className="text-[11px] font-anton text-white/30 uppercase tracking-[0.2em]">{cita.servicioNombre}</p>
                                          </div>
                                        </div>
                                        <div className="flex justify-between sm:justify-end w-full sm:w-auto items-center gap-12">
                                          <div className="text-right">
                                             <p className="text-[9px] font-anton text-white/20 uppercase tracking-widest mb-1">Monto Neto</p>
                                             <span className="font-anton text-3xl text-white tracking-tighter shadow-glow-blue/5">${cita.precio}</span>
                                          </div>
                                          <span className={`text-[10px] uppercase font-anton tracking-widest px-6 py-2.5 rounded-2xl border ${
                                            cita.estado === 'completada' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-glow-green/10' :
                                            cita.estado === 'confirmada' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-glow-blue/10' :
                                            cita.estado === 'cancelada' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            cita.estado === 'no_asistio' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                            'bg-white/5 text-white/30 border-white/10'
                                          }`}>{cita.estado}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ title, val, sub, icon, glow }) {
  const glowMaps = {
    indigo: 'shadow-glow-blue/10 border-indigo-500/10 group-hover:border-indigo-400/30 hover:shadow-indigo-500/5',
    green: 'shadow-glow-green/10 border-green-500/10 group-hover:border-green-400/30 hover:shadow-green-500/5',
    blue: 'shadow-glow-blue/10 border-blue-500/10 group-hover:border-blue-400/30 hover:shadow-blue-500/5'
  };
  
  const iconMaps = {
    indigo: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
    green: 'bg-green-600/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-600/20 text-blue-400 border-blue-500/30'
  };

  const textMaps = {
    indigo: 'drop-shadow-glow-blue/10',
    green: 'drop-shadow-glow-green/10',
    blue: 'drop-shadow-glow-blue'
  }

  return (
    <div className={`glass-card p-12 border transition-all duration-700 hover:-translate-y-2 group bg-white/[0.02] ${glowMaps[glow]}`}>
      <div className="flex justify-between items-start mb-10">
        <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center text-5xl border backdrop-blur-md transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 ${iconMaps[glow]}`}>{icon}</div>
        <span className="text-[9px] font-anton uppercase tracking-[0.4em] text-white/20 border border-white/10 px-5 py-2 rounded-full backdrop-blur-2xl">Control Center Sinc</span>
      </div>
      <p className="text-[11px] font-anton uppercase tracking-[0.4em] text-white/30 mb-3 ml-1">{title}</p>
      <h3 className={`text-6xl font-anton tracking-tighter text-white transition-all duration-700 ${textMaps[glow]}`}>{val}</h3>
      <div className="mt-8 flex items-center gap-3">
         <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${glow === 'green' ? 'bg-green-400' : 'bg-indigo-400'}`}></div>
         <p className="text-[10px] font-anton uppercase tracking-[0.2em] text-white/20">{sub}</p>
      </div>
    </div>
  );
}
