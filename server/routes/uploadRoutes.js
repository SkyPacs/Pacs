import express from 'express';
import { createPatient,getAllPatients, searchPatientByName } from '../controllers/uploadController.js';
import { downloadDicomFiles } from '../controllers/downloadController.js';
import upload from '../middlewares/multerConfig.js'; 
import { protect } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

router.post('/patients', protect,  upload.single('dicomZip'), createPatient); 
router.get('/getpatients', getAllPatients); 
router.get('/download/:id', downloadDicomFiles); 
router.get('/getpatientname',searchPatientByName)
export default router;

