import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    scope: {
      type: DataTypes.ENUM('corporate', 'education', 'global'),
      allowNull: false,
    },
  },
  {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Role;
