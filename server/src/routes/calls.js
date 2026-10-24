// src/routes/calls.js

import { Router } from 'express';
import {
  createCallHandler,
  listCallsHandler,
  getCallHandler,
  updateCallHandler,
  deleteCallHandler,
  saveStageHandler,
  closeCallHandler,
  suggestCloseHandler,
} from '../controllers/callsController.js';
import { validateStageParam } from '../middleware/validate.js';

const router = Router();

router.post('/',                      createCallHandler);
router.get('/',                       listCallsHandler);
router.get('/:id',                    getCallHandler);
router.patch('/:id',                  updateCallHandler);
router.put('/:id',                    updateCallHandler);
router.delete('/:id',                 deleteCallHandler);
router.put('/:id/stages/:n',          validateStageParam, saveStageHandler);
router.post('/:id/close',             closeCallHandler);
router.post('/:id/suggest-close',     suggestCloseHandler);

export default router;
