import express from 'express';
import cors from 'cors';
import prisma from './db/prisma';
import { initI18n } from './i18n';
import router from './routes';
import config from './config';

const app = express();

// Middleware
app.use(cors({
  origin: [config.frontendURL], // Allow frontend dev servers
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize i18n
initI18n(app);

// Routes
app.use(router);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export { prisma };
export default app;
