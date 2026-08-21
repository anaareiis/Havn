import * as Notifications from 'expo-notifications';

import { findAllAnchors, getSetting, setSetting } from './db';
import { formatCurrency } from './format';

const ANCHOR_NOTICE_DAYS_KEY = 'anchor_notice_days';
export const DEFAULT_ANCHOR_NOTICE_DAYS = 1;
const NOTIFICATION_HOUR = 9;
const ANCHOR_NOTIFICATION_PREFIX = 'anchor-';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function getAnchorNoticeDays(): Promise<number> {
  const value = await getSetting(ANCHOR_NOTICE_DAYS_KEY);
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_ANCHOR_NOTICE_DAYS;
}

export async function setAnchorNoticeDays(days: number): Promise<void> {
  await setSetting(ANCHOR_NOTICE_DAYS_KEY, String(days));
}

async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;

  const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
  return requestedStatus === 'granted';
}

function anchorNotificationId(anchorId: string): string {
  return `${ANCHOR_NOTIFICATION_PREFIX}${anchorId}`;
}

export async function scheduleAnchorNotifications(noticeDays: number): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const previousAnchorNotificationIds = new Set(
    scheduled
      .map((notification) => notification.identifier)
      .filter((identifier) => identifier.startsWith(ANCHOR_NOTIFICATION_PREFIX)),
  );

  const anchors = await findAllAnchors();
  const now = new Date();
  const activeNotificationIds = new Set<string>();

  for (const anchor of anchors) {
    if (!anchor.active) continue;

    const [year, month, day] = anchor.nextDueDate.split('-').map(Number);
    const notifyAt = new Date(year, month - 1, day - noticeDays, NOTIFICATION_HOUR, 0, 0);
    if (notifyAt <= now) continue;

    const identifier = anchorNotificationId(anchor.id);
    activeNotificationIds.add(identifier);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Âncora vencendo',
        body: `${anchor.name} vence em ${noticeDays} dia(s) — ${formatCurrency(anchor.amount)}`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
    });
  }

  const staleNotificationIds = [...previousAnchorNotificationIds].filter(
    (identifier) => !activeNotificationIds.has(identifier),
  );

  await Promise.all(
    staleNotificationIds.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
}
