import mongoose, { Schema, Document } from "mongoose";

export interface IReviewNode {
  reviewType: string;
  priority: number;
  recommendedModel: string;
  reasoning: string;
  estimatedTokens: number;
}

export interface IReviewGraphRecommendation extends Document {
  promptPreview: string;
  reviews: IReviewNode[];
  totalEstimatedReviewTokens: number;
  userId?: string;
}

const ReviewNodeSchema = new Schema<IReviewNode>({
  reviewType: { type: String, required: true },
  priority: { type: Number, required: true },
  recommendedModel: { type: String, required: true },
  reasoning: { type: String, required: true },
  estimatedTokens: { type: Number, default: 0 }
});

const ReviewGraphRecommendationSchema = new Schema<IReviewGraphRecommendation>({
  promptPreview: { type: String, required: true },
  reviews: [ReviewNodeSchema],
  totalEstimatedReviewTokens: { type: Number, default: 0 },
  userId: { type: String }
}, { timestamps: true });

export default mongoose.models.ReviewGraphRecommendation || mongoose.model<IReviewGraphRecommendation>("ReviewGraphRecommendation", ReviewGraphRecommendationSchema);
