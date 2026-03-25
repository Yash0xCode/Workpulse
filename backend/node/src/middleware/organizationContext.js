/**
 * Organization Isolation Middleware
 * Ensures users can only access their organization's data
 * Enterprise HRMS pattern (multi-tenant)
 */

import { ForbiddenError } from '../utils/errors.js';

export const organizationContext = (req, res, next) => {
  if (!req.user?.organizationId) {
    throw new ForbiddenError('Organization context not found');
  }
  req.orgId = req.user.organizationId;
  next();
};

export default organizationContext;
