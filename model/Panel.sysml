package Panel {
    doc /* Distribution board: main switch, RCDs and circuit breakers.
         * Each circuit breaker lists, via `feeds`, which devices from
         * Rooms.sysml are on its circuit.
         *
         * Circuits were mapped by switching breakers off one at a time
         * (2026-11-01).
         *
         * Labels follow IEC 81346-2 (EN 81346-2) letter codes as commonly used
         * in European panels: Q = main switch, F = protective device (RCD,
         * circuit breaker). `label` is the sticker on the device, `name` is the
         * short title in the legend inside the panel door. "Chart position" in
         * comments refers to the numbering on the old hand-drawn chart.
         *
         * Phases: taken from the installer's A/B/C marks on each device's top
         * terminal (A = L1, B = L2, C = L3), checked from photos (2026-11-01).
         * Feed wire colours: A brown, B grey, C black (L2/L3 colours are swapped
         * compared to IEC 60445, the letters are what counts).
         */

    private import ElectricalLibrary::*;
    private import Rooms::*;
    private import SI::*;

    requirement def CircuitProtected {
        doc /* Circuit current must not exceed breaker rating. */
        subject breaker : CircuitBreaker;
        require constraint { breaker.loadCurrent <= breaker.ratedCurrent }
    }

    part panel : DistributionBoard {
        // Boundary ports delegated to the breakers inside (book pattern #2:
        // `ref bind chargePort = battery.chargeInPort;`). Connections from outside
        // use these ports instead of reaching into the breakers. The circuit ports are
        // references (`ref port`): a composite port would get its own instance, whose
        // empty `ratedCurrent` then conflicts with the breaker's bound rating.
        ref bind gridIn = Q1.lineIn;
        ref port circuitF2 : EnergyPort;
        ref port circuitF3 : EnergyPort;
        ref port circuitF4 : EnergyPort;
        ref port circuitF5 : EnergyPort;
        ref port circuitF6 : EnergyPort;
        ref port circuitF7 : EnergyPort;
        ref port circuitF8 : EnergyPort;
        ref port circuitF9 : EnergyPort;
        ref port circuitF10 : EnergyPort;
        ref port circuitF11 : EnergyPort;
        ref port circuitF12 : EnergyPort;
        ref port circuitF13 : EnergyPort;
        ref bind circuitF2 = Q1.F1.F2.lineOut;
        ref bind circuitF3 = Q1.F1.F3.lineOut;
        ref bind circuitF4 = Q1.F1.F4.lineOut;
        ref bind circuitF5 = Q1.F1.F5.lineOut;
        ref bind circuitF6 = Q1.F1.F6.lineOut;
        ref bind circuitF7 = Q1.F1.F7.lineOut;
        ref bind circuitF8 = Q1.F1.F8.lineOut;
        ref bind circuitF9 = Q1.F1.F9.lineOut;
        ref bind circuitF10 = Q1.F1.F10.lineOut;
        ref bind circuitF11 = Q1.F1.F11.lineOut;
        ref bind circuitF12 = Q1.F1.F12.lineOut;
        ref bind circuitF13 = Q1.F1.F13.lineOut;

        // ----- Top row -----

        part Q1 : CircuitBreaker {
            comment /* Main breaker for the whole apartment. Chart positions 1-3. */
            :>> label = "Q1";
            :>> name = "Įvadas";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 25 [SI::A];
            :>> breakingCapacity = 6000 [SI::A];
            :>> poles = 3;
            ref :>> downstream = F1;

            // Connect main breaker output to RCD input (book pattern #4: Wired interface)
            interface mainToRcd : Wired connect lineOut to F1.lineIn;

            // RCD test confirmed: all circuits (F2-F13) are behind F1
            part F1 : Rcd {
                :>> label = "F1";
                :>> name = "Nuotėkio relė 30 mA";
                :>> product = "ETI EFI-4";
                :>> ratedCurrent = 25 [SI::A];
                :>> residualCurrent = 0.03 [SI::A];
                :>> rcdType = RcdType::AC;
                :>> poles = 4;
                ref :>> downstream = (F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F13);

                // Connect RCD output to all circuit breakers (book pattern #4)
                interface rcdToF2 : Wired connect lineOut to F2.lineIn;
                interface rcdToF3 : Wired connect lineOut to F3.lineIn;
                interface rcdToF4 : Wired connect lineOut to F4.lineIn;
                interface rcdToF5 : Wired connect lineOut to F5.lineIn;
                interface rcdToF6 : Wired connect lineOut to F6.lineIn;
                interface rcdToF7 : Wired connect lineOut to F7.lineIn;
                interface rcdToF8 : Wired connect lineOut to F8.lineIn;
                interface rcdToF9 : Wired connect lineOut to F9.lineIn;
                interface rcdToF10 : Wired connect lineOut to F10.lineIn;
                interface rcdToF11 : Wired connect lineOut to F11.lineIn;
                interface rcdToF12 : Wired connect lineOut to F12.lineIn;
                interface rcdToF13 : Wired connect lineOut to F13.lineIn;

                part F2 : CircuitBreaker {
                    comment /* Kids' room outlets and cloud light, hallway outlets. Chart position 4. */
                    :>> label = "F2";
                    :>> phase = Phase::L1;
                    :>> name = "Vaikų k. ir koridoriaus rozetės";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = (
                        apartment.kidsRoom.R1,
                        apartment.kidsRoom.R2,
                        apartment.kidsRoom.R3,
                        apartment.kidsRoom.R4,
                        apartment.kidsRoom.R5,
                        apartment.kidsRoom.L2,
                        apartment.hallway.R1,
                        apartment.hallway.R2
                    );
                }

                part F3 : CircuitBreaker {
                    comment /* Bedroom outlets and reading lights, living room outlets (sofa, TV cabinet,
                             * bookshelf). Chart position 5.
                             * Phase mark looks like "A" written over "B": to be verified with a tester. */
                    :>> label = "F3";
                    :>> phase = Phase::L1;
                    :>> name = "Miegamojo ir svetainės rozetės";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = (
                        apartment.bedroom.R1,
                        apartment.bedroom.R2,
                        apartment.bedroom.R3,
                        apartment.bedroom.R4,
                        apartment.bedroom.L2,
                        apartment.bedroom.L3,
                        apartment.livingKitchen.R7,
                        apartment.livingKitchen.R8,
                        apartment.livingKitchen.R9,
                        apartment.livingKitchen.R10,
                        apartment.livingKitchen.R11
                    );
                }

                part F4 : CircuitBreaker {
                    comment /* Bathroom mirror light and shaver outlet. Chart position 6. */
                    :>> label = "F4";
                    :>> phase = Phase::L3;
                    :>> name = "Vonia: veidrodis";
                    :>> product = "ETI ETIMAT 10";
                    :>> tripCurve = TripCurve::B;
                    :>> ratedCurrent = 10 [SI::A];
                    :>> breakingCapacity = 10000 [SI::A];
                    ref :>> feeds = (
                        apartment.bathroom.L2,
                        apartment.bathroom.R2
                    );
                }

                part F5 : CircuitBreaker {
                    comment /* Bathroom towel rail. Chart position 7. */
                    :>> label = "F5";
                    :>> phase = Phase::L3;
                    :>> name = "Vonia: gyvatukas";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = apartment.bathroom.towelRail;
                }

                part F6 : CircuitBreaker {
                    comment /* Bathroom floor heating. Chart position 8. */
                    :>> label = "F6";
                    :>> phase = Phase::L3;
                    :>> name = "Vonia: grindų šildymas";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = apartment.bathroom.floorHeating;
                }

                // ----- Bottom row -----

                part F7 : CircuitBreaker {
                    comment /* Hob and oven. Chart positions 9-11. 3-pole: uses all phases (A, B, C). */
                    :>> label = "F7";
                    :>> name = "Kaitlentė ir orkaitė";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    :>> poles = 3;
                    ref :>> feeds = (
                        apartment.livingKitchen.hob,
                        apartment.livingKitchen.R4
                    );
                }

                part F8 : CircuitBreaker {
                    comment /* Kitchen: dishwasher, sink and coffee machine outlets, worktop LED strip.
                             * Chart position 12. */
                    :>> label = "F8";
                    :>> phase = Phase::L2;
                    :>> name = "Virtuvė: indaplovė ir stalviršis";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = (
                        apartment.livingKitchen.R3,
                        apartment.livingKitchen.R5,
                        apartment.livingKitchen.R6,
                        apartment.livingKitchen.L4
                    );
                }

                part F9 : CircuitBreaker {
                    comment /* Bathroom: washing machine outlets. Chart position 13. */
                    :>> label = "F9";
                    :>> phase = Phase::L2;
                    :>> name = "Vonia: skalbyklė";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = (
                        apartment.bathroom.R1,
                        apartment.bathroom.R3
                    );
                }

                part F10 : CircuitBreaker {
                    comment /* Kitchen: fridge, microwave, hood. Chart position 14. */
                    :>> label = "F10";
                    :>> phase = Phase::L2;
                    :>> name = "Virtuvė: šaldytuvas ir mikrobangė";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = (
                        apartment.livingKitchen.R1,
                        apartment.livingKitchen.R2,
                        apartment.livingKitchen.hood
                    );
                }

                part F11 : CircuitBreaker {
                    comment /* Main lighting in all rooms except bathroom, balcony light, bookshelf
                             * cable X1. Chart position 15. */
                    :>> label = "F11";
                    :>> phase = Phase::L1;
                    :>> name = "Apšvietimas (be vonios)";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 10 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = (
                        apartment.livingKitchen.L1,
                        apartment.livingKitchen.L2,
                        apartment.livingKitchen.L3,
                        apartment.bedroom.L1,
                        apartment.kidsRoom.L1,
                        apartment.hallway.L1,
                        apartment.balcony.L1,
                        apartment.livingKitchen.X1
                    );
                }

                part F12 : CircuitBreaker {
                    comment /* Bathroom main lighting. Chart position 16. */
                    :>> label = "F12";
                    :>> phase = Phase::L3;
                    :>> name = "Vonia: apšvietimas";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 10 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = apartment.bathroom.L1;
                }

                part F13 : CircuitBreaker {
                    comment /* Modem box. Chart position 17. */
                    :>> label = "F13";
                    :>> phase = Phase::L1;
                    :>> name = "Modemas";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 10 [SI::A];
                    :>> breakingCapacity = 6000 [SI::A];
                    ref :>> feeds = apartment.hallway.modemBox;
                }

                // Power budget constraints (book pattern #6): the rated load connected to a
                // circuit (`connectedLoad`, summed over everything it feeds) against what the
                // breaker allows. Rated loads all at once is a worst case, not the everyday load.

                assert constraint F2PowerBudget { F2.connectedLoad <= F2.maxLoadPower }
                assert constraint F3PowerBudget { F3.connectedLoad <= F3.maxLoadPower }
                assert constraint F4PowerBudget { F4.connectedLoad <= F4.maxLoadPower }
                assert constraint F5PowerBudget { F5.connectedLoad <= F5.maxLoadPower }
                assert constraint F6PowerBudget { F6.connectedLoad <= F6.maxLoadPower }
                assert constraint F8PowerBudget { F8.connectedLoad <= F8.maxLoadPower }
                assert constraint F9PowerBudget { F9.connectedLoad <= F9.maxLoadPower }
                assert constraint F10PowerBudget { F10.connectedLoad <= F10.maxLoadPower }
                assert constraint F11PowerBudget { F11.connectedLoad <= F11.maxLoadPower }
                assert constraint F12PowerBudget { F12.connectedLoad <= F12.maxLoadPower }
                assert constraint F13PowerBudget { F13.connectedLoad <= F13.maxLoadPower }

                // 3-pole: the rating applies per phase.
                assert constraint F7PowerBudget {
                    F7.connectedLoadL1 <= F7.maxLoadPower and
                    F7.connectedLoadL2 <= F7.maxLoadPower and
                    F7.connectedLoadL3 <= F7.maxLoadPower
                }

            }
        }
    }

    // System context (book pattern: the connections between the fuse box and the
    // installation are owned by the part that contains both). The fuse box is seen
    // only through its boundary ports.
    part installation {
        ref part fuseBox :> panel = panel;
        ref part home :> apartment = apartment;

        interface f2ToR1 : Wired connect fuseBox.circuitF2 to home.kidsRoom.R1.lineIn;
        interface f2ToR2 : Wired connect fuseBox.circuitF2 to home.kidsRoom.R2.lineIn;
        interface f2ToL2 : Wired connect fuseBox.circuitF2 to home.kidsRoom.L2.plug;
        interface f2ToHallwayR1 : Wired connect fuseBox.circuitF2 to home.hallway.R1.lineIn;
        interface f2ToHallwayR2 : Wired connect fuseBox.circuitF2 to home.hallway.R2.lineIn;

        interface f3ToBedroomR1 : Wired connect fuseBox.circuitF3 to home.bedroom.R1.lineIn;
        interface f3ToBedroomR2 : Wired connect fuseBox.circuitF3 to home.bedroom.R2.lineIn;
        interface f3ToBedroomL2 : Wired connect fuseBox.circuitF3 to home.bedroom.L2.plug;
        interface f3ToBedroomL3 : Wired connect fuseBox.circuitF3 to home.bedroom.L3.plug;

        interface f7ToHob : Wired connect fuseBox.circuitF7 to home.livingKitchen.hob.plug;
        interface f7ToR4 : Wired connect fuseBox.circuitF7 to home.livingKitchen.R4.lineIn;

        interface f11ToLivingL1 : Wired connect fuseBox.circuitF11 to home.livingKitchen.L1.plug;
        interface f11ToLivingL2 : Wired connect fuseBox.circuitF11 to home.livingKitchen.L2.plug;
        interface f12ToBathroomL1 : Wired connect fuseBox.circuitF12 to home.bathroom.L1.plug;
        interface f13ToModemBox : Wired connect fuseBox.circuitF13 to home.hallway.modemBox.plug;

        // F2 remaining: R3, R4, R5
        interface f2ToR3 : Wired connect fuseBox.circuitF2 to home.kidsRoom.R3.lineIn;
        interface f2ToR4 : Wired connect fuseBox.circuitF2 to home.kidsRoom.R4.lineIn;
        interface f2ToR5 : Wired connect fuseBox.circuitF2 to home.kidsRoom.R5.lineIn;

        // F3 remaining: R3, R4, R7, R8, R9, R10, R11
        interface f3ToBedroomR3 : Wired connect fuseBox.circuitF3 to home.bedroom.R3.lineIn;
        interface f3ToBedroomR4 : Wired connect fuseBox.circuitF3 to home.bedroom.R4.lineIn;
        interface f3ToLivingR7 : Wired connect fuseBox.circuitF3 to home.livingKitchen.R7.lineIn;
        interface f3ToLivingR8 : Wired connect fuseBox.circuitF3 to home.livingKitchen.R8.lineIn;
        interface f3ToLivingR9 : Wired connect fuseBox.circuitF3 to home.livingKitchen.R9.lineIn;
        interface f3ToLivingR10 : Wired connect fuseBox.circuitF3 to home.livingKitchen.R10.lineIn;
        interface f3ToLivingR11 : Wired connect fuseBox.circuitF3 to home.livingKitchen.R11.lineIn;

        // F4: bathroom.L2, R2
        interface f4ToBathroomL2 : Wired connect fuseBox.circuitF4 to home.bathroom.L2.plug;
        interface f4ToBathroomR2 : Wired connect fuseBox.circuitF4 to home.bathroom.R2.lineIn;

        // F5: bathroom.towelRail
        interface f5ToTowelRail : Wired connect fuseBox.circuitF5 to home.bathroom.towelRail.plug;

        // F6: bathroom.floorHeating
        interface f6ToFloorHeating : Wired connect fuseBox.circuitF6 to home.bathroom.floorHeating.plug;

        // F8: livingKitchen.R3, R5, R6, L4
        interface f8ToR3 : Wired connect fuseBox.circuitF8 to home.livingKitchen.R3.lineIn;
        interface f8ToR5 : Wired connect fuseBox.circuitF8 to home.livingKitchen.R5.lineIn;
        interface f8ToR6 : Wired connect fuseBox.circuitF8 to home.livingKitchen.R6.lineIn;
        interface f8ToL4 : Wired connect fuseBox.circuitF8 to home.livingKitchen.L4.plug;

        // F9: bathroom.R1, R3
        interface f9ToR1 : Wired connect fuseBox.circuitF9 to home.bathroom.R1.lineIn;
        interface f9ToR3 : Wired connect fuseBox.circuitF9 to home.bathroom.R3.lineIn;

        // F10: livingKitchen.R1, R2, hood
        interface f10ToR1 : Wired connect fuseBox.circuitF10 to home.livingKitchen.R1.lineIn;
        interface f10ToR2 : Wired connect fuseBox.circuitF10 to home.livingKitchen.R2.lineIn;
        interface f10ToHood : Wired connect fuseBox.circuitF10 to home.livingKitchen.hood.plug;

        // F11 remaining: L3, bedroom.L1, kidsRoom.L1, hallway.L1, balcony.L1, X1
        interface f11ToLivingL3 : Wired connect fuseBox.circuitF11 to home.livingKitchen.L3.plug;
        interface f11ToBedroomL1 : Wired connect fuseBox.circuitF11 to home.bedroom.L1.plug;
        interface f11ToKidsL1 : Wired connect fuseBox.circuitF11 to home.kidsRoom.L1.plug;
        interface f11ToHallwayL1 : Wired connect fuseBox.circuitF11 to home.hallway.L1.plug;
        interface f11ToBalconyL1 : Wired connect fuseBox.circuitF11 to home.balcony.L1.plug;
        interface f11ToX1 : Wired connect fuseBox.circuitF11 to home.livingKitchen.X1.plug;
    }
}
