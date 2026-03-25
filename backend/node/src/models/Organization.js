import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Organization = sequelize.define(
  'Organization',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('corporate', 'education'),
      allowNull: false,
    },
    location: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      validate: { isEmail: true },
    },
    adminName: {
      type: DataTypes.STRING,
      field: 'admin_name',
    },
  },
  {
    tableName: 'organizations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default Organization;
