import mongoose from "mongoose";

const TeacherSchema = new mongoose.Schema({
  teacher_id: { type: String, required: true, unique: true }, // Links to User clerkId
  teacher_name: { type: String, required: true },
  meet_link: { type: String, required: true }, // Permanent Google Meet Link
});

export default mongoose.models.Teacher || mongoose.model("Teacher", TeacherSchema);
