import { getDatabase } from '../client';
import { generateId } from '../id';
import type { Transaction, TransactionType } from '../types';

interface TransactionRow {
  id: string;
  account_id: string;
  category_id: string | null;
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
    amount: input.amount,
    type: input.type,
    description: input.description ?? null,
    date: input.date,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, amount, type, description, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    transaction.id,
    transaction.accountId,
    transaction.categoryId,
    transaction.amount,
    transaction.type,
    transaction.description,
    transaction.date,
    transaction.createdAt,
    transaction.updatedAt,
  );

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

export async function findTransactionById(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?', id);
  return row ? mapRow(row) : null;
}

export async function updateTransaction(
  id: string,
  input: Partial<
    Pick<Transaction, 'accountId' | 'categoryId' | 'amount' | 'type' | 'description' | 'date'>
  >,
): Promise<void> {
  const db = await getDatabase();
  const current = await findTransactionById(id);
  if (!current) return;

  const updated = { ...current, ...input, updatedAt: new Date().toISOString() };

  await db.runAsync(
    `UPDATE transactions
     SET account_id = ?, category_id = ?, amount = ?, type = ?, description = ?, date = ?, updated_at = ?
     WHERE id = ?`,
    updated.accountId,
    updated.categoryId,
    updated.amount,
    updated.type,
    updated.description,
    updated.date,
    updated.updatedAt,
    id,
  );
}

export async function removeTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}
