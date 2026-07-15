import { connectDB } from "@/lib/mongodb";
import { TimetableLock } from "@/src/models/Timetable";

/**
 * Check if the timetable is locked/frozen.
 * Returns { locked: true } if locked, { locked: false } if not.
 * 
 * Timetable is LOCKED if:
 * 1. status === "frozen" OR
 * 2. isLocked === true
 */
export async function isTimetableLocked(): Promise<{ 
  locked: boolean; 
  error?: string;
  status?: string;
  frozenBy?: string;
  frozenAt?: Date;
}> {
  try {
    await connectDB();
    const lock = await TimetableLock.findOne({ key: "global" }).lean();
    
    if (!lock) {
      // No lock record = FROZEN by default (safe)
      return { 
        locked: true, 
        error: "No lock record found. Timetable assumed frozen.",
        status: "frozen"
      };
    }

    const lockDoc = lock as { 
      isLocked?: boolean; 
      status?: string;
      frozenBy?: string;
      frozenAt?: Date;
    };

    // Check if locked (either by status or legacy isLocked field)
    const isLocked = lockDoc.status === "frozen" || lockDoc.isLocked === true;

    if (isLocked) {
      return { 
        locked: true, 
        error: `Timetable is FROZEN since ${lockDoc.frozenAt || 'unknown'}. Unlock it first to make changes.`,
        status: lockDoc.status || "frozen",
        frozenBy: lockDoc.frozenBy,
        frozenAt: lockDoc.frozenAt,
      };
    }

    return { 
      locked: false,
      status: lockDoc.status || "draft"
    };
  } catch (error) {
    // If we can't check lock, assume FROZEN (fail closed - safe)
    console.error("Error checking timetable lock:", error);
    return { 
      locked: true, 
      error: "Could not check lock status. Assuming frozen for safety.",
      status: "unknown"
    };
  }
}
