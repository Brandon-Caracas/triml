// Funciones de validación
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validarTelefono = (telefono) => {
  return telefono.length >= 9;
};

export const validarContraseña = (contraseña) => {
  return contraseña.length >= 6;
};

export const validarNombre = (nombre) => {
  return nombre.trim().length >= 2;
};

// Funciones de formato
export const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatearHora = (hora) => {
  if (!hora) return '';
  return hora.slice(0, 5);
};

export const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(precio);
};

// Funciones de utilidad
export const calcularDuracionMinutos = (horaInicio, horaFin) => {
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);
  return (hF * 60 + mF) - (hI * 60 + mI);
};

export const esFechaValida = (fecha) => {
  return !isNaN(new Date(fecha).getTime());
};

export const obtenerDiasSemana = (fecha) => {
  const date = new Date(fecha);
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return diasSemana[date.getDay()];
};

export const formatearNombre = (nombre) => {
  return nombre
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

export const esManana = (fecha) => {
  const hoy = new Date().setHours(0, 0, 0, 0);
  const compareDate = new Date(fecha).setHours(0, 0, 0, 0);
  return compareDate > hoy;
};

export const esHoy = (fecha) => {
  const hoy = new Date().setHours(0, 0, 0, 0);
  const compareDate = new Date(fecha).setHours(0, 0, 0, 0);
  return compareDate === hoy;
};
