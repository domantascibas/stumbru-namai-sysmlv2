// Model Data - Extracted from Panel.sysml and Rooms.sysml

// Circuit Breakers definition
const circuitBreakers = {
    Q1: {
        label: 'Q1',
        name: 'Įvadas',
        type: 'Main Switch',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '25 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 3,
        phase: '3-phase',
        downstream: ['F1']
    },
    F1: {
        label: 'F1',
        name: 'Nuotėkio relė 30 mA',
        type: 'RCD',
        product: 'ETI EFI-4',
        ratedCurrent: '25 A',
        residualCurrent: '0.03 A',
        rcdType: 'AC',
        poles: 4,
        phase: '3-phase',
        downstream: ['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13']
    },
    F2: {
        label: 'F2',
        name: 'Vaikų k. ir koridoriaus rozetės',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '16 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L1',
        feeds: [
            'apartment.kidsRoom.R1',
            'apartment.kidsRoom.R2',
            'apartment.kidsRoom.R3',
            'apartment.kidsRoom.R4',
            'apartment.kidsRoom.R5',
            'apartment.kidsRoom.L2',
            'apartment.hallway.R1',
            'apartment.hallway.R2'
        ]
    },
    F3: {
        label: 'F3',
        name: 'Miegamojo ir svetainės rozetės',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '16 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L1',
        feeds: [
            'apartment.bedroom.R1',
            'apartment.bedroom.R2',
            'apartment.bedroom.R3',
            'apartment.bedroom.R4',
            'apartment.bedroom.L2',
            'apartment.bedroom.L3',
            'apartment.livingKitchen.R7',
            'apartment.livingKitchen.R8',
            'apartment.livingKitchen.R9',
            'apartment.livingKitchen.R10',
            'apartment.livingKitchen.R11'
        ]
    },
    F4: {
        label: 'F4',
        name: 'Vonia: veidrodis',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 10',
        ratedCurrent: '10 A',
        tripCurve: 'B',
        breakingCapacity: '10000 A',
        poles: 1,
        phase: 'L3',
        feeds: [
            'apartment.bathroom.L2',
            'apartment.bathroom.R2'
        ]
    },
    F5: {
        label: 'F5',
        name: 'Vonia: gyvatukas',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '16 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L3',
        feeds: ['apartment.bathroom.towelRail']
    },
    F6: {
        label: 'F6',
        name: 'Vonia: grindų šildymas',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '16 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L3',
        feeds: ['apartment.bathroom.floorHeating']
    },
    F7: {
        label: 'F7',
        name: 'Kaitlentė ir orkaitė',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '16 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 3,
        phase: '3-phase',
        feeds: [
            'apartment.livingKitchen.hob',
            'apartment.livingKitchen.R4'
        ]
    },
    F8: {
        label: 'F8',
        name: 'Virtuvė: indaplovė ir stalviršis',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '16 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L2',
        feeds: [
            'apartment.livingKitchen.R3',
            'apartment.livingKitchen.R5',
            'apartment.livingKitchen.R6',
            'apartment.livingKitchen.L4'
        ]
    },
    F9: {
        label: 'F9',
        name: 'Vonia: skalbyklė',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '16 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L2',
        feeds: [
            'apartment.bathroom.R1',
            'apartment.bathroom.R3'
        ]
    },
    F10: {
        label: 'F10',
        name: 'Virtuvė: šaldytuvas ir mikrobangė',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '16 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L2',
        feeds: [
            'apartment.livingKitchen.R1',
            'apartment.livingKitchen.R2',
            'apartment.livingKitchen.hood'
        ]
    },
    F11: {
        label: 'F11',
        name: 'Apšvietimas (be vonios)',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '10 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L1',
        feeds: [
            'apartment.livingKitchen.L1',
            'apartment.livingKitchen.L2',
            'apartment.livingKitchen.L3',
            'apartment.bedroom.L1',
            'apartment.kidsRoom.L1',
            'apartment.hallway.L1',
            'apartment.balcony.L1',
            'apartment.livingKitchen.X1'
        ]
    },
    F12: {
        label: 'F12',
        name: 'Vonia: apšvietimas',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '10 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L3',
        feeds: ['apartment.bathroom.L1']
    },
    F13: {
        label: 'F13',
        name: 'Modemas',
        type: 'Circuit Breaker',
        product: 'ETI ETIMAT 6',
        ratedCurrent: '10 A',
        tripCurve: 'C',
        breakingCapacity: '6000 A',
        poles: 1,
        phase: 'L1',
        feeds: ['apartment.hallway.modemBox']
    }
};

