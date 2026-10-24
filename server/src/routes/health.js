// src/routes/health.js

import { Router } from 'express';
import { health } from '../controllers/callsController.js';

const router = Router();
router.get('/', health);

export default router;
