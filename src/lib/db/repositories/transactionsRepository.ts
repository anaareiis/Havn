import { logConflict } from '../../conflictLog';
import { decryptNullable, decryptNumber, encryptNullable, encryptNumber } from '../../encryption';
import { getDatabase } from '../client';
import { generateId } from '../id';
import type { Transaction, TransactionType } from '../types';
import { enqueueSyncEntry } from './syncQueueRepository';

interface TransactionRow {
  id: string;
  account_id: string;
  category_id: string | null;
  anchor_id: string | null;
  amount: string;
  type: TransactionType;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

async function mapRow(row: TransactionRow): Promise<Transaction> {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    anchorId: row.anchor_id,
    amount: await decryptNumber(row.amount),
    type: row.type,
    description: await decryptNullable(row.description),
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateTransactionInput {
  accountId: string;
  categoryId?: string | null;
  anchorId?: string | null;
  amount: number;
  type: TransactionType;
  description?: string | null;
  date: string;
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const transaction: Transaction = {
    id: generateId(),
    accountId: input.accountId,
    categoryId: input.categoryId ?? null,
    anchorId: input.anchorId ?? null,
    amount: input.amount,
    type: input.type,
    description: input.description ?? null,
    date: input.date,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, anchor_id, amount, type, description, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    transaction.id,
    transaction.accountId,
    transaction.categoryId,
    transaction.anchorId,
    await encryptNumber(transaction.amount),
    transaction.type,
    await encryptNullable(transaction.description),
    transaction.date,
    transaction.createdAt,
    transaction.updatedAt,
  );

  await enqueueSyncEntry({
    entityType: 'transaction',
    entityId: transaction.id,
    operation: 'create',
    payload: JSON.stringify(transaction),
  });

  return transaction;
}

export async function findAllTransactions(): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions ORDER BY date DESC',
  );
  return Promise.all(rows.map(mapRow));
}

export async function findTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC',
    accountId,
  );
  return Promise.all(rows.map(mapRow));
}

export interface TransactionFilters {
  search?: string;
  accountId?: string | null;
  categoryId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface TransactionQueryOptions extends TransactionFilters {
  limit?: number;
  offset?: number;
}

// Descriptions are encrypted at rest, so a text search can't be pushed down to
// SQL (no LIKE over ciphertext). When searching, this many candidate rows are
// fetched and decrypted in memory before filtering — a reasonable bound for a
// personal finance app's history, not a fully scalable full-text search.
const SEARCH_SCAN_LIMIT = 1000;

export async function findTransactions(
  options: TransactionQueryOptions = {},
): Promise<Transaction[]> {
  const db = await getDatabase();

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.accountId) {
    conditions.push('account_id = ?');
    params.push(options.accountId);
  }
  if (options.categoryId) {
    conditions.push('category_id = ?');
    params.push(options.categoryId);
  }
  if (options.startDate) {
    conditions.push('date >= ?');
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push('date <= ?');
    params.push(options.endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const search = options.search?.trim().toLowerCase();

  if (!search) {
    const rows = await db.getAllAsync<TransactionRow>(
      `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    return Promise.all(rows.map(mapRow));
  }

  const candidateRows = await db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC LIMIT ?`,
    [...params, SEARCH_SCAN_LIMIT],
  );
  const candidates = await Promise.all(candidateRows.map(mapRow));
  const matched = candidates.filter((transaction) =>
    (transaction.description ?? '').toLowerCase().includes(search),
  );

  return matched.slice(offset, offset + limit);
}

export async function findTransactionById(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?', id);
  return row ? mapRow(row) : null;
}

export async function updateTransaction(
  id: string,
  input: Partial<
    Pick<
      Transaction,
      'accountId' | 'categoryId' | 'anchorId' | 'amount' | 'type' | 'description' | 'date'
    >
  >,
): Promise<void> {
  const db = await getDatabase();
  const current = await findTransactionById(id);
  if (!current) return;

  const updated = { ...current, ...input, updatedAt: new Date().toISOString() };

  await db.runAsync(
    `UPDATE transactions
     SET account_id = ?, category_id = ?, anchor_id = ?, amount = ?, type = ?, description = ?, date = ?, updated_at = ?
     WHERE id = ?`,
    updated.accountId,
    updated.categoryId,
    updated.anchorId,
    await encryptNumber(updated.amount),
    updated.type,
    await encryptNullable(updated.description),
    updated.date,
    updated.updatedAt,
    id,
  );

  await enqueueSyncEntry({
    entityType: 'transaction',
    entityId: id,
    operation: 'update',
    payload: JSON.stringify(updated),
  });
}

export async function removeTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);

  await enqueueSyncEntry({
    entityType: 'transaction',
    entityId: id,
    operation: 'delete',
  });
}

export async function upsertTransactionFromRemote(transaction: Transaction): Promise<void> {
  const db = await getDatabase();
  const current = await findTransactionById(transaction.id);

  if (!current) {
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, category_id, anchor_id, amount, type, description, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      transaction.id,
      transaction.accountId,
      transaction.categoryId,
      transaction.anchorId,
      await encryptNumber(transaction.amount),
      transaction.type,
      await encryptNullable(transaction.description),
      transaction.date,
      transaction.createdAt,
      transaction.updatedAt,
    );
    return;
  }

