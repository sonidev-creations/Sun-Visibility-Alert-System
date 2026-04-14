import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  alertId: { type: Number, required: true },
  location: { type: String, required: true },
  time: { type: Date, required: true },
  status: { type: String, enum: ["active", "inactive"], required: true },
  message: { type: String, required: true },
});

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
