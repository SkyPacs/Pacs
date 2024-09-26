import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css'; 
import PatientTable from './components/PatientTable'; 
import AdminLogin from './Pages/AdminLogin';
import AdminRegister from './Pages/AdminRegister';
import CreatePatient from './Pages/CreatePatient';
import Navbar from './components/Navbar'; 
import AdminDashboard from './components/AdminDashboard';
const App = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 flex flex-col">
        <Navbar onSearch={handleSearch} />
        <div className="flex-1">
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/register" element={<AdminRegister />} />
            <Route path="/" element={<PatientTable searchQuery={searchQuery} />} />
            <Route path="/create-patient" element={<CreatePatient />} />
            <Route path='/admin-dashboard' element={<AdminDashboard />} />
            <Route path="*" element={<div className="text-center text-red-600">Page Not Found</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;




