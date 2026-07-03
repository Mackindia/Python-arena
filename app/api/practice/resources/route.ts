import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import SubjectModel from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import PracticeResourceModel from "@/models/practice/PracticeResource";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const subjectSlug = (request.nextUrl.searchParams.get("subject") ?? "").trim();
    const classSlug = (request.nextUrl.searchParams.get("class") ?? "").trim();

    const query: Record<string, unknown> = { published: true };

    if (subjectSlug) {
      const subject = await SubjectModel.findOne({ slug: subjectSlug }).select("_id").lean();
      if (!subject?._id) {
        return NextResponse.json({ items: [] });
      }
      query.subject = new mongoose.Types.ObjectId(String(subject._id));

      if (classSlug) {
        const classDoc = await ClassModel.findOne({ slug: classSlug, subject: subject._id }).select("_id").lean();
        if (!classDoc?._id) {
          return NextResponse.json({ items: [] });
        }
        query.class = new mongoose.Types.ObjectId(String(classDoc._id));
      }
    }

    const resources = await PracticeResourceModel.find(query)
      .populate("subject", "name slug")
      .populate("class", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: resources.map((resource) => {
        const item = resource as {
          _id?: unknown;
          title?: string;
          slug?: string;
          description?: string;
          resourceType?: string;
          fileUrl?: string;
          createdAt?: string | Date;
          subject?: { name?: string; slug?: string };
          class?: { name?: string; slug?: string };
        };

        return {
          id: String(item._id),
          title: item.title || "",
          slug: item.slug || "",
          description: item.description || "",
          resourceType: item.resourceType || "question-paper",
          fileUrl: item.fileUrl || "",
          createdAt: item.createdAt || null,
          subject: item.subject || null,
          class: item.class || null,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch practice resources",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
