import type { Request, Response, NextFunction } from 'express'
import { userStore, type User } from '../store/UserStore'

/**
 * Extended Express Request with authenticated user info
 */
export interface AuthenticatedRequest extends Request {
  user?: User
}

/**
 * Middleware: require valid Bearer token.
 * Attaches `req.user` on success; returns 401 otherwise.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = userStore.getUserByToken(token)
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = user
  next()
}

/**
 * Middleware: require admin role (must be used AFTER requireAuth).
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
