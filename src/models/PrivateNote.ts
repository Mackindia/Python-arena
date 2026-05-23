import mongoose, { Schema, Document } from "mongoose";

export interface IPrivateNote extends Document {
  ownerId: string;
  title: string;
  content: string;
}

const PrivateNoteSchema: Schema = new Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent stale schema issues during Next.js dev hot reload.
if (mongoose.models.PrivateNote) {
  delete mongoose.models.PrivateNote;
}

const PrivateNote = mongoose.model<IPrivateNote>("PrivateNote", PrivateNoteSchema);

export default PrivateNote;