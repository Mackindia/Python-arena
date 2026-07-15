/**
 * Timetable Lock Service
 *
 * Checks if the timetable is frozen/draft before allowing edits.
 * Supports freeze/unfreeze with password protection.
 * 
 * States:
 * - "frozen": No edits allowed (DEFAULT - safe)
 * - "draft": Edits allowed
 */

const LOCK_CHECK_INTERVAL = 5000; // Check lock status every 5 seconds

class TimetableLockService {
  constructor() {
    this._status = "frozen";  // Default: frozen (safe)
    this._isLocked = true;
    this._frozenAt = null;
    this._frozenBy = null;
    this._checkTimer = null;
    this._onLockChange = null;
  }

  /** Start checking lock status */
  init(onLockChange) {
    this._onLockChange = onLockChange;
    this._checkLock();
    this._checkTimer = setInterval(() => this._checkLock(), LOCK_CHECK_INTERVAL);
  }

  /** Stop checking lock status */
  destroy() {
    clearInterval(this._checkTimer);
    this._checkTimer = null;
    this._onLockChange = null;
  }

  /** Get current lock status */
  get status() {
    return this._status;
  }

  /** Check if timetable is locked (frozen) */
  get isLocked() {
    return this._status === "frozen" || this._isLocked === true;
  }

  /** Get freeze info */
  get freezeInfo() {
    return {
      status: this._status,
      isLocked: this.isLocked,
      frozenAt: this._frozenAt,
      frozenBy: this._frozenBy,
    };
  }

  /** Manually check lock status */
  async _checkLock() {
    try {
      const res = await fetch('/api/admin/timetable/lock', {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return;

      const data = await res.json();
      const previousStatus = this._status;
      
      this._status = data.status || (data.isLocked ? "frozen" : "draft");
      this._isLocked = data.isLocked;
      this._frozenAt = data.frozenAt;
      this._frozenBy = data.frozenBy;

      // Notify if lock status changed
      if (previousStatus !== this._status && this._onLockChange) {
        this._onLockChange(this._status, this.isLocked);
      }
    } catch {
      // If we can't check lock, assume FROZEN (fail closed - safe)
      const previousStatus = this._status;
      this._status = "frozen";
      this._isLocked = true;
      
      if (previousStatus !== this._status && this._onLockChange) {
        this._onLockChange(this._status, this.isLocked);
      }
    }
  }

  /** Check if edits are allowed. Returns true if allowed, false if frozen. */
  canEdit() {
    if (this.isLocked) {
      const reason = this._frozenAt 
        ? `Timetable is FROZEN since ${new Date(this._frozenAt).toLocaleString()}`
        : "Timetable is FROZEN";
      alert(`${reason}. Unlock it first to make changes.`);
      return false;
    }
    return true;
  }

  /** Freeze the timetable (no password required) */
  async freeze() {
    try {
      const res = await fetch('/api/admin/timetable/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "freeze" }),
        signal: AbortSignal.timeout(5000),
      });

      const data = await res.json();
      
      if (data.success) {
        this._status = "frozen";
        this._isLocked = true;
        this._frozenAt = data.frozenAt;
        this._frozenBy = data.frozenBy;
        
        if (this._onLockChange) {
          this._onLockChange(this._status, this.isLocked);
        }
        
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: err.message || "Failed to freeze timetable" };
    }
  }

  /** Unfreeze the timetable (requires password) */
  async unfreeze(password) {
    if (!password) {
      return { success: false, error: "Password required to unfreeze" };
    }

    try {
      const res = await fetch('/api/admin/timetable/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: "unfreeze",
          password: password
        }),
        signal: AbortSignal.timeout(5000),
      });

      const data = await res.json();
      
      if (data.success) {
        this._status = "draft";
        this._isLocked = false;
        this._frozenAt = null;
        this._frozenBy = null;
        
        if (this._onLockChange) {
          this._onLockChange(this._status, this.isLocked);
        }
        
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: err.message || "Failed to unfreeze timetable" };
    }
  }

  /** Get human-readable status text */
  getStatusText() {
    if (this.isLocked) {
      const dateStr = this._frozenAt 
        ? new Date(this._frozenAt).toLocaleString()
        : "unknown time";
      const byStr = this._frozenBy || "unknown";
      return `FROZEN since ${dateStr} by ${byStr}`;
    }
    return "DRAFT - Edits allowed";
  }
}

export const timetableLockService = new TimetableLockService();
