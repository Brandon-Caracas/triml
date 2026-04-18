import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardEstadisticas() {
  const [datos, setDatos] = useState({
    ingresos: [],
    reservas: [],
    citas: 0,
    ingresoTotal: 0,
    clientesFrecuentes: [],
    servicioPopular: {}
  });
  const [periodo, setPeriodo] = useState('mes'); // 'dia', 'semana', 'mes'

  useEffect(() => {
    cargarEstadisticas();
  }, [periodo]);

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/estadisticas?periodo=${periodo}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDatos(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const datosIngresos = [
    { fecha: 'Lun', ingreso: 250, citas: 5 },
    { fecha: 'Mar', ingreso: 320, citas: 7 },
    { fecha: 'Mié', ingreso: 280, citas: 6 },
    { fecha: 'Jue', ingreso: 400, citas: 8 },
    { fecha: 'Vie', ingreso: 450, citas: 9 },
    { fecha: 'Sab', ingreso: 500, citas: 10 },
    { fecha: 'Dom', ingreso: 200, citas: 4 }
  ];

  const datosServicios = [
    { nombre: 'Corte', valor: 45, fill: '#667eea' },
    { nombre: 'Tinte', valor: 25, fill: '#764ba2' },
    { nombre: 'Peinado', valor: 20, fill: '#f093fb' },
    { nombre: 'Otros', valor: 10, fill: '#f5576c' }
  ];

  return (
    <div className="space-y-6">
      {/* Selector de periodo */}
      <div className="flex gap-2">
        {['dia', 'semana', 'mes'].map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              periodo === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-gray-600">Citas</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">250</p>
          <p className="text-xs text-gray-500 mt-1">↑ 12% vs semana anterior</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-gray-600">Ingresos</p>
          <p className="text-3xl font-bold text-green-600 mt-2">$2,400</p>
          <p className="text-xs text-gray-500 mt-1">↑ 8% vs semana anterior</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-gray-600">Clientes</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">156</p>
          <p className="text-xs text-gray-500 mt-1">+5 nuevos</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <p className="text-sm text-gray-600">Promedio</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">4.8⭐</p>
          <p className="text-xs text-gray-500 mt-1">De 45 reseñas</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de líneas - Ingresos y Citas */}
        <div className="card">
          <h3 className="font-bold mb-4">📈 Ingresos vs Citas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datosIngresos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ingreso"
                stroke="#667eea"
                name="Ingreso ($)"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="citas"
                stroke="#f5576c"
                name="Citas"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de pastel - Servicios */}
        <div className="card">
          <h3 className="font-bold mb-4">📊 Distribución de Servicios</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosServicios}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nombre, valor }) => `${nombre} (${valor}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="valor"
              >
                {datosServicios.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de clientes frecuentes */}
      <div className="card">
        <h3 className="font-bold mb-4">👥 Clientes Frecuentes</h3>
        <table className="w-full text-sm">
          <thead className="border-b-2">
            <tr>
              <th className="text-left py-2">Cliente</th>
              <th className="text-center">Citas</th>
              <th className="text-center">Gasto</th>
              <th className="text-center">Última cita</th>
            </tr>
          </thead>
          <tbody>
            {[
              { nombre: 'Juan Pérez', citas: 12, gasto: '$240', ultima: 'Ayer' },
              { nombre: 'María García', citas: 10, gasto: '$200', ultima: 'Hace 2 días' },
              { nombre: 'Carlos López', citas: 8, gasto: '$160', ultima: 'Hace 5 días' },
              { nombre: 'Ana Martínez', citas: 7, gasto: '$140', ultima: 'Hace 1 semana' }
            ].map((cliente, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="py-3">{cliente.nombre}</td>
                <td className="text-center">{cliente.citas}</td>
                <td className="text-center font-semibold text-green-600">{cliente.gasto}</td>
                <td className="text-center text-gray-600">{cliente.ultima}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
