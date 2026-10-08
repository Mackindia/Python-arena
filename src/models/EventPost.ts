import mongoose, { Schema } from "mongoose";

export const POST_STATUSES = [
  "draft",
  "generating",
  "pending_review",
  "approved",
  "publishing",
  "published",
  "failed",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

const EventPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, default: "", trim: true },
    eventDate: { type: Date, default: null },
    venue: { type: String, default: "", trim: true },
    tagline: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: ["science", "sports", "cultural", "exam", "generic"],
      default: "generic",
    },
    seed: { type: Number, default: 0 },
    graphics: { type: String, enum: ["svg", "ai"], default: "svg" },
    backgroundPrompt: { type: String, default: "", trim: true },
    status: { type: String, enum: POST_STATUSES, default: "draft", index: true },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    caption: { type: String, default: "" },
    hashtags: { type: [String], default: [] },
    error: { type: String, default: "" },
    attempts: { type: Number, default: 0 },
    igMediaId: { type: String, default: "" },
    igPermalink: { type: String, default: "" },
    publishedAt: { type: Date, default: null },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

EventPostSchema.index({ title: "text", caption: "text" });

export default mongoose.models.EventPost || mongoose.model("EventPost", EventPostSchema);
