import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ResetRequest } from "../../../../src/models/ResetRequest";
import { requireAdminApi } from "@/lib/admin-api";
import { sanitizeError } from "@/lib/security";

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    await connectDB();

    const pendingRequests = await ResetRequest.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(pendingRequests, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}
