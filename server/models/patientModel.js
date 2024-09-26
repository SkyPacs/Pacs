import mongoose from "mongoose";
import DicomFile from "./dicomFileModel.js";
const patientSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    medicalHistory:{
        type:String
    },
    dicomFiles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DicomFile',
      }],
    recievingDate:{
        type:Date,
        default:Date.now
    }  
}
,{timestamps:true});

const Patient = mongoose.model('Patient',patientSchema);
export default Patient