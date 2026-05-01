import { pool } from '../config/db.js';

/**
 * AuditService — logs every create/update/delete action to audit_logs.
 * All parameters are optional; the method never throws so it cannot
 * break a primary operation.
 */
export class AuditService {
  /**
   * @param {object} opts
   * @param {number|null} opts.organizationId
   * @param {number|null} opts.actorUserId
   * @param {string}      opts.action          e.g. 'leave.approved', 'employee.created'
   * @param {string}      opts.resourceType    e.g. 'leave', 'employee', 'payroll_run'
   * @param {number|null} opts.resourceId
   * @param {object|null} opts.beforeState
   * @param {object|null} opts.afterState
   * @param {string|null} opts.ipAddress
   */
  static async log({
    organizationId = null,
    actorUserId = null,
    action,
    resourceType,
    resourceId = null,
    beforeState = null,
    afterState = null,
    ipAddress = null,
  }) {
    try {
      await pool.query(
        `INSERT INTO audit_logs
           (organization_id, actor_user_id, action, resource_type, resource_id,
            before_state, after_state, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          organizationId,
          actorUserId,
          action,
          resourceType,
          resourceId,
          beforeState ? JSON.stringify(beforeState) : null,
          afterState ? JSON.stringify(afterState) : null,
          ipAddress,
        ],
      );
    } catch (_err) {
      // Audit failures must never break the primary operation
    }
  }

  /** Return recent audit entries for an organization (manager / admin only). */
  static async list({ organizationId, resourceType, resourceId, actorUserId, limit = 50, offset = 0 }) {
    const where = ['organization_id = $1'];
    const params = [organizationId];

    if (resourceType) {
      params.push(resourceType);
      where.push(`resource_type = $${params.length}`);
    }
    if (resourceId) {
      params.push(Number(resourceId));
      where.push(`resource_id = $${params.length}`);
    }
    if (actorUserId) {
      params.push(Number(actorUserId));
      where.push(`actor_user_id = $${params.length}`);
    }

    params.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT
         al.id,
         al.action,
         al.resource_type   AS "resourceType",
         al.resource_id     AS "resourceId",
         al.before_state    AS "beforeState",
         al.after_state     AS "afterState",
         al.ip_address      AS "ipAddress",
         al.created_at      AS "createdAt",
         u.name             AS "actorName",
         u.email            AS "actorEmail"
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_user_id
       WHERE ${where.join(' AND ')}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return rows;
  }
}
