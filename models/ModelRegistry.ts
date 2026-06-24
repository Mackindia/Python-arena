import mongoose, { Schema, Document } from "mongoose";

export interface IModelRegistry extends Document {
  name: string;
  provider: string;
  reasoningScore: number;
  codingScore: number;
  architectureScore: number;
  speedScore: number;
  quotaEfficiencyScore: number;
  contextScore: number;
  bestUseCases: string[];
  worstUseCases: string[];
  isActive: boolean;
}

const ModelRegistrySchema = new Schema<IModelRegistry>({
  name: { type: String, required: true, unique: true },
  provider: { type: String, required: true },
  reasoningScore: { type: Number, default: 0 },
  codingScore: { type: Number, default: 0 },
  architectureScore: { type: Number, default: 0 },
  speedScore: { type: Number, default: 0 },
  quotaEfficiencyScore: { type: Number, default: 0 },
  contextScore: { type: Number, default: 0 },
  bestUseCases: [{ type: String }],
  worstUseCases: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.ModelRegistry || mongoose.model<IModelRegistry>("ModelRegistry", ModelRegistrySchema);
