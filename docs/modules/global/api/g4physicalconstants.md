# G4PhysicalConstants.hh

Physical constants for particle physics simulations

## Overview

`G4PhysicalConstants.hh` provides fundamental physical constants used in particle physics and detector simulations. It imports constants from the CLHEP (Class Library for High Energy Physics) library and makes them available in the global namespace. These constants include particle masses, fundamental constants (c, h, etc.), electromagnetic constants, and mathematical constants.

All constants are expressed in Geant4's internal unit system (MeV, mm, ns, etc.) and are derived from internationally accepted values (CODATA, PDG, etc.).

**IMPORTANT:** This header is restricted to internal use in source code only.

## Source Location

**Header:** `/home/user/geant4/source/global/management/include/G4PhysicalConstants.hh` (lines 1-74)

**Author:** G. Cosmo (CERN)

**Dependency:** CLHEP Units library

## Complete Constants Reference

### Speed of Light

| Constant | Symbol | Description | Value (approximate) | Line |
|----------|--------|-------------|---------------------|------|
| c_light | c_light | Speed of light | 299.792458 mm/ns | 43 |
| c_squared | c_squared | Speed of light squared | 89875.5178... (mm/ns)^2 | 44 |

**Units:** mm/ns (millimeters per nanosecond)

**Note:** In natural units where c=1, energies and masses can be directly compared.

### Planck's Constant

| Constant | Symbol | Description | Value (approximate) | Line |
|----------|--------|-------------|---------------------|------|
| h_Planck | h_Planck | Planck constant | 4.13566766e-21 MeV·s | 53 |
| hbar_Planck | hbar_Planck | Reduced Planck constant (ℏ = h/2π) | 6.58211928e-22 MeV·s | 55 |
| hbarc | hbarc | ℏc (useful for QM calculations) | 197.3269718 MeV·fm | 56 |
| hbarc_squared | hbarc_squared | (ℏc)^2 | 38937.9373... MeV^2·fm^2 | 57 |

**Usage:** Essential for quantum mechanical calculations, wavelength-momentum relations, uncertainty principle.

### Elementary Charge

| Constant | Symbol | Description | Value | Line |
|----------|--------|-------------|-------|------|
| electron_charge | electron_charge | Magnitude of electron charge | e (in internal units) | 47 |
| e_squared | e_squared | Square of elementary charge | e^2 | 46 |
| eplus | eplus | Elementary charge (for CLHEP compatibility) | e | 60 (not in this file) |

### Electromagnetic Constants

| Constant | Symbol | Description | Formula/Value | Line |
|----------|--------|-------------|---------------|------|
| elm_coupling | elm_coupling | Electromagnetic coupling constant | e^2 | 50 |
| fine_structure_const | fine_structure_const | Fine structure constant α | e^2/(4πε₀ℏc) ≈ 1/137.036 | 52 |
| classic_electr_radius | classic_electr_radius | Classical electron radius | e^2/(4πε₀mₑc^2) ≈ 2.818 fm | 45 |
| electron_Compton_length | electron_Compton_length | Electron Compton wavelength | ℏ/(mₑc) ≈ 2.426 pm | 48 |
| epsilon0 | epsilon0 | Electric constant (permittivity of vacuum) | 8.854187817...e-12 F/m | 51 |
| mu0 | mu0 | Magnetic constant (permeability of vacuum) | 4π × 10^-7 N/A^2 | 60 |

### Particle Masses

| Constant | Symbol | Description | Value (approximate) | Line |
|----------|--------|-------------|---------------------|------|
| electron_mass_c2 | electron_mass_c2 | Electron rest mass energy | 0.510998928 MeV | 49 |
| proton_mass_c2 | proton_mass_c2 | Proton rest mass energy | 938.272046 MeV | 64 |
| neutron_mass_c2 | neutron_mass_c2 | Neutron rest mass energy | 939.565379 MeV | 61 |
| amu_c2 | amu_c2 | Atomic mass unit energy equivalent | 931.494061 MeV | 40 |
| amu | amu | Atomic mass unit (mass) | amu_c2/c^2 | 39 |

**Note:** All masses are given as energy equivalents (mc^2) in MeV, which is standard in particle physics.

### Atomic and Nuclear Constants

