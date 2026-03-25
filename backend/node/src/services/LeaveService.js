/**
 * Leave Service
 * Business logic for leave management
 */

import { Leave, Employee, User } from '../models/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import { Op } from 'sequelize';

export class LeaveService {
  static async createLeaveRequest(userId, organizationId, data) {
    // Validation
    if (!data.leaveType || !data.fromDate || !data.toDate) {
      throw new ValidationError('Required fields: leaveType, fromDate, toDate', {
        leaveType: !data.leaveType ? ['Required'] : [],
        fromDate: !data.fromDate ? ['Required'] : [],
        toDate: !data.toDate ? ['Required'] : [],
      });
    }

    const fromDate = new Date(data.fromDate);
    const toDate = new Date(data.toDate);

    if (fromDate > toDate) {
      throw new ValidationError('fromDate must be before toDate');
    }

    if (fromDate < new Date()) {
      throw new ValidationError('Cannot request leave for past dates');
    }

    // Check for overlapping leaves
    const existing = await Leave.findOne({
      where: {
        userId,
        organizationId,
        status: { [Op.in]: ['approved', 'pending'] },
        [Op.or]: [
          {
            fromDate: { [Op.between]: [fromDate, toDate] },
          },
          {
            toDate: { [Op.between]: [fromDate, toDate] },
          },
          {
            [Op.and]: [
              { fromDate: { [Op.lte]: fromDate } },
              { toDate: { [Op.gte]: toDate } },
            ],
          },
        ],
      },
    });

    if (existing) {
      throw new ConflictError('Overlapping leave already exists');
    }

    const leave = await Leave.create({
      userId,
      organizationId,
      leaveType: data.leaveType,
      fromDate,
      toDate,
      reason: data.reason || '',
      status: 'pending',
    });

    return leave;
  }

  static async getLeaves(organizationId, filters = {}, pagination = {}) {
    const { page = 1, limit = 20, offset = 0 } = pagination;
    const { userId, status, leaveType } = filters;

    let where = { organizationId };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (leaveType) where.leaveType = leaveType;

    const { count, rows } = await Leave.findAndCountAll({
      where,
      include: [
        { association: 'user', attributes: ['id', 'name', 'email'] },
        { association: 'approver', attributes: ['id', 'name'] },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
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

  static async approveLeave(leaveId, organizationId, approverUserId) {
    const leave = await Leave.findOne({
      where: { id: leaveId, organizationId },
    });

    if (!leave) {
      throw new NotFoundError('Leave request');
    }

    if (leave.status !== 'pending') {
      throw new ValidationError('Can only approve pending leaves');
    }

    await leave.update({
      status: 'approved',
      approvedByUserId: approverUserId,
      approvalDate: new Date(),
    });

    return leave;
  }

  static async rejectLeave(leaveId, organizationId, rejectionReason) {
    const leave = await Leave.findOne({
      where: { id: leaveId, organizationId },
    });

    if (!leave) {
      throw new NotFoundError('Leave request');
    }

    if (leave.status !== 'pending') {
      throw new ValidationError('Can only reject pending leaves');
    }

    await leave.update({
      status: 'rejected',
      rejectionReason,
    });

    return leave;
  }
}

export default LeaveService;
