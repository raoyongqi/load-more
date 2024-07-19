import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import GeoTIFFViewer from './GeoTIFFViewer';  // Ensure correct import path
import './App.css';  // Import the CSS file

const App = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileSelectionRef = useRef(null);

  useEffect(() => {
    loadFiles();
    updateFileSelectionHeight();
    window.addEventListener('resize', updateFileSelectionHeight);
    return () => window.removeEventListener('resize', updateFileSelectionHeight);
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/files`);
      setFiles(response.data);
    } catch (error) {
      console.error("Error loading files:", error);
    }
    setLoading(false);
  };

  const handleFileSelection = (file) => {
    setSelectedFiles((prevSelectedFiles) => {
      if (prevSelectedFiles.includes(file)) {
        return prevSelectedFiles.filter((selectedFile) => selectedFile !== file);
      } else {
        return [...prevSelectedFiles, file];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files);
    }
  };

  const updateFileSelectionHeight = () => {
    if (fileSelectionRef.current) {
      const headerHeight = 40; // Adjust if needed
      fileSelectionRef.current.style.height = `${window.innerHeight - headerHeight}px`;
    }
  };

  return (
    <div className="app-container">
      <div className="file-selection" ref={fileSelectionRef}>
        <button onClick={handleSelectAll}>
          {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
        </button>
        {loading && <p>Loading...</p>}
        {!loading && (
          <div className="scroll-container">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file)}
                    onChange={() => handleFileSelection(file)}
                  />
                  {file}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="viewer-container">
        {selectedFiles.map((file, index) => (
          <GeoTIFFViewer key={index} filename={file} />
        ))}
      </div>
    </div>
  );
};

export default App;