// Devices database
const devices = {};

// Helper to add device
function addDevice(id, data) {
    devices[id] = { id, ...data };
}

// Kids Room devices
addDevice('apartment.kidsRoom.R1', {
    type: 'Outlet', label: 'R1', room: 'Kids Room', name: 'Outlet under cloud light',
    socketCount: 1, power: '0 W', pluggedIn: [], note: 'In block with S2'
});
addDevice('apartment.kidsRoom.R2', {
    type: 'Outlet', label: 'R2', room: 'Kids Room', name: 'Outlet by door, near floor',
    socketCount: 1, power: '0 W', pluggedIn: []
});
addDevice('apartment.kidsRoom.R3', {
    type: 'Outlet', label: 'R3', room: 'Kids Room', name: 'Outlet by kids desk, near floor',
    socketCount: 1, power: '0 W', pluggedIn: []
});
addDevice('apartment.kidsRoom.R4', {
    type: 'Outlet', label: 'R4', room: 'Kids Room', name: 'Outlet behind bookcase, near floor',
    socketCount: 2, power: '0 W', pluggedIn: []
});
addDevice('apartment.kidsRoom.R5', {
    type: 'Outlet', label: 'R5', room: 'Kids Room', name: 'Outlet behind bookcase, above R4',
    socketCount: 2, power: 'NAS: ~10W', pluggedIn: ['apartment.kidsRoom.nas']
});
addDevice('apartment.kidsRoom.L1', {
    type: 'Light', label: 'L1', room: 'Kids Room', name: 'Main lighting (6 sockets)',
    bulbSocketCount: 6, power: '106W',
    bulbs: [
        { type: 'OkkoG9Led4W', product: 'OKKO TP-G9 LED', base: 'G9', technology: 'led', power: '4W', luminousFlux: 300, colorTemperature: '3000K', count: 4 },
        { type: 'OsramG9Halogen33W', product: 'OSRAM HALOPIN G9 33W', base: 'G9', technology: 'halogen', power: '33W', luminousFlux: 460, colorTemperature: '2700K', count: 2 }
    ],
    controlledBy: ['apartment.kidsRoom.S1']
});
addDevice('apartment.kidsRoom.L2', {
    type: 'Light', label: 'L2', room: 'Kids Room', name: 'Cloud light above bed',
    bulbSocketCount: 0, power: '4W', product: 'IKEA LED lamp (driver RECOM RACV04-24)',
    bulbs: [], controlledBy: ['apartment.kidsRoom.S2'],
    note: 'Integrated 24V LED driver, non-user-replaceable'
});
addDevice('apartment.kidsRoom.S1', {
    type: 'Switch', label: 'S1', room: 'Kids Room', name: 'By door; main lighting',
    switchType: 'oneWay', controls: ['apartment.kidsRoom.L1']
});
addDevice('apartment.kidsRoom.S2', {
    type: 'Switch', label: 'S2', room: 'Kids Room', name: 'Under cloud light, with R1; cloud light switch',
    switchType: 'oneWay', controls: ['apartment.kidsRoom.L2']
});
addDevice('apartment.kidsRoom.nas', {
    type: 'PluggedAppliance', label: 'NAS', room: 'Kids Room', name: 'NAS server',
    product: '', power: '~10W', pluggedInto: 'apartment.kidsRoom.R5'
});

