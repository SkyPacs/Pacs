// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// const PatientTable = ({ searchQuery }) => {
//   const [patients, setPatients] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [downloadProgress, setDownloadProgress] = useState(null);
//   const [downloadComplete, setDownloadComplete] = useState(false);
//   const [downloadedPatients, setDownloadedPatients] = useState(new Set());
//   const [dateFilter, setDateFilter] = useState('all');
//   const [modalityFilter, setModalityFilter] = useState('all');
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchPatients();
//     loadDownloadedPatients();
//   }, [searchQuery, dateFilter, modalityFilter]);

//   const fetchPatients = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await axios.get('/api/patients');
//       if (!Array.isArray(response.data.data)) {
//         console.error('Expected an array but received:', response.data.data);
//         setError('Unexpected response format');
//         return;
//       }

//       const filteredPatients = response.data.data.filter((patient) => {
//         const matchesSearchQuery = patient.patientName.toLowerCase().includes(searchQuery.toLowerCase());
//         const matchesDateFilter = filterByDate(patient.receivingDate);
//         const matchesModalityFilter = filterByModality(patient.dicomFiles[0].modality);

//         return matchesSearchQuery && matchesDateFilter && matchesModalityFilter;
//       });

//       setPatients(filteredPatients);
//     } catch (error) {
//       console.error('Error fetching patients:', error);
//       setError('Error fetching patient data. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterByDate = (dateString) => {
//     if (dateFilter === 'all') return true;
    
//     const date = new Date(dateString);
//     const today = new Date();

//     switch (dateFilter) {
//       case '2days':
//         return (today - date) / (1000 * 60 * 60 * 24) <= 2;
//       case '7days':
//         return (today - date) / (1000 * 60 * 60 * 24) <= 7;
//       case '30days':
//         return (today - date) / (1000 * 60 * 60 * 24) <= 30;
//       default:
//         return true;
//     }
//   };

//   const filterByModality = (modality) => {
//     if (modalityFilter === 'all') return true;
//     return modality === modalityFilter;
//   };

//   const loadDownloadedPatients = () => {
//     const savedDownloadedPatients = localStorage.getItem('downloadedPatients');
//     if (savedDownloadedPatients) {
//       setDownloadedPatients(new Set(JSON.parse(savedDownloadedPatients)));
//     }
//   };

//   const saveDownloadedPatients = (updatedSet) => {
//     localStorage.setItem('downloadedPatients', JSON.stringify(Array.from(updatedSet)));
//   };

//   const formatDateTime = (dateString) => {
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return 'Invalid Date/Time';

//     const formattedDate = date.toLocaleDateString();
//     const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

//     return `${formattedDate} ${formattedTime}`;
//   };

//   const handleDownloadReport = async (orthancPatientId, patientName) => {
//     setDownloadProgress(0);
//     setDownloadComplete(false);

//     try {
//       const response = await axios.get(`/api/patients/${orthancPatientId}/dicom/download`, {
//         responseType: 'blob',
//         onDownloadProgress: (progressEvent) => {
//           const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           setDownloadProgress(percentCompleted);
//           if (percentCompleted === 100) {
//             setDownloadComplete(true);
//           }
//         },
//       });

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.setAttribute('download', `${patientName || 'Unknown_Patient'}_dicom_files.zip`);
//       link.href = url;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       const updatedDownloadedPatients = new Set(downloadedPatients).add(orthancPatientId);
//       setDownloadedPatients(updatedDownloadedPatients);
//       saveDownloadedPatients(updatedDownloadedPatients);
//     } catch (error) {
//       console.error('Error downloading the report:', error);
//       alert('Error downloading the report. Please try again later.');
//       setDownloadProgress(null);
//     }
//   };

//   const handleGenerateReport = (patient) => {
//     navigate(`/report`, { state: { patient } });
//   };

//   const handleaudio = (patient) => {
//     navigate(`/audio`, { state: { patient } });
//   };

