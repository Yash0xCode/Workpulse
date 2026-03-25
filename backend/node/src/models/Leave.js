import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Leave = sequelize.define(
  'Leave',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.INTEGER,
      field: 'organization_id',
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
    },
    leaveType: {
      type: DataTypes.STRING,
      field: 'leave_type',
    },
    fromDate: {
      type: DataTypes.DATE,
      field: 'from_date',
    },
    toDate: {
      type: DataTypes.DATE,
      field: 'to_date',
    },
    reason: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    approvedByUserId: {
      type: DataTypes.INTEGER,
      field: 'approved_by_user_id',
      allowNull: true,
    },
    approvalDate: {
      type: DataTypes.DATE,
      field: 'approval_date',
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      field: 'rejection_reason',
      allowNull: true,
    },
  },
  {
    tableName: 'leaves',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Leave;
