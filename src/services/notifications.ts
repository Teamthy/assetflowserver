import {
  createNotification,
  findOrganizationAdminRecipients,
  findNotificationRecipient,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../repositories/notifications";
import { NotificationsQuery } from "../types/notifications";
import { env } from "../config/env";
import { NotFoundError } from "../utils/error";
import { logger } from "../utils/logger";
import { sendNotificationEmail } from "./email";

export const createInAppNotification = async (input: Parameters<typeof createNotification>[0]) => {
  try {
    const notification = await createNotification(input);

    void sendEmailForNotification(input).catch((error) => {
      logger.error("Failed to send notification email", {
        organizationId: input.organizationId,
        userId: input.userId,
        type: input.type,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return notification;
  } catch (error) {
    logger.error("Failed to create notification", {
      organizationId: input.organizationId,
      userId: input.userId,
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

export const notifyOrganizationAdmins = async (input: {
  organizationId: string;
  type: Parameters<typeof createNotification>[0]["type"];
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) => {
  const admins = await findOrganizationAdminRecipients(input.organizationId);

  await Promise.all(
    admins.map((admin) =>
      createInAppNotification({
        organizationId: input.organizationId,
        userId: admin.id,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata,
      }),
    ),
  );
};

export const notifyWarrantyExpiringSoon = async (input: {
  organizationId: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  warrantyExpiryDate: Date;
}) => {
  await notifyOrganizationAdmins({
    organizationId: input.organizationId,
    type: "warranty_expiring",
    title: "Asset warranty expiring soon",
    message: `${input.assetName} (${input.assetTag}) warranty expires on ${input.warrantyExpiryDate.toDateString()}.`,
    metadata: {
      assetId: input.assetId,
      warrantyExpiryDate: input.warrantyExpiryDate.toISOString(),
      redirectUrl: `/assets/${input.assetId}`,
    },
  });
};

export const notifyDepreciationRunCompleted = async (input: {
  organizationId: string;
  fiscalYear: number;
  processedCount: number;
  failedCount?: number;
}) => {
  await notifyOrganizationAdmins({
    organizationId: input.organizationId,
    type: "depreciation_completed",
    title: "Depreciation run completed",
    message: `Depreciation run for ${input.fiscalYear} completed for ${input.processedCount} asset(s). ${input.failedCount ?? 0} failed.`,
    metadata: {
      fiscalYear: input.fiscalYear,
      processedCount: input.processedCount,
      failedCount: input.failedCount ?? 0,
      redirectUrl: "/depreciation/report",
    },
  });
};

const sendEmailForNotification = async (
  input: Parameters<typeof createNotification>[0],
) => {
  const recipient = await findNotificationRecipient(input.userId);
  if (!recipient?.email) {
    logger.warn("Notification email skipped because recipient was not found", {
      userId: input.userId,
      type: input.type,
    });
    return;
  }

  const redirectUrl = input.metadata?.redirectUrl;
  const actionUrl =
    typeof redirectUrl === "string" && redirectUrl.length > 0
      ? redirectUrl.startsWith("http")
        ? redirectUrl
        : `${env.FRONTEND_URL}${redirectUrl.startsWith("/") ? "" : "/"}${redirectUrl}`
      : undefined;

  await sendNotificationEmail({
    to: recipient.email,
    userName: `${recipient.firstName} ${recipient.lastName}`.trim(),
    title: input.title,
    message: input.message,
    actionUrl,
  });
};

export const listNotificationsService = async (
  organizationId: string,
  userId: string,
  query: NotificationsQuery,
) => listNotifications(organizationId, userId, query);

export const markNotificationReadService = async (
  organizationId: string,
  userId: string,
  notificationId: string,
) => {
  const record = await markNotificationRead(organizationId, userId, notificationId);
  if (!record) throw new NotFoundError("Notification");
  return record;
};

export const markAllNotificationsReadService = async (
  organizationId: string,
  userId: string,
) => {
  return markAllNotificationsRead(organizationId, userId);
};
