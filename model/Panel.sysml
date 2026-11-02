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
        require constraint { breaker.connectedLoad / breaker.nominalVoltage <= breaker.ratedCurrent }
    }

    part panel : DistributionBoard {
        // External ports with ref bind to internal circuit breakers (book pattern #2)
        port gridIn : ~EnergyPort {
            ref bind = Q1.lineIn;
        }
        port circuitF2 : EnergyPort {
            ref bind = Q1.F1.F2.lineOut;
        }
        port circuitF3 : EnergyPort {
            ref bind = Q1.F1.F3.lineOut;
        }
        port circuitF4 : EnergyPort {
            ref bind = Q1.F1.F4.lineOut;
        }
        port circuitF5 : EnergyPort {
            ref bind = Q1.F1.F5.lineOut;
        }
        port circuitF6 : EnergyPort {
            ref bind = Q1.F1.F6.lineOut;
        }
        port circuitF7 : EnergyPort {
            ref bind = Q1.F1.F7.lineOut;
        }
        port circuitF8 : EnergyPort {
            ref bind = Q1.F1.F8.lineOut;
        }
        port circuitF9 : EnergyPort {
            ref bind = Q1.F1.F9.lineOut;
        }
        port circuitF10 : EnergyPort {
            ref bind = Q1.F1.F10.lineOut;
        }
        port circuitF11 : EnergyPort {
            ref bind = Q1.F1.F11.lineOut;
        }
        port circuitF12 : EnergyPort {
            ref bind = Q1.F1.F12.lineOut;
        }
        port circuitF13 : EnergyPort {
            ref bind = Q1.F1.F13.lineOut;
        }

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

            // Connect main breaker output to RCD input (book pattern #4: Wired interface)
            interface mainToRcd : Wired connect Q1.lineOut to F1.lineIn;

            // RCD test confirmed: all circuits (F2-F13) are behind F1
            part F1 : Rcd {
                :>> label = "F1";
                :>> name = "Nuotėkio relė 30 mA";
                :>> product = "ETI EFI-4";
                :>> ratedCurrent = 25 [SI::A];
                :>> residualCurrent = 0.03 [SI::A];
                :>> rcdType = RcdType::AC;
                :>> poles = 4;

                // Connect RCD output to all circuit breakers (book pattern #4)
                interface rcdToF2 : Wired connect F1.lineOut to F2.lineIn;
                interface rcdToF3 : Wired connect F1.lineOut to F3.lineIn;
                interface rcdToF4 : Wired connect F1.lineOut to F4.lineIn;
                interface rcdToF5 : Wired connect F1.lineOut to F5.lineIn;
                interface rcdToF6 : Wired connect F1.lineOut to F6.lineIn;
                interface rcdToF7 : Wired connect F1.lineOut to F7.lineIn;
                interface rcdToF8 : Wired connect F1.lineOut to F8.lineIn;
                interface rcdToF9 : Wired connect F1.lineOut to F9.lineIn;
                interface rcdToF10 : Wired connect F1.lineOut to F10.lineIn;
                interface rcdToF11 : Wired connect F1.lineOut to F11.lineIn;
                interface rcdToF12 : Wired connect F1.lineOut to F12.lineIn;
                interface rcdToF13 : Wired connect F1.lineOut to F13.lineIn;

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

                // Connections from circuit breakers to devices (book pattern #4, #5)
                // Using ad-hoc interfaces for unique connections
                interface f2ToR1 : Wired connect F2.lineOut to apartment.kidsRoom.R1.plugPoint;
                interface f2ToR2 : Wired connect F2.lineOut to apartment.kidsRoom.R2.plugPoint;
                interface f2ToL2 : Wired connect F2.lineOut to apartment.kidsRoom.L2.plug;
                interface f2ToHallwayR1 : Wired connect F2.lineOut to apartment.hallway.R1.plugPoint;
                interface f2ToHallwayR2 : Wired connect F2.lineOut to apartment.hallway.R2.plugPoint;

                interface f3ToBedroomR1 : Wired connect F3.lineOut to apartment.bedroom.R1.plugPoint;
                interface f3ToBedroomR2 : Wired connect F3.lineOut to apartment.bedroom.R2.plugPoint;
                interface f3ToBedroomL2 : Wired connect F3.lineOut to apartment.bedroom.L2.plug;
                interface f3ToBedroomL3 : Wired connect F3.lineOut to apartment.bedroom.L3.plug;

                interface f7ToHob : Wired connect F7.lineOut to apartment.livingKitchen.hob.plug;
                interface f7ToR4 : Wired connect F7.lineOut to apartment.livingKitchen.R4.plugPoint;

                interface f11ToLivingL1 : Wired connect F11.lineOut to apartment.livingKitchen.L1.plug;
                interface f11ToLivingL2 : Wired connect F11.lineOut to apartment.livingKitchen.L2.plug;
                interface f12ToBathroomL1 : Wired connect F12.lineOut to apartment.bathroom.L1.plug;
                interface f13ToModemBox : Wired connect F13.lineOut to apartment.hallway.modemBox.plug;

                // Power budget constraints (book pattern #6)
                assert constraint F2PowerBudget {
                    apartment.kidsRoom.R1.connectedLoad + apartment.kidsRoom.R2.connectedLoad + 
                    apartment.kidsRoom.L2.power + 
                    apartment.hallway.R1.connectedLoad + apartment.hallway.R2.connectedLoad
                    <= F2.maxLoadPower
                }

                assert constraint F7PowerBudget {
                    apartment.livingKitchen.hob.power + apartment.livingKitchen.R4.connectedLoad
                    <= F7.maxLoadPower
                }

                assert constraint F11PowerBudget {
                    apartment.livingKitchen.L1.power + apartment.livingKitchen.L2.power
                    <= F11.maxLoadPower
                }
            }
        }
    }
}
