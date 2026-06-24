import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ResetRequest } from "../../../../src/models/ResetRequest";

export async function GET() {
  try {
    await connectDB();
    
    // Get all pending requests, newest first
    const pendingRequests = await ResetRequest.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(pendingRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching reset requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
