package Rooms {
    doc /* The apartment's rooms and what is installed in each.
         * This describes WHERE a device is; which circuit it is
         * connected to is described in Panel.sysml.
         */

    private import ElectricalLibrary::*;
    private import SI::*;

    part apartment {

        part hallway : Room {
            part L1 : Light { :>> label = "L1"; }
            part S1 : Switch {
                :>> label = "S1";
                ref :>> controls = L1;
            }
            part R1 : Outlet { :>> label = "R1"; }
        }

        part kitchen : Room {
            part L1 : Light { :>> label = "L1"; }
            part S1 : Switch {
                :>> label = "S1";
                ref :>> controls = L1;
            }
            part R1 : Outlet { :>> label = "R1"; :>> socketCount = 2; }
            part R2 : Outlet { :>> label = "R2"; }
            part hob : FixedAppliance { :>> label = "Hob"; }
        }

        part livingRoom : Room {
            part L1 : Light { :>> label = "L1"; }
            part S1 : Switch {
                :>> label = "S1";
                ref :>> controls = L1;
            }
            part R1 : Outlet { :>> label = "R1"; }
            part R2 : Outlet { :>> label = "R2"; }
        }

        part bedroom : Room {
            part L1 : Light { :>> label = "L1"; }
            part S1 : Switch {
                :>> label = "S1";
                ref :>> controls = L1;
            }
            part R1 : Outlet { :>> label = "R1"; }
        }

        part bathroom : Room {
            part L1 : Light { :>> label = "L1"; }
            part S1 : Switch {
                :>> label = "S1";
                ref :>> controls = L1;
            }
            part R1 : Outlet { :>> label = "R1"; :>> isWaterproof = true; }
        }
    }
}
