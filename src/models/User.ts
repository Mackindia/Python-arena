import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
  role: {
    type: String,
    default: "student",
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