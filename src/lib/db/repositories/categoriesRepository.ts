import { getDatabase } from '../client';
import { generateId } from '../id';
import type { Category, CategoryType } from '../types';

interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: CategoryType;
  created_at: string;
}

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type,
    createdAt: row.created_at,
  };
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const db = await getDatabase();
  const category: Category = {
    id: generateId(),
    name: input.name,
    type: input.type,
    icon: input.icon ?? null,
    color: input.color ?? null,
    createdAt: new Date().toISOString(),
  };

  await db.runAsync(
    'INSERT INTO categories (id, name, icon, color, type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    category.id,
    category.name,
    category.icon,
    category.color,
    category.type,
    category.createdAt,
  );

  return category;
}

export async function findAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY name ASC');
  return rows.map(mapRow);
}

export async function findCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', id);
  return row ? mapRow(row) : null;
}

export async function updateCategory(
  id: string,
  input: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'type'>>,
): Promise<void> {
  const db = await getDatabase();
  const current = await findCategoryById(id);
  if (!current) return;

  const updated = { ...current, ...input };

  await db.runAsync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, type = ? WHERE id = ?',
    updated.name,
    updated.icon,
    updated.color,
    updated.type,
    id,
  );
}

export async function removeCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM categories WHERE id = ?', id);
}
