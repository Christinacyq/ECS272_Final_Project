import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const BumpChart = ({
  selectedRange,
  selectedCountry,
  setCountry,
  setSelectedBillionaire,
  selectedYear,
  setSelectedYear,
  colorScale,
  maxRank = 20,
  widthScale = 0.5,
  heightScale = 0.8,
  hideCountrySelector = false,
  enableInteraction = true,
  descriptionText = null,
}) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [data, setData] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [countries, setCountries] = useState([]);
  const [maxNetWorth, setMaxNetWorth] = useState(0);
  const [clickedBillionaire, setClickedBillionaire] = useState(null); // Add clicked state
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth * widthScale,
    height: window.innerHeight * heightScale,
  });
  

  const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9]/g, "_");

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
    d3.csv("data/concatenated_full.csv").then((allData) => {
      // Add GlobalRank attribute
      const allDataWithGlobalRank = allData.map((entry) => ({
        ...entry,
        GlobalRank: entry.Rank, // Copy Rank to GlobalRank
      }));
  
      // Calculate the global max net worth for size scaling
      const globalMaxNetWorth = d3.max(allDataWithGlobalRank, (d) => +d["Net Worth($US billion)"]);
      setMaxNetWorth(globalMaxNetWorth);
  
      // Extract unique industries for the legend
      const uniqueIndustries = Array.from(new Set(allDataWithGlobalRank.map((d) => d.Category)));
      setIndustries(uniqueIndustries);
  
      // Filter data within the selected range
      const rangeData = allDataWithGlobalRank.filter(
        (d) => +d.Year >= selectedRange[0] && +d.Year <= selectedRange[1]
      );
  
      let finalData;
  
      if (selectedCountry) {
        // Filter data by the selected country
        const countryData = rangeData.filter((d) => d.Citizenship === selectedCountry);
  
        // Assign DomesticRank for the selected country
        const groupedByYear = d3.group(countryData, (d) => d.Year);
        Array.from(groupedByYear, ([year, entries]) => {
          entries
            .sort((a, b) => +a.GlobalRank - +b.GlobalRank) // Sort by GlobalRank
            .forEach((entry, index) => {
              entry.Rank = index + 1; // Reassign Rank as DomesticRank
            });
        });
  
        // Limit the data to `maxRank` using DomesticRank
        finalData = Array.from(groupedByYear, ([year, entries]) => {
          return entries
            .sort((a, b) => +a.Rank - +b.Rank)
            .slice(0, maxRank);
        }).flat();
      } else {
        // No country selected: Use GlobalRank and do not modify Rank
        const groupedByYear = d3.group(rangeData, (d) => d.Year);
        finalData = Array.from(groupedByYear, ([year, entries]) => {
          return entries
            .sort((a, b) => +a.GlobalRank - +b.GlobalRank)
            .slice(0, maxRank);
        }).flat();
      }
  
      setData(finalData);
  
      // Extract unique countries for the dropdown
      const uniqueCountries = Array.from(new Set(rangeData.map((d) => d.Citizenship)));
      setCountries(uniqueCountries);
    });
  }, [selectedRange, selectedCountry, maxRank]);  
  
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

    const yScale = d3.scaleLinear().domain([1, maxRank]).range([0, chartHeight]);

    const sizeScale = d3.scaleSqrt().domain([0, maxNetWorth]).range([3, 15]);
    // const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(industries);

    const groupedData = d3.group(data, (d) => d.Name);

    // Gridlines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .call(
        d3.axisLeft(yScale).tickValues(d3.range(1, maxRank + 1))
        .tickSize(-chartWidth)
        .tickFormat("")
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
              `<strong>${d.Name}</strong><br>
              Industry: ${d.Category}<br>
              Year: ${d.Year}<br>
              Global Rank: ${d.GlobalRank}<br>
              ${selectedCountry ? `Domestic Rank: ${d.Rank || "N/A"}<br>` : ""}
              Net Worth: $${d["Net Worth($US billion)"]}B`
            );
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        })
        .on("click", (event, d) => {
          if (!enableInteraction) return;
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

    if (descriptionText) {
      const textBoxWidth = 400;
      const textBoxHeight = 410;

      const textLines = descriptionText.split("\n");

      const foreignObject = svg
        .append("foreignObject")
        .attr("x", margin.left + chartWidth - textBoxWidth - 30)
        .attr("y", margin.top + chartHeight - textBoxHeight - 10)
        .attr("width", textBoxWidth)
        .attr("height", textBoxHeight);

      const div = foreignObject
        .append("xhtml:div")
        .style("font-size", "14px")
        .style("line-height", "1.5")
        .style("text-align", "left")
        .style("color", "black")
        .style("background-color", "rgba(255, 255, 255, 0.8)") // Add slight background opacity
        .style("padding", "5px")
        .style("border-radius", "5px");

      textLines.forEach((line) => {
        div.append("p")
          .style("margin", "0 0 10px 0") // Add spacing between paragraphs
          .text(line);
      });
    }
  }, [data, dimensions, industries, clickedBillionaire, enableInteraction]);

  return (
    <div>
      {!hideCountrySelector && ( // Conditionally render the dropdown
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
      )}
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
