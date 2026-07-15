import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYNC_FILE = path.join(__dirname, '../sync-data.json');
const LOCK_FILE = path.join(__dirname, '../lock.json');

// In-memory state with version tracking
let syncStore = {
  version: 0,
  updatedAt: Date.now(),
  updatedBy: null,
  timetables: null,
  teachers: null,
  teacherSubjectMap: null,
  loadMaster: null,
  masterClasses: null,
  substitutions: null,
  absentTeachers: null,
};

// Lock state (default: FROZEN for safety)
let lockStore = {
  status: "frozen",  // "draft" or "frozen"
  isLocked: true,
  frozenAt: new Date().toISOString(),
  frozenBy: "system-default",
  version: 1,
};

// Load persisted state from file on startup
if (fs.existsSync(SYNC_FILE)) {
  try {
    const raw = fs.readFileSync(SYNC_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    syncStore = { ...syncStore, ...parsed };
    console.log(`[sync-server] Loaded persisted state (version ${syncStore.version})`);
  } catch (e) {
    console.warn('[sync-server] Could not read sync-data.json, starting fresh.');
  }
}

// Load lock state from file on startup
if (fs.existsSync(LOCK_FILE)) {
  try {
    const raw = fs.readFileSync(LOCK_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    lockStore = { ...lockStore, ...parsed };
    console.log(`[sync-server] Loaded lock state (status: ${lockStore.status})`);
  } catch (e) {
    console.warn('[sync-server] Could not read lock.json, using default frozen state.');
  }
} else {
  // Create default lock file (frozen by default)
  persistLock();
  console.log('[sync-server] Created default lock file (status: frozen)');
}

function persist() {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(syncStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[sync-server] Could not persist state:', e.message);
  }
}

function persistLock() {
  try {
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lockStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[sync-server] Could not persist lock:', e.message);
  }
}

function isTimetableFrozen() {
  return lockStore.status === "frozen" || lockStore.isLocked === true;
}

/** Read the full request body as a string */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export function createSyncPlugin() {
  return {
    name: 'vite-timetable-sync',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');

        // ─── LOCK ENDPOINTS ───────────────────────────────────────────────
        
        // GET /api/admin/timetable/lock - Check lock status
        if (req.method === 'GET' && url.pathname === '/api/admin/timetable/lock') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({
            isLocked: isTimetableFrozen(),
            status: lockStore.status,
            frozenAt: lockStore.frozenAt,
            frozenBy: lockStore.frozenBy,
            version: lockStore.version,
          }));
          return;
        }

        // POST /api/admin/timetable/lock - Freeze/Unfreeze
        if (req.method === 'POST' && url.pathname === '/api/admin/timetable/lock') {
          try {
            const raw = await readBody(req);
            const { action, password } = JSON.parse(raw);

            // FREEZE: Always allowed
            if (action === "freeze") {
              lockStore = {
                status: "frozen",
                isLocked: true,
                frozenAt: new Date().toISOString(),
                frozenBy: "admin",
                unfrozenAt: null,
                unfrozenBy: null,
                version: lockStore.version + 1,
              };
              persistLock();
              console.log(`[sync-server] Timetable FROZEN`);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                status: "frozen",
                isLocked: true,
                message: "Timetable is now FROZEN. No changes allowed.",
                frozenAt: lockStore.frozenAt,
                version: lockStore.version,
              }));
              return;
            }

            // UNFREEZE: Requires password
            if (action === "unfreeze") {
              const unlockPassword = process.env.TIMETABLE_UNFREEZE_PASSWORD || "admin123";
              
              if (!password || password !== unlockPassword) {
                res.statusCode = 403;
                res.end(JSON.stringify({ 
                  error: "Invalid password. Cannot unfreeze timetable.",
                  status: lockStore.status 
                }));
                return;
              }

              lockStore = {
                status: "draft",
                isLocked: false,
                unfrozenAt: new Date().toISOString(),
                unfrozenBy: "admin",
                version: lockStore.version + 1,
              };
              persistLock();
              console.log(`[sync-server] Timetable UNFROZEN`);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                status: "draft",
                isLocked: false,
                message: "Timetable is now in DRAFT mode. You can make changes.",
                unfrozenAt: lockStore.unfrozenAt,
                version: lockStore.version,
              }));
              return;
            }

            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Invalid action. Use 'freeze' or 'unfreeze'." }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // ─── SYNC ENDPOINTS ───────────────────────────────────────────────

        // GET /api/sync?since=<version>
        if (req.method === 'GET' && url.pathname === '/api/sync') {
          const since = parseInt(url.searchParams.get('since') || '0', 10);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');

          // Include lock status in response
          const response = {
            upToDate: syncStore.version <= since,
            version: syncStore.version,
            lockStatus: lockStore.status,
            isLocked: isTimetableFrozen(),
          };

          if (syncStore.version > since) {
            // Include full data if there are updates
            Object.assign(response, syncStore);
          }

          res.end(JSON.stringify(response));
          return;
        }

        // POST /api/sync - Check lock first!
        if (req.method === 'POST' && url.pathname === '/api/sync') {
          try {
            const raw = await readBody(req);
            const { clientId, payload, action } = JSON.parse(raw);

            // Handle lock actions via /api/sync (legacy support)
            if (action === "freeze" || action === "unfreeze") {
              const unlockPassword = process.env.TIMETABLE_UNFREEZE_PASSWORD || "admin123";
              
              if (action === "unfreeze") {
                const providedPassword = payload?.password;
                if (!providedPassword || providedPassword !== unlockPassword) {
                  res.statusCode = 403;
                  res.end(JSON.stringify({ 
                    error: "Invalid password. Cannot unfreeze timetable.",
                    status: lockStore.status 
                  }));
                  return;
                }

                lockStore = {
                  status: "draft",
                  isLocked: false,
                  unfrozenAt: new Date().toISOString(),
                  unfrozenBy: clientId || "admin",
                  version: lockStore.version + 1,
                };
                persistLock();
                console.log(`[sync-server] Timetable UNFROZEN by "${clientId}"`);

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: true, 
                  status: "draft",
                  isLocked: false,
                  message: "Timetable is now in DRAFT mode. You can make changes.",
                  version: lockStore.version,
                }));
                return;
              }

              if (action === "freeze") {
                lockStore = {
                  status: "frozen",
                  isLocked: true,
                  frozenAt: new Date().toISOString(),
                  frozenBy: clientId || "admin",
                  unfrozenAt: null,
                  unfrozenBy: null,
                  version: lockStore.version + 1,
                };
                persistLock();
                console.log(`[sync-server] Timetable FROZEN by "${clientId}"`);

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: true, 
                  status: "frozen",
                  isLocked: true,
                  message: "Timetable is now FROZEN. No changes allowed.",
                  frozenAt: lockStore.frozenAt,
                  version: lockStore.version,
                }));
                return;
              }
            }

            // Check if timetable is frozen - BLOCK all sync writes
            if (isTimetableFrozen()) {
              console.warn(`[sync-server] BLOCKED sync from "${clientId}" - timetable is FROZEN`);
              res.statusCode = 403;
              res.end(JSON.stringify({ 
                error: "Timetable is FROZEN. Changes rejected.",
                status: "frozen",
                frozenAt: lockStore.frozenAt,
                frozenBy: lockStore.frozenBy,
              }));
              return;
            }

            // Check for empty payload (safety check)
            if (!payload || typeof payload !== 'object') {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid payload' }));
              return;
            }

            // Check for empty timetables (prevent data loss)
            if (payload.timetables && typeof payload.timetables === 'object' && 
                Object.keys(payload.timetables).length === 0) {
              console.warn(`[sync-server] BLOCKED empty timetables from "${clientId}"`);
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Cannot sync empty timetables' }));
              return;
            }

            // Apply the update
            syncStore = {
              ...syncStore,
              version: syncStore.version + 1,
              updatedAt: Date.now(),
              updatedBy: clientId || 'unknown',
              ...payload,
            };

            persist();
            console.log(`[sync-server] State updated by "${clientId}" → version ${syncStore.version}`);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, version: syncStore.version }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    },
  };
}
