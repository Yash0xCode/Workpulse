/**
 * Models Index
 * Centralizes model loading and association setup
 * Following enterprise pattern (Frappe, OrangeHRM)
 */

import Organization from './Organization.js';
import Role from './Role.js';
import Permission from './Permission.js';
import RolePermission from './RolePermission.js';
import User from './User.js';
import Employee from './Employee.js';
import Student from './Student.js';
import Attendance from './Attendance.js';
import Leave from './Leave.js';
import Task from './Task.js';

/**
 * Setup associations
 * This creates the relationships between models
 */
export const setupAssociations = () => {
  // Organization relationships
  Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });
  Organization.hasMany(Employee, { foreignKey: 'organizationId', as: 'employees' });
  Organization.hasMany(Student, { foreignKey: 'organizationId', as: 'students' });
  Organization.hasMany(Attendance, { foreignKey: 'organizationId', as: 'attendance' });
  Organization.hasMany(Leave, { foreignKey: 'organizationId', as: 'leaves' });
  Organization.hasMany(Task, { foreignKey: 'organizationId', as: 'tasks' });

  // User relationships
  User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  User.hasOne(Employee, { foreignKey: 'userId', as: 'employee' });
  User.hasOne(Student, { foreignKey: 'userId', as: 'student' });
  User.hasMany(Task, { foreignKey: 'assignedToUserId', as: 'assignedTasks' });
  User.hasMany(Task, { foreignKey: 'createdByUserId', as: 'createdTasks' });
  User.hasMany(Leave, { foreignKey: 'userId', as: 'leaves' });
  User.hasMany(Attendance, { foreignKey: 'userId', as: 'attendance' });

  // Role relationships
  Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'roleId',
    as: 'permissions',
  });

  // Permission relationships
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permissionId',
    as: 'roles',
  });

  // Employee relationships
  Employee.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Employee.belongsTo(Employee, { foreignKey: 'managerId', as: 'manager' });
  Employee.hasMany(Employee, { foreignKey: 'managerId', as: 'subordinates' });

  // Student relationships
  Student.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Attendance relationships
  Attendance.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Attendance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Leave relationships
  Leave.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Leave.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Leave.belongsTo(User, { foreignKey: 'approvedByUserId', as: 'approver' });

  // Task relationships
  Task.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Task.belongsTo(User, { foreignKey: 'assignedToUserId', as: 'assignee' });
  Task.belongsTo(User, { foreignKey: 'createdByUserId', as: 'creator' });
};

export {
  Organization,
  Role,
  Permission,
  RolePermission,
  User,
  Employee,
  Student,
  Attendance,
  Leave,
  Task,
};
