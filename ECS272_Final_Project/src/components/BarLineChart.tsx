import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const BarLineChart = () => {
  const svgRef = useRef(); // Use ref for the SVG element
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth * 0.95,
    height: window.innerHeight * 0.95,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.95,
        height: window.innerHeight * 0.95,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const drawChart = (data) => {
      const svg = d3.select(svgRef.current); // Select the SVG using the ref

      // Clear any existing content
      svg.selectAll("*").remove();

      const { width, height } = dimensions;
      const margin = { top: 100, right: 90, bottom: 80, left: 80 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      // Set up the main group
      const chart = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Scales
      const xScale = d3
        .scaleBand()
        .domain(data.map((d) => d.Year))
        .range([0, chartWidth])
        .padding(0.1);

      const yLeftScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => +d["Billionaire Count"])])
        .range([chartHeight, 0]);

      const yRightScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => +d["World GDP (current US$)"] / 1e12)]) // Scale to trillions
        .range([chartHeight, 0]);

      // Axes
      const xAxis = d3.axisBottom(xScale);
      const yLeftAxis = d3.axisLeft(yLeftScale);
      const yRightAxis = d3.axisRight(yRightScale).tickFormat((d) => `${d}T`);

      // Append axes
      chart
        .append("g")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "center");

      chart.append("g").call(yLeftAxis); // Left axis for billionaire count

      chart
        .append("g")
        .attr("transform", `translate(${chartWidth}, 0)`)
        .call(yRightAxis); // Right axis for GDP

      // Bars for Billionaire Count
      chart
        .selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => xScale(d.Year))
        .attr("y", (d) => yLeftScale(+d["Billionaire Count"]))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => chartHeight - yLeftScale(+d["Billionaire Count"]))
        .attr("fill", "#8884d8");

      // Line for World GDP
      const line = d3
        .line()
        .x((d) => xScale(d.Year) + xScale.bandwidth() / 2) // Align line with bar centers
        .y((d) => yRightScale(+d["World GDP (current US$)"] / 1e12)); // Scale to trillions

      chart
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#82ca9d")
        .attr("stroke-width", 2)
        .attr("d", line);

      // Add points for the line
      chart
      .selectAll(".point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", (d) => xScale(d.Year) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yRightScale(+d["World GDP (current US$)"] / 1e12))
      .attr("r", 4) // Radius of the circle
      .attr("fill", "#4e9b72") // Dark green fill color
      .attr("stroke", "white") // White border
      .attr("stroke-width", 1.5); // Thickness of the border


      // Add chart title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text("Billionaire Growth and World GDP");

      // Add x-axis label
      chart
        .append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Year");

      // Add y-axis label for billionaire count
      chart
        .append("text")
        .attr("x", -chartHeight / 2)
        .attr("y", -margin.left + 15)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Billionaire Count");

      // Add y-axis label for GDP
      chart
        .append("text")
        .attr("x", -chartHeight / 2)
        .attr("y", chartWidth + margin.right - 10)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("World GDP (Trillions)");

        // Add light grey context box
      svg
        .append("rect")
        .attr("x", margin.left + 20)
        .attr("y", margin.top + 20)
        .attr("width", chartWidth * 0.5)
        .attr("height", 180)
        .attr("fill", "white")
        .attr("opacity", 0.5)
        .attr("rx", 10) // Rounds the corners (horizontal radius)
        .attr("ry", 10); // Rounds the corners (vertical radius)

    // Add text inside the context box
      svg
        .append("text")
        .attr("x", margin.left + 30)
        .attr("y", margin.top + 50)
        .style("font-size", "14px")
        .text("This graph shows the growth in the billionaire count");

    };

    d3.csv("/data/Billionaire_Growth_GDP.csv").then((data) => {
      drawChart(data);
    });
  }, [dimensions]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default BarLineChart;
