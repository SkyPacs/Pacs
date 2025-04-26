import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, SignIn, useAuth } from '@clerk/clerk-react';
import './index.css'; 
import PatientTable from './components/PatientTable'; 
import Navbar from './components/Navbar'; 
import ReportPage from './components/ReportPage';
import AudioRecorderComponent from './components/AudioRecorderComponent';

const App = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/patient-table');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex items-center justify-center h-full mt-20">
                <SignIn />
              </div>
            }
          />
          <Route
            path="/patient-table"
            element={
              <SignedIn>
                <PatientTable />
              </SignedIn>
            }
          />
          <Route
            path="/report"
            element={
              <SignedIn>
                <ReportPage />
              </SignedIn>
            }
          />
          <Route
            path="/audio"
            element={
              <SignedIn>
                <AudioRecorderComponent />
              </SignedIn>
            }
          />
          <Route
            path="*"
            element={
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;