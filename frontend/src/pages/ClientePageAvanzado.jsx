import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CalendarioInteligente from '../components/CalendarioInteligente';
import { conectarSocket, desconectarSocket } from '../services/socketService';
import { peluquerosAPI, reservasAPI } from '../services/api';
import { useNegocioStore } from '../services/store';
import { toast } from 'react-hot-toast';

// ─── Constantes ────────────────────────────────────────────────────────────
const HORARIOS = [
  { valor: '07:00', etiqueta: '7:00 AM' },
  { valor: '09:00', etiqueta: '9:00 AM' },
  { valor: '11:00', etiqueta: '11:00 AM' },
  { valor: '13:00', etiqueta: '1:00 PM' },
  { valor: '15:00', etiqueta: '3:00 PM' },
  { valor: '17:00', etiqueta: '5:00 PM' },
  { valor: '19:00', etiqueta: '7:00 PM' },
];

const IMAGENES_CORTES = {
  'Fade': 'https://images.unsplash.com/photo-1621605815841-20577d6118d0?auto=format&fit=crop&q=80&w=300',
  'Barba': 'https://images.unsplash.com/photo-1593702295094-ada74bc4719a?auto=format&fit=crop&q=80&w=300',
  'Corte Clásico': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=300',
  'Afeitado': 'https://images.unsplash.com/photo-1599351431247-f570fb21c98a?auto=format&fit=crop&q=80&w=300',
  'Color': 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=300',
  'Default': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=300'
};

