import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { connectDB } from "../../lib/mongodb";

import User from "../../models/User";
import Period from "../../models/Period";
import Timetable from "../../models/Timetable";
import ActiveSession from "../../models/ActiveSession";

import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./AdminDashboard";

import Settings from "../../models/Settings";

export default async function OnlineClassPage() {
  await connectDB();

  let user = null;
  const { userId } = await auth();

  if (userId) {
    user = await User.findOne({ clerkId: userId });
  } else {
    const cookieStore = await cookies();
    const localUserId = cookieStore.get("local_user_id")?.value;
    if (localUserId) {
      user = await User.findById(localUserId);
    }
  }

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.role || "student";

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[new Date().getDay()];

  // Check Global Online Class Window Settings
  const settingsDoc = await Settings.findOne({ key: "online_class_window" }).lean();
  const onlineSettings = settingsDoc ? settingsDoc.value : { isActive: true, startDate: "", endDate: "" };

  const todayDate = new Date().toISOString().split("T")[0];
  let isWindowActive = onlineSettings.isActive;
  
  if (isWindowActive && onlineSettings.startDate && todayDate < onlineSettings.startDate) {
    isWindowActive = false;
  }
  if (isWindowActive && onlineSettings.endDate && todayDate > onlineSettings.endDate) {
    isWindowActive = false;
  }

  // Fetch periods
  const periodsDoc = await Period.find({}).sort({ period_no: 1 }).lean();
  const periods = JSON.parse(JSON.stringify(periodsDoc));

  // =========================
  // ADMIN
  // =========================
  if (role === "admin") {
    const liveSessionsDoc = await ActiveSession.find({ is_active: true }).lean();
    const liveSessions = JSON.parse(JSON.stringify(liveSessionsDoc));

    return <AdminDashboard liveSessions={liveSessions} settings={onlineSettings} />;
  }

  // =========================
  // TEACHER
  // =========================
  if (role === "teacher") {
    // Use the shortcode teacher_id (e.g., 'AR', 'NM') if available. Fallback to username.
    const teacherId = user.teacher_id || user.username || user.clerkId || user._id.toString();

    let timetableDoc: any[] = [];
    let activeSessionsDoc: any[] = [];

    if (isWindowActive) {
      timetableDoc = await Timetable.find({
        day: todayName,
        teacher_id: teacherId,
      })
        .sort({ period_no: 1 })
        .lean();

      activeSessionsDoc = await ActiveSession.find({
        teacher_id: teacherId,
        is_active: true,
      }).lean();
    }

    const timetable = JSON.parse(JSON.stringify(timetableDoc));
    const activeSessions = JSON.parse(JSON.stringify(activeSessionsDoc));

    const teacher = {
      teacher_id: teacherId,
      teacher_name: user.fullName || user.username,
      meet_link: user.meet_link || "https://meet.google.com/test",
    };

    return (
      <TeacherDashboard
        timetable={timetable}
        activeSessions={activeSessions}
        periods={periods}
        teacher={teacher}
      />
    );
  }

  // =========================
  // STUDENT
  // =========================
  const rawClass = user.class || user.studentClass || "6";
  // Convert "Class 10" to "10" to ensure it matches the timetable format perfectly
  const normalizedClass = rawClass.replace(/class\s+/i, "").trim();
  const rawSection = user.section || "A";
  
  const classRegex = new RegExp(`^${normalizedClass}$`, "i");
  const sectionRegex = new RegExp(`^${rawSection}$`, "i");
  
  let studentGroups = ["MAIN"];
  if (Array.isArray(user.group)) {
    studentGroups = ["MAIN", ...user.group];
  } else if (typeof user.group === "string" && user.group.trim() !== "") {
    // If the admin typed "Commerce, Painting", split it into an array
    studentGroups = ["MAIN", ...user.group.split(",").map((g: string) => g.trim())];
  }

  let timetableDoc: any[] = [];
  let activeSessionsDoc: any[] = [];

  if (isWindowActive) {
    timetableDoc = await Timetable.find({
      class: classRegex,
      section: sectionRegex,
      group: { $in: studentGroups },
      day: todayName,
    })
      .sort({ period_no: 1 })
      .lean();

    activeSessionsDoc = await ActiveSession.find({
      class: classRegex,
      section: sectionRegex,
      group: { $in: studentGroups },
      is_active: true,
    }).lean();
  }

  const timetable = JSON.parse(JSON.stringify(timetableDoc));
  const activeSessions = JSON.parse(JSON.stringify(activeSessionsDoc));

  return (
    <StudentDashboard
      timetable={timetable}
      activeSessions={activeSessions}
      periods={periods}
      userClass={normalizedClass}
      userSection={rawSection}
      userGroup={user.group || "MAIN"}
    />
  );
}