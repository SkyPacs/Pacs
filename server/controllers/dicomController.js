// import axios from 'axios';
// import moment from 'moment';
// import DicomFile from '../models/dicomFileModel.js';
// import Patient from '../models/patientModel.js';

// const ORTHANC_URL = process.env.ORTHANC_URL || 'http://skypacs.in:8042';

// export const processDicomImagesFromOrthanc = async (req, res) => {
//   try {
//     console.log('Fetching instances from Orthanc...');

//     // Fetch instances
//     let instanceIds = [];
//     try {
//       const instancesResponse = await axios.get(`${ORTHANC_URL}/instances`);
//       instanceIds = instancesResponse.data;
//     } catch (error) {
//       console.error('Error fetching instances from Orthanc:', error.message);
//       return res.status(500).json({ message: 'Failed to fetch instances from Orthanc.' });
//     }

//     // Fetch patients
//     let patientIds = [];
//     try {
//       const patientResponse = await axios.get(`${ORTHANC_URL}/patients`);
//       patientIds = patientResponse.data;
//     } catch (error) {
//       console.error('Error fetching patients from Orthanc:', error.message);
//       return res.status(500).json({ message: 'Failed to fetch patients from Orthanc.' });
//     }

//     if (instanceIds.length === 0 || patientIds.length === 0) {
//       return res.status(404).json({ message: 'No DICOM images or patients available in Orthanc.' });
//     }

//     const orthancPatientId = patientIds[patientIds.length - 1]?.trim();

//     for (const instanceId of instanceIds) {
//       try {
//         const metadataResponse = await axios.get(`${ORTHANC_URL}/instances/${instanceId}/tags`);
//         const metadata = metadataResponse.data;

//         const PatientID = metadata['0010,0020']?.Value?.trim();
//         const PatientName = metadata['0010,0010']?.Value || 'Unknown';
//         const PatientSex = metadata['0010,0040']?.Value?.[0] || 'Unknown';
//         const StudyDateStr = metadata['0008,0020']?.Value?.[0];
//         const StudyTime = metadata['0008,0030']?.Value;
//         const Modality = metadata['0008,0060']?.Value;
//         const studyInstanceUID = metadata['0020,000d']?.Value?.trim();
//         const seriesInstanceUID = metadata['0020,000e']?.Value?.trim();
//         const sopInstanceUID = metadata['0008,0018']?.Value?.trim();
//         const PatientAge = metadata['0010,1010']?.Value;
//         const StudyDate = StudyDateStr ? moment(StudyDateStr, 'YYYYMMDD').toDate() : null;

//         if (!PatientID || !studyInstanceUID || !seriesInstanceUID || !sopInstanceUID) {
//           console.error(`Missing required metadata for instance ${instanceId}`);
//           continue;
//         }

//         // Skip duplicate DICOM entries
//         const existingDicom = await DicomFile.findOne({ sopInstanceUID });
//         if (existingDicom) {
//           console.log(`Skipping duplicate DICOM file: ${sopInstanceUID}`);
//           continue;
//         }

//         // Atomically upsert patient
//         let patient;
//         try {
//           patient = await Patient.findOneAndUpdate(
//             { orthancPatientId, studyInstanceUID },
//             {
//               $setOnInsert: {
//                 PatientID,
//                 name: PatientName,
//                 PatientAge,
//                 gender: PatientSex,
//                 StudyDate,
//                 StudyTime,
//                 Modality,
//                 seriesInstanceUID,
//                 sopInstanceUID,
//               },
//             },
//             {
//               new: true,
//               upsert: true,
//             }
//           );
//         } catch (dbError) {
//           console.error('Error saving patient to database:', dbError.message);
//           return res.status(500).json({ message: 'Failed to save patient to the database.' });
//         }

//         // Save the DICOM file
//         const dicomFile = new DicomFile({
//           patientId: patient._id,
//           PatientID,
//           patientName: PatientName,
//           patientSex: PatientSex,
//           studyDate: StudyDate,
//           studyTime: StudyTime,
//           modality: Modality,
//           studyInstanceUID,
//           seriesInstanceUID,
//           sopInstanceUID,
//         });

//         try {
//           await dicomFile.save();
//           patient.dicomFiles.push(dicomFile._id);
//           await patient.save();
//           console.log(`DICOM file metadata saved for patient: ${PatientName}`);
//         } catch (dbError) {
//           console.error('Error saving DICOM file to database:', dbError.message);
//           return res.status(500).json({ message: 'Failed to save DICOM file to the database.' });
//         }

