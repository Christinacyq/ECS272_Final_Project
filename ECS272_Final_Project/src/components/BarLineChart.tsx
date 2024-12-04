import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const BarLineChart = ({ selectedRange = [1997, 2023], title = "Billionaire Growth and World GDP" }) => {
  const svgRef = useRef();
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
      const svg = d3.select(svgRef.current);

      // Clear any existing content
      svg.selectAll("*").remove();

      const { width, height } = dimensions;
      const margin = { top: 100, right: 90, bottom: 80, left: 80 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      // Filter data based on the selected range
      const filteredData = data.filter(
        (d) => +d.Year >= selectedRange[0] && +d.Year <= selectedRange[1]
      );

      // Scales
      const xScale = d3
        .scaleBand()
        .domain(filteredData.map((d) => d.Year))
        .range([0, chartWidth])
        .padding(0.1);

      const yLeftScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredData, (d) => +d["Billionaire Count"])])
        .range([chartHeight, 0]);

      const yRightScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredData, (d) => +d["World GDP (current US$)"] / 1e12)]) // Scale to trillions
        .range([chartHeight, 0]);

      // Set up the main group
      const chart = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

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

      chart.append("g").call(yLeftAxis);

      chart
        .append("g")
        .attr("transform", `translate(${chartWidth}, 0)`)
        .call(yRightAxis);

      // Bars for Billionaire Count
      const bars = chart.selectAll(".bar").data(filteredData, (d) => d.Year);

      bars
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => xScale(d.Year))
        .attr("y", chartHeight)
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .attr("fill", "#8884d8")
        .merge(bars)
        .transition()
        .duration(750)
        .attr("y", (d) => yLeftScale(+d["Billionaire Count"]))
        .attr("height", (d) => chartHeight - yLeftScale(+d["Billionaire Count"]));

      bars.exit().remove();

      // Line for World GDP
      const line = d3
        .line()
        .x((d) => xScale(d.Year) + xScale.bandwidth() / 2)
        .y((d) => yRightScale(+d["World GDP (current US$)"] / 1e12));

      const linePath = chart.selectAll(".line-path").data([filteredData]);

      linePath
        .enter()
        .append("path")
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke", "#82ca9d")
        .attr("stroke-width", 2)
        .attr("d", line(filteredData))
        .merge(linePath)
        .transition()
        .duration(750)
        .attr("d", line);

      linePath.exit().remove();

      // Points for the line
      const points = chart.selectAll(".point").data(filteredData);

      points
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", (d) => xScale(d.Year) + xScale.bandwidth() / 2)
        .attr("cy", chartHeight) 
        .attr("r", 0)
        .attr("fill", "#4e9b72")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .merge(points)
        .transition()
        .duration(750)
        .attr("cy", (d) => yRightScale(+d["World GDP (current US$)"] / 1e12))
        .attr("r", 4);

      points.exit().remove();

      // Add chart title
      svg
        .selectAll(".chart-title")
        .data([title])
        .join("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text((d) => d);
    };

    d3.csv("/data/Billionaire_Growth_GDP.csv").then((data) => {
      drawChart(data);
    });
  }, [dimensions, selectedRange, title]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default BarLineChart;
