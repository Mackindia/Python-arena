import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import Timetable from "../../../../../models/Timetable";
import { requireSuperAdminApi } from "@/lib/admin-api";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireSuperAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const { id } = await params;

    const deleted = await Timetable.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Timetable entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