//       } catch (instanceError) {
//         console.error(`Error processing DICOM instance ${instanceId}:`, instanceError.message);
//         continue;
//       }
//     }

//     return res.status(200).json({ message: 'DICOM images processed successfully.' });
//   } catch (error) {
//     console.error('Error processing DICOM images from Orthanc:', error.message);
//     return res.status(500).json({ message: 'Failed to process DICOM images.' });
//   }
// };



import axios from 'axios';
import moment from 'moment';
import DicomFile from '../models/dicomFileModel.js';
import Patient from '../models/patientModel.js';

const ORTHANC_URL = process.env.ORTHANC_URL || 'http://skypacs.in:8042';

export const processDicomImagesFromOrthanc = async (req, res) => {
  try {
    console.log('Fetching instances from Orthanc...');

    // Fetch all instance IDs
    let instanceIds = [];
    try {
      const instancesResponse = await axios.get(`${ORTHANC_URL}/instances`);
      instanceIds = instancesResponse.data;
    } catch (error) {
      console.error('Error fetching instances from Orthanc:', error.message);
      return res.status(500).json({ message: 'Failed to fetch instances from Orthanc.' });
    }

    if (instanceIds.length === 0) {
      return res.status(404).json({ message: 'No DICOM images available in Orthanc.' });
    }

    for (const instanceId of instanceIds) {
      try {
        // Fetch tags/metadata for the instance
        const metadataResponse = await axios.get(`${ORTHANC_URL}/instances/${instanceId}/tags`);
        const metadata = metadataResponse.data;

        // Fetch the correct Orthanc Patient ID for this instance
        let orthancPatientId;
        try {
          const patientIdResponse = await axios.get(`${ORTHANC_URL}/instances/${instanceId}/patient`);
          orthancPatientId = String(patientIdResponse.data.ID).trim();
        } catch (err) {
          console.error(`Failed to fetch patient ID for instance ${instanceId}:`, err.message);
          continue;
        }

        // Extract necessary metadata
        const PatientID = metadata['0010,0020']?.Value?.trim();
        const PatientName = metadata['0010,0010']?.Value || 'Unknown';
        const PatientSex = metadata['0010,0040']?.Value?.[0] || 'Unknown';
        const StudyDateStr = metadata['0008,0020']?.Value?.[0];
        const StudyTime = metadata['0008,0030']?.Value;
        const Modality = metadata['0008,0060']?.Value;
        const studyInstanceUID = metadata['0020,000d']?.Value?.trim();
        const seriesInstanceUID = metadata['0020,000e']?.Value?.trim();
        const sopInstanceUID = metadata['0008,0018']?.Value?.trim();
        const PatientAge = metadata['0010,1010']?.Value;
        const StudyDate = StudyDateStr ? moment(StudyDateStr, 'YYYYMMDD').toDate() : null;

        if (!PatientID || !studyInstanceUID || !seriesInstanceUID || !sopInstanceUID) {
          console.error(`Missing required metadata for instance ${instanceId}`);
          continue;
        }

        // Skip duplicate DICOM entries
        const existingDicom = await DicomFile.findOne({ sopInstanceUID });
        if (existingDicom) {
          console.log(`Skipping duplicate DICOM file: ${sopInstanceUID}`);
          continue;
        }

        // Atomically upsert patient based on orthancPatientId + studyInstanceUID
        let patient;
        try {
          patient = await Patient.findOneAndUpdate(
            { orthancPatientId, studyInstanceUID },
            {
              $setOnInsert: {
                orthancPatientId,
                PatientID,
                name: PatientName,
                PatientAge,
                gender: PatientSex,
                StudyDate,
                StudyTime,
                Modality,
                seriesInstanceUID,
                sopInstanceUID,
              },
            },
            {
              new: true,
              upsert: true,
            }
          );
        } catch (dbError) {
          console.error('Error saving patient to database:', dbError.message);
          return res.status(500).json({ message: 'Failed to save patient to the database.' });
        }

        // Save the DICOM file
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

        try {
          await dicomFile.save();
          patient.dicomFiles.push(dicomFile._id);
          await patient.save();
          console.log(`DICOM file metadata saved for patient: ${PatientName}`);
        } catch (dbError) {
          console.error('Error saving DICOM file to database:', dbError.message);
          return res.status(500).json({ message: 'Failed to save DICOM file to the database.' });
        }

      } catch (instanceError) {
        console.error(`Error processing DICOM instance ${instanceId}:`, instanceError.message);
        continue;
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

