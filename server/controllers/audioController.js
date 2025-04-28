import Audio from '../models/audioModel.js';

// Get audio notes for a specific patient
export const getAudioNotes = async (req, res) => {
  const { patientID } = req.params;   // Extract patientID from URL parameters

  try {
    const notes = await Audio.find({ patientID });    // Query database for all audio notes matching patientID
    return res.status(200).json({ notes });   // Return notes array with 200 status
  } catch (error) {
    console.error("Error fetching audio notes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Save new audio note for a patient
export const saveAudioNote = async (req, res) => {
  const { patientID } = req.params;
  const audioFile = req.file; 

  if (!audioFile) {     // Validate file existence
    return res.status(400).json({ message: "No audio file uploaded" });
  }

  // Create new audio document
  const newNote = new Audio({
    patientID,
    data: audioFile.buffer,
    contentType: audioFile.mimetype, 
  });

  try {
    await newNote.save();   // Save document to MongoDB
    return res.status(201).json({ message: "Audio note saved successfully", note: newNote }); // Return created document
  } catch (error) {
    console.error("Error saving audio note:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Stream audio file to client
export const streamAudio = async (req, res) => {
  const { noteId } = req.params;    // Get audio note ID from URL

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