package Panel {
    doc /* Distribution board: main switch, RCDs and circuit breakers.
         * Each circuit breaker lists, via `feeds`, which devices from
         * Rooms.sysml are on its circuit.
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

        // Assumed: the top-row breakers to the right of the RCD are fed through it.
        // Verify with the RCD test button.
        part QD1 : Rcd {
            :>> label = "QD1";
            :>> product = "ETI EFI-4";
            :>> ratedCurrent = 25 [A];
            :>> residualCurrent = 0.03 [A];
            :>> rcdType = RcdType::AC;
            :>> poles = 4;

            part QF2 : CircuitBreaker {
                comment /* Study / kids' room outlets. Chart position 4. */
                :>> label = "QF2";
                :>> product = "ETI ETIMAT 6";
                :>> tripCurve = TripCurve::C;
                :>> ratedCurrent = 16 [A];
                :>> breakingCapacity = 6000 [A];
            }

            part QF3 : CircuitBreaker {
                comment /* Bedroom outlets: TV, vacuum, Wi-Fi, RPi, monitor,
                         * bedside lights + outlets. Chart position 5.
                         */
                :>> label = "QF3";
                :>> product = "ETI ETIMAT 6";
                :>> tripCurve = TripCurve::C;
                :>> ratedCurrent = 16 [A];
                :>> breakingCapacity = 6000 [A];
            }

            part QF4 : CircuitBreaker {
                comment /* Bathroom mirror light + outlets. Chart position 6. */
                :>> label = "QF4";
                :>> product = "ETI ETIMAT 10";
                :>> tripCurve = TripCurve::B;
                :>> ratedCurrent = 10 [A];
                :>> breakingCapacity = 10000 [A];
            }

            part QF5 : CircuitBreaker {
                comment /* Unknown circuit. Chart position 7. */
                :>> label = "QF5";
                :>> product = "ETI ETIMAT 6";
                :>> tripCurve = TripCurve::C;
                :>> ratedCurrent = 16 [A];
                :>> breakingCapacity = 6000 [A];
            }

            part QF6 : CircuitBreaker {
                comment /* Unknown circuit. Chart position 8. */
                :>> label = "QF6";
                :>> product = "ETI ETIMAT 6";
                :>> tripCurve = TripCurve::C;
                :>> ratedCurrent = 16 [A];
                :>> breakingCapacity = 6000 [A];
            }
        }

        // ----- Bottom row -----

        part QF7 : CircuitBreaker {
            comment /* Oven + hob. Chart positions 9-11. */
            :>> label = "QF7";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 16 [A];
            :>> breakingCapacity = 6000 [A];
            :>> poles = 3;
        }

        part QF8 : CircuitBreaker {
            comment /* Kitchen lighting + outlet. Chart position 12. */
            :>> label = "QF8";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 16 [A];
            :>> breakingCapacity = 6000 [A];
        }

        part QF9 : CircuitBreaker {
            comment /* Unknown circuit: switching it off turns nothing off. Chart position 13. */
            :>> label = "QF9";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 16 [A];
            :>> breakingCapacity = 6000 [A];
        }

        part QF10 : CircuitBreaker {
            comment /* Fridge, microwave. Chart position 14. */
            :>> label = "QF10";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 16 [A];
            :>> breakingCapacity = 6000 [A];
        }

        part QF11 : CircuitBreaker {
            comment /* Lighting: hallway, living room, bedroom, kids' room. Chart position 15. */
            :>> label = "QF11";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 10 [A];
            :>> breakingCapacity = 6000 [A];
        }

        part QF12 : CircuitBreaker {
            comment /* Bathroom main lighting. Chart position 16. */
            :>> label = "QF12";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 10 [A];
            :>> breakingCapacity = 6000 [A];
        }

        part QF13 : CircuitBreaker {
            comment /* Modem. Chart position 17. */
            :>> label = "QF13";
            :>> product = "ETI ETIMAT 6";
            :>> tripCurve = TripCurve::C;
            :>> ratedCurrent = 10 [A];
            :>> breakingCapacity = 6000 [A];
        }
    }
}
