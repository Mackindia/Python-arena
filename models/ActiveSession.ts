import mongoose from "mongoose";

const ActiveSessionSchema = new mongoose.Schema({
  class: { type: String, required: true },
  section: { type: String, required: true },
  group: { type: String, default: "MAIN", enum: ["MAIN", "AI", "FP", "FL"] },
  subject: { type: String, required: true },
  teacher_id: { type: String, required: true },
  meet_link: { type: String, required: true },
  period_no: { type: Number, required: true },
  is_active: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export default mongoose.models.ActiveSession || mongoose.model("ActiveSession", ActiveSessionSchema);
