import { hasPermission } from '../config/rbac.js'

export const requirePermission = (permission) => {
  return (req, res, next) => {
    const role = req.user?.role
    if (!role || !hasPermission(role, permission)) {
      return res.status(403).json({ message: 'Permission denied', permission })
    }

    return next()
  }
}
