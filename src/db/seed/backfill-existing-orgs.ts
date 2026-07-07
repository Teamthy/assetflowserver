import { and, eq } from "drizzle-orm";
import { db, pool } from "../index";
import { organizations, organizationUsers } from "../../model/user";
import {
    assignRoleToUser,
    findRoleByName,
} from "../../repositories/roles";
import { seedSystemRolesForOrganization } from "../../services/roles.service";
import { SYSTEM_ROLES } from "../../types/roles";
import { logger } from "../../utils/logger";
import { seedPermissions } from "./permissions.seed";


const backfill = async () => {
    logger.info("Backfill: starting...");

    await seedPermissions();

    const orgs = await db.select().from(organizations);
    logger.info(`Backfill: found ${orgs.length} organizations`);

    let orgsProcessed = 0;
    let ownersAssigned = 0;
    let membersAssigned = 0;

    for (const org of orgs) {
        if (!org.ownerUserId) {
            logger.warn(`Backfill: skipping org ${org.id} (${org.name}) — no owner set`);
            continue;
        }

        const roleIds = await seedSystemRolesForOrganization({
            organizationId: org.id,
            ownerUserId: org.ownerUserId,
        });

        await assignRoleToUser({
            organizationId: org.id,
            userId: org.ownerUserId,
            roleId: roleIds[SYSTEM_ROLES.SUPER_ADMIN],
            assignedByUserId: org.ownerUserId,
        });
        ownersAssigned++;

        const staffRole = await findRoleByName(org.id, SYSTEM_ROLES.STAFF);
        if (!staffRole) {
            logger.error(`Backfill: staff role not found for org ${org.id} — skipping members`);
            continue;
        }

        const activeMembers = await db
            .select({ userId: organizationUsers.userId })
            .from(organizationUsers)
            .where(
                and(
                    eq(organizationUsers.organizationId, org.id),
                    eq(organizationUsers.status, "active"),
                ),
            );

        for (const member of activeMembers) {
            if (member.userId === org.ownerUserId) continue;

            await assignRoleToUser({
                organizationId: org.id,
                userId: member.userId,
                roleId: staffRole.id,
                assignedByUserId: org.ownerUserId,
            });
            membersAssigned++;
        }

        orgsProcessed++;
        logger.info(`Backfill: processed org ${org.id} (${org.name})`);
    }

    logger.info("Backfill: complete", {
        orgsProcessed,
        ownersAssigned,
        membersAssigned,
    });
};

const run = async () => {
    try {
        await backfill();
        process.exitCode = 0;
    } catch (error) {
        logger.error("Backfill failed", { error });
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

run();