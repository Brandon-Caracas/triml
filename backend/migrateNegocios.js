import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Negocio from './models/Negocio.js';
import Usuario from './models/Usuario.js';
import Reserva from './models/Reserva.js';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peluqueria_saas');
    console.log('✅ Conectado a MongoDB para migración');

    let defaultNegocio = await Negocio.findOne({ slug: 'default' });
    if (!defaultNegocio) {
      defaultNegocio = await Negocio.create({
        nombre: 'Peluquería Estándar',
        slug: 'default',
        configuracionVisual: {
          colorPrimario: '#4f46e5',
          colorSecundario: '#0f172a',
          logo: '',
          fondo: ''
        }
      });
      console.log('✅ Negocio default creado');
    }

    const peluqueros = await Usuario.find({ rol: 'peluquero', negocioId: { $exists: false } });
    for (const peluquero of peluqueros) {
      peluquero.negocioId = defaultNegocio._id;
      await peluquero.save();
    }
    console.log(`✅ ${peluqueros.length} peluqueros migrados al negocio default`);

    const admin = await Usuario.findOne({ rol: 'admin', negocioId: { $exists: false } });
    if(admin) {
        admin.negocioId = defaultNegocio._id;
        await admin.save();
        console.log(`✅ Admin migrado al negocio default`);
    }

    const reservas = await Reserva.find({ negocioId: { $exists: false } });
    for (const reserva of reservas) {
      reserva.negocioId = defaultNegocio._id;
      await reserva.save();
    }
    console.log(`✅ ${reservas.length} reservas migradas al negocio default`);

    console.log('🎉 Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
};

migrate();
