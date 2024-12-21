import express from 'express';
import {getAllPatientsWithDicomMetadata,processDicomImagesFromOrthanc} from '../controllers/dicomController.js';
import { downloadAllDicomFiles } from '../controllers/downloadController.js';
const router = express.Router();

router.post('/process-dicom-from-orthanc', processDicomImagesFromOrthanc);
router.get('/patients', getAllPatientsWithDicomMetadata);
router.get('/patients/:patientId/dicom/download', downloadAllDicomFiles);

export default router;
