// import express from 'express';
// import { createPatient,deletePatient,getAllPatients, searchPatientByName } from '../controllers/uploadController.js';
// import { downloadDicomFiles } from '../controllers/downloadController.js';
// import upload from '../middlewares/multerConfig.js'; 
// import { protect } from '../middlewares/authMiddleware.js'; 

// const router = express.Router();

// router.post('/patients', protect,  upload.single('dicomZip'), createPatient);
// router.delete('/deletepatient/:id', protect, deletePatient);
// router.get('/getpatients', getAllPatients); 
// router.get('/download/:id', downloadDicomFiles); 
// router.get('/getpatientname',searchPatientByName)
// export default router;
import express from 'express';
import { handleDicomFileUpload,getAllPatientsWithDicomMetadata } from '../controllers/dicomController.js';
import uploadDicomFile from '../middlewares/multerConfig.js'; 
import { downloadAllDicomFiles } from '../controllers/downloadController.js';
const router = express.Router();

router.post('/upload-dicom', uploadDicomFile, handleDicomFileUpload);
router.get('/patients', getAllPatientsWithDicomMetadata);
router.get('/patients/:patientId/dicom/download', downloadAllDicomFiles);


export default router;