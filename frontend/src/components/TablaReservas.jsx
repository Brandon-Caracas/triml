import React from 'react';

export default function TablaReservas({ reservas = [], onConfirmar, onCancelar }) {
  const getEstadoBadge = (estado) => {
    const estilos = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmada: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };
    return estilos[estado] || 'bg-gray-100';
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  if (reservas.length === 0) {
    return (
      <div className="card text-center text-gray-500 py-8">
        <p>📭 No hay reservas disponibles</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="text-left p-3">Cliente</th>
            <th className="text-left p-3">Servicio</th>
            <th className="text-left p-3">Fecha</th>
            <th className="text-left p-3">Hora</th>
            <th className="text-left p-3">Estado</th>
            <th className="text-left p-3">Precio</th>
            <th className="text-left p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((reserva) => (
            <tr key={reserva._id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium">
                {reserva.cliente?.nombre}
              </td>
              <td className="p-3">
                {reserva.servicioNombre}
              </td>
              <td className="p-3 text-sm">
                {formatearFecha(reserva.fecha)}
              </td>
              <td className="p-3 font-mono">
                {reserva.hora}
              </td>
              <td className="p-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(reserva.estado)}`}>
                  {reserva.estado}
                </span>
              </td>
              <td className="p-3 font-bold text-green-600">
                ${reserva.precio?.toFixed(2) || '0.00'}
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  {reserva.estado === 'pendiente' && (
                    <button
                      onClick={() => onConfirmar?.(reserva._id)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                    >
                      Confirmar
                    </button>
                  )}
                  {['pendiente', 'confirmada'].includes(reserva.estado) && (
                    <button
                      onClick={() => onCancelar?.(reserva._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
