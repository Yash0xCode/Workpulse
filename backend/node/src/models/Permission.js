import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Permission = sequelize.define(
  'Permission',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: DataTypes.TEXT,
  },
  {
    tableName: 'permissions',
    timestamps: false,
  }
);

export default Permission;
