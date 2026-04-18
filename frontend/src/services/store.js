import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  usuario: null,
  token: null,
  isAuthenticated: false,

  login: (token, usuario) => {
    sessionStorage.setItem('token', token);
    set({ token, usuario, isAuthenticated: true });
  },

  logout: () => {
    sessionStorage.removeItem('token');
    set({ usuario: null, token: null, isAuthenticated: false });
  },

  setUsuario: (usuario) => set({ usuario }),
  setToken: (token) => set({ token }),

  inicializarDesdeLocalStorage: () => {
    const token = sessionStorage.getItem('token');
    if (token) {
      set({ token, isAuthenticated: true });
    }
  }
}));

export const useReservasStore = create((set) => ({
  reservas: [],
  horarios: [],
  loading: false,
  error: null,

  setReservas: (reservas) => set({ reservas }),
  setHorarios: (horarios) => set({ horarios }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));

export const useAdminStore = create((set) => ({
  peluqueros: [],
  estadisticas: null,
  loading: false,

  setPeluqueros: (peluqueros) => set({ peluqueros }),
  setEstadisticas: (estadisticas) => set({ estadisticas }),
  setLoading: (loading) => set({ loading })
}));

export const useNegocioStore = create((set) => ({
  negocio: null,
  loading: false,

  setNegocio: (negocio) => set({ negocio }),
  setLoading: (loading) => set({ loading })
}));
