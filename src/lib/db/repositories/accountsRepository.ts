import { logConflict } from '../../conflictLog';
import { getDatabase } from '../client';
import { generateId } from '../id';
import type { Account, AccountType } from '../types';
import { enqueueSyncEntry } from './syncQueueRepository';

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

  await enqueueSyncEntry({
    entityType: 'account',
    entityId: account.id,
    operation: 'create',
    payload: JSON.stringify(account),
  });

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

  await enqueueSyncEntry({
    entityType: 'account',
    entityId: id,
    operation: 'update',
    payload: JSON.stringify(updated),
  });
}

export async function removeAccount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM accounts WHERE id = ?', id);

  await enqueueSyncEntry({
    entityType: 'account',
    entityId: id,
    operation: 'delete',
  });
}

export async function upsertAccountFromRemote(account: Account): Promise<void> {
  const db = await getDatabase();
  const current = await findAccountById(account.id);

  if (!current) {
    await db.runAsync(
      'INSERT INTO accounts (id, name, type, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      account.id,
      account.name,
      account.type,
      account.balance,
      account.createdAt,
      account.updatedAt,
    );
    return;
  }

  if (current.updatedAt === account.updatedAt) return;

  if (current.updatedAt > account.updatedAt) {
    logConflict({
      entityType: 'account',
      entityId: account.id,
      resolution: 'kept-local',
      localUpdatedAt: current.updatedAt,
      remoteUpdatedAt: account.updatedAt,
    });
    return;
  }

  logConflict({
    entityType: 'account',
    entityId: account.id,
    resolution: 'applied-remote',
    localUpdatedAt: current.updatedAt,
    remoteUpdatedAt: account.updatedAt,
  });

  await db.runAsync(
    'UPDATE accounts SET name = ?, type = ?, balance = ?, updated_at = ? WHERE id = ?',
    account.name,
    account.type,
    account.balance,
    account.updatedAt,
    account.id,
  );
}

export async function getAccountBalance(id: string): Promise<number> {
  const db = await getDatabase();
  const account = await findAccountById(id);
  if (!account) return 0;

  const result = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total
     FROM transactions WHERE account_id = ?`,
    id,
  );

  return account.balance + (result?.total ?? 0);
}

export interface AccountWithBalance extends Account {
  currentBalance: number;
}

export async function findAllAccountsWithBalance(): Promise<AccountWithBalance[]> {
  const accounts = await findAllAccounts();
  return Promise.all(
    accounts.map(async (account) => ({
      ...account,
      currentBalance: await getAccountBalance(account.id),
    })),
  );
}
