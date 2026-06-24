import mongoose, { Schema, Document } from "mongoose";

export interface IWorkflowStage {
  stageId: string;
  stageName: string;
  actionType: "planning" | "generation" | "review_graph" | "refinement" | "execution";
  recommendedModel: string;
  estimatedTokens: number;
  dependsOn: string[];
  transitionLogic: string;
}

export interface IWorkflowRecommendation extends Document {
  promptPreview: string;
  complexityScore: number;
  stages: IWorkflowStage[];
  estimatedTotalTimeMs: number;
  totalEstimatedTokens: number;
  userFeedbackRating?: number;
  isExecuted: boolean; // False until Phase 2.5
  userId?: string;
}

const WorkflowStageSchema = new Schema<IWorkflowStage>({
  stageId: { type: String, required: true },
  stageName: { type: String, required: true },
  actionType: { type: String, required: true },
  recommendedModel: { type: String, required: true },
  estimatedTokens: { type: Number, default: 0 },
  dependsOn: [{ type: String }],
  transitionLogic: { type: String }
});

const WorkflowRecommendationSchema = new Schema<IWorkflowRecommendation>({
  promptPreview: { type: String, required: true },
  complexityScore: { type: Number, required: true },
  stages: [WorkflowStageSchema],
  estimatedTotalTimeMs: { type: Number, default: 0 },
  totalEstimatedTokens: { type: Number, default: 0 },
  userFeedbackRating: { type: Number, min: 1, max: 5 },
  isExecuted: { type: Boolean, default: false },
  userId: { type: String }
}, { timestamps: true });

export default mongoose.models.WorkflowRecommendation || mongoose.model<IWorkflowRecommendation>("WorkflowRecommendation", WorkflowRecommendationSchema);
