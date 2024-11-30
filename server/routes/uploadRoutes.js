import express from 'express';
import { handleDicomFileUpload,getAllPatientsWithDicomMetadata } from '../controllers/dicomController.js';
import uploadDicomFile from '../middlewares/multerConfig.js'; 
import { downloadAllDicomFiles } from '../controllers/downloadController.js';
const router = express.Router();

router.post('/upload-dicom', uploadDicomFile, handleDicomFileUpload);
router.get('/patients', getAllPatientsWithDicomMetadata);
router.get('/patients/:patientId/dicom/download', downloadAllDicomFiles);


export default router;