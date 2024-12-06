import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import BumpChart from './components/BumpChart';
import TimeSlider from './components/TimeSlider';
import SankeyDiagram from './components/SankeyDiagram';
import BarLineChart from './components/BarLineChart';
import Histogram from './components/Histogram';
import * as d3 from "d3";

import textdata from './stores/text.json';

// Adjust the color theme for Material UI
const theme = createTheme({
  palette: {
    primary: {
      main: grey[700],
    },
    secondary: {
      main: grey[700],
    },
  },
});

// const page2description = "Over the past few decades, the world has witnessed a remarkable transformation in wealth concentration. This opening visualization sets the stage by presenting the growth of billionaires globally alongside the expansion of the world’s economy. The bars represent the number of billionaires each year, steadily rising from the late 1990s to today. Meanwhile, the green line illustrates the trend of global GDP, showing the economic context within which this dramatic increase in billionaire counts has unfolded. \n\nAs the graph reveals, the growth in billionaire numbers has often outpaced the general expansion of the world economy, raising questions about wealth distribution and the forces driving this concentration of resources. This dual perspective invites us to explore the broader story of global wealth creation and its uneven accumulation. Let’s delve deeper into the patterns and implications of this evolution.";


function Layout() {
  const [selectedRange, setRange] = useState([2020, 2024]);
  const [page2Range, setPage2Range] = useState([1997, 2023]);
  const [page2Button, setPage2Button] = useState("First Half");
  const [page2Title, setPage2Title] = useState("Billionaire Growth and World GDP");
  const [page2Text, setPage2Text] = useState(textdata.page2text);
  const [selectedCountry, setCountry] = useState("");
  const [selectedBillionaire, setSelectedBillionaire] = useState(null);
  const [selectedYear, setSelectedYear] = useState(selectedRange[1]);
  const [colorScale, setColorScale] = useState(null);

  useEffect(() => {
    d3.csv("data/concatenated_full.csv").then((allData) => {
      const uniqueIndustries = Array.from(new Set(allData.map((d) => d.Category)));
      const colors = d3.schemeSet3.concat(d3.schemeCategory10); // Combine multiple color schemes
      const scale = d3.scaleOrdinal()
        .domain(uniqueIndustries)
        .range(colors.slice(0, uniqueIndustries.length));
      setColorScale(() => scale);
      // console.log("Generated Color Scale:", scale.domain(), scale.range());
    });
  }, []);

  // console.log(selectedYear);

  const handlePage2ButtonClick = () => {
    if (page2Button === "First Half") {
      setPage2Range([1997, 2010]);
      setPage2Button("Second Half");
      setPage2Title("Billionaire Growth and World GDP between Year 1997-2010");
      setPage2Text(textdata.page2textfirst);
    } else if (page2Button === "Second Half") {
      setPage2Range([2010, 2023]);
      setPage2Button("All");
      setPage2Title("Billionaire Growth and World GDP between Year 2010-2023");
      setPage2Text(textdata.page2textsecond);
    } else if (page2Button === "All") {
      setPage2Range([1997, 2023]);
      setPage2Button("First Half");
      setPage2Title("Billionaire Growth and World GDP");
      setPage2Text(textdata.page2text);
    }
  };

  return (
    <div
      style={{
        overflowY: 'scroll',
        height: '100vh',
        scrollSnapType: 'y mandatory',
      }}
    >
      {/* Page 1 */}
      <div
        style={{
          height: '100vh',
          scrollSnapAlign: 'start',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #EAE7DC, #D8C3A5)',

        }}
      >
        <h1>Welcome to the Billionaires Visualization</h1>
        <p>Scroll down to explore</p>
        <p>Yueqiao Chen, Shicheng Wen</p>
      </div>

      {/* Page 2 */}
      <div
        style={{
          height: '100vh',
          scrollSnapAlign: 'start',
          padding: '20px',
          backgroundColor: '#d0d0d0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <BarLineChart selectedRange={page2Range} title={page2Title} descriptionText={page2Text}/>
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '20px',
          }}
        >
          <button
            onClick={handlePage2ButtonClick}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#8884d8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          >
            {page2Button}
          </button>
        </div>
      </div>


      {/* Page 3 */}
      <div
        style={{
          height: '100vh',
          scrollSnapAlign: 'start',
          backgroundColor: '#e0e0e0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Histogram
          selectedRange={[1997, 2024]}
          selectedBillionaire={null}
          setSelectedBillionaire={() => {}}
          useRange={true}
          widthScale={0.95}
          heightScale={0.95}
          titleFontSize='24px'
          showLabel={true}
          dottedLine={true}
          descriptionText={textdata.page3text}
        />
      </div>


      {/* Page 4 */}
      <div
        style={{
          height: '100vh',
          scrollSnapAlign: 'start',
          padding: '20px',
          backgroundColor: '#f0f0f0',
        }}
      >
      <BumpChart
        selectedRange={[2020, 2024]}
        selectedCountry="South Korea"
        setCountry={() => {}}
        setSelectedBillionaire={() => {}}
        selectedYear={2024}
        setSelectedYear={() => {}}
        colorScale={colorScale}
        maxRank={6}
        widthScale={0.95}
        heightScale={0.95}
        hideCountrySelector={true}
        enableInteraction={false}
        descriptionText={textdata.page4text}
      />
        
      </div>

      {/* Page 5 */}
      {/* Last Page: Interactive Dashboard */}
      <div
  style={{
    height: '100vh',
    scrollSnapAlign: 'start',
    padding: '10px',
    backgroundColor: '#ffffff', 
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto', 
  }}
>
  {/* <h4 style={{ textAlign: 'center'}}>
    Interactive Dashboard
  </h4> */}
  <Grid container spacing={2} direction="column" style={{ height: '100%', width: '100%' }}>
    <Grid item container xs={12} id="main-container" style={{ flexGrow: 1 }}>
      <Grid item xs={12} md={7} id="map-container" style={{ width: '100%', height: '100%', paddingRight: '10px' }}>
        <TimeSlider selectedRange={selectedRange} setRange={setRange} />
        <BumpChart 
          selectedRange={selectedRange}
          selectedCountry={selectedCountry}
          setCountry={setCountry}
          setSelectedBillionaire={setSelectedBillionaire}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          colorScale={colorScale}
        />
      </Grid>
      {/* Parallel Plot (Sankey + Placeholder) on the right */}
      <Grid
          item
          xs={12}
          md={5}
          id="parallel-plot-container"
          direction="column"
        >
        <Grid item xs={12} id="histogram-container"  
        style={{
            height: '50%',
            width: '235%',
            border: '2px solid #555', // Add a distinct border
            borderRadius: '8px', // Rounded corners
            padding: '5px', // Inner spacing
            marginTop: '20px', // Space between this grid item and others
            marginLeft: '10px',
            boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
          }}>
          <SankeyDiagram
            selectedRange={selectedRange}
            selectedBillionaire={selectedBillionaire}
            setSelectedBillionaire={setSelectedBillionaire}
            colorScale={colorScale}
          />
        </Grid>
        <Grid item xs={12} style={{
            flexGrow:1,
            height: '40%',
            width: '235%',
            border: '2px solid #555', // Add a distinct border
            borderRadius: '8px', // Rounded corners
            padding: '5px', // Inner spacing
            marginTop: '20px', // Space between this grid item and others
            marginLeft: '10px',
            boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
          }}
        >
          <Histogram selectedRange={selectedRange}
            selectedBillionaire={selectedBillionaire}
            setSelectedBillionaire = {setSelectedBillionaire}/>
        </Grid>
      </Grid>
    </Grid>
  </Grid>
</div>

    </div>
  );
}

// App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  );
}

export default App;
