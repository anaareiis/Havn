import { advanceDate, todayIso } from '../../date';
import { getDatabase } from '../client';
import { generateId } from '../id';
import type { Anchor, AnchorFrequency, TransactionType } from '../types';
import { enqueueSyncEntry } from './syncQueueRepository';
import { createTransaction } from './transactionsRepository';

interface AnchorRow {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  account_id: string;
  frequency: AnchorFrequency;
  next_due_date: string;
  active: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: AnchorRow): Anchor {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    type: row.type,
    categoryId: row.category_id,
    accountId: row.account_id,
    frequency: row.frequency,
    nextDueDate: row.next_due_date,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateAnchorInput {
  name: string;
  amount: number;
  type: TransactionType;
  categoryId?: string | null;
  accountId: string;
  frequency: AnchorFrequency;
  nextDueDate: string;
}

export async function createAnchor(input: CreateAnchorInput): Promise<Anchor> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const anchor: Anchor = {
    id: generateId(),
    name: input.name,
    amount: input.amount,
    type: input.type,
    categoryId: input.categoryId ?? null,
    accountId: input.accountId,
    frequency: input.frequency,
    nextDueDate: input.nextDueDate,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO anchors (id, name, amount, type, category_id, account_id, frequency, next_due_date, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    anchor.id,
    anchor.name,
    anchor.amount,
    anchor.type,
    anchor.categoryId,
    anchor.accountId,
    anchor.frequency,
    anchor.nextDueDate,
    anchor.active ? 1 : 0,
    anchor.createdAt,
    anchor.updatedAt,
  );

  await enqueueSyncEntry({
    entityType: 'anchor',
    entityId: anchor.id,
    operation: 'create',
    payload: JSON.stringify(anchor),
  });

  return anchor;
}

export async function findAllAnchors(): Promise<Anchor[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AnchorRow>('SELECT * FROM anchors ORDER BY next_due_date ASC');
  return rows.map(mapRow);
}

export async function findAnchorById(id: string): Promise<Anchor | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AnchorRow>('SELECT * FROM anchors WHERE id = ?', id);
  return row ? mapRow(row) : null;
}

export async function updateAnchor(
  id: string,
  input: Partial<
    Pick<
      Anchor,
      | 'name'
      | 'amount'
      | 'type'
      | 'categoryId'
      | 'accountId'
      | 'frequency'
      | 'nextDueDate'
      | 'active'
    >
  >,
): Promise<void> {
  const db = await getDatabase();
  const current = await findAnchorById(id);
  if (!current) return;

  const updated = { ...current, ...input, updatedAt: new Date().toISOString() };

  await db.runAsync(
    `UPDATE anchors
     SET name = ?, amount = ?, type = ?, category_id = ?, account_id = ?, frequency = ?, next_due_date = ?, active = ?, updated_at = ?
     WHERE id = ?`,
    updated.name,
    updated.amount,
    updated.type,
    updated.categoryId,
    updated.accountId,
    updated.frequency,
    updated.nextDueDate,
    updated.active ? 1 : 0,
    updated.updatedAt,
    id,
  );

  await enqueueSyncEntry({
    entityType: 'anchor',
    entityId: id,
    operation: 'update',
    payload: JSON.stringify(updated),
  });
}

export async function removeAnchor(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM anchors WHERE id = ?', id);

  await enqueueSyncEntry({
    entityType: 'anchor',
    entityId: id,
    operation: 'delete',
  });
}

export async function upsertAnchorFromRemote(anchor: Anchor): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO anchors (id, name, amount, type, category_id, account_id, frequency, next_due_date, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       amount = excluded.amount,
       type = excluded.type,
       category_id = excluded.category_id,
       account_id = excluded.account_id,
       frequency = excluded.frequency,
       next_due_date = excluded.next_due_date,
       active = excluded.active,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at > anchors.updated_at`,
    anchor.id,
    anchor.name,
    anchor.amount,
    anchor.type,
    anchor.categoryId,
    anchor.accountId,
    anchor.frequency,
    anchor.nextDueDate,
    anchor.active ? 1 : 0,
    anchor.createdAt,
    anchor.updatedAt,
  );
}

export function monthlyEquivalent(amount: number, frequency: AnchorFrequency): number {
  switch (frequency) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'yearly':
      return amount / 12;
    case 'monthly':
    default:
      return amount;
  }
}

export async function getMonthlyCommittedTotal(): Promise<number> {
  const anchors = await findAllAnchors();
  return anchors
    .filter((anchor) => anchor.active)
    .reduce((total, anchor) => total + monthlyEquivalent(anchor.amount, anchor.frequency), 0);
}

const MAX_CATCH_UP_OCCURRENCES = 24;

export async function processDueAnchors(): Promise<number> {
  const today = todayIso();
  const anchors = await findAllAnchors();
  let generatedCount = 0;

  for (const anchor of anchors) {
    if (!anchor.active) continue;

    let nextDueDate = anchor.nextDueDate;
    let occurrences = 0;

    while (nextDueDate <= today && occurrences < MAX_CATCH_UP_OCCURRENCES) {
      await createTransaction({
        accountId: anchor.accountId,
        categoryId: anchor.categoryId,
        anchorId: anchor.id,
        amount: anchor.amount,
        type: anchor.type,
        description: anchor.name,
        date: nextDueDate,
      });

      nextDueDate = advanceDate(nextDueDate, anchor.frequency);
      generatedCount += 1;
      occurrences += 1;
    }

    if (nextDueDate !== anchor.nextDueDate) {
      await updateAnchor(anchor.id, { nextDueDate });
    }
  }

  return generatedCount;
}
