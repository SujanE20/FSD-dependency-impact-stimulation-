import { Router } from 'express';
import { User } from '../models/index.js';
import { allowRoles } from '../middleware/auth.js';
import { logAction } from '../utils/audit.js';

const router = Router();
router.get('/', allowRoles('Admin'), async (_req, res, next) => {
  try { res.json(await User.find().select('name email role active createdAt').sort({ createdAt: -1 })); }
  catch (error) { next(error); }
});
router.patch('/:id/role', allowRoles('Admin'), async (req, res, next) => {
  try {
    if (!['Admin', 'Architect', 'Engineer', 'Viewer'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
    if (req.params.id === req.user.id && req.body.role !== 'Admin') return res.status(400).json({ message: 'You cannot remove your own admin role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('name email role active');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logAction(req, 'change-role', 'user', user._id, { role: user.role });
    res.json(user);
  } catch (error) { next(error); }
});
export default router;
