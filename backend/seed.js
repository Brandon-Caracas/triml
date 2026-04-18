// Seed de datos de prueba para la base de datos

import Usuario from './models/Usuario.js';
import Servicio from './models/Servicio.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peluqueria_saas');

    console.log('🗄️ Limpiando datos anteriores...');
    await Usuario.deleteMany({});
    await Servicio.deleteMany({});

    console.log('👤 Creando usuarios de prueba...');

    // Admin
    const admin = await Usuario.create({
      nombre: 'Admin Jefe',
      email: 'admin@peluqueria.com',
      telefono: '+34 600 000 000',
      contraseña: 'admin123',
      rol: 'admin',
      estado: 'activo'
    });
    console.log('✅ Admin creado: admin@peluqueria.com');

    // Peluqueros
    const peluquero1 = await Usuario.create({
      nombre: 'Juan Cortés',
      email: 'juan@peluqueria.com',
      telefono: '+34 612 345 678',
      contraseña: 'peluquero123',
      rol: 'peluquero',
      estado: 'activo',
      suscripcionActiva: true,
      fechaExpiracionSuscripcion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      salon: 'Salón Juan Cortés',
      direccion: 'Calle Principal 123, Madrid',
      horarioLaboral: {
        lunes: { inicio: '09:00', fin: '18:00' },
        martes: { inicio: '09:00', fin: '18:00' },
        miercoles: { inicio: '09:00', fin: '18:00' },
        jueves: { inicio: '09:00', fin: '18:00' },
        viernes: { inicio: '09:00', fin: '20:00' },
        sabado: { inicio: '10:00', fin: '14:00' },
        domingo: { inicio: '', fin: '' }
      }
    });
    console.log('✅ Peluquero 1 creado: juan@peluqueria.com');

    const peluquero2 = await Usuario.create({
      nombre: 'María García',
      email: 'maria@peluqueria.com',
      telefono: '+34 655 123 456',
      contraseña: 'peluquero123',
      rol: 'peluquero',
      estado: 'activo',
      suscripcionActiva: true,
      fechaExpiracionSuscripcion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      salon: 'Salón María Beauty',
      direccion: 'Avenida Central 456, Barcelona'
    });
    console.log('✅ Peluquero 2 creado: maria@peluqueria.com');

    // Clientes
    const cliente1 = await Usuario.create({
      nombre: 'Pedro López',
      email: 'pedro@email.com',
      telefono: '+34 688 999 111',
      contraseña: 'cliente123',
      rol: 'cliente',
      estado: 'activo'
    });
    console.log('✅ Cliente 1 creado: pedro@email.com');

    const cliente2 = await Usuario.create({
      nombre: 'Ana Martínez',
      email: 'ana@email.com',
      telefono: '+34 677 222 333',
      contraseña: 'cliente123',
      rol: 'cliente',
      estado: 'activo'
    });
    console.log('✅ Cliente 2 creado: ana@email.com');

    console.log('✂️ Creando servicios...');

    // Servicios de Juan
    await Servicio.create([
      {
        nombre: 'Corte Clásico',
        descripcion: 'Corte tradicional para caballero',
        precio: 25,
        duracion: 30,
        peluquero: peluquero1._id,
        activo: true
      },
      {
        nombre: 'Corte Moderno',
        descripcion: 'Corte con estilos actuales',
        precio: 35,
        duracion: 40,
        peluquero: peluquero1._id,
        activo: true
      },
      {
        nombre: 'Barba Completa',
        descripcion: 'Afeitado y perfilado de barba',
        precio: 15,
        duracion: 20,
        peluquero: peluquero1._id,
        activo: true
      },
      {
        nombre: 'Paquete Completo',
        descripcion: 'Corte + Barba',
        precio: 40,
        duracion: 50,
        peluquero: peluquero1._id,
        activo: true
      }
    ]);
    console.log('✅ Servicios de Juan creados');

    // Servicios de María
    await Servicio.create([
      {
        nombre: 'Corte Caballero',
        descripcion: 'Corte profesional',
        precio: 20,
        duracion: 30,
        peluquero: peluquero2._id,
        activo: true
      },
      {
        nombre: 'Corte Dama',
        descripcion: 'Corte y peinado',
        precio: 40,
        duracion: 45,
        peluquero: peluquero2._id,
        activo: true
      },
      {
        nombre: 'Tinte Cabello',
        descripcion: 'Tinte de calidad superior',
        precio: 60,
        duracion: 90,
        peluquero: peluquero2._id,
        activo: true
      },
      {
        nombre: 'Peinado Ocasión',
        descripcion: 'Peinado especial para eventos',
        precio: 50,
        duracion: 60,
        peluquero: peluquero2._id,
        activo: true
      }
    ]);
    console.log('✅ Servicios de María creados');

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Base de datos inicializada exitosamente');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('👤 Credentials para Login:');
    console.log('');
    console.log('Admin:');
    console.log('  Email: admin@peluqueria.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Peluquero:');
    console.log('  Email: juan@peluqueria.com');
    console.log('  Password: peluquero123');
    console.log('');
    console.log('Cliente:');
    console.log('  Email: pedro@email.com');
    console.log('  Password: cliente123');
    console.log('');
    console.log('═══════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error inicializando BD:', error);
    process.exit(1);
  }
};

seedDatabase();