// Bedroom devices
addDevice('apartment.bedroom.R1', {
    type: 'Outlet', label: 'R1', room: 'Bedroom', name: 'By room door, under switch S1',
    socketCount: 1, power: '0 W', pluggedIn: []
});
addDevice('apartment.bedroom.R2', {
    type: 'Outlet', label: 'R2', room: 'Bedroom', name: 'Opposite bed (foot end)',
    socketCount: 2, power: '0 W', pluggedIn: []
});
addDevice('apartment.bedroom.R3', {
    type: 'Outlet', label: 'R3', room: 'Bedroom', name: 'Bed left side, under reading light L2',
    socketCount: 1, power: '0 W', pluggedIn: []
});
addDevice('apartment.bedroom.R4', {
    type: 'Outlet', label: 'R4', room: 'Bedroom', name: 'Bed right side, with switch S4',
    socketCount: 2, power: '0 W', pluggedIn: []
});
addDevice('apartment.bedroom.L1', {
    type: 'Light', label: 'L1', room: 'Bedroom', name: 'Main lighting (6 sockets)',
    bulbSocketCount: 6, power: '53W',
    bulbs: [
        { type: 'OkkoG9Led4W', product: 'OKKO TP-G9 LED', base: 'G9', technology: 'led', power: '4W', luminousFlux: 300, colorTemperature: '3000K', count: 5 },
        { type: 'OsramG9Halogen33W', product: 'OSRAM HALOPIN G9 33W', base: 'G9', technology: 'halogen', power: '33W', luminousFlux: 460, colorTemperature: '2700K', count: 1 }
    ],
    controlledBy: ['apartment.bedroom.S1', 'apartment.bedroom.S3']
});
addDevice('apartment.bedroom.L2', {
    type: 'Light', label: 'L2', room: 'Bedroom', name: 'Wall reading light, bed left',
    bulbSocketCount: 1, power: '33W',
    bulbs: [{ type: 'OsramG9Halogen33W', product: 'OSRAM HALOPIN G9 33W', base: 'G9', technology: 'halogen', power: '33W', luminousFlux: 460, colorTemperature: '2700K', count: 1 }],
    controlledBy: ['apartment.bedroom.S2']
});
addDevice('apartment.bedroom.L3', {
    type: 'Light', label: 'L3', room: 'Bedroom', name: 'Wall reading light, bed right',
    bulbSocketCount: 1, power: '33W',
    bulbs: [{ type: 'OsramG9Halogen33W', product: 'OSRAM HALOPIN G9 33W', base: 'G9', technology: 'halogen', power: '33W', luminousFlux: 460, colorTemperature: '2700K', count: 1 }],
    controlledBy: ['apartment.bedroom.S4']
});
addDevice('apartment.bedroom.S1', {
    type: 'Switch', label: 'S1', room: 'Bedroom', name: 'By door, above outlet R1; main lighting',
    switchType: 'twoWay', controls: ['apartment.bedroom.L1']
});
addDevice('apartment.bedroom.S2', {
    type: 'Switch', label: 'S2', room: 'Bedroom', name: 'Bed left, with R3; reading light L2',
    switchType: 'oneWay', controls: ['apartment.bedroom.L2']
});
addDevice('apartment.bedroom.S3', {
    type: 'Switch', label: 'S3', room: 'Bedroom', name: 'Bed left, with R3; main lighting (duplicates S1)',
    switchType: 'twoWay', controls: ['apartment.bedroom.L1']
});
addDevice('apartment.bedroom.S4', {
    type: 'Switch', label: 'S4', room: 'Bedroom', name: 'Bed right, with R4; reading light L3',
    switchType: 'oneWay', controls: ['apartment.bedroom.L3']
});

