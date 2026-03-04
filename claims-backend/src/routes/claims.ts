import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getClaims, getClaimById, updateClaimStatus } from '../controllers/claimsController';

const router = Router();

router.use(authenticate);

router.get('/', getClaims);
router.get('/:id', getClaimById);
router.patch('/:id/status', updateClaimStatus);

export default router;