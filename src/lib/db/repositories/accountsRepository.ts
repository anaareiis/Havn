import { getDatabase } from '../client';
import { generateId } from '../id';
import type { Account, AccountType } from '../types';

interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    balance: row.balance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance?: number;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const account: Account = {
    id: generateId(),
    name: input.name,
    type: input.type,
    balance: input.balance ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    'INSERT INTO accounts (id, name, type, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    account.id,
    account.name,
    account.type,
    account.balance,
    account.createdAt,
    account.updatedAt,
  );

  return account;
}

export async function findAllAccounts(): Promise<Account[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AccountRow>('SELECT * FROM accounts ORDER BY created_at ASC');
  return rows.map(mapRow);
}

export async function findAccountById(id: string): Promise<Account | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?', id);
  return row ? mapRow(row) : null;
}

export async function updateAccount(
  id: string,
  input: Partial<Pick<Account, 'name' | 'type' | 'balance'>>,
): Promise<void> {
  const db = await getDatabase();
  const current = await findAccountById(id);
  if (!current) return;

  const updated = { ...current, ...input, updatedAt: new Date().toISOString() };

  await db.runAsync(
    'UPDATE accounts SET name = ?, type = ?, balance = ?, updated_at = ? WHERE id = ?',
    updated.name,
    updated.type,
    updated.balance,
    updated.updatedAt,
    id,
  );
}

export async function removeAccount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM accounts WHERE id = ?', id);
}
