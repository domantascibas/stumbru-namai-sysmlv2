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

    enum def BulbTechnology {
        enum led;
        enum halogen;
        enum incandescent;
        enum fluorescent;
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
        attribute product : String;     // manufacturer and model
        attribute power : PowerValue;   // rated (maximum) power from the rating plate
    }

    part def Outlet :> ElectricalDevice {
        attribute socketCount : Natural default = 1;
        attribute hasEarth : Boolean default = true;
        attribute isWaterproof : Boolean default = false;   // IP44+
        attribute hasDataSocket : Boolean default = false;  // RJ45 in the same frame
        ref part pluggedIn : PluggedAppliance[0..*];
    }

    part def Light :> Load {
        attribute bulbSocketCount : Natural default = 1;   // number of bulb sockets (not bulbs installed)
        part bulbs : Bulb[0..*];                      // bulbs currently installed (if known); may be fewer than bulbSocketCount
    }

    // ---------------------------------------------------------------
    // Bulbs
    // ---------------------------------------------------------------

    part def Bulb {
        doc /* A replaceable light source installed in a Light. */
        attribute product : String;
        attribute base : String;            // e.g. "G9", "E27", "GU10"
        attribute technology : BulbTechnology;
        attribute power : PowerValue;
        attribute luminousFlux : Real;      // lm
        attribute colorTemperature : ThermodynamicTemperatureValue;
    }

    part def OkkoG9Led4W :> Bulb {
        doc /* OKKO TP-G9 LED, 4 W, 300 lm, 3000 K, 180° */
        :>> product = "OKKO TP-G9";
        :>> base = "G9";
        :>> technology = BulbTechnology::led;
        :>> power = 4 [W];
        :>> luminousFlux = 300;
        :>> colorTemperature = 3000 [K];
    }

    part def OsramG9Halogen33W :> Bulb {
        doc /* OSRAM G9 halogen, 33 W, 460 lm, 2700 K, dimmable */
        :>> product = "OSRAM HALOPIN G9 33W";
        :>> base = "G9";
        :>> technology = BulbTechnology::halogen;
        :>> power = 33 [W];
        :>> luminousFlux = 460;
        :>> colorTemperature = 2700 [K];
    }

    part def PhilipsE27Led13W :> Bulb {
        doc /* Philips LED A60, 13 W (=100 W), 1521 lm, 2700 K, 105 mA, energy class E */
        :>> product = "Philips LED 13W E27 (9290023068)";
        :>> base = "E27";
        :>> technology = BulbTechnology::led;
        :>> power = 13 [W];
        :>> luminousFlux = 1521;
        :>> colorTemperature = 2700 [K];
    }

    part def OsramE27Led8W :> Bulb {
        doc /* OSRAM LED STAR CLASSIC A60, 8 W (=60 W), 806 lm, 2700 K, Ra 80, not dimmable */
        :>> product = "OSRAM LED STAR CLASSIC A60 8W";
        :>> base = "E27";
        :>> technology = BulbTechnology::led;
        :>> power = 8 [W];
        :>> luminousFlux = 806;
        :>> colorTemperature = 2700 [K];
    }

    part def LedvanceGu10Led4W :> Bulb {
        doc /* LEDVANCE (OSRAM) LED spot, GU10, 4.3 W, 350 lm, 600 cd, 36°, 2700 K, Ra 80, not dimmable */
        :>> product = "LEDVANCE LED GU10 4.3W 36° (EAN 4058075521681)";
        :>> base = "GU10";
        :>> technology = BulbTechnology::led;
        :>> power = 4.3 [W];
        :>> luminousFlux = 350;
        :>> colorTemperature = 2700 [K];
    }

    part def LedvanceGu53Led8W :> Bulb {
        doc /* LEDVANCE (OSRAM) LED MR16, GU5.3, 12 V AC, 720 mA, 8 W, 2700 K, 36°, not dimmable, glass reflector */
        comment /* Luminous flux hard to read on the bulb (looks like 621 lm); to be verified. */
        :>> product = "LEDVANCE/OSRAM LED MR16 GU5.3 12V 8W";
        :>> base = "GU5.3";
        :>> technology = BulbTechnology::led;
        :>> power = 8 [W];
        :>> luminousFlux = 621;
        :>> colorTemperature = 2700 [K];
    }

    part def StandartGu53Led4W :> Bulb {
        doc /* Standart (Philips) LED MR16, GU5.3, 12 V AC, 550 mA, 4.5 W (=35 W), 345 lm, 2700 K, 36°, energy class G */
        :>> product = "Standart LED MR16 GU5.3 4.5W (9290012109)";
        :>> base = "GU5.3";
        :>> technology = BulbTechnology::led;
        :>> power = 4.5 [W];
        :>> luminousFlux = 345;
        :>> colorTemperature = 2700 [K];
    }

    part def CozyHomeE14LedFilament4W :> Bulb {
        doc /* Cozy Home LED filament candle C35, clear, E14, 4.2 W, 470 lm, 25 mA, 2700 K */
        :>> product = "Cozy Home C35F7-CL-D-4.2W";
        :>> base = "E14";
        :>> technology = BulbTechnology::led;
        :>> power = 4.2 [W];
        :>> luminousFlux = 470;
        :>> colorTemperature = 2700 [K];
    }

    part def SpareBulbBox {
        doc /* Storage box with unused bulbs available as replacements. */
        part bulbs : Bulb[0..*];
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
