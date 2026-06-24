import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ResetRequest } from "../../../../src/models/ResetRequest";

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Verify request exists and is pending
    const request = await ResetRequest.findById(requestId);
    if (!request || request.status !== "pending") {
      return NextResponse.json(
        { error: "Invalid or already processed request" },
        { status: 400 }
      );
    }

    // Mark the request as rejected/cancelled in MongoDB
    request.status = "rejected";
    await request.save();

    return NextResponse.json(
      { message: "Password reset request rejected successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error rejecting reset request:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
