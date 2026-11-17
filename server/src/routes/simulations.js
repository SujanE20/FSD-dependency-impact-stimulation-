import { Router } from 'express';
import { Simulation, System, Notification } from '../models/index.js';
import { simulateImpact } from '../utils/impact.js';
import { logAction } from '../utils/audit.js';

const router = Router();
router.get('/', async (_req, res, next) => {
  try { res.json(await Simulation.find().populate('failedSystem', 'name criticality').populate('impactedSystems.system', 'name criticality type').populate('createdBy', 'name').sort({ createdAt: -1 }).limit(50)); }
  catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    const { failedSystem, algorithm = 'BFS' } = req.body;
    if (!['BFS', 'DFS'].includes(algorithm)) return res.status(400).json({ message: 'Algorithm must be BFS or DFS' });
    if (!await System.exists({ _id: failedSystem })) return res.status(404).json({ message: 'Failed system not found' });
    const result = await simulateImpact(failedSystem, algorithm);
    const simulation = await Simulation.create({
      failedSystem, algorithm, impactedSystems: result.impactedSystems,
      summary: { totalImpacted: result.totalImpacted, riskScore: result.riskScore, riskLevel: result.riskLevel },
      createdBy: req.user._id
    });
    await logAction(req, 'simulate', 'simulation', simulation._id, { failedSystem, algorithm, ...result });
    if (result.riskLevel === 'Critical' || result.riskLevel === 'High') {
      await Notification.create({
        title: `${result.riskLevel} cascade impact detected`,
        message: `${result.totalImpacted} systems may be affected by failure of ${(await System.findById(failedSystem)).name}.`,
        severity: result.riskLevel,
        system: failedSystem
      });
    }
    res.status(201).json(await simulation.populate([{ path: 'failedSystem', select: 'name criticality' }, { path: 'impactedSystems.system', select: 'name criticality type' }]));
  } catch (error) { next(error); }
});
export default router;
