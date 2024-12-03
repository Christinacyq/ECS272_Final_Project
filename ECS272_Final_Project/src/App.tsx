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

function Layout() {
  const [selectedRange, setRange] = useState([2020, 2024]);
  const [selectedCountry, setCountry] = useState("");
  const [selectedBillionaire, setSelectedBillionaire] = useState(null);
  const [selectedYear, setSelectedYear] = useState(selectedRange[1]);
  const [colorScale, setColorScale] = useState(null);

  useEffect(() => {
    d3.csv("data/concatenated_full.csv").then((allData) => {
      const uniqueIndustries = Array.from(new Set(allData.map((d) => d.Category)));
      const scale = d3.scaleOrdinal(d3.schemeTableau10).domain(uniqueIndustries);
      setColorScale(() => scale);
      console.log("Generated Color Scale:", scale.domain(), scale.range());
    });
  }, []);

  console.log(selectedYear);

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
        }}
      >
        <BarLineChart/> 

      </div>

      {/* Page 3 */}
      <div
        style={{
          height: '100vh',
          scrollSnapAlign: 'start',
          padding: '20px',
          backgroundColor: '#e0e0e0',
        }}
      >
        
        
      </div>

      {/* Page 3 */}
      <div
        style={{
          height: '100vh',
          scrollSnapAlign: 'start',
          padding: '20px',
          backgroundColor: '#f0f0f0',
        }}
      >
        
        
      </div>

      {/* Page 4 */}
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
