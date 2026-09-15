import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { startOfDay, subDays } from 'date-fns'
import type { Subscription } from '../types/subscription'
import { nextRenewalDate, formatMoney } from './billing'

const isNative = Capacitor.isNativePlatform()

/** Stable numeric id per subscription for (re)scheduling notifications. */
function notifId(subId: string): number {
  let hash = 0
  for (let i = 0; i < subId.length; i++) {
    hash = (hash * 31 + subId.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 2_000_000_000
}

/** Ask for notification permission (native local notifications, or web Notification API). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative) {
    const res = await LocalNotifications.requestPermissions()
    return res.display === 'granted'
  }
  if ('Notification' in window) {
    const res = await Notification.requestPermission()
    return res === 'granted'
  }
  return false
}

export async function notificationsEnabled(): Promise<boolean> {
  if (isNative) {
    const res = await LocalNotifications.checkPermissions()
    return res.display === 'granted'
  }
  if ('Notification' in window) return Notification.permission === 'granted'
  return false
}

/**
 * Reschedule native local notifications for all subs with reminders enabled.
 * No-op on web (background scheduling there needs FCM — see plan follow-ups);
 * web relies on the in-app "Upcoming renewals" surfacing instead.
 */
export async function syncReminders(subs: Subscription[]): Promise<void> {
  if (!isNative) return
  const granted = await notificationsEnabled()
  if (!granted) return

  // Clear previously scheduled notifications so we don't accumulate stale ones.
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    })
  }

  const now = new Date()
  const toSchedule = subs
    .filter((s) => s.active && s.reminderDaysBefore > 0)
    .map((s) => {
      const renewal = nextRenewalDate(s, now)
      const fireAt = startOfDay(subDays(renewal, s.reminderDaysBefore))
      // 09:00 local on the reminder day
      fireAt.setHours(9, 0, 0, 0)
      return { sub: s, fireAt, renewal }
    })
    .filter(({ fireAt }) => fireAt.getTime() > now.getTime())

  if (!toSchedule.length) return

  await LocalNotifications.schedule({
    notifications: toSchedule.map(({ sub, fireAt }) => ({
      id: notifId(sub.id),
      title: `${sub.name} renews soon`,
      body: `${formatMoney(sub.cost, sub.currency)} · ${sub.billingCycle} · in ${sub.reminderDaysBefore} day(s)`,
      schedule: { at: fireAt, allowWhileIdle: true },
    })),
  })
}
