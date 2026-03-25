/**
 * Employee Service
 * Business logic for employee management
 * Follows DDD pattern (Domain-Driven Design)
 */

import { Employee, User, sequelize } from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { Op } from 'sequelize';

export class EmployeeService {
  static async getEmployees(organizationId, filters = {}, pagination = {}) {
    const { page = 1, limit = 20, offset = 0 } = pagination;
    const { search, department, status, managerId } = filters;

    let where = { organizationId };

    // Add filters
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeCode: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (department) where.department = department;
    if (status) where.status = status;
    if (managerId) where.managerId = managerId;

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'email', 'name'] },
        { association: 'manager', attributes: ['id', 'name'] },
      ],
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  static async getEmployeeById(id, organizationId) {
    const employee = await Employee.findOne({
      where: { id, organizationId },
      include: [
        { association: 'user', attributes: ['id', 'email', 'name', 'isActive'] },
        { association: 'manager', attributes: ['id', 'name'] },
        { association: 'subordinates', attributes: ['id', 'name', 'designation'] },
      ],
    });

    if (!employee) {
      throw new NotFoundError('Employee');
    }

    return employee;
  }

  static async createEmployee(organizationId, data) {
    // Validation
    if (!data.name || !data.email || !data.department || !data.designation) {
      throw new ValidationError('Required fields: name, email, department, designation', {
        name: !data.name ? ['Required'] : [],
        email: !data.email ? ['Required'] : [],
        department: !data.department ? ['Required'] : [],
        designation: !data.designation ? ['Required'] : [],
      });
    }

    try {
      const employee = await Employee.create({
        organizationId,
        ...data,
        status: data.status || 'Active',
      });

      return await this.getEmployeeById(employee.id, organizationId);
    } catch (error) {
      throw new Error(`Failed to create employee: ${error.message}`);
    }
  }

  static async updateEmployee(id, organizationId, data) {
    const employee = await this.getEmployeeById(id, organizationId);

    // Update allowed fields
    const allowedFields = [
      'name',
      'email',
      'department',
      'designation',
      'role',
      'skills',
      'joiningDate',
      'salary',
      'managerId',
      'location',
      'status',
      'phone',
      'attendance',
      'productivity',
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        updateData[field] = data[field];
      }
    });

    await employee.update(updateData);
    return await this.getEmployeeById(id, organizationId);
  }

  static async deleteEmployee(id, organizationId) {
    const employee = await this.getEmployeeById(id, organizationId);
    // Soft delete by marking as inactive
    await employee.update({ status: 'Inactive' });
    return { success: true };
  }

  static async getTeamMembers(managerId, organizationId, pagination = {}) {
    const { page = 1, limit = 20, offset = 0 } = pagination;

    const { count, rows } = await Employee.findAndCountAll({
      where: {
        organizationId,
        managerId,
      },
      include: [{ association: 'user', attributes: ['id', 'email', 'name'] }],
      limit,
      offset,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

export default EmployeeService;
