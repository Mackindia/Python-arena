import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Course from "@/models/Course";

export async function GET() {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const courses = await Course.find().sort({ updatedAt: -1 }).lean();

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch courses", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();

    if (!body.title || !body.subject || !body.classLevel) {
      return NextResponse.json({ message: "title, subject, classLevel are required" }, { status: 400 });
    }

    await connectDB();

    const course = await Course.create({
      title: body.title,
      description: body.description ?? "",
      subject: body.subject,
      classLevel: body.classLevel,
      difficulty: body.difficulty ?? "beginner",
      thumbnail: body.thumbnail ?? "",
      category: body.category ?? "",
      chapters: Array.isArray(body.chapters) ? body.chapters : [],
      status: body.status ?? "draft",
      createdBy: access.ctx.userId,
      updatedBy: access.ctx.userId,
    });

    return NextResponse.json({ message: "Course created", course }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create course", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
