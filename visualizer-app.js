// Application State
let selectedBreaker = null;
let dataFileTimestamp = null;
let refreshInterval = null;

// Auto-refresh: check if data file has changed every 5 seconds
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    
    refreshInterval = setInterval(() => {
        checkDataFileTimestamp();
    }, 5000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function checkDataFileTimestamp() {
    // Get the data file URL
    const scripts = document.querySelectorAll('script[src="visualizer-data.js"]');
    if (scripts.length === 0) return;
    
    // Use a timestamp-based query to check if file changed
    const now = new Date().getTime();
    fetch(`visualizer-data.js?t=${now}`)
        .then(response => {
            const lastModified = response.headers.get('Last-Modified');
            if (lastModified && lastModified !== dataFileTimestamp) {
                dataFileTimestamp = lastModified;
                // Reload the page to pick up new data
                console.log('Data file changed, reloading...');
                location.reload();
            }
        })
        .catch(error => {
            // Console error for debugging
            console.log('Auto-refresh check failed:', error.message);
        });
}

// IEC/ISO Symbols based on IEC 81346-2
function getSymbol(type, breakerType) {
    // For circuit breakers
    if (breakerType === 'Main Switch') return 'Q';
    if (breakerType === 'RCD') return 'F';
    if (breakerType === 'Circuit Breaker') return 'F';
    
    // For devices
    const symbols = {
        'Light': 'L',
        'Outlet': 'R',
        'Switch': 'S',
        'FixedAppliance': 'FIX',
        'PluggedAppliance': 'APP',
        'PowerStrip': 'PS',
        'CableEnd': 'X',
        'Thermostat': 'T',
        'CircuitBreaker': 'F',
        'RCD': 'F',
        'MainSwitch': 'Q'
    };
    return symbols[type] || '?';
}

// Get CSS class for symbol color
function getSymbolClass(type, breakerType) {
    if (breakerType === 'Main Switch') return 'symbol-MS';
    if (breakerType === 'RCD') return 'symbol-RCD';
    if (breakerType === 'Circuit Breaker') return 'symbol-CB';
    
    const classes = {
        'Light': 'symbol-L',
        'Outlet': 'symbol-R',
        'Switch': 'symbol-S',
        'FixedAppliance': 'symbol-FIX',
        'PluggedAppliance': 'symbol-APP',
        'PowerStrip': 'symbol-PS',
        'CableEnd': 'symbol-X',
        'Thermostat': 'symbol-T'
    };
    return classes[type] || '';
}

// Format power display
function formatPower(power) {
    if (!power || power === '0 W') return '0 W';
    if (power.includes('W')) return power;
    return power + ' W';
}

// Extract numeric power value
function extractPowerValue(power) {
    if (!power) return 0;
    const match = power.match(/([\d.]+)/);
    return match ? parseFloat(match[0]) : 0;
}

// Get device specs string with socket/bulb counts
function getDeviceSpecs(device) {
    const parts = [];
    
    if (device.socketCount && device.socketCount > 0) {
        parts.push(`${device.socketCount}x socket` + (device.socketCount > 1 ? 's' : ''));
    }
    
    if (device.bulbSocketCount && device.bulbSocketCount > 0) {
        const actualBulbCount = device.bulbs ? device.bulbs.reduce((sum, b) => sum + b.count, 0) : 0;
        if (device.bulbSocketCount > 0) {
            parts.push(`${actualBulbCount}/${device.bulbSocketCount} bulb` + (device.bulbSocketCount > 1 ? 's' : ''));
        }
    }
    
    if (device.lengthM) {
        parts.push(`${device.lengthM}m`);
    }
    
    return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

// Create breaker item element
function createBreakerItem(breaker) {
    const div = document.createElement('div');
    div.className = 'breaker-item';
    
    if (selectedBreaker === breaker.label) {
        div.classList.add('selected');
    }
    
    const symbol = getSymbol(breaker.type, breaker.type);
    const symbolClass = getSymbolClass(breaker.type, breaker.type);
    
    div.innerHTML = `
        <span class="device-icon ${symbolClass}">${symbol}</span>
        <span class="breaker-label">${breaker.label}</span>
        <span class="breaker-name">${breaker.name}</span>
        <span class="breaker-specs">${breaker.type} | ${breaker.ratedCurrent} | ${breaker.phase}</span>
    `;
    
    div.onclick = () => selectBreaker(breaker.label);
    return div;
}

// Select a circuit breaker to view its devices
function selectBreaker(label) {
    if (selectedBreaker === label) {
        selectedBreaker = null;
    } else {
        selectedBreaker = label;
    }
    
    updateBreakerUI();
    updateDevicesSection();
}

// Update breaker list UI
function updateBreakerUI() {
    const breakerList = document.getElementById('breakerList');
    breakerList.innerHTML = '';
    
    // Add breakers in order - top level first, then grouped
    const breakerOrder = ['Q1', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13'];
    for (const label of breakerOrder) {
        if (circuitBreakers[label]) {
            breakerList.appendChild(createBreakerItem(circuitBreakers[label]));
        }
    }
}

// Get all devices for a circuit (only direct feeds, not nested for this view)
function getDevicesForCircuit(breakerLabel) {
    const breaker = circuitBreakers[breakerLabel];
    if (!breaker || !breaker.feeds) return [];
    
    const result = [];
    for (const feedId of breaker.feeds) {
        if (devices[feedId]) {
            result.push(devices[feedId]);
        }
    }
    return result;
}

// Find which breaker feeds a device (directly or indirectly)
function findFeedingBreaker(deviceId) {
    for (const [breakerLabel, breaker] of Object.entries(circuitBreakers)) {
        if (breaker.feeds && breaker.feeds.includes(deviceId)) {
            return breakerLabel;
        }
    }
    return null;
}

// Get upstream chain for a device (path to Q1)
function getUpstreamChain(deviceId) {
    const chain = [];
    let currentId = deviceId;
    let visited = new Set();
    
    // Build chain from device up to Q1
    while (currentId && !visited.has(currentId) && chain.length < 20) {
        visited.add(currentId);
        
        const device = devices[currentId];
        
        if (device) {
            // Add device to chain
            chain.unshift({ 
                type: 'device', 
                id: currentId, 
                label: device.label || currentId,
                deviceType: device.type
            });
            
            // Follow upstream connection
            if (device.pluggedInto) {
                currentId = device.pluggedInto;
            } else if (device.controls && device.controls.length > 0) {
                // Switch controls something, but we want what controls the switch
                const breaker = findFeedingBreaker(currentId);
                if (breaker) {
                    currentId = breaker;
                } else {
                    break;
                }
            } else {
                // Find breaker that feeds this device
                const breaker = findFeedingBreaker(currentId);
                if (breaker) {
                    currentId = breaker;
                } else {
                    break;
                }
            }
        } else if (circuitBreakers[currentId]) {
            // This is a breaker
            chain.unshift({ 
                type: 'breaker', 
                id: currentId, 
                label: circuitBreakers[currentId].label,
                breakerType: circuitBreakers[currentId].type
            });
            
            // Follow upstream to parent breaker
            const parentBreaker = circuitBreakers[currentId];
            if (parentBreaker.downstream && parentBreaker.downstream.length > 0) {
                // Find which parent breaker has this as downstream
                for (const [parentLabel, parent] of Object.entries(circuitBreakers)) {
                    if (parent.downstream && parent.downstream.includes(currentId)) {
                        currentId = parentLabel;
                        break;
                    }
                }
            } else {
                // Try to find parent via reverse lookup
                let foundParent = false;
                for (const [parentLabel, parent] of Object.entries(circuitBreakers)) {
                    if (parent.feeds && parent.feeds.includes(currentId)) {
                        currentId = parentLabel;
                        foundParent = true;
                        break;
                    }
                }
                if (!foundParent) {
                    for (const [parentLabel, parent] of Object.entries(circuitBreakers)) {
                        if (parent.downstream && parent.downstream.includes(currentId)) {
                            currentId = parentLabel;
                            foundParent = true;
                            break;
                        }
                    }
                    if (!foundParent) {
                        if (currentId !== 'Q1') {
                            currentId = 'Q1';
                        } else {
                            break;
                        }
                    }
                }
            }
        } else {
            break;
        }
    }
    
    // Ensure Q1 is at the top
    if (!chain.some(item => item.id === 'Q1') && circuitBreakers['Q1']) {
        chain.unshift({ 
            type: 'breaker', 
            id: 'Q1', 
            label: 'Q1',
            breakerType: circuitBreakers['Q1'].type
        });
    }
    
    return chain;
}

// Get downstream tree for a device (everything it connects to)
function getDownstreamTree(deviceId, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return [];
    
    const device = devices[deviceId];
    if (!device) return [];
    
    const tree = [];
    
    // If it's a switch, add what it controls
    if (device.controls && device.controls.length > 0) {
        for (const controlledId of device.controls) {
            const controlledDevice = devices[controlledId];
            if (controlledDevice) {
                tree.push({
                    id: controlledId,
                    type: controlledDevice.type,
                    label: controlledDevice.label || controlledId,
                    relation: 'controls',
                    depth: depth + 1
                });
                // Recursively get downstream of controlled device
                const nested = getDownstreamTree(controlledId, depth + 1, maxDepth);
                tree.push(...nested);
            }
        }
    }
    
    // If it's an outlet, add what's plugged in
    if (device.pluggedIn && device.pluggedIn.length > 0) {
        for (const pluggedId of device.pluggedIn) {
            const pluggedDevice = devices[pluggedId];
            if (pluggedDevice) {
                tree.push({
                    id: pluggedId,
                    type: pluggedDevice.type,
                    label: pluggedDevice.label || pluggedId,
                    relation: 'plugged into',
                    depth: depth + 1
                });
                // Recursively get downstream of plugged device
                const nested = getDownstreamTree(pluggedId, depth + 1, maxDepth);
                tree.push(...nested);
            }
        }
    }
    
    // If it's a power strip, add what's plugged into it
    if (device.type === 'PowerStrip' && device.pluggedIn && device.pluggedIn.length > 0) {
        for (const pluggedId of device.pluggedIn) {
            const pluggedDevice = devices[pluggedId];
            if (pluggedDevice) {
                tree.push({
                    id: pluggedId,
                    type: pluggedDevice.type,
                    label: pluggedDevice.label || pluggedId,
                    relation: 'plugged into power strip',
                    depth: depth + 1
                });
                const nested = getDownstreamTree(pluggedId, depth + 1, maxDepth);
                tree.push(...nested);
            }
        }
    }
    
    // If it's a light with bulbs, add bulb details
    if (device.bulbs && device.bulbs.length > 0) {
        for (const bulb of device.bulbs) {
            tree.push({
                id: `${deviceId}-bulb-${bulb.type}`,
                type: 'Bulb',
                label: `${bulb.count}x ${bulb.product}`,
                relation: 'has bulb',
                depth: depth + 1,
                details: `${bulb.base} | ${bulb.technology} | ${bulb.power} | ${bulb.luminousFlux}lm | ${bulb.colorTemperature}`
            });
        }
    }
    
    // If it's a thermostat, add what it controls
    if (device.controls && device.controls.length > 0) {
        for (const controlledId of device.controls) {
            const controlledDevice = devices[controlledId];
            if (controlledDevice) {
                tree.push({
                    id: controlledId,
                    type: controlledDevice.type,
                    label: controlledDevice.label || controlledId,
                    relation: 'controls',
                    depth: depth + 1
                });
                const nested = getDownstreamTree(controlledId, depth + 1, maxDepth);
                tree.push(...nested);
            }
        }
    }
    
    return tree;
}

// Format a connection tree as text with indentation and IEC symbols
function formatTree(treeItems) {
    if (treeItems.length === 0) return 'None';
    
    const groupedByDepth = {};
    for (const item of treeItems) {
        const depth = item.depth || 0;
        if (!groupedByDepth[depth]) {
            groupedByDepth[depth] = [];
        }
        groupedByDepth[depth].push(item);
    }
    
    const maxDepth = Math.max(...Object.keys(groupedByDepth).map(Number));
    
    let result = '';
    for (let d = 1; d <= maxDepth; d++) {
        if (groupedByDepth[d]) {
            for (const item of groupedByDepth[d]) {
                const device = devices[item.id];
                const typeLabel = device ? device.type : item.type;
                const displayLabel = item.label || item.id;
                const details = item.details || '';
                const symbol = getSymbol(typeLabel);
                const indent = '  '.repeat(d - 1);
                const connector = '|--';
                result += `${indent}${connector} [${symbol}] ${displayLabel} (${typeLabel})${details ? ` - ${details}` : ''}\n`;
            }
        }
    }
    
    return result.trim();
}

// Format upstream chain as text with IEC symbols
function formatUpstreamChain(chain) {
    if (chain.length === 0) return 'Not connected';
    
    let result = '';
    for (let i = 0; i < chain.length; i++) {
        const item = chain[i];
        const arrow = i < chain.length - 1 ? ' --> ' : '';
        const symbol = getSymbol(item.type === 'breaker' ? item.breakerType : item.deviceType);
        const typeLabel = item.type === 'breaker' ? item.breakerType : item.deviceType;
        result += `[${symbol}] ${item.label} (${typeLabel})${arrow}`;
    }
    
    return result;
}

// Create device row
function createDeviceRow(device) {
    const div = document.createElement('div');
    div.className = 'device-row';
    
    const symbol = getSymbol(device.type);
    const symbolClass = getSymbolClass(device.type);
    const location = device.room || 'Unknown';
    
    // Power information
    let powerInfo = '';
    if (device.power && device.power !== '0 W') {
        powerInfo = `<span class="device-power">| ${device.power}</span>`;
    } else if (device.connectedLoad) {
        powerInfo = `<span class="device-power">| Connected Load: ${device.connectedLoad}</span>`;
    }
    
    // Get device specs (socket count, bulb count)
    const deviceSpecs = getDeviceSpecs(device);
    
    // Socket/phase tags
    let tags = '';
    if (device.phases && device.phases > 1) {
        tags += `<span class="connector-tag">${device.phases}-phase</span>`;
    }
    if (device.lengthM) {
        tags += `<span class="type-tag">${device.lengthM}m</span>`;
    }
    if (device.isWaterproof) {
        tags += `<span class="type-tag">Waterproof</span>`;
    }
    if (device.hasDataSocket) {
        tags += `<span class="type-tag">+Data</span>`;
    }
    
    // Get upstream chain
    const upstreamChain = getUpstreamChain(device.id);
    
    // Get downstream tree
    const downstreamTree = getDownstreamTree(device.id);
    
    div.innerHTML = `
        <span class="device-icon ${symbolClass}">${symbol}</span>
        <div class="device-info">
            <div class="device-title">
                ${device.label || device.id}${deviceSpecs}
                ${tags}
                ${powerInfo}
            </div>
            <div class="device-meta">${location} | ${device.name || device.product || ''}</div>
            <div class="connections">
                <div class="connection-section">
                    <div class="connection-title">Upstream Chain:</div>
                    <div class="tree">${formatUpstreamChain(upstreamChain)}</div>
                </div>
                ${downstreamTree.length > 0 ? `
                <div class="connection-section">
                    <div class="connection-title">Downstream Elements:</div>
                    <div class="tree">${formatTree(downstreamTree)}</div>
                </div>
                ` : ''}
                ${device.note ? `
                <div class="connection-section">
                    <div class="connection-title">Note:</div>
                    <div class="tree">${device.note}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    return div;
}

// Update devices section to show devices for selected breaker
function updateDevicesSection() {
    const devicesSection = document.getElementById('devicesSection');
    const emptyState = document.getElementById('emptyState');
    
    if (!selectedBreaker) {
        devicesSection.innerHTML = '';
        devicesSection.appendChild(emptyState);
        return;
    }
    
    const breaker = circuitBreakers[selectedBreaker];
    if (!breaker) {
        devicesSection.innerHTML = '';
        devicesSection.appendChild(emptyState);
        return;
    }
    
    const allDevices = getDevicesForCircuit(selectedBreaker);
    
    if (allDevices.length === 0) {
        emptyState.textContent = `Circuit breaker ${selectedBreaker} has no connected devices.`;
        devicesSection.innerHTML = '';
        devicesSection.appendChild(emptyState);
        return;
    }
    
    devicesSection.innerHTML = '';
    
    // Add circuit header
    const header = document.createElement('div');
    header.className = 'device-row';
    header.style.background = '#e8f4fc';
    header.style.borderColor = '#3498db';
    header.style.fontWeight = 'bold';
    
    const breakerSymbol = getSymbol(breaker.type, breaker.type);
    const breakerSymbolClass = getSymbolClass(breaker.type, breaker.type);
    
    header.innerHTML = `
        <span class="device-icon ${breakerSymbolClass}">${breakerSymbol}</span>
        <div class="device-info">
            <div class="device-title">
                ${breaker.label}: ${breaker.name}
            </div>
            <div class="device-meta">${breaker.type} | ${breaker.ratedCurrent} | ${breaker.phase} | ${breaker.product}</div>
            <div class="device-meta">${allDevices.length} direct connections</div>
        </div>
    `;
    devicesSection.appendChild(header);
    
    // Add each device as a row
    for (let i = 0; i < allDevices.length; i++) {
        const device = allDevices[i];
        const deviceRow = createDeviceRow(device);
        if (i % 2 === 1) {
            deviceRow.classList.add('odd');
        }
        devicesSection.appendChild(deviceRow);
    }
}

// Render spare bulbs section
function renderSpareBulbs() {
    const section = document.getElementById('spareBulbsSection');
    let html = '<div class="spare-bulbs-section"><div class="spare-bulbs-title">Available Spare Bulbs:</div><div class="bulb-grid">';
    
    for (const bulb of spareBulbs) {
        html += `
            <div class="bulb-item">
                <strong>${bulb.count}x ${bulb.product}</strong><br/>
                Base: ${bulb.base}, <span class="bulb-technology ${bulb.technology}">${bulb.technology}</span><br/>
                ${bulb.power}, ${bulb.luminousFlux}lm, ${bulb.colorTemperature}
            </div>
        `;
    }
    
    html += '</div></div>';
    section.innerHTML = html;
}

// Initialize the page
function init() {
    updateBreakerUI();
    updateDevicesSection();
    renderSpareBulbs();
    
    // Display data timestamp
    updateDataTimestamp();
    
    // Start auto-refresh checking
    startAutoRefresh();
    
    // Get initial timestamp for change detection
    fetch('visualizer-data.js')
        .then(response => {
            dataFileTimestamp = response.headers.get('Last-Modified');
        })
        .catch(error => {
            console.log('Could not get initial timestamp:', error.message);
        });
}

// Update the data timestamp display
function updateDataTimestamp() {
    const timestampEl = document.getElementById('dataTimestamp');
    const autoRefreshEl = document.getElementById('autoRefreshStatus');
    
    if (timestampEl) {
        // Try to get the timestamp from the data file comment
        const timestampComment = Array.from(document.scripts)
            .find(s => s.src.includes('visualizer-data.js'))?.textContent
            ?.match(/\/\/ Generated: ([^\n]+)/)?.[1];
        
        if (timestampComment) {
            timestampEl.textContent = new Date(timestampComment).toLocaleString();
        } else {
            timestampEl.textContent = 'Unknown';
        }
    }
    
    if (autoRefreshEl) {
        autoRefreshEl.textContent = refreshInterval ? 'Active' : 'Inactive';
        autoRefreshEl.style.color = refreshInterval ? '#2ecc71' : '#e74c3c';
    }
}

// Make functions available globally
window.selectBreaker = selectBreaker;
window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
