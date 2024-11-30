import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import unzipper from 'unzipper';
import axios from 'axios';
import dicomParser from 'dicom-parser';
import FormData from 'form-data';
import moment from 'moment';
import DicomFile from '../models/dicomFileModel.js';
import Patient from '../models/patientModel.js';

const FINAL_UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads', 'completed');
if (!fs.existsSync(FINAL_UPLOAD_DIR)) {
  fs.mkdirSync(FINAL_UPLOAD_DIR, { recursive: true });
  console.log(`Directory created: ${FINAL_UPLOAD_DIR}`);
}

export const handleDicomFileUpload = async (req, res) => {
  try {
    const { isComplete, fileName, chunkDir } = req.uploadInfo;

    if (!isComplete) {
      return res.status(200).json({ message: 'Chunk uploaded successfully.' });
    }
    const finalZipPath = path.join(FINAL_UPLOAD_DIR, `${fileName}.zip`);
    const chunkFiles = (await fs.promises.readdir(chunkDir))
      .sort((a, b) => parseInt(a.split('_')[1], 10) - parseInt(b.split('_')[1], 10))
      .map((chunk) => fs.promises.readFile(path.join(chunkDir, chunk)));
    const combinedBuffer = Buffer.concat(await Promise.all(chunkFiles));
    await fs.promises.writeFile(finalZipPath, combinedBuffer);
    const zipStream = fs.createReadStream(finalZipPath).pipe(unzipper.Parse({ forceStream: true }));
    const dicomPromises = [];

    for await (const entry of zipStream) {
      if (entry.type === 'File') {
        const dicomBuffer = await entry.buffer();
        try {
          const dataSet = dicomParser.parseDicom(dicomBuffer);
          const PatientID = dataSet.string('x00100020');
          const PatientName = dataSet.string('x00100010');
          const PatientBirthDateStr = dataSet.string('x00100030');
          const PatientSex = dataSet.string('x00100040');
          const StudyDateStr = dataSet.string('x00080020');
          const StudyTime = dataSet.string('x00080030');
          const Modality = dataSet.string('x00080060');
          const studyInstanceUID = dataSet.string('x0020000d');
          const seriesInstanceUID = dataSet.string('x0020000e');
          const sopInstanceUID = dataSet.string('x00080018');
          const PatientAge = dataSet.string('x00101010');
          const StudyDate = StudyDateStr ? moment(StudyDateStr, 'YYYYMMDD').toDate() : null;
          const formData = new FormData();
          formData.append('file', dicomBuffer, {
            filename: entry.path,
            contentType: 'application/dicom',
          });

          const orthancUrl = process.env.ORTHANC_URL || 'http://localhost:8042';
          console.log('Sending DICOM file to Orthanc at:', orthancUrl);

          try {
            const orthancResponse = await axios.post(`${orthancUrl}/instances`, formData, {
              headers: { ...formData.getHeaders() },
            });
            const patientResponse = await axios.get(`${orthancUrl}/patients`);
            const patientIds = patientResponse.data;
            console.log('Orthanc patients:', patientIds);
            const orthancPatientId = patientIds[patientIds.length - 1];
            console.log('Orthanc patient ID:', orthancPatientId);
            let patient = await Patient.findOne({ orthancPatientId });

            if (!patient) {
              patient = new Patient({
                PatientID,
                orthancPatientId,
                name: PatientName,
                PatientAge, 
                gender: PatientSex,
                StudyDate,
                StudyTime,
                Modality,
                studyInstanceUID,
                seriesInstanceUID,
                sopInstanceUID,
              });
            } else {
              // Update existing patient information
              patient.name = PatientName;
              patient.PatientAge = PatientAge;
              patient.gender = PatientSex;
              patient.StudyDate = StudyDate;
              patient.StudyTime = StudyTime;
              patient.Modality = Modality;
              patient.orthancPatientId = orthancPatientId;
              patient.studyInstanceUID = studyInstanceUID;
              patient.seriesInstanceUID = seriesInstanceUID;
              patient.sopInstanceUID = sopInstanceUID;
            }

            await patient.save();
            console.log('Patient saved:', patient);

            // Save DICOM file metadata
            const newDicomFile = new DicomFile({
              patientId: patient._id,
              PatientID,
              patientName: PatientName,
              patientSex: PatientSex,
              studyDate: StudyDate,
              studyTime: StudyTime,
              modality: Modality,
              studyInstanceUID,
              seriesInstanceUID,
              sopInstanceUID,
            });
            const savedDicomFile = await newDicomFile.save();
            dicomPromises.push(savedDicomFile);
            patient.dicomFiles.push(savedDicomFile._id);
            await patient.save();
            console.log('DICOM file associated with patient:', savedDicomFile._id);
          } catch (error) {
            console.error('Error sending DICOM file to Orthanc:', error.response ? error.response.data : error.message);
          }
        } catch (dicomParseError) {
          console.error('Error parsing DICOM file:', dicomParseError);
        }
      }
    }

    // Wait for all DICOM files to be saved
    await Promise.all(dicomPromises);
    console.log('All DICOM files saved successfully.');
    await fs.promises.rmdir(chunkDir, { recursive: true });
    console.log(`Chunk directory ${chunkDir} deleted.`);
    await fs.promises.unlink(finalZipPath);
    console.log(`ZIP file ${finalZipPath} deleted.`);
    return res.status(201).json({ message: 'DICOM files uploaded and metadata saved successfully.' });

  } catch (error) {
    console.error('Error uploading DICOM file:', error);
    return res.status(500).json({ message: error.message });
  }
};


export const getAllPatientsWithDicomMetadata = async (req, res) => {
  try {
    const patients = await Patient.find().populate('dicomFiles'); 

    if (!patients || patients.length === 0) {
      return res.status(404).json({ message: 'No patients found.' });
    }

    // Prepare the response data
    const patientData = patients.map(patient => ({
      orthancPatientId: patient.orthancPatientId,
      patientID: patient.PatientID,
      patientName: patient.name,
      age: patient.PatientAge,
      gender: patient.gender,
      receivingDate: patient.receivingDate,
      studyInstanceUID: patient.studyInstanceUID,
      seriesInstanceUID: patient.seriesInstanceUID,
      sopInstanceUID: patient.sopInstanceUID,
      dicomCount: patient.dicomFiles.length, 
      dicomFiles: patient.dicomFiles.map(dicomFile => ({
        dicomInstanceId: dicomFile.dicomInstanceId,
        studyDate: dicomFile.studyDate,
        studyTime: dicomFile.studyTime,
        modality: dicomFile.modality,
      })),
    }));

    return res.status(200).json({
      message: 'Patients and DICOM files retrieved successfully.',
      data: patientData,
    });
  } catch (error) {
    console.error('Error fetching patients and DICOM files:', error);
    res.status(500).json({ message: error.message });
  }
};

