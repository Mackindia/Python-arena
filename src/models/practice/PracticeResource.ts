import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { commonSchemaOptions, toSlug } from "../lms/shared";

const PracticeResourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    resourceType: {
      type: String,
      enum: ["question-paper", "sample-paper", "important-pdf", "worksheet", "other"],
      default: "question-paper",
      index: true,
    },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    fileUrl: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    published: { type: Boolean, default: false, index: true },
  },
  commonSchemaOptions,
);

PracticeResourceSchema.pre("validate", function () {
  if (!this.slug && this.title) {
    this.slug = toSlug(this.title);
  }
});

PracticeResourceSchema.index({ subject: 1, class: 1, published: 1, createdAt: -1 });
PracticeResourceSchema.index({ class: 1, slug: 1 }, { unique: true });
PracticeResourceSchema.index({ title: "text", description: "text" });

export type PracticeResourceDocument = InferSchemaType<typeof PracticeResourceSchema> & {
  _id: Types.ObjectId;
};

const PracticeResourceModel =
  (mongoose.models.PracticeResource as Model<PracticeResourceDocument>) ||
  mongoose.model<PracticeResourceDocument>("PracticeResource", PracticeResourceSchema, "practice_resources");

export default PracticeResourceModel;