// Hallway devices
addDevice('apartment.hallway.R1', {
    type: 'Outlet', label: 'R1', room: 'Hallway', name: 'By modem box, behind shoe cabinet',
    socketCount: 1, power: '0 W', pluggedIn: []
});
addDevice('apartment.hallway.R2', {
    type: 'Outlet', label: 'R2', room: 'Hallway', name: 'Opposite bathroom',
    socketCount: 1, power: '0 W', pluggedIn: []
});
addDevice('apartment.hallway.L1', {
    type: 'Light', label: 'L1', room: 'Hallway', name: 'Hallway lighting (3 fixtures, 2 sockets each)',
    bulbSocketCount: 6, power: '39W',
    bulbs: [{ type: 'PhilipsE27Led13W', product: 'Philips LED A60 13W', base: 'E27', technology: 'led', power: '13W', luminousFlux: 1521, colorTemperature: '2700K', count: 3 }],
    controlledBy: ['apartment.hallway.S1', 'apartment.hallway.S3']
});
addDevice('apartment.hallway.S1', {
    type: 'Switch', label: 'S1', room: 'Hallway', name: 'By front door; hallway lighting',
    switchType: 'twoWay', controls: ['apartment.hallway.L1']
});
addDevice('apartment.hallway.S2', {
    type: 'Switch', label: 'S2', room: 'Hallway', name: 'By bathroom door; bathroom main lighting',
    switchType: 'oneWay', controls: ['apartment.bathroom.L1']
});
addDevice('apartment.hallway.S3', {
    type: 'Switch', label: 'S3', room: 'Hallway', name: 'Opposite bathroom, leftmost; hallway lighting (duplicates S1)',
    switchType: 'twoWay', controls: ['apartment.hallway.L1']
});
addDevice('apartment.hallway.S4', {
    type: 'Switch', label: 'S4', room: 'Hallway', name: 'Opposite bathroom, 2nd; cable X1 in bookcase',
    switchType: 'oneWay', controls: ['apartment.livingKitchen.X1']
});
addDevice('apartment.hallway.S5', {
    type: 'Switch', label: 'S5', room: 'Hallway', name: 'Opposite bathroom, 3rd; kitchen zone lighting L3',
    switchType: 'oneWay', controls: ['apartment.livingKitchen.L3']
});
addDevice('apartment.hallway.S6', {
    type: 'Switch', label: 'S6', room: 'Hallway', name: 'Opposite bathroom, 4th, double gang; left: light above dining table, right: living room main lighting',
    switchType: 'doubleGang', controls: ['apartment.livingKitchen.L1', 'apartment.livingKitchen.L2']
});
addDevice('apartment.hallway.T1', {
    type: 'Thermostat', label: 'T1', room: 'Hallway', name: 'Bathroom floor heating thermostat, near floor under S2',
    controls: ['apartment.bathroom.floorHeating']
});
addDevice('apartment.hallway.modemBox', {
    type: 'FixedAppliance', label: 'Modem Box', room: 'Hallway', name: 'Modem box: wall box where fiber optic comes in',
    product: '', power: '~10W', phases: 1
});

