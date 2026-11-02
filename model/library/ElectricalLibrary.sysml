package ElectricalLibrary {
    doc /* Common types for describing the apartment's electrical installation.
         * This package defines only WHAT things are (types and their attributes);
         * concrete devices are described in Rooms.sysml and Panel.sysml.
         */

    private import ScalarValues::*;
    private import ISQ::*;
    private import SI::*;

    // ---------------------------------------------------------------
    // Ports and Items (SysML v2 Book patterns)
    // ---------------------------------------------------------------

    item def ElectricalPower {
        attribute voltage :> ISQElectromagnetism::voltage;
    }

    port def EnergyPort {
        out item electricalEnergy : ElectricalPower;
        attribute nominalVoltage :> ISQElectromagnetism::voltage;
        attribute ratedCurrent :> ISQBase::electricCurrent;
    }

    // Reusable typed interface for power connections
    interface def Wired {
        end port supply : EnergyPort;
        end port consume : ~EnergyPort;
        flow of ElectricalPower
            from supply.electricalEnergy to consume.electricalEnergy;
    }

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
        // Floor plan placement in metres: top-left corner and size (x to the right, y down).
        attribute planX : Real;
        attribute planY : Real;
        attribute planWidth : Real;
        attribute planDepth : Real;
    }

    // ---------------------------------------------------------------
    // End devices (connected to a circuit)
    // ---------------------------------------------------------------

    abstract part def ElectricalDevice {
        doc /* Anything connected to a panel circuit. */
        attribute label : String;   // label on the floor plan, e.g. "R1", "S2"
        attribute notes : String;
        // Optional position on the floor plan, in metres from the room's top-left corner.
        // Devices without a position are placed automatically by the viewer.
        attribute planX : Real;
        attribute planY : Real;

        // Roll-up: rated power connected through this device (evaluated by the tool).
        // The model describes the installation only; what is switched on is up to
        // the viewer's simulator.
        attribute connectedLoad :> ISQElectromagnetism::electricPower default = 0 [SI::W];
    }

    abstract part def Load :> ElectricalDevice {
        doc /* A device that consumes power itself. */
        attribute product : String;     // manufacturer and model
        // Rated (maximum) power from the rating plate. Unknown power counts as 0 W
        // in the roll-up; the viewer flags such devices.
        attribute power :> ISQElectromagnetism::electricPower default = 0 [SI::W];
        attribute :>> connectedLoad default = power;
        
        // Consumer port for power input (book pattern: supplier perspective)
        port plug : ~EnergyPort {
            attribute :>> nominalVoltage = 230 [SI::V];
        }
    }

    part def Outlet :> ElectricalDevice {
        attribute socketCount : Natural default = 1;
        attribute hasEarth : Boolean default = true;
        attribute isWaterproof : Boolean default = false;   // IP44+
        attribute hasDataSocket : Boolean default = false;  // RJ45 in the same frame
        ref part pluggedIn : PluggedAppliance[0..*] default = ();
        attribute connectedLoad :> ISQElectromagnetism::electricPower default = RealFunctions::sum(pluggedIn.connectedLoad);
        
        // Supplier port for power output (book pattern: supplier perspective)
        port plugPoint : EnergyPort {
            attribute :>> nominalVoltage = 230 [SI::V];
        }
    }

    part def Light :> Load {
        doc /* A light with bulbs sets its power to the sum of its bulbs, e.g.
             * `:>> power = RealFunctions::sum(ledBulbs.power);`
             */
        attribute bulbSocketCount : Natural default = 1;   // number of bulb sockets (not bulbs installed)
        attribute lengthM : Real;   // length of a line luminaire (LED strip), metres
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
        attribute power :> ISQElectromagnetism::electricPower;
        attribute luminousFlux : Real;      // lm
        attribute colorTemperature : ThermodynamicTemperatureValue;
    }

    part def OkkoG9Led4W :> Bulb {
        doc /* OKKO TP-G9 LED, 4 W, 300 lm, 3000 K, 180° */
        :>> product = "OKKO TP-G9";
        :>> base = "G9";
        :>> technology = BulbTechnology::led;
        :>> power = 4 [SI::W];
        :>> luminousFlux = 300;
        :>> colorTemperature = 3000 [SI::K];
    }

    part def OsramG9Halogen33W :> Bulb {
        doc /* OSRAM G9 halogen, 33 W, 460 lm, 2700 K, dimmable */
        :>> product = "OSRAM HALOPIN G9 33W";
        :>> base = "G9";
        :>> technology = BulbTechnology::halogen;
        :>> power = 33 [SI::W];
        :>> luminousFlux = 460;
        :>> colorTemperature = 2700 [SI::K];
    }

    part def PhilipsE27Led13W :> Bulb {
        doc /* Philips LED A60, 13 W (=100 W), 1521 lm, 2700 K, 105 mA, energy class E */
        :>> product = "Philips LED 13W E27 (9290023068)";
        :>> base = "E27";
        :>> technology = BulbTechnology::led;
        :>> power = 13 [SI::W];
        :>> luminousFlux = 1521;
        :>> colorTemperature = 2700 [SI::K];
    }

    part def OsramE27Led8W :> Bulb {
        doc /* OSRAM LED STAR CLASSIC A60, 8 W (=60 W), 806 lm, 2700 K, Ra 80, not dimmable */
        :>> product = "OSRAM LED STAR CLASSIC A60 8W";
        :>> base = "E27";
        :>> technology = BulbTechnology::led;
        :>> power = 8 [SI::W];
        :>> luminousFlux = 806;
        :>> colorTemperature = 2700 [SI::K];
    }

    part def LedvanceGu10Led4W :> Bulb {
        doc /* LEDVANCE (OSRAM) LED spot, GU10, 4.3 W, 350 lm, 600 cd, 36°, 2700 K, Ra 80, not dimmable */
        :>> product = "LEDVANCE LED GU10 4.3W 36° (EAN 4058075521681)";
        :>> base = "GU10";
        :>> technology = BulbTechnology::led;
        :>> power = 4.3 [SI::W];
        :>> luminousFlux = 350;
        :>> colorTemperature = 2700 [SI::K];
    }

    part def LedvanceGu53Led8W :> Bulb {
        doc /* LEDVANCE (OSRAM) LED MR16, GU5.3, 12 V AC, 720 mA, 8 W, 2700 K, 36°, not dimmable, glass reflector */
        comment /* Luminous flux hard to read on the bulb (looks like 621 lm); to be verified. */
        :>> product = "LEDVANCE/OSRAM LED MR16 GU5.3 12V 8W";
        :>> base = "GU5.3";
        :>> technology = BulbTechnology::led;
        :>> power = 8 [SI::W];
        :>> luminousFlux = 621;
        :>> colorTemperature = 2700 [SI::K];
    }

    part def StandartGu53Led4W :> Bulb {
        doc /* Standart (Philips) LED MR16, GU5.3, 12 V AC, 550 mA, 4.5 W (=35 W), 345 lm, 2700 K, 36°, energy class G */
        :>> product = "Standart LED MR16 GU5.3 4.5W (9290012109)";
        :>> base = "GU5.3";
        :>> technology = BulbTechnology::led;
        :>> power = 4.5 [SI::W];
        :>> luminousFlux = 345;
        :>> colorTemperature = 2700 [SI::K];
    }

    part def CozyHomeE14LedFilament4W :> Bulb {
        doc /* Cozy Home LED filament candle C35, clear, E14, 4.2 W, 470 lm, 25 mA, 2700 K */
        :>> product = "Cozy Home C35F7-CL-D-4.2W";
        :>> base = "E14";
        :>> technology = BulbTechnology::led;
        :>> power = 4.2 [SI::W];
        :>> luminousFlux = 470;
        :>> colorTemperature = 2700 [SI::K];
    }

    part def OsramE27LedFilamentGlobe5W :> Bulb {
        doc /* OSRAM (LEDVANCE) LED filament globe, gold/amber glass, spiral filament,
             * 4.8 W, 400 lm, 2200 K, 38 mA */
        :>> product = "OSRAM LED filament globe 4.8W (AC41919)";
        :>> base = "E27";
        :>> technology = BulbTechnology::led;
        :>> power = 4.8 [SI::W];
        :>> luminousFlux = 400;
        :>> colorTemperature = 2200 [SI::K];
    }

    part def VagnerE27Halogen28W :> Bulb {
        doc /* Vagner SDH halogen (eco halogen capsule in a clear A-shape bulb), E27, 230 V, 28 W,
             * 375 lm, 2800 K, made 06/2014 */
        :>> product = "Vagner SDH halogen 28W E27";
        :>> base = "E27";
        :>> technology = BulbTechnology::halogen;
        :>> power = 28 [SI::W];
        :>> luminousFlux = 375;
        :>> colorTemperature = 2800 [SI::K];
    }

    part def SpareBulbBox {
        doc /* Storage box with unused bulbs available as replacements. */
        part bulbs : Bulb[0..*];
    }

    part def CableEnd :> ElectricalDevice {
        doc /* Live cable left in the wall/furniture with nothing connected yet. */
        port plug : ~EnergyPort {
            attribute :>> nominalVoltage = 230 [SI::V];
        }
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
        ref part pluggedIn : PluggedAppliance[0..*] default = ();
        attribute :>> connectedLoad default = RealFunctions::sum(pluggedIn.connectedLoad);
    }

    // ---------------------------------------------------------------
    // Panel components
    // ---------------------------------------------------------------

    abstract part def ProtectiveDevice {
        doc /* Devices downstream of this one are modelled as its nested parts and
             * also listed in `downstream`, which the load roll-up sums over.
             */
        attribute label : String;   // label in the panel, e.g. "Q1", "F1"
        attribute name : String;    // text on the panel, e.g. "Kitchen outlets"
        attribute product : String; // manufacturer series, e.g. "ETI ETIMAT 6"
        attribute ratedCurrent :> ISQBase::electricCurrent;
        attribute poles : Natural default = 1;
        attribute phase : Phase default = Phase::L1;   // used by single-pole devices
        ref part feeds : ElectricalDevice[0..*] default = ();
        ref part downstream : ProtectiveDevice[0..*] default = ();

        // Ports for energy flow (book pattern: supplier perspective)
        port lineIn : ~EnergyPort {
            attribute :>> nominalVoltage = 230 [SI::V];
            attribute :>> ratedCurrent = ratedCurrent;
        }
        port lineOut : EnergyPort {
            attribute :>> nominalVoltage = 230 [SI::V];
            attribute :>> ratedCurrent = ratedCurrent;
        }

        attribute nominalVoltage :> ISQElectromagnetism::voltage default = 230 [SI::V];
        attribute maxLoadPower :> ISQElectromagnetism::electricPower = ratedCurrent * nominalVoltage;

        // ----- Connected load roll-up (evaluated by the tool) -----
        // Rated power of everything installed downstream, per phase; a multi-pole
        // device spreads its directly fed load evenly over the phases (actual split
        // unknown). What is running at a given moment is simulated by the viewer.
        attribute connectedLoad :> ISQElectromagnetism::electricPower default = feedLoad + downstreamLoad;
        attribute connectedLoadL1 :> ISQElectromagnetism::electricPower default =
            (if poles >= 3 ? feedLoad / 3 else if phase == Phase::L1 ? feedLoad else 0 [SI::W]) + downstreamLoadL1;
        attribute connectedLoadL2 :> ISQElectromagnetism::electricPower default =
            (if poles >= 3 ? feedLoad / 3 else if phase == Phase::L2 ? feedLoad else 0 [SI::W]) + downstreamLoadL2;
        attribute connectedLoadL3 :> ISQElectromagnetism::electricPower default =
            (if poles >= 3 ? feedLoad / 3 else if phase == Phase::L3 ? feedLoad else 0 [SI::W]) + downstreamLoadL3;
        // Helpers: directly fed and downstream parts of the sums above.
        attribute feedLoad :> ISQElectromagnetism::electricPower default = RealFunctions::sum(feeds.connectedLoad);
        attribute downstreamLoad :> ISQElectromagnetism::electricPower default = RealFunctions::sum(downstream.connectedLoad);
        attribute downstreamLoadL1 :> ISQElectromagnetism::electricPower default = RealFunctions::sum(downstream.connectedLoadL1);
        attribute downstreamLoadL2 :> ISQElectromagnetism::electricPower default = RealFunctions::sum(downstream.connectedLoadL2);
        attribute downstreamLoadL3 :> ISQElectromagnetism::electricPower default = RealFunctions::sum(downstream.connectedLoadL3);
    }

    part def MainSwitch :> ProtectiveDevice;

    part def Rcd :> ProtectiveDevice {
        doc /* Residual current device. */
        attribute residualCurrent :> ISQBase::electricCurrent;   // e.g. 0.03 [SI::A]
        attribute rcdType : RcdType;
    }

    part def CircuitBreaker :> ProtectiveDevice {
        doc /* One circuit breaker = one circuit. */
        attribute tripCurve : TripCurve default = TripCurve::B;
        attribute breakingCapacity :> ISQBase::electricCurrent;   // e.g. 6000 [SI::A]
        attribute cableCrossSectionMm2 : Real;   // e.g. 1.5, 2.5
    }

    part def DistributionBoard {
        attribute label : String;
        port gridIn : ~EnergyPort {
            doc /* Main grid connection point */
            attribute :>> nominalVoltage = 230 [SI::V];
        }
    }
}
