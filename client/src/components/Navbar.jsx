import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ onSearch, searchQuery }) => {
  const [searchInput, setSearchInput] = useState('');

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
        <input
          type="text"
          value={searchInput}
          onChange={handleChange}
          placeholder="Search patients..."
          className="p-2 rounded border border-gray-600 text-black"
        />
      </div>
    </nav>
  );
};

export default Navbar;


