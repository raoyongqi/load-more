import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import { fromArrayBuffer } from 'geotiff';
import './GeoTIFFViewer.css';  // Import CSS for styling

const GeoTIFFViewer = ({ filename }) => {
  const svgRef = useRef(null);
  const legendRef = useRef(null); // Reference for the legend SVG

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

    const svg = d3.select(svgRef.current);
    const svgWidth = svg.attr('width');
    const svgHeight = svg.attr('height');

    const colorScale = d3.scaleSequential()
      .domain(d3.extent(contours.map(c => c.value)))
      .interpolator(d3.interpolateMagma)
      .unknown("#fff");

    svg.selectAll("path")
      .data(contours)
      .enter().append("path")
      .attr("d", d3.geoPath().projection(d3.geoIdentity().scale(Math.min(svgWidth / width, svgHeight / height))))
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5);

    // Create or update the legend only once
    if (!legendRef.current) {
      const legendWidth = 300;
      const legendHeight = 20;

      const legend = d3.select(svgRef.current.parentNode).append("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight + 30) // Add some space below for the axis
        .attr("class", "legend")
        .style("margin-top", "10px");

      legendRef.current = legend.node(); // Set the legend reference

      const defs = legend.append("defs");
      const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%");

      const uniqueColors = [...new Set(contours.map(c => colorScale(c.value)))];
      linearGradient.selectAll("stop")
        .data(uniqueColors)
        .enter().append("stop")
        .attr("offset", (d, i) => i / (uniqueColors.length - 1))
        .attr("stop-color", d => d);

      legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

      const legendScale = d3.scaleLinear()
        .domain(d3.extent(contours.map(c => c.value)))
        .range([0, legendWidth]);

      const legendAxis = d3.axisBottom(legendScale)
        .ticks(4);

      legend.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);

      legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -6)
        .attr("fill", "#000")
        .attr("text-anchor", "middle")
        .text("Color Legend");
    }
  };

  // Remove '.tif' extension from filename
  const fileTitle = filename.replace('.tif', '');

  return (
    <div className="geo-tiff-viewer">
      <h2>{fileTitle}</h2>
      <svg ref={svgRef} width="600" height="400">
        <g></g>
      </svg>
    </div>
  );
};

export default GeoTIFFViewer;
