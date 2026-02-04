import express from 'express';
import * as authController from './auth.controller.js';
import { decodeUser } from '../../../middlewares/decodeUser.js';
import { auth } from 'googleapis/build/src/apis/abusiveexperiencereport/index.js';

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.get('/me', decodeUser , authController.getUser);
router.put('/profile', decodeUser , authController.updateProfile);
router.get('/logout', decodeUser , authController.logout);  
router.post('/verify-email' , authController.verifyEmail);
// POST /api/auth/forgot-password
router.post("/forgot-password", authController.forgotPassword );

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", authController.resetPassword );

export default router;