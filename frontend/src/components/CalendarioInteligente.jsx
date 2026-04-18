import React, { useState, useEffect } from 'react';

export default function CalendarioInteligente({ onFechaSeleccionada, minDate = new Date() }) {
  const [mes, setMes] = useState(new Date().getMonth());
  const [año, setAño] = useState(new Date().getFullYear());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const primerDia = new Date(año, mes, 1).getDay();

  const dias = [];
  for (let i = 0; i < primerDia; i++) {
    dias.push(null);
  }
  for (let i = 1; i <= diasEnMes; i++) {
    dias.push(new Date(año, mes, i));
  }

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const moverMes = (cambio) => {
    let newMes = mes + cambio;
    let newAño = año;
    if (newMes > 11) {
      newMes = 0;
      newAño++;
    } else if (newMes < 0) {
      newMes = 11;
      newAño--;
    }
    setMes(newMes);
    setAño(newAño);
  };

  const handleClickDia = (dia) => {
    if (!dia) return;
    
    // Nueva lógica: permitir hoy aunque la hora actual ya haya pasado de las 00:00
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    if (dia < hoy) return;

    setFechaSeleccionada(dia);
    
    // CONSTRUCCIÓN SEGURA YYYY-MM-DD (Evita desfase de zona horaria de toISOString)
    const y = dia.getFullYear();
    const m = String(dia.getMonth() + 1).padStart(2, '0');
    const d = String(dia.getDate()).padStart(2, '0');
    const fechaFmt = `${y}-${m}-${d}`;
    
    onFechaSeleccionada(fechaFmt);
  };

  return (
    <div className="glass-card p-6 border-white/5">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => moverMes(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-90"
        >
          <span className="text-blue-400">◀</span>
        </button>
        <h3 className="text-2xl font-bebas tracking-widest text-white">
          {meses[mes]} <span className="text-blue-400/50">{año}</span>
        </h3>
        <button
          onClick={() => moverMes(1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-90"
        >
          <span className="text-blue-400">▶</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {diasSemana.map(dia => (
          <div key={dia} className="text-center font-anton text-[10px] uppercase tracking-tighter text-white/30">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia, idx) => {
          const esHoy = dia?.toDateString() === new Date().toDateString();
          const esSeleccionado = dia?.toDateString() === fechaSeleccionada?.toDateString();
          
          const hoyParaComparar = new Date();
          hoyParaComparar.setHours(0,0,0,0);
          const esPasado = dia < hoyParaComparar;

          return (
            <button
              key={idx}
              onClick={() => handleClickDia(dia)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-oswald transition-all duration-300 relative overflow-hidden ${
                !dia
                  ? 'bg-transparent cursor-default'
                  : esSeleccionado
                  ? 'bg-blue-600 text-white shadow-glow-blue border border-blue-400/50 scale-105 z-10'
                  : esPasado
                  ? 'bg-white/5 text-white/10 cursor-default line-through'
                  : 'bg-white/5 hover:bg-blue-500/20 text-white/70 hover:text-white border border-white/5 hover:border-blue-500/30 cursor-pointer'
              }`}
              disabled={!dia || esPasado}
            >
              <span className="relative z-10">{dia?.getDate()}</span>
              {esHoy && !esSeleccionado && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-400 shadow-glow-blue"></div>
              )}
            </button>
          );
        })}
      </div>

      {fechaSeleccionada && (
        <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] font-anton uppercase tracking-[0.2em] text-blue-400 mb-1">Día Elegido</p>
            <p className="text-lg font-bebas text-white tracking-widest leading-none">
              {fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
        </div>
      )}
    </div>
  );
}
