import { NextFunction, Request, Response } from "express";
import {
    getAssetDashboardService,
    getAuditDashboardService,
    getFinanceDashboardService,
    getMaintenanceDashboardService,
} from "../services/reports.service";
import { AuthenticationError } from "../utils/error";

// ─── Asset Dashboard ──────────────────────────────────────────────────────────

export const getAssetDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId) {
            return next(new AuthenticationError());
        }

        const data = await getAssetDashboardService(req.auth.organizationId);

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Finance Dashboard ────────────────────────────────────────────────────────

export const getFinanceDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId) {
            return next(new AuthenticationError());
        }

        const data = await getFinanceDashboardService(req.auth.organizationId);

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Maintenance Dashboard ────────────────────────────────────────────────────

export const getMaintenanceDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId) {
            return next(new AuthenticationError());
        }

        const data = await getMaintenanceDashboardService(req.auth.organizationId);

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Audit Dashboard ──────────────────────────────────────────────────────────

export const getAuditDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId) {
            return next(new AuthenticationError());
        }

        const data = await getAuditDashboardService(req.auth.organizationId);

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return next(error);
    }
};