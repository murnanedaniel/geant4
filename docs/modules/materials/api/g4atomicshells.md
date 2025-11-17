# G4AtomicShells

**File**: `source/materials/include/G4AtomicShells.hh`

## Overview

G4AtomicShells is a utility class that provides access to atomic subshell binding energies and electron configurations for the first 105 elements. This class stores tabulated data from various authoritative sources and provides static methods to query shell properties. It is used throughout Geant4's electromagnetic physics processes for calculations involving atomic shell interactions.

## Class Description

G4AtomicShells is a pure static class (no instances are created) that encapsulates atomic shell data including:

- **Binding energies**: Energy required to remove an electron from each shell
- **Electron populations**: Number of electrons in each subshell
- **Shell structure**: Organization of shells for each element
- **Free electron calculations**: Number of electrons above a threshold energy

**Location**: G4AtomicShells.hh:50

**First implemented**: Version 24-04-98 by V. Grichine

## Data Sources

The atomic shell data comes from multiple authoritative references:

1. **Mean ionization energies (I)**: Janni J.F. 1982 (with estimations for some elements)
2. **Subshell binding energies I(i)**:
   - T.A. Carlson, "Photoelectron and Auger Spectroscopy", Plenum, New York, 1976, p.337
   - CRC Handbook of Chemistry and Physics, 73rd Edition, 1992-1993

**Location**: Comments in G4AtomicShells.hh:30-36

## Static Methods

### GetNumberOfShells

```cpp
static G4int GetNumberOfShells(G4int Z);
```

Returns the number of electron shells for a given element.

**Parameters**:
- `Z`: Atomic number (1-105)

**Returns**: Number of shells (e.g., K, L1, L2, L3, M1, etc.)

**Location**: G4AtomicShells.hh:53

**Example**:
```cpp
G4int nShells = G4AtomicShells::GetNumberOfShells(6);  // Carbon: returns 4 (K, L1, L2, L3)
```

### GetNumberOfElectrons

```cpp
static G4int GetNumberOfElectrons(G4int Z, G4int SubshellNb);
```

Returns the number of electrons in a specific subshell.

**Parameters**:
- `Z`: Atomic number (1-105)
- `SubshellNb`: Subshell index (0 = first shell)

**Returns**: Number of electrons in that subshell

**Location**: G4AtomicShells.hh:54

**Added**: Version 11-02-05 by V. Ivanchenko

**Example**:
```cpp
// Carbon (Z=6): K shell (shell 0)
G4int nElectrons = G4AtomicShells::GetNumberOfElectrons(6, 0);  // Returns 2
```

### GetNumberOfFreeElectrons

```cpp
static G4int GetNumberOfFreeElectrons(G4int Z, G4double th);
```

Returns the number of electrons with binding energy less than threshold.

**Parameters**:
- `Z`: Atomic number (1-105)
- `th`: Energy threshold

**Returns**: Count of electrons in shells with binding energy < th

**Location**: G4AtomicShells.hh:55

**Usage**: For determining which electrons can participate in interactions above a certain energy.

**Example**:
```cpp
// Find electrons in iron that can be ionized by 1 keV
G4int nFree = G4AtomicShells::GetNumberOfFreeElectrons(26, 1*keV);
```

### GetBindingEnergy

```cpp
static G4double GetBindingEnergy(G4int Z, G4int SubshellNb);
```

Returns the binding energy of a specific subshell.

**Parameters**:
- `Z`: Atomic number (1-105)
- `SubshellNb`: Subshell index (0 = first shell)

**Returns**: Binding energy in Geant4 energy units

**Location**: G4AtomicShells.hh:56

**Example**:
```cpp
// Carbon K-shell binding energy
G4double eBinding = G4AtomicShells::GetBindingEnergy(6, 0);  // ~288 eV
```

### GetTotalBindingEnergy

```cpp
static G4double GetTotalBindingEnergy(G4int Z);
```

Returns the sum of binding energies of all electrons in an atom.

**Parameters**:
- `Z`: Atomic number (1-105)

**Returns**: Total binding energy in Geant4 energy units

**Location**: G4AtomicShells.hh:57

**Example**:
```cpp
G4double totalBE = G4AtomicShells::GetTotalBindingEnergy(6);  // Carbon
```

## Private Data Members

```cpp
static const G4int fNumberOfShells[105];
static const G4int fIndexOfShells[105];
static const G4int fNumberOfElectrons[1650];
static const G4double fBindingEnergies[1650];
```

**Location**: G4AtomicShells.hh:64-67

**Members**:
- `fNumberOfShells`: Number of shells for each element (indexed by Z-1)
- `fIndexOfShells`: Starting index in data arrays for each element's shells
- `fNumberOfElectrons`: Electron count for each shell (flat array for all elements)
- `fBindingEnergies`: Binding energy for each shell (flat array for all elements)

**Note**: Arrays are private and accessed only through static methods.

## Usage Examples

### Query Shell Properties

