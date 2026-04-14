import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Alert from './models/alert.js';

dotenv.config();

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ MongoDB connected');

  const data = JSON.parse(fs.readFileSync('alerts.json', 'utf-8'));

  await Alert.insertMany(data);
  console.log('✅ Data inserted successfully');

  process.exit(0);
})
.catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
