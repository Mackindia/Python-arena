import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ModelRegistry from "@/models/ModelRegistry";

export async function GET() {
  try {
    await connectDB();
    const allModels = await ModelRegistry.find({}).lean();
    const activeModels = allModels.filter(m => m.isActive);
    
    return NextResponse.json({
      total: allModels.length,
      active: activeModels.length,
      disabled: allModels.length - activeModels.length,
      models: allModels
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
