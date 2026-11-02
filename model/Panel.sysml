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

    part panel : DistributionBoard {

        // ----- Top row -----

        part Q1 : CircuitBreaker {
            comment /* Main breaker for the whole apartment. Chart positions 1-3. */
            :>> label = "Q1";
            :>> name = "Įvadas";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 25 [A];
            :>> breakingCapacity = 6000 [A];
            :>> poles = 3;
            ref :>> downstream = F1;

            // RCD test confirmed: all circuits (F2-F13) are behind F1
            part F1 : Rcd {
                :>> label = "F1";
                :>> name = "Nuotėkio relė 30 mA";
                :>> product = "ETI EFI-4";
                :>> ratedCurrent = 25 [A];
                :>> residualCurrent = 0.03 [A];
                :>> rcdType = RcdType::AC;
                :>> poles = 4;
                ref :>> downstream = (F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F13);

                part F2 : CircuitBreaker {
                    comment /* Kids' room outlets and cloud light, hallway outlets. Chart position 4. */
                    :>> label = "F2";
                    :>> phase = Phase::L1;
                    :>> name = "Vaikų k. ir koridoriaus rozetės";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [A];
                    :>> breakingCapacity = 6000 [A];
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
                    :>> ratedCurrent = 16 [A];
                    :>> breakingCapacity = 6000 [A];
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
                    :>> ratedCurrent = 10 [A];
                    :>> breakingCapacity = 10000 [A];
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
                    :>> ratedCurrent = 16 [A];
                    :>> breakingCapacity = 6000 [A];
                    ref :>> feeds = apartment.bathroom.towelRail;
                }

                part F6 : CircuitBreaker {
                    comment /* Bathroom floor heating. Chart position 8. */
                    :>> label = "F6";
                    :>> phase = Phase::L3;
                    :>> name = "Vonia: grindų šildymas";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [A];
                    :>> breakingCapacity = 6000 [A];
                    ref :>> feeds = apartment.bathroom.floorHeating;
                }

                // ----- Bottom row -----

                part F7 : CircuitBreaker {
                    comment /* Hob and oven. Chart positions 9-11. 3-pole: uses all phases (A, B, C). */
                    :>> label = "F7";
                    :>> name = "Kaitlentė ir orkaitė";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 16 [A];
                    :>> breakingCapacity = 6000 [A];
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
                    :>> ratedCurrent = 16 [A];
                    :>> breakingCapacity = 6000 [A];
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
                    :>> ratedCurrent = 16 [A];
                    :>> breakingCapacity = 6000 [A];
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
                    :>> ratedCurrent = 16 [A];
                    :>> breakingCapacity = 6000 [A];
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
                    :>> ratedCurrent = 10 [A];
                    :>> breakingCapacity = 6000 [A];
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
                    :>> ratedCurrent = 10 [A];
                    :>> breakingCapacity = 6000 [A];
                    ref :>> feeds = apartment.bathroom.L1;
                }

                part F13 : CircuitBreaker {
                    comment /* Modem box. Chart position 17. */
                    :>> label = "F13";
                    :>> phase = Phase::L1;
                    :>> name = "Modemas";
                    :>> product = "ETI ETIMAT 6";
                    :>> tripCurve = TripCurve::C;
                    :>> ratedCurrent = 10 [A];
                    :>> breakingCapacity = 6000 [A];
                    ref :>> feeds = apartment.hallway.modemBox;
                }
            }
        }
    }
}
