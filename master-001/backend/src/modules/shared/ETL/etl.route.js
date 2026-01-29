import express from 'express';
import multer from 'multer'; // 1. Import multer
import { decodeUser } from '../../../middlewares/decodeUser.js';
import { uploadBillingCsv  , getAllBillingUploads} from './billing.controller.js';

const router = express.Router();

// 2. Configure Multer (Temporary storage)
// This saves the file to an 'uploads' folder so your controller can read it
const upload = multer({ dest: 'uploads/' });

// 3. Use upload.single('file')
// The string 'file' MUST match the name used in your frontend: formData.append('file', file)
router.post('/', decodeUser, upload.single('file'), uploadBillingCsv);
router.get('/get-billing-uploads', decodeUser, getAllBillingUploads);

export default router;