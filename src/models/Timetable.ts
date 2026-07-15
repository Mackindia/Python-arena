import mongoose from "mongoose";

const TimetableLockSchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true },
  // Legacy field - kept for backward compatibility
  isLocked: { type: Boolean, default: true },
  // NEW: Status-based lock (draft = can edit, frozen = cannot edit)
  status: { 
    type: String, 
    enum: ["draft", "frozen"], 
    default: "frozen"  // DEFAULT: Frozen (safe - no accidental changes)
  },
  // Freeze tracking
  frozenAt: { type: Date, default: Date.now },
  frozenBy: { type: String, default: "system" },
  // Unfreeze tracking
  unfrozenAt: { type: Date, default: null },
  unfrozenBy: { type: String, default: null },
  // Version tracking
  version: { type: Number, default: 1 },
  lastModified: { type: Date, default: Date.now },
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
