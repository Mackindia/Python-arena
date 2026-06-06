import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import DocumentTemplate from "@/src/models/DocumentTemplate";

export const runtime = "nodejs";

/**
 * GET /api/admin/document-templates
 * List all templates, optionally filtered by ?type=syllabus|holiday-homework|question-paper
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) return access.response;

    await connectDB();

    const type = request.nextUrl.searchParams.get("type") || "";
    const query: Record<string, unknown> = { active: true };
    if (type && ["syllabus", "holiday-homework", "question-paper"].includes(type)) {
      query.type = type;
    }

    const templates = await DocumentTemplate.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch templates", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/document-templates
 * Create a new template (admin-only).
 * Body: { name, type, content, sourceFileUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) return access.response;

    // Only super_admin or admin can create templates
    if (access.role !== "super_admin" && access.role !== "admin") {
      return NextResponse.json({ message: "Only admins can create templates" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { name, type, content, sourceFileUrl } = body as {
      name?: string;
      type?: string;
      content?: string;
      sourceFileUrl?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ message: "Template name is required" }, { status: 400 });
    }
    if (!type || !["syllabus", "holiday-homework", "question-paper"].includes(type)) {
      return NextResponse.json({ message: "Invalid template type" }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ message: "Template content is required" }, { status: 400 });
    }

    const template = await DocumentTemplate.create({
      name: name.trim(),
      type,
      content,
      sourceFileUrl: sourceFileUrl || "",
      createdBy: access.userId,
    });

    return NextResponse.json({ message: "Template created", template }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create template", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/document-templates?id=...
 * Soft-delete a template.
 */
export async function DELETE(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) return access.response;

    if (access.role !== "super_admin" && access.role !== "admin") {
      return NextResponse.json({ message: "Only admins can delete templates" }, { status: 403 });
    }

    await connectDB();

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "Template ID is required" }, { status: 400 });
    }

    await DocumentTemplate.findByIdAndUpdate(id, { active: false });

    return NextResponse.json({ message: "Template deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete template", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
