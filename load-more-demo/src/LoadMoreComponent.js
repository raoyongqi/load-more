import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [allFiles, setAllFiles] = useState([]);
  const [visibleFiles, setVisibleFiles] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllFiles();
  }, []);

  useEffect(() => {
    loadMoreFiles();
  }, [page]);

  const loadAllFiles = async () => {
    try {
      const response = await axios.get('http://localhost:8000/all_files/');
      setAllFiles(response.data);
    } catch (error) {
      console.error("Error loading all files:", error);
    }
  };

  const loadMoreFiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/files?skip=${page}&limit=1`);
      setVisibleFiles(prevFiles => [...prevFiles, ...response.data]);
    } catch (error) {
      console.error("Error loading files:", error);
    }
    setLoading(false);
  };

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
    <div className="App" style={{ display: 'flex' }}>
      <div style={{ width: '50%' }}>
        <h1>All Files</h1>
        <ul>
          {allFiles.map((file, index) => (
            <li key={index}>{file}</li>
          ))}
        </ul>
      </div>
      <div style={{ width: '50%' }}>
        <h1>Visible Files</h1>
        <ul>
          {visibleFiles.map((file, index) => (
            <li key={index}>{file}</li>
          ))}
        </ul>
        {loading && <p>Loading...</p>}
        {!loading && <button onClick={loadMore}>Load More</button>}
      </div>
    </div>
  );
}

export default App;
