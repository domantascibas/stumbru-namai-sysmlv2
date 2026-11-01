package Panel {
    doc /* Distribution board: main switch, RCDs and circuit breakers.
         * Each circuit breaker lists, via `feeds`, which devices from
         * Rooms.sysml are on its circuit.
         */

    private import ElectricalLibrary::*;
    private import Rooms::*;
    private import SI::*;

    part panel : DistributionBoard {

        part Q0 : MainSwitch {
            :>> label = "Q0";
            :>> name = "Main";
            :>> ratedCurrent = 25 [A];
        }

        part F1 : Rcd {
            :>> label = "F1";
            :>> ratedCurrent = 40 [A];
            :>> residualCurrent = 0.03 [A];
            :>> rcdType = RcdType::A;
            :>> poles = 2;

            part Q1 : CircuitBreaker {
                :>> label = "Q1";
                :>> name = "Lighting";
                :>> ratedCurrent = 10 [A];
                :>> cableCrossSectionMm2 = 1.5;
                ref :>> feeds = (
                    apartment.hallway.L1,
                    apartment.kitchen.L1,
                    apartment.livingRoom.L1,
                    apartment.bedroom.L1,
                    apartment.bathroom.L1
                );
            }

            part Q2 : CircuitBreaker {
                :>> label = "Q2";
                :>> name = "Kitchen outlets";
                :>> ratedCurrent = 16 [A];
                :>> cableCrossSectionMm2 = 2.5;
                ref :>> feeds = (
                    apartment.kitchen.R1,
                    apartment.kitchen.R2
                );
            }

            part Q3 : CircuitBreaker {
                :>> label = "Q3";
                :>> name = "Room outlets";
                :>> ratedCurrent = 16 [A];
                :>> cableCrossSectionMm2 = 2.5;
                ref :>> feeds = (
                    apartment.hallway.R1,
                    apartment.livingRoom.R1,
                    apartment.livingRoom.R2,
                    apartment.bedroom.R1,
                    apartment.bathroom.R1
                );
            }
        }

        // High-power fixed appliances are often not behind the shared RCD
        part Q4 : CircuitBreaker {
            :>> label = "Q4";
            :>> name = "Hob";
            :>> ratedCurrent = 32 [A];
            :>> cableCrossSectionMm2 = 6;
            ref :>> feeds = apartment.kitchen.hob;
        }
    }
}
