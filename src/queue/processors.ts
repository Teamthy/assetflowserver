import { runWarrantyExpiryJob } from "../jobs/warranty.job";
import { runMaintenanceDueJob } from "../jobs/maintenance.job";

export const processWarrantyJob = async () => {
  await runWarrantyExpiryJob();
};

export const processMaintenanceJob = async () => {
  await runMaintenanceDueJob();
};
