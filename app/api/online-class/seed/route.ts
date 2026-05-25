import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Period from "@/models/Period";
import Teacher from "@/models/Teacher";
import Timetable from "@/models/Timetable";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const { userId } = await auth();

    // 1. Seed Periods
    await Period.deleteMany({});
    const periods = [];
    let startHour = 8; // Starting at 8:00 AM
    let startMin = 0;
    
    for (let i = 1; i <= 7; i++) {
      const endMin = startMin + 40; // 40-minute periods
      let h1 = startHour.toString().padStart(2, "0");
      let m1 = startMin.toString().padStart(2, "0");
      
      let endHourVal = startHour;
      let endMinVal = endMin;
      if (endMinVal >= 60) {
        endHourVal += Math.floor(endMinVal / 60);
        endMinVal = endMinVal % 60;
      }
      
      let h2 = endHourVal.toString().padStart(2, "0");
      let m2 = endMinVal.toString().padStart(2, "0");
      
      periods.push({
        period_no: i,
        start_time: `${h1}:${m1}`,
        end_time: `${h2}:${m2}`,
      });
      
      startMin += 40; // Next class starts immediately after, or add break if needed
      if (startMin >= 60) {
        startHour += Math.floor(startMin / 60);
        startMin = startMin % 60;
      }
    }
    await Period.insertMany(periods);

    // Drop old indexes to make sure they are re-created as sparse unique indexes
    try {
      await User.collection.dropIndex("clerkId_1");
    } catch (e) {}
    try {
      await User.collection.dropIndex("email_1");
    } catch (e) {}

    await User.deleteMany({
      username: { $in: ["abhishek6342", "ST24001", "admin001", "s1547"] }
    });

    const teacherUser = await User.create({
      fullName: "Abhishek Sharma",
      username: "abhishek6342",
      password: "8402",
      role: "teacher",
      meet_link: "https://meet.google.com/abc-defg-hij",
      is_active: true,
    });

    const studentUser = await User.create({
      fullName: "Siddharth Gupta",
      username: "s1547",
      password: "652777@doon",
      role: "student",
      class: "6",
      studentClass: "6",
      section: "A",
      group: "MAIN",
      is_active: true,
    });

    const adminUser = await User.create({
      fullName: "System Administrator",
      username: "admin001",
      password: "admin123",
      role: "admin",
      is_active: true,
    });

    // Also add entries to the Teacher collection for Clerk/legacy compatibility if needed
    await Teacher.deleteMany({});
    
    // Seed teacher entry for abhishek6342
    await Teacher.create({
      teacher_id: "abhishek6342",
      teacher_name: "Abhishek Sharma",
      meet_link: "https://meet.google.com/abc-defg-hij",
    });

    // If Clerk user is running the seed, create a teacher record for them too
    if (userId) {
      await Teacher.create({
        teacher_id: userId,
        teacher_name: "Clerk Sync Teacher",
        meet_link: "https://meet.google.com/xyz-pdq-rst",
      });
      
      // Update Clerk user's DB entry to make them admin so they can test admin functions
      await User.findOneAndUpdate(
        { clerkId: userId },
        { 
          role: "admin",
          class: "6",
          section: "A",
          studentClass: "6",
        },
        { new: true }
      );
    }

    // 3. Seed Timetable for Class 6A
    await Timetable.deleteMany({});
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const subjects = ["Math", "Science", "English", "History", "Computer Science", "Art", "Sports"];
    
    const timetableEntries = [];
    for (const day of days) {
      for (let i = 1; i <= 7; i++) {
        // Abhishek teaches some periods, legacy teaches others
        timetableEntries.push({
          class: "6",
          section: "A",
          group: "MAIN",
          day,
          period_no: i,
          subject: subjects[i - 1],
          teacher_id: i % 2 === 1 ? "abhishek6342" : (userId || "abhishek6342"),
        });
      }
    }
    await Timetable.insertMany(timetableEntries);

    return NextResponse.json({ 
      message: "Seed successful", 
      periods, 
      testUsers: {
        teacher: "abhishek6342",
        student: "ST24001",
        admin: "admin001"
      },
      timetableCount: timetableEntries.length 
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
