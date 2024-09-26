import path from 'path';
import archiver from 'archiver';
import Patient from '../models/patientModel.js';
import DicomFile from '../models/dicomFileModel.js';

export const downloadDicomFiles = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findById(patientId).populate('dicomFiles');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment(`dicom_files_${patientId}.zip`);
    archive.on('error', (err) => {
      throw err;
    });
    archive.pipe(res);
    for (const dicomFileId of patient.dicomFiles) {
      const dicomFile = await DicomFile.findById(dicomFileId);
      if (dicomFile) {
        archive.file(path.resolve(dicomFile.filePath), { name: path.basename(dicomFile.filePath) });
      }
    }
    await archive.finalize();
  } catch (error) {
    console.error('Error downloading DICOM files:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
