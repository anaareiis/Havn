import { getDatabase } from '../client';
import { generateId } from '../id';
import type { Transaction, TransactionType } from '../types';
import { enqueueSyncEntry } from './syncQueueRepository';

interface TransactionRow {
  id: string;
  account_id: string;
  category_id: string | null;
  anchor_id: string | null;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    anchorId: row.anchor_id,
    amount: row.amount,
    type: row.type,
    description: row.description,
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
    transaction.amount,
    transaction.type,
    transaction.description,
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
  return rows.map(mapRow);
}

export async function findTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC',
    accountId,
  );
  return rows.map(mapRow);
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
  if (options.search) {
    conditions.push('description LIKE ?');
    params.push(`%${options.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return rows.map(mapRow);
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
    updated.amount,
    updated.type,
    updated.description,
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
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, anchor_id, amount, type, description, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       account_id = excluded.account_id,
       category_id = excluded.category_id,
       anchor_id = excluded.anchor_id,
       amount = excluded.amount,
       type = excluded.type,
       description = excluded.description,
       date = excluded.date,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at > transactions.updated_at`,
    transaction.id,
    transaction.accountId,
    transaction.categoryId,
    transaction.anchorId,
    transaction.amount,
    transaction.type,
    transaction.description,
    transaction.date,
    transaction.createdAt,
    transaction.updatedAt,
  );
}

export interface PeriodTotals {
  totalIncome: number;
  totalExpense: number;
}

export async function getTotalsByPeriod(startDate: string, endDate: string): Promise<PeriodTotals> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ income: number | null; expense: number | null }>(
    `SELECT
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
     FROM transactions
     WHERE date >= ? AND date <= ?`,
    [startDate, endDate],
  );

  return {
    totalIncome: row?.income ?? 0,
    totalExpense: row?.expense ?? 0,
  };
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
  const rows = await db.getAllAsync<{ category_id: string; total: number }>(
    `SELECT category_id, SUM(amount) as total
     FROM transactions
     WHERE type = 'expense' AND date >= ? AND date <= ? AND category_id IS NOT NULL
     GROUP BY category_id
     ORDER BY total DESC`,
    [startDate, endDate],
  );

  return rows.map((row) => ({ categoryId: row.category_id, total: row.total }));
}
