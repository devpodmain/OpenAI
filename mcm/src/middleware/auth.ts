import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type AuthContext = {
  tenantId: string
  userId: string
  mode: 'delegated' | 'jwt'
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

function parseBearer(authHeader?: string) {
  if (!authHeader) return undefined
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return undefined
  return parts[1]
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = parseBearer(req.headers.authorization)
  if (!token) return res.status(401).json({error: 'Unauthorized'})

  // Delegated token from Apps SDK (placeholder prefix check)
  if (token.startsWith('appsdk.')) {
    // In real implementation, validate via Apps SDK or JWKS
    // Extract tenant/user from claims handed by host
    req.auth = { tenantId: 'tenant_from_apps_sdk', userId: 'user_from_apps_sdk', mode: 'delegated' }
    return next()
  }

  // Native JWT fallback
  try {
    const secret = process.env.JWT_SECRET || 'dev'
    const decoded = jwt.verify(token, secret) as any
    if (!decoded?.tenant_id || !decoded?.user_id) throw new Error('invalid claims')
    req.auth = { tenantId: decoded.tenant_id, userId: decoded.user_id, mode: 'jwt' }
    return next()
  } catch (e) {
    return res.status(401).json({error: 'Unauthorized'})
  }
}

