import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define(
  'Task',
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    assignedToUserId: {
      type: DataTypes.INTEGER,
      field: 'assigned_to_user_id',
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      field: 'created_by_user_id',
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
    },
    dueDate: {
      type: DataTypes.DATE,
      field: 'due_date',
    },
    completedDate: {
      type: DataTypes.DATE,
      field: 'completed_date',
      allowNull: true,
    },
  },
  {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Task;
