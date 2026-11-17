import { Router } from 'express';
import { System, Notification } from '../models/index.js';
import { allowRoles } from '../middleware/auth.js';
import { calculateImpactScore } from '../utils/impact.js';
import { logAction } from '../utils/audit.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const { search, type, criticality, health } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (criticality) filter.criticality = criticality;
    if (health) filter.health = health;
    if (search) filter.$text = { $search: search };
    const systems = await System.find(filter).sort({ updatedAt: -1 }).lean();
    const scores = await Promise.all(systems.map((system) => calculateImpactScore(system)));
    const scoreById = new Map(scores.map((score) => [score.system.toString(), score]));
    res.json(systems.map((system) => ({ ...system, impactScore: scoreById.get(system._id.toString())?.score || 0, riskLevel: scoreById.get(system._id.toString())?.level || 'Low' })));
  } catch (error) { next(error); }
});
router.post('/', allowRoles('Admin', 'Architect', 'Engineer'), async (req, res, next) => {
  try {
    const system = await System.create(req.body);
    const impactScore = await calculateImpactScore(system);
    await logAction(req, 'create', 'system', system._id, system.toObject());
    if (['High', 'Critical'].includes(impactScore.level)) {
      await Notification.create({ title: `${impactScore.level} risk system added`, message: `${system.name} has an impact score of ${impactScore.score}.`, severity: impactScore.level, system: system._id });
    }
    res.status(201).json({ ...system.toObject(), impactScore: impactScore.score, riskLevel: impactScore.level });
  } catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => {
  try {
    const system = await System.findById(req.params.id);
    if (!system) return res.status(404).json({ message: 'System not found' });
    res.json({ ...system.toObject(), impact: await calculateImpactScore(system) });
  } catch (error) { next(error); }
});
router.patch('/:id', allowRoles('Admin', 'Architect', 'Engineer'), async (req, res, next) => {
  try {
    const system = await System.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!system) return res.status(404).json({ message: 'System not found' });
    const impact = await calculateImpactScore(system);
    await logAction(req, 'update', 'system', system._id, req.body);
    res.json({ ...system.toObject(), impactScore: impact.score, riskLevel: impact.level });
  } catch (error) { next(error); }
});
router.delete('/:id', allowRoles('Admin', 'Architect'), async (req, res, next) => {
  try {
    const system = await System.findByIdAndDelete(req.params.id);
    if (!system) return res.status(404).json({ message: 'System not found' });
    await logAction(req, 'delete', 'system', system._id, { name: system.name });
    res.status(204).end();
  } catch (error) { next(error); }
});
export default router;
