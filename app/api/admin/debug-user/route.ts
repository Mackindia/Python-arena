import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || "s1197";

    // 1. Check MongoDB
    const mongoUser = await User.findOne({ username: username }).lean();

    // 2. Check Clerk via Backend API
    let clerkUsers = [];
    try {
      const client = typeof clerkClient === "function" ? await clerkClient() : clerkClient;
      const response = await client.users.getUserList({ query: username });
      clerkUsers = response.data || response; // Handle different Clerk SDK versions
    } catch (e: any) {
      return NextResponse.json({
        error: "Failed to communicate with Clerk",
        message: e.message
      });
    }

    return NextResponse.json({
      status: "Check Complete",
      searchedUsername: username,
      foundInMongoDB: !!mongoUser,
      mongoData: mongoUser ? {
        id: mongoUser._id,
        role: mongoUser.role,
        clerkId: mongoUser.clerkId
      } : "Not found",
      foundInClerk: clerkUsers.length > 0,
      clerkData: clerkUsers.map((u: any) => ({
        id: u.id,
        username: u.username,
        emails: u.emailAddresses.map((e: any) => e.emailAddress)
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
