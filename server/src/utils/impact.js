import { Dependency, ImpactScore, System } from '../models/index.js';

const criticalityWeight = { Low: 1, Medium: 2, High: 3, Critical: 4 };

export function riskLevel(score) {
  if (score >= 76) return 'Critical';
  if (score >= 51) return 'High';
  if (score >= 26) return 'Medium';
  return 'Low';
}

export async function calculateImpactScore(system) {
  const [incoming, outgoing] = await Promise.all([
    Dependency.countDocuments({ target: system._id }),
    Dependency.countDocuments({ source: system._id })
  ]);
  const criticality = criticalityWeight[system.criticality] || 1;
  const score = Math.min(100, Math.round(criticality * 12 + Math.min(incoming + outgoing, 10) * 4 + system.businessImpact * 3));
  const level = riskLevel(score);
  const record = await ImpactScore.findOneAndUpdate(
    { system: system._id },
    { score, level, factors: { criticality, dependencyCount: incoming + outgoing, businessImpact: system.businessImpact }, calculatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return record;
}

export async function simulateImpact(failedSystemId, algorithm = 'BFS') {
  const systems = await System.find().lean();
  const byId = new Map(systems.map((system) => [system._id.toString(), system]));
  const edges = await Dependency.find().lean();
  const adjacency = new Map();
  for (const edge of edges) {
    const source = edge.source.toString();
    const target = edge.target.toString();
    if (!adjacency.has(source)) adjacency.set(source, []);
    adjacency.get(source).push(target);
  }

  const start = failedSystemId.toString();
  if (!byId.has(start)) return null;
  const queue = [{ id: start, path: [start], depth: 0 }];
  const visited = new Set([start]);
  const impacted = [];
  while (queue.length) {
    const current = algorithm === 'BFS' ? queue.shift() : queue.pop();
    for (const next of adjacency.get(current.id) || []) {
      if (visited.has(next)) continue;
      visited.add(next);
      const path = [...current.path, next];
      const system = byId.get(next);
      if (!system) continue;
      impacted.push({
        system: system._id,
        severity: system.criticality,
        depth: current.depth + 1,
        path: path.map((id) => byId.get(id)._id)
      });
      queue.push({ id: next, path, depth: current.depth + 1 });
    }
  }
  const riskScore = impacted.length
    ? Math.round(impacted.reduce((sum, item) => sum + criticalityWeight[item.severity], 0) / impacted.length * 25)
    : 0;
  return { impactedSystems: impacted, totalImpacted: impacted.length, riskScore, riskLevel: riskLevel(riskScore) };
}
