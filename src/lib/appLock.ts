import { getSetting, setSetting } from './db';

const LOCK_TIMEOUT_KEY = 'lock_timeout_minutes';
export const DEFAULT_LOCK_TIMEOUT_MINUTES = 1;

export async function getLockTimeoutMinutes(): Promise<number> {
  const value = await getSetting(LOCK_TIMEOUT_KEY);
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_LOCK_TIMEOUT_MINUTES;
}

export async function setLockTimeoutMinutes(minutes: number): Promise<void> {
  await setSetting(LOCK_TIMEOUT_KEY, String(minutes));
}
