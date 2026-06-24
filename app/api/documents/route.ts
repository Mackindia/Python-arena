import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getRequestUserContext, ADMIN_PANEL_ROLES, hasAllowedRole } from "@/lib/rbac";
import DocumentTemplate from "@/src/models/DocumentTemplate";
import DocumentInstance from "@/src/models/DocumentInstance";
import Timetable from "@/models/Timetable";

export const runtime = "nodejs";

/**
 * GET /api/documents
 * List the current user's documents.
 * Query params: ?type=syllabus|holiday-homework|question-paper
 *
 * Admins see all documents; teachers see only their own.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestUserContext();
    if (!ctx.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const type = request.nextUrl.searchParams.get("type") || "";
    const all = request.nextUrl.searchParams.get("all") === "true";

    const query: Record<string, unknown> = {};

    if (type && ["syllabus", "holiday-homework", "question-paper"].includes(type)) {
      query.type = type;
    }

    // Admins can view all documents; teachers only their own
    const isAdmin = hasAllowedRole(ctx.role, ["super_admin", "admin"]);
    if (!isAdmin || !all) {
      query.ownerId = ctx.userId;
    }

    const documents = await DocumentInstance.find(query)
      .populate("template", "name type sourceFileUrl")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch documents", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/documents
 * Create a new document instance from a template.
 * Body: { templateId, subject?, className?, title? }
 *
 * For question-paper: verifies the teacher is mapped to the subject via Timetable.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getRequestUserContext();
    if (!ctx.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!hasAllowedRole(ctx.role, ADMIN_PANEL_ROLES)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { templateId, subject, className, title } = body as {
      templateId?: string;
      subject?: string;
      className?: string;
      title?: string;
    };

    if (!templateId) {
      return NextResponse.json({ message: "Template ID is required" }, { status: 400 });
    }

    const template = await DocumentTemplate.findById(templateId).lean() as {
      _id: unknown;
      name: string;
      type: string;
      content: string;
      active: boolean;
    } | null;

    if (!template || !template.active) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Check for existing instance (prevent duplicates)
    const existingQuery: Record<string, unknown> = {
      template: templateId,
      ownerId: ctx.userId,
    };
    if (template.type === "question-paper" && subject) {
      existingQuery.subject = subject;
      existingQuery.className = className || "";
    }

    const existing = await DocumentInstance.findOne(existingQuery).lean();
    if (existing) {
      return NextResponse.json({
        message: "Document already exists",
        document: existing,
      });
    }

    // For question-paper: verify teacher-subject mapping
    if (template.type === "question-paper") {
      if (!subject) {
        return NextResponse.json({ message: "Subject is required for question papers" }, { status: 400 });
      }

      const isAdmin = hasAllowedRole(ctx.role, ["super_admin", "admin"]);

      if (!isAdmin) {
        // Get teacher_id from the User's dbUser
        const teacherId = (ctx.dbUser as { teacher_id?: string } | null)?.teacher_id;

        if (!teacherId) {
          return NextResponse.json(
            { message: "Your account is not linked to a teacher ID. Contact admin." },
            { status: 403 },
          );
        }

        // Check if this teacher is mapped to this subject in the timetable
        const timetableEntry = await Timetable.findOne({
          teacher_id: teacherId,
          subject: { $regex: new RegExp(`^${subject}$`, "i") },
        }).lean();

        if (!timetableEntry) {
          return NextResponse.json(
            { message: "You are not mapped to this subject. Only the assigned teacher or admin can create this question paper." },
            { status: 403 },
          );
        }
      }
    }

    const ownerName = (ctx.dbUser as { fullName?: string } | null)?.fullName || "";

    const instance = await DocumentInstance.create({
      template: templateId,
      type: template.type,
      ownerId: ctx.userId,
      ownerName,
      subject: subject || "",
      className: className || "",
      content: template.content,
      title: title || `${template.name} - ${ownerName}`,
      lastEditedBy: ctx.userId,
    });

    return NextResponse.json({ message: "Document created", document: instance }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create document", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
