package Rooms {
    doc /* The apartment's rooms and what is installed in each.
         * This describes WHERE a device is; which circuit it is
         * connected to is described in Panel.sysml.
         */

    private import ElectricalLibrary::*;
    private import SI::*;

    part apartment {

        // Living room and kitchen are one open space
        part livingKitchen : Room {
            doc /* Svetainė + virtuvė */

            // ----- Lighting -----

            part L1 : Light {
                doc /* Šviesa virš valgomojo stalo */
                :>> label = "L1";
                :>> bulbCount = 1;
            }

            part L2 : Light {
                doc /* Pagrindinis svetainės apšvietimas */
                :>> label = "L2";
                :>> bulbCount = 1;
            }

            part L3 : Light {
                doc /* Virtuvės zonos apšvietimas */
                :>> label = "L3";
                :>> bulbCount = 4;
            }

            part L4 : Light {
                doc /* Virtuvės stalviršio apšvietimas, LED juosta */
                :>> label = "L4";
            }

            // ----- Fixed appliances -----

            part hood : FixedAppliance {
                doc /* Gartraukis */

                part light : Light {
                    doc /* Gartraukio apšvietimas, valdomas gartraukio mygtukais */
                }
            }

            part hob : FixedAppliance {
                doc /* Kaitlentė */
                :>> phases = 3;
            }

            part X1 : CableEnd {
                doc /* Laidas knygų lentynoje, 230 V */
                :>> label = "X1";
            }

            // ----- Plugged-in appliances -----

            part fridge : PluggedAppliance { doc /* Šaldytuvas */ }
            part microwave : PluggedAppliance { doc /* Mikrobangė */ }
            part dishwasher : PluggedAppliance { doc /* Indaplovė */ }
            part oven : PluggedAppliance {
                doc /* Orkaitė */
                comment /* To be verified: plugged into R1, or hard-wired to QF7
                         * together with the hob (panel chart says "oven + hob").
                         */
            }
            part kettle : PluggedAppliance { doc /* Arbatinukas */ }
            part coffeeMachine : PluggedAppliance { doc /* Kavos aparatas */ }
            part tv : PluggedAppliance { doc /* Televizorius */ }
            part roomba : PluggedAppliance { doc /* Roomba */ }
            part speaker : PluggedAppliance { doc /* Kolonėlė */ }
            part rpiServer : PluggedAppliance { doc /* Raspberry Pi serveris */ }
            part vinylPlayer : PluggedAppliance { doc /* Vinilų grotuvas */ }
            part modem2 : PluggedAppliance { doc /* Antras modemas */ }
            part bookshelfLight : PluggedAppliance { doc /* Šviesa knygų spintoje */ }

            // ----- Outlets -----

            part R1 : Outlet {
                doc /* Virtuvės zona, po spintelėmis */
                comment /* To be verified (hidden behind a cabinet): one 4-socket
                         * block or 4 separate outlets.
                         */
                :>> label = "R1";
                :>> socketCount = 4;
                ref :>> pluggedIn = (fridge, microwave, dishwasher, oven);
            }

            part R2 : Outlet {
                doc /* Prie kriauklės */
                :>> label = "R2";
                :>> socketCount = 2;
                ref :>> pluggedIn = kettle;
            }

            part R3 : Outlet {
                doc /* Prie kavos aparato */
                :>> label = "R3";
                :>> socketCount = 2;
                ref :>> pluggedIn = coffeeMachine;
            }

            part R4 : Outlet {
                doc /* Už sofos, telefono / nešiojamo kompiuterio pakrovikliams */
                :>> label = "R4";
                :>> socketCount = 2;
            }

            part R5 : Outlet {
                doc /* Spintelė po televizoriumi, už sporto stalčiaus */
                comment /* To be clarified: some of roomba, speaker, rpiServer,
                         * vinylPlayer are plugged in here.
                         */
                :>> label = "R5";
                :>> socketCount = 3;
            }

            part R6 : Outlet {
                doc /* Spintelė po televizoriumi, už elektronikos stalčiaus */
                comment /* To be clarified: some of roomba, tv, modem2,
                         * bookshelfLight are plugged in here.
                         */
                :>> label = "R6";
                :>> socketCount = 4;
            }

            part R7 : Outlet {
                doc /* Knygų spinta šalia televizoriaus */
                comment /* To be clarified: what is plugged in here. */
                :>> label = "R7";
                :>> socketCount = 2;
            }

            // ----- Switches -----

            part S1 : Switch {
                doc /* Balkono lempos jungiklis, prie balkono durų */
                :>> label = "S1";
                ref :>> controls = apartment.balcony.L1;
            }

            part S2 : Switch {
                doc /* Stalviršio LED juostos jungiklis, prie kavos aparato */
                :>> label = "S2";
                ref :>> controls = L4;
            }
        }

        part kidsRoom : Room {
            doc /* Vaikų kambarys */
        }

        part bedroom : Room {
            doc /* Miegamasis */
        }

        part hallway : Room {
            doc /* Koridorius */
        }

        part bathroom : Room {
            doc /* Vonia */
        }

        part balcony : Room {
            doc /* Balkonas */

            part L1 : Light {
                doc /* Lauko lempa */
                :>> label = "L1";
            }
        }
    }
}
