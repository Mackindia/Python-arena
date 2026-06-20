import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { selfTuneRegistry } from "@/src/lib/ai-engines/analytics/tuner";

export async function POST() {
  try {
    await connectDB();
    const result = await selfTuneRegistry();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Tuning API Error:", error);
    return NextResponse.json({ message: "Failed to run registry tuner" }, { status: 500 });
  }
}
