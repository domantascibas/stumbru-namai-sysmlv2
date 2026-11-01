package Panel {
    doc /* Distribution board: main switch, RCDs and circuit breakers.
         * Each circuit breaker lists, via `feeds`, which devices from
         * Rooms.sysml are on its circuit.
         *
         * Circuits were mapped by switching breakers off one at a time
         * (2026-11-01).
         *
         * Labels follow common Lithuanian practice: QF = circuit breaker,
         * QD = RCD. "Chart position" in comments refers to the numbering on
         * the hand-drawn chart taped inside the panel door.
         */

    private import ElectricalLibrary::*;
    private import Rooms::*;
    private import SI::*;

    part panel : DistributionBoard {

        // ----- Top row -----

        part QF1 : CircuitBreaker {
            comment /* Main breaker for the whole apartment. Chart positions 1-3. */
            :>> label = "QF1";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 25 [A];
            :>> breakingCapacity = 6000 [A];
            :>> poles = 3;
        }

        // RCD test confirmed: all circuits (QF2-QF13) are behind QD1
        part QD1 : Rcd {
            :>> label = "QD1";
            :>> product = "ETI EFI-4";
            :>> ratedCurrent = 25 [A];
            :>> residualCurrent = 0.03 [A];
            :>> rcdType = RcdType::AC;
            :>> poles = 4;

            part QF2 : CircuitBreaker {
                comment /* Kids' room outlets and cloud light, hallway outlets. Chart position 4. */
                :>> label = "QF2";
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

            part QF3 : CircuitBreaker {
                comment /* Bedroom outlets and reading lights, living room outlets (sofa, TV cabinet,
                         * bookshelf). Chart position 5. */
                :>> label = "QF3";
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

            part QF4 : CircuitBreaker {
                comment /* Bathroom mirror light and shaver outlet. Chart position 6. */
                :>> label = "QF4";
                :>> product = "ETI ETIMAT 10";
                :>> tripCurve = TripCurve::B;
                :>> ratedCurrent = 10 [A];
                :>> breakingCapacity = 10000 [A];
                ref :>> feeds = (
                    apartment.bathroom.L2,
                    apartment.bathroom.R2
                );
            }

            part QF5 : CircuitBreaker {
                comment /* Bathroom towel rail. Chart position 7. */
                :>> label = "QF5";
                :>> product = "ETI ETIMAT 6";
                :>> tripCurve = TripCurve::C;
                :>> ratedCurrent = 16 [A];
                :>> breakingCapacity = 6000 [A];
                ref :>> feeds = apartment.bathroom.towelRail;
            }

            part QF6 : CircuitBreaker {
                comment /* Bathroom floor heating. Chart position 8. */
                :>> label = "QF6";
                :>> product = "ETI ETIMAT 6";
                :>> tripCurve = TripCurve::C;
                :>> ratedCurrent = 16 [A];
                :>> breakingCapacity = 6000 [A];
                ref :>> feeds = apartment.bathroom.floorHeating;
            }

            // ----- Bottom row -----

            part QF7 : CircuitBreaker {
                comment /* Hob and oven. Chart positions 9-11. */
                :>> label = "QF7";
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

            part QF8 : CircuitBreaker {
                comment /* Kitchen: dishwasher, sink and coffee machine outlets, worktop LED strip.
                         * Chart position 12. */
                :>> label = "QF8";
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

            part QF9 : CircuitBreaker {
                comment /* Bathroom: washing machine outlets. Chart position 13. */
                :>> label = "QF9";
                :>> product = "ETI ETIMAT 6";
                :>> tripCurve = TripCurve::C;
                :>> ratedCurrent = 16 [A];
                :>> breakingCapacity = 6000 [A];
                ref :>> feeds = (
                    apartment.bathroom.R1,
                    apartment.bathroom.R3
                );
            }

            part QF10 : CircuitBreaker {
                comment /* Kitchen: fridge, microwave, hood. Chart position 14. */
                :>> label = "QF10";
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

            part QF11 : CircuitBreaker {
                comment /* Main lighting in all rooms except bathroom, balcony light, bookshelf
                         * cable X1. Chart position 15. */
                :>> label = "QF11";
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

            part QF12 : CircuitBreaker {
                comment /* Bathroom main lighting. Chart position 16. */
                :>> label = "QF12";
                :>> product = "ETI ETIMAT 6";
                :>> tripCurve = TripCurve::C;
                :>> ratedCurrent = 10 [A];
                :>> breakingCapacity = 6000 [A];
                ref :>> feeds = apartment.bathroom.L1;
            }

            part QF13 : CircuitBreaker {
                comment /* Modem box. Chart position 17. */
                :>> label = "QF13";
                :>> product = "ETI ETIMAT 6";
                :>> tripCurve = TripCurve::C;
                :>> ratedCurrent = 10 [A];
                :>> breakingCapacity = 6000 [A];
                ref :>> feeds = apartment.hallway.modemBox;
            }
        }
    }
}
