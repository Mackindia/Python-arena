import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({ username: { $regex: '1729', $options: 'i' } }).lean();
    return NextResponse.json({ 
      users: users.map(u => ({ username: u.username, password: u.password, active: u.is_active })) 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