```cpp
#include "G4AtomicShells.hh"
#include "G4SystemOfUnits.hh"

// Query oxygen (Z=8) shell structure
G4int Z = 8;
G4int nShells = G4AtomicShells::GetNumberOfShells(Z);

G4cout << "Oxygen has " << nShells << " shells:" << G4endl;
for (G4int i = 0; i < nShells; i++) {
    G4int nElectrons = G4AtomicShells::GetNumberOfElectrons(Z, i);
    G4double bindingE = G4AtomicShells::GetBindingEnergy(Z, i);

    G4cout << "  Shell " << i
           << ": " << nElectrons << " electrons"
           << ", binding energy = " << bindingE/eV << " eV"
           << G4endl;
}
```

### Calculate Shell Ionization Threshold

```cpp
// Find minimum energy needed to ionize K-shell of carbon
G4int Z = 6;
G4double kShellBE = G4AtomicShells::GetBindingEnergy(Z, 0);

G4cout << "Minimum photon energy to ionize carbon K-shell: "
       << kShellBE/keV << " keV" << G4endl;
```

### Count Available Electrons for Interaction

```cpp
// For Compton scattering at 10 keV on copper (Z=29)
G4double photonEnergy = 10*keV;
G4int Z = 29;

// Count electrons that can participate (binding energy < photon energy)
G4int nAvailable = G4AtomicShells::GetNumberOfFreeElectrons(Z, photonEnergy);

G4cout << "Copper has " << nAvailable
       << " electrons available for 10 keV photon interaction" << G4endl;
```

### Total Binding Energy Calculation

```cpp
// Calculate total binding energy for iron (Z=26)
G4int Z = 26;
G4double totalBE = G4AtomicShells::GetTotalBindingEnergy(Z);

G4cout << "Total binding energy of iron atom: "
       << totalBE/keV << " keV" << G4endl;

// Verify by summing individual shells
G4double sum = 0;
G4int nShells = G4AtomicShells::GetNumberOfShells(Z);
for (G4int i = 0; i < nShells; i++) {
    G4int nElec = G4AtomicShells::GetNumberOfElectrons(Z, i);
    G4double shellBE = G4AtomicShells::GetBindingEnergy(Z, i);
    sum += nElec * shellBE;
}

G4cout << "Sum of shell binding energies: " << sum/keV << " keV" << G4endl;
```

### Select Shell for Photoelectric Effect

```cpp
// Select which shell is ionized in photoelectric effect
G4double photonEnergy = 50*keV;
G4int Z = 79;  // Gold

G4int selectedShell = -1;
G4int nShells = G4AtomicShells::GetNumberOfShells(Z);

// Find highest-binding shell that photon can ionize
for (G4int i = 0; i < nShells; i++) {
    G4double bindingE = G4AtomicShells::GetBindingEnergy(Z, i);
    if (photonEnergy > bindingE) {
        selectedShell = i;
        break;
    }
}

if (selectedShell >= 0) {
    G4cout << "Photon can ionize shell " << selectedShell
           << " (binding energy = "
           << G4AtomicShells::GetBindingEnergy(Z, selectedShell)/keV
           << " keV)" << G4endl;
}
```

### Print Complete Shell Structure

```cpp
void PrintShellStructure(G4int Z) {
    if (Z < 1 || Z > 105) {
        G4cout << "Invalid atomic number" << G4endl;
        return;
    }

    G4int nShells = G4AtomicShells::GetNumberOfShells(Z);
    G4int totalElectrons = 0;

    G4cout << "Shell structure for Z = " << Z << G4endl;
    G4cout << "Shell  Electrons  Binding Energy (eV)" << G4endl;
    G4cout << "-----  ---------  -------------------" << G4endl;

    for (G4int i = 0; i < nShells; i++) {
        G4int nElec = G4AtomicShells::GetNumberOfElectrons(Z, i);
        G4double bindingE = G4AtomicShells::GetBindingEnergy(Z, i);
        totalElectrons += nElec;

        G4cout << std::setw(5) << i
               << std::setw(11) << nElec
               << std::setw(21) << bindingE/eV
               << G4endl;
    }

    G4cout << "Total electrons: " << totalElectrons << G4endl;
    G4cout << "Total binding energy: "
           << G4AtomicShells::GetTotalBindingEnergy(Z)/keV << " keV"
           << G4endl;
}
```

### Energy Loss to Atomic Electrons

```cpp
// Calculate maximum energy that can be transferred to bound electrons
G4double CalculateMaxEnergyTransfer(G4int Z, G4double projectileEnergy) {
    // For simplicity, assume K-shell electrons can absorb most energy
    G4double kShellBE = G4AtomicShells::GetBindingEnergy(Z, 0);

    // Maximum energy transfer depends on kinematics and binding
    G4double maxTransfer = projectileEnergy - kShellBE;

    return (maxTransfer > 0) ? maxTransfer : 0.0;
}
```

### Cross Section Weighting by Electrons

```cpp
// Weight cross section by number of available electrons
G4double GetEffectiveCrossSection(G4int Z, G4double energy,
                                   G4double xsPerElectron) {
    // Count electrons that can participate
    G4int nFree = G4AtomicShells::GetNumberOfFreeElectrons(Z, energy);

    // Effective cross section
    return nFree * xsPerElectron;
}
```

