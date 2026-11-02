# Auto-Update Setup Guide

## Overview

This guide explains how to set up the electrical installation visualizer to automatically update when you modify the SysML model files (`Panel.sysml` and `Rooms.sysml`).

## What's Changed

Previously, the visualizer used hardcoded data in `visualizer-data.js`. Now:

1. **Data Generation**: `generate-visualizer-data.js` parses the SysML files and generates `visualizer-data.js` automatically
2. **Auto-Refresh**: The visualizer page automatically detects when `visualizer-data.js` changes and reloads
3. **Watch Mode**: Scripts monitor the SysML files and regenerate data when they change

## Quick Setup

### Option 1: Manual Generation (Recommended for occasional updates)

Run this command whenever you modify the SysML files:

```bash
node generate-visualizer-data.js
```

This creates/updates `visualizer-data.js` from your SysML model files. Then refresh your browser to see the changes.

### Option 2: Automatic Generation with Watch Mode (Recommended for active editing)

Run this in a terminal:

```bash
node generate-visualizer-data.js --watch
```

OR

```bash
npm run generate:watch
```

This watches `model/Panel.sysml` and `model/Rooms.sysml` for changes and automatically regenerates `visualizer-data.js`. The visualizer page will auto-refresh (every 5 seconds) to show the latest data.

**Pro tip**: Keep this running in a separate terminal window while you edit the SysML files.

### Option 3: Dedicated Watcher Script

```bash
node watch-sysml.js
```

Same as Option 2, but with more verbose output.

## Files Created/Modified

### New Files

1. **`generate-visualizer-data.js`** - The main generator script
   - Parses `Panel.sysml` and `Rooms.sysml`
   - Extracts circuit breakers with their properties (label, name, type, ratings, etc.)
   - Extracts all devices (outlets, lights, switches, appliances, etc.)
   - Builds connection relationships (pluggedIn, pluggedInto, controls, controlledBy)
   - Generates `visualizer-data.js`

2. **`watch-sysml.js`** - Dedicated file watcher
   - Monitors SysML files for changes
   - Automatically runs the generator
   - Clean output with timestamps

3. **`READViz.md`** - User documentation for the visualizer
4. **`AUTO_UPDATE_GUIDE.md`** - This file
5. **`package.json`** - Added npm scripts for convenience

### Modified Files

1. **`visualizer-app.js`**
   - Added auto-refresh functionality (checks every 5 seconds if data file changed)
   - Added `updateDataTimestamp()` to display when data was generated
   - Added manual refresh button in the UI
   - Added global functions for refresh control

2. **`visualizer.html`**
   - Added timestamp display showing when data was generated
   - Added auto-refresh status indicator
   - Added manual refresh button
   - Improved CSS for tree visualization (scrollable, better styling)

3. **`visualizer-data.js`**
   - This file will be overwritten by the generator
   - Now contains auto-generated comment with timestamp
   - Structure matches what the visualizer expects

## How It Works

### Data Flow

```
Panel.sysml + Rooms.sysml
          ↓
   (parsed by generator)
          ↓
   visualizer-data.js (auto-generated)
          ↓
   visualizer.html + visualizer-app.js
          ↓
   Browser (with auto-refresh)
```

### Auto-Refresh Mechanism

The visualizer page uses the following approach:

1. On page load, it records the `Last-Modified` timestamp of `visualizer-data.js`
2. Every 5 seconds, it fetches `visualizer-data.js` with a fresh timestamp query
3. If the `Last-Modified` header differs, it reloads the entire page
4. This ensures the visualizer always shows the latest data

### Watch Mode Mechanism

The watch scripts (`generate-visualizer-data.js --watch` or `watch-sysml.js`):

1. Record the modification timestamps of `Panel.sysml` and `Rooms.sysml`
2. Every 1-2 seconds, check if the files have been modified
3. If modified, run the generator to regenerate `visualizer-data.js`
4. The visualizer's auto-refresh then picks up the change and reloads

## Usage Examples

### Example 1: Editing SysML and Viewing Changes

```bash
# Terminal 1: Start the watcher
node generate-visualizer-data.js --watch

# Terminal 2: Open visualizer in browser
open visualizer.html
```

Now edit `model/Panel.sysml` or `model/Rooms.sysml` in your editor. Within seconds, the watcher will regenerate the data, and your browser will automatically refresh to show the changes.

### Example 2: Using npm Scripts

```bash
# Generate data once
npm run generate

# Generate with watch
npm run generate:watch

# Or use the dedicated watcher
npm run watch
```