| Constant | Symbol | Description | Value (approximate) | Line |
|----------|--------|-------------|---------------------|------|
| Bohr_radius | Bohr_radius | Bohr radius | 0.52917721092e-10 m ≈ 0.529 Å | 42 |
| alpha_rcl2 | alpha_rcl2 | α × (ℏ/mₑc)^2 | Fine structure × squared Compton wavelength | 38 |
| twopi_mc2_rcl2 | twopi_mc2_rcl2 | 2π × mₑc^2 × rₑ^2 | Constant for radiation calculations | 68 |

### Magnetic Moments

| Constant | Symbol | Description | Value | Line |
|----------|--------|-------------|-------|------|
| Bohr_magneton | Bohr_magneton | Bohr magneton (electron magnetic moment unit) | eℏ/(2mₑ) | 69 |
| nuclear_magneton | nuclear_magneton | Nuclear magneton (nucleon magnetic moment unit) | eℏ/(2mₚ) | 70 |

### Thermodynamic Constants

| Constant | Symbol | Description | Value | Line |
|----------|--------|-------------|-------|------|
| k_Boltzmann | k_Boltzmann | Boltzmann constant | 8.617330e-11 MeV/K | 58 |

### Standard Temperature and Pressure (STP)

| Constant | Symbol | Description | Value | Line |
|----------|--------|-------------|-------|------|
| STP_Temperature | STP_Temperature | Standard temperature | 273.15 K (0°C) | 66 |
| STP_Pressure | STP_Pressure | Standard pressure | 1 atmosphere | 65 |

### Gas Threshold

| Constant | Symbol | Description | Value | Line |
|----------|--------|-------------|-------|------|
| kGasThreshold | kGasThreshold | Threshold for gas material state | 10^-2 g/cm^3 | 59 |

### Chemical Constants

| Constant | Symbol | Description | Value | Line |
|----------|--------|-------------|-------|------|
| Avogadro | Avogadro | Avogadro's number | 6.02214129e23 /mole | 41 |

### Mathematical Constants

| Constant | Symbol | Description | Value | Line |
|----------|--------|-------------|-------|------|
| pi | pi | Pi (π) | 3.14159265358979323846 | 62 |
| twopi | twopi | 2π | 6.28318530717958647692 | 67 |
| halfpi | halfpi | π/2 | 1.57079632679489661923 | 54 |
| pi2 | pi2 | π^2 | 9.86960440108935861883 | 63 |

### Cosmological Constants

| Constant | Symbol | Description | Value (approximate) | Line |
|----------|--------|-------------|---------------------|------|
| universe_mean_density | universe_mean_density | Mean density of the universe | ~10^-26 kg/m^3 | 71 |

## Usage Examples

### Relativistic Calculations

```cpp
#include "G4PhysicalConstants.hh"
#include "G4SystemOfUnits.hh"

// Calculate relativistic energy
G4double momentum = 500.0 * MeV;  // Momentum
G4double mass = electron_mass_c2;  // Electron mass

// Total energy: E = sqrt(p^2*c^2 + m^2*c^4)
G4double energy = std::sqrt(momentum*momentum*c_squared + mass*mass);

// Kinetic energy
G4double kineticEnergy = energy - mass;

// Velocity (beta = p*c/E)
G4double beta = momentum * c_light / energy;
G4double velocity = beta * c_light;
```

### Quantum Mechanical Calculations

```cpp
#include "G4PhysicalConstants.hh"

// De Broglie wavelength: λ = h/p
G4double momentum = 100.0 * MeV;
G4double wavelength = h_Planck * c_light / momentum;

// Or using ℏc directly
wavelength = hbarc / momentum;  // More common in HEP

// Uncertainty principle: Δx·Δp ≥ ℏ/2
G4double positionUncertainty = 1.0 * nm;
G4double momentumUncertainty = hbar_Planck / (2.0 * positionUncertainty);
```

### Atomic and Nuclear Physics

```cpp
#include "G4PhysicalConstants.hh"

// Rydberg energy
G4double rydbergEnergy = (electron_mass_c2 * fine_structure_const *
                          fine_structure_const) / 2.0;  // ~13.6 eV

// Bohr radius calculation (alternative)
G4double a0 = hbarc / (electron_mass_c2 * fine_structure_const);

// Nuclear binding energy (mass excess)
G4double A = 12;  // Mass number
G4double Z = 6;   // Protons
G4double N = A - Z;  // Neutrons
G4double predictedMass = Z * proton_mass_c2 + N * neutron_mass_c2;
G4double actualMass = 12.0 * amu_c2;  // Carbon-12
G4double bindingEnergy = predictedMass - actualMass;
```

