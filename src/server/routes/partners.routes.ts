import { Router } from 'express';
import { partnersService, NotFoundError, ConflictError, BadRequestError } from '../services/partners.service';
import { upload } from '../middlewares/upload.middleware';
// import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

function getUserSub(req: any): string {
  return req.user?.sub ?? req.user?.email ?? 'anonymous';
}

function filesToMap(files: Express.Multer.File[]): Record<string, Express.Multer.File> {
  const map: Record<string, Express.Multer.File> = {};
  for (const file of files ?? []) map[file.fieldname] = file;
  return map;
}

function handleError(res: any, err: unknown): void {
  if (err instanceof NotFoundError)   { res.status(404).json({ message: (err as Error).message }); return; }
  if (err instanceof ConflictError)   { res.status(409).json({ message: (err as Error).message }); return; }
  if (err instanceof BadRequestError) { res.status(400).json({ message: (err as Error).message }); return; }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}

// ─── Config template — must be BEFORE /:partnerId ────────────────────────────
// router.get('/config-template', requireAuth, requireRole('partner-admin'), (req, res) => {
router.get('/config-template', (req, res) => {
  res.json(partnersService.getConfigTemplate());
});

// ─── Asset upload — must be BEFORE /:partnerId ───────────────────────────────
// router.post('/assets', requireAuth, requireRole('partner-admin'), upload.any(), async (req, res) => {
router.post('/assets', upload.any(), async (req, res) => {
  try {
    const { partnerId, type } = req.query as { partnerId: string; type: string };
    if (!partnerId || !type) {
      res.status(400).json({ message: 'Query params partnerId and type are required' });
      return;
    }
    const files = req.files as Express.Multer.File[];
    const file  = (files ?? []).find((f) => f.fieldname === 'file');
    if (!file) {
      res.status(400).json({ message: 'No file provided in field "file"' });
      return;
    }
    const result = await partnersService.uploadAssetFile(partnerId, type, file);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── List all ─────────────────────────────────────────────────────────────────
// router.get('/', requireAuth, requireRole('partner-admin'), (req, res) => {
router.get('/', (req, res) => {
  try {
    res.json(partnersService.findAll());
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Create ───────────────────────────────────────────────────────────────────
// router.post('/', requireAuth, requireRole('partner-admin'), upload.any(), async (req, res) => {
router.post('/', upload.any(), async (req, res) => {
  try {
    const files  = filesToMap(req.files as Express.Multer.File[]);
    const result = await partnersService.create(req.body, files, getUserSub(req));
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Update ───────────────────────────────────────────────────────────────────
// router.put('/:partnerId', requireAuth, requireRole('partner-admin'), upload.any(), async (req, res) => {
router.put('/:partnerId', upload.any(), async (req, res) => {
  try {
    const files  = filesToMap(req.files as Express.Multer.File[]);
    const result = await partnersService.update(req.params['partnerId'], req.body, files, getUserSub(req));
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Patch status ─────────────────────────────────────────────────────────────
// router.patch('/:partnerId/status', requireAuth, requireRole('partner-admin'), (req, res) => {
router.patch('/:partnerId/status', (req, res) => {
  try {
    const isActive = req.body?.isActive;
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ message: 'isActive (boolean) is required' });
      return;
    }
    res.json(partnersService.updateStatus(req.params['partnerId'], isActive));
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Soft delete ──────────────────────────────────────────────────────────────
// router.delete('/:partnerId', requireAuth, requireRole('partner-admin'), (req, res) => {
router.delete('/:partnerId', (req, res) => {
  try {
    res.json(partnersService.softDelete(req.params['partnerId'], getUserSub(req)));
  } catch (err) {
    handleError(res, err);
  }
});

// ─── History ──────────────────────────────────────────────────────────────────
// router.get('/:partnerId/history', requireAuth, requireRole('partner-admin'), (req, res) => {
router.get('/:partnerId/history', (req, res) => {
  try {
    res.json(partnersService.getHistory(req.params['partnerId']));
  } catch (err) {
    handleError(res, err);
  }
});

// ─── Public: get one ─────────────────────────────────────────────────────────
router.get('/:partnerId', (req, res) => {
  try {
    res.json(partnersService.findOne(req.params['partnerId']));
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
