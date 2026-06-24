import mongoose, { Schema, Document } from "mongoose";

export interface IRecommendationBenchmark extends Document {
  prompt: string;
  expectedModel: string;
  category: string;
  complexityTarget: number;
  tags: string[];
}

const RecommendationBenchmarkSchema = new Schema<IRecommendationBenchmark>({
  prompt: { type: String, required: true },
  expectedModel: { type: String, required: true },
  category: { type: String, required: true },
  complexityTarget: { type: Number, required: true },
  tags: [{ type: String }]
}, { timestamps: true });

export default mongoose.models.RecommendationBenchmark || mongoose.model<IRecommendationBenchmark>("RecommendationBenchmark", RecommendationBenchmarkSchema);
