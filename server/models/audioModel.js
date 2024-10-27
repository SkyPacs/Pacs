// models/audioModel.js
import mongoose from 'mongoose';

const audioSchema = new mongoose.Schema({
  patientID: {
    type: String,
    required: true,
  },
  data: {
    type: Buffer,  // Store binary data of the audio
    required: true,
  },
  contentType: {
    type: String,  // Store the MIME type of the audio file
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Audio = mongoose.model('Audio', audioSchema);
export default Audio;
