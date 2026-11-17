import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { logAction } from '../utils/audit.js';

const router = Router();

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email || !password || password.length < 8) {
      return res.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required' });
    }
    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email is already registered' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role: 'Viewer' });
    await logAction({ user, ip: req.ip }, 'register', 'user', user._id, { role: user.role });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase(), active: true }).select('+password');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    await logAction({ user, ip: req.ip }, 'login', 'user', user._id);
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role });
});

export default router;
