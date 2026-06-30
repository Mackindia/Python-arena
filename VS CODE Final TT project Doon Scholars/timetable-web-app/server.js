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
    const { clientId, payload } = req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
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
    res.json({ success: true, version: syncStore.version });
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
