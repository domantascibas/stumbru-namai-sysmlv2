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
        }
    }
}
