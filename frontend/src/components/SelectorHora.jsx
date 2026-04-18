import React, { useState } from 'react';

export default function SelectorHora({ horarios = [], horasOcupadas = [], onHoraSeleccionada }) {
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);

  // Horarios cada 2 horas: 7 AM a 7 PM
  const HORARIOS_PREDEFINIDOS = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

  const convertirAFormato12H = (horaStr) => {
    const [horas] = horaStr.split(':');
    const h = parseInt(horas);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${h12}:${horaStr.split(':')[1]} ${ampm}`;
  };

  const handleSelectHora = (hora) => {
    setHoraSeleccionada(hora);
    onHoraSeleccionada(hora);
  };

  const estaOcupado = (hora) => {
    return horasOcupadas && horasOcupadas.includes(hora);
  };

  const estaDisponible = (hora) => {
    return horarios && horarios.includes(hora);
  };

  return (
    <div className="glass-card p-6 border-white/5">
      <h3 className="text-xl font-bebas tracking-widest text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-glow-blue"></span>
        Horarios Disponibles
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {HORARIOS_PREDEFINIDOS.map((hora) => {
          const disponible = estaDisponible(hora);
          const ocupado = estaOcupado(hora);
          const seleccionado = horaSeleccionada === hora;

          return (
            <button
              key={hora}
              onClick={() => handleSelectHora(hora)}
              disabled={ocupado}
              className={`p-4 rounded-xl font-anton transition-all duration-300 transform active:scale-90 border ${
                seleccionado
                  ? 'bg-blue-600 text-white shadow-glow-blue border-blue-400 scale-105 z-10'
                  : ocupado
                  ? 'bg-white/5 text-white/10 cursor-not-allowed border-white/5 grayscale line-through'
                  : disponible
                  ? 'bg-white/5 hover:bg-blue-500/20 text-blue-400 border-white/10 hover:border-blue-500/50'
                  : 'bg-white/5 text-white/20 cursor-not-allowed border-transparent'
              }`}
            >
              <div className="text-sm tracking-widest">{convertirAFormato12H(hora)}</div>
              {!ocupado && disponible && <div className="text-[8px] uppercase tracking-tighter opacity-50 mt-1">Libre ✓</div>}
              {ocupado && <div className="text-[8px] uppercase tracking-tighter opacity-50 mt-1">Ocupado</div>}
            </button>
          );
        })}
      </div>

      {horaSeleccionada && (
        <div className="mt-8 p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-center animate-in zoom-in duration-500">
          <p className="text-[10px] font-anton uppercase tracking-[0.2em] text-blue-400 mb-1">Confirmar Hora</p>
          <p className="text-2xl font-bebas text-white tracking-[0.1em]">
            {convertirAFormato12H(horaSeleccionada)}
          </p>
        </div>
      )}

      {(!horarios || horarios.length === 0) && (
        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
          <p className="text-xs font-oswald text-rose-400 uppercase tracking-widest">⚠️ Sin disponibilidad para esta fecha</p>
        </div>
      )}
    </div>
  );
}
