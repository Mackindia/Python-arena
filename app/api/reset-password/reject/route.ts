import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ResetRequest } from "../../../../src/models/ResetRequest";
import { requireAdminApi } from "@/lib/admin-api";
import { sanitizeError } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const request = await ResetRequest.findById(requestId);
    if (!request || request.status !== "pending") {
      return NextResponse.json(
        { error: "Invalid or already processed request" },
        { status: 400 }
      );
    }

    request.status = "rejected";
    await request.save();

    return NextResponse.json(
      { message: "Password reset request rejected successfully." },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}
