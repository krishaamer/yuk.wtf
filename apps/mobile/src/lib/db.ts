import * as SQLite from "expo-sqlite";

export type CaptureKind = "discard" | "litter";
export type CaptureStatus = "pending" | "syncing" | "synced";

export type CaptureOp = {
  id: string;
  kind: CaptureKind;
  image_data: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  publish: number;
  status: CaptureStatus;
  analysis_json: string | null;
  observation_id: string | null;
  site_id: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

const databasePromise = SQLite.openDatabaseAsync("yuk.db");
let initialized: Promise<void> | null = null;

async function database() {
  const db = await databasePromise;
  if (!initialized) {
    initialized = db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS capture_ops (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('discard', 'litter')),
        image_data TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        accuracy REAL,
        publish INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced')),
        analysis_json TEXT,
        observation_id TEXT,
        site_id TEXT,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS capture_ops_status_idx ON capture_ops(status, created_at);
    `);
  }
  await initialized;
  return db;
}

export async function queueCapture(input: {
  id: string;
  kind: CaptureKind;
  imageData: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  publish?: boolean;
}) {
  const db = await database();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR IGNORE INTO capture_ops
      (id, kind, image_data, latitude, longitude, accuracy, publish, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    input.id,
    input.kind,
    input.imageData,
    input.latitude ?? null,
    input.longitude ?? null,
    input.accuracy ?? null,
    input.publish ? 1 : 0,
    now,
    now,
  );
}

export async function getCapture(id: string) {
  const db = await database();
  return db.getFirstAsync<CaptureOp>("SELECT * FROM capture_ops WHERE id = ?", id);
}

export async function listCaptures(limit = 50) {
  const db = await database();
  return db.getAllAsync<CaptureOp>(
    "SELECT * FROM capture_ops ORDER BY created_at DESC LIMIT ?",
    limit,
  );
}

export async function listPendingCaptures(limit = 25) {
  const db = await database();
  return db.getAllAsync<CaptureOp>(
    "SELECT * FROM capture_ops WHERE status != 'synced' ORDER BY created_at ASC LIMIT ?",
    limit,
  );
}

export async function markSyncing(id: string) {
  const db = await database();
  await db.runAsync(
    "UPDATE capture_ops SET status = 'syncing', last_error = NULL, updated_at = ? WHERE id = ?",
    new Date().toISOString(),
    id,
  );
}

export async function saveAnalysis(id: string, analysis: unknown) {
  const db = await database();
  await db.runAsync(
    "UPDATE capture_ops SET analysis_json = ?, updated_at = ? WHERE id = ?",
    JSON.stringify(analysis),
    new Date().toISOString(),
    id,
  );
}

export async function markPending(id: string, error: string) {
  const db = await database();
  await db.runAsync(
    "UPDATE capture_ops SET status = 'pending', last_error = ?, updated_at = ? WHERE id = ?",
    error.slice(0, 1000),
    new Date().toISOString(),
    id,
  );
}

export async function markSynced(id: string, observationId: string, siteId?: string | null) {
  const db = await database();
  await db.runAsync(
    `UPDATE capture_ops
     SET status = 'synced', observation_id = ?, site_id = ?, last_error = NULL, updated_at = ?
     WHERE id = ?`,
    observationId,
    siteId ?? null,
    new Date().toISOString(),
    id,
  );
}

export async function captureStats() {
  const db = await database();
  const row = await db.getFirstAsync<{ total: number; pending: number; mapped: number }>(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status != 'synced' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN kind = 'litter' AND site_id IS NOT NULL THEN 1 ELSE 0 END) AS mapped
    FROM capture_ops
  `);
  return {
    total: row?.total ?? 0,
    pending: row?.pending ?? 0,
    mapped: row?.mapped ?? 0,
  };
}
