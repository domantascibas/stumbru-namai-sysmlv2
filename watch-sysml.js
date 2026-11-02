#!/usr/bin/env node

/**
 * Watch SysML files and auto-regenerate visualizer-data.js
 * 
 * Usage: node watch-sysml.js
 * 
 * This script watches Panel.sysml and Rooms.sysml for changes
 * and automatically regenerates visualizer-data.js.
 * 
 * Run this in a separate terminal window while working on the model.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PANEL_FILE = path.join(__dirname, 'model', 'Panel.sysml');
const ROOMS_FILE = path.join(__dirname, 'model', 'Rooms.sysml');
const GENERATOR_FILE = path.join(__dirname, 'generate-visualizer-data.js');
const OUTPUT_FILE = path.join(__dirname, 'visualizer-data.js');

// Track file modification times
let fileMtimes = {};

console.log('SysML Model Watcher');
console.log('====================\n');
console.log('Watching for changes in:');
console.log(`  - ${PANEL_FILE}`);
console.log(`  - ${ROOMS_FILE}\n`);
console.log('Press Ctrl+C to stop\n');

// Check if files exist
const filesToWatch = [PANEL_FILE, ROOMS_FILE];
for (const file of filesToWatch) {
    if (!fs.existsSync(file)) {
        console.error(`Error: ${file} does not exist!`);
        process.exit(1);
    }
}

// Initial generation
console.log('Running initial generation...');
try {
    execSync(`node ${GENERATOR_FILE}`, { stdio: 'inherit' });
    console.log('\nWatching for changes...\n');
} catch (error) {
    console.error('Failed to generate data:', error.message);
    process.exit(1);
}

// Record initial modification times
for (const file of filesToWatch) {
    const stats = fs.statSync(file);
    fileMtimes[file] = stats.mtimeMs;
}

// Check files every 1 second
const checkInterval = 1000;

function checkFiles() {
    let changed = false;
    
    for (const file of filesToWatch) {
        try {
            const stats = fs.statSync(file);
            const mtime = stats.mtimeMs;
            
            if (!fileMtimes[file] || fileMtimes[file] !== mtime) {
                fileMtimes[file] = mtime;
                changed = true;
                const fileName = path.basename(file);
                console.log(`${new Date().toLocaleTimeString()} - Change detected in ${fileName}`);
            }
        } catch (error) {
            console.error(`Error checking ${file}:`, error.message);
        }
    }
    
    if (changed) {
        console.log('Regenerating visualizer-data.js...');
        try {
            execSync(`node ${GENERATOR_FILE}`, { stdio: 'inherit' });
            console.log('Done.\n');
        } catch (error) {
            console.error('Error regenerating data:', error.message);
        }
    }
}

// Start watching
setInterval(checkFiles, checkInterval);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nWatcher stopped.');
    process.exit(0);
});
