import {
  completeMaintenanceTaskById,
  createMaintenanceTask,
  findMaintenanceTaskById,
  listMaintenanceTasks,
  updateMaintenanceTaskById,
} from "../repositories/maintenance";
import {
  CompleteMaintenanceInput,
  CreateMaintenanceInput,
  MaintenanceListQuery,
  UpdateMaintenanceInput,
} from "../types/maintenance";
import { NotFoundError } from "../utils/error";
import { logger } from "../utils/logger";
import { createInAppNotification } from "./notifications";

export const createMaintenanceService = async (
  organizationId: string,
  actorUserId: string,
  payload: CreateMaintenanceInput,
) => {
  const record = await createMaintenanceTask(organizationId, actorUserId, payload);
  if (!record) throw new NotFoundError("Maintenance task");

  if (record.assignedTo) {
    await createInAppNotification({
      organizationId,
      userId: record.assignedTo,
      type: "maintenance_due",
      title: "Maintenance task assigned",
      message: `${record.title} has been assigned to you.`,
      metadata: {
        maintenanceId: record.id,
        assetId: record.assetId,
        redirectUrl: `/maintenance/${record.id}`,
      },
    });
  }

  logger.info("Maintenance task created", {
    organizationId,
    actorUserId,
    maintenanceId: record.id,
    assetId: record.assetId,
  });

  return record;
};

export const listMaintenanceService = async (
  organizationId: string,
  query: MaintenanceListQuery,
) => listMaintenanceTasks(organizationId, query);

export const getMaintenanceByIdService = async (organizationId: string, maintenanceId: string) => {
  const record = await findMaintenanceTaskById(organizationId, maintenanceId);
  if (!record) throw new NotFoundError("Maintenance task");
  return record;
};

export const updateMaintenanceService = async (
  organizationId: string,
  maintenanceId: string,
  actorUserId: string,
  payload: UpdateMaintenanceInput,
) => {
  const previous = await findMaintenanceTaskById(organizationId, maintenanceId);
  if (!previous) throw new NotFoundError("Maintenance task");

  const record = await updateMaintenanceTaskById(organizationId, maintenanceId, actorUserId, payload);
  if (!record) throw new NotFoundError("Maintenance task");

  if (record.assignedTo && record.assignedTo !== previous.assignedTo) {
    await createInAppNotification({
      organizationId,
      userId: record.assignedTo,
      type: "maintenance_due",
      title: "Maintenance task assigned",
      message: `${record.title} has been assigned to you.`,
      metadata: {
        maintenanceId: record.id,
        assetId: record.assetId,
        redirectUrl: `/maintenance/${record.id}`,
      },
    });
  }

  logger.info("Maintenance task updated", {
    organizationId,
    actorUserId,
    maintenanceId,
  });

  return record;
};

export const completeMaintenanceService = async (
  organizationId: string,
  maintenanceId: string,
  actorUserId: string,
  _payload: CompleteMaintenanceInput,
) => {
  const record = await completeMaintenanceTaskById(organizationId, maintenanceId, actorUserId);
  if (!record) throw new NotFoundError("Maintenance task");

  if (record.assignedTo) {
    await createInAppNotification({
      organizationId,
      userId: record.assignedTo,
      type: "maintenance_completed",
      title: "Maintenance task completed",
      message: `${record.title} has been marked as completed.`,
      metadata: {
        maintenanceId: record.id,
        assetId: record.assetId,
        redirectUrl: `/maintenance/${record.id}`,
      },
    });
  }

  logger.info("Maintenance task completed", {
    organizationId,
    actorUserId,
    maintenanceId,
  });

  return record;
};
