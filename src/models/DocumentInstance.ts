import mongoose from "mongoose";

/**
 * DocumentInstance — A teacher's personal copy of a template.
 *
 * Each teacher gets their own instance per template.  This is the "Google Docs"
 * model: everyone works on their own copy of the shared format.
 *
 * Access rules (enforced at the API layer):
 *   - syllabus / holiday-homework → owner (teacher) + any admin can edit
 *   - question-paper → only the teacher mapped to that subject via Timetable, or admin
 */
const DocumentInstanceSchema = new mongoose.Schema(
  {
    /** Reference to the template this was cloned from */
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocumentTemplate",
      required: true,
    },

    /** Category — denormalised from template for quick filtering */
    type: {
      type: String,
      required: true,
      enum: ["syllabus", "holiday-homework", "question-paper"],
    },

    /** The teacher's Clerk userId who owns this document */
    ownerId: { type: String, required: true, index: true },

    /** Owner's display name (denormalised for list views) */
    ownerName: { type: String, default: "" },

    /**
     * For question-paper only: the subject + class this paper is for.
     * Pulled from the Timetable teacher-subject mapping.
     */
    subject: { type: String, default: "" },
    className: { type: String, default: "" },

    /** The actual edited rich-text content (TipTap HTML) */
    content: { type: String, required: true },

    /** Status */
    status: {
      type: String,
      default: "draft",
      enum: ["draft", "in-progress", "submitted", "approved"],
    },

    /** Title — auto-generated or teacher-set */
    title: { type: String, default: "" },

    /** Last editor (for audit trail) */
    lastEditedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

// Indexes for common query patterns
DocumentInstanceSchema.index({ ownerId: 1, type: 1 });
DocumentInstanceSchema.index({ type: 1, subject: 1, className: 1 });
DocumentInstanceSchema.index({ template: 1, ownerId: 1 }, { unique: true });

export default mongoose.models.DocumentInstance ||
  mongoose.model("DocumentInstance", DocumentInstanceSchema);
