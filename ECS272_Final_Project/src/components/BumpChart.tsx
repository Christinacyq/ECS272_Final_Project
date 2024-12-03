import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const BumpChart = ({ selectedRange, selectedCountry, setCountry, setSelectedBillionaire, selectedYear, setSelectedYear, colorScale }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [data, setData] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [countries, setCountries] = useState([]);
  const [maxNetWorth, setMaxNetWorth] = useState(0);
  const [clickedBillionaire, setClickedBillionaire] = useState(null); // Add clicked state
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth * 0.5,
    height: window.innerHeight * 0.8,
  });
  

  const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9]/g, "_");

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.5,
        height: window.innerHeight * 0.8,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    d3.csv("data/concatenated_full.csv").then((allData) => {
      const globalMaxNetWorth = d3.max(allData, (d) => +d["Net Worth($US billion)"]);
      setMaxNetWorth(globalMaxNetWorth);

      const uniqueIndustries = Array.from(new Set(allData.map((d) => d.Category)));

      setIndustries(uniqueIndustries);

      const rangeData = allData.filter(
        (d) => +d.Year >= selectedRange[0] && +d.Year <= selectedRange[1]
      );

      setSelectedYear(null);
      setSelectedBillionaire(null);
      setClickedBillionaire(null);

      const groupedByYear = d3.group(rangeData, (d) => d.Year);
      const slicedData = Array.from(groupedByYear, ([year, entries]) => {
        const top20 = entries.sort((a, b) => +a.Rank - +b.Rank).slice(0, 20);
        return top20;
      }).flat();

      const uniqueCountries = Array.from(new Set(slicedData.map((d) => d.Citizenship)));
      setCountries(uniqueCountries);

      const finalData =
        selectedCountry !== ""
          ? slicedData.filter((d) => d.Citizenship === selectedCountry)
          : slicedData;

      setData(finalData);

      console.log("Selected Country:", selectedCountry); // Debugging
      console.log("Filtered Data:", finalData); // Debugging
    });
  }, [selectedRange, selectedCountry]);

  // Draw the chart
  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);

    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 50, right: 150, bottom: 50, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = d3
      .scalePoint()
      .domain([...new Set(data.map((d) => d.Year))])
      .range([0, chartWidth])
      .padding(0.5);

    const yScale = d3.scaleLinear().domain([1, 20]).range([0, chartHeight]);

    const sizeScale = d3.scaleSqrt().domain([0, maxNetWorth]).range([3, 15]);
    // const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(industries);

    const groupedData = d3.group(data, (d) => d.Name);

    // Gridlines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .call(
        d3.axisLeft(yScale).tickValues(d3.range(1, 21)).tickSize(-chartWidth).tickFormat("")
      )
      .selectAll(".tick line")
      .attr("stroke", "#d3d3d3")
      .attr("stroke-dasharray", "3,3");

    // Axes
    svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top + chartHeight})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisLeft(yScale));

    // Title
    svg.append("text")
      .attr("x", chartWidth / 2 + margin.left)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text(`Top 20 Billionaires' Rank From ${selectedRange[0]} to ${selectedRange[1]}`);

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${chartWidth + margin.left + 20}, 10)`);

    industries.forEach((industry, i) => {
      legend.append("circle")
        .attr("cx", 0)
        .attr("cy", i * 20)
        .attr("r", 6)
        .attr("fill", colorScale(industry));

      legend.append("text")
        .attr("x", 10)
        .attr("y", i * 20 + 4)
        .attr("font-size", "12px")
        .text(industry);
    });

    // Draw lines
    groupedData.forEach((values, name) => {
      svg
        .append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", colorScale(values[0].Category))
        .attr("stroke-width", 2)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(d.Year))
            .y((d) => yScale(+d.Rank))
        )
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("opacity", clickedBillionaire && clickedBillionaire !== name ? 0.2 : 1);
    });

    // Draw circles
    groupedData.forEach((values, name) => {
      const sanitized = sanitizeName(name);
      svg
        .selectAll(`.circle-${sanitized}`)
        .data(values)
        .enter()
        .append("circle")
        .attr("class", `circle-${sanitized}`)
        .attr("cx", (d) => xScale(d.Year))
        .attr("cy", (d) => yScale(+d.Rank))
        .attr("r", (d) => sizeScale(+d["Net Worth($US billion)"]))
        .attr("fill", colorScale(values[0].Category))
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .style("opacity", clickedBillionaire && clickedBillionaire !== name ? 0.2 : 0.8)
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .html(
              `<strong>${d.Name}</strong><br>Industry: ${d.Category}<br>Year: ${d.Year}<br>Rank: ${d.Rank}<br>Net Worth: $${d["Net Worth($US billion)"]}B`
            );
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        })
        .on("click", (event, d) => {
          if (clickedBillionaire === d.Name && selectedYear === d.Year) {
            // Reset clicked billionaire
            setClickedBillionaire(null);
            setSelectedYear(null);
            setSelectedBillionaire(null);
          } else {
            // Select a billionaire
            setClickedBillionaire(d.Name);
            setSelectedYear(d.Year);
            setSelectedBillionaire(d);
          }
        });
    });
  }, [data, dimensions, industries, clickedBillionaire]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <label style={{ fontWeight: "bold", marginRight: 5, marginLeft: 20 }}>Select Country:</label>
          <select value={selectedCountry} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All Countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setClickedBillionaire(null);
            setSelectedYear(null);
            setSelectedBillionaire(null);
          }}
        >
          Reset
        </button>
      </div>
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

export default BumpChart;
