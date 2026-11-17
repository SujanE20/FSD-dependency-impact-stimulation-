import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import { Dependency, System, User } from './models/index.js';

await connectDatabase();
const existing = await User.findOne({ email: 'admin@impact.local' });
if (existing) {
  console.log('Seed data already exists (admin@impact.local).');
  await mongoose.disconnect();
  process.exit(0);
}
const admin = await User.create({
  name: 'Platform Admin',
  email: 'admin@impact.local',
  password: await bcrypt.hash('ChangeMe123!', 12),
  role: 'Admin'
});
const systems = await System.insertMany([
  { name: 'Payment Service', type: 'Service', owner: 'Payments', criticality: 'Critical', businessImpact: 10, health: 'Healthy', environment: 'Production' },
  { name: 'Order Service', type: 'Service', owner: 'Commerce', criticality: 'Critical', businessImpact: 9, health: 'Healthy', environment: 'Production' },
  { name: 'Inventory Service', type: 'Service', owner: 'Operations', criticality: 'High', businessImpact: 8, health: 'Degraded', environment: 'Production' },
  { name: 'Shipping Service', type: 'API', owner: 'Logistics', criticality: 'High', businessImpact: 7, health: 'Healthy', environment: 'Production' },
  { name: 'Orders Database', type: 'Database', owner: 'Data Platform', criticality: 'Critical', businessImpact: 9, health: 'Healthy', environment: 'Production' },
  { name: 'Fulfillment Server', type: 'Server', owner: 'Infrastructure', criticality: 'Medium', businessImpact: 6, health: 'Healthy', environment: 'Production' },
  { name: 'Notification API', type: 'API', owner: 'Customer Experience', criticality: 'Medium', businessImpact: 4, health: 'Healthy', environment: 'Production' }
]);
const edges = [
  [0, 1, 'sync', 'Critical'], [1, 2, 'sync', 'High'], [2, 3, 'async', 'High'],
  [1, 4, 'data', 'Critical'], [3, 5, 'sync', 'Medium'], [2, 6, 'async', 'Medium']
];
await Dependency.insertMany(edges.map(([source, target, type, criticality]) => ({
  source: systems[source]._id, target: systems[target]._id, type, criticality
})));
console.log(`Seeded admin user ${admin.email} and ${systems.length} systems.`);
await mongoose.disconnect();
