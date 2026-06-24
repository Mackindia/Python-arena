import mongoose, { Schema, Document } from "mongoose";

export interface IMedia extends Document {
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string; // 'image', 'audio', 'video'
  fileSize: number;
  createdAt: Date;
}

const MediaSchema = new Schema<IMedia>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Media = mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);
