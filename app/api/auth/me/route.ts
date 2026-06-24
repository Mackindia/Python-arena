import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";

import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const localUserId = cookieStore.get("local_user_id")?.value;

    let user = null;
    await connectDB();

    if (localUserId) {
      user = await User.findById(localUserId).lean();
    } else {
      const { userId } = await auth();
      if (userId) {
        user = await User.findOne({ clerkId: userId }).lean();
        
        // If not found by clerkId, let's check by email and link them, or auto-create if it's the super admin
        if (!user) {
          const { currentUser } = await import("@clerk/nextjs/server");
          const clerkUser = await currentUser();
          
          if (clerkUser) {
            const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase();
            
            if (email) {
              // Check if user exists by email
              user = await User.findOne({ email }).lean();
              
              if (user) {
                 // Link the clerkId to the existing MongoDB user
                 await User.updateOne({ _id: user._id }, { $set: { clerkId: userId } });
                 user.clerkId = userId;
              } else if (email === "abhishekr474@gmail.com") {
                 // Auto-create the super admin in MongoDB if they don't exist yet!
                 const newAdmin = await User.create({
                    clerkId: userId,
                    email: email,
                    fullName: "Super Admin",
                    username: "superadmin",
                    role: "admin", // Will be upgraded to super_admin below
                    is_active: true
                 });
                 user = newAdmin.toObject();
              }
            }
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json({ user: null });
    }

    let assignedRole = user.role;
    if (user.email?.toLowerCase() === "abhishekr474@gmail.com") {
      assignedRole = "super_admin";
    }

    return NextResponse.json({
      user: {
        id: user._id,
        fullName: user.fullName || user.username,
        username: user.username,
        role: assignedRole,
        class: user.class || user.studentClass,
        section: user.section,
        meet_link: user.meet_link,
        isClerk: !!user.clerkId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ user: null, error: error.message });
  }
}
