import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const SankeyDiagram = ({ selectedRange, selectedBillionaire, selectedYear, setSelectedBillionaire, colorScale }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [data, setData] = useState([]);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth * 0.45,
    height: window.innerHeight * 0.55,
  });
  let yearToFilter = selectedBillionaire ? selectedBillionaire.Year : selectedRange[1];

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.45,
        height: window.innerHeight * 0.55,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (yearToFilter>selectedRange[1] || yearToFilter< selectedRange[0] || !selectedBillionaire) {
      yearToFilter = selectedRange[1];
      setSelectedBillionaire(null);
    }
  })

  useEffect(() => {
    d3.csv("data/concatenated_full.csv").then((allData) => {
      console.log("Filtering by year:", yearToFilter);
  
      const yearData = allData.filter((d) => +d.Year === +yearToFilter);
  
      const top20YearData = yearData
        .sort((a, b) => +b["Net Worth($US billion)"] - +a["Net Worth($US billion)"])
        .slice(0, 20);
  
      setData(top20YearData);
    });
  }, [selectedRange, selectedBillionaire]); 
  
  

  useEffect(() => {
    if (!data.length) return;
  
    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
  
    svg.selectAll("*").remove();
  
    const { width, height } = dimensions;
    const margin = { top: 80, right: 150, bottom:0, left: 90 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
  
    const nodes = [];
      const links = [];
      const nodeIndex = new Map();
  
      const categories = ["Citizenship", "Location", "Category"];
      categories.forEach((category, columnIndex) => {
        const values = Array.from(new Set(data.map((d) => d[category])));
        values.forEach((value) => {
          const key = `${value}-${category}`;
          if (!nodeIndex.has(key)) {
            nodeIndex.set(key, nodes.length);
            nodes.push({
              name: value,
              key,
              category,
              column: columnIndex,
              value: 0,
            });
          }
        });
      });
  
      data.forEach((d) => {
        const netWorth = +d["Net Worth($US billion)"];
        const citizenshipKey = `${d.Citizenship}-Citizenship`;
        const locationKey = `${d.Location}-Location`;
        const categoryKey = `${d.Category}-Category`;
  
        const citizenshipIndex = nodeIndex.get(citizenshipKey);
        const locationIndex = nodeIndex.get(locationKey);
        const categoryIndex = nodeIndex.get(categoryKey);
  
        nodes[citizenshipIndex].value += netWorth;
        nodes[locationIndex].value += netWorth;
        nodes[categoryIndex].value += netWorth;
  
        links.push({
          source: citizenshipIndex,
          target: locationIndex,
          value: netWorth,
          name: d.Name, 
          industry: d.Category,
        });
  
        links.push({
          source: locationIndex,
          target: categoryIndex,
          value: netWorth,
          name: d.Name, 
          industry: d.Category,
        });
      });
  
      const totalNetWorth = d3.sum(nodes, (d) => d.value);
      const heightScale = d3
        .scaleLinear()
        .domain([0, totalNetWorth])
        .range([0, chartHeight]);
      const valueScale = d3
        .scaleLinear()
        .domain([0, d3.max(links, (d) => d.value)])
        .range([1, 12]);
  
      const columnCount = categories.length;
      const columnWidth = chartWidth / (columnCount - 1);
      const nodePositions = nodes.map((node) => {
        const columnNodes = nodes.filter((n) => n.column === node.column);
        const nodeHeight = heightScale(node.value);
        const yOffset = columnNodes.slice(0, columnNodes.indexOf(node)).reduce((sum, n) => sum + heightScale(n.value) + 10, 0);
        return {
          ...node,
          x: node.column * columnWidth,
          y: yOffset + nodeHeight / 2,
          height: nodeHeight,
        };
      });
  
      const defs = svg.append("defs");
      links.forEach((link, i) => {
        const gradientId = `gradient-${i}`;
        const sourceNode = nodePositions[link.source];
        const targetNode = nodePositions[link.target];
  
        defs
          .append("linearGradient")
          .attr("id", gradientId)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", sourceNode.x + 5)
          .attr("x2", targetNode.x - 5)
          .attr("y1", sourceNode.y)
          .attr("y2", targetNode.y)
          .selectAll("stop")
          .data([
            { offset: "0%", color: d3.schemeTableau10[sourceNode.column % 10] },
            { offset: "100%", color: d3.schemeTableau10[targetNode.column % 10] },
          ])
          .enter()
          .append("stop")
          .attr("offset", (d) => d.offset)
          .attr("stop-color", (d) => d.color);
      });
  
      const calculateLinkPositions = () => {
        const linkGroupsBySource = d3.group(links, (d) => d.source);
        const linkGroupsByTarget = d3.group(links, (d) => d.target);
  
        linkGroupsBySource.forEach((groupLinks, sourceIndex) => {
          let sourceOffset = -nodePositions[sourceIndex].height / 2;
          groupLinks.forEach((link) => {
            const sourceNode = nodePositions[link.source];
            const linkHeight = heightScale(link.value);
  
            link.y1 = sourceNode.y + sourceOffset + linkHeight / 2;
            sourceOffset += linkHeight;
          });
        });
  
        linkGroupsByTarget.forEach((groupLinks, targetIndex) => {
          let targetOffset = -nodePositions[targetIndex].height / 2;
          groupLinks.forEach((link) => {
            const targetNode = nodePositions[link.target];
            const linkHeight = heightScale(link.value);
  
            link.y2 = targetNode.y + targetOffset + linkHeight / 2;
            targetOffset += linkHeight;
          });
        });
      };
  
      calculateLinkPositions();
  
  
      // Title
      svg.append("text")
        .attr("x", width / 2 - 50)
        .attr("y", 60)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text(`Sankey Diagram for Year ${yearToFilter}`);
  
    // Draw links
    svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", (d) => {
        console.log(d);
        const sourceNode = nodePositions[d.source];
        const targetNode = nodePositions[d.target];
        const x1 = sourceNode.x + 5;
        const x2 = targetNode.x - 5;
        const curvature = 0.5;
        const xi = d3.interpolateNumber(x1, x2);
        const xMid = xi(curvature);
        return `M${x1},${d.y1}C${xMid},${d.y1} ${xMid},${d.y2} ${x2},${d.y2}`;
      })
      .attr("fill", 'none')
      .attr("stroke", (d)=>colorScale(d.industry))
      .attr("stroke-width", (d) => valueScale(d.value))
      .attr("opacity", (d) =>
        selectedBillionaire
          ? d.name === selectedBillionaire.Name || d.Citizenship === selectedBillionaire.Citizenship
            ? 1
            : 0.2
          : 0.8
      )
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .html(
            `<strong>Value:</strong> $${d.value.toFixed(
              2
            )}B<br><strong>Source:</strong> ${nodePositions[d.source].name}<br><strong>Target:</strong> ${nodePositions[d.target].name}`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });
  
    // Draw nodes
    svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .selectAll("rect")
      .data(nodePositions)
      .enter()
      .append("rect")
      .attr("x", (d) => d.x - 15)
      .attr("y", (d) => d.y - d.height / 2)
      .attr("width", 20)
      .attr("height", (d) => d.height)
      .attr("fill", (d) => d3.schemeTableau10[d.column % 10])
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .html(
            `<strong>${d.name}</strong><br><strong>Category:</strong> ${d.category}<br><strong>Total Value:</strong> $${d.value.toFixed(
              2
            )}B`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });
  
    // Add column labels
      categories.forEach((c, i) => {
        svg.append("text")
          .attr("x", margin.left + i * columnWidth)
          .attr("y", chartHeight)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .text(c);
      });
  
      // Add node labels
    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`) // Correct use of template literals
      .selectAll("text.node-label")
      .data(nodePositions)
      .enter()
      .append("text")
      .attr("class", "node-label")
      .attr("x", (d) => d.x + 15) // Offset text to the right of nodes
      .attr("y", (d) => d.y)
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "start") // Align text to the left of the node
      .text((d) => d.name)
      .attr("fill", "#333")
      .attr("font-size", "12px");
  
  }, [data, dimensions, selectedBillionaire, selectedRange]);
  

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

export default SankeyDiagram;
