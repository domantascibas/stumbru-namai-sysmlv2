# Quick Start Guide

## What You Need

- Node.js installed on your computer
- Your SysML model files: `model/Panel.sysml` and `model/Rooms.sysml`

## Step 1: Generate Data

Open a terminal in this folder and run:

```bash
node generate-visualizer-data.js
```

This creates `visualizer-data.js` from your SysML files.

## Step 2: View the Visualizer

Open `visualizer.html` in your web browser:

```bash
# On macOS
open visualizer.html

# On Linux
xdg-open visualizer.html

# On Windows
start visualizer.html
```

## Step 3: Auto-Update (Optional)

To have the visualizer update automatically when you edit SysML files:

**Option A - Simple**:
```bash
node generate-visualizer-data.js --watch
```

**Option B - With npm**:
```bash
npm run generate:watch
```

Keep this running in a separate terminal window. Now when you edit and save `Panel.sysml` or `Rooms.sysml`, the visualizer will update within seconds.

## That's It!

Your visualizer is now set up with auto-update. Click circuit breakers to see connected devices.

## Need Help?

- Full guide: `AUTO_UPDATE_GUIDE.md`
- Technical details: `SOLUTION_SUMMARY.md`
- Visualizer usage: `READViz.md`

## Troubleshooting

**If data doesn't update:**
1. Make sure you saved the SysML file
2. Check the terminal for errors
3. Click the "Refresh" button in the visualizer
4. Try running `node generate-visualizer-data.js` manually

**If you get Node.js errors:**
- Make sure Node.js is installed: `node --version`
- If not, download from: https://nodejs.org/

## Commands Summary

| Command | Purpose |
|---------|---------|
| `node generate-visualizer-data.js` | Generate data once |
| `node generate-visualizer-data.js --watch` | Auto-generate on file changes |
| `npm run generate` | Same as first command |
| `npm run generate:watch` | Same as second command |
| `npm run watch` | Use dedicated watcher |
