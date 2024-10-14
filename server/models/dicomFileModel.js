import mongoose from "mongoose";

const dicomFileSchema = new mongoose.Schema({
    PatientID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    PatientID: { // Unique identifier for the patient
        type: String,
        required: true,
    },
    
    patientName: { 
        type: String,
        required: true,
    },
    patientBirthDate: {
        type: Date,
    },
    patientSex: {
        type: String, 
    },
    studyDate: {
        type: Date,
    },
    studyTime: {
        type: String, 
    },
    modality: {
        type: String,
    },
    studyInstanceUID: { type: String, required: true }, // New field
    seriesInstanceUID: { type: String, required: true }, // New field
    sopInstanceUID: { type: String, required: true }, // New field
}, { timestamps: true });

const DicomFile = mongoose.model('DicomFile', dicomFileSchema);

export default DicomFile;