### Electromagnetic Calculations

```cpp
#include "G4PhysicalConstants.hh"

// Cyclotron frequency: ω = qB/m
G4double magneticField = 2.0 * tesla;
G4double charge = electron_charge;
G4double mass = electron_mass_c2 / c_squared;
G4double angularFreq = charge * magneticField / mass;

// Fine structure constant calculations
G4double coupling = fine_structure_const;  // α ≈ 1/137
G4double runningCoupling = coupling / (1.0 - coupling * std::log(Q2));

// Classical electron radius
G4double radius = classic_electr_radius;  // ~2.818 fm
```

### Cross Section Calculations

```cpp
#include "G4PhysicalConstants.hh"

// Thomson cross section: σ_T = (8π/3) * r_e^2
G4double thomsonXS = (8.0 * pi / 3.0) *
                     classic_electr_radius * classic_electr_radius;

// Compton wavelength in cross sections
G4double comptonArea = electron_Compton_length * electron_Compton_length;
```

### Material Properties

```cpp
#include "G4PhysicalConstants.hh"

// Check if material is gas at STP
G4double density = 1.29e-3 * g/cm3;  // Air at STP
G4bool isGas = (density < kGasThreshold);

// Thermal energy at room temperature
G4double roomTemp = 293.15 * kelvin;
G4double thermalEnergy = k_Boltzmann * roomTemp;  // ~25 meV

// Number of atoms per volume
G4double atomicMass = 12.0 * amu_c2;
G4double materialDensity = 2.26 * g/cm3;  // Graphite
G4double numberDensity = Avogadro * materialDensity * c_squared / atomicMass;
```

### Unit Conversions Using Constants

```cpp
#include "G4PhysicalConstants.hh"

// Convert between energy and wavelength
G4double photonEnergy = 1.0 * eV;
G4double photonWavelength = hbarc * twopi / photonEnergy;  // in mm

// Convert to more useful units
G4double wavelengthNm = photonWavelength / nm;  // ~1240 nm
```

### Angular Distributions

```cpp
#include "G4PhysicalConstants.hh"

// Use pi for angular calculations
G4double theta = pi / 4.0;  // 45 degrees in radians
G4double cosTheta = std::cos(theta);

// Full solid angle
G4double fullSolidAngle = 4.0 * pi * steradian;

// Differential cross section with angular dependence
G4double dSigmadOmega = (twopi_mc2_rcl2) * (1.0 + cosTheta*cosTheta);
```

## Best Practices

1. **Use constants instead of hardcoding values:**
   ```cpp
   // Good
   G4double mass = electron_mass_c2;

   // Bad
   G4double mass = 0.511;  // What units? Which particle?
   ```

2. **Include both constants and units headers:**
   ```cpp
   #include "G4PhysicalConstants.hh"
   #include "G4SystemOfUnits.hh"

   G4double energy = electron_mass_c2;  // From constants
   G4double length = 10.0 * cm;         // From units
   ```

3. **Use appropriate constants for clarity:**
   ```cpp
   // Clear and self-documenting
   G4double photonWavelength = twopi * hbarc / energy;

   // Less clear
   G4double photonWavelength = 6.28318 * 197.327 * MeV*fermi / energy;
   ```

4. **Combine constants for common formulas:**
   ```cpp
   // Speed of light squared is provided
   G4double E2 = momentum*momentum * c_squared + mass*mass;

   // Don't recalculate
   // G4double E2 = momentum*momentum * c_light*c_light + mass*mass;
   ```

5. **Document physics assumptions:**
   ```cpp
   // Clearly indicate which particle/process
   G4double restMass = electron_mass_c2;  // For electrons only
   G4double radius = Bohr_radius;         // Ground state hydrogen
   ```

## Common Pitfalls

1. **Confusing mass and mass energy:**
   ```cpp
   // Wrong - electron_mass_c2 is already mc^2
   G4double energy = electron_mass_c2 * c_squared;  // WRONG!

   // Correct usage
   G4double massEnergy = electron_mass_c2;  // In MeV
   G4double mass = electron_mass_c2 / c_squared;  // In MeV/c^2
   ```

