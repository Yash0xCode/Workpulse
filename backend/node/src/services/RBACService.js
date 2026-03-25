/**
 * RBAC Service
 * Role-Based Access Control & Permission Management
 * Follows enterprise pattern (Frappe, OrangeHRM)
 */

import { User, Role, Permission, RolePermission } from '../models/index.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

export class RBACService {
  /**
   * Get user's role with all permissions
   */
  static async getUserWithPermissions(userId) {
    const user = await User.findByPk(userId, {
      include: {
        association: 'role',
        include: {
          association: 'permissions',
          through: { attributes: [] },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      userId: user.id,
      role: user.role?.name,
      permissions: user.role?.permissions?.map(p => p.code) || [],
    };
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId, permissionCode) {
    const user = await this.getUserWithPermissions(userId);
    return user.permissions.includes(permissionCode);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static async hasAnyPermission(userId, permissionCodes) {
    const user = await this.getUserWithPermissions(userId);
    return permissionCodes.some(code => user.permissions.includes(code));
  }

  /**
   * Check if user has all specified permissions
   */
  static async hasAllPermissions(userId, permissionCodes) {
    const user = await this.getUserWithPermissions(userId);
    return permissionCodes.every(code => user.permissions.includes(code));
  }

  /**
   * Get all roles with their permissions
   */
  static async getAllRoles() {
    return await Role.findAll({
      include: {
        association: 'permissions',
        through: { attributes: [] },
      },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Assign permission to role
   */
  static async assignPermissionToRole(roleId, permissionId) {
    return await RolePermission.create({
      roleId,
      permissionId,
    });
  }

  /**
   * Revoke permission from role
   */
  static async revokePermissionFromRole(roleId, permissionId) {
    return await RolePermission.destroy({
      where: { roleId, permissionId },
    });
  }
}

export default RBACService;
