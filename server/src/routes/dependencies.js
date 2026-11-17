import { Router } from 'express';
import { Dependency, System } from '../models/index.js';
import { allowRoles } from '../middleware/auth.js';
import { logAction } from '../utils/audit.js';

const router = Router();
router.get('/', async (_req, res, next) => {
  try { res.json(await Dependency.find().populate('source target', 'name type criticality health')); }
  catch (error) { next(error); }
});
router.post('/', allowRoles('Admin', 'Architect', 'Engineer'), async (req, res, next) => {
  try {
    const { source, target } = req.body;
    if (!source || !target || source === target) return res.status(400).json({ message: 'Distinct source and target systems are required' });
    const [sourceSystem, targetSystem] = await Promise.all([System.exists({ _id: source }), System.exists({ _id: target })]);
    if (!sourceSystem || !targetSystem) return res.status(404).json({ message: 'Both dependency systems must exist' });
    const dependency = await Dependency.create(req.body);
    await logAction(req, 'create', 'dependency', dependency._id, req.body);
    res.status(201).json(await dependency.populate('source target', 'name type criticality health'));
  } catch (error) { next(error); }
});
router.patch('/:id', allowRoles('Admin', 'Architect', 'Engineer'), async (req, res, next) => {
  try {
    const dependency = await Dependency.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('source target', 'name type criticality health');
    if (!dependency) return res.status(404).json({ message: 'Dependency not found' });
    await logAction(req, 'update', 'dependency', dependency._id, req.body);
    res.json(dependency);
  } catch (error) { next(error); }
});
router.delete('/:id', allowRoles('Admin', 'Architect'), async (req, res, next) => {
  try {
    const dependency = await Dependency.findByIdAndDelete(req.params.id);
    if (!dependency) return res.status(404).json({ message: 'Dependency not found' });
    await logAction(req, 'delete', 'dependency', dependency._id);
    res.status(204).end();
  } catch (error) { next(error); }
});
export default router;