//   useEffect(() => {
//     if (downloadComplete) {
//       const timeout = setTimeout(() => {
//         setDownloadProgress(null);
//         setDownloadComplete(false);
//       }, 1000);

//       return () => clearTimeout(timeout);
//     }
//   }, [downloadComplete]);

//   return (
//     <div className="container mx-auto py-8">
//       <h1 className="text-xl text-center font-semibold mb-4">Patients</h1>
//       <div className="mb-4 flex gap-4 justify-center">
//         <select
//           className="px-4 py-2 border rounded-md"
//           value={dateFilter}
//           onChange={(e) => setDateFilter(e.target.value)}
//         >
//           <option value="all">All Dates</option>
//           <option value="2days">Last 2 Days</option>
//           <option value="7days">Last 7 Days</option>
//           <option value="30days">Last 30 Days</option>
//         </select>

//         <select
//           className="px-4 py-2 border rounded-md"
//           value={modalityFilter}
//           onChange={(e) => setModalityFilter(e.target.value)}
//         >
//           <option value="all">All Modalities</option>
//           <option value="CT">CT</option>
//           <option value="MRI">MRI</option>
//         </select>
//       </div>

//       {loading && <p className="text-center">Loading patients...</p>}
//       {error && <p className="text-red-500 text-center">{error}</p>}

