import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getRequestUserContext } from "@/lib/rbac";
import Program from "@/models/Program";
import PythonProgram from "@/src/models/PythonProgram";

const ALLOWED_ROLES = ["super_admin", "admin"];

async function verifyAdmin() {
  const ctx = await getRequestUserContext();
  if (!ctx.userId || !ALLOWED_ROLES.includes(ctx.role)) {
    return null;
  }
  return ctx;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await verifyAdmin();
    if (!ctx) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "web" or "python"

    if (!type) {
      return NextResponse.json({ error: "Type parameter is required" }, { status: 400 });
    }

    let program;
    if (type === "web") {
      program = await Program.findById(params.id).lean();
    } else {
      program = await PythonProgram.findById(params.id).lean();
    }

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({ program }, { status: 200 });
  } catch (error) {
    console.error("Admin program fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
  }
}
