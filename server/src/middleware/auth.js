import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) return res.status(401).json({ message: 'Account is unavailable' });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    next(error);
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' });
    next();
  };
}
