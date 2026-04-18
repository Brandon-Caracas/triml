import mongoose from 'mongoose';
import Usuario from './backend/models/Usuario.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await Usuario.find({});
        console.log('Total users:', users.length);
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.rol}, Status: ${u.estado}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
