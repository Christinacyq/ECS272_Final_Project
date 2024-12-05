import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const Histogram = ({ selectedRange, 
  selectedBillionaire, 
  setSelectedBillionaire,
  useRange = false,
  widthScale = 0.45, 
  heightScale = 0.4,
  titleFontSize = "16px",
  showLabel = false,
  dottedLine = false,
 }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [data, setData] = useState([]);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth * widthScale,
    height: window.innerHeight * heightScale,
  });
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * widthScale,
        height: window.innerHeight * heightScale,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Determine the year to filter
    const yearToFilter = selectedBillionaire
      ? selectedBillionaire.Year
      : selectedRange[1];

    d3.csv("data/concatenated_full.csv").then((allData) => {
      // Filter data by the determined year
      const filteredData = useRange
        ? allData.filter((d) => +d.Year >= selectedRange[0] && +d.Year <= selectedRange[1])
        : allData.filter((d) => +d.Year === +yearToFilter);

      // Group data by country and count the number of billionaires
      const dataAggregation = d3.rollup(
        filteredData,
        (v) => new Set(v.map((d) => d.Name)).size, // Unique billionaire count
        (d) => d.Citizenship
      );

      // Convert to an array of objects for easier D3 manipulation
      const histogramData = Array.from(dataAggregation, ([country, count]) => ({
        country,
        count,
      }));

      // Sort by count and take the top 20
      const top20Data = histogramData
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      setData(top20Data);
    });
  }, [selectedRange, selectedBillionaire, useRange, widthScale, heightScale]); // Dependencies

  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const tooltip = d3.select(tooltipRef.current);

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.country))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)])
      .range([chartHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickFormat((d) =>
      d.length > 10 ? `${d.slice(0, 10)}...` : d
    );
    const yAxis = d3.axisLeft(yScale).ticks(5);

    const average = d3.mean(data, (d) => d.count);

    // Draw bars
    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.country))
      .attr("y", (d) => yScale(d.count))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => chartHeight - yScale(d.count))
      .attr("fill", "steelblue")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("fill", "darkblue");
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.country}</strong><br>Number of Billionaires: ${d.count}`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).attr("fill", "steelblue");
        tooltip.style("opacity", 0);
      });

    if (showLabel) {
      svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("x", (d) => xScale(d.country) + xScale.bandwidth() / 2)
        .attr("y", (d) => yScale(d.count) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text((d) => d.count);
    }

    if (dottedLine) {
      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("y1", margin.top + yScale(average))
        .attr("x2", margin.left + chartWidth)
        .attr("y2", margin.top + yScale(average))
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "4 2")
        .attr("stroke-width", 1.5);

      // Label for the average line
      svg
        .append("text")
        .attr("x", margin.left + chartWidth - 10)
        .attr("y", margin.top + yScale(average) - 10)
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("fill", "gray")
        .text(`Average: ${average.toFixed(2)}`);
    }

    // Draw axes
    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top + chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .call(yAxis);

    // Title
    const title_year = useRange ?
      `${selectedRange[0]} - ${selectedRange[1]}`: selectedBillionaire 
      ? selectedBillionaire.Year : selectedRange[1];

    svg
      .append("text")
      .attr("x", width / 2 + 20)
      .attr("y", margin.top / 2 + 20)
      .attr("text-anchor", "middle")
      .attr("font-size", titleFontSize)
      .attr("font-weight", "bold")
      .text(
        `Top 20 Countries by Number of Billionaires in Year ${title_year}`
      );
  }, [data, dimensions, showLabel]);

  return (
    <div>
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          backgroundColor: "white",
          border: "1px solid #ddd",
          padding: "8px",
          borderRadius: "4px",
          pointerEvents: "none",
          opacity: 0,
        }}
      ></div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

export default Histogram;
