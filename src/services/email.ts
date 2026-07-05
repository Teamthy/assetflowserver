import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import { Resend } from "resend";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const resend = new Resend(env.RESEND_API_KEY);
const templateCache = new Map<string, Handlebars.TemplateDelegate<Record<string, string>>>();

const renderTemplate = async (
  templateFileName: string,
  data: Record<string, string>,
) => {
  const templatePath = path.join(__dirname, "../templates/emails", templateFileName);
  let template = templateCache.get(templatePath);
  if (!template) {
    const source = await fs.readFile(templatePath, "utf-8");
    template = Handlebars.compile(source);
    templateCache.set(templatePath, template);
  }
  return template(data);
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

  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: "Your Password Reset OTP",
    html,
  });

  if (error) {
    logger.error("Resend password reset OTP send failed", {
      to: input.to,
      from: env.RESEND_FROM_EMAIL,
      subject: "Your Password Reset OTP",
      resendError: error,
    });
    throw new Error(`Failed to send password reset OTP email: ${JSON.stringify(error)}`);
  }

  logger.info("Resend password reset OTP send success", {
    to: input.to,
    from: env.RESEND_FROM_EMAIL,
    subject: "Your Password Reset OTP",
    resendEmailId: data?.id,
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

  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: "Welcome to the Platform",
    html,
  });

  if (error) {
    logger.error("Resend onboarding welcome send failed", {
      to: input.to,
      from: env.RESEND_FROM_EMAIL,
      subject: "Welcome to the Platform",
      resendError: error,
    });
    throw new Error(`Failed to send onboarding welcome email: ${JSON.stringify(error)}`);
  }

  logger.info("Resend onboarding welcome send success", {
    to: input.to,
    from: env.RESEND_FROM_EMAIL,
    subject: "Welcome to the Platform",
    resendEmailId: data?.id,
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

  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: input.title,
    html,
  });

  if (error) {
    logger.error("Resend notification email send failed", {
      to: input.to,
      from: env.RESEND_FROM_EMAIL,
      subject: input.title,
      resendError: error,
    });
    throw new Error(`Failed to send notification email: ${JSON.stringify(error)}`);
  }

  logger.info("Resend notification email send success", {
    to: input.to,
    from: env.RESEND_FROM_EMAIL,
    subject: input.title,
    resendEmailId: data?.id,
  });
};
