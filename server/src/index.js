import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDatabase } from './config/db.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import systemRoutes from './routes/systems.js';
import dependencyRoutes from './routes/dependencies.js';
import simulationRoutes from './routes/simulations.js';
import reportRoutes from './routes/reports.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api', authenticate);
app.use('/api/users', userRoutes);
app.use('/api/systems', systemRoutes);
app.use('/api/dependencies', dependencyRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
connectDatabase().then(() => app.listen(port, () => console.log(`API listening on ${port}`))).catch((error) => {
  console.error('Unable to start API:', error);
  process.exit(1);
});
