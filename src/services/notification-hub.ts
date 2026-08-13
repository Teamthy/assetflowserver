import type { Response } from "express";
import { logger } from "../utils/logger";

type HubClient = {
  userId: string;
  organizationId: string;
  res: Response;
};

const clients = new Set<HubClient>();

export const subscribeNotificationStream = (client: HubClient) => {
  clients.add(client);
  client.res.on("close", () => {
    clients.delete(client);
  });
};

export const publishNotificationEvent = (input: {
  userId: string;
  organizationId: string;
  event: string;
  data: unknown;
}) => {
  const payload = `event: ${input.event}\ndata: ${JSON.stringify(input.data)}\n\n`;

  for (const client of clients) {
    if (client.userId !== input.userId || client.organizationId !== input.organizationId) {
      continue;
    }

    try {
      client.res.write(payload);
    } catch (error) {
      logger.warn("Failed to write SSE event", {
        userId: client.userId,
        error: error instanceof Error ? error.message : String(error),
      });
      clients.delete(client);
    }
  }
};
