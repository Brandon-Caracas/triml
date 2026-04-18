import mongoose from 'mongoose';
import Usuario from './models/Usuario.js';
import Servicio from './models/Servicio.js';
import dotenv from 'dotenv';

dotenv.config();

const seedSaaS = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peluqueria_saas');
    console.log('🌱 Iniciando Seed Final para SaaS...');

    // 1. Crear Peluquero Estrella
    const emailPeluquero = 'pedro@barberia.com';
    let pedro = await Usuario.findOne({ email: emailPeluquero });
    
    if (!pedro) {
      pedro = new Usuario({
        nombre: 'Pedro Barber',
        email: emailPeluquero,
        telefono: '3001234567',
        contraseña: 'barber123',
        rol: 'peluquero',
        estado: 'activo',
        salon: 'Barbería "El Estilo"',
        suscripcionActiva: true
      });
      await pedro.save();
      console.log('✅ Peluquero "Pedro Barber" creado.');
    }

    // 2. Crear Catálogo de Cortes para Pedro
    const cortes = [
      { nombre: 'Fade', precio: 15, duracion: 30, imagen: 'https://images.unsplash.com/photo-1599351473299-d8395de67478?w=400&h=400&fit=crop' },
      { nombre: 'Degradado', precio: 12, duracion: 25, imagen: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop' },
      { nombre: 'Corte clásico', precio: 10, duracion: 20, imagen: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop' },
      { nombre: 'Barba', precio: 8, duracion: 15, imagen: 'https://images.unsplash.com/photo-1590540179852-2110a54f813a?w=400&h=400&fit=crop' }
    ];

    for (const corte of cortes) {
      const existe = await Servicio.findOne({ nombre: corte.nombre, peluquero: pedro._id });
      if (!existe) {
        await new Servicio({ ...corte, peluquero: pedro._id }).save();
        console.log(`✂️ Corte "${corte.nombre}" agregado al catálogo.`);
      }
    }

    console.log('🚀 Sistema SaaS listo para producción.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedSaaS();
