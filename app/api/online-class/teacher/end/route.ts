import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import ActiveSession from "../../../../../models/ActiveSession";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    // Deactivate the session
    await ActiveSession.updateMany(
      { 
        class: body.class, 
        section: body.section, 
        subject: body.subject, 
        period_no: body.periodNo !== undefined ? body.periodNo : body.period_no
      },
      { $set: { is_active: false } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to end class" });
  }
}
