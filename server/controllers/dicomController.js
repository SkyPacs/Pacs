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
        if (!dicomFileName.toLowerCase().endsWith('.dcm')) {
          console.warn(`Skipping non-DICOM file: ${dicomFileName}`);
          continue; 
        }
        if (!Buffer.isBuffer(dicomBuffer)) {
          console.error('dicomBuffer is not a Buffer:', dicomBuffer);
          return res.status(400).json({ message: 'Uploaded file is not a valid Buffer' });
        }
        const dataSet = dicomParser.parseDicom(dicomBuffer);
        const PatientID = dataSet.string('x00100020'); // Patient ID
        const PatientName = dataSet.string('x00100010'); // Patient Name
        const PatientBirthDateStr = dataSet.string('x00100030'); // Patient Birth Date
        const PatientSex = dataSet.string('x00100040'); // Patient Sex
        const StudyDateStr = dataSet.string('x00080020'); // Study Date
        const StudyTime = dataSet.string('x00080030'); // Study Time
        const Modality = dataSet.string('x00080060'); // Modality
        const studyInstanceUID = dataSet.string('x0020000d'); // Study Instance UID
        const seriesInstanceUID = dataSet.string('x0020000e'); // Series Instance UID
        const sopInstanceUID = dataSet.string('x00080018'); // SOP Instance UID

        const PatientBirthDate = moment(PatientBirthDateStr, 'YYYYMMDD').toDate();
        const StudyDate = moment(StudyDateStr, 'YYYYMMDD').toDate(); 
        const age = moment().diff(moment(PatientBirthDate), 'years'); 

        console.log('Extracted metadata:', {
          PatientID,
          PatientName,
          PatientBirthDate,
          PatientSex,
          StudyDate,
          StudyTime,
          Modality,
          age,
          studyInstanceUID,
          seriesInstanceUID,
          sopInstanceUID,
        });

        // Create a FormData instance and append the DICOM file
        const formData = new FormData();
        formData.append('file', dicomBuffer, {
          filename: dicomFileName,
          contentType: 'application/dicom',
        });

        const orthancUrl = process.env.ORTHANC_URL || 'http://localhost:8042';
        console.log('Sending DICOM file to Orthanc at:', orthancUrl);

        try {
          const orthancResponse = await axios.post(`${orthancUrl}/instances`, formData, {
            headers: {
              ...formData.getHeaders(),
            },
          });
          const patientResponse = await axios.get(`${orthancUrl}/patients`);
          console.log(patientResponse.data);
          const patientIds = patientResponse.data;
          const orthancPatientId = patientIds[0];

          let patient = await Patient.findOne({ PatientID });
          
          if (!patient) {
            patient = new Patient({
              PatientID,
              orthancPatientId: orthancPatientId,
              name: PatientName,
              age: age, // Use calculated age
              gender: PatientSex,
              StudyDate: StudyDate, // Use parsed StudyDate
              StudyTime,
              Modality,
              studyInstanceUID, // Add Study Instance UID to patient
              seriesInstanceUID, // Add Series Instance UID to patient
              sopInstanceUID, // Add SOP Instance UID to patient
            });
          } else {
            patient.name = PatientName;
            patient.age = age; 
            patient.gender = PatientSex;
            patient.StudyDate = StudyDate; 
            patient.StudyTime = StudyTime;
            patient.Modality = Modality;
            patient.orthancPatientId = orthancPatientId;
            patient.studyInstanceUID = studyInstanceUID; // Update Study Instance UID
            patient.seriesInstanceUID = seriesInstanceUID; // Update Series Instance UID
            patient.sopInstanceUID = sopInstanceUID; // Update SOP Instance UID
          }
          try {
            await patient.save();
            console.log('Patient saved:', patient);
          } catch (err) {
            console.error('Error saving patient:', err);
            return res.status(500).json({ message: 'Error saving patient information' });
          }
          const newDicomFile = new DicomFile({
            patientId: patient._id,
            PatientID,
            patientName: PatientName,
            patientBirthDate: PatientBirthDate,
            patientSex: PatientSex,
            studyDate: StudyDate,
            studyTime: StudyTime,
            modality: Modality,
            studyInstanceUID, // Store Study Instance UID
            seriesInstanceUID, // Store Series Instance UID
            sopInstanceUID, // Store SOP Instance UID
          });
          const savedDicomFile = await newDicomFile.save();
          dicomPromises.push(savedDicomFile); 
          patient.dicomFiles.push(savedDicomFile._id); 
          await patient.save();
          console.log('DICOM file associated with patient:', savedDicomFile._id);

        } catch (error) {
          console.error('Error sending DICOM file to Orthanc:', error.response ? error.response.data : error.message);
        }
      }
    }
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
      patientID: patient.orthancPatientId,
      patientName: patient.name,
      age: patient.age,
      gender: patient.gender,
      receivingDate: patient.StudyDate,
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