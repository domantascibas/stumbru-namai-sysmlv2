#!/usr/bin/env node

/**
 * SysML to Visualizer Data Generator
 * 
 * Parses Panel.sysml and Rooms.sysml to generate visualizer-data.js
 * 
 * Usage:
 *   node generate-visualizer-data.js          - Generate once
 *   node generate-visualizer-data.js --watch  - Auto-regenerate on file changes
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const WATCH_MODE = args.includes('--watch') || args.includes('-w');

const PANEL_FILE = path.join(__dirname, 'model', 'Panel.sysml');
const ROOMS_FILE = path.join(__dirname, 'model', 'Rooms.sysml');
const OUTPUT_FILE = path.join(__dirname, 'visualizer-data.js');

let fileMtimes = {};

// Bulb data definitions
const BULB_SPECIFICATIONS = {
    'OsramE27LedFilamentGlobe5W': { product: 'OSRAM LED filament globe', base: 'E27', tech: 'led', power: '4.8W', lumen: 400, temp: '2200K' },
    'PhilipsE27Led13W': { product: 'Philips LED A60', base: 'E27', tech: 'led', power: '13W', lumen: 1521, temp: '2700K' },
    'OsramE27Led8W': { product: 'OSRAM LED STAR CLASSIC A60', base: 'E27', tech: 'led', power: '8W', lumen: 806, temp: '2700K' },
    'OkkoG9Led4W': { product: 'OKKO TP-G9 LED', base: 'G9', tech: 'led', power: '4W', lumen: 300, temp: '3000K' },
    'OsramG9Halogen33W': { product: 'OSRAM HALOPIN G9', base: 'G9', tech: 'halogen', power: '33W', lumen: 460, temp: '2700K' },
    'LedvanceGu10Led4W': { product: 'LEDVANCE LED GU10', base: 'GU10', tech: 'led', power: '4.3W', lumen: 350, temp: '2700K' },
    'CozyHomeE14LedFilament4W': { product: 'Cozy Home C35F7-CL-D', base: 'E14', tech: 'led', power: '4.2W', lumen: 470, temp: '2700K' },
    'LedvanceGu53Led8W': { product: 'LEDVANCE LED MR16 GU5.3', base: 'GU5.3', tech: 'led', power: '8W', lumen: 621, temp: '2700K' },
    'StandartGu53Led4W': { product: 'Standart LED MR16 GU5.3', base: 'GU5.3', tech: 'led', power: '4.5W', lumen: 345, temp: '2700K' },
    'VagnerE27Halogen28W': { product: 'Vagner SDH halogen E27', base: 'E27', tech: 'halogen', power: '28W', lumen: 375, temp: '2800K' }
};

// IEC/ISO device type icons
const DEVICE_ICONS = {
    'CircuitBreaker': 'CB',
    'Rcd': 'RCD',
    'MainSwitch': 'Q',
    'Outlet': 'R',
    'Light': 'LAMP',
    'Switch': 'S',
    'FixedAppliance': 'FIX',
    'PluggedAppliance': 'APP',
    'PowerStrip': 'PS',
    'CableEnd': 'X',
    'Thermostat': 'T'
};

async function main() {
    console.log('SysML Visualizer Data Generator');
    console.log('================================\n');

    if (WATCH_MODE) {
        console.log('Running in watch mode... (Press Ctrl+C to stop)\n');
        setupWatch();
    } else {
        generateData();
    }
}

function generateData() {
    try {
        console.log('Reading Panel.sysml...');
        const panelContent = fs.readFileSync(PANEL_FILE, 'utf8');
        
        console.log('Reading Rooms.sysml...');
        const roomsContent = fs.readFileSync(ROOMS_FILE, 'utf8');
        
        console.log('Parsing circuit breakers...');
        const { circuitBreakers, feedsMap } = parsePanel(panelContent);
        
        console.log('Parsing devices...');
        const devices = parseRooms(roomsContent);
        
        console.log('Building connections...');
        buildConnections(devices);
        
        console.log('Resolving circuit assignments...');
        const devicesByBreaker = assignDevicesToBreakers(circuitBreakers, feedsMap, devices);
        
        console.log('Generating visualizer-data.js...');
        const output = generateOutput(circuitBreakers, devices, devicesByBreaker);
        
        fs.writeFileSync(OUTPUT_FILE, output);
        console.log(`✓ Generated ${OUTPUT_FILE}`);
        console.log(`  ${Object.keys(circuitBreakers).length} circuit breakers`);
        console.log(`  ${Object.keys(devices).length} devices`);
        console.log(`  ${Object.keys(devicesByBreaker).length} circuits with devices\n`);
        
        return true;
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        return false;
    }
}

function parsePanel(content) {
    const circuitBreakers = {};
    const feedsMap = {}; // breakerId -> list of device references
    
    // Parse the panel file which has hierarchical structure
    // Q1 contains F1, F1 contains F2-F13
    // We need to extract all parts recursively
    
    // First, extract the panel part content
    const panelMatch = content.match(/part\s+panel\s*:\s*DistributionBoard\s*\{([\s\S]*?)\n\s*\}/i);
    if (!panelMatch) {
        throw new Error('Could not find panel part in Panel.sysml');
    }
    
    const panelContent = panelMatch[1];
    
    // Parse all breakers recursively from panel content
    parseBreakersRecursive(panelContent, circuitBreakers, feedsMap, []);
    
    return { circuitBreakers, feedsMap };
}

function parseBreakersRecursive(content, circuitBreakers, feedsMap, path) {
    // Match all part definitions with their type and content
    const partRegex = /part\s+(\w+)\s*:\s*(CircuitBreaker|Rcd|MainSwitch)\s*\{([\s\S]*?)\n\s*\}/g;
    
    let match;
    while ((match = partRegex.exec(content)) !== null) {
        const [fullMatch, id, type, innerContent] = match;
        const fullId = [...path, id].join('.');
        
        const labelMatch = innerContent.match(/:\>>\s*label\s*=\s*"([^"]+)"/);
        const nameMatch = innerContent.match(/:\>>\s*name\s*=\s*"([^"]+)"/);
        const productMatch = innerContent.match(/:\>>\s*product\s*=\s*"([^"]+)"/);
        const ratedCurrentMatch = innerContent.match(/:\>>\s*ratedCurrent\s*=\s*([\d.]+)\s*\[SI::A\]/);
        const polesMatch = innerContent.match(/:\>>\s*poles\s*=\s*(\d+)/);
        const phaseMatch = innerContent.match(/:\>>\s*phase\s*=\s*Phase::(\w+[-\w]*)/);
        const tripCurveMatch = innerContent.match(/:\>>\s*tripCurve\s*=\s*TripCurve::(\w+)/);
        const breakingCapacityMatch = innerContent.match(/:\>>\s*breakingCapacity\s*=\s*([\d.]+)\s*\[SI::A\]/);
        const residualCurrentMatch = innerContent.match(/:\>>\s*residualCurrent\s*=\s*([\d.]+)\s*\[SI::A\]/);
        const rcdTypeMatch = innerContent.match(/:\>>\s*rcdType\s*=\s*RcdType::(\w+)/);
        
        const feedsMatch = innerContent.match(/ref\s*:>>\s*feeds\s*=\s*\(([^)]+)\)|ref\s*:>>\s*feeds\s*=\s*([^;\n]+)/);
        const downstreamMatch = innerContent.match(/ref\s*:>>\s*downstream\s*=\s*([^;\n]+)/);
        
        const breaker = {
            id: fullId,
            label: labelMatch?.[1] || id,
            name: nameMatch?.[1] || '',
            type: type === 'MainSwitch' ? 'Main Switch' : type === 'Rcd' ? 'RCD' : 'Circuit Breaker',
            product: productMatch?.[1] || '',
            ratedCurrent: ratedCurrentMatch ? `${ratedCurrentMatch[1]} A` : '',
            poles: polesMatch ? parseInt(polesMatch[1]) : (type === 'MainSwitch' ? 3 : 1),
            phase: phaseMatch?.[1] || '',
            tripCurve: tripCurveMatch?.[1] || '',
            breakingCapacity: breakingCapacityMatch ? `${breakingCapacityMatch[1]} A` : '',
            residualCurrent: residualCurrentMatch ? `${residualCurrentMatch[1]} A` : '',
            rcdType: rcdTypeMatch?.[1] || '',
            icon: type === 'MainSwitch' ? 'Q' : type === 'Rcd' ? 'RCD' : 'CB',
            feeds: feedsMatch ? parseReferenceList(feedsMatch[1] || feedsMatch[2] || '') : [],
            downstream: downstreamMatch ? parseReferenceList(downstreamMatch[1] || '') : []
        };
        
        circuitBreakers[fullId] = breaker;
        circuitBreakers[id] = breaker; // Also store with simple ID for backward compatibility
        
        if (feedsMatch) {
            const feedsList = parseReferenceList(feedsMatch[1] || feedsMatch[2] || '');
            if (feedsList.length > 0) {
                feedsMap[fullId] = feedsList;
                feedsMap[id] = feedsList; // Store with both keys
            }
        }
        
        // Recursively parse nested parts
        const nestedPath = [...path, id];
        parseBreakersRecursive(innerContent, circuitBreakers, feedsMap, nestedPath);
    }
}

function parseRooms(content) {
    const devices = {};
    
    // Extract apartment content
    const apartmentMatch = content.match(/part\s+apartment\s*\{([\s\S]*?)\n\s*\}/i);
    if (!apartmentMatch) {
        throw new Error('Could not find apartment part in Rooms.sysml');
    }
    
    const apartmentContent = apartmentMatch[1];
    
    // Extract all room parts
    const roomPattern = /part\s+(\w+)\s*:\s*Room\s*\{([\s\S]*?)\n\s*\}/g;
    const rooms = {};
    let roomMatch;
    
    while ((roomMatch = roomPattern.exec(apartmentContent)) !== null) {
        const roomName = roomMatch[1];
        const roomContent = roomMatch[2];
        rooms[roomName] = roomContent;
    }
    
    // Parse devices from each room
    for (const [roomName, roomContent] of Object.entries(rooms)) {
        parseRoomDevices(roomName, roomContent, devices);
    }
    
    // Parse apartment-level devices
    parseRoomDevices('apartment', apartmentContent, devices);
    
    return devices;
}

function parseRoomDevices(roomName, content, devices) {
    const devicePatterns = [
        { type: 'Outlet', regex: /part\s+(\w+)\s*:\s*Outlet\s*\{/g },
        { type: 'Light', regex: /part\s+(\w+)\s*:\s*Light\s*\{/g },
        { type: 'Switch', regex: /part\s+(\w+)\s*:\s*Switch\s*\{/g },
        { type: 'FixedAppliance', regex: /part\s+(\w+)\s*:\s*FixedAppliance\s*\{/g },
        { type: 'PluggedAppliance', regex: /part\s+(\w+)\s*:\s*PluggedAppliance\s*\{/g },
        { type: 'PowerStrip', regex: /part\s+(\w+)\s*:\s*PowerStrip\s*\{/g },
        { type: 'CableEnd', regex: /part\s+(\w+)\s*:\s*CableEnd\s*\{/g },
        { type: 'Thermostat', regex: /part\s+(\w+)\s*:\s*Thermostat\s*\{/g }
    ];
    
    for (const pattern of devicePatterns) {
        let match;
        while ((match = pattern.regex.exec(content)) !== null) {
            const deviceId = match[1];
            const fullId = roomName === 'apartment' ? deviceId : `${roomName}.${deviceId}`;
            
            // Find the end of this device block
            const startIdx = match.index;
            let braceCount = 0;
            let endIdx = startIdx;
            let inBlock = false;
            
            for (let i = startIdx; i < content.length; i++) {
                if (content[i] === '{') {
                    braceCount++;
                    inBlock = true;
                }
                if (content[i] === '}') {
                    braceCount--;
                    if (inBlock && braceCount === 0) {
                        endIdx = i + 1;
                        break;
                    }
                }
            }
            
            const deviceBlock = content.slice(startIdx, endIdx);
            const device = parseDeviceBlock(deviceBlock, pattern.type, fullId, roomName);
            
            if (device) {
                devices[fullId] = device;
            }
        }
    }
}

function parseDeviceBlock(content, type, id, roomName) {
    const device = {
        id,
        type,
        room: roomName === 'apartment' ? '' : roomName,
        icon: DEVICE_ICONS[type] || '?',
        label: '',
        name: '',
        product: '',
        power: '',
        connectedLoad: null,
        socketCount: type === 'Outlet' ? 1 : null,
        bulbSocketCount: type === 'Light' ? 0 : null,
        phases: null,
        lengthM: null,
        isWaterproof: false,
        hasDataSocket: false,
        switchType: null,
        pluggedIn: [],
        pluggedInto: null,
        controls: [],
        bulbs: []
    };
    
    // Extract properties
    const labelMatch = content.match(/:\>>\s*label\s*=\s*"([^"]+)"/);
    const nameMatch = content.match(/:\>>\s*name\s*=\s*"([^"]+)"/);
    const productMatch = content.match(/:\>>\s*product\s*=\s*"([^"]+)"/);
    const powerMatch = content.match(/:\>>\s*power\s*=\s*([\d.]+)\s*\[SI::W\]/);
    const connectedLoadMatch = content.match(/\s*:>>\s*connectedLoad\s*=\s*([^;\n]+)/);
    const socketCountMatch = content.match(/:\>>\s*socketCount\s*=\s*(\d+)/);
    const phasesMatch = content.match(/:\>>\s*phases\s*=\s*(\d+)/);
    const bulbSocketCountMatch = content.match(/:\>>\s*bulbSocketCount\s*=\s*(\d+)/);
    const lengthMMatch = content.match(/:\>>\s*lengthM\s*=\s*([\d.]+)/);
    const isWaterproofMatch = content.match(/:\>>\s*isWaterproof\s*=\s*(true|false)/);
    const hasDataSocketMatch = content.match(/:\>>\s*hasDataSocket\s*=\s*(true|false)/);
    const switchTypeMatch = content.match(/:\>>\s*switchType\s*=\s*SwitchType::(\w+)/);
    
    // Extract doc comment for note
    const docMatch = content.match(/doc\s*\/\*\s*([\s\S]*?)\s*\*\//);
    const commentMatch = content.match(/comment\s*\/\*\s*([\s\S]*?)\s*\*\//);
    
    // Extract relations
    const pluggedInMatch = content.match(/ref\s*:>>\s*pluggedIn\s*=\s*\(([^)]+)\)|ref\s*:>>\s*pluggedIn\s*=\s*([^;\n]+)/);
    const pluggedIntoMatch = content.match(/pluggedInto\s*=\s*'([^']+)'/);
    const controlsMatch = content.match(/ref\s*:>>\s*controls\s*=\s*\(([^)]+)\)|ref\s*:>>\s*controls\s*=\s*([^;\n]+)/);
    
    // Parse bulbs
    const bulbRegex = /part\s+(\w+)\s*:\s*(\w+)\[(\d+)\]\s*:>\s*bulbs/g;
    let bulbMatch;
    while ((bulbMatch = bulbRegex.exec(content)) !== null) {
        const count = parseInt(bulbMatch[3]);
        const bulbType = bulbMatch[2];
        const spec = BULB_SPECIFICATIONS[bulbType];
        
        if (spec) {
            device.bulbs.push({
                type: bulbType,
                product: spec.product,
                base: spec.base,
                technology: spec.tech,
                power: spec.power,
                luminousFlux: spec.lumen,
                colorTemperature: spec.temp,
                count
            });
        } else {
            device.bulbs.push({
                type: bulbType,
                product: bulbType,
                base: 'Unknown',
                technology: 'unknown',
                power: 'Unknown',
                luminousFlux: 0,
                colorTemperature: 'Unknown',
                count
            });
        }
    }
    
    // Set properties
    if (labelMatch) device.label = labelMatch[1];
    if (nameMatch) device.name = nameMatch[1];
    if (productMatch) device.product = productMatch[1];
    if (powerMatch) device.power = `${powerMatch[1]} W`;
    if (connectedLoadMatch) device.connectedLoad = connectedLoadMatch[1];
    if (socketCountMatch) device.socketCount = parseInt(socketCountMatch[1]);
    if (phasesMatch) device.phases = parseInt(phasesMatch[1]);
    if (bulbSocketCountMatch) device.bulbSocketCount = parseInt(bulbSocketCountMatch[1]);
    if (lengthMMatch) device.lengthM = parseFloat(lengthMMatch[1]);
    if (isWaterproofMatch) device.isWaterproof = isWaterproofMatch[1] === 'true';
    if (hasDataSocketMatch) device.hasDataSocket = hasDataSocketMatch[1] === 'true';
    if (switchTypeMatch) device.switchType = switchTypeMatch[1];
    
    // Set note from doc or comment
    if (docMatch) {
        device.note = docMatch[1].trim().replace(/[\*\/]/g, '').replace(/\s+/g, ' ');
    } else if (commentMatch) {
        device.note = commentMatch[1].trim().replace(/[\*\/]/g, '').replace(/\s+/g, ' ');
    }
    
    // Set defaults
    if (!device.label && device.id) device.label = device.id;
    if (!device.name) device.name = '';
    if (device.socketCount === null && type === 'Outlet') device.socketCount = 1;
    if (device.bulbSocketCount === null && type === 'Light') device.bulbSocketCount = 0;
    
    // Parse relations
    if (pluggedInMatch) {
        device.pluggedIn = parseReferenceList(pluggedInMatch[1] || pluggedInMatch[2] || '');
    }
    if (pluggedIntoMatch) {
        device.pluggedInto = pluggedIntoMatch[1];
    }
    if (controlsMatch) {
        device.controls = parseReferenceList(controlsMatch[1] || controlsMatch[2] || '');
    }
    
    return device;
}

function buildConnections(devices) {
    // Build pluggedInto relationships based on pluggedIn
    for (const [id, device] of Object.entries(devices)) {
        for (const pluggedId of device.pluggedIn) {
            const pluggedDevice = devices[pluggedId];
            if (pluggedDevice) {
                pluggedDevice.pluggedInto = id;
            }
        }
    }
    
    // Build controlledBy relationships based on controls
    for (const [id, device] of Object.entries(devices)) {
        if (device.controls && device.controls.length > 0) {
            for (const controlledId of device.controls) {
                const controlledDevice = devices[controlledId];
                if (controlledDevice) {
                    if (!controlledDevice.controlledBy) {
                        controlledDevice.controlledBy = [];
                    }
                    controlledDevice.controlledBy.push(id);
                }
            }
        }
    }
}

function assignDevicesToBreakers(circuitBreakers, feedsMap, devices) {
    const devicesByBreaker = {};
    
    // For each breaker, find all devices it feeds
    for (const [breakerId, breaker] of Object.entries(circuitBreakers)) {
        const fedDevices = [];
        const feeds = feedsMap[breakerId] || [];
        
        for (const feedRef of feeds) {
            // feedRef is like "apartment.livingKitchen.R1" or "apartment.livingKitchen.hob"
            const device = devices[feedRef];
            if (device) {
                fedDevices.push(device);
            } else {
                console.warn(`Warning: Feed reference not found: ${feedRef}`);
            }
        }
        
        if (fedDevices.length > 0) {
            devicesByBreaker[breakerId] = fedDevices;
        }
    }
    
    return devicesByBreaker;
}

function parseReferenceList(listStr) {
    if (!listStr) return [];
    // Handle lists like "item1, item2, item3" or "(item1, item2, item3)"
    const cleaned = listStr.replace(/[()]/g, '');
    return cleaned.split(',').map(s => s.trim()).filter(s => s && !s.startsWith('//'));
}

function getUpstreamChain(device, devices, circuitBreakers, feedsMap) {
    // Build the upstream chain from device to Q1
    const chain = [];
    let current = device;
    const visited = new Set();
    
    // First, find the breaker that feeds this device
    let currentBreaker = null;
    
    for (const [breakerId, feeds] of Object.entries(feedsMap)) {
        if (feeds.some(f => f === device.id)) {
            currentBreaker = circuitBreakers[breakerId];
            break;
        }
    }
    
    // If device is plugged into something, follow that chain
    if (!currentBreaker && device.pluggedInto) {
        let outlet = devices[device.pluggedInto];
        while (outlet) {
            chain.unshift({ type: 'device', id: outlet.id, label: outlet.label, icon: outlet.icon });
            
            // Find breaker for this outlet
            for (const [breakerId, feeds] of Object.entries(feedsMap)) {
                if (feeds.some(f => f === outlet.id)) {
                    currentBreaker = circuitBreakers[breakerId];
                    break;
                }
            }
            
            if (currentBreaker) break;
            
            if (outlet.pluggedInto) {
                outlet = devices[outlet.pluggedInto];
            } else {
                outlet = null;
            }
        }
    }
    
    // Now trace breakers up to Q1
    if (currentBreaker) {
        chain.unshift({ type: 'breaker', id: currentBreaker.id, label: currentBreaker.label, icon: currentBreaker.icon });
        
        // Find parent breaker (for nested breakers like F2-F13 which are under F1 which is under Q1)
        let parentId = null;
        for (const [bid, breaker] of Object.entries(circuitBreakers)) {
            if (breaker.downstream.some(d => d === currentBreaker.id)) {
                parentId = bid;
                break;
            }
        }
        
        if (parentId) {
            const parentBreaker = circuitBreakers[parentId];
            chain.unshift({ type: 'breaker', id: parentId, label: parentBreaker.label, icon: parentBreaker.icon });
            
            // Find parent of parent (Q1 -> F1 -> F2)
            for (const [bid, breaker] of Object.entries(circuitBreakers)) {
                if (breaker.downstream.some(d => d === parentId)) {
                    const grandparent = circuitBreakers[bid];
                    chain.unshift({ type: 'breaker', id: bid, label: grandparent.label, icon: grandparent.icon });
                    break;
                }
            }
        }
    }
    
    return chain;
}

function getDownstreamTree(device, devices, depth = 0, maxDepth = 10) {
    if (depth >= maxDepth) return [];
    
    const children = [];
    
    // If this is an outlet, find pluggedIn devices
    if (device.type === 'Outlet' && device.pluggedIn && device.pluggedIn.length > 0) {
        for (const pluggedId of device.pluggedIn) {
            const pluggedDevice = devices[pluggedId];
            if (pluggedDevice) {
                const plugChildren = getDownstreamTree(pluggedDevice, devices, depth + 1, maxDepth);
                children.push({
                    id: pluggedDevice.id,
                    label: pluggedDevice.label,
                    type: pluggedDevice.type,
                    icon: pluggedDevice.icon,
                    socketCount: pluggedDevice.socketCount,
                    bulbSocketCount: pluggedDevice.bulbSocketCount,
                    product: pluggedDevice.product,
                    power: pluggedDevice.power,
                    bulbs: pluggedDevice.bulbs,
                    children: plugChildren
                });
            }
        }
    }
    
    // If this is a power strip, find its pluggedIn devices
    if (device.type === 'PowerStrip' && device.pluggedIn && device.pluggedIn.length > 0) {
        for (const pluggedId of device.pluggedIn) {
            const pluggedDevice = devices[pluggedId];
            if (pluggedDevice) {
                const plugChildren = getDownstreamTree(pluggedDevice, devices, depth + 1, maxDepth);
                children.push({
                    id: pluggedDevice.id,
                    label: pluggedDevice.label,
                    type: pluggedDevice.type,
                    icon: pluggedDevice.icon,
                    socketCount: pluggedDevice.socketCount,
                    bulbSocketCount: pluggedDevice.bulbSocketCount,
                    product: pluggedDevice.product,
                    power: pluggedDevice.power,
                    bulbs: pluggedDevice.bulbs,
                    children: plugChildren
                });
            }
        }
    }
    
    // If this is a light with controls, show the switches
    // (But we don't want circular references)
    
    return children;
}

function generateOutput(circuitBreakers, devices, devicesByBreaker) {
    let output = `// Auto-generated from SysML model files\n`;
    output += `// Generated: ${new Date().toISOString()}\n\n`;
    
    // Circuit Breakers
    output += `const circuitBreakers = {\n`;
    
    const breakerOrder = ['Q1', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13'];
    for (const id of breakerOrder) {
        const breaker = circuitBreakers[id];
        if (breaker) {
            output += `    ${id}: {\n`;
            output += `        label: '${breaker.label}',\n`;
            output += `        name: '${breaker.name}',\n`;
            output += `        type: '${breaker.type}',\n`;
            output += `        icon: '${breaker.icon}',\n`;
            output += `        product: '${breaker.product}',\n`;
            output += `        ratedCurrent: '${breaker.ratedCurrent}',\n`;
            output += `        poles: ${breaker.poles},\n`;
            output += `        phase: '${breaker.phase}',\n`;
            
            if (breaker.type === 'Circuit Breaker') {
                output += `        tripCurve: '${breaker.tripCurve}',\n`;
                output += `        breakingCapacity: '${breaker.breakingCapacity}',\n`;
            }
            
            if (breaker.type === 'RCD') {
                output += `        residualCurrent: '${breaker.residualCurrent}',\n`;
                output += `        rcdType: '${breaker.rcdType}',\n`;
            }
            
            output += `        feeds: ${JSON.stringify(devicesByBreaker[id]?.map(d => d.id) || [])}\n`;
            output += `    },\n`;
        }
    }
    
    output += `};\n\n`;
    
    // Devices
    output += `const devices = {\n`;
    
    const sortedDeviceIds = Object.keys(devices).sort();
    for (const id of sortedDeviceIds) {
        const device = devices[id];
        output += `    '${id}': {\n`;
        output += `        id: '${id}',\n`;
        output += `        type: '${device.type}',\n`;
        output += `        room: '${device.room}',\n`;
        output += `        icon: '${device.icon}',\n`;
        if (device.label) output += `        label: '${device.label}',\n`;
        if (device.name) output += `        name: '${device.name}',\n`;
        if (device.product) output += `        product: '${device.product}',\n`;
        if (device.power) output += `        power: '${device.power}',\n`;
        if (device.connectedLoad) output += `        connectedLoad: '${device.connectedLoad}',\n`;
        if (device.socketCount !== null) output += `        socketCount: ${device.socketCount},\n`;
        if (device.bulbSocketCount !== null) output += `        bulbSocketCount: ${device.bulbSocketCount},\n`;
        if (device.phases !== null) output += `        phases: ${device.phases},\n`;
        if (device.lengthM !== null) output += `        lengthM: ${device.lengthM},\n`;
        if (device.isWaterproof) output += `        isWaterproof: true,\n`;
        if (device.hasDataSocket) output += `        hasDataSocket: true,\n`;
        if (device.switchType) output += `        switchType: '${device.switchType}',\n`;
        
        if (device.pluggedIn.length > 0) {
            output += `        pluggedIn: [${device.pluggedIn.map(p => `'${p}'`).join(', ')}],\n`;
        }
        if (device.pluggedInto) {
            output += `        pluggedInto: '${device.pluggedInto}',\n`;
        }
        if (device.controls.length > 0) {
            output += `        controls: [${device.controls.map(c => `'${c}'`).join(', ')}],\n`;
        }
        if (device.controlledBy && device.controlledBy.length > 0) {
            output += `        controlledBy: [${device.controlledBy.map(c => `'${c}'`).join(', ')}],\n`;
        }
        if (device.bulbs.length > 0) {
            output += `        bulbs: [\n`;
            for (const bulb of device.bulbs) {
                output += `            { type: '${bulb.type}', product: '${bulb.product}', base: '${bulb.base}', technology: '${bulb.technology}', power: '${bulb.power}', luminousFlux: ${bulb.luminousFlux}, colorTemperature: '${bulb.colorTemperature}', count: ${bulb.count} },\n`;
            }
            output += `        ],\n`;
        }
        
        output += `    },\n`;
    }
    
    output += `};\n\n`;
    
    return output;
}

function setupWatch() {
    const filesToWatch = [PANEL_FILE, ROOMS_FILE];
    
    // Initial generation
    generateData();
    
    // Record initial modification times
    for (const file of filesToWatch) {
        try {
            const stats = fs.statSync(file);
            fileMtimes[file] = stats.mtimeMs;
        } catch (error) {
            console.warn(`Warning: ${file} not found`);
        }
    }
    
    // Check files every 2 seconds
    const checkInterval = 2000;
    
    const checkFiles = () => {
        let changed = false;
        
        for (const file of filesToWatch) {
            try {
                const stats = fs.statSync(file);
                const mtime = stats.mtimeMs;
                
                if (!fileMtimes[file] || fileMtimes[file] !== mtime) {
                    fileMtimes[file] = mtime;
                    changed = true;
                    console.log(`Change detected in ${path.basename(file)}`);
                }
            } catch (error) {
                // File might not exist
            }
        }
        
        if (changed) {
            console.log('Regenerating...\n');
            generateData();
        }
    };
    
    setInterval(checkFiles, checkInterval);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
