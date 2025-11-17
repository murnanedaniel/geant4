# G4SystemOfUnits.hh

Physical unit definitions and conversion factors for Geant4

## Overview

`G4SystemOfUnits.hh` provides a comprehensive set of physical unit definitions used throughout Geant4. It imports units from the CLHEP (Class Library for High Energy Physics) library and makes them available in the global namespace. This header is essential for expressing physical quantities in simulations with proper dimensional analysis.

Geant4 uses a system of internal units where certain fundamental units equal 1.0. All other units are expressed as conversion factors relative to these base units. This approach ensures dimensional correctness and allows users to work in their preferred units while maintaining internal consistency.

**IMPORTANT:** This header is restricted to internal use in source code only. User code should access units through appropriate interfaces.

## Source Location

**Header:** `/home/user/geant4/source/global/management/include/G4SystemOfUnits.hh` (lines 1-164)

**Author:** G. Cosmo (CERN)

**Dependency:** CLHEP Units library

## Geant4 Internal Unit System

Geant4's internal units are based on:
- **Length:** millimeter (mm = 1.0)
- **Time:** nanosecond (ns = 1.0)
- **Energy:** MeV (MeV = 1.0)
- **Temperature:** kelvin (K = 1.0)
- **Amount of substance:** mole (mole = 1.0)
- **Electric current:** ampere (A = 1.0)
- **Luminous intensity:** candela (cd = 1.0)

All other units are conversion factors relative to these base units.

## Complete Unit Reference

### Length Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| millimeter | mm | Base unit (= 1.0) | 121 |
| millimeter2 | mm2 | Square millimeter | 122 |
| millimeter3 | mm3 | Cubic millimeter | 123 |
| centimeter | cm, centimeter | 10 mm | 49, 45 |
| centimeter2 | cm2 | Square centimeter | 50, 46 |
| centimeter3 | cm3 | Cubic centimeter | 51, 47 |
| meter | m, meter | 1000 mm | 93, 99 |
| meter2 | m2 | Square meter | 94, 100 |
| meter3 | m3 | Cubic meter | 95, 101 |
| kilometer | km, kilometer | 1000 m | 86, 82 |
| kilometer2 | km2 | Square kilometer | 87, 83 |
| kilometer3 | km3 | Cubic kilometer | 88, 84 |
| micrometer | um | 10^-3 mm | 156, 107 |
| nanometer | nm | 10^-6 mm | 133, 130 |
| angstrom | angstrom | 10^-7 mm | 39 |
| fermi | fermi | 10^-12 mm (femtometer) | 63 |
| parsec | pc, parsec | Astronomical unit (~3.26 light-years) | 137, 136 |

### Time Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| nanosecond | ns | Base unit (= 1.0) | 134, 131 |
| second | s, second | 10^9 ns | 149, 150 |
| millisecond | ms | 10^6 ns | 126, 118 |
| microsecond | us | 10^3 ns | 157, 108 |
| picosecond | ps | 10^-3 ns | 146, 145 |
| minute | minute | 60 seconds | 119 |
| hour | hour | 60 minutes | 73 |
| day | day | 24 hours | 54 |
| year | year | 365.25 days | 161 |

### Energy Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| megaelectronvolt | MeV | Base unit (= 1.0) | 102, 96 |
| electronvolt | eV | 10^-6 MeV | 61, 59 |
| kiloelectronvolt | keV | 10^-3 MeV | 76, 78 |
| gigaelectronvolt | GeV | 10^3 MeV | 66, 67 |
| teraelectronvolt | TeV | 10^6 MeV | 155, 153 |
| petaelectronvolt | PeV | 10^9 MeV | 142, 141 |
| millielectronvolt | millielectronvolt | 10^-9 MeV | 111 |
| joule | joule | 6.24150907×10^12 MeV | 74 |

### Angle Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| radian | rad, radian | Base unit (= 1.0) | 147, 148 |
| milliradian | mrad | 10^-3 radian | 125, 117 |
| degree | deg, degree | π/180 radians | 55, 56 |
| steradian | sr, steradian | Solid angle unit | 151, 152 |

### Solid Angle Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| steradian | sr, steradian | Base unit (= 1.0) | 151, 152 |

