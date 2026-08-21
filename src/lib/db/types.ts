export type AccountType = 'checking' | 'savings' | 'cash' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: CategoryType;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  anchorId: string | null;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type AnchorFrequency = 'weekly' | 'monthly' | 'yearly';

export interface Anchor {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  accountId: string;
  frequency: AnchorFrequency;
  nextDueDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SyncEntityType = 'account' | 'category' | 'transaction' | 'anchor';
export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'synced' | 'error';

export interface SyncQueueEntry {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: string | null;
  status: SyncStatus;
  errorMessage: string | null;
  createdAt: string;
  syncedAt: string | null;
}
