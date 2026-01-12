# Dive Decompression Simulator

https://jvenezia.github.io/DiveDecompressionSimulator/

Dive Decompression Simulator visualizes a drawn dive profile and shows estimated tissue saturation
along with a decompression ceiling based on a compact Buhlmann ZHL-16C model.

## Features
- Draw a depth profile by clicking and dragging on the chart.
- Adjust total time, max depth, and gradient factors to see the ceiling shift.
- View saturation and ceiling overlays while you sketch.

## Run Locally
Open `index.html` in a browser.

## Notes
- The simulator assumes air (21% O2 / 79% N2).
- This tool is for educational exploration only and must not be used for real dive planning.

## Structure
- `main.html` UI layout and wiring.
- `js/` core simulation, profile utilities, and UI rendering.
- `css/` page styling.
