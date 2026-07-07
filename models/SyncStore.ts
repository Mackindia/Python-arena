import mongoose from "mongoose";

const SyncStoreSchema = new mongoose.Schema({
  version: { type: Number, default: 0 },
  updatedAt: { type: Number, default: Date.now },
  updatedBy: { type: String, default: null },
  timetables: { type: mongoose.Schema.Types.Mixed, default: null },
  teachers: { type: [String], default: null },
  teacherSubjectMap: { type: mongoose.Schema.Types.Mixed, default: null },
  loadMaster: { type: mongoose.Schema.Types.Mixed, default: null },
  masterClasses: { type: mongoose.Schema.Types.Mixed, default: null },
  substitutions: { type: mongoose.Schema.Types.Mixed, default: null },
  absentTeachers: { type: mongoose.Schema.Types.Mixed, default: null },
  addedTeachers: { type: mongoose.Schema.Types.Mixed, default: null },
  deletedTeachers: { type: mongoose.Schema.Types.Mixed, default: null },
});

export default mongoose.models.SyncStore || mongoose.model("SyncStore", SyncStoreSchema);
