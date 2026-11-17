import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['Admin', 'Architect', 'Engineer', 'Viewer'], default: 'Viewer' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const systemSchema = new Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Service', 'API', 'Database', 'Server'], required: true },
  description: { type: String, default: '' },
  owner: { type: String, default: 'Unassigned' },
  environment: { type: String, enum: ['Production', 'Staging', 'Development'], default: 'Production' },
  criticality: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  businessImpact: { type: Number, min: 1, max: 10, default: 5 },
  health: { type: String, enum: ['Healthy', 'Degraded', 'Down'], default: 'Healthy' },
  tags: [{ type: String }]
}, { timestamps: true });
systemSchema.index({ name: 'text', description: 'text', owner: 'text' });

const dependencySchema = new Schema({
  source: { type: Schema.Types.ObjectId, ref: 'System', required: true },
  target: { type: Schema.Types.ObjectId, ref: 'System', required: true },
  type: { type: String, enum: ['sync', 'async', 'data'], default: 'sync' },
  description: { type: String, default: '' },
  criticality: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  label: { type: String, default: '' }
}, { timestamps: true });
dependencySchema.index({ source: 1, target: 1 }, { unique: true });

const simulationSchema = new Schema({
  failedSystem: { type: Schema.Types.ObjectId, ref: 'System', required: true },
  algorithm: { type: String, enum: ['BFS', 'DFS'], default: 'BFS' },
  impactedSystems: [{ system: { type: Schema.Types.ObjectId, ref: 'System' }, severity: String, depth: Number, path: [{ type: Schema.Types.ObjectId, ref: 'System' }] }],
  summary: { totalImpacted: { type: Number, default: 0 }, riskScore: { type: Number, default: 0 }, riskLevel: { type: String, default: 'Low' } },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const impactScoreSchema = new Schema({
  system: { type: Schema.Types.ObjectId, ref: 'System', required: true, unique: true },
  score: { type: Number, min: 0, max: 100, required: true },
  level: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  factors: { criticality: Number, dependencyCount: Number, businessImpact: Number },
  calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const reportSchema = new Schema({
  title: { type: String, required: true },
  format: { type: String, enum: ['csv', 'pdf'], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const notificationSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['High', 'Critical'], default: 'High' },
  system: { type: Schema.Types.ObjectId, ref: 'System' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

const auditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  changes: { type: Schema.Types.Mixed, default: {} },
  ipAddress: String
}, { timestamps: true });

export const User = model('User', userSchema);
export const System = model('System', systemSchema);
export const Dependency = model('Dependency', dependencySchema);
export const Simulation = model('Simulation', simulationSchema);
export const ImpactScore = model('ImpactScore', impactScoreSchema);
export const Report = model('Report', reportSchema);
export const Notification = model('Notification', notificationSchema);
export const AuditLog = model('AuditLog', auditLogSchema);
