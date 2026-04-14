import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },  // E.164 format: +91XXXXXXXXXX
  smsOptIn: { type: Boolean, default: true }
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export default Subscriber;
