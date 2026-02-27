import express from 'express';
import * as authController from './auth.controller.js';
import { decodeUser } from '../../../middlewares/decodeUser.js';

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.signIn);
router.post('/signin', authController.signIn);
router.get('/me', decodeUser , authController.getUser);
router.put('/profile', decodeUser , authController.updateProfile);
router.get('/logout', decodeUser , authController.logout);  
router.post('/verify' , authController.verifyEmail);
router.post('/verify-email' , authController.verifyEmail);
router.post("/reset", authController.forgotPassword);
router.post("/forgot-password", authController.forgotPassword );
router.post("/reset/:token", authController.resetPassword);
router.post("/reset-password/:token", authController.resetPassword );

export default router;
