import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

const renderTemplate = async (
  templateFileName: string,
  data: Record<string, string>,
) => {
  const templatePath = path.join(__dirname, "../templates/emails", templateFileName);
  const source = await fs.readFile(templatePath, "utf-8");
  const template = Handlebars.compile(source);
  return template(data);
};

export const sendPasswordResetOtpEmail = async (input: {
  to: string;
  firstName: string;
  otp: string;
}) => {
  const html = await renderTemplate("password-reset-otp.hbs", {
    firstName: input.firstName,
    otp: input.otp,
  });

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: "Your Password Reset OTP",
    html,
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

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: "Welcome to the Platform",
    html,
  });
};
