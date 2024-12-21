import axios from 'axios';
import moment from 'moment';
import DicomFile from '../models/dicomFileModel.js';
import Patient from '../models/patientModel.js';

const ORTHANC_URL = process.env.ORTHANC_URL || 'http://localhost:8042';

export const processDicomImagesFromOrthanc = async (req, res) => {
  try {
    console.log('Fetching instances from Orthanc...');
    const instancesResponse = await axios.get(`${ORTHANC_URL}/instances`);
    const instanceIds = instancesResponse.data;
    const patientResponse = await axios.get(`${ORTHANC_URL}/patients`);
    const patientIds = patientResponse.data;
    console.log('Orthanc patients:', patientIds);
    const orthancPatientId = patientIds[patientIds.length - 1];
    if (!instanceIds.length) {
      return res.status(404).json({ message: 'No DICOM images available in Orthanc.' });
    }
    for (const instanceId of instanceIds) {
      try {
        const metadataResponse = await axios.get(`${ORTHANC_URL}/instances/${instanceId}/tags`);
        const metadata = metadataResponse.data;
        const PatientID = metadata['0010,0020'].Value[0];
        const PatientName = metadata['0010,0010']?.Value?.[0] || 'Unknown';
        const PatientBirthDateStr = metadata['0010,0030']?.Value?.[0];
        const PatientSex = metadata['0010,0040']?.Value?.[0] || 'Unknown';
        const StudyDateStr = metadata['0008,0020']?.Value?.[0];
        const StudyTime = metadata['0008,0030']?.Value?.[0];
        const Modality = metadata['0008,0060']?.Value?.[0];
        const studyInstanceUID = metadata['0020,000D']?.Value?.[0];
        const seriesInstanceUID = metadata['0020,000E']?.Value?.[0];
        const sopInstanceUID = metadata['0008,0018']?.Value?.[0];
        const PatientAge = metadata['0010,1010']?.Value?.[0];
        const StudyDate = StudyDateStr ? moment(StudyDateStr, 'YYYYMMDD').toDate() : null;
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
          await patient.save();
          console.log('New patient created:', patient);
        }

        // Save DICOM file metadata
        const dicomFile = new DicomFile({
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
        await dicomFile.save();
        patient.dicomFiles.push(dicomFile._id);
        await patient.save();

        console.log(`DICOM file metadata saved for patient: ${PatientName}`);
      } catch (error) {
        console.error(`Error processing DICOM instance ${instanceId}:`, error.response?.data || error.message);
      }
    }
    return res.status(200).json({ message: 'DICOM images processed successfully.' });
  } catch (error) {
    console.error('Error processing DICOM images from Orthanc:', error.message);
    return res.status(500).json({ message: 'Failed to process DICOM images.' });
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

