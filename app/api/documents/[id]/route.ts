import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getRequestUserContext, ADMIN_PANEL_ROLES, hasAllowedRole } from "@/lib/rbac";
import DocumentInstance from "@/src/models/DocumentInstance";
import Timetable from "@/models/Timetable";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/documents/[id]
 * Fetch a single document instance with access control.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await getRequestUserContext();
    if (!ctx.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const doc = await DocumentInstance.findById(id)
      .populate("template", "name type sourceFileUrl")
      .lean() as {
      _id: unknown;
      ownerId: string;
      type: string;
      subject: string;
      content: string;
      [key: string]: unknown;
    } | null;

    if (!doc) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    // Access control
    const isAdmin = hasAllowedRole(ctx.role, ["super_admin", "admin"]);
    const isOwner = doc.ownerId === ctx.userId;

    if (doc.type === "question-paper" && !isOwner && !isAdmin) {
      // Check timetable mapping
      const teacherId = (ctx.dbUser as { teacher_id?: string } | null)?.teacher_id;
      if (!teacherId) {
        return NextResponse.json({ message: "Access denied" }, { status: 403 });
      }
      const mapped = await Timetable.findOne({
        teacher_id: teacherId,
        subject: { $regex: new RegExp(`^${doc.subject}$`, "i") },
      }).lean();
      if (!mapped) {
        return NextResponse.json({ message: "Access denied: not mapped to this subject" }, { status: 403 });
      }
    } else if (!isOwner && !isAdmin) {
      // Syllabus / holiday-homework: only owner + admin
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ document: doc });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch document", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/documents/[id]
 * Update document content (auto-save from editor).
 * Body: { content, title?, status? }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await getRequestUserContext();
    if (!ctx.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const doc = await DocumentInstance.findById(id).lean() as {
      _id: unknown;
      ownerId: string;
      type: string;
      subject: string;
      [key: string]: unknown;
    } | null;

    if (!doc) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    // Access control (same rules as GET)
    const isAdmin = hasAllowedRole(ctx.role, ["super_admin", "admin"]);
    const isOwner = doc.ownerId === ctx.userId;

    if (doc.type === "question-paper" && !isOwner && !isAdmin) {
      const teacherId = (ctx.dbUser as { teacher_id?: string } | null)?.teacher_id;
      if (!teacherId) {
        return NextResponse.json({ message: "Access denied" }, { status: 403 });
      }
      const mapped = await Timetable.findOne({
        teacher_id: teacherId,
        subject: { $regex: new RegExp(`^${doc.subject}$`, "i") },
      }).lean();
      if (!mapped) {
        return NextResponse.json({ message: "Access denied" }, { status: 403 });
      }
    } else if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { content, title, status } = body as {
      content?: string;
      title?: string;
      status?: string;
    };

    const update: Record<string, unknown> = { lastEditedBy: ctx.userId };
    if (content !== undefined) update.content = content;
    if (title !== undefined) update.title = title;
    if (status && ["draft", "in-progress", "submitted", "approved"].includes(status)) {
      update.status = status;
    }

    const updated = await DocumentInstance.findByIdAndUpdate(id, update, { new: true }).lean();

    return NextResponse.json({ message: "Document saved", document: updated });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to save document", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document (owner or admin only).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await getRequestUserContext();
    if (!ctx.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const doc = await DocumentInstance.findById(id).lean() as {
      _id: unknown;
      ownerId: string;
      [key: string]: unknown;
    } | null;

    if (!doc) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    const isAdmin = hasAllowedRole(ctx.role, ["super_admin", "admin"]);
    if (doc.ownerId !== ctx.userId && !isAdmin) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    await DocumentInstance.findByIdAndDelete(id);

    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete document", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
