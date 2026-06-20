import mongoose, { Schema, Document } from "mongoose";

export interface IRecommendationHistory extends Document {
  promptPreview: string;
  analysis: {
    taskClassification: string;
    complexityScore: number;
    reasoningScore: number;
    codingScore: number;
    contextScore: number;
    agenticScore: number;
    repositoryImpactScore: number;
  };
  recommendations: {
    quality: string;
    speed: string;
    quota: string;
    balanced: string;
  };
  // Phase 2.1 Validation Fields
  actualModelUsed?: string;
  successRating?: number; // 1 to 5
  userFeedback?: string;
  completionTimeMs?: number;
  isAccurate?: boolean; // Evaluated true if actualModelUsed matched the target recommendation

  savedTokens: number;
  userId?: string;
}

const RecommendationHistorySchema = new Schema<IRecommendationHistory>({
  promptPreview: { type: String, required: true },
  analysis: {
    taskClassification: { type: String, default: "general" },
    complexityScore: { type: Number, default: 0 },
    reasoningScore: { type: Number, default: 0 },
    codingScore: { type: Number, default: 0 },
    contextScore: { type: Number, default: 0 },
    agenticScore: { type: Number, default: 0 },
    repositoryImpactScore: { type: Number, default: 0 },
  },
  recommendations: {
    quality: { type: String, required: true },
    speed: { type: String, required: true },
    quota: { type: String, required: true },
    balanced: { type: String, required: true },
  },
  actualModelUsed: { type: String },
  successRating: { type: Number, min: 1, max: 5 },
  userFeedback: { type: String },
  completionTimeMs: { type: Number },
  isAccurate: { type: Boolean },
  savedTokens: { type: Number, default: 0 },
  userId: { type: String }
}, { timestamps: true });

export default mongoose.models.RecommendationHistory || mongoose.model<IRecommendationHistory>("RecommendationHistory", RecommendationHistorySchema);
