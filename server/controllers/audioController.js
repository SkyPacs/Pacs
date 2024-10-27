import Audio from '../models/audioModel.js';

export const getAudioNotes = async (req, res) => {
  const { patientID } = req.params;

  try {
    const notes = await Audio.find({ patientID });
    return res.status(200).json({ notes });
  } catch (error) {
    console.error("Error fetching audio notes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const saveAudioNote = async (req, res) => {
  const { patientID } = req.params;
  const audioFile = req.file; 

  if (!audioFile) {
    return res.status(400).json({ message: "No audio file uploaded" });
  }

  const newNote = new Audio({
    patientID,
    data: audioFile.buffer,
    contentType: audioFile.mimetype, 
  });

  try {
    await newNote.save();
    return res.status(201).json({ message: "Audio note saved successfully", note: newNote });
  } catch (error) {
    console.error("Error saving audio note:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const streamAudio = async (req, res) => {
  const { noteId } = req.params;

  try {
    const note = await Audio.findById(noteId);
    if (!note) return res.status(404).json({ message: "Audio note not found" });

    res.set("Content-Type", note.contentType);
    res.send(note.data); 
  } catch (error) {
    console.error("Error streaming audio note:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
