import mongoose from "mongoose";

const templateSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    content:{
        type: String,
        required: true
    },
    modality:{
        type:String,
        required:true,
    },
    patient: {
        type: String,  // Change this to String
        required: true,
    }
},{timestamps: true});
const Template = mongoose.model('Template', templateSchema);
export default Template;