### Mass Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| kilogram | kg | Base mass unit | 77, 80 |
| gram | g | 10^-3 kg | 64, 68 |
| milligram | mg | 10^-6 kg | 103, 113 |

### Electric Charge Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| coulomb | coulomb | Base charge unit | 52 |
| eplus | eplus | Elementary charge (~1.602×10^-19 C) | 60 |
| e_SI | e_SI | Elementary charge in SI units | 58 |

### Electric Potential Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| megavolt | megavolt | 10^6 volts | 98 |
| kilovolt | kilovolt | 10^3 volts | 85 |
| volt | volt | Base potential unit | 158 |

### Electric Current Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| ampere | ampere | Base unit (= 1.0) | 38 |
| milliampere | milliampere | 10^-3 ampere | 109 |
| microampere | microampere | 10^-6 ampere | 104 |
| nanoampere | nanoampere | 10^-9 ampere | 127 |

### Electric Resistance Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| ohm | ohm | Base resistance unit (V/A) | 135 |

### Capacitance Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| farad | farad | Base capacitance unit (C/V) | 62 |
| millifarad | millifarad | 10^-3 farad | 112 |
| microfarad | microfarad | 10^-6 farad | 106 |
| nanofarad | nanofarad | 10^-9 farad | 129 |
| picofarad | picofarad | 10^-12 farad | 144 |

### Magnetic Flux Density Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| tesla | tesla | Base magnetic field unit | 154 |
| gauss | gauss | 10^-4 tesla | 65 |
| kilogauss | kilogauss | 10^-1 tesla | 79 |

### Magnetic Flux Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| weber | weber | Magnetic flux unit (T·m^2) | 160 |

### Inductance Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| henry | henry | Inductance unit (Wb/A) | 70 |

### Temperature Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| kelvin | kelvin | Base unit (= 1.0) | 75 |

### Amount of Substance Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| mole | mole | Base unit (= 1.0) | 124 |

### Luminous Intensity Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| candela | candela | Base unit (= 1.0) | 44 |

### Luminous Flux Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| lumen | lumen | Luminous flux unit (cd·sr) | 91 |

### Illuminance Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| lux | lux | Illuminance unit (lm/m^2) | 92 |

### Cross Section Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| barn | barn | 10^-28 m^2 | 42 |
| millibarn | millibarn | 10^-3 barn | 110 |
| microbarn | microbarn | 10^-6 barn | 105 |
| nanobarn | nanobarn | 10^-9 barn | 128 |
| picobarn | picobarn | 10^-12 barn | 143 |

### Pressure Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| hep_pascal | hep_pascal | Pascal (N/m^2) | 71 |
| bar | bar | 10^5 pascal | 41 |
| atmosphere | atmosphere | Standard atmosphere (~101325 Pa) | 40 |

### Force Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| newton | newton | Force unit (kg·m/s^2) | 132 |

### Power Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| watt | watt | Power unit (J/s) | 159 |

### Frequency Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| hertz | hertz | Frequency unit (1/s) | 72 |
| kilohertz | kilohertz | 10^3 Hz | 81 |
| megahertz | megahertz | 10^6 Hz | 97 |

### Activity Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| becquerel | becquerel | Activity unit (1/s) | 43 |
| curie | curie | 3.7×10^10 Bq | 53 |

### Absorbed Dose Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| gray | gray | Absorbed dose unit (J/kg) | 69 |

### Volume Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| liter | L, liter | 10^3 cm^3 | 89, 90 |
| deciliter | dL | 10^-1 liter | 57 |
| centiliter | cL | 10^-2 liter | 48 |
| milliliter | mL | 10^-3 liter | 120 |

### Dimensionless Units

| Unit | Symbol | Description | Lines |
|------|--------|-------------|-------|
| perCent | perCent | 0.01 | 138 |
| perThousand | perThousand | 0.001 | 140 |
| perMillion | perMillion | 10^-6 | 139 |

## Usage Examples

### Basic Unit Usage

```cpp
#include "G4SystemOfUnits.hh"
#include "G4Types.hh"

// Define physical quantities with units
G4double length = 10.0 * cm;           // 10 cm = 100 mm (internal)
G4double energy = 1.0 * GeV;           // 1 GeV = 1000 MeV (internal)
G4double time = 5.0 * microsecond;     // 5 μs = 5000 ns (internal)
G4double angle = 45.0 * deg;           // 45 degrees

// The internal values:
// length = 100.0 (mm)
// energy = 1000.0 (MeV)
// time = 5000.0 (ns)
// angle ≈ 0.7854 (radians)
```

