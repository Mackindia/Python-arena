import mongoose from "mongoose";

const TimetableSchema = new mongoose.Schema({
  class: { type: String, required: true },
  section: { type: String, required: true },
  group: { type: String, default: "MAIN", enum: ["MAIN", "AI", "FP", "FL"] },
  day: { type: String, required: true }, // e.g., "Monday", "Tuesday"
  period_no: { type: Number, required: true },
  subject: { type: String, required: true },
  teacher_id: { type: String, required: true }, // Links to Teacher.teacher_id
  teacher_name: { type: String }
});

export default mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);
