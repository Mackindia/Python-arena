import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { commonSchemaOptions, toSlug } from "./shared";

const SubjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: "", trim: true },
  },
  commonSchemaOptions,
);

SubjectSchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = toSlug(this.name);
  }
});

SubjectSchema.index({ name: "text", description: "text" });

export type SubjectDocument = InferSchemaType<typeof SubjectSchema> & {
  _id: Types.ObjectId;
};

const SubjectModel =
  (mongoose.models.Subject as Model<SubjectDocument>) ||
  mongoose.model<SubjectDocument>("Subject", SubjectSchema);

export default SubjectModel;
