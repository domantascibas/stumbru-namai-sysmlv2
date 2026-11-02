# Electrical Installation Visualizer

A list-based visualizer for the electrical installation model defined in `model/Panel.sysml` and `model/Rooms.sysml`.

## IEC/ISO Symbols Used

Based on IEC 81346-2 and common electrical notation:

| Device Type | Symbol | Color |
|-------------|--------|-------|
| Main Switch | **Q** | Purple |
| RCD / Circuit Breaker | **F** | Red/Orange |
| Light | **L** | Yellow |
| Outlet/Receptacle | **R** | Blue |
| Switch | **S** | Green |
| Fixed Appliance | **FIX** | Gray |
| Plugged Appliance | **APP** | Teal |
| Power Strip | **PS** | Dark Blue |
| Cable End | **X** | Gray |
| Thermostat | **T** | Red |
| Bulb | **LAMP** | (in downstream trees) |

## Layout

```
+------------------------------------------------------------------+
|  Electrical Installation Visualizer                                 |
+------------------------------------------------------------------+
|  Circuit Breakers                                                 |
|  +-------------------------------------------------------------+  |
|  | [Q] Q1: Įvadas | Main Switch | 25 A | 3-phase           |  |
|  +-------------------------------------------------------------+  |
|  | [F] F1: Nuotėkio relė 30 mA | RCD | 25 A | 3-phase       |  |
|  +-------------------------------------------------------------+  |
|  | [F] F2: Vaikų k. ir koridoriaus rozetės | CB | 16 A | L1    |  |
|  +-------------------------------------------------------------+  |
|  | [F] F3: Miegamojo ir svetainės rozetės | CB | 16 A | L1    |  |
|  +-------------------------------------------------------------+  |
|  ... (one breaker per row)                                      |  |
+------------------------------------------------------------------+
|                                                                   |
|  [When F2 is clicked]                                            |  |
|  +-------------------------------------------------------------+  |
|  | [F] F2: Vaikų k. ir koridoriaus rozetės | 8 direct conn.  |  |
|  +-------------------------------------------------------------+  |
|  | [R] R1 | Kids Room | Outlet under cloud light            |  |
|  |----------------------------------------------------------------|  |
|  | Upstream Chain:                                              |  |
|  | [R] R1 (Outlet) --> [F] F2 (Circuit Breaker) -->             |  |
|  | [F] F1 (RCD) --> [Q] Q1 (Main Switch)                       |  |
|  |                                                                 |  |
|  | Downstream Elements:                                         |  |
|  | None                                                         |  |
|  +-------------------------------------------------------------+  |
|  | [R] R5 (2x sockets) | Kids Room | Outlet behind bookcase    |  |
|  |----------------------------------------------------------------|  |
|  | Upstream Chain:                                              |  |
|  | [R] R5 (Outlet) --> [F] F2 (Circuit Breaker) -->             |  |
|  | [F] F1 (RCD) --> [Q] Q1 (Main Switch)                       |  |
|  |                                                                 |  |
|  | Downstream Elements:                                         |  |
|  | |-- [APP] NAS (PluggedAppliance) - NAS server                |  |
|  +-------------------------------------------------------------+  |
|  | [L] L1 (4/6 bulbs) | Kids Room | Main lighting              |  |
|  |----------------------------------------------------------------|  |
|  | Upstream Chain:                                              |  |
|  | [L] L1 (Light) --> [F] F2 (Circuit Breaker) -->              |  |
|  | [F] F1 (RCD) --> [Q] Q1 (Main Switch)                       |  |
|  |                                                                 |  |
|  | Downstream Elements:                                         |  |
|  | |-- [LAMP] 4x OKKO TP-G9 LED (G9 | led | 4W | 300lm | 3000K)  |  |
|  | |-- [LAMP] 2x OSRAM HALOPIN G9 33W (G9 | halogen | 33W | ...) |  |
|  +-------------------------------------------------------------+  |
|  ... (one device per row)                                       |  |
+------------------------------------------------------------------+
|  Spare Bulbs                                                       |
+------------------------------------------------------------------+
```

## Features

- **IEC/ISO Symbols**: All devices use standard electrical symbols instead of emojis
- **Vertical Breaker List**: Circuit breakers displayed one per row with IEC symbols
- **Single Circuit View**: Click a circuit breaker to show only its directly connected devices
- **Upstream Chain**: For each device, shows the complete connection path from the device back to Q1 using IEC symbols
- **Downstream Tree**: For each device, shows all elements connected downstream with proper hierarchy
- **Socket/Bulb Counts**: Outlets show socket count, lights show installed/maximum bulb count
- **Spare Bulbs**: View all available spare bulbs and their specifications

## Usage

1. Open `visualizer.html` in a web browser
2. Click on any circuit breaker in the vertical list to select it
3. All devices directly connected to that circuit breaker are displayed below, one per row
4. For each device, view:
   - **Symbol**: IEC/ISO symbol representing the device type
   - **Socket/Bulb Info**: Outlets show "Nx sockets", lights show "installed/max bulbs"
   - **Upstream Chain**: The complete path from device to power source (Q1) using symbols
   - **Downstream Elements**: Tree view of everything connected to this device
