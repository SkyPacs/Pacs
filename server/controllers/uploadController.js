import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';
import DicomFile from '../models/dicomFileModel.js';
import Patient from '../models/patientModel.js';

export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, medicalHistory } = req.body;
    if (!name || !age || !gender) {
      return res.status(400).json({ message: "Name, age, and gender are required." });
    }
    const newPatient = new Patient({
      name,
      age,
      gender,
      medicalHistory,
      dicomFiles: [],
      receivingDate: new Date(),
    });
    const savedPatient = await newPatient.save();
    if (req.file) {
      const dicomFiles = [];
      const zipPath = req.file.path;
      const extractPath = path.join('uploads', 'dicom', savedPatient._id.toString());
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
      }
      fs.createReadStream(zipPath)
        .pipe(unzipper.Parse())
        .on('entry', async (entry) => {
          const fileName = entry.path;
          const fileType = entry.type;
          const filePath = path.join(extractPath, fileName);
          if (fileType === 'File' && fileName.endsWith('.dcm')) {
            entry.pipe(fs.createWriteStream(filePath));
            const dicomFile = new DicomFile({
              filePath,
              patient: savedPatient._id,
            });
            const savedDicomFile = await dicomFile.save();
            dicomFiles.push(savedDicomFile._id);
          } else {
            entry.autodrain();
          }
        })
        .on('error', (error) => {
          console.error('Error during ZIP extraction:', error);
          res.status(500).json({ message: 'Error processing ZIP file.' });
        })
        .promise()
        .then(async () => {
          savedPatient.dicomFiles.push(...dicomFiles);
          await savedPatient.save();
          fs.unlinkSync(zipPath);

          res.status(201).json({
            message: 'Patient created and DICOM files uploaded successfully',
            patient: savedPatient,
            dicomFiles,
          });
        })
        .catch((error) => {
          console.error('Error after ZIP extraction:', error);
          res.status(500).json({ message: error.message });
        });
    } else {
      res.status(201).json({
        message: 'Patient created successfully, no DICOM files uploaded',
        patient: savedPatient,
      });
    }
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ message: error.message });
  }
};


 export const getAllPatients = async(req,res)=>{
  try {
    const patients = await Patient.find();
    if(!patients){
      return res.status(404).json({message:"No Patient Found"})
    }
    res.status(200).json(patients)
  } catch (error) {
    console.error("Error fetching patient details")
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}
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
