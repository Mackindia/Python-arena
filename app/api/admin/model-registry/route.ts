import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ModelRegistry from "@/models/ModelRegistry";
import { defaultModelsConfig } from "@/src/config/defaultModels";

export async function GET() {
  try {
    await connectDB();
    let models = await ModelRegistry.find().sort({ name: 1 }).lean();

    if (models.length === 0) {
      await ModelRegistry.insertMany(defaultModelsConfig);
      models = await ModelRegistry.find().sort({ name: 1 }).lean();
    }

    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch models" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectDB();

    if (body._id) {
      const updated = await ModelRegistry.findByIdAndUpdate(body._id, body, { new: true });
      return NextResponse.json({ message: "Model updated", model: updated });
    } else {
      const created = await ModelRegistry.create(body);
      return NextResponse.json({ message: "Model created", model: created }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Failed to save model" }, { status: 500 });
  }
}
