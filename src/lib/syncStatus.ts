import { useSyncExternalStore } from 'react';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

type Listener = () => void;

let currentStatus: SyncStatus = 'offline';
const listeners = new Set<Listener>();

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

export function setSyncStatus(status: SyncStatus): void {
  currentStatus = status;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, getSyncStatus);
}
