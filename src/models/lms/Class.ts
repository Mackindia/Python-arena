import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { commonSchemaOptions, toSlug } from "./shared";

const ClassSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
  },
  commonSchemaOptions,
);

ClassSchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = toSlug(this.name);
  }
});

ClassSchema.index({ subject: 1, slug: 1 }, { unique: true });
ClassSchema.index({ name: "text", slug: "text" });

export type ClassDocument = InferSchemaType<typeof ClassSchema> & {
  _id: Types.ObjectId;
};

const ClassModel =
  (mongoose.models.Class as Model<ClassDocument>) ||
  mongoose.model<ClassDocument>("Class", ClassSchema);

export default ClassModel;
