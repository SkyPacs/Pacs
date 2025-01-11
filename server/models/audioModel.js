import mongoose from 'mongoose';

const audioSchema = new mongoose.Schema({
  patientID: {
    type: String,
    required: true,
  },
  data: {
    type: Buffer,  
    required: true,
  },
  contentType: {
    type: String,  
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Audio = mongoose.model('Audio', audioSchema);
export default Audio;
