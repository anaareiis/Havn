import type { SQLiteDatabase } from 'expo-sqlite';

import { generateId } from './id';
import type { CategoryType } from './types';

interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Alimentação', icon: '🍔', color: '#D14343', type: 'expense' },
  { name: 'Moradia', icon: '🏠', color: '#0F4C81', type: 'expense' },
  { name: 'Transporte', icon: '🚗', color: '#C79A45', type: 'expense' },
  { name: 'Lazer', icon: '🎮', color: '#8A6A22', type: 'expense' },
  { name: 'Saúde', icon: '💊', color: '#2E9E6C', type: 'expense' },
  { name: 'Educação', icon: '📚', color: '#4A9FDE', type: 'expense' },
  { name: 'Compras', icon: '🛍️', color: '#5B6B7C', type: 'expense' },
  { name: 'Salário', icon: '💰', color: '#1F7A54', type: 'income' },
  { name: 'Outros', icon: '📌', color: '#93A5B8', type: 'expense' },
];

export async function seedDefaultCategories(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories',
  );
  if ((existing?.count ?? 0) > 0) return;

  const now = new Date().toISOString();

  for (const category of DEFAULT_CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      generateId(),
      category.name,
      category.icon,
      category.color,
      category.type,
      now,
    );
  }
}
