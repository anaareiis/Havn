import { getDatabase } from '../client';
import { generateId } from '../id';
import type { SyncEntityType, SyncOperation, SyncQueueEntry, SyncStatus } from '../types';

interface SyncQueueRow {
  id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: string | null;
  status: SyncStatus;
  error_message: string | null;
  created_at: string;
  synced_at: string | null;
}

function mapRow(row: SyncQueueRow): SyncQueueEntry {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    operation: row.operation,
    payload: row.payload,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
  };
}

export interface EnqueueSyncEntryInput {
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload?: string | null;
}

export async function enqueueSyncEntry(input: EnqueueSyncEntryInput): Promise<SyncQueueEntry> {
  const db = await getDatabase();
  const entry: SyncQueueEntry = {
    id: generateId(),
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    payload: input.payload ?? null,
    status: 'pending',
    errorMessage: null,
    createdAt: new Date().toISOString(),
    syncedAt: null,
  };

  await db.runAsync(
    `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, status, error_message, created_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.id,
    entry.entityType,
    entry.entityId,
    entry.operation,
    entry.payload,
    entry.status,
    entry.errorMessage,
    entry.createdAt,
    entry.syncedAt,
  );

  return entry;
}

export async function findPendingSyncEntries(): Promise<SyncQueueEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SyncQueueRow>(
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC",
  );
  return rows.map(mapRow);
}

export async function markSyncEntrySynced(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sync_queue SET status = 'synced', synced_at = ?, error_message = NULL WHERE id = ?",
    new Date().toISOString(),
    id,
  );
}

export async function markSyncEntryError(id: string, errorMessage: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sync_queue SET status = 'error', error_message = ? WHERE id = ?",
    errorMessage,
    id,
  );
}