5. Click the same circuit breaker again to hide its devices

## Symbol Legend

- **Q**: Main Switch / Power switching device
- **F**: Protective device (Circuit Breaker, RCD)
- **L**: Light / Lighting
- **R**: Outlet / Receptacle (from "rozetes")
- **S**: Switch
- **FIX**: Fixed Appliance (hard-wired)
- **APP**: Plugged Appliance (plug-in device)
- **PS**: Power Strip / Extension
- **X**: Cable End
- **T**: Thermostat
- **LAMP**: Bulb (shown in downstream trees)

## Socket and Bulb Information

### Outlets
Each outlet displays its socket count in the format: `(Nx sockets)`

Examples:
- `[R] R1` - Single socket (default, not shown if 1)
- `[R] R5 (2x sockets)` - Double socket outlet
- `[R] R8 (3x sockets)` - Triple socket outlet

### Lights
Each light displays installed/maximum bulb count in the format: `(installed/max bulbs)`

Examples:
- `[L] L1 (6/6 bulbs)` - All 6 sockets occupied
- `[L] L2 (4/6 bulbs)` - 4 out of 6 sockets occupied
- `[L] L3 (4/4 bulbs)` - All 4 sockets occupied
- `[L] L2 (1/4 bulbs)` - Only 1 out of 4 sockets occupied

Note: Lights with integrated non-replaceable LED modules (bulbSocketCount = 0) show no bulb count.

## Example

### Circuit: F2 (Vaikų k. ir koridoriaus rozetės)

**Device: [R] R1 | Kids Room | Outlet under cloud light**
- Upstream Chain: [R] R1 (Outlet) --> [F] F2 (Circuit Breaker) --> [F] F1 (RCD) --> [Q] Q1 (Main Switch)
- Downstream Elements: None

**Device: [R] R5 (2x sockets) | Kids Room | Outlet behind bookcase, above R4**
- Upstream Chain: [R] R5 (Outlet) --> [F] F2 (Circuit Breaker) --> [F] F1 (RCD) --> [Q] Q1 (Main Switch)
- Downstream Elements:
  |-- [APP] NAS (PluggedAppliance) - NAS server

**Device: [L] L1 (4/6 bulbs) | Kids Room | Main lighting**
- Upstream Chain: [L] L1 (Light) --> [F] F2 (Circuit Breaker) --> [F] F1 (RCD) --> [Q] Q1 (Main Switch)
- Downstream Elements:
  |-- [LAMP] 4x OKKO TP-G9 LED (G9 | led | 4W | 300lm | 3000K)
  |-- [LAMP] 2x OSRAM HALOPIN G9 33W (G9 | halogen | 33W | 460lm | 2700K)

**Device: [R] L2 | Kids Room | Cloud light above bed**
- Upstream Chain: [L] L2 (Light) --> [F] F2 (Circuit Breaker) --> [F] F1 (RCD) --> [Q] Q1 (Main Switch)
- Downstream Elements:
  |-- [LAMP] 1x IKEA LED lamp (driver RECOM RACV04-24) - Integrated 24V LED driver

### Circuit: F11 (Apšvietimas - be vonios)

**Device: [L] L1 (3/3 bulbs) | Hallway | Hallway lighting**
- Upstream Chain: [L] L1 (Light) --> [F] F11 (Circuit Breaker) --> [F] F1 (RCD) --> [Q] Q1 (Main Switch)
- Downstream Elements:
  |-- [LAMP] 3x Philips LED A60 13W (E27 | led | 13W | 1521lm | 2700K)

## Model Coverage

The visualizer includes all devices from the electrical installation model:

### Rooms
- **Living Kitchen**: 11 outlets, 4 lights, 2 switches, hob, hood, fridge, microwave, dishwasher, oven, kettle, coffee machine, TV, roomba, speaker, vinyl player, RPi server, modem2, TV box, desk lamp, power strip
- **Kids Room**: 5 outlets, 2 lights, 2 switches, NAS server
- **Bedroom**: 4 outlets, 3 lights, 4 switches
- **Hallway**: 2 outlets, 1 light, 6 switches, 1 thermostat, modem box
- **Bathroom**: 3 outlets, 2 lights, 1 switch, towel rail, floor heating, washing machine
- **Balcony**: 1 light

### Circuit Breakers
- Q1: Main switch
- F1: RCD (30 mA)
- F2-F13: Individual circuit breakers for different zones

### Spare Bulbs
- 2x OSRAM LED STAR CLASSIC A60 8W (E27)
- 3x Philips LED 13W E27
- 1x OKKO TP-G9 LED (G9)
- 1x OSRAM HALOPIN G9 33W (G9)
- 2x LEDVANCE LED GU10 4.3W
- 6x Standart LED MR16 GU5.3 4.5W
