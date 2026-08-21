import type { SQLiteDatabase } from 'expo-sqlite';

import { migrations } from './schema';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = result?.user_version ?? 0;

  const pending = migrations
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.execAsync(migration.up);
    currentVersion = migration.version;
    await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
  }
}