// Bathroom devices
addDevice('apartment.bathroom.L1', {
    type: 'Light', label: 'L1', room: 'Bathroom', name: 'Main lighting; 12V via electronic transformer',
    bulbSocketCount: 4, power: '8W',
    bulbs: [{ type: 'LedvanceGu53Led8W', product: 'LEDVANCE LED MR16 GU5.3 8W', base: 'GU5.3', technology: 'led', power: '8W', luminousFlux: 621, colorTemperature: '2700K', count: 1 }],
    controlledBy: ['apartment.hallway.S2'],
    note: 'TODO: Only 1 bulb installed. Minimum load issue with transformer.'
});
addDevice('apartment.bathroom.L2', {
    type: 'Light', label: 'L2', room: 'Bathroom', name: 'Mirror lighting, LED strip, 52cm, in profile above mirror',
    bulbSocketCount: 0, lengthM: 0.52, power: '~3-8W', product: 'LED strip',
    bulbs: [], controlledBy: ['apartment.bathroom.S1'],
    note: 'Cool white light. Power unknown - typical strips are 5-15 W/m.'
});
addDevice('apartment.bathroom.R1', {
    type: 'Outlet', label: 'R1', room: 'Bathroom', name: 'By door, behind washing machine',
    socketCount: 1, power: '0 W', pluggedIn: []
});
addDevice('apartment.bathroom.R2', {
    type: 'Outlet', label: 'R2', room: 'Bathroom', name: 'By mirror, with cover (for shavers); with switch S1',
    socketCount: 1, power: '0 W', pluggedIn: [], isWaterproof: true
});
addDevice('apartment.bathroom.R3', {
    type: 'Outlet', label: 'R3', room: 'Bathroom', name: 'Behind washing machine, near floor',
    socketCount: 1, power: 'Washing Machine: 2300W', pluggedIn: ['apartment.bathroom.washingMachine']
});
addDevice('apartment.bathroom.S1', {
    type: 'Switch', label: 'S1', room: 'Bathroom', name: 'By mirror, with R2; mirror lighting',
    switchType: 'oneWay', controls: ['apartment.bathroom.L2']
});
addDevice('apartment.bathroom.towelRail', {
    type: 'FixedAppliance', label: 'Towel Rail', room: 'Bathroom', name: 'Electric towel rail',
    product: 'Square Line KTX-2 MS heating element', power: '1000W', phases: 1
});
addDevice('apartment.bathroom.floorHeating', {
    type: 'FixedAppliance', label: 'Floor Heating', room: 'Bathroom', name: 'Bathroom floor heating',
    product: '', power: 'Unknown (120-150 W/m2 typical)', phases: 1,
    controlledBy: ['apartment.hallway.T1']
});
addDevice('apartment.bathroom.washingMachine', {
    type: 'PluggedAppliance', label: 'Washing Machine', room: 'Bathroom', name: 'Washing machine with dryer, 9kg wash / 6kg dry',
    product: 'Samsung WD90T984ASH/S7', power: '2300W', pluggedInto: 'apartment.bathroom.R3'
});

