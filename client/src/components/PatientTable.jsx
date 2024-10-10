import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PatientTable = ({ searchQuery }) => {
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, [searchQuery]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/getpatients');
      const filteredPatients = response.data.filter((patient) =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setPatients(filteredPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString();
  };

  const handleGenerateReport = (patient) => {
    navigate(`/report`, { state: { patient } });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-xl text-center font-semibold mb-4">Patients</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="text-left">
              <th className="py-2 px-3 border-b text-sm font-medium">Name</th>
              <th className="py-2 px-3 border-b text-sm font-medium">Age</th>
              <th className="py-2 px-3 border-b text-sm font-medium">Gender</th>
              <th className="py-2 px-3 border-b text-sm font-medium">Medical History</th>
              <th className="py-2 px-3 border-b text-sm font-medium">Receiving Date</th>
              <th className="py-2 px-3 border-b text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient._id} className="text-left">
                <td
                  className="py-2 px-3 border-b text-blue-500 text-sm cursor-pointer hover:underline"
                  onClick={() => handleGenerateReport(patient)}
                >
                  {patient.name}
                </td>
                <td className="py-2 px-3 border-b text-sm">{patient.age}</td>
                <td className="py-2 px-3 border-b text-sm">{patient.gender}</td>
                <td className="py-2 px-3 border-b text-sm">{patient.medicalHistory || 'N/A'}</td>
                <td className="py-2 px-3 border-b text-sm">{formatDate(patient.recievingDate)}</td>
                <td className="py-2 px-3 border-b text-sm">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                    onClick={() => handleGenerateReport(patient)}
                  >
                    Generate Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientTable;