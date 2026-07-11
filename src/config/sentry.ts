import * as Sentry from "@sentry/node";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Initialize Sentry SDK.
 * Must be called BEFORE any other imports that use Sentry (like Express).
 */
export function initSentry(): void {
    // Skip Sentry in dev/test unless DSN is explicitly set
    if (!env.SENTRY_DSN) {
        logger.info("[Sentry] SENTRY_DSN not configured — Sentry disabled");
        return;
    }

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,

        // Performance monitoring sample rate
        // 1.0 = capture 100%, 0.1 = capture 10%
        tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,

        // Profile sample rate
        profilesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,

        // Send default PII (IP address, user info)
        sendDefaultPii: false,

        // Ignore common non-critical errors
        ignoreErrors: [
            // Client-side network errors
            "AbortError",
            "NetworkError",
            // Common client errors we don't need to track
            "ValidationError",
            "AuthenticationError",
            "AuthorizationError",
            "NotFoundError",
            "ConflictError",
            "RateLimitError",
        ],

        // Filter before sending
        beforeSend(event, hint) {
            const error = hint.originalException as { statusCode?: number } | undefined;

            // Don't send 4xx errors — they're client errors, not server bugs
            if (error?.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
                return null;
            }

            // Redact sensitive request data
            if (event.request?.headers) {
                delete event.request.headers.authorization;
                delete event.request.headers.cookie;
            }

            if (event.request?.data && typeof event.request.data === "object") {
                const data = event.request.data as Record<string, unknown>;
                if ("password" in data) data.password = "[REDACTED]";
                if ("currentPassword" in data) data.currentPassword = "[REDACTED]";
                if ("newPassword" in data) data.newPassword = "[REDACTED]";
                if ("passwordHash" in data) data.passwordHash = "[REDACTED]";
                if ("token" in data) data.token = "[REDACTED]";
                if ("refreshToken" in data) data.refreshToken = "[REDACTED]";
            }

            return event;
        },
    });

    logger.info("[Sentry] Initialized successfully", {
        environment: env.NODE_ENV,
        tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
}

/**
 * Set Sentry user context for the current request.
 * Called by auth middleware after successful authentication.
 */
export function setSentryUser(input: {
    userId: string;
    organizationId: string;
    email?: string;
}): void {
    if (!env.SENTRY_DSN) return;

    Sentry.setUser({
        id: input.userId,
        email: input.email,
        organization_id: input.organizationId,
    });
}

/**
 * Add custom context to Sentry event.
 */
export function addSentryContext(
    key: string,
    context: Record<string, unknown>
): void {
    if (!env.SENTRY_DSN) return;
    Sentry.setContext(key, context);
}

/**
 * Manually capture an exception with additional context.
 */
export function captureException(
    error: unknown,
    context?: Record<string, unknown>
): void {
    if (!env.SENTRY_DSN) return;

    Sentry.withScope((scope) => {
        if (context) {
            for (const [key, value] of Object.entries(context)) {
                scope.setExtra(key, value);
            }
        }
        Sentry.captureException(error);
    });
}

/**
 * Manually capture a message.
 */
export function captureMessage(
    message: string,
    level: "info" | "warning" | "error" = "info"
): void {
    if (!env.SENTRY_DSN) return;
    Sentry.captureMessage(message, level);
}

export { Sentry };