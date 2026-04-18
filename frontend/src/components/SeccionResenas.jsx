import React, { useState, useEffect } from 'react';

export default function SeccionResenas({ peluqueroId }) {
  const [resenas, setResenas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    calificacion: 5,
    comentario: '',
    limpiem: 5,
    atencion: 5,
    puntualidad: 5
  });

  useEffect(() => {
    cargarResenas();
  }, [peluqueroId]);

  const cargarResenas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/resenas/${peluqueroId}`);
      const data = await response.json();
      setResenas(data.resenas || []);
      setPromedio(data.promedio || 0);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarResena = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peluqueroId,
          ...formulario,
          aspectos: {
            limpiem: formulario.limpiem,
            atencion: formulario.atencion,
            puntualidad: formulario.puntualidad
          }
        })
      });

      if (response.ok) {
        alert('✓ Reseña enviada. Pendiente de aprobación');
        setFormulario({ nombre: '', email: '', calificacion: 5, comentario: '', limpiem: 5, atencion: 5, puntualidad: 5 });
        setMostrarFormulario(false);
        cargarResenas();
      }
    } catch (error) {
      alert('Error enviando reseña');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (valor, onChange) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star)}
            className={`text-2xl cursor-pointer transition ${
              star <= valor ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="card mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold">⭐ Reseñas</h3>
          <p className="text-3xl font-bold text-yellow-500 mt-2">{promedio}</p>
          <p className="text-sm text-gray-600">({resenas.length} reseñas)</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {mostrarFormulario ? '✕ Cerrar' : '+ Dejar Reseña'}
        </button>
      </div>

      {mostrarFormulario && (
        <form onSubmit={enviarResena} className="bg-blue-50 p-4 rounded-lg mb-6 border-2 border-blue-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tu Nombre</label>
              <input
                type="text"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tu Email</label>
              <input
                type="email"
                value={formulario.email}
                onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Calificación General</label>
              {renderStars(formulario.calificacion, (val) => setFormulario({ ...formulario, calificacion: val }))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Aspecto: Limpieza</label>
              {renderStars(formulario.limpiem, (val) => setFormulario({ ...formulario, limpiem: val }))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Aspecto: Atención</label>
              {renderStars(formulario.atencion, (val) => setFormulario({ ...formulario, atencion: val }))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Aspecto: Puntualidad</label>
              {renderStars(formulario.puntualidad, (val) => setFormulario({ ...formulario, puntualidad: val }))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Comentario</label>
              <textarea
                value={formulario.comentario}
                onChange={(e) => setFormulario({ ...formulario, comentario: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Cuéntanos tu experiencia..."
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">{formulario.comentario.length}/500</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg transition"
            >
              {loading ? '⏳ Enviando...' : '✓ Enviar Reseña'}
            </button>
          </div>
        </form>
      )}

      {loading && resenas.length === 0 ? (
        <p className="text-center text-gray-500">Cargando reseñas...</p>
      ) : resenas.length === 0 ? (
        <p className="text-center text-gray-500">Sin reseñas aún</p>
      ) : (
        <div className="space-y-4">
          {resenas.map(resena => (
            <div key={resena._id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{resena.cliente.nombre}</p>
                  <p className="text-sm text-gray-600">{new Date(resena.createdAt).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="text-yellow-400">
                  {'⭐'.repeat(resena.calificacion)}
                </div>
              </div>
              {resena.comentario && (
                <p className="text-sm text-gray-700 mb-2">"{resena.comentario}"</p>
              )}
              {resena.aspectos && (
                <div className="text-xs text-gray-600">
                  <p>Limpieza: {'⭐'.repeat(resena.aspectos.limpiem)} Atención: {'⭐'.repeat(resena.aspectos.atencion)} Puntualidad: {'⭐'.repeat(resena.aspectos.puntualidad)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
