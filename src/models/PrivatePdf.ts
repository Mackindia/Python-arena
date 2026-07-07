import mongoose, { Document } from "mongoose";

export interface IPrivatePdf extends Document {
  title: string;
  fileName: string;
  url: string;
  publicId: string;
  size: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrivatePdfSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PrivatePdf ||
  mongoose.model<IPrivatePdf>("PrivatePdf", PrivatePdfSchema);
