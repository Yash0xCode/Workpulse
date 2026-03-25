import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(new UnauthorizedError('Missing authentication token'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'workpulse-secret');
    req.user = payload;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    }
    return next(new UnauthorizedError('Invalid token'));
  }
};

export default authMiddleware;
