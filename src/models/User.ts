import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  image: {
    type: String,
    default: "",
  },
  studentClass: {
    type: String,
    default: "Class 11",
  },
  class: {
    type: String,
  },
  section: {
    type: String,
  },
  group: {
    type: String,
    default: "MAIN",
    enum: ["MAIN", "AI", "FP", "FL"],
  },
  role: {
    type: String,
    default: "student",
  },
  meet_link: {
    type: String,
  },
  teacher_id: {
    type: String, // E.g., 'AR', 'NM' - links to Timetable
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  enrolledCourses: {
    type: [String],
    default: [],
  },
  completedLessons: {
    type: [String],
    default: [],
  },
  savedLessons: {
    type: [String],
    default: [],
  },
  recentLessons: {
    type: [String],
    default: [],
  },
  watchHistory: {
    type: [String],
    default: [],
  },
  lastOpenedChapter: {
    type: String,
    default: "",
  },
  streakDays: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model("User", UserSchema);