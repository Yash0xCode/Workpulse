import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Attendance = sequelize.define(
  'Attendance',
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
    attendanceDate: {
      type: DataTypes.DATE,
      field: 'attendance_date',
    },
    checkInTime: {
      type: DataTypes.DATE,
      field: 'check_in_time',
    },
    checkOutTime: {
      type: DataTypes.DATE,
      field: 'check_out_time',
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'present',
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: 'manual',
    },
    faceVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'face_verified',
    },
    locationVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'location_verified',
    },
    latitude: DataTypes.DECIMAL(10, 7),
    longitude: DataTypes.DECIMAL(10, 7),
    locationName: {
      type: DataTypes.STRING,
      field: 'location_name',
    },
    locationCity: {
      type: DataTypes.STRING,
      field: 'location_city',
    },
    distanceMeters: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'distance_meters',
    },
    notes: DataTypes.TEXT,
  },
  {
    tableName: 'attendance_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Attendance;
