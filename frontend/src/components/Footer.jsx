import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-20 py-12 bg-[#080d1a] border-t border-white/5">
      <div className="container text-center">
        <h3 className="text-2xl font-bebas tracking-widest text-white/80 mb-4">
          <span className="text-neon-blue">✂️</span> Trim<span className="text-blue-400">ly</span>
        </h3>
        <p className="text-xs font-oswald uppercase tracking-[0.3em] text-white/40">
          Sistema Profesional de Reservas para Barberías y Salones
        </p>
        <div className="mt-8 border-t border-white/5 pt-8">
          <p className="text-[10px] text-white/20 font-anton uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
