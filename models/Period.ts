import mongoose from "mongoose";

const PeriodSchema = new mongoose.Schema({
  period_no: { type: Number, required: true, unique: true },
  start_time: { type: String, required: true }, // Format HH:MM (e.g., "09:00")
  end_time: { type: String, required: true },   // Format HH:MM
});

export default mongoose.models.Period || mongoose.model("Period", PeriodSchema);
