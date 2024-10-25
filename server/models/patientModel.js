import mongoose from "mongoose";
import DicomFile from "./dicomFileModel.js";

const patientSchema = new mongoose.Schema({
    PatientID: {
        type: String, 
        required: true,
        unique: true 
    },
    orthancPatientId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    PatientAge: {
        type: String,
    },
    gender: {
        type: String,
        required: true
    },
    medicalHistory: {
        type: String
    },
    StudyDate: {
        type: Date,
        required: true
    },
    StudyTime: {
        type: String 
    },
    Modality: {
        type: String 
    },
    dicomFiles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DicomFile',
    }],
    receivingDate: {
        type: Date,
        default: Date.now
    },
    studyInstanceUID: { 
        type: String,
        required: true
    },
    seriesInstanceUID: { 
        type: String,
        required: true
    },
    sopInstanceUID: { 
        type: String,
        required: true
    }
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
