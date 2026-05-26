import type { RequestHandler } from 'express';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

let jwksClient: jwksRsa.JwksClient | null = null;

function getJwksClient(): jwksRsa.JwksClient {
  if (!jwksClient) {
    const keycloakUrl   = process.env['KEYCLOAK_URL']         ?? 'http://localhost:8080';
    const adminRealm    = process.env['KEYCLOAK_ADMIN_REALM'] ?? 'master';
    jwksClient = jwksRsa({
      jwksUri: `${keycloakUrl}/realms/${adminRealm}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }
  return jwksClient;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.decode(token, { complete: true }) as any;
    if (!decoded?.header?.kid) {
      res.status(401).json({ message: 'Token missing key id' });
      return;
    }
    const key       = await getJwksClient().getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();
    const verified  = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    (req as any).user = verified;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export function requireRole(role: string): RequestHandler {
  return (req, res, next) => {
    const roles: string[] = (req as any).user?.realm_access?.roles ?? [];
    if (!roles.includes(role)) {
      res.status(403).json({ message: 'Insufficient role' });
      return;
    }
    next();
  };
}