// Living Kitchen devices
addDevice('apartment.livingKitchen.L1', {
    type: 'Light', label: 'L1', room: 'Living Kitchen', name: 'Light above dining table',
    bulbSocketCount: 1, power: '4.8W',
    bulbs: [{ type: 'OsramE27LedFilamentGlobe5W', product: 'OSRAM LED filament globe 4.8W', base: 'E27', technology: 'led', power: '4.8W', luminousFlux: 400, colorTemperature: '2200K', count: 1 }],
    controlledBy: ['apartment.hallway.S6']
});
addDevice('apartment.livingKitchen.L2', {
    type: 'Light', label: 'L2', room: 'Living Kitchen', name: 'Main living room lighting',
    bulbSocketCount: 0, power: '22W', product: 'Philips LED Ceiling Luminaire 929002669',
    bulbs: [], controlledBy: ['apartment.hallway.S6'],
    note: 'Non-user-replaceable LED module (220-240V, 0.11A, 22W, PF 0.9, 2000lm, 2700K)'
});
addDevice('apartment.livingKitchen.L3', {
    type: 'Light', label: 'L3', room: 'Living Kitchen', name: 'Kitchen zone lighting',
    bulbSocketCount: 4, power: '17.2W',
    bulbs: [{ type: 'LedvanceGu10Led4W', product: 'LEDVANCE LED GU10 4.3W', base: 'GU10', technology: 'led', power: '4.3W', luminousFlux: 350, colorTemperature: '2700K', count: 4 }],
    controlledBy: ['apartment.hallway.S5']
});
addDevice('apartment.livingKitchen.L4', {
    type: 'Light', label: 'L4', room: 'Living Kitchen', name: 'Kitchen countertop LED strip, 3m, in aluminum profile',
    bulbSocketCount: 0, lengthM: 3, power: '~15-45W', product: 'LED strip',
    bulbs: [], controlledBy: ['apartment.livingKitchen.S2'],
    note: 'Cool white light. Power unknown: typical strips are 5-15 W/m. Exact value from LED driver label.'
});
addDevice('apartment.livingKitchen.X1', {
    type: 'CableEnd', label: 'X1', room: 'Living Kitchen', name: 'Cable in bookcase, 230V; controlled by switch S4',
    controlledBy: ['apartment.hallway.S4']
});
addDevice('apartment.livingKitchen.R1', {
    type: 'Outlet', label: 'R1', room: 'Living Kitchen', name: 'Kitchen zone, behind cabinets; fridge',
    socketCount: 1, power: 'Fridge: 185W', pluggedIn: ['apartment.livingKitchen.fridge']
});
addDevice('apartment.livingKitchen.R2', {
    type: 'Outlet', label: 'R2', room: 'Living Kitchen', name: 'Kitchen zone, behind cabinets; microwave',
    socketCount: 1, power: 'Microwave: 1150W', pluggedIn: ['apartment.livingKitchen.microwave']
});
addDevice('apartment.livingKitchen.R3', {
    type: 'Outlet', label: 'R3', room: 'Living Kitchen', name: 'Kitchen zone, behind cabinets; dishwasher',
    socketCount: 1, power: 'Dishwasher: 2400W', pluggedIn: ['apartment.livingKitchen.dishwasher']
});
addDevice('apartment.livingKitchen.R4', {
    type: 'Outlet', label: 'R4', room: 'Living Kitchen', name: 'Kitchen zone, behind cabinets; oven',
    socketCount: 1, power: 'Oven: 3500W', pluggedIn: ['apartment.livingKitchen.oven']
});
addDevice('apartment.livingKitchen.R5', {
    type: 'Outlet', label: 'R5', room: 'Living Kitchen', name: 'By sink',
    socketCount: 2, power: 'Kettle: 2200W', pluggedIn: ['apartment.livingKitchen.kettle']
});
addDevice('apartment.livingKitchen.R6', {
    type: 'Outlet', label: 'R6', room: 'Living Kitchen', name: 'By coffee machine',
    socketCount: 2, power: 'Coffee Machine: 1450W', pluggedIn: ['apartment.livingKitchen.coffeeMachine']
});
addDevice('apartment.livingKitchen.R7', {
    type: 'Outlet', label: 'R7', room: 'Living Kitchen', name: 'Behind sofa, for phone / laptop chargers',
    socketCount: 2, power: '0 W', pluggedIn: []
});
addDevice('apartment.livingKitchen.R8', {
    type: 'Outlet', label: 'R8', room: 'Living Kitchen', name: 'Behind TV, behind sports desk',
    socketCount: 3, power: 'Vinyl Player + RPi Server + Roomba',
    pluggedIn: ['apartment.livingKitchen.vinylPlayer', 'apartment.livingKitchen.rpiServer', 'apartment.livingKitchen.roomba']
});
addDevice('apartment.livingKitchen.R9', {
    type: 'Outlet', label: 'R9', room: 'Living Kitchen', name: 'Behind TV, behind electronics desk, top block',
    socketCount: 2, hasDataSocket: true, power: 'Power Strip 1 (TV Box + Desk Lamp)',
    pluggedIn: ['apartment.livingKitchen.powerStrip1']
});
addDevice('apartment.livingKitchen.R10', {
    type: 'Outlet', label: 'R10', room: 'Living Kitchen', name: 'Behind TV, behind electronics desk, bottom block (below R9)',
    socketCount: 2, hasDataSocket: true, power: 'TV + Modem2',
    pluggedIn: ['apartment.livingKitchen.tv', 'apartment.livingKitchen.modem2']
});
addDevice('apartment.livingKitchen.R11', {
    type: 'Outlet', label: 'R11', room: 'Living Kitchen', name: 'Bookcase next to TV',
    socketCount: 2, power: 'Speaker', pluggedIn: ['apartment.livingKitchen.speaker']
});
addDevice('apartment.livingKitchen.S1', {
    type: 'Switch', label: 'S1', room: 'Living Kitchen', name: 'Balcony light switch, by balcony door',
    switchType: 'oneWay', controls: ['apartment.balcony.L1']
});
addDevice('apartment.livingKitchen.S2', {
    type: 'Switch', label: 'S2', room: 'Living Kitchen', name: 'Countertop LED strip switch, by coffee machine',
    switchType: 'oneWay', controls: ['apartment.livingKitchen.L4']
});
addDevice('apartment.livingKitchen.hob', {
    type: 'FixedAppliance', label: 'Hob', room: 'Living Kitchen', name: 'Induction hob, 60 cm, 4 zones',
    product: 'Samsung NZ64T3707A1', power: '7000W', phases: 3
});
addDevice('apartment.livingKitchen.hood', {
    type: 'FixedAppliance', label: 'Hood', room: 'Living Kitchen', name: 'Range hood',
    product: 'Elica ELITE14 LUX WH/A/60', power: '206W', phases: 1,
    connectedLoad: '206W (motor 150W + lights 2x28W)'
});
addDevice('apartment.livingKitchen.fridge', {
    type: 'PluggedAppliance', label: 'Fridge', room: 'Living Kitchen', name: 'Refrigerator',
    product: 'Electrolux ENN3153AOW', power: '185W', pluggedInto: 'apartment.livingKitchen.R1'
});
addDevice('apartment.livingKitchen.microwave', {
    type: 'PluggedAppliance', label: 'Microwave', room: 'Living Kitchen', name: 'Microwave with grill',
    product: 'Candy CMG 7417 DS', power: '1150W', pluggedInto: 'apartment.livingKitchen.R2'
});
addDevice('apartment.livingKitchen.dishwasher', {
    type: 'PluggedAppliance', label: 'Dishwasher', room: 'Living Kitchen', name: 'Dishwasher, 45 cm, integrated',
    product: 'Bosch SPV69T40EU/23 SuperSilence', power: '2400W', pluggedInto: 'apartment.livingKitchen.R3'
});
addDevice('apartment.livingKitchen.oven', {
    type: 'PluggedAppliance', label: 'Oven', room: 'Living Kitchen', name: 'Oven',
    product: 'Bosch HBA23B122S', power: '3500W', pluggedInto: 'apartment.livingKitchen.R4'
});
addDevice('apartment.livingKitchen.kettle', {
    type: 'PluggedAppliance', label: 'Kettle', room: 'Living Kitchen', name: 'Electric kettle',
    product: 'Philips HD9321/20', power: '2200W', pluggedInto: 'apartment.livingKitchen.R5'
});
addDevice('apartment.livingKitchen.coffeeMachine', {
    type: 'PluggedAppliance', label: 'Coffee Machine', room: 'Living Kitchen', name: 'Coffee machine',
    product: "De'Longhi Dinamica ECAM350.15.B", power: '1450W', pluggedInto: 'apartment.livingKitchen.R6'
});
addDevice('apartment.livingKitchen.tv', {
    type: 'PluggedAppliance', label: 'TV', room: 'Living Kitchen', name: 'Television',
    product: '', power: 'Unknown', pluggedInto: 'apartment.livingKitchen.R10'
});
addDevice('apartment.livingKitchen.roomba', {
    type: 'PluggedAppliance', label: 'Roomba', room: 'Living Kitchen', name: 'Robot vacuum',
    product: '', power: 'Unknown', pluggedInto: 'apartment.livingKitchen.R8'
});
addDevice('apartment.livingKitchen.speaker', {
    type: 'PluggedAppliance', label: 'Speaker', room: 'Living Kitchen', name: 'Marshall speaker',
    product: '', power: 'Unknown', pluggedInto: 'apartment.livingKitchen.R11'
});
addDevice('apartment.livingKitchen.vinylPlayer', {
    type: 'PluggedAppliance', label: 'Vinyl Player', room: 'Living Kitchen', name: 'Vinyl record player',
    product: '', power: 'Unknown', pluggedInto: 'apartment.livingKitchen.R8'
});
addDevice('apartment.livingKitchen.rpiServer', {
    type: 'PluggedAppliance', label: 'RPi Server', room: 'Living Kitchen', name: 'Raspberry Pi server',
    product: '', power: 'Unknown', pluggedInto: 'apartment.livingKitchen.R8'
});
addDevice('apartment.livingKitchen.modem2', {
    type: 'PluggedAppliance', label: 'Modem 2', room: 'Living Kitchen', name: 'Second modem',
    product: '', power: 'Unknown', pluggedInto: 'apartment.livingKitchen.R10'
});
addDevice('apartment.livingKitchen.tvBox', {
    type: 'PluggedAppliance', label: 'TV Box', room: 'Living Kitchen', name: 'TV set-top box',
    product: '', power: 'Unknown', pluggedInto: 'apartment.livingKitchen.powerStrip1'
});
addDevice('apartment.livingKitchen.deskLamp', {
    type: 'PluggedAppliance', label: 'Desk Lamp', room: 'Living Kitchen', name: 'Desk lamp in bookcase',
    product: '', power: 'Unknown', pluggedInto: 'apartment.livingKitchen.powerStrip1'
});
addDevice('apartment.livingKitchen.powerStrip1', {
    type: 'PowerStrip', label: 'Power Strip 1', room: 'Living Kitchen', name: 'Extension cord under TV, behind sports desk',
    socketCount: 2, pluggedInto: 'apartment.livingKitchen.R9',
    pluggedIn: ['apartment.livingKitchen.tvBox', 'apartment.livingKitchen.deskLamp']
});

