import mongoose from "mongoose";

const TimetableLockSchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true },
  isLocked: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

const TimetableSchema = new mongoose.Schema({
  class: { type: String, required: true },
  section: { type: String, required: true },
  day: { type: String, required: true }, // e.g., "Monday", "Tuesday"
  period_no: { type: Number, required: true },
  subject: { type: String, required: true },
  teacher_id: { type: String, required: true }, // Links to Teacher.teacher_id
  isLocked: { type: Boolean, default: false },
});

export const TimetableLock = mongoose.models.TimetableLock ||
  mongoose.model("TimetableLock", TimetableLockSchema);

export default mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);