2. **Unit inconsistencies with constants:**
   ```cpp
   // Be careful with units
   G4double wavelength = hbarc / momentum;  // OK if momentum in MeV

   // Wrong if momentum not in energy units
   G4double p_SI = 1.0e-24;  // kg·m/s
   // G4double wl = hbarc / p_SI;  // WRONG! Unit mismatch
   ```

3. **Using outdated values:**
   ```cpp
   // Don't hardcode - values get updated
   // const G4double alpha = 1.0/137.0;  // Old approximation

   // Use the provided constant
   G4double alpha = fine_structure_const;  // Current best value
   ```

4. **Forgetting temperature units:**
   ```cpp
   // Wrong - missing unit
   G4double thermalEnergy = k_Boltzmann * 300;  // What is 300?

   // Correct
   G4double thermalEnergy = k_Boltzmann * (300*kelvin);
   ```

5. **Incorrect formula for energy-momentum:**
   ```cpp
   // Wrong - forgot c^2
   // G4double E = std::sqrt(p*p + m*m);  // Dimensionally wrong!

   // Correct
   G4double E = std::sqrt(p*p*c_squared + m*m);
   ```

## Thread Safety

**Thread-Safe:** Yes

All physical constants are compile-time constants imported from CLHEP. They can be safely accessed from multiple threads simultaneously without any synchronization. The constants are read-only and immutable.

## Precision and Accuracy

The constants are imported from CLHEP, which uses values from:
- **CODATA:** Committee on Data for Science and Technology (fundamental constants)
- **PDG:** Particle Data Group (particle properties)
- **IUPAC:** International Union of Pure and Applied Chemistry (atomic masses)

**Precision considerations:**
- Constants are defined with full double precision (~15-16 significant digits)
- Values are updated in CLHEP to match international standards
- For ultra-high precision calculations, check CLHEP version and update dates

## Relationship with Natural Units

In natural units (ℏ = c = 1):
- Energy, mass, and momentum have the same units
- Length and time have inverse energy units
- Many constants simplify or disappear

Geant4 uses practical units (MeV, mm, ns) but provides constants like `c_light` and `hbarc` to bridge to natural units:

```cpp
// Natural units conversion
G4double energy_natural = energy / (hbarc);  // From MeV to 1/mm
G4double time_natural = time * c_light;       // From ns to mm
```

## CLHEP Dependency

This header imports all constants from `CLHEP/Units/PhysicalConstants.h`. The actual constant values are defined and maintained in CLHEP to ensure:
- Consistency with other HEP software
- Regular updates to match latest measurements
- Community-reviewed values

**CLHEP Update Cycle:**
- Constants updated when new CODATA/PDG releases occur
- Typically every few years
- Check CLHEP documentation for specific values and uncertainties

## Related Headers

- [G4SystemOfUnits.hh](g4systemofunits.md) - Unit definitions and conversion factors
- [G4Types.hh](g4types.md) - Fundamental type definitions
- [globals.hh](globals.md) - Common includes
- CLHEP PhysicalConstants.h - Source of constant values

## Version Information

**Introduced:** Geant4 1.0
**Stability:** Stable - API rarely changes, values updated periodically
**CLHEP Version:** Depends on CLHEP version in build

## Notes

- Constants are in Geant4 internal units (MeV, mm, ns, etc.)
- This header should be included in `.cc` files, not `.hh` headers
- Values may change slightly between CLHEP versions as measurements improve
- For publication-quality results, document which Geant4/CLHEP version was used
- Some constants (like `universe_mean_density`) are approximate and subject to ongoing research
- Mathematical constants (`pi`, `twopi`, etc.) are provided for convenience and consistency
- When very high precision is needed (> 10^-15 relative), verify constant values in CLHEP source

## See Also

- [G4SystemOfUnits.hh](g4systemofunits.md) - Physical units
- [G4Types.hh](g4types.md) - Type definitions
- Geant4 Physics Reference Manual
- CODATA Recommended Values: https://physics.nist.gov/cuu/Constants/
- Particle Data Group: https://pdg.lbl.gov/
- CLHEP documentation: http://proj-clhep.web.cern.ch/
