import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Lesson from "@/models/Lesson";

export async function PATCH(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ message: "items are required" }, { status: 400 });
    }

    await connectDB();

    await Promise.all(
      body.items.map((item: { id: string; order: number }) =>
        Lesson.findByIdAndUpdate(item.id, {
          $set: {
            order: Number(item.order),
            updatedBy: access.ctx.userId,
          },
        })
      ),
    );

    return NextResponse.json({ message: "Lesson order updated" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to reorder lessons", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
