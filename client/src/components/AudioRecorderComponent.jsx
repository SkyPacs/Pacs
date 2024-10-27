import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import axios from 'axios';
import { ReactMic } from 'react-18-mic';

const AudioRecorderComponent = () => {
  const location = useLocation();
  const patient = location.state?.patient;
  const [isRunning, setIsRunning] = useState(false);
  const [voice, setVoice] = useState(false);
  const [textNote, setTextNote] = useState('');
  const [recordBlobLink, setRecordBlobLink] = useState(null);
  const [notes, setNotes] = useState([]);
  const formatDateTime = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    if (patient) {
      axios.get(`/api/${patient.patientID}/audio`)
        .then(response => {
          setNotes(response.data.notes);
        })
        .catch(error => {
          console.error("Error fetching notes:", error);
        });
    } else {
      console.error("Patient data is undefined");
    }
  }, [patient]);

  const handleStart = () => {
    setIsRunning(true);
    setVoice(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setVoice(false);
  };

  const handleClear = () => {
    setRecordBlobLink(null);
  };

  const saveAudioNote = (blobURL) => {
    const newNote = { type: 'audio', content: blobURL };
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const handleOnStop = (recordedBlob) => {
    setRecordBlobLink(recordedBlob.blobURL);
    saveAudioNote(recordedBlob.blobURL);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textNote.trim() !== "") {
      const newNote = { type: 'text', content: textNote };
      setNotes((prevNotes) => [...prevNotes, newNote]);
      setTextNote("");
    }
  };

  const handleSubmit = async () => {
    if (recordBlobLink) {
      try {
        const response = await fetch(recordBlobLink);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('audioFile', blob, 'audioNote.wav');

        const saveResponse = await axios.post(`/api/${patient.patientID}/audio`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log("Response from server:", saveResponse.data);
        // Optionally fetch and update notes after saving
        const updatedNotesResponse = await axios.get(`/api/${patient.patientID}/audio`);
        setNotes(updatedNotesResponse.data.notes);

      } catch (error) {
        console.error("Error saving audio note:", error);
      }
    }
  };

  return (
    <div className="chatbox-container max-w-lg mx-auto py-8 px-4 bg-white shadow-lg rounded-lg">
      {/* Patient details */}
      <table>
        <tbody>
          <tr>
            <th>Patient Name:</th>
            <td>{patient?.patientName}</td>
          </tr>
          <tr>
            <th>Age:</th>
            <td>{patient?.age}</td>
          </tr>
          <tr>
            <th>Sex:</th>
            <td>{patient?.gender}</td>
          </tr>
          <tr>
            <th>Study:</th>
            <td>{patient?.dicomFiles[0]?.modality}</td>
          </tr>
          <tr> 
            <th>Reff. Dr.:</th>
            <td>{patient?.doctor}</td>
          </tr>
          <tr>
            <th>Patient ID:</th>
            <td>{patient?.patientID}</td>
          </tr>
          <tr>
            <th>Study Date:</th>
            <td>{formatDateTime(patient?.receivingDate)}</td>
          </tr>
        </tbody>
      </table>
      
      {/* Notes Section */}
      <div className="chat-notes bg-gray-100 p-4 h-60 overflow-y-auto rounded-lg">
        {notes.length === 0 ? (
          <p className="text-gray-500">No Notes yet</p>
        ) : (
          notes.map((note, index) => (
            <div
              key={index}
              className={`mb-3 p-2 rounded-md ${note.type === 'text' ? 'bg-blue-200' : 'bg-green-200'} text-black`}
            >
              {note.type === 'text' ? (
                <p>{note.content}</p>
              ) : (
                <audio controls src={`/api/audio/${note._id}/stream`} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Text Note Input */}
      <form onSubmit={handleTextSubmit} className="mt-4 flex items-center">
        <input
          type="text"
          value={textNote}
          onChange={(e) => setTextNote(e.target.value)}
          className="flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your note..."
        />
        <button
          type="submit"
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md font-semibold"
        >
          Save
        </button>
      </form>

      {/* Audio Recorder */}
      <div className="audio-recorder mt-4">
        <ReactMic
          record={voice}
          className="hidden" 
          onStop={handleOnStop}
          strokeColor="#000000"
        />

        <div className="flex justify-between mt-2">
          {!voice ? (
            <button
              onClick={handleStart}
              className="px-4 py-2 bg-green-500 text-white rounded-md font-semibold"
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-500 text-white rounded-md font-semibold"
            >
              Stop Recording
            </button>
          )}

          {recordBlobLink && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-500 text-white rounded-md font-semibold"
            >
              Clear Recording
            </button>
          )}
        </div>

        {recordBlobLink && (
          <div className="mt-4">
            <audio controls src={recordBlobLink} className="w-full" />
          </div>
        )}

        {/* Submit Button for Audio Notes */}
        {recordBlobLink && (
          <button
            onClick={handleSubmit}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md font-semibold"
          >
            Save Audio Note
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioRecorderComponent;