### Unit Conversion

```cpp
#include "G4SystemOfUnits.hh"

// Input in user units
G4double userLength = 5.0;  // 5 meters
G4double internalLength = userLength * m;  // Convert to internal (5000 mm)

// Computation in internal units
G4double result = internalLength * 2.0;  // 10000 mm

// Output in user units
G4double outputMeters = result / m;      // Convert back to meters: 10.0
G4double outputCm = result / cm;         // Or to centimeters: 1000.0
```

### Energy Calculations

```cpp
#include "G4SystemOfUnits.hh"

// Define particle properties
G4double kineticEnergy = 100.0 * MeV;
G4double threshold = 10.0 * keV;

// Check threshold
if (kineticEnergy > threshold) {
    // Process particle
}

// Energy deposition
G4double deposited = 5.0 * MeV;
G4double totalEnergy = kineticEnergy - deposited;  // 95.0 MeV
```

### Geometric Quantities

```cpp
#include "G4SystemOfUnits.hh"

// Volume calculation
G4double radius = 5.0 * cm;
G4double height = 10.0 * cm;
G4double volume = pi * radius * radius * height;  // Result in mm^3

// Convert to liters
G4double volumeLiters = volume / (liter);  // ~ 0.785 liters

// Surface area
G4double area = 100.0 * cm2;  // 10000 mm^2 (internal)
```

### Cross Section Calculations

```cpp
#include "G4SystemOfUnits.hh"

// Define cross sections
G4double totalXS = 1.5 * barn;
G4double elasticXS = 800.0 * millibarn;
G4double inelasticXS = totalXS - elasticXS;

// Microscopic to macroscopic cross section
G4double numberDensity = 1.0e23 / cm3;  // atoms per volume
G4double macroXS = totalXS * numberDensity;  // per mm
```

### Time-Dependent Quantities

```cpp
#include "G4SystemOfUnits.hh"

// Particle decay
G4double meanLifetime = 2.2 * microsecond;  // muon lifetime
G4double time = 5.0 * ns;
G4double survivalProb = exp(-time / meanLifetime);

// Detector timing
G4double hitTime = 150.0 * ns;
G4double timeWindow = 10.0 * ns;
```

### Electromagnetic Quantities

```cpp
#include "G4SystemOfUnits.hh"

// Electric field
G4double voltage = 1000.0 * volt;
G4double distance = 1.0 * cm;
G4double field = voltage / distance;  // V/mm

// Magnetic field
G4double bField = 2.0 * tesla;
G4double bFieldGauss = bField / gauss;  // 20000 gauss

// Charge
G4double charge = 2.0 * eplus;  // Charge of alpha particle
```

### Angles and Solid Angles

```cpp
#include "G4SystemOfUnits.hh"

// Angular distributions
G4double theta = 30.0 * deg;
G4double phi = 45.0 * deg;

// Solid angle
G4double solidAngle = 0.1 * steradian;
G4double solidAngleDeg = solidAngle / (deg * deg);  // sq. degrees
```

## Best Practices

1. **Always multiply by units when defining quantities:**
   ```cpp
   // Correct
   G4double energy = 100.0 * MeV;

   // Wrong - dimensionless number
   G4double energy = 100.0;
   ```

2. **Divide by units when outputting:**
   ```cpp
   G4double energy = 1.5 * GeV;  // Internal: 1500.0

   // Output in different units
   G4cout << "Energy: " << energy/MeV << " MeV" << G4endl;  // 1500 MeV
   G4cout << "Energy: " << energy/GeV << " GeV" << G4endl;  // 1.5 GeV
   ```

3. **Use consistent units in expressions:**
   ```cpp
   // Good - all lengths in consistent units
   G4double volume = (10.0*cm) * (5.0*cm) * (2.0*cm);

   // Avoid mixing without conversion
   // G4double area = length_in_mm * width_in_meters;  // WRONG!
   ```

4. **Include units header in source files, not headers:**
   ```cpp
   // In .cc files:
   #include "G4SystemOfUnits.hh"

   // In .hh files: avoid including units
   // Store values in internal units
   ```

