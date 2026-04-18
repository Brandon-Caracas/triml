import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/store';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 border-b border-white/5 ${scrolled ? 'bg-dark-bg/80 backdrop-blur-3xl py-3 shadow-2xl shadow-blue-500/5' : 'bg-transparent py-6'}`}>
      <div className="container flex justify-between items-center">
        {/* LOGO LUX */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative w-10 h-10 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-600/40 transition-all duration-700">
             <span className="text-xl group-hover:animate-float">✂️</span>
             <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
             <span className="text-2xl font-bebas tracking-tighter text-white drop-shadow-glow-blue leading-none">Trim<span className="text-blue-400">ly</span></span>
             <span className="text-[8px] font-anton text-white/30 tracking-[0.6em] uppercase mt-0.5">Pro Booking</span>
          </div>
        </Link>
        
        {usuario && (
          <div className="flex items-center gap-6 sm:gap-10">
            {/* PERFIL LUX */}
            <div className="hidden lg:flex items-center gap-4 bg-white/[0.03] border border-white/10 px-4 py-2 rounded-2xl hover:bg-white/[0.05] transition-all cursor-default">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center border border-white/10 shadow-glow-blue">
                   <span className="text-xs">🧔</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-dark-bg rounded-full"></div>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-anton uppercase tracking-widest text-white leading-none mb-1">
                   {usuario.nombre}
                 </span>
                 <span className="text-[8px] font-anton text-blue-400 uppercase tracking-tighter">Artista Premium</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="btn-glow-red text-[9px] px-6 py-2.5 rounded-xl border border-rose-500/30 shadow-none hover:shadow-glow-rose"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
