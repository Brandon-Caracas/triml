import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useNegocioStore } from '../services/store';
import { authAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { negocio } = useNegocioStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, contraseña);
      const { token, usuario } = response.data;
      
      login(token, usuario);
      
      // Redirigir según rol
      if (usuario.rol === 'cliente') navigate('/cliente');
      else if (usuario.rol === 'peluquero') navigate('/peluquero');
      else if (usuario.rol === 'admin') navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Error de credenciales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-oswald text-white">
      <Header />
      <div className="flex-grow flex items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Aura Decorativa Lux */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse pointer-events-none"></div>
        
        <div className="glass-card w-full max-w-md p-10 sm:p-14 animate-lux-fade border-white/10 shadow-2xl relative z-10">
          
          {negocio && (
            <div className="text-center mb-12 animate-in slide-in-from-top-8 duration-700">
              {negocio.configuracionVisual?.logo ? (
                <div className="relative inline-block mb-6 group">
                  <div className="absolute -inset-2 bg-blue-500 rounded-[32px] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <img 
                    src={negocio.configuracionVisual.logo} 
                    alt={negocio.nombre} 
                    className="relative w-28 h-28 mx-auto rounded-[28px] shadow-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-blue-600/20 text-blue-400 rounded-[32px] mx-auto flex items-center justify-center text-5xl mb-8 shadow-glow-blue border border-blue-500/30 animate-float">
                  💈
                </div>
              )}
              <h2 className="text-4xl font-bebas text-white tracking-[0.2em] uppercase leading-none">{negocio.nombre}</h2>
              <div className="flex items-center justify-center gap-3 mt-4">
                <span className="h-[1px] w-6 bg-white/10"></span>
                <p className="text-[10px] font-anton text-blue-400/60 uppercase tracking-[0.4em]">Ecosistema Distribuido</p>
                <span className="h-[1px] w-6 bg-white/10"></span>
              </div>
            </div>
          )}

          <div className="text-center mb-12 stagger-1 animate-in slide-in-from-bottom-4">
            <h1 className="text-5xl font-bebas tracking-tighter text-white uppercase leading-none mb-3">
              {negocio ? 'Acceso de Socio' : 'Mando Central'}
            </h1>
            <p className="text-[9px] font-anton text-white/20 uppercase tracking-[0.6em]">Premium SaaS Management</p>
          </div>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-anton uppercase tracking-widest p-5 rounded-2xl mb-10 flex items-center gap-4 animate-in shake duration-500">
              <span className="text-xl">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 stagger-2 animate-in slide-in-from-bottom-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-anton uppercase tracking-[0.3em] text-white/30 ml-2">Identificador (Email)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="PRO@ELITE.COM"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-anton uppercase tracking-[0.3em] text-white/30 ml-2">Firma Digital</label>
              <input
                type="password"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-glow-blue w-full py-5 text-xs font-anton tracking-[0.4em] mt-8"
            >
              {loading ? 'VALIDANDO CANAL...' : 'SINCRONIZAR ACCESO'}
            </button>
          </form>

          <div className="mt-12 text-center stagger-3 animate-in slide-in-from-bottom-8">
            <p className="text-[10px] font-oswald text-white/20 uppercase tracking-[0.2em]">
              ¿Sin credenciales activas? 
              <Link to="/registro" className="text-blue-400 hover:text-white font-anton ml-3 transition-colors underline underline-offset-4 decoration-blue-500/30">
                AFILIARSE AHORA
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
