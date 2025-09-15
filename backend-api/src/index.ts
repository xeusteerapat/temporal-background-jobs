import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectToDatabase, closeDatabaseConnection } from './db/mongodb';
import applicationsRouter from './routes/applications';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/applications', applicationsRouter);

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { getApplicationsCollection } = await import('./db/mongodb');
    await getApplicationsCollection().findOne({}, { limit: 1 });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'backend-api',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'backend-api',
      error: 'Database connection failed'
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`Backend API server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await closeDatabaseConnection();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      await closeDatabaseConnection();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();