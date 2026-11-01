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
                :>> bulbSocketCount = 1;
                part ledBulbs : OsramE27LedFilamentGlobe5W[1] :> bulbs;
            }

            part L2 : Light {
                doc /* Pagrindinis svetainės apšvietimas. Šviesumą perjungia jungiklis:
                     * kiekvienas OFF -> ON keičia režimą min -> medium -> max.
                     * Jei šviestuvas įjungtas 5 min, režimas išsisaugo, ir tada
                     * OFF -> ON įjungia išsaugotą režimą, o ne perjungia kitą.
                     */
                comment /* Integrated luminaire with a non-user-replaceable LED module (no bulb sockets).
                         * Rating plate: 220-240 V, 0.11 A, 22 W, PF 0.9, 2000 lm, 2700 K, class II;
                         * LED module 929002669, 2600 lm.
                         */
                :>> label = "L2";
                :>> bulbSocketCount = 0;
                :>> product = "Philips LED Ceiling Luminaire 929002669";
                :>> power = 22 [W];
            }

            part L3 : Light {
                doc /* Virtuvės zonos apšvietimas */
                :>> label = "L3";
                :>> bulbSocketCount = 4;
                part ledBulbs : LedvanceGu10Led4W[4] :> bulbs;
            }

            part L4 : Light {
                doc /* Virtuvės stalviršio apšvietimas, LED juosta, 3 m, aliuminio profilyje su sklaidytuvu */
                comment /* Cool white light. Power unknown: typical strips are 5-15 W/m, i.e. ~15-45 W
                         * for 3 m. Exact value from the LED driver label (driver location unknown,
                         * probably in a wall cabinet).
                         */
                :>> label = "L4";
                :>> bulbSocketCount = 0;
            }

            // ----- Fixed appliances -----

            part hood : FixedAppliance {
                doc /* Gartraukis */
                comment /* Rating plate: motor 1x150 W, lights max 2x28 W, total 206 W.
                         * `power` here is the motor only; the light is counted separately.
                         */
                :>> product = "Elica ELITE14 LUX WH/A/60";
                :>> power = 150 [W];

                part light : Light {
                    doc /* Gartraukio apšvietimas, valdomas gartraukio mygtukais */
                    comment /* Rating plate allows max 28 W per socket. */
                    :>> bulbSocketCount = 2;
                    part ledBulbs : CozyHomeE14LedFilament4W[2] :> bulbs;
                }
            }

            part hob : FixedAppliance {
                doc /* Indukcinė kaitlentė, 60 cm, 4 zonos, slankiklis 0-9 + P (boost) */
                comment /* Rating plate (made April 2023): 220-240 V~ / 380-415 V 3N~, 50-60 Hz, max 7000 W.
                         * Induction hobs of this size usually have two power units (~3.5 kW each),
                         * i.e. they load two of the three phases; which ones is unknown.
                         */
                :>> product = "Samsung NZ64T3707A1";
                :>> power = 7000 [W];
                :>> phases = 3;
            }

            part X1 : CableEnd {
                doc /* Laidas knygų lentynoje, 230 V; valdomas jungikliu S4 koridoriuje */
                :>> label = "X1";
            }

            // ----- Plugged-in appliances -----

            part fridge : PluggedAppliance {
                doc /* Šaldytuvas */
                comment /* Rating plate: 230-240 V, 0.8 A (~185 W); defrost heater 113 W; 305 l, class A+. */
                :>> product = "Electrolux ENN3153AOW";
                :>> power = 185 [W];
            }
            part microwave : PluggedAppliance {
                doc /* Mikrobangė su griliu */
                comment /* Rating plate: microwave input 1150 W (output 700 W), grill 1000 W, max input 1150 W. */
                :>> product = "Candy CMG 7417 DS";
                :>> power = 1150 [W];
            }
            part dishwasher : PluggedAppliance {
                doc /* Indaplovė, 45 cm, integruota */
                :>> product = "Bosch SPV69T40EU/23 SuperSilence";
                :>> power = 2400 [W];   // rating plate: 2.0-2.4 kW, fuse 10/16 A
            }
            part oven : PluggedAppliance {
                doc /* Orkaitė */
                comment /* On F7 together with the hob (confirmed by switching F7 off).
                         * To be verified behind the cabinet: plugged into R4 or hard-wired.
                         * Single-phase (220-240 V), so it loads only one of F7's three phases;
                         * which one is unknown.
                         */
                :>> product = "Bosch HBA23B122S";
                :>> power = 3500 [W];   // rating plate: 220-240 V, 3.5 kW
            }
            part kettle : PluggedAppliance {
                doc /* Arbatinukas */
                :>> product = "Philips HD9321/20";
                :>> power = 2200 [W];   // rating plate: 1850-2200 W
            }
            part coffeeMachine : PluggedAppliance {
                doc /* Kavos aparatas */
                :>> product = "De'Longhi Dinamica ECAM350.15.B";
                :>> power = 1450 [W];   // rating plate: 220-240 V, 1450 W, 15 bar
            }
            part tv : PluggedAppliance { doc /* Televizorius */ }
            part roomba : PluggedAppliance { doc /* Roomba */ }
            part speaker : PluggedAppliance { doc /* Marshall kolonėlė */ }
            part rpiServer : PluggedAppliance { doc /* Raspberry Pi serveris */ }
            part vinylPlayer : PluggedAppliance { doc /* Vinilų grotuvas */ }
            part modem2 : PluggedAppliance { doc /* Antras modemas */ }
            part tvBox : PluggedAppliance { doc /* TV priedėlis */ }
            part deskLamp : PluggedAppliance { doc /* Stalinė lemputė knygų spintoje */ }

            part powerStrip1 : PowerStrip {
                doc /* Prailgintuvas spintelėje po televizoriumi */
                ref :>> pluggedIn = (tvBox, deskLamp);
            }

            // ----- Outlets -----

            // R1-R4 are hidden behind a kitchen cabinet; socket counts not checked yet
            part R1 : Outlet {
                doc /* Virtuvės zona, po spintelėmis; šaldytuvas */
                :>> label = "R1";
                ref :>> pluggedIn = fridge;
            }

            part R2 : Outlet {
                doc /* Virtuvės zona, po spintelėmis; mikrobangė */
                :>> label = "R2";
                ref :>> pluggedIn = microwave;
            }

            part R3 : Outlet {
                doc /* Virtuvės zona, po spintelėmis; indaplovė */
                :>> label = "R3";
                ref :>> pluggedIn = dishwasher;
            }

            part R4 : Outlet {
                doc /* Virtuvės zona, po spintelėmis; orkaitė */
                :>> label = "R4";
                ref :>> pluggedIn = oven;
            }

            part R5 : Outlet {
                doc /* Prie kriauklės */
                :>> label = "R5";
                :>> socketCount = 2;
                ref :>> pluggedIn = kettle;
            }

            part R6 : Outlet {
                doc /* Prie kavos aparato */
                :>> label = "R6";
                :>> socketCount = 2;
                ref :>> pluggedIn = coffeeMachine;
            }

            part R7 : Outlet {
                doc /* Už sofos, telefono / nešiojamo kompiuterio pakrovikliams */
                :>> label = "R7";
                :>> socketCount = 2;
            }

            part R8 : Outlet {
                doc /* Spintelė po televizoriumi, už sporto stalčiaus */
                :>> label = "R8";
                :>> socketCount = 3;
                // left to right
                ref :>> pluggedIn = (vinylPlayer, rpiServer, roomba);
            }

            part R9 : Outlet {
                doc /* Spintelė po televizoriumi, už elektronikos stalčiaus, viršutinis blokelis */
                :>> label = "R9";
                :>> socketCount = 2;
                :>> hasDataSocket = true;
                // left: power strip, right socket free
                ref :>> pluggedIn = powerStrip1;
            }

            part R10 : Outlet {
                doc /* Spintelė po televizoriumi, už elektronikos stalčiaus, apatinis blokelis (po R9) */
                comment /* The data socket brings the internet from the first modem to modem2. */
                :>> label = "R10";
                :>> socketCount = 2;
                :>> hasDataSocket = true;
                // left to right
                ref :>> pluggedIn = (tv, modem2);
            }

            part R11 : Outlet {
                doc /* Knygų spinta šalia televizoriaus */
                :>> label = "R11";
                :>> socketCount = 2;
                // left socket free, right: speaker
                ref :>> pluggedIn = speaker;
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

            // ----- Lighting -----

            part L1 : Light {
                doc /* Pagrindinis apšvietimas; 2 perdegusios LED pakeistos halogeninėmis */
                :>> label = "L1";
                :>> bulbSocketCount = 6;
                part ledBulbs : OkkoG9Led4W[4] :> bulbs;
                part halogenBulbs : OsramG9Halogen33W[2] :> bulbs;
            }

            part L2 : Light {
                doc /* Šviesa virš lovos (debesėlis) */
                comment /* IKEA lamp with a 4 W LED, fed by a built-in 24 V LED driver
                         * RECOM RACV04-24 (in 100-240 V, 0.10 A, PF 0.40; out 24 V DC CV, max 170 mA / 4 W, SELV).
                         * No mains bulb socket.
                         */
                :>> label = "L2";
                :>> bulbSocketCount = 0;
                :>> product = "IKEA LED lamp (driver RECOM RACV04-24)";
                :>> power = 4 [W];
            }

            // ----- Plugged-in appliances -----

            part nas : PluggedAppliance { doc /* NAS serveris */ }

            // ----- Outlets -----

            part R1 : Outlet {
                doc /* Po debesėliu; viename blokelyje su S2 */
                :>> label = "R1";
            }

            part R2 : Outlet {
                doc /* Prie durų, palei žemę */
                :>> label = "R2";
            }

            part R3 : Outlet {
                doc /* Prie vaikų staliuko, palei žemę */
                :>> label = "R3";
            }

            part R4 : Outlet {
                doc /* Už knygų spintelės, palei žemę */
                :>> label = "R4";
                :>> socketCount = 2;
            }

            part R5 : Outlet {
                doc /* Už knygų spintelės, virš R4 */
                :>> label = "R5";
                :>> socketCount = 2;
                ref :>> pluggedIn = nas;
            }

            // ----- Switches -----

            part S1 : Switch {
                doc /* Prie durų; pagrindinis apšvietimas */
                :>> label = "S1";
                ref :>> controls = L1;
            }

            part S2 : Switch {
                doc /* Po debesėliu, blokelyje su R1; debesėlio šviesa */
                :>> label = "S2";
                ref :>> controls = L2;
            }
        }

        part bedroom : Room {
            doc /* Miegamasis */

            // ----- Lighting -----

            part L1 : Light {
                doc /* Pagrindinis apšvietimas; 1 LED pakeista halogenine */
                :>> label = "L1";
                :>> bulbSocketCount = 6;
                part ledBulbs : OkkoG9Led4W[5] :> bulbs;
                part halogenBulbs : OsramG9Halogen33W[1] :> bulbs;
            }

            part L2 : Light {
                doc /* Sieninė skaitymo šviesa, lovos kairėje */
                :>> label = "L2";
                :>> bulbSocketCount = 1;
                part halogenBulbs : OsramG9Halogen33W[1] :> bulbs;
            }

            part L3 : Light {
                doc /* Sieninė skaitymo šviesa, lovos dešinėje */
                :>> label = "L3";
                :>> bulbSocketCount = 1;
                part halogenBulbs : OsramG9Halogen33W[1] :> bulbs;
            }

            // ----- Outlets -----

            part R1 : Outlet {
                doc /* Prie kambario durų, po jungikliu S1 */
                :>> label = "R1";
            }

            part R2 : Outlet {
                doc /* Siena priešais lovą (kojūgalyje) */
                :>> label = "R2";
                :>> socketCount = 2;
            }

            part R3 : Outlet {
                doc /* Lovos kairėje, po skaitymo lempa; blokelis iš kairės į dešinę: R3, S2, S3 */
                :>> label = "R3";
            }

            part R4 : Outlet {
                doc /* Lovos dešinėje, po skaitymo lempa; viename blokelyje su S4 */
                :>> label = "R4";
                :>> socketCount = 2;
            }

            // ----- Switches -----

            // S1 and S3 both control L1, so they must be two-way switches
            part S1 : Switch {
                doc /* Prie durų, virš rozetės R1; pagrindinis apšvietimas */
                :>> label = "S1";
                :>> switchType = SwitchType::twoWay;
                ref :>> controls = L1;
            }

            part S2 : Switch {
                doc /* Lovos kairėje, blokelyje su R3 (vidurinis); skaitymo šviesa */
                :>> label = "S2";
                ref :>> controls = L2;
            }

            part S3 : Switch {
                doc /* Lovos kairėje, blokelyje su R3 (dešinysis); pagrindinis apšvietimas (dubliuoja S1) */
                :>> label = "S3";
                :>> switchType = SwitchType::twoWay;
                ref :>> controls = L1;
            }

            part S4 : Switch {
                doc /* Lovos dešinėje, blokelyje su R4; skaitymo šviesa */
                :>> label = "S4";
                ref :>> controls = L3;
            }
        }

        part hallway : Room {
            doc /* Koridorius */

            // ----- Lighting -----

            part L1 : Light {
                doc /* Koridoriaus apšvietimas: 3 šviestuvai po 2 lizdus,
                     * šiuo metu kiekviename įsukta po 1 lemputę.
                     */
                :>> label = "L1";
                :>> bulbSocketCount = 6;
                part ledBulbs : PhilipsE27Led13W[3] :> bulbs;
            }

            // ----- Fixed appliances -----

            part intercom : FixedAppliance {
                doc /* Domofonas */
                comment /* Not fed from the apartment panel: powered by the building's
                         * intercom system.
                         */
            }

            part doorbell : FixedAppliance {
                doc /* Durų skambutis */
                comment /* To be verified: no breaker found during the circuit check
                         * (not tested: would wake the kids); possibly battery or building powered.
                         */
            }

            part modemBox : FixedAppliance {
                doc /* Modemo dėžutė: sieninė dėžutė, kur ateina šviesolaidis ir
                     * pajungtas modemas. Laidinis internetas iš jos paduodamas
                     * į antrąjį modemą ir paskirstomas į kitus kambarius.
                     */
                comment /* Network distribution is intentionally not modelled. */
            }

            // ----- Outlets -----

            part R1 : Outlet {
                doc /* Šalia modemo dėžutės, už batų spintelės */
                :>> label = "R1";
            }

            part R2 : Outlet {
                doc /* Priešais vonią */
                :>> label = "R2";
            }

            // ----- Switches -----

            // S1 and S3 both control L1, so they must be two-way switches
            part S1 : Switch {
                doc /* Prie lauko durų; koridoriaus apšvietimas */
                :>> label = "S1";
                :>> switchType = SwitchType::twoWay;
                ref :>> controls = L1;
            }

            part S2 : Switch {
                doc /* Prie vonios durų; vonios pagrindinis apšvietimas */
                :>> label = "S2";
                ref :>> controls = apartment.bathroom.L1;
            }

            part T1 : Thermostat {
                doc /* Vonios grindų šildymo termostatas, palei žemę po S2 */
                :>> label = "T1";
                ref :>> controls = apartment.bathroom.floorHeating;
            }

            // S3-S6: one 4-switch block opposite the bathroom, left to right
            part S3 : Switch {
                doc /* Priešais vonią, blokelio 1-as; koridoriaus apšvietimas */
                :>> label = "S3";
                :>> switchType = SwitchType::twoWay;
                ref :>> controls = L1;
            }

            part S4 : Switch {
                doc /* Priešais vonią, blokelio 2-as; laidas X1 svetainės knygų lentynoje */
                :>> label = "S4";
                ref :>> controls = apartment.livingKitchen.X1;
            }

            part S5 : Switch {
                doc /* Priešais vonią, blokelio 3-ias; virtuvės zonos apšvietimas */
                :>> label = "S5";
                ref :>> controls = apartment.livingKitchen.L3;
            }

            part S6 : Switch {
                doc /* Priešais vonią, blokelio 4-as, dvigubas: kairė pusė - šviesa
                     * virš valgomojo stalo, dešinė - pagrindinis svetainės apšvietimas
                     */
                :>> label = "S6";
                :>> switchType = SwitchType::doubleGang;
                ref :>> controls = (apartment.livingKitchen.L1, apartment.livingKitchen.L2);
            }
        }

        part bathroom : Room {
            doc /* Vonia */

            // ----- Lighting -----

            part L1 : Light {
                doc /* Pagrindinis apšvietimas; 12 V, maitinamas per elektroninį transformatorių */
                comment /* TODO (postponed): transformer problem.
                         * Planned to use 4 Standart 4.5 W bulbs (6 in the spare box), but with them
                         * the light keeps switching off: probably the load is below the
                         * transformer's minimum. Currently only 1 LEDVANCE 8 W bulb is installed.
                         * Next steps: check transformer label (count, power range / minimum load);
                         * options: LED driver 12 V DC without minimum load, or convert sockets to GU10 (230 V).
                         */
                :>> label = "L1";
                :>> bulbSocketCount = 4;
                part ledBulbs : LedvanceGu53Led8W[1] :> bulbs;
            }

            part L2 : Light {
                doc /* Veidrodžio apšvietimas, LED juosta, 52 cm, profilyje virš veidrodžio */
                comment /* Cool white light. Power unknown: typical strips are 5-15 W/m, i.e. ~3-8 W
                         * for 0.52 m. Exact value from the LED driver label (probably behind the mirror).
                         */
                :>> label = "L2";
                :>> bulbSocketCount = 0;
            }

            // ----- Fixed appliances -----

            part floorHeating : FixedAppliance {
                doc /* Grindinis šildymas */
                comment /* Power unknown: no marking on the thermostat. To be measured with the
                         * electricity meter (only F6 on) or estimated from the heated floor area
                         * (typically 120-150 W/m2 in bathrooms).
                         */
            }

            part towelRail : FixedAppliance {
                doc /* Elektrinis gyvatukas.
                     * - valdomas mygtukais ant paties gyvatuko:
                     * - režimai „visada įjungtas“ ir „įjungtas 2 h“, karštis 1-4.
                     */
                comment /* Heating element "Square Line" KTX-2 MS (230 V, 50 Hz, IPx4). The label gives
                         * a power range ending at 1000 W, so 1000 W is the upper bound; the actual
                         * element may be weaker. To be measured with the electricity meter (only F5 on).
                         */
                :>> product = "Square Line KTX-2 MS heating element";
                :>> power = 1000 [W];
            }

            // ----- Plugged-in appliances -----

            part washingMachine : PluggedAppliance {
                doc /* Skalbyklė su džiovinimu, 9 kg skalbimas / 6 kg džiovinimas */
                :>> product = "Samsung WD90T984ASH/S7";
                :>> power = 2300 [W];   // rating plate: 2000-2300 W
            }

            // ----- Outlets -----

            part R1 : Outlet {
                doc /* Prie durų, už skalbyklės šono */
                :>> label = "R1";
            }

            part R2 : Outlet {
                doc /* Prie veidrodžio, su dangteliu (skutimosi mašinėlėms); viename blokelyje su S1 */
                :>> label = "R2";
                :>> isWaterproof = true;
            }

            part R3 : Outlet {
                doc /* Už skalbyklės, palei žemę */
                :>> label = "R3";
                ref :>> pluggedIn = washingMachine;
            }

            // ----- Switches -----

            part S1 : Switch {
                doc /* Prie veidrodžio, blokelyje su R2; veidrodžio apšvietimas */
                :>> label = "S1";
                ref :>> controls = L2;
            }
        }

        part balcony : Room {
            doc /* Balkonas */

            part L1 : Light {
                doc /* Lauko lempa */
                comment /* Fixture label: E27, max 60 W. */
                :>> label = "L1";
                :>> bulbSocketCount = 1;
                part halogenBulbs : VagnerE27Halogen28W[1] :> bulbs;
            }
        }

        // Not installed anywhere: replacements for E27 (hallway), G9 (kids room, bedroom)
        // GU10 (kitchen zone) and GU5.3 (bathroom) lights
        part spareBulbs : SpareBulbBox {
            doc /* Atsarginių lempučių dėžė */
            part osramLedBulbs : OsramE27Led8W[2] :> bulbs;
            part philipsLedBulbs : PhilipsE27Led13W[3] :> bulbs;
            part okkoLedBulbs : OkkoG9Led4W[1] :> bulbs;
            part osramHalogenBulbs : OsramG9Halogen33W[1] :> bulbs;
            part ledvanceGu10Bulbs : LedvanceGu10Led4W[2] :> bulbs;
            part standartGu53Bulbs : StandartGu53Led4W[6] :> bulbs;
        }
    }
}