5. **Document units in comments for stored values:**
   ```cpp
   class MyClass {
   private:
       G4double fEnergy;      // Stored in internal units (MeV)
       G4double fLength;      // Stored in internal units (mm)
   };
   ```

## Common Pitfalls

1. **Forgetting unit conversion:**
   ```cpp
   // Wrong - comparing dimensionless to unit-full
   G4double energy = GetEnergy();  // Returns value in MeV
   if (energy > 100) { ... }  // Should be: energy > 100*MeV

   // Correct
   if (energy > 100*MeV) { ... }
   ```

2. **Double conversion:**
   ```cpp
   // Wrong - converting twice
   G4double lengthCm = 5.0 * cm;
   G4double lengthMm = lengthCm * mm;  // Wrong! Already in mm

   // Correct
   G4double lengthCm = 5.0 * cm;  // 50 mm internal
   G4double lengthMm = lengthCm / mm;  // 50.0 (numeric value)
   ```

3. **Unit mismatch in calculations:**
   ```cpp
   // Problematic
   G4double area = length * width;  // What units?

   // Clear and correct
   G4double length = 10.0 * cm;
   G4double width = 5.0 * cm;
   G4double area = length * width;  // Area in mm^2 (internal)
   G4double areaCm2 = area / cm2;   // Convert to cm^2 for output
   ```

4. **Assuming specific unit values:**
   ```cpp
   // Wrong - assuming mm = 1
   G4double length = 100;  // Unclear units

   // Correct - explicit units
   G4double length = 100 * mm;  // Clear: 100 millimeters
   ```

5. **Using wrong unit category:**
   ```cpp
   // Wrong - using length unit for energy
   // G4double energy = 100 * m;  // Nonsensical

   // Correct
   G4double energy = 100 * MeV;
   ```

## Thread Safety

**Thread-Safe:** Yes

All unit definitions are compile-time constants imported from CLHEP. They can be safely used from multiple threads simultaneously without synchronization. The unit values are read-only and do not involve any mutable state.

## Performance Considerations

1. **Compile-time constants:** All units are constants, so unit multiplications/divisions can be optimized by the compiler

2. **No runtime overhead:** Unit conversions are simple multiplications/divisions with no function call overhead

3. **Avoid redundant conversions:**
   ```cpp
   // Inefficient - converting in loop
   for (int i = 0; i < 1000000; i++) {
       G4double e = energies[i] / MeV;  // Unnecessary if already in MeV
   }

   // Better - convert once if needed
   G4double factor = 1.0 / MeV;
   for (int i = 0; i < 1000000; i++) {
       G4double e = energies[i] * factor;
   }
   ```

## CLHEP Dependency

This header imports all units from `CLHEP/Units/SystemOfUnits.h` using C++ `using` declarations. The actual unit values and conversions are defined in CLHEP. This ensures consistency with other HEP software using CLHEP.

**CLHEP System of Units:**
- Based on natural units common in particle physics
- Internally consistent dimensional system
- Compatible with other Hclhep-based software

## Related Headers

- [G4PhysicalConstants.hh](g4physicalconstants.md) - Physical constants (speeds of light, masses, etc.)
- [G4Types.hh](g4types.md) - Fundamental type definitions
- [globals.hh](globals.md) - Common includes (includes units transitively)
- CLHEP Units documentation - External CLHEP library documentation

## Version Information

**Introduced:** Geant4 1.0
**Stability:** Stable - unit definitions rarely change
**CLHEP Version:** Depends on CLHEP version used in build

## Notes

- This header should only be included in `.cc` implementation files, not in `.hh` headers
- Users should not define their own units - use the provided ones
- The unit system ensures dimensional analysis at compile time through type consistency
- When interfacing with external libraries, be careful about unit systems - explicit conversion may be needed
- Some aliases exist for convenience (e.g., `cm` and `centimeter` are the same)
- The unit system is based on HEP conventions, which may differ from SI in some cases (e.g., energy in eV rather than joules)

## See Also

- [G4PhysicalConstants.hh](g4physicalconstants.md) - Physical constants
- [G4Types.hh](g4types.md) - Type definitions
- [G4UnitsTable](g4unitstable.md) - Runtime unit management and formatting
- Geant4 User's Guide: Section on Units
- CLHEP Units Library documentation
