import mongoose from 'mongoose';
import Usuario from './models/Usuario.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peluqueria_saas');
    console.log('🌱 Conectado a MongoDB para seed...');

    const adminExistente = await Usuario.findOne({ email: 'admin@peluqueria.com' });
    
    if (adminExistente) {
      console.log('✅ El admin ya existe.');
    } else {
      const admin = new Usuario({
        nombre: 'Administrador Principal',
        email: 'admin@peluqueria.com',
        telefono: '000000000',
        contraseña: 'admin123',
        rol: 'admin',
        estado: 'activo'
      });

      await admin.save();
      console.log('🚀 Admin creado exitosamente:');
      console.log('📧 Email: admin@peluqueria.com');
      console.log('🔑 Pass: admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedAdmin();
