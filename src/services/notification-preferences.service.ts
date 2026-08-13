import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  notificationPreferences,
  type StoredNotificationPreference,
} from "../model/notification-preferences";

export const DEFAULT_NOTIFICATION_PREFERENCES: StoredNotificationPreference[] = [
  { key: "asset_assigned", label: "Asset assigned to me", description: "When an asset is assigned to you", inApp: true, email: true },
  { key: "asset_transferred", label: "Asset transferred", description: "When an asset is transferred to or from you", inApp: true, email: true },
  { key: "maintenance_assigned", label: "Maintenance task assigned", description: "New maintenance tasks assigned to you", inApp: true, email: true },
  { key: "maintenance_due", label: "Maintenance due soon", description: "Reminders 48 hours before due date", inApp: true, email: true },
  { key: "maintenance_overdue", label: "Maintenance overdue", description: "Alerts when tasks pass their due date", inApp: true, email: true },
  { key: "warranty_expiring", label: "Warranty expiring", description: "Notifications 30 and 7 days before expiry", inApp: true, email: false },
  { key: "asset_disposed", label: "Asset disposed", description: "When any organization asset is disposed", inApp: true, email: false },
  { key: "depreciation_recorded", label: "Depreciation recorded", description: "When depreciation snapshots are added", inApp: true, email: false },
  { key: "system", label: "System alerts", description: "Important updates and announcements", inApp: true, email: true },
];

const mergePreferences = (
  stored?: StoredNotificationPreference[] | null,
): StoredNotificationPreference[] => {
  const byKey = new Map((stored ?? []).map((item) => [item.key, item]));
  return DEFAULT_NOTIFICATION_PREFERENCES.map((defaults) => {
    const override = byKey.get(defaults.key);
    return override
      ? {
          ...defaults,
          inApp: Boolean(override.inApp),
          email: Boolean(override.email),
        }
      : defaults;
  });
};

export async function getNotificationPreferencesService(
  organizationId: string,
  userId: string,
) {
  const [record] = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.organizationId, organizationId),
        eq(notificationPreferences.userId, userId),
      ),
    )
    .limit(1);

  return mergePreferences(record?.preferences);
}

export async function updateNotificationPreferencesService(input: {
  organizationId: string;
  userId: string;
  preferences: StoredNotificationPreference[];
}) {
  const next = mergePreferences(input.preferences);

  await db
    .insert(notificationPreferences)
    .values({
      organizationId: input.organizationId,
      userId: input.userId,
      preferences: next,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [notificationPreferences.organizationId, notificationPreferences.userId],
      set: {
        preferences: next,
        updatedAt: new Date(),
      },
    });

  return next;
}