export default function ClientePageAvanzado() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [clienteInfo, setClienteInfo] = useState({ nombre: '', telefono: '', email: '' });
  const [selectedFecha, setSelectedFecha] = useState(null);
  const [selectedHora, setSelectedHora] = useState(null);
  const [selectedPeluquero, setSelectedPeluquero] = useState(null);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [peluqueros, setPeluqueros] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [horarios, setHorarios] = useState([]); // Nuevo estado para slots filtrados
  const [misReservas, setMisReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdReservation, setCreatedReservation] = useState(null);
  const { negocio } = useNegocioStore();

  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation, navigate]);

  useEffect(() => {
    const socket = conectarSocket();
    const refrescar = () => {
      if (selectedPeluquero && selectedFecha) cargarHorarios(selectedPeluquero._id, selectedFecha);
    };
    socket.on('nueva-reserva', refrescar);
    socket.on('reserva-cancelada', refrescar);
    socket.on('horarios-actualizados', refrescar);
    return () => {
      socket.off('nueva-reserva', refrescar);
      socket.off('reserva-cancelada', refrescar);
      socket.off('horarios-actualizados', refrescar);
      desconectarSocket();
    };
  }, [selectedPeluquero, selectedFecha]);

  useEffect(() => {
    cargarPeluqueros();
  }, [negocio]);

  useEffect(() => {
    if (clienteInfo.telefono) cargarMisReservas();
  }, [clienteInfo.telefono]);

  // [VALIDACIÓN 3] useEffect para disparar la carga de horarios
  useEffect(() => {
    if (selectedPeluquero && selectedFecha) {
      console.log("🚀 Disparando carga de horarios para:", selectedPeluquero.nombre, "en fecha:", selectedFecha);
      cargarHorarios(selectedPeluquero._id, selectedFecha);
    }
  }, [selectedPeluquero, selectedFecha]);

  const cargarPeluqueros = async () => {
    try {
      setLoading(true);
      const res = await peluquerosAPI.obtenerActivos(negocio?.slug);
      setPeluqueros(res.data.peluqueros || []);
    } catch (e) {
      toast.error('Error cargando peluqueros');
    } finally {
      setLoading(false);
    }
  };

  // [VALIDACIÓN 4] Función cargarHorarios optimizada
  const cargarHorarios = async (id, fecha) => {
    try {
      setLoading(true);
      console.log("⌛ Ejecutando reservasAPI.obtenerHorarios...");
      const res = await reservasAPI.obtenerHorarios(id, new Date(fecha).toISOString().split('T')[0]);
      const ocupadas = res.data.horasOcupadas || [];
      setHorasOcupadas(ocupadas);

      // Filtrar horarios disponibles
      const ahora = new Date();
      const esHoy = fecha === `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

      const disponibles = HORARIOS.map(h => {
        let ocupado = ocupadas.includes(h.valor);
        
        // Si es hoy, marcar como ocupado (o deshabilitado) las horas que ya pasaron
        if (esHoy && !ocupado) {
          const [hrs, mins] = h.valor.split(':').map(Number);
          const horaSlot = new Date();
          horaSlot.setHours(hrs, mins, 0, 0);
          
          if (horaSlot <= ahora) {
            ocupado = true;
          }
        }

        return {
          ...h,
          ocupado
        };
      });
      
      setHorarios(disponibles);
      console.log("✅ Horarios procesados:", disponibles);
    } catch (e) {
      console.error("❌ Error en cargarHorarios:", e);
    } finally {
      setLoading(false);
    }
  };

  // [VALIDACIÓN 2] Handler de fecha
  const handleFecha = (fecha) => {
    console.log("📅 Fecha seleccionada en calendario:", fecha);
    setSelectedFecha(fecha);
    setStep(3); // [VALIDACIÓN 6] Cambio de paso automático
  };

  const cargarMisReservas = useCallback(async () => {
    try {
      const res = await reservasAPI.obtenerMias(clienteInfo.telefono);
      setMisReservas(res.data.reservas || []);
    } catch (e) {}
  }, [clienteInfo.telefono]);

  const finalizarReserva = async () => {
    if (!clienteInfo.nombre || !clienteInfo.telefono || !selectedPeluquero || !selectedFecha || !selectedHora || !selectedServicio) {
      return toast.error('Completa todos los campos');
    }
    try {
      setLoading(true);
      const res = await reservasAPI.crear({
        clienteNombre: clienteInfo.nombre,
        clienteTelefono: clienteInfo.telefono,
        clienteEmail: clienteInfo.email,
        peluqueroId: selectedPeluquero._id,
        servicioId: selectedServicio._id,
        fecha: new Date(selectedFecha).toISOString(),
        hora: selectedHora,
      });
      setCreatedReservation(res.data.reserva);
      setShowConfirmation(true);
      cargarMisReservas();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al agendar');
    } finally {
      setLoading(false);
    }
  };

  const reiniciarWizard = () => {
    setStep(1);
    setSelectedFecha(null);
    setSelectedHora(null);
    setSelectedServicio(null);
    setShowConfirmation(false);
    setCreatedReservation(null);
  };

  const format12H = (h) => {
    if (!h) return '';
    const [hrs, mins] = h.split(':').map(Number);
    const suffix = hrs >= 12 ? 'PM' : 'AM';
    return `${hrs % 12 || 12}:${mins.toString().padStart(2, '0')} ${suffix}`;
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center animate-lux-fade">
        <div className="glass-card p-12 max-w-md w-full border-blue-500/30">
          <div className="w-24 h-24 bg-blue-600/20 text-blue-400 rounded-full mx-auto flex items-center justify-center text-5xl mb-10 shadow-glow-blue animate-float">✓</div>
          <h1 className="text-5xl font-bebas text-white mb-6 tracking-tighter uppercase">¡Reserva Exitosa!</h1>
          <p className="text-white/60 mb-12 font-oswald uppercase tracking-widest text-xs leading-relaxed">
            Tu cita para <span className="text-blue-400 font-anton">{createdReservation?.servicioNombre}</span> está confirmada.
          </p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full btn-glow-blue py-5 text-xs font-anton tracking-[0.3em] uppercase"
          >
            Ver mis citas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-oswald text-white">
      <Header />
      <main className="flex-grow pb-32">
        {/* Hero Lux */}
        <div className="relative pt-20 pb-28 text-center px-6">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-600/5 blur-[150px] pointer-events-none"></div>
           <h1 className="text-7xl font-bebas tracking-tighter text-white uppercase drop-shadow-glow-blue leading-none mb-4 animate-lux-fade">
             {negocio?.nombre || 'Reserva Tu Estilo'}
           </h1>
           <p className="text-[10px] font-anton uppercase tracking-[0.5em] text-blue-400/60 stagger-1 animate-lux-fade">SaaS Management Elite Luxury Edition</p>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-16">
          {/* Progress Lux */}
          <div className="glass-card p-2 flex gap-2 border-white/10 mb-16 sticky top-24 z-40 bg-dark-bg/60 backdrop-blur-3xl rounded-[32px]">
            {[1, 2, 3].map(n => (
              <div 
                key={n} 
                onClick={() => step > n && setStep(n)}
                className={`flex-1 py-4 rounded-3xl flex items-center justify-center gap-4 transition-all duration-500 cursor-pointer ${step === n ? 'bg-blue-600 shadow-glow-blue border border-blue-400/30' : 'text-white/20'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-anton text-xs ${step === n ? 'bg-white text-blue-600 shadow-xl' : 'bg-white/5 border border-white/5'}`}>{step > n ? '✓' : n}</div>
                <span className="text-[10px] font-anton uppercase tracking-widest hidden sm:inline">{n === 1 ? 'Servicio' : n === 2 ? 'Agenda' : 'Hormario'}</span>
              </div>
            ))}
          </div>

          <div className="space-y-16 animate-lux-fade">
            {step === 1 && (
              <section className="space-y-12">
                 <div className="glass-card p-10 border-white/10">
                    <h2 className="text-3xl font-bebas text-white mb-10 tracking-[0.2em] flex items-center gap-4 underline decoration-blue-500/30 decoration-4 underline-offset-8">👤 Registro de Identidad</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-blue-400 ml-1">Nombre y Apellido</label>
                          <input type="text" placeholder="EJ: MARCOS PRO" className="input-field" value={clienteInfo.nombre} onChange={e => setClienteInfo({...clienteInfo, nombre: e.target.value})}/>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-anton uppercase tracking-[0.3em] text-blue-400 ml-1">Móvil / WhatsApp</label>
                          <input type="tel" placeholder="+34 000 000 000" className="input-field" value={clienteInfo.telefono} onChange={e => setClienteInfo({...clienteInfo, telefono: e.target.value})}/>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1 space-y-8">
                       <h2 className="text-4xl font-bebas text-white tracking-[0.2em] uppercase leading-none">Elige Tu <br/> <span className="text-blue-500">Expertise</span>-t</h2>
                       <div className="space-y-6">
                          {peluqueros.map(p => (
                            <div 
                              key={p._id} 
                              onClick={() => { setSelectedPeluquero(p); setServicios(p.servicios || []); }}
                              className={`glass-card-hover p-6 border-white/5 cursor-pointer flex items-center gap-6 ${selectedPeluquero?._id === p._id ? 'border-blue-500/50 bg-blue-600/10' : ''}`}
                            >
                               <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-2xl border border-white/5">🧔</div>
                               <div>
                                  <h4 className="text-xl font-bebas text-white leading-none mb-1">{p.nombre}</h4>
                                  <p className="text-[9px] font-anton text-blue-400 uppercase tracking-widest">{p.salon || 'Master Artist'}</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                       <h2 className="text-4xl font-bebas text-white tracking-[0.2em] uppercase leading-none">Catálogo <br/> de <span className="text-blue-500">Artes</span></h2>
                       {!selectedPeluquero ? (
                         <div className="glass-card p-32 text-center border-dashed border-white/10 opacity-30 italic font-anton uppercase tracking-[0.3em] text-[10px]">Selecciona un talento para ver su catálogo</div>
                       ) : (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {servicios.map(s => (
                              <div 
                                key={s._id} 
                                onClick={() => setSelectedServicio(s)}
                                className={`glass-card-hover group overflow-hidden border-white/5 cursor-pointer flex flex-col ${selectedServicio?._id === s._id ? 'border-blue-500 scale-[1.02]' : ''}`}
                              >
                                 <div className="h-40 overflow-hidden relative">
                                    <img 
                                        src={s.imagen || IMAGENES_CORTES[s.nombre] || IMAGENES_CORTES['Default']} 
                                        alt={s.nombre} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[20%] group-hover:grayscale-0"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/95 via-dark-bg/40 to-transparent"></div>
                                 </div>
                                 <div className="p-6 relative z-10 -mt-8">
                                    <h4 className="text-2xl font-bebas text-white tracking-widest leading-none mb-4">{s.nombre}</h4>
                                    <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                       <span className="text-3xl font-anton text-white tracking-tighter">${s.precio}</span>
                                       <span className="text-[10px] font-anton text-blue-400 uppercase tracking-widest">{s.duracion} MIN</span>
                                    </div>
                                 </div>
                                 {selectedServicio?._id === s._id && <div className="bg-blue-600 py-3 text-center text-[9px] font-anton uppercase tracking-[0.4em] shadow-glow-blue z-20 relative">Seleccionado ✓</div>}
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>

                 {selectedServicio && (
                   <div className="pt-16 flex justify-center">
                      <button onClick={() => setStep(2)} className="btn-glow-blue px-20 py-6 text-xs font-anton tracking-[0.5em] shadow-2xl">CONTINUAR A LA AGENDA</button>
                   </div>
                 )}
              </section>
            )}

            {step === 2 && (
              <section className="space-y-12 animate-lux-fade">
                 <div className="glass-card p-12 border-indigo-500/20 shadow-glow-blue/5">
                    <h2 className="text-4xl font-bebas text-white mb-10 tracking-[0.3em] text-center uppercase">🗓️ Selección de Fecha Imperial</h2>
                    <CalendarioInteligente 
                      onFechaSeleccionada={handleFecha}
                      peluqueroId={selectedPeluquero?._id}
                    />
                 </div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-12 animate-lux-fade">
                 <div className="glass-card p-16 border-white/10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none"></div>
                    <h2 className="text-5xl font-bebas text-white mb-16 tracking-[0.3em] uppercase underline decoration-blue-500/30 decoration-8 underline-offset-[16px]">⌛ Horarios Disponibles</h2>
                    
                    {/* Selector Premium de Horarios */}
                    {horarios.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
                        {horarios.map(h => (
                          <button 
                            key={h.valor}
                            disabled={h.ocupado}
                            onClick={() => setSelectedHora(h.valor)}
                            className={`
                              py-4 rounded-2xl font-anton text-lg tracking-widest transition-all duration-300 border
                              ${selectedHora === h.valor 
                                ? "bg-blue-600 text-white border-blue-400 shadow-glow scale-105" 
                                : h.ocupado 
                                  ? "bg-white/5 text-white/10 border-white/5 cursor-not-allowed opacity-40" 
                                  : "bg-white/10 text-white/60 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-white"}
                            `}
                          >
                            {h.valor}
                            {h.ocupado && <span className="block text-[8px] font-anton uppercase tracking-widest mt-1 opacity-50">Ocupado</span>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 glass-card border-dashed border-white/10 opacity-50">
                        <p className="text-xl font-bebas tracking-widest uppercase">No hay horarios disponibles para esta fecha</p>
                        <button onClick={() => setStep(2)} className="mt-8 text-blue-400 font-anton text-[10px] uppercase tracking-widest hover:underline">Volver al Calendario</button>
                      </div>
                    )}

                    {/* [VALIDACIÓN 7] Debug logs visuales en consola al renderizar */}
                    {console.log("🔍 Render Step 3 - Fecha:", selectedFecha, "Barbero:", selectedPeluquero?.nombre, "Slots:", horarios.length)}

                    {selectedHora && (
                      <div className="mt-24 pt-16 border-t border-white/10 animate-lux-fade">
                        <button onClick={finalizarReserva} disabled={loading} className="btn-glow-blue px-24 py-8 text-sm font-anton tracking-[0.5em] shadow-2xl uppercase">{loading ? 'SINCRONIZANDO...' : 'Sellar Reserva Lux'}</button>
                      </div>
                    )}
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
