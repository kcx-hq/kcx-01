import express from 'express';
import * as inquiryRoutes from './inquiry.controller.js';
const router = express.Router();

/**
 * Submit inquiry (client)
 * POST /api/inquiry/submit
 */
router.post('/submit', inquiryRoutes.submitInquiry);

/**
 * Accept inquiry (company – email link)
 * GET /api/inquiry/accept/:id?token=xxx
 */
router.get('/accept/:id', inquiryRoutes.acceptInquiry);

/**
 * Reject inquiry (company – email link)
 * GET /api/inquiry/reject/:id?token=xxx
 */
router.get('/reject/:id', inquiryRoutes.rejectInquiry);

// Boss review page (token-based)
router.get('/review/:id', inquiryRoutes.getBossReviewPage);
router.post('/review/:id/decision', inquiryRoutes.handleBossDecision);

// GET /api/inquiry/slots/by-date?date=YYYY-MM-DD

router.get('/slots/by-date', inquiryRoutes.getSlotsByDate);
export default router;
