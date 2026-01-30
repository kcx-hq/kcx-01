import express from 'express';
import chatController from './chat.controller.js';

const router = express.Router();

// Session endpoints
router.post('/session', chatController.createSession);
router.get('/session/:sessionId', chatController.getSession);

// Message endpoint
router.post('/message', chatController.postMessage);

export default router;
