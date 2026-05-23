import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  student_id: { type: String, required: true }, // clerkId of student
  class: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true },
  period_no: { type: Number, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  join_time: { type: Date, default: Date.now },
});

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
