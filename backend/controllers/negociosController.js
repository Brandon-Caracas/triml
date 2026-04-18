import Negocio from '../models/Negocio.js';
import Usuario from '../models/Usuario.js';
import Reserva from '../models/Reserva.js';

// ───────────────────────────────────────────────
// RUTAS PÚBLICAS
// ───────────────────────────────────────────────

// Obtener la configuración visual de un negocio por su slug
export const obtenerPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const negocio = await Negocio.findOne({ slug });

    if (!negocio) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    // 🔒 Bloquear si el negocio está inactivo
    if (negocio.estado === 'inactivo') {
      return res.status(403).json({ 
        error: 'Este negocio está temporalmente inactivo',
        inactivo: true
      });
    }

    res.json({
      negocio: {
        nombre: negocio.nombre,
        slug: negocio.slug,
        configuracionVisual: negocio.configuracionVisual
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la configuración del negocio' });
  }
};

// ───────────────────────────────────────────────
// RUTAS PELUQUERO – Personalización visual
// ───────────────────────────────────────────────

export const actualizarConfiguracion = async (req, res) => {
  try {
    const { colorPrimario, colorSecundario, logo, fondo } = req.body;
    const peluquero = await Usuario.findById(req.user.id);

    if (!peluquero.negocioId) {
      const baseSlug = peluquero.salon
        ? peluquero.salon.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : `barberia-${peluquero._id}`;
      const nuevoNegocio = await Negocio.create({
        nombre: peluquero.salon || 'Mi Barbería',
        slug: baseSlug,
        configuracionVisual: {
          colorPrimario: colorPrimario || '#4f46e5',
          colorSecundario: colorSecundario || '#0f172a',
          logo: logo || '',
          fondo: fondo || ''
        }
      });
      peluquero.negocioId = nuevoNegocio._id;
      await peluquero.save();
      return res.json({
        mensaje: 'Negocio creado y configurado exitosamente',
        configuracion: nuevoNegocio.configuracionVisual
      });
    }

    const negocio = await Negocio.findById(peluquero.negocioId);
    if (!negocio) return res.status(404).json({ error: 'Negocio no encontrado' });

    if (colorPrimario) negocio.configuracionVisual.colorPrimario = colorPrimario;
    if (colorSecundario) negocio.configuracionVisual.colorSecundario = colorSecundario;
    if (logo !== undefined) negocio.configuracionVisual.logo = logo;
    if (fondo !== undefined) negocio.configuracionVisual.fondo = fondo;
    await negocio.save();

    res.json({ mensaje: 'Configuración actualizada exitosamente', configuracion: negocio.configuracionVisual });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la configuración del negocio' });
  }
};

// ───────────────────────────────────────────────
// RUTAS ADMIN – Gestión completa de negocios
// ───────────────────────────────────────────────

// Listar todos los negocios con conteo de peluqueros
export const obtenerTodosNegocios = async (req, res) => {
  try {
    const negocios = await Negocio.find().sort({ createdAt: -1 });

    const negociosConDatos = await Promise.all(
      negocios.map(async (negocio) => {
        const peluqueros = await Usuario.countDocuments({
          rol: 'peluquero',
          negocioId: negocio._id
        });
        const reservas = await Reserva.countDocuments({ negocioId: negocio._id });
        return {
          ...negocio.toObject(),
          totalPeluqueros: peluqueros,
          totalReservas: reservas
        };
      })
    );

    res.json({ negocios: negociosConDatos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener negocios' });
  }
};

// Crear negocio desde el admin
export const crearNegocio = async (req, res) => {
  try {
    const { nombre, slug, email, estado } = req.body;

    if (!nombre || !slug) {
      return res.status(400).json({ error: 'Nombre y slug son requeridos' });
    }

    const slugLimpio = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const existe = await Negocio.findOne({ slug: slugLimpio });
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un negocio con ese slug' });
    }

    const negocio = await Negocio.create({
      nombre,
      slug: slugLimpio,
      email: email || '',
      estado: estado || 'activo'
    });

    res.status(201).json({ mensaje: 'Negocio creado exitosamente', negocio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Editar negocio
export const editarNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, slug, email, estado } = req.body;

    const negocio = await Negocio.findById(id);
    if (!negocio) return res.status(404).json({ error: 'Negocio no encontrado' });

    if (nombre) negocio.nombre = nombre;
    if (email !== undefined) negocio.email = email;
    if (estado) negocio.estado = estado;
    if (slug) {
      const slugLimpio = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      const existe = await Negocio.findOne({ slug: slugLimpio, _id: { $ne: id } });
      if (existe) return res.status(400).json({ error: 'Ese slug ya está en uso' });
      negocio.slug = slugLimpio;
    }

    await negocio.save();
    res.json({ mensaje: 'Negocio actualizado', negocio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar negocio
export const eliminarNegocio = async (req, res) => {
  try {
    const { id } = req.params;

    const reservasActivas = await Reserva.countDocuments({
      negocioId: id,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (reservasActivas > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: tiene ${reservasActivas} reserva(s) activa(s)`
      });
    }

    await Negocio.findByIdAndDelete(id);
    res.json({ mensaje: 'Negocio eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Activar / Desactivar negocio
export const toggleEstadoNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Toggle negocio: ${id}`);

    const negocio = await Negocio.findById(id);
    if (!negocio) return res.status(404).json({ error: 'Negocio no encontrado' });

    // Si el campo estado no existe en el documento (datos viejos), lo tratamos como 'activo'
    const estadoActual = negocio.estado || 'activo';
    negocio.estado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    await negocio.save();

    console.log(`✅ Negocio ${negocio.nombre} → ${negocio.estado}`);
    res.json({
      mensaje: `Negocio ${negocio.estado === 'activo' ? 'activado' : 'desactivado'} correctamente`,
      estado: negocio.estado
    });
  } catch (error) {
    console.error('Error toggle negocio:', error);
    res.status(500).json({ error: error.message });
  }
};

