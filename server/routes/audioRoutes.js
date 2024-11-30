// routes/audioRoutes.js
import express from 'express';
import { getAudioNotes, saveAudioNote, streamAudio } from '../controllers/audioController.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.get('/:patientID/audio', getAudioNotes);
router.post('/:patientID/audio', upload.single('audioFile'), saveAudioNote);
router.get('/audio/:noteId/stream', streamAudio);

export default router;
