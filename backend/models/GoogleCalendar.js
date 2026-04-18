import mongoose from 'mongoose';

const googleCalendarSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  access_token: {
    type: String,
    required: true
  },
  refresh_token: String,
  token_expiry: Date,
  calendar_id: String,
  sincronizado: {
    type: Boolean,
    default: false
  },
  ultima_sincronizacion: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('GoogleCalendar', googleCalendarSchema);
