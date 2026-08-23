import NetInfo from '@react-native-community/netinfo';

import { ensureSession } from './auth';
import {
  type Account,
  type Anchor,
  type Category,
  type SyncEntityType,
  type Transaction,
  findPendingSyncEntries,
  markSyncEntryError,
  markSyncEntrySynced,
  upsertAccountFromRemote,
  upsertAnchorFromRemote,
  upsertCategoryFromRemote,
  upsertTransactionFromRemote,
} from './db';
import { supabase } from './supabase';

type RemoteTable = 'accounts' | 'categories' | 'anchors' | 'transactions';

function tableForEntity(entityType: SyncEntityType): RemoteTable {
  switch (entityType) {
    case 'account':
      return 'accounts';
    case 'category':
      return 'categories';
    case 'anchor':
      return 'anchors';
    case 'transaction':
      return 'transactions';
  }
}

function toRemoteRow(
  entityType: SyncEntityType,
  payload: unknown,
  userId: string,
): Record<string, unknown> {
  switch (entityType) {
    case 'account': {
      const account = payload as Account;
      return {
        id: account.id,
        user_id: userId,
        name: account.name,
        type: account.type,
        balance: account.balance,
        created_at: account.createdAt,
        updated_at: account.updatedAt,
      };
    }
    case 'category': {
      const category = payload as Category;
      return {
        id: category.id,
        user_id: userId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        created_at: category.createdAt,
      };
    }
    case 'anchor': {
      const anchor = payload as Anchor;
      return {
        id: anchor.id,
        user_id: userId,
        name: anchor.name,
        amount: anchor.amount,
        type: anchor.type,
        category_id: anchor.categoryId,
        account_id: anchor.accountId,
        frequency: anchor.frequency,
        next_due_date: anchor.nextDueDate,
        active: anchor.active,
        created_at: anchor.createdAt,
        updated_at: anchor.updatedAt,
      };
    }
    case 'transaction': {
      const transaction = payload as Transaction;
      return {
        id: transaction.id,
        user_id: userId,
        account_id: transaction.accountId,
        category_id: transaction.categoryId,
        anchor_id: transaction.anchorId,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: transaction.date,
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt,
      };
    }
  }
}

async function pushPendingChanges(userId: string): Promise<void> {
  const entries = await findPendingSyncEntries();

  for (const entry of entries) {
    try {
      const table = tableForEntity(entry.entityType);

      if (entry.operation === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', entry.entityId);
        if (error) throw error;
      } else {
        if (!entry.payload) throw new Error('Missing payload for create/update sync entry');
        const row = toRemoteRow(entry.entityType, JSON.parse(entry.payload), userId);
        const { error } = await supabase.from(table).upsert(row);
        if (error) throw error;
      }

      await markSyncEntrySynced(entry.id);
    } catch (error) {
      await markSyncEntryError(entry.id, error instanceof Error ? error.message : String(error));
    }
  }
}

async function pullRemoteChanges(): Promise<void> {
  const { data: accounts, error: accountsError } = await supabase.from('accounts').select('*');
  if (accountsError) throw accountsError;
  for (const row of accounts ?? []) {
    await upsertAccountFromRemote({
      id: row.id,
      name: row.name,
      type: row.type,
      balance: row.balance,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*');
  if (categoriesError) throw categoriesError;
  for (const row of categories ?? []) {
    await upsertCategoryFromRemote({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type,
      createdAt: row.created_at,
    });
  }

  const { data: anchors, error: anchorsError } = await supabase.from('anchors').select('*');
  if (anchorsError) throw anchorsError;
  for (const row of anchors ?? []) {
    await upsertAnchorFromRemote({
      id: row.id,
      name: row.name,
      amount: row.amount,
      type: row.type,
      categoryId: row.category_id,
      accountId: row.account_id,
      frequency: row.frequency,
      nextDueDate: row.next_due_date,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*');
  if (transactionsError) throw transactionsError;
  for (const row of transactions ?? []) {
    await upsertTransactionFromRemote({
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
    });
  }
}

let isSyncing = false;

export async function syncNow(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || netState.isInternetReachable === false) return;

    const userId = await ensureSession();
    await pushPendingChanges(userId);
    await pullRemoteChanges();
  } finally {
    isSyncing = false;
  }
}

export function watchConnectivityAndSync(): () => void {
  let wasConnected: boolean | null = null;

  const unsubscribe = NetInfo.addEventListener((state) => {
    const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (isConnected && wasConnected === false) {
      syncNow().catch((error) => {
        console.warn('Havn sync failed', error);
      });
    }
    wasConnected = isConnected;
  });

  return unsubscribe;
}
