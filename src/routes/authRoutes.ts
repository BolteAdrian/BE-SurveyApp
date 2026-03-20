import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

router.post('/api/auth/register', authController.register);
router.post('/api/auth/login', authController.login);

export default router;
