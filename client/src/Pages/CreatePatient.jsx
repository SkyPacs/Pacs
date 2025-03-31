import React, { useState } from 'react';
import axios from 'axios';

const CreatePatient = () => {
  const [dicomFile, setDicomFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setDicomFile(file);
    if (file) {
      console.log('File name:', file.name);
      console.log('File size:', file.size);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dicomFile) return;

    const totalChunks = Math.ceil(dicomFile.size / CHUNK_SIZE);
    let uploadedSize = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, dicomFile.size);
      const chunk = dicomFile.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('fileName', dicomFile.name);
      formData.append('chunkIndex', String(chunkIndex));
      formData.append('totalChunks', String(totalChunks));

      try {
        await axios.post('/api/upload-dicom', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        uploadedSize += chunk.size;
        setUploadProgress(Math.round((uploadedSize / dicomFile.size) * 100));
      } catch (err) {
        console.error('Error uploading chunk:', err);
        setError('Failed to upload the file. Please try again.');
        return;
      }
    }

    console.log('File uploaded successfully');
    setUploadProgress(100);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Upload DICOM File</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {uploadProgress > 0 && (
          <p className="text-gray-700 mb-4">
            Upload Progress: {uploadProgress}%
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="dicomFile" className="block text-sm font-medium text-gray-700">
              Upload DICOM File
            </label>
            <input
              type="file"
              id="dicomFile"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePatient;