//       {!loading && !error && (
//         <div className="overflow-x-auto">
//           <table className="min-w-full bg-white border border-gray-300">
//             <thead>
//               <tr className="text-left">
//                 <th className="py-2 px-3 border-b text-sm font-medium">Name</th>
//                 <th className="py-2 px-3 border-b text-sm font-medium">Age</th>
//                 <th className="py-2 px-3 border-b text-sm font-medium">Gender</th>
//                 <th className="py-2 px-3 border-b text-sm font-medium">Number Of Images</th>
//                 <th className="py-2 px-3 border-b text-sm font-medium">Modality</th>
//                 <th className="py-2 px-3 border-b text-sm font-medium">Receiving Date & Time</th>
//                 <th className="py-2 px-3 border-b text-sm font-medium">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {patients.map((patient) => (
//                 <tr key={patient.patientID} className="text-left">
//                   <td
//                     className={`py-2 px-3 border-b text-sm cursor-pointer hover:underline ${
//                       downloadedPatients.has(patient.orthancPatientId) ? 'bg-yellow-200' : ''
//                     }`}
//                     onClick={() => handleDownloadReport(patient.orthancPatientId, patient.patientName)}
//                   >
//                     {patient.patientName || 'Unknown Patient'}
//                   </td>
//                   <td className="py-2 px-3 border-b text-sm">{patient.age}</td>
//                   <td className="py-2 px-3 border-b text-sm">{patient.gender}</td>
//                   <td className="py-2 px-3 border-b text-sm">{patient.dicomCount}</td>
//                   <td className="py-2 px-3 border-b text-sm">{patient.dicomFiles[0].modality}</td>
//                   <td className="py-2 px-3 border-b text-sm">{formatDateTime(patient.receivingDate)}</td>
//                   <td className="py-2 px-3 border-b text-sm">
//                     <button
//                       className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
//                       onClick={() => handleGenerateReport(patient)}
//                     >
//                       Generate Report
//                     </button>
//                     <button
//                       className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
//                       onClick={() => handleaudio(patient)}
//                     >
//                       Notes
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PatientTable;
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
  const [dateFilter, setDateFilter] = useState('all');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [nameFilter, setNameFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [tillDate, setTillDate] = useState('');
  const [applyFilter, setApplyFilter] = useState(false);
  const [onDate, setOnDate] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    fetchPatients();
    loadDownloadedPatients();
  }, [applyFilter]);

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

      // const filteredPatients = response.data.data.filter((patient) => {
      //   const matchesSearchQuery = patient.patientName.toLowerCase().includes(searchQuery.toLowerCase());
      //   const matchesDateFilter = filterByDate(patient.receivingDate);
      //   const matchesModalityFilter = filterByModality(patient.dicomFiles[0].modality);

      //   return matchesSearchQuery && matchesDateFilter && matchesModalityFilter;
      // });
      const filteredPatients = response.data.data.filter((patient) => {
                const matchesSearchQuery = patient.patientName.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesNameFilter = patient.patientName.toLowerCase().includes(nameFilter.toLowerCase());
                const matchesDateFilter = filterByDate(patient.receivingDate);
                const matchesModalityFilter = filterByModality(patient.dicomFiles[0].modality);
                const matchesCustomDateFilter = filterByCustomDate(patient.receivingDate);
                const matchesOnDateFilter = filterByOnDate(patient.receivingDate); // New filter by On Date

        
                return matchesSearchQuery && matchesNameFilter && matchesDateFilter && matchesModalityFilter && matchesCustomDateFilter && matchesOnDateFilter;
              });

      setPatients(filteredPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Error fetching patient data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (dateString) => {
    if (dateFilter === 'all') return true;
    
    const date = new Date(dateString);
    const today = new Date();

    switch (dateFilter) {
      case '2days':
        return (today - date) / (1000 * 60 * 60 * 24) <= 2;
      case '7days':
        return (today - date) / (1000 * 60 * 60 * 24) <= 7;
      case '30days':
        return (today - date) / (1000 * 60 * 60 * 24) <= 30;
      default:
        return true;
    }
  };

  const filterByModality = (modality) => {
    if (modalityFilter === 'all') return true;
    return modality === modalityFilter;
  };

  const filterByCustomDate = (dateString) => {
        if (!fromDate && !tillDate) return true;
    
        const date = new Date(dateString);
        const from = fromDate ? new Date(fromDate) : null;
        const till = tillDate ? new Date(tillDate) : null;
    
        return (!from || date >= from) && (!till || date <= till);
      };

  const loadDownloadedPatients = () => {
    const savedDownloadedPatients = localStorage.getItem('downloadedPatients');
    if (savedDownloadedPatients) {
      setDownloadedPatients(new Set(JSON.parse(savedDownloadedPatients)));
    }
  };
  const filterByOnDate = (dateString) => {
    if (!onDate) return true;
    
    const date = new Date(dateString).toDateString();
    const selectedDate = new Date(onDate).toDateString();
    
    return date === selectedDate;
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
      <div className="mb-4 flex gap-4 justify-center">
        <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameFilter">Patient Name</label>
      <input
          type="text"
          className="px-4 py-2 border rounded-md"
          placeholder="Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
        </div>
        <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameFilter">On Date</label>
        <input
          type="date"
          className="px-4 py-2 border rounded-md"
          placeholder="On Date"
          value={onDate}
          onChange={(e) => setOnDate(e.target.value)}
        />
        </div>
        <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameFilter">From Date</label>
        <input
          type="date"
          className="px-4 py-2 border rounded-md"
          placeholder='From Date'
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        </div>
        <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameFilter">Till Date</label>
        <input
          type="date"
          className="px-4 py-2 border rounded-md"
          placeholder='Till Date'
          value={tillDate}
          onChange={(e) => setTillDate(e.target.value)}
        />
        </div>
        <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameFilter">Filter dates</label>
        <select
          className="px-4 py-2 border rounded-md"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">All Dates</option>
          <option value="2days">Last 2 Days</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
        </div>
        <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameFilter">Modality</label>
        <select
          className="px-4 py-2 border rounded-md"
          value={modalityFilter}
          onChange={(e) => setModalityFilter(e.target.value)}
        >
          <option value="all">All Modalities</option>
          <option value="CT">CT</option>
          <option value="MRI">MRI</option>
        </select>
        </div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
          onClick={() => setApplyFilter((prev) => !prev)}
        >
          Apply
        </button>
        
      </div>

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
                <th className="py-2 px-3 border-b text-sm font-medium">Modality</th>
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
    </div>
  );
};

export default PatientTable;
