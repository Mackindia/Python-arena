import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// ── Sync Store (same logic as syncPlugin.mjs) ──────────────────────────────
const SYNC_FILE = path.join(__dirname, 'sync-data.json');

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

// ── Sync API ───────────────────────────────────────────────────────────────
app.get('/api/sync', (req, res) => {
  const since = parseInt(req.query.since || '0', 10);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (syncStore.version <= since) {
    res.json({ upToDate: true, version: syncStore.version });
  } else {
    res.json({ upToDate: false, ...syncStore });
  }
});

app.post('/api/sync', (req, res) => {
  try {
    const { clientId, payload, fullReplace } = req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Reject payloads that are older than what the server already has
    const remoteEpoch = Number(payload.dataEpoch || 0);
    const serverEpoch = Number(syncStore.dataEpoch || 0);
    const isFullState = payload.timetables && typeof payload.timetables === 'object';
    if (serverEpoch && !fullReplace) {
      if (remoteEpoch < serverEpoch && remoteEpoch > 0) {
        return res.status(409).json({
          error: 'Stale payload (older dataEpoch)',
          version: syncStore.version,
          dataEpoch: serverEpoch,
        });
      }
      if (isFullState && !remoteEpoch) {
        return res.status(409).json({
          error: 'Stale full-state payload (missing dataEpoch after import)',
          version: syncStore.version,
          dataEpoch: serverEpoch,
        });
      }
    }

    // fullReplace: CSV import — replace mergeable fields entirely
    const next = fullReplace
      ? {
          ...syncStore,
          version: syncStore.version + 1,
          updatedAt: Date.now(),
          updatedBy: clientId || 'unknown',
          dataEpoch: remoteEpoch || Date.now(),
          timetables: payload.timetables ?? null,
          teachers: payload.teachers ?? null,
          teacherSubjectMap: payload.teacherSubjectMap ?? null,
          loadMaster: payload.loadMaster ?? null,
          masterClasses: payload.masterClasses ?? null,
          substitutions: payload.substitutions ?? null,
          absentTeachers: payload.absentTeachers ?? null,
        }
      : {
          ...syncStore,
          version: syncStore.version + 1,
          updatedAt: Date.now(),
          updatedBy: clientId || 'unknown',
          ...payload,
          dataEpoch: Math.max(serverEpoch, remoteEpoch),
        };

    syncStore = next;
    persist();
    console.log(`[sync-server] State updated by "${clientId}" → version ${syncStore.version}${fullReplace ? ' (fullReplace)' : ''}`);
    res.json({ success: true, version: syncStore.version, dataEpoch: syncStore.dataEpoch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Serve static build ─────────────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[server] Timetable app running on port ${PORT}`);
});
