import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import { fromArrayBuffer } from 'geotiff';

const GeoTIFFViewer = ({ filename }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (filename) {
      fetchAndRenderTIFF(filename);
    }
  }, [filename]);

  const fetchAndRenderTIFF = async (filename) => {
    try {
      const response = await axios.get(`http://localhost:8000/tiff/${filename}`, {
        responseType: 'arraybuffer',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      const tiff = await fromArrayBuffer(response.data);
      const image = await tiff.getImage();
      const width = image.getWidth();
      const height = image.getHeight();

      const rasters = await image.readRasters();
      let values = rasters[0];

      const contours = generateContours(values, width, height);
      renderContours(contours, width, height);
    } catch (error) {
      console.error("Error loading TIFF:", error);
    }
  };

  const generateContours = (data, width, height) => {
    const validValues = data.filter(d => d !== null);
    const contours = d3.contours()
      .size([width, height])
      .smooth(true)
      .thresholds(d3.range(d3.min(validValues), d3.max(validValues), (d3.max(validValues) - d3.min(validValues)) / 10))(validValues);

    return contours;
  };

  const renderContours = (contours, width, height) => {
    d3.select(svgRef.current).selectAll("*").remove();

    const colorScale = d3.scaleSequential()
      .domain(d3.extent(contours.map(c => c.value)))
      .interpolator(d3.interpolateMagma)
      .unknown("#fff");

    d3.select(svgRef.current)
      .selectAll("path")
      .data(contours)
      .enter().append("path")
      .attr("d", d3.geoPath())
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5);

    const usedColors = contours.map(c => colorScale(c.value));
    const uniqueColors = [...new Set(usedColors)];
    const legendWidth = 300;
    const legendHeight = 20;

    const defs = d3.select(svgRef.current).append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");

    linearGradient.selectAll("stop")
      .data(uniqueColors)
      .enter().append("stop")
      .attr("offset", (d, i) => i / (uniqueColors.length - 1))
      .attr("stop-color", d => d);

    const legend = d3.select(svgRef.current).append("g")
      .attr("class", "legend")
      .attr("transform", `translate(50, ${height + 100})`);

    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    const legendScale = d3.scaleLinear()
      .domain(d3.extent(contours.map(c => c.value)))
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5);

    legend.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);

    legend.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .text("Color Legend");

    const contoursGroup = d3.select(svgRef.current).append("g");

    contoursGroup.selectAll("path")
      .data(contours)
      .enter().append("path")
      .attr("d", d3.geoPath())
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "3,3")
      .attr("stroke-opacity", 0.7);
  };

  return (
    <div>
      <h2>GeoTIFF Viewer with d3</h2>
      <svg ref={svgRef} width="500" height="500">
        <g></g>
      </svg>
    </div>
  );
};

const App = () => {
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadFiles();
  }, [page]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/files?skip=${page}&limit=1`);
      setFiles(prevFiles => [...prevFiles, ...response.data]);
    } catch (error) {
      console.error("Error loading files:", error);
    }
    setLoading(false);
  };

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
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

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {files.map((file, index) => (
        <div key={index}>
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
      {loading && <p>Loading...</p>}
      {!loading && <button onClick={loadMore}>Load More</button>}
      {selectedFiles.map((file, index) => (
        <GeoTIFFViewer key={index} filename={file} />
      ))}
    </div>
  );
};

export default App;
