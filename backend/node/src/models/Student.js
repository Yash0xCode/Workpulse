import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Student = sequelize.define(
  'Student',
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
    rollNo: {
      type: DataTypes.STRING,
      field: 'roll_no',
    },
    course: DataTypes.STRING,
    semester: DataTypes.INTEGER,
    cgpa: {
      type: DataTypes.DECIMAL(3, 2),
    },
    attendancePercent: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'attendance_percent',
    },
  },
  {
    tableName: 'students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Student;
