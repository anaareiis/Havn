import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrate';

const DATABASE_NAME = 'havn.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return dbPromise;
}
