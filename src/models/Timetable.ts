import mongoose from "mongoose";

const TimetableSchema = new mongoose.Schema({
  class: { type: String, required: true },
  section: { type: String, required: true },
  day: { type: String, required: true }, // e.g., "Monday", "Tuesday"
  period_no: { type: Number, required: true },
  subject: { type: String, required: true },
  teacher_id: { type: String, required: true }, // Links to Teacher.teacher_id
});

export default mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);
