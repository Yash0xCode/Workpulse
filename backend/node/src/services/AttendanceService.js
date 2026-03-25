/**
 * Attendance Service
 * Business logic for attendance tracking
 */

import { Attendance, Employee, User, sequelize } from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { Op } from 'sequelize';

export class AttendanceService {
  static async checkIn(userId, organizationId, data = {}) {
    // Get employee record
    const employee = await Employee.findOne({
      where: { userId, organizationId },
    });

    if (!employee) {
      throw new NotFoundError('Employee record for user');
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in
    const existing = await Attendance.findOne({
      where: {
        userId,
        organizationId,
        attendanceDate: today,
        checkInTime: { [Op.not]: null },
      },
    });

    if (existing) {
      throw new ValidationError('Already checked in today');
    }

    const attendance = await Attendance.create({
      userId,
      organizationId,
      attendanceDate: today,
      checkInTime: new Date(),
      status: 'present',
      source: data.source || 'mobile',
      faceVerified: data.faceVerified || false,
      latitude: data.latitude,
      longitude: data.longitude,
      locationName: data.locationName,
      distanceMeters: data.distanceMeters,
    });

    return attendance;
  }

  static async checkOut(userId, organizationId) {
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
      where: {
        userId,
        organizationId,
        attendanceDate: today,
      },
    });

    if (!attendance) {
      throw new NotFoundError('Attendance record');
    }

    if (attendance.checkOutTime) {
      throw new ValidationError('Already checked out');
    }

    await attendance.update({
      checkOutTime: new Date(),
    });

    return attendance;
  }

  static async getAttendanceByUser(userId, organizationId, filters = {}, pagination = {}) {
    const { page = 1, limit = 20, offset = 0 } = pagination;
    const { fromDate, toDate, status } = filters;

    let where = {
      userId,
      organizationId,
    };

    if (fromDate || toDate) {
      where.attendanceDate = {};
      if (fromDate) where.attendanceDate[Op.gte] = new Date(fromDate);
      if (toDate) where.attendanceDate[Op.lte] = new Date(toDate);
    }

    if (status) where.status = status;

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      limit,
      offset,
      order: [['attendanceDate', 'DESC']],
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

  static async getAttendanceAnalytics(organizationId, period = 'month') {
    // Get date range
    let startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);

    const stats = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_employees
      FROM attendance_logs
      WHERE organization_id = $1 AND attendance_date >= $2
      GROUP BY status
    `, {
      replacements: [organizationId, startDate],
      type: sequelize.QueryTypes.SELECT,
    });

    return stats;
  }
}

export default AttendanceService;