### Example 3: Manual Workflow

```bash
# After editing SysML files
node generate-visualizer-data.js

# Then refresh your browser
```

## Troubleshooting

### Data not updating in browser

1. **Check the timestamp**: The page should show "Data generated: [date/time]" at the top
2. **Manual refresh**: Click the "Refresh" button
3. **Check watcher output**: If using watch mode, check the terminal for errors
4. **Verify file changes**: Make sure you actually saved the SysML file
5. **Clear browser cache**: Sometimes browsers cache files aggressively

### Generator script errors

1. **Syntax errors in SysML**: The parser expects valid SysML syntax. Check for:
   - Missing or mismatched braces `{ }`
   - Invalid property syntax
   - Unquoted strings

2. **Missing files**: Make sure `model/Panel.sysml` and `model/Rooms.sysml` exist

3. **Permission issues**: Make sure you have write permission for `visualizer-data.js`

### Auto-refresh not working

1. **Check browser console**: Press F12 and look for errors
2. **Network issues**: The page needs to be able to fetch `visualizer-data.js`
3. **File not changing**: The auto-refresh only triggers if the file's Last-Modified header changes
4. **Try a different browser**: Chrome/Edge have best support

## Customization

### Changing the Refresh Interval

Edit `visualizer-app.js` and change the interval in `startAutoRefresh()`:

```javascript
// Change this line (currently 5000 = 5 seconds)
setInterval(() => { checkDataFileTimestamp(); }, 5000);
```

### Changing Watched Files

Edit `generate-visualizer-data.js` or `watch-sysml.js` to add/remove files from the watch list.

### Adding More Device Properties

The generator extracts properties from the SysML files. To add more properties:

1. Add the property extraction in `parseDeviceBlock()`
2. Add it to the output in the `generateOutput()` function

## Technical Details

### Parser Capabilities

The generator's SysML parser handles:

- Part definitions with nested parts
- Properties (`:>> label = "..."`)
- Relations (`ref :>> feeds = (...)`, `ref :>> pluggedIn = (...)`, etc.)
- Doc and comment blocks (for notes)
- All breaker types (MainSwitch, Rcd, CircuitBreaker)
- All device types (Outlet, Light, Switch, FixedAppliance, PluggedAppliance, PowerStrip, CableEnd, Thermostat)

### Output Structure

The generated `visualizer-data.js` contains:

```javascript
// Circuit Breakers
const circuitBreakers = {
    Q1: { label, name, type, product, ratedCurrent, poles, phase, tripCurve, breakingCapacity, residualCurrent, rcdType, icon, feeds, downstream },
    F1: { ... },
    F2: { ... },
    // ...
};

// Devices
const devices = {
    'apartment.livingKitchen.R1': { id, type, room, icon, label, name, product, power, socketCount, bulbSocketCount, phases, lengthM, isWaterproof, hasDataSocket, switchType, pluggedIn, pluggedInto, controls, controlledBy, bulbs, note },
    // ...
};
```

### IEC/ISO Symbols

The visualizer uses the following symbols:

| Type | Symbol | Color |
|------|--------|-------|
| Main Switch | Q | Purple |
| RCD | RCD | Orange |
| Circuit Breaker | F | Red |
| Outlet | R | Blue |
| Light | L | Yellow |
| Switch | S | Green |
| Fixed Appliance | FIX | Gray |
| Plugged Appliance | APP | Teal |
| Power Strip | PS | Dark Gray |
| Cable End | X | Gray |
| Thermostat | T | Red |
| Bulb | LAMP | Yellow |

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Should work, but auto-refresh may be less reliable
- **Mobile**: Supported but layout may be compressed

## Performance

- Generator runs in < 1 second for typical model sizes
- Watcher adds minimal overhead
- Auto-refresh checks every 5 seconds (configurable)
- Generated data file is typically < 100KB

## Security

- All files are local to your system
- No external connections are made
- No data is sent to any server
- The generator only reads your SysML files

## Future Enhancements

Possible improvements:

1. Use WebSockets or Server-Sent Events for instant updates (requires a server)
2. Add a build script that bundles everything into a single file
3. Support for more SysML features
4. Better error reporting in the UI
5. Visual diff showing what changed

## Support

If you encounter issues:

1. Check this guide
2. Check the troubleshooting section
3. Review the console output in your browser (F12)
4. Check the terminal output if using watch mode

## License

This solution is provided as-is. Feel free to modify and distribute as needed.
