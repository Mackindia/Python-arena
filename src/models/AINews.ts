import mongoose, { Schema, Document } from "mongoose";

export interface IAINews extends Document {
  title: string;
  description: string;
  image: string;
  link: string;
  publishedAt: Date;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AINewsSchema = new Schema<IAINews>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "Latest AI industry update",
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=60",
    },
    link: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    fetchedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize for newest sorting
AINewsSchema.index({ publishedAt: -1 });

export default mongoose.models.AINews || mongoose.model<IAINews>("AINews", AINewsSchema);
