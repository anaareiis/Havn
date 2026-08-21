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
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}
