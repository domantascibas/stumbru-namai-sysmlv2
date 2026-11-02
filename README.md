# Stumbrų namai – electrical installation in SysML v2

A SysML v2 model of the apartment's electrical installation (panel, circuits,
rooms, outlets, lights, appliances) with a live browser viewer.

```
model/
  library/ElectricalLibrary.sysml   types: devices, bulbs, breakers, load roll-up
  Rooms.sysml                       rooms and what is installed in each
  Panel.sysml                       distribution board and which circuit feeds what
viewer/                             live viewer (Node, no dependencies)
docs/panel-legend.*                 printable legend for the panel door
```

## Running

With Podman (includes the [OpenSysML](https://github.com/Open-MBEE/OpenSysML) `sysml` tool):

```sh
podman build -t stumbru-sysml .
podman run --rm -p 5175:5175 -v "$PWD":/work stumbru-sysml   # viewer: http://localhost:5175
```

Without a container: Node 22+, and optionally `sysml` on the PATH
(`go install github.com/Open-MBEE/OpenSysML/cmd/sysml@v0.11.0`, or set `SYSML_BIN`):

```sh
npm start            # viewer: http://localhost:5175
```

The viewer watches `model/` and updates as soon as a file is saved. Without
`sysml` it still works, but computes the loads itself and skips validation.

## Model vs. simulator

The model describes the installation only: what is installed where and how it
is wired. What is switched on is not part of the model; it is played with in the
viewer's simulator:

- click a breaker in the single-line diagram to switch it off or on;
- click a switch (each gang of a double switch separately), or a light to use its switch;
- click an appliance to switch it on or off (<kbd>Shift</kbd>+click only selects).

After every change the devices that got power flash green and the ones that
lost it flash red; a message lists them. Hovering a breaker highlights the group
it feeds. The simulator state is kept in the browser (localStorage); a scenario
can also be given in the URL: `?state={"breakers":{"panel.Q1.F1.F8":false},...}`.

| Change in the model | How |
|---|---|
| Plug something into a free outlet | add a `PluggedAppliance` and list it in the outlet's `ref :>> pluggedIn` |
| Place a room on the floor plan | `planX`, `planY`, `planWidth`, `planDepth` (metres) |
| Pin a device to a spot | `planX`, `planY` (metres from the room's top-left corner) |

Plan symbols follow IEC 60617 installation symbols (socket outlet with
protective contact, one-way / two-way / series switches, luminaire, line
luminaire, equipment); the panel is drawn as a single-line diagram.

## Load roll-up in SysML

The structural roll-up is defined in the library and evaluated by `sysml`: every
device has a `connectedLoad` (rated power installed through it), every breaker a
`connectedLoad` and `connectedLoadL1`..`connectedLoadL3`, summed over `feeds` and
`downstream`. Momentary load and current depend on what is switched on, so they
come from the simulator.

```sh
# in the container: prefix each command with  podman run --rm -v "$PWD":/work stumbru-sysml
sysml -validate model                                     # model check
sysml -quiet -e 'Panel::panel.Q1.F1.F8.connectedLoad' model   # = 6050.0 [W]
sysml -quiet -e 'Panel::panel.Q1.connectedLoad' -e 'Panel::panel.Q1.connectedLoadL2' model
sysml -quiet -e 'Rooms::apartment.kidsRoom.L1.power' model   # 82.0 [W], sum of its bulbs
sysml -quiet -render '#tree:Panel::panel' -render-form text model   # element tree
sysml model                                               # interactive REPL
```

Notes on writing the model so the tool can evaluate it (OpenSysML v0.11.0):

- Optional reference lists need `default = ()`; an unset list is
  "undetermined" and makes every sum over it undetermined too.
- A collection filled by subsetting (`part ledBulbs : X[4] :> bulbs;`) is not
  visible through the general feature, so lights sum their own bulb parts
  (`:>> power = RealFunctions::sum(ledBulbs.power);`) and breakers list their
  nested breakers in `ref :>> downstream = (...)`.
- `RealFunctions::sum` is typed `Real`; binding it to a `PowerValue` feature needs
  `as PowerValue` (the tool then warns about the cast, but evaluates correctly).
- Unknown power counts as 0 W in the roll-up; the viewer marks such devices with "? W".
