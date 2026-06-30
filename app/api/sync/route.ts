import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import SyncStore from "../../../models/SyncStore";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get("since") || "0", 10);

    let syncStore = await SyncStore.findOne({});
    if (!syncStore) {
      syncStore = await SyncStore.create({
        version: 0,
        updatedAt: Date.now(),
        updatedBy: null,
        timetables: null,
        teacherSubjectMap: null,
        loadMaster: null,
        masterClasses: null,
        substitutions: null,
        absentTeachers: null,
        addedTeachers: null,
        deletedTeachers: null,
      });
    }

    if (syncStore.version <= since) {
      return NextResponse.json({ upToDate: true, version: syncStore.version });
    }

    return NextResponse.json({
      upToDate: false,
      version: syncStore.version,
      updatedAt: syncStore.updatedAt,
      updatedBy: syncStore.updatedBy,
      timetables: syncStore.timetables,
      teacherSubjectMap: syncStore.teacherSubjectMap,
      loadMaster: syncStore.loadMaster,
      masterClasses: syncStore.masterClasses,
      substitutions: syncStore.substitutions,
      absentTeachers: syncStore.absentTeachers,
      addedTeachers: syncStore.addedTeachers,
      deletedTeachers: syncStore.deletedTeachers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { clientId, payload } = body;

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let syncStore = await SyncStore.findOne({});
    if (!syncStore) {
      syncStore = new SyncStore({
        version: 0,
        updatedAt: Date.now(),
        updatedBy: null,
        timetables: {},
        teacherSubjectMap: {},
        loadMaster: [],
        masterClasses: [],
        substitutions: {},
        absentTeachers: {},
        addedTeachers: [],
        deletedTeachers: [],
      });
    }

    const updatedFields: any = {
      version: syncStore.version + 1,
      updatedAt: Date.now(),
      updatedBy: clientId || "unknown",
    };

    if (payload.timetables !== undefined) updatedFields.timetables = payload.timetables;
    if (payload.teacherSubjectMap !== undefined) updatedFields.teacherSubjectMap = payload.teacherSubjectMap;
    if (payload.loadMaster !== undefined) updatedFields.loadMaster = payload.loadMaster;
    if (payload.masterClasses !== undefined) updatedFields.masterClasses = payload.masterClasses;
    if (payload.substitutions !== undefined) updatedFields.substitutions = payload.substitutions;
    if (payload.absentTeachers !== undefined) updatedFields.absentTeachers = payload.absentTeachers;
    if (payload.addedTeachers !== undefined) updatedFields.addedTeachers = payload.addedTeachers;
    if (payload.deletedTeachers !== undefined) updatedFields.deletedTeachers = payload.deletedTeachers;

    const result = await SyncStore.findOneAndUpdate(
      {},
      { $set: updatedFields },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, version: result.version });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
