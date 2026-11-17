import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { Dependency, ImpactScore, Report, System } from '../models/index.js';
import { calculateImpactScore } from '../utils/impact.js';
import { logAction } from '../utils/audit.js';

const router = Router();
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
router.get('/', async (_req, res, next) => {
  try { res.json(await Report.find().populate('createdBy', 'name').sort({ createdAt: -1 }).limit(50)); }
  catch (error) { next(error); }
});
router.post('/export', async (req, res, next) => {
  try {
    const format = req.body.format === 'pdf' ? 'pdf' : 'csv';
    const systems = await System.find().lean();
    const scores = await Promise.all(systems.map((system) => calculateImpactScore(system)));
    const scoreMap = new Map(scores.map((score) => [score.system.toString(), score]));
    const rows = systems.map((system) => ({ ...system, ...scoreMap.get(system._id.toString())?.toObject?.() }));
    const report = await Report.create({ title: `Impact analysis ${new Date().toISOString()}`, format, createdBy: req.user._id, metadata: { systems: rows.length, dependencies: await Dependency.countDocuments() } });
    await logAction(req, 'export', 'report', report._id, { format });
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="dependency-impact-report.csv"');
      const columns = ['name', 'type', 'owner', 'environment', 'criticality', 'health', 'businessImpact', 'score', 'level'];
      res.write(`${columns.join(',')}\r\n`);
      for (const system of systems) {
        const score = scoreMap.get(system._id.toString());
        res.write(`${[system.name, system.type, system.owner, system.environment, system.criticality, system.health, system.businessImpact, score?.score ?? '', score?.level ?? ''].map(csvCell).join(',')}\r\n`);
      }
      return res.end();
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="dependency-impact-report.pdf"');
    const pdf = new PDFDocument({ margin: 48 });
    pdf.pipe(res);
    pdf.fontSize(20).text('Dependency Impact Analysis', { continued: false });
    pdf.moveDown().fontSize(10).text(`Generated ${new Date().toLocaleString()} · ${systems.length} systems · ${report.metadata.dependencies} dependencies`);
    pdf.moveDown();
    for (const system of systems) {
      const score = scoreMap.get(system._id.toString());
      pdf.fontSize(12).text(`${system.name} — ${score?.level || 'Low'} risk (${score?.score || 0}/100)`);
      pdf.fontSize(9).fillColor('#555').text(`${system.type} · ${system.criticality} criticality · ${system.health} · Owner: ${system.owner}`);
      pdf.fillColor('#000').moveDown(0.6);
      if (pdf.y > 700) pdf.addPage();
    }
    pdf.end();
  } catch (error) { next(error); }
});
export default router;
