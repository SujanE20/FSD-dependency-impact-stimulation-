import { Router } from 'express';
import { AuditLog, Dependency, ImpactScore, Notification, Simulation, System } from '../models/index.js';
import { calculateImpactScore } from '../utils/impact.js';

const router = Router();
router.get('/', async (_req, res, next) => {
  try {
    const systems = await System.find().lean();
    const scores = await Promise.all(systems.map((system) => calculateImpactScore(system)));
    const riskDistribution = ['Critical', 'High', 'Medium', 'Low'].map((level) => ({
      name: level, value: scores.filter((score) => score.level === level).length
    }));
    const [dependencyCount, simulations, notifications, auditLogs] = await Promise.all([
      Dependency.countDocuments(),
      Simulation.find().populate('failedSystem', 'name').sort({ createdAt: -1 }).limit(8).lean(),
      Notification.countDocuments({ read: false }),
      AuditLog.find().populate('actor', 'name').sort({ createdAt: -1 }).limit(10).lean()
    ]);
    const topSystems = systems.map((system) => {
      const score = scores.find((item) => item.system.toString() === system._id.toString());
      return { ...system, impactScore: score?.score || 0, riskLevel: score?.level || 'Low' };
    }).sort((a, b) => b.impactScore - a.impactScore).slice(0, 5);
    res.json({
      totals: { systems: systems.length, dependencies: dependencyCount, simulations: await Simulation.countDocuments(), unreadNotifications: notifications },
      riskDistribution, topSystems, recentSimulations: simulations, recentAuditLogs: auditLogs
    });
  } catch (error) { next(error); }
});
router.get('/notifications', async (_req, res, next) => {
  try { res.json(await Notification.find().populate('system', 'name').sort({ createdAt: -1 }).limit(50)); }
  catch (error) { next(error); }
});
router.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) { next(error); }
});
router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.find(req.query.resource ? { resource: req.query.resource } : {}).populate('actor', 'name email').sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) { next(error); }
});
export default router;