## Shell Nomenclature

Shells are indexed sequentially starting from 0:

- **Index 0**: Always the innermost (K) shell
- **Subsequent indices**: Ordered by increasing principal quantum number and angular momentum

### Examples

**Hydrogen (Z=1)**:
- Shell 0: K shell (1s)

**Carbon (Z=6)**:
- Shell 0: K shell (1s)
- Shell 1: L1 shell (2s)
- Shell 2: L2 shell (2p₁/₂)
- Shell 3: L3 shell (2p₃/₂)

**Iron (Z=26)**:
- Shells 0-3: K and L shells
- Shells 4-8: M shells (M1-M5)
- Shells 9-10: N shells

## Important Notes

### Element Range

- **Valid Z range**: 1 to 105 (Hydrogen to Dubnium)
- **Invalid Z**: Methods may return 0 or issue warnings
- **Check Z**: Always validate atomic number before use

### Energy Units

- **Binding energies**: Returned in Geant4 internal energy units
- **Conversion**: Use `CLHEP` or `G4SystemOfUnits` for conversion
- **Typical values**: K-shell binding energies range from ~13.6 eV (H) to ~100 keV (heavy elements)

### Shell Indexing

- **Zero-based**: First shell is index 0
- **Sequential**: Shells are numbered in order of increasing energy
- **No gaps**: Valid indices are 0 to GetNumberOfShells(Z)-1

### Thread Safety

- **Read-only data**: All data is const static
- **Thread-safe**: Can be called from any thread
- **No initialization**: Data is compiled into the library

### Performance

- **Fast access**: Direct array lookup, no computation
- **No overhead**: Pure static methods with minimal logic
- **Cache-friendly**: Small data structures

## Shell Binding Energy Table Sample

Here are K-shell binding energies for selected elements (in eV):

| Element | Z  | K-shell Binding Energy |
|---------|----|-----------------------|
| H       | 1  | 13.6                  |
| C       | 6  | 288                   |
| O       | 8  | 543.1                 |
| Al      | 13 | 1564                  |
| Fe      | 26 | 7112                  |
| Cu      | 29 | 8979                  |
| Ag      | 47 | 25514                 |
| Au      | 79 | 80725                 |
| U       | 92 | 115606                |

**Source**: G4AtomicShells.hh data tables (lines 64-67, data starting line 70)

## Version History

Key changes from header comments (G4AtomicShells.hh:40-43):

- **30-04-10**: Added fIndexOfShells array (V. Ivanchenko)
- **11-02-05**: Added GetNumberOfElectrons(Z, ShellNb) (V. Ivanchenko)
- **16-11-98**: Added GetBindingEnergy(Z, ShellNb) (M. Maire)
- **24-04-98**: First implementation (V. Grichine)

## Common Use Cases

### Photoelectric Effect

```cpp
// Determine if photoelectric effect can occur
G4bool CanPhotoelectricOccur(G4int Z, G4double photonEnergy) {
    G4double kShellBE = G4AtomicShells::GetBindingEnergy(Z, 0);
    return photonEnergy > kShellBE;
}
```

### Auger Electron Emission

```cpp
// Calculate Auger electron energy
G4double CalculateAugerEnergy(G4int Z, G4int vacancyShell,
                              G4int augerShell1, G4int augerShell2) {
    G4double vacancyBE = G4AtomicShells::GetBindingEnergy(Z, vacancyShell);
    G4double auger1BE = G4AtomicShells::GetBindingEnergy(Z, augerShell1);
    G4double auger2BE = G4AtomicShells::GetBindingEnergy(Z, augerShell2);

    // Simplified Auger energy
    return vacancyBE - auger1BE - auger2BE;
}
```

### Fluorescence Yield

```cpp
// Use shell binding energies to estimate fluorescence yield
G4double EstimateFluorescenceYield(G4int Z) {
    G4double kShellBE = G4AtomicShells::GetBindingEnergy(Z, 0);

    // Simple parametrization (actual calculation more complex)
    G4double Z4 = Z * Z * Z * Z;
    return Z4 / (Z4 + 1e6);
}
```

## Related Classes

- [G4Element](./g4element.md) - Uses shell data for atomic properties
- [G4ElementData](./g4elementdata.md) - Stores shell-specific cross section data
- [G4IonisParamElm](./g4ionisparamelm.md) - Ionization parameters using shell data
- [G4AtomicTransitionManager](./g4atomictransitionmanager.md) - Manages atomic de-excitation
- [G4AtomicDeexcitation](./g4atomicdeexcitation.md) - Simulates fluorescence and Auger

## Physics Processes Using Shell Data

- **Photoelectric effect**: Select ionization shell based on binding energies
- **Compton scattering**: Weight by available electron density
- **Ionization**: Calculate energy loss to bound electrons
- **Auger emission**: Compute Auger electron energies
- **Fluorescence**: Determine X-ray emission energies
- **PIXE**: Particle-induced X-ray emission simulations

## See Also

- [Electromagnetic Physics Module](../electromagnetic/overview.md) - EM processes using shell data
- [Materials Module Overview](../overview.md) - General materials documentation
