import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

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
    select: false,
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
    type: String,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    default: "approved",
    enum: ["pending", "approved", "rejected"],
  },
  passwordHashVersion: {
    type: Number,
    default: 1,
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

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  if (this.password.startsWith("$2b$") || this.password.startsWith("$2a$")) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  this.passwordHashVersion = 1;
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model("User", UserSchema);