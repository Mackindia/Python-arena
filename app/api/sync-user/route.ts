import { NextResponse } from "next/server";
import { syncCurrentUser } from "@/lib/user-sync";

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    const user = await syncCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message: "User synchronized", user });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to sync user",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}