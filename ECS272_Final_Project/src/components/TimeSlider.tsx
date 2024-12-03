import React, { useEffect, useState } from 'react';
import Slider from '@mui/material/Slider';

function TimeSlider({ selectedRange, setRange }) {
    const [sliderWidth, setSliderWidth] = useState(window.innerWidth * 0.4);

    // Resize listener for slider width
    useEffect(() => {
        const handleResize = () => {
        setSliderWidth(window.innerWidth * 0.4);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const marks = Array.from({ length: 2024 - 1997 + 1 }, (_, i) => ({
        value: 1997 + i,
        label: (1997 + i) % 5 === 0 || 1997 + i === 1997 || 1997 + i === 2024? `${1997 + i}` : '', // Label every 5 years
    }));


    const handleChange = (event: Event, newValue: number | number[]) => {
        if (Array.isArray(newValue)) {
        const [start, end] = newValue;

        // Enforce the 5-year range
        if (start === 1997) {
            setRange([start, start + 4]);
            return;
        }
        if (end === 2024) {
            setRange([end - 4, end]);
            return;
        }
        if (start !== selectedRange[0]) {
            setRange([start, Math.min(start + 4, 2024)]);
        } else if (end !== selectedRange[1]) {
            setRange([Math.max(end - 4, 1997), end]);
        }
        }
    };

  return (
    <div style={{ display: 'flex', flexDirection: 'column'}}>
      <label style={{ marginTop: '20px', marginLeft: '20px', fontWeight: 'bold' }}>Time range: {selectedRange[0]} - {selectedRange[1]}</label>
      <Slider
        value={selectedRange}
        onChange={handleChange}
        valueLabelDisplay="auto"
        min={1997}
        max={2024}
        step={1}
        marks={marks} 
        sx={{
          '& .MuiSlider-thumb': {
            width: 10,
            height: 10,
            color: '#007bff', // Thumb color
          },
          '& .MuiSlider-track': {
            bgcolor: '#007bff', // Highlighted range color
          },
          '& .MuiSlider-rail': {
            bgcolor: '#d3d3d3', // Non-highlighted range color
          },
          '& .MuiSlider-markLabel': {
            fontSize: '0.75rem',
          },
        }}
        style={{
          width: sliderWidth, // Dynamically adjust slider width
          marginLeft: '40px',
        }}
      />
    </div>
  );
}

export default TimeSlider;

