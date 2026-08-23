export type ConflictResolution = 'applied-remote' | 'kept-local' | 'kept-remote';

export interface ConflictLogEntry {
  entityType: string;
  entityId: string;
  resolution: ConflictResolution;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  at: string;
}

const MAX_LOG_ENTRIES = 100;
const log: ConflictLogEntry[] = [];

export function logConflict(entry: Omit<ConflictLogEntry, 'at'>): void {
  const fullEntry: ConflictLogEntry = { ...entry, at: new Date().toISOString() };

  log.unshift(fullEntry);
  if (log.length > MAX_LOG_ENTRIES) {
    log.length = MAX_LOG_ENTRIES;
  }

  console.log(
    `[Havn sync] conflict on ${entry.entityType} ${entry.entityId}: ${entry.resolution} (local=${entry.localUpdatedAt}, remote=${entry.remoteUpdatedAt})`,
  );
}

export function getConflictLog(): ConflictLogEntry[] {
  return log;
}
