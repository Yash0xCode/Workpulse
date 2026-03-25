import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcryptjs from 'bcryptjs';

const User = sequelize.define(
  'User',
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
    roleId: {
      type: DataTypes.INTEGER,
      field: 'role_id',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.TEXT,
      field: 'password_hash',
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Hash password before creating
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    user.passwordHash = await bcryptjs.hash(user.passwordHash, 10);
  }
});

// Compare password method
User.prototype.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.passwordHash);
};

export default User;
