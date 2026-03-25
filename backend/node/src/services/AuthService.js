/**
 * Authentication Service
 * Handles signup, login, JWT token generation
 * Follows enterprise security pattern (Frappe, OrangeHRM)
 */

import jwt from 'jsonwebtoken';
import { User, Organization, Role } from '../models/index.js';
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';

export class AuthService {
  static async findUserByEmail(email) {
    return await User.findOne({
      where: { email: email.toLowerCase() },
      include: [
        { association: 'organization', attributes: ['id', 'name', 'type'] },
        { association: 'role', attributes: ['id', 'name', 'scope'] },
      ],
    });
  }

  static async signup(organizationName, organizationType, email, password, adminName) {
    // Validation
    if (!organizationName || !organizationType || !email || !password || !adminName) {
      throw new ValidationError('All fields are required', {
        organizationName: !organizationName ? ['Required'] : [],
        organizationType: !organizationType ? ['Required'] : [],
        email: !email ? ['Required'] : [],
        password: !password ? ['Required'] : [],
        adminName: !adminName ? ['Required'] : [],
      });
    }

    // Check if user exists
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const sequelize = User.sequelize;

    try {
      return await sequelize.transaction(async (transaction) => {
        // Create organization
        const org = await Organization.create(
          {
            name: organizationName,
            type: organizationType,
            adminName,
            email,
          },
          { transaction }
        );

        // Get or create role
        const roleName = organizationType === 'education' ? 'institute_admin' : 'super_admin';
        let role = await Role.findOne({ where: { name: roleName } }, { transaction });

        if (!role) {
          role = await Role.create(
            {
              name: roleName,
              scope: organizationType,
            },
            { transaction }
          );
        }

        // Create user
        const user = await User.create(
          {
            organizationId: org.id,
            roleId: role.id,
            name: adminName,
            email: email.toLowerCase(),
            passwordHash: password,
            isActive: true,
          },
          { transaction }
        );

        return {
          organization: {
            id: org.id,
            name: org.name,
            type: org.type,
          },
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        };
      });
    } catch (error) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  }

  static async login(email, password) {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role?.name,
      },
      process.env.JWT_SECRET || 'workpulse-secret',
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role?.name,
      },
    };
  }

  static async getMe(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { association: 'organization', attributes: ['id', 'name', 'type'] },
        { association: 'role', attributes: ['id', 'name'] },
        { association: 'employee', attributes: ['id', 'employeeCode', 'department', 'designation'] },
      ],
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }
}

export default AuthService;