// Balcony devices
addDevice('apartment.balcony.L1', {
    type: 'Light', label: 'L1', room: 'Balcony', name: 'Outdoor light',
    bulbSocketCount: 1, power: '28W',
    bulbs: [{ type: 'VagnerE27Halogen28W', product: 'Vagner SDH halogen 28W E27', base: 'E27', technology: 'halogen', power: '28W', luminousFlux: 375, colorTemperature: '2800K', count: 1 }],
    controlledBy: ['apartment.livingKitchen.S1']
});

// Spare bulbs
const spareBulbs = [
    { type: 'OsramE27Led8W', product: 'OSRAM LED STAR CLASSIC A60 8W', base: 'E27', technology: 'led', power: '8W', luminousFlux: 806, colorTemperature: '2700K', count: 2 },
    { type: 'PhilipsE27Led13W', product: 'Philips LED 13W E27', base: 'E27', technology: 'led', power: '13W', luminousFlux: 1521, colorTemperature: '2700K', count: 3 },
    { type: 'OkkoG9Led4W', product: 'OKKO TP-G9 LED', base: 'G9', technology: 'led', power: '4W', luminousFlux: 300, colorTemperature: '3000K', count: 1 },
    { type: 'OsramG9Halogen33W', product: 'OSRAM HALOPIN G9 33W', base: 'G9', technology: 'halogen', power: '33W', luminousFlux: 460, colorTemperature: '2700K', count: 1 },
    { type: 'LedvanceGu10Led4W', product: 'LEDVANCE LED GU10 4.3W', base: 'GU10', technology: 'led', power: '4.3W', luminousFlux: 350, colorTemperature: '2700K', count: 2 },
    { type: 'StandartGu53Led4W', product: 'Standart LED MR16 GU5.3 4.5W', base: 'GU5.3', technology: 'led', power: '4.5W', luminousFlux: 345, colorTemperature: '2700K', count: 6 }
];
