import mongoose from "mongoose";

const dicomFileSchema = new mongoose.Schema({
    fileName:{
        type:String,
    },
    filePath:{
        type:String,
    },
},{timestamps:true});

const DicomFile = mongoose.model('DicomFile',dicomFileSchema);
export default DicomFile