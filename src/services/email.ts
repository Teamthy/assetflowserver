import fs from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { env } from "../config/env";
import { logger } from "../utils/logger";

type TemplateFn = (data: Record<string, string>) => string;

const templateCache = new Map<string, TemplateFn>();

const isEmailConfigured = () => {
  const key = env.RESEND_API_KEY;
  return Boolean(
    key &&
      key !== "re_dev_placeholder" &&
      !key.startsWith("re_replace"),
  );
};

const renderTemplate = async (
  templateFileName: string,
  data: Record<string, string>,
) => {
  const Handlebars = (await import("handlebars")).default;
  const templatePath = path.join(__dirname, "../templates/emails", templateFileName);
  let template = templateCache.get(templatePath);
  if (!template) {
    const source = await fs.readFile(templatePath, "utf-8");
    template = Handlebars.compile(source);
    templateCache.set(templatePath, template);
  }
  return template(data);
};

const sendHtmlEmail = async (input: {
  to: string;
  subject: string;
  html: string;
  context: Record<string, unknown>;
}) => {
  if (!isEmailConfigured()) {
    logger.warn("Email skipped because RESEND_API_KEY is not configured", {
      to: input.to,
      subject: input.subject,
    });
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    logger.error("Resend send failed", {
      ...input.context,
      to: input.to,
      from: env.RESEND_FROM_EMAIL,
      subject: input.subject,
      resendError: error,
    });
    throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
  }

  logger.info("Resend send success", {
    ...input.context,
    to: input.to,
    from: env.RESEND_FROM_EMAIL,
    subject: input.subject,
    resendEmailId: data?.id,
  });
};

export const sendPasswordResetOtpEmail = async (input: {
  to: string;
  userName: string;
  otp: string;
  expiryMinutes: number;
}) => {
  const html = await renderTemplate("password-reset-otp.hbs", {
    userName: input.userName,
    otp: input.otp,
    expiryMinutes: String(input.expiryMinutes),
    supportEmail: env.SUPPORT_EMAIL,
  });

  await sendHtmlEmail({
    to: input.to,
    subject: "Your Password Reset OTP",
    html,
    context: { kind: "password-reset-otp" },
  });
};

export const sendOnboardingWelcomeEmail = async (input: {
  to: string;
  firstName: string;
  organizationName: string;
}) => {
  const html = await renderTemplate("onboarding-welcome.hbs", {
    firstName: input.firstName,
    organizationName: input.organizationName,
  });

  await sendHtmlEmail({
    to: input.to,
    subject: "Welcome to the Platform",
    html,
    context: { kind: "onboarding-welcome" },
  });
};

export const sendNotificationEmail = async (input: {
  to: string;
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
}) => {
  const html = await renderTemplate("notification.hbs", {
    userName: input.userName,
    title: input.title,
    message: input.message,
    actionUrl: input.actionUrl ?? "",
    supportEmail: env.SUPPORT_EMAIL,
  });

  await sendHtmlEmail({
    to: input.to,
    subject: input.title,
    html,
    context: { kind: "notification" },
  });
};

export const sendInvitationEmail = async (input: {
  to: string;
  inviteeName: string;
  inviterName: string;
  organizationName: string;
  acceptUrl: string;
  expiryHours: number;
}) => {
  const html = await renderTemplate("invite.hbs", {
    inviteeName: input.inviteeName,
    inviterName: input.inviterName,
    organizationName: input.organizationName,
    acceptUrl: input.acceptUrl,
    expiryHours: String(input.expiryHours),
    supportEmail: env.SUPPORT_EMAIL,
  });

  await sendHtmlEmail({
    to: input.to,
    subject: `You've been invited to join ${input.organizationName} on AssetFlow`,
    html,
    context: { kind: "invitation", organizationName: input.organizationName },
  });
};
