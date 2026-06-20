/**
 * Timetable Live Sync Service
 *
 * Keeps timetable state synchronized across multiple admin sessions
 * (different browsers / devices on the same network) using:
 *
 *   1. BroadcastChannel  — instant same-browser multi-tab sync
 *   2. Server polling    — cross-browser / cross-device sync via /api/sync
 *
 * Usage (from TimetableContext):
 *   import { syncService } from './syncService';
 *   syncService.init(onRemoteChange);      // start listening
 *   syncService.push(payload);             // push local state changes
 *   syncService.destroy();                 // cleanup on unmount
 */

const CHANNEL_NAME   = 'timetable-sync';
const POLL_INTERVAL  = 3000;   // ms — how often to poll the server
const CLIENT_ID_KEY  = 'tt_sync_client_id';

function getOrCreateClientId() {
  let id = sessionStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

class SyncService {
  constructor() {
    this._clientId     = getOrCreateClientId();
    this._channel      = null;
    this._pollTimer    = null;
    this._knownVersion = 0;
    this._onRemote     = null;
    this._online       = true;
  }

  /** Start the sync service.
   * @param {(payload: object) => void} onRemoteChange  — called when remote state arrives
   */
  init(onRemoteChange) {
    this._onRemote = onRemoteChange;

    // 1. BroadcastChannel (same-browser multi-tab)
    if (typeof BroadcastChannel !== 'undefined') {
      this._channel = new BroadcastChannel(CHANNEL_NAME);
      this._channel.onmessage = (e) => {
        if (e.data?.clientId === this._clientId) return; // ignore own messages
        if (e.data?.payload) this._apply(e.data.payload);
      };
    }

    // 2. Server polling
    this._startPolling();
  }

  /** Push a state update to all peers. */
  push(payload) {
    // a. BroadcastChannel — other tabs see it instantly
    this._channel?.postMessage({ clientId: this._clientId, payload });

    // b. Server — so other devices / browsers can pick it up
    this._pushToServer(payload);
  }

  destroy() {
    this._channel?.close();
    this._channel = null;
    clearInterval(this._pollTimer);
    this._pollTimer = null;
    this._onRemote = null;
  }

  // ─── private ────────────────────────────────────────────────────────────────

  _apply(payload) {
    if (typeof this._onRemote === 'function') {
      this._onRemote(payload);
    }
  }

  _startPolling() {
    // Poll immediately, then on interval
    this._poll();
    this._pollTimer = setInterval(() => this._poll(), POLL_INTERVAL);
  }

  async _poll() {
    try {
      const res = await fetch(`/api/sync?since=${this._knownVersion}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return;

      const data = await res.json();
      if (data.upToDate) return;

      // Skip our own pushes
      if (data.updatedBy === this._clientId) {
        this._knownVersion = data.version;
        return;
      }

      this._knownVersion = data.version;

      // Build payload from server response (strip meta fields)
      const { version: _v, updatedAt: _u, updatedBy: _b, upToDate: _d, ...payload } = data;
      this._apply(payload);

      if (!this._online) {
        console.log('[sync] Reconnected to sync server.');
        this._online = true;
      }
    } catch {
      if (this._online) {
        console.warn('[sync] Sync server unreachable — running offline.');
        this._online = false;
      }
    }
  }

  async _pushToServer(payload) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: this._clientId, payload }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Silent — BroadcastChannel already handled same-browser sync
    }
  }
}

export const syncService = new SyncService();
