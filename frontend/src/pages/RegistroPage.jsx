import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../services/store';
import { authAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function RegistroPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    contraseña: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.registro({ ...formData, rol: 'cliente' });
      const { token, usuario } = response.data;
      
      login(token, usuario);
      
      if (usuario.rol === 'cliente') navigate('/cliente');
      else if (usuario.rol === 'peluquero') navigate('/peluquero');
      else if (usuario.rol === 'admin') navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Error en el proceso de registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-oswald text-white">
      <Header />
      <div className="flex-grow flex items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Aura Decorativa Lux */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[180px] rounded-full animate-pulse pointer-events-none"></div>

        <div className="glass-card w-full max-w-2xl p-10 sm:p-16 animate-lux-fade border-white/10 shadow-2xl relative z-10">
          <div className="text-center mb-16 animate-in slide-in-from-top-8 duration-700">
             <div className="w-24 h-24 bg-blue-600/20 text-blue-400 rounded-[32px] mx-auto flex items-center justify-center text-5xl mb-8 shadow-glow-blue border border-blue-500/30 animate-float">
                ✨
             </div>
             <h1 className="text-6xl font-bebas tracking-tighter text-white uppercase leading-none mb-4">Nueva Afiliación</h1>
             <p className="text-[10px] font-anton text-blue-400 uppercase tracking-[0.5em]">Únete al ecosistema <span className="text-white">Trimly</span></p>
          </div>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-anton uppercase tracking-widest p-6 rounded-2xl mb-12 flex items-center gap-4 animate-in shake duration-500">
              <span className="text-xl">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 stagger-1 animate-in slide-in-from-bottom-4">
              <div className="space-y-3">
                <label className="block text-[10px] font-anton uppercase tracking-[0.3em] text-white/30 ml-2">Nombre y Apellido</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="JUAN PÉREZ"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-anton uppercase tracking-[0.3em] text-white/30 ml-2">Canal de Contacto (Email)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="TU@EMAIL.COM"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 stagger-2 animate-in slide-in-from-bottom-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-anton uppercase tracking-[0.3em] text-white/30 ml-2">Móvil Directo</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+34 000 000 000"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-anton uppercase tracking-[0.3em] text-white/30 ml-2">Firma de Seguridad</label>
                <input
                  type="password"
                  name="contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-glow-blue w-full py-6 text-xs font-anton tracking-[0.4em] mt-8 shadow-2xl"
            >
              {loading ? 'SINCRONIZANDO REGISTRO...' : 'CREAR IDENTIDAD ELITE'}
            </button>
          </form>

          <div className="mt-16 text-center stagger-3 animate-in slide-in-from-bottom-10">
            <p className="text-[10px] font-oswald text-white/20 uppercase tracking-[0.2em]">
              ¿Ya formas parte de la red? 
              <Link to="/login" className="text-blue-400 hover:text-white font-anton ml-3 transition-colors underline underline-offset-4 decoration-blue-500/30">
                ACCEDER AL PANEL
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
