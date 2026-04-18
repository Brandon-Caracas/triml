import Servicio from '../models/Servicio.js';

// Obtener servicios de un peluquero
export const obtenerServicios = async (req, res) => {
  try {
    const { peluqueroId } = req.query;

    if (!peluqueroId) {
      return res.status(400).json({ error: 'ID del peluquero requerido' });
    }

    const servicios = await Servicio.find({ 
      peluquero: peluqueroId, 
      activo: true 
    });

    res.json({ servicios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear servicio (solo peluquero)
export const crearServicio = async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracion } = req.body;
    const peluqueroId = req.user.id;

    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio requeridos' });
    }

    const nuevoServicio = new Servicio({
      nombre,
      descripcion,
      precio,
      duracion: duracion || 30,
      peluquero: peluqueroId
    });

    await nuevoServicio.save();

    res.status(201).json({
      mensaje: 'Servicio creado exitosamente',
      servicio: nuevoServicio
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar servicio
export const actualizarServicio = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const { nombre, descripcion, precio, duracion, activo } = req.body;

    const servicio = await Servicio.findByIdAndUpdate(
      servicioId,
      { nombre, descripcion, precio, duracion, activo },
      { new: true }
    );

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({
      mensaje: 'Servicio actualizado',
      servicio
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar servicio
export const eliminarServicio = async (req, res) => {
  try {
    const { servicioId } = req.params;

    const servicio = await Servicio.findByIdAndDelete(servicioId);

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ mensaje: 'Servicio eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  obtenerServicios,
  crearServicio,
  actualizarServicio,
  eliminarServicio
};
