import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PatientTable = ({ searchQuery }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadedPatients, setDownloadedPatients] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
    loadDownloadedPatients();
  }, [searchQuery]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/patients');
      if (!Array.isArray(response.data.data)) {
        console.error('Expected an array but received:', response.data.data);
        setError('Unexpected response format');
        return;
      }

      const filteredPatients = response.data.data.filter((patient) =>
        patient.patientName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setPatients(filteredPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Error fetching patient data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  const loadDownloadedPatients = () => {
    const savedDownloadedPatients = localStorage.getItem('downloadedPatients');
    if (savedDownloadedPatients) {
      setDownloadedPatients(new Set(JSON.parse(savedDownloadedPatients)));
    }
  };
  const saveDownloadedPatients = (updatedSet) => {
    localStorage.setItem('downloadedPatients', JSON.stringify(Array.from(updatedSet)));
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date/Time';

    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return `${formattedDate} ${formattedTime}`;
  };

  const handleDownloadReport = async (orthancPatientId, patientName) => {
    setDownloadProgress(0);
    setDownloadComplete(false);

    try {
      const response = await axios.get(`/api/patients/${orthancPatientId}/dicom/download`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDownloadProgress(percentCompleted);
          if (percentCompleted === 100) {
            setDownloadComplete(true);
          }
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.setAttribute('download', `${patientName || 'Unknown_Patient'}_dicom_files.zip`);
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      const updatedDownloadedPatients = new Set(downloadedPatients).add(orthancPatientId);
      setDownloadedPatients(updatedDownloadedPatients);
      saveDownloadedPatients(updatedDownloadedPatients);
    } catch (error) {
      console.error('Error downloading the report:', error);
      alert('Error downloading the report. Please try again later.');
      setDownloadProgress(null);
    }
  };

  const handleGenerateReport = (patient) => {
    navigate(`/report`, { state: { patient } });
  };

  const handleaudio = (patient) => {
    navigate(`/audio`, { state: { patient } });
  };

  useEffect(() => {
    if (downloadComplete) {
      const timeout = setTimeout(() => {
        setDownloadProgress(null);
        setDownloadComplete(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [downloadComplete]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-xl text-center font-semibold mb-4">Patients</h1>

      {loading && <p className="text-center">Loading patients...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="text-left">
                <th className="py-2 px-3 border-b text-sm font-medium">Name</th>
                <th className="py-2 px-3 border-b text-sm font-medium">Age</th>
                <th className="py-2 px-3 border-b text-sm font-medium">Gender</th>
                <th className="py-2 px-3 border-b text-sm font-medium">Number Of Images</th>
                <th className='py-2 px-3 border-b text-sm font-medium'>Modality</th>
                <th className="py-2 px-3 border-b text-sm font-medium">Receiving Date & Time</th>
                <th className="py-2 px-3 border-b text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.patientID} className="text-left">
                  <td
                    className={`py-2 px-3 border-b text-sm cursor-pointer hover:underline ${
                      downloadedPatients.has(patient.orthancPatientId) ? 'bg-yellow-200' : ''
                    }`}
                    onClick={() => handleDownloadReport(patient.orthancPatientId, patient.patientName)}
                  >
                    {patient.patientName || 'Unknown Patient'}
                  </td>
                  <td className="py-2 px-3 border-b text-sm">{patient.age}</td>
                  <td className="py-2 px-3 border-b text-sm">{patient.gender}</td>
                  <td className="py-2 px-3 border-b text-sm">{patient.dicomCount}</td>
                  <td className="py-2 px-3 border-b text-sm">{patient.dicomFiles[0].modality}</td>
                  <td className="py-2 px-3 border-b text-sm">{formatDateTime(patient.receivingDate)}</td>
                  <td className="py-2 px-3 border-b text-sm">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                      onClick={() => handleGenerateReport(patient)}
                    >
                      Generate Report
                    </button>
                  </td>
                  <td className="py-2 px-3 border-b text-sm">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                      onClick={() => handleaudio(patient)}
                    >
                      Notes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Progress Modal */}
      {downloadProgress !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <h2 className="text-lg font-semibold mb-4">Downloading DICOM Files</h2>
            <p className="mb-2">Download progress: {downloadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${downloadProgress}%` }} />
            </div>
            {downloadProgress === 100 ? (
              <p className="text-green-500">Download complete!</p>
            ) : (
              <p>Downloading...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTable;
