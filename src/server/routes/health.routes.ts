import { Router } from 'express';
import { getDb } from '../db';
import { storageService } from '../services/storage.service';

const router = Router();

router.get('/', (req, res) => {
  let dbStatus      = 'ok';
  let storageStatus = 'ok';

  try {
    getDb().prepare('SELECT 1').get();
  } catch {
    dbStatus = 'error';
  }

  if (!storageService.isReachable()) {
    storageStatus = 'error';
  }

  const statusCode = dbStatus === 'ok' && storageStatus === 'ok' ? 200 : 503;
  res.status(statusCode).json({
    status:  statusCode === 200 ? 'ok' : 'error',
    db:      dbStatus,
    storage: storageStatus,
    uptime:  Math.floor(process.uptime()),
  });
});

export default router;
