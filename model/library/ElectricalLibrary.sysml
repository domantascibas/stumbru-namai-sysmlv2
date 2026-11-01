package ElectricalLibrary {
    doc /* Common types for describing the apartment's electrical installation.
         * This package defines only WHAT things are (types and their attributes);
         * concrete devices are described in Rooms.sysml and Panel.sysml.
         */

    private import ScalarValues::*;
    private import ISQ::*;
    private import SI::*;

    // ---------------------------------------------------------------
    // Enumerations
    // ---------------------------------------------------------------

    enum def Phase {
        doc /* Which phase a circuit is connected to (single-phase apartments: usually L1). */
        enum L1;
        enum L2;
        enum L3;
    }

    enum def TripCurve {
        enum B;
        enum C;
        enum D;
    }

    enum def RcdType {
        enum AC;
        enum A;
        enum F;
        enum B;
    }

    enum def SwitchType {
        enum oneWay;          // single
        enum doubleGang;      // two buttons
        enum twoWay;          // control from two places
        enum intermediate;    // control from 3+ places
        enum pushButton;      // impulse / relay
        enum dimmer;
    }

    // ---------------------------------------------------------------
    // Rooms
    // ---------------------------------------------------------------

    part def Room {
        attribute area : AreaValue;
    }

    // ---------------------------------------------------------------
    // End devices (connected to a circuit)
    // ---------------------------------------------------------------

    abstract part def ElectricalDevice {
        doc /* Anything connected to a panel circuit. */
        attribute label : String;   // label on the floor plan, e.g. "R1", "S2"
        attribute notes : String;
    }

    abstract part def Load :> ElectricalDevice {
        doc /* A device that consumes power itself. */
        attribute power : PowerValue;
    }

    part def Outlet :> ElectricalDevice {
        attribute socketCount : Natural default = 1;
        attribute hasEarth : Boolean default = true;
        attribute isWaterproof : Boolean default = false;   // IP44+
        attribute hasDataSocket : Boolean default = false;  // RJ45 in the same frame
        ref part pluggedIn : PluggedAppliance[0..*];
    }

    part def Light :> Load {
        attribute bulbCount : Natural default = 1;
    }

    part def CableEnd :> ElectricalDevice {
        doc /* Live cable left in the wall/furniture with nothing connected yet. */
    }

    part def Switch :> ElectricalDevice {
        attribute switchType : SwitchType default = SwitchType::oneWay;
        ref part controls : ElectricalDevice[1..*];   // usually a Light, but may be e.g. a CableEnd
    }

    part def Thermostat :> ElectricalDevice {
        ref part controls : FixedAppliance[1..*];
    }

    part def FixedAppliance :> Load {
        doc /* Hard-wired (not via an outlet) appliance:
             * hob, oven, water heater, ventilation unit, floor heating...
             */
        attribute phases : Natural default = 1;
    }

    part def PluggedAppliance :> Load {
        doc /* Appliance plugged into an outlet (fridge, TV, washing machine...). */
    }

    part def PowerStrip :> PluggedAppliance {
        doc /* Extension cord / power strip plugged into an outlet. */
        attribute socketCount : Natural;
        ref part pluggedIn : PluggedAppliance[0..*];
    }

    // ---------------------------------------------------------------
    // Panel components
    // ---------------------------------------------------------------

    abstract part def ProtectiveDevice {
        attribute label : String;   // label in the panel, e.g. "Q1", "F1"
        attribute name : String;    // text on the panel, e.g. "Kitchen outlets"
        attribute product : String; // manufacturer series, e.g. "ETI ETIMAT 6"
        attribute ratedCurrent : ElectricCurrentValue;
        attribute poles : Natural default = 1;
    }

    part def MainSwitch :> ProtectiveDevice;

    part def Rcd :> ProtectiveDevice {
        doc /* Residual current device. Breakers downstream of it are modelled as its nested parts. */
        attribute residualCurrent : ElectricCurrentValue;   // e.g. 0.03 [A]
        attribute rcdType : RcdType;
    }

    part def CircuitBreaker :> ProtectiveDevice {
        doc /* One circuit breaker = one circuit. */
        attribute tripCurve : TripCurve default = TripCurve::B;
        attribute breakingCapacity : ElectricCurrentValue;   // e.g. 6000 [A]
        attribute phase : Phase default = Phase::L1;
        attribute cableCrossSectionMm2 : Real;   // e.g. 1.5, 2.5
        ref part feeds : ElectricalDevice[0..*];

        // TODO: once power values are filled in, compute the circuit load here, e.g.
        // attribute totalPower : PowerValue = sum(...);
    }

    part def DistributionBoard {
        attribute label : String;
    }
}
