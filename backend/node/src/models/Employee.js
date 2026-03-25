import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Employee = sequelize.define(
  'Employee',
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
    employeeCode: {
      type: DataTypes.STRING,
      field: 'employee_code',
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    department: DataTypes.STRING,
    designation: DataTypes.STRING,
    role: DataTypes.STRING,
    skills: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    joiningDate: {
      type: DataTypes.DATE,
      field: 'joining_date',
    },
    salary: {
      type: DataTypes.DECIMAL(12, 2),
    },
    managerId: {
      type: DataTypes.INTEGER,
      field: 'manager_id',
    },
    location: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Active',
    },
    phone: DataTypes.STRING,
    attendance: DataTypes.STRING,
    productivity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'employees',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Employee;
