# ECS 272 Final Project

## Overview

The project is implemented using **Vite + React + TypeScript** and provides an intuitive interface for data exploration.

---

## Installation and Setup

1. **Clone the Repository**

2. **Install Dependencies**:
    Ensure you have Node.js installed, then run:
    ```bash
    npm install
    ```
    Start the development server with:
    ```bash
    npm run dev
    ```
    The application will be accessible at http://localhost:3000.

---

## Features

1. **Interactive Pages**:  
   The project web application is divided into multiple pages, each featuring a distinct visualization and storytelling text. Users can scroll down to navigate through the pages.

2. **Zoom Functionality (Page 2)**:  
   - A button enables zooming into two subperiods of the chart:  
     - 1997–2010 
     - 2010–2024

3. **Country Selection and Year Range Adjustment (Page 5)**:  
   - **Slider Bar**: Enables selecting a specific year range for analysis. 
   - **Dropdown Menu**: Allows users to select a country of interest.  
   - **Interactive Highlighting**: Clicking on a circle of a billionaire highlights their line and updates the **Sankey Diagram** and **Histogram** to reflect the selected year.

4. **Hover Functionality (Pages 3, 4, and 5)**:  
   - **Page 3, 5–Histogram**: Hovering over the histogram shows:  
     - Country Name  
     - Count of Unique Billionaires 
   - **Page 4, 5–Bump Chart**: Hovering over a circle displays detailed billionaire information:  
     - Name  
     - Year
     - Industry Category  
     - Global Rank  
     - Domestic Rank 
     - Net Worth
   - **Page 5–Sankey Diagram**: Hovering over a line displays:  
     - Source Node  
     - Target Node
     - Total Worth of the Line


## Usage Instructions
1. Navigate the Pages:

    Open the application in your browser.
    Scroll down to switch between pages and explore different graphs.
2. Interact with Visualizations:

    - Page 2:
        - Use the Zoom Button to focus on the desired subperiod of the chart.
    - Page 5:
        - Select a country from the dropdown menu.
        - Adjust the year range using the slider bar.
        - Click on a billionaire’s circle to update the Sankey Diagram and Histogram with the selected year’s data.
    Use the Reset Button to clear all selections.
    - Hover on any data point you are interested in.