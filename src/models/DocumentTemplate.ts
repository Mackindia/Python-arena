import mongoose from "mongoose";

/**
 * DocumentTemplate — Admin-uploaded format templates.
 *
 * Types:
 *   - syllabus       → Any teacher can create their own instance
 *   - holiday-homework → Any teacher can create their own instance
 *   - question-paper → Only the teacher mapped to that subject (via Timetable) or admin
 */
const DocumentTemplateSchema = new mongoose.Schema(
  {
    /** Human-readable name shown in the dropdown, e.g. "Session 2026 Syllabus Format" */
    name: { type: String, required: true, trim: true },

    /** Document category */
    type: {
      type: String,
      required: true,
      enum: ["syllabus", "holiday-homework", "question-paper"],
    },

    /** Rich-text HTML content of the blank template (TipTap JSON or HTML) */
    content: { type: String, required: true },

    /** Optional: the raw PDF/DOCX URL uploaded by admin (for reference) */
    sourceFileUrl: { type: String, default: "" },

    /** Who uploaded it */
    createdBy: { type: String, required: true },

    /** Soft-active toggle */
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Compound index for quick lookups
DocumentTemplateSchema.index({ type: 1, active: 1 });

export default mongoose.models.DocumentTemplate ||
  mongoose.model("DocumentTemplate", DocumentTemplateSchema);
