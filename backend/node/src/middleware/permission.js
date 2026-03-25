/**
 * Permission Middleware
 * Enforce permission checks on endpoints
 * Usage: @requirePermission(['leave_approve', 'leave_view'])
 */

import RBACService from '../services/RBACService.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * Middleware factory - check for required permissions
 */
export const requirePermission = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      // Check if user has all required permissions
      const hasPermission = await RBACService.hasAllPermissions(
        req.user.id,
        requiredPermissions
      );

      if (!hasPermission) {
        throw new ForbiddenError(
          `Missing required permissions: ${requiredPermissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory - check for any of the permissions
 */
export const requireAnyPermission = (permissions = []) => {
  return async (req, res, next) => {
    try {
      const hasPermission = await RBACService.hasAnyPermission(req.user.id, permissions);

      if (!hasPermission) {
        throw new ForbiddenError(
          `Missing required permission. Must have one of: ${permissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware - check for specific role
 */
export const requireRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      const userPerms = await RBACService.getUserWithPermissions(req.user.id);

      if (!roles.includes(userPerms.role)) {
        throw new ForbiddenError(
          `Access denied. Required role: ${roles.join(' or ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default { requirePermission, requireAnyPermission, requireRole };
