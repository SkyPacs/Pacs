import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SignOutButton, useAuth } from '@clerk/clerk-react'; 

const Navbar = ({ onSearch, searchQuery }) => {
  const [searchInput, setSearchInput] = useState('');
  const { isSignedIn } = useAuth(); 

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handleChange = (event) => {
    const query = event.target.value;
    setSearchInput(query);
    onSearch(query);
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">
          <Link to="/">SKYPACS</Link>
        </h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={searchInput}
            onChange={handleChange}
            placeholder="Search patients..."
            className="p-2 rounded border border-gray-600 text-black"
          />
          {isSignedIn && ( 
            <SignOutButton>
              <button
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md shadow-md hover:bg-red-600 transition-all duration-300"
              >
                Sign Out
              </button>
            </SignOutButton>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;