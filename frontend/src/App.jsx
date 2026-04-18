import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useNegocioStore } from './services/store';
import { authAPI, negociosAPI } from './services/api';

// Páginas
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import ClientePage from './pages/ClientePage';
import ClientePageAvanzado from './pages/ClientePageAvanzado';
import PeluqueroDashboard from './pages/PeluqueroDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';

// Componentes
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

import './styles/index.css';

function App() {
  const { usuario, isAuthenticated, login, logout, inicializarDesdeLocalStorage } = useAuthStore();
  const { negocio, setNegocio } = useNegocioStore();
  const [loading, setLoading] = React.useState(true);

  // Efecto para inyectar estilos de CSS variables cuando el negocio cambie en el store
  React.useEffect(() => {
    if (negocio?.configuracionVisual) {
      const root = document.documentElement;
      const tema = negocio.configuracionVisual;
      const colorP = tema.colorPrimario || '#4f46e5';
      const colorS = tema.colorSecundario || '#0f172a';
      
      // Establecer variables CSS
      root.style.setProperty('--primary', colorP);
      root.style.setProperty('--secondary', colorS);

      // Inyectar un bloque de estilos para forzar que las clases de Tailwind usen estas variables
      // Esto es más robusto que solo usar el objeto theme de Tailwind en esta etapa
      let styleTag = document.getElementById('dynamic-theme');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-theme';
        document.head.appendChild(styleTag);
      }

      styleTag.innerHTML = `
        :root {
          --primary: ${colorP};
          --secondary: ${colorS};
        }
        /* Sobrescribir fondos */
        .bg-indigo-600, .bg-indigo-500, .bg-primary, .hover\\:bg-indigo-700:hover, .hover\\:bg-indigo-600:hover { 
          background-color: var(--primary) !important; 
        }
        /* Sobrescribir textos */
        .text-indigo-600, .text-indigo-500, .text-indigo-900, .text-primary { 
          color: var(--primary) !important; 
        }
        /* Bordes y anillos */
        .border-indigo-600, .focus\\:border-indigo-600:focus, .focus\\:ring-indigo-600:focus { 
          border-color: var(--primary) !important;
          --tw-ring-color: var(--primary) !important;
        }
        /* Color Secundario */
        .bg-slate-900, .bg-slate-800, .bg-secondary {
          background-color: var(--secondary) !important;
        }
        .from-slate-900 {
          --tw-gradient-from: var(--secondary) !important;
        }
      `;

      if (tema.fondo) {
        document.body.style.backgroundImage = `url(${tema.fondo})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundPosition = 'center';
      } else {
        document.body.style.backgroundImage = 'none';
      }
    }
  }, [negocio]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slugNegocio = params.get('negocio') || sessionStorage.getItem('negocioSlug') || 'default';

    const cargarNegocio = async (slug) => {
      try {
        const res = await negociosAPI.obtenerConfiguracion(slug);
        setNegocio(res.data.negocio);
        sessionStorage.setItem('negocioSlug', res.data.negocio.slug);
      } catch (error) {
        console.error("Error al cargar configuración del negocio:", error);
      }
    };

    const initAuth = async () => {
      inicializarDesdeLocalStorage();
      const token = sessionStorage.getItem('token');
      
      // Capturar slug de la URL
      const params = new URLSearchParams(window.location.search);
      const urlSlug = params.get('negocio');
      
      // Si hay slug en la URL, guardarlo inmediatamente
      if (urlSlug) {
        sessionStorage.setItem('negocioSlug', urlSlug);
      }

      const currentSlug = urlSlug || sessionStorage.getItem('negocioSlug') || 'default';

      if (token) {
        try {
          const res = await authAPI.verificar();
          const user = res.data.usuario;
          login(token, user);
        } catch (e) {
          logout();
        }
      }
      
      // Cargar configuracion del negocio
      await cargarNegocio(currentSlug);
      
      // REQUISITO: Si se entró por un link de negocio (?negocio=...) y no está logueado -> Login
      if (urlSlug && !token && window.location.pathname !== '/login') {
        window.location.href = '/login'; 
        return;
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-indigo-600 animate-pulse">CARGANDO SISTEMA...</div>;
  }

  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Ruta pública para reservas — sin login */}
        <Route path="/reservar" element={<ClientePageAvanzado />} />

        <Route path="/" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/registro" element={!isAuthenticated ? <RegistroPage /> : <Navigate to="/dashboard" />} />

        <Route path="/cliente" element={<ProtectedRoute rol="cliente"><ClientePage /></ProtectedRoute>} />
        <Route path="/peluquero" element={<ProtectedRoute rol="peluquero"><PeluqueroDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute rol="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

function Dashboard() {
  const { usuario } = useAuthStore();

  if (usuario?.rol === 'cliente') return <Navigate to="/cliente" />;
  if (usuario?.rol === 'peluquero') return <Navigate to="/peluquero" />;
  if (usuario?.rol === 'admin') return <Navigate to="/admin" />;

  return <Navigate to="/login" />;
}

export default App;
