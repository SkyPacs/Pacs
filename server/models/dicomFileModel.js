import mongoose from "mongoose";

const dicomFileSchema = new mongoose.Schema({
    PatientID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    PatientID: { 
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
    studyInstanceUID: { type: String, required: true }, 
    seriesInstanceUID: { type: String, required: true }, 
    sopInstanceUID: { type: String, required: true }, 
}, { timestamps: true });

const DicomFile = mongoose.model('DicomFile', dicomFileSchema);

export default DicomFile;
