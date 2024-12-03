import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const Histogram = ({ selectedRange, selectedBillionaire, setSelectedBillionaire }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [data, setData] = useState([]);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth * 0.45,
    height: window.innerHeight * 0.4,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.45,
        height: window.innerHeight * 0.4,
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
      const filteredData = allData.filter((d) => +d.Year === +yearToFilter);

      // Group data by country and count the number of billionaires
      const countryCounts = d3.rollup(
        filteredData,
        (v) => v.length,
        (d) => d.Citizenship
      );

      // Convert to an array of objects for easier D3 manipulation
      const histogramData = Array.from(countryCounts, ([country, count]) => ({
        country,
        count,
      }));

      // Sort by count and take the top 20
      const top20Data = histogramData
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      setData(top20Data);
    });
  }, [selectedRange, selectedBillionaire]); // Dependencies

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
    svg
      .append("text")
      .attr("x", width / 2 + 20)
      .attr("y", margin.top / 2 + 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(
        `Top 20 Countries by Number of Billionaires in Year ${
          selectedBillionaire ? selectedBillionaire.Year : selectedRange[1]
        }`
      );
  }, [data, dimensions]);

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
