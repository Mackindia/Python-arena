import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ModelRegistry from "@/models/ModelRegistry";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await connectDB();
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const model = await ModelRegistry.findById(id).lean();

    if (!model) return NextResponse.json({ message: "Model not found" }, { status: 404 });

    return NextResponse.json({ model });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch model" }, { status: 500 });
  }
}
