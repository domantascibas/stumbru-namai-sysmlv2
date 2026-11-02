# Electrical Installation Visualizer

This is a web-based visualizer for the electrical installation model defined in SysML files.

## Features

- **One breaker per row**: Circuit breakers are displayed in a clean, vertical list
- **IEC/ISO symbols**: Uses standard electrical symbols (Q, F, R, L, S, FIX, APP, PS, X, T, LAMP)
- **Downstream device listing**: Click a breaker to see all devices connected to it
- **Upstream chain**: For each device, shows the complete connection path back to Q1
- **Downstream tree**: For each device, shows all connected elements downstream
- **Socket/bulb counts**: Displays number of sockets in outlets and bulb counts in lights
- **Auto-refresh**: Page automatically reloads when the SysML model files are updated

## Quick Start

### Option 1: One-time generation

To generate the visualizer data from your SysML model files:

```bash
node generate-visualizer-data.js
```

This creates `visualizer-data.js` from `model/Panel.sysml` and `model/Rooms.sysml`.

Then open `visualizer.html` in your web browser.

### Option 2: Auto-update mode

To have the data automatically regenerate whenever you edit the SysML files:

```bash
node generate-visualizer-data.js --watch
```

This runs a watcher that monitors `Panel.sysml` and `Rooms.sysml` for changes and regenerates the data automatically. The visualizer page will auto-refresh (every 5 seconds) to pick up the new data.

**Recommended**: Run this command in a separate terminal window while you're editing the SysML files. Then keep your visualizer.html page open in a browser - it will automatically update.

### Option 3: Dedicated watcher script

```bash
node watch-sysml.js
```

This does the same as `--watch` but with more verbose output.

## File Structure

- `visualizer.html` - Main HTML page
- `visualizer-app.js` - Application logic and UI rendering
- `visualizer-data.js` - Auto-generated data from SysML files (do not edit manually)
- `generate-visualizer-data.js` - Script to generate data from SysML files
- `watch-sysml.js` - Watch script for auto-regeneration
- `model/Panel.sysml` - Circuit breaker definitions
- `model/Rooms.sysml` - Room and device definitions

## IEC/ISO Symbol Legend

| Symbol | Type | Color | Description |
|--------|------|-------|-------------|
| Q | Main Switch | Purple | Main power switch |
| F | Circuit Breaker / RCD | Red/Orange | Circuit protection device |
| R | Outlet/Receptacle | Blue | Power socket |
| L | Light | Yellow | Lighting fixture |
| S | Switch | Green | Light/command switch |
| FIX | Fixed Appliance | Gray | Permanently installed appliance |
| APP | Plugged Appliance | Teal | Plug-in device |
| PS | Power Strip | Dark Gray | Multi-socket extension |
| X | Cable End | Gray | Cable termination point |
| T | Thermostat | Red | Temperature controller |
| LAMP | Light Bulb | Yellow | Individual light bulb |

## Page Layout

### Top Section: Circuit Breakers
- Each circuit breaker is displayed on its own row
- Shows: icon, label, name, type, rated current, phase
- Click a breaker to see its downstream devices

### Middle Section: Devices for Selected Breaker
- When a breaker is selected, all devices directly fed by it are listed
- Each device is displayed on its own row with:
  - IEC/ISO symbol and icon
  - Label and location (room)
  - Product/name
  - Power rating
  - Socket/bulb counts
  - Tags (waterproof, data socket, multi-phase, etc.)
  
#### Device Details
Each device row expands to show:
- **Upstream Chain**: Complete connection path from this device back to Q1
- **Downstream Elements**: Tree view of everything connected downstream (plugged-in devices, power strips, bulbs, etc.)

## Browser Compatibility

- Chrome/Edge (latest): Full support including auto-refresh
- Firefox/Safari: Full support
- Mobile browsers: Supported but layout may be compressed

## Troubleshooting

### Data not updating
1. Make sure you've run `node generate-visualizer-data.js --watch` or `node watch-sysml.js`
2. Check the terminal for errors
3. Try manually running `node generate-visualizer-data.js`
4. Refresh the visualizer.html page manually

### Page not auto-refreshing
1. The auto-refresh checks every 5 seconds. Wait a few moments.
2. Try refreshing the page manually.
3. Check browser console for errors (F12 > Console).
4. Make sure you're opening visualizer.html directly (not through a web server that might cache files).

### SysML parsing errors
If the generator script reports errors, please check:
1. The SysML files are valid and follow the expected format
2. All referenced devices exist in the model
3. There are no syntax errors in the SysML files

## Development

To modify the visualizer:

1. Edit `visualizer.html` for layout/CSS changes
2. Edit `visualizer-app.js` for logic/UI behavior changes
3. The `generate-visualizer-data.js` script parses the SysML files and generates the data structure

The data structure in `visualizer-data.js` contains:
- `circuitBreakers`: Object with all circuit breakers (Q1, F1-F13)
- `devices`: Object with all devices from all rooms
- Each breaker has a `devices` array listing device IDs it feeds

## Performance

- The visualizer is optimized for client-side rendering
- Auto-refresh adds minimal overhead (5-second polling)
- The generated data file is typically < 100KB

## Notes

- The visualizer does NOT edit the SysML files - it only reads them
- All data is generated from the SysML model, so the visualizer always reflects the current model state
- For best results, use Chrome or Edge which support all features
