import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYNC_FILE = path.join(__dirname, '../sync-data.json');

// In-memory state with version tracking
let syncStore = {
  version: 0,
  updatedAt: Date.now(),
  updatedBy: null,
  timetables: null,
  teacherSubjectMap: null,
  loadMaster: null,
  masterClasses: null,
  substitutions: null,
  absentTeachers: null,
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

function persist() {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(syncStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[sync-server] Could not persist state:', e.message);
  }
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

        // GET /api/sync?since=<version>
        if (req.method === 'GET' && url.pathname === '/api/sync') {
          const since = parseInt(url.searchParams.get('since') || '0', 10);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');

          if (syncStore.version <= since) {
            res.end(JSON.stringify({ upToDate: true, version: syncStore.version }));
          } else {
            res.end(JSON.stringify({ upToDate: false, ...syncStore }));
          }
          return;
        }

        // POST /api/sync
        if (req.method === 'POST' && url.pathname === '/api/sync') {
          try {
            const raw = await readBody(req);
            const { clientId, payload } = JSON.parse(raw);

            if (!payload || typeof payload !== 'object') {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid payload' }));
              return;
            }

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
