import FormData from 'form-data';
import axios from 'axios';
import dicomParser from 'dicom-parser';
import DicomFile from '../models/dicomFileModel.js';
import Patient from '../models/patientModel.js';
import AdmZip from 'adm-zip';
import { Buffer } from 'buffer'; 
import moment from 'moment';
// export const createPatient = async (req, res) => {
//   try {
//     const { name, age, gender, medicalHistory } = req.body;
//     if (!name || !age || !gender) {
//       return res.status(400).json({ message: "Name, age, and gender are required." });
//     }
//     const newPatient = new Patient({
//       name,
//       age,
//       gender,
//       medicalHistory,
//       dicomFiles: [],
//       receivingDate: new Date(),
//     });
//     const savedPatient = await newPatient.save();
//     if (req.file) {
//       const dicomFiles = [];
//       const zipPath = req.file.path;
//       const extractPath = path.join('uploads', 'dicom', savedPatient._id.toString());
//       if (!fs.existsSync(extractPath)) {
//         fs.mkdirSync(extractPath, { recursive: true });
//       }
//       fs.createReadStream(zipPath)
//         .pipe(unzipper.Parse())
//         .on('entry', async (entry) => {
//           const fileName = entry.path;
//           const fileType = entry.type;
//           const filePath = path.join(extractPath, fileName);
//           if (fileType === 'File' && fileName.endsWith('.dcm')) {
//             entry.pipe(fs.createWriteStream(filePath));
//             const dicomFile = new DicomFile({
//               filePath,
//               patient: savedPatient._id,
//             });
//             const savedDicomFile = await dicomFile.save();
//             dicomFiles.push(savedDicomFile._id);
//           } else {
//             entry.autodrain();
//           }
//         })
//         .on('error', (error) => {
//           console.error('Error during ZIP extraction:', error);
//           res.status(500).json({ message: 'Error processing ZIP file.' });
//         })
//         .promise()
//         .then(async () => {
//           savedPatient.dicomFiles.push(...dicomFiles);
//           await savedPatient.save();
//           fs.unlinkSync(zipPath);

//           res.status(201).json({
//             message: 'Patient created and DICOM files uploaded successfully',
//             patient: savedPatient,
//             dicomFiles,
//           });
//         })
//         .catch((error) => {
//           console.error('Error after ZIP extraction:', error);
//           res.status(500).json({ message: error.message });
//         });
//     } else {
//       res.status(201).json({
//         message: 'Patient created successfully, no DICOM files uploaded',
//         patient: savedPatient,
//       });
//     }
//   } catch (error) {
//     console.error('Error creating patient:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

export const handleDicomFileUpload = async (req, res) => {
  try {
    const zipFile = req.file;
    console.log('Received ZIP file:', zipFile);

    if (!zipFile) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const zip = new AdmZip(zipFile.buffer);
    const zipEntries = zip.getEntries();

    // Validate ZIP entries
    if (zipEntries.length === 0) {
      console.error('No files found in the ZIP archive');
      return res.status(400).json({ message: 'No files found in the ZIP archive' });
    }

    const dicomPromises = [];

    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const dicomBuffer = entry.getData();
        const dicomFileName = entry.entryName;
        console.log('Processing DICOM file:', dicomFileName);

        if (!Buffer.isBuffer(dicomBuffer)) {
          console.error('dicomBuffer is not a Buffer:', dicomBuffer);
          return res.status(400).json({ message: 'Uploaded file is not a valid Buffer' });
        }

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
          console.log('PatientAge:', PatientAge);
          // Parse dates and calculate age
          // const PatientBirthDate = PatientBirthDateStr ? moment(PatientBirthDateStr, 'YYYYMMDD').toDate() : null;
           const StudyDate = StudyDateStr ? moment(StudyDateStr, 'YYYYMMDD').toDate() : null;
          // const age = PatientBirthDate ? moment().diff(moment(PatientBirthDate), 'years') : null;

          console.log('Extracted metadata:', {
            PatientID,
            PatientName,
            //PatientBirthDate,
            PatientSex,
            StudyDate,
            StudyTime,
            Modality,
            PatientAge,
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID,
          });

          // Create FormData and append the DICOM file for Orthanc
          const formData = new FormData();
          formData.append('file', dicomBuffer, {
            filename: dicomFileName,
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
            // Upsert patient data
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
              // patientBirthDate: PatientBirthDate,
              patientSex: PatientSex,
              studyDate: StudyDate,
              studyTime: StudyTime,
              modality: Modality,
              studyInstanceUID,
              seriesInstanceUID,
              sopInstanceUID,
            });
            const savedDicomFile = await newDicomFile.save();
            dicomPromises.push(savedDicomFile); // Save promise to array

            // Link DICOM file to the patient
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
      studyInstanceUID:patient.studyInstanceUID,
      seriesInstanceUID:patient.seriesInstanceUID,
      sopInstanceUID:patient.sopInstanceUID,
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

export const searchPatientByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Patient name is required." });
    }
    const patient = await Patient.findOne({ name: { $regex: name, $options: 'i' } }).populate('dicomFiles');
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }
    res.status(200).json({
      success: true,
      message: "Patient found.",
      patient,
    });
  } catch (error) {
    console.error("Error searching patient:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }
    await DicomFile.deleteMany({ patient: id });
    await Patient.findByIdAndDelete(id);
    res.status(200).json({ message: "Patient deleted successfully." });
  }
  catch (error) {
    console.error("Error deleting patient:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}