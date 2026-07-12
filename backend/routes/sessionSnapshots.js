import express from 'express';
import {
  createSessionSnapshotService,
  SessionSnapshotError,
} from '../services/sessionSnapshotService.js';
import { createSupabaseSessionSnapshotRepository } from '../services/supabaseSessionSnapshotRepository.js';

function bearerToken(header) {
  const match = /^Bearer\s+(.+)$/i.exec(header ?? '');
  return match?.[1] ?? null;
}

export function createSessionSnapshotsRouter(repositoryFactory = createSupabaseSessionSnapshotRepository) {
  const router = express.Router();
  router.post('/:sessionId/snapshot', async (req, res) => {
    try {
      const createSnapshot = createSessionSnapshotService(repositoryFactory());
      const snapshot = await createSnapshot({
        accessToken: bearerToken(req.get('authorization')),
        sessionId: req.params.sessionId,
      });
      return res.status(201).json({ snapshot });
    } catch (error) {
      const publicError = error instanceof SessionSnapshotError
        ? error
        : new SessionSnapshotError('snapshot_creation_failed', 400);
      return res.status(publicError.status).json({ error: publicError.code });
    }
  });
  return router;
}

export default createSessionSnapshotsRouter();