  if (current.updatedAt === transaction.updatedAt) return;

  if (current.updatedAt > transaction.updatedAt) {
    logConflict({
      entityType: 'transaction',
      entityId: transaction.id,
      resolution: 'kept-local',
      localUpdatedAt: current.updatedAt,
      remoteUpdatedAt: transaction.updatedAt,
    });
    return;
  }

  logConflict({
    entityType: 'transaction',
    entityId: transaction.id,
    resolution: 'applied-remote',
    localUpdatedAt: current.updatedAt,
    remoteUpdatedAt: transaction.updatedAt,
  });

  await db.runAsync(
    `UPDATE transactions
     SET account_id = ?, category_id = ?, anchor_id = ?, amount = ?, type = ?, description = ?, date = ?, updated_at = ?
     WHERE id = ?`,
    transaction.accountId,
    transaction.categoryId,
    transaction.anchorId,
    await encryptNumber(transaction.amount),
    transaction.type,
    await encryptNullable(transaction.description),
    transaction.date,
    transaction.updatedAt,
    transaction.id,
  );
}

export async function getSignedAmountTotalByAccount(accountId: string): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Pick<TransactionRow, 'amount' | 'type'>>(
    'SELECT amount, type FROM transactions WHERE account_id = ?',
    accountId,
  );

  let total = 0;
  for (const row of rows) {
    const amount = await decryptNumber(row.amount);
    total += row.type === 'income' ? amount : -amount;
  }

  return total;
}

export interface PeriodTotals {
  totalIncome: number;
  totalExpense: number;
}

export async function getTotalsByPeriod(startDate: string, endDate: string): Promise<PeriodTotals> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Pick<TransactionRow, 'amount' | 'type'>>(
    'SELECT amount, type FROM transactions WHERE date >= ? AND date <= ?',
    [startDate, endDate],
  );

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of rows) {
    const amount = await decryptNumber(row.amount);
    if (row.type === 'income') totalIncome += amount;
    else totalExpense += amount;
  }

  return { totalIncome, totalExpense };
}

export interface CategoryTotal {
  categoryId: string;
  total: number;
}

export async function getExpensesByCategory(
  startDate: string,
  endDate: string,
): Promise<CategoryTotal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Pick<TransactionRow, 'amount' | 'category_id'>>(
    `SELECT amount, category_id FROM transactions
     WHERE type = 'expense' AND date >= ? AND date <= ? AND category_id IS NOT NULL`,
    [startDate, endDate],
  );

  const totalsByCategory = new Map<string, number>();
  for (const row of rows) {
    if (!row.category_id) continue;
    const amount = await decryptNumber(row.amount);
    totalsByCategory.set(row.category_id, (totalsByCategory.get(row.category_id) ?? 0) + amount);
  }

  return Array.from(totalsByCategory.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}
