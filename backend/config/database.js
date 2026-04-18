import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peluqueria_saas');
    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error conectando a la BD: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
