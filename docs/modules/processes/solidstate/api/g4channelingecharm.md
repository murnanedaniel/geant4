# G4ChannelingECHARM

**File**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh`

## Overview

G4ChannelingECHARM handles the reading and interpolation of ECHARM (Evaluated CHanneling RAdiation Model) data files containing pre-calculated crystal potentials, electric fields, and density distributions. These tables provide the continuum potential experienced by channeled particles and are essential for accurate channeling simulation.

## Class Description

G4ChannelingECHARM manages crystallographic data:

- **File I/O**: Reads ECHARM format data files
- **Potential Storage**: Maintains 1D or 2D potential distributions
- **Electric Field Storage**: Stores pre-calculated field components
- **Density Distributions**: Nuclear and electron density maps
- **Interpolation**: Provides values at arbitrary positions
- **Extrema Tracking**: Stores potential maximum, minimum, and depth

ECHARM files contain averaged continuum potentials calculated from realistic atomic charge distributions using methods like Doyle-Turner or Moliere approximations.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh:34`

## Constructor & Destructor

### Constructor

```cpp
G4ChannelingECHARM(const G4String& filename, G4double unitOfMeasure);
```

Creates ECHARM data object and loads from file.

**Parameters**:
- `filename`: Path to ECHARM data file
- `unitOfMeasure`: Unit conversion factor for data values

**Process**:
1. Opens specified file
2. Reads file header (dimensions, spacing, units)
3. Loads potential/field values into physics vectors
4. Calculates maximum and minimum values
5. Stores interplanar spacing

**File Format**: ECHARM files are ASCII tables with:
- Header: Grid dimensions, spacing, units
- Body: Potential/field values at grid points
- Can be 1D (planar channeling) or 2D (axial channeling)

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh:37`

### Destructor

```cpp
~G4ChannelingECHARM();
```

Cleans up physics vector storage.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh:38`

## Data Access Methods

### GetEC

```cpp
G4double GetEC(G4ThreeVector& position);
```

Retrieves electric field component or potential at specified position.

**Parameters**:
- `position`: Position in crystal coordinates (x, y, z)

**Returns**: Field/potential value at position (with interpolation)

**Implementation**:
- 1D data: Uses x coordinate, interpolates linearly
- 2D data: Uses x and y coordinates, bilinear interpolation
- Periodic boundary conditions applied (wraps to unit cell)

**Usage**: Called by G4Channeling during trajectory integration to get forces on particle.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh:41`

### GetMax

```cpp
G4double GetMax();
```

Returns maximum value in stored data.

**Returns**: Maximum potential/field value

**Usage**: Used for potential well depth calculations in critical angle formula.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh:45`

### GetMin

```cpp
G4double GetMin();
```

Returns minimum value in stored data.

**Returns**: Minimum potential/field value

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh:46`

### GetMaxMin

```cpp
G4double GetMaxMin();
```

Returns potential well depth (difference between max and min).

**Returns**: |U_max - U_min|

**Implementation**: Line 47

```cpp
return std::fabs(fMaximum-fMinimum);
```

**Physical Meaning**: Total depth of potential well. Determines critical angle via θ_c = √(2U₀/E).

**Typical Values**:
- Si(110) planar: U₀ ≈ 22 eV
- Ge(110) planar: U₀ ≈ 35 eV
- W(110) planar: U₀ ≈ 150 eV

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh:47`

### GetIntSp

```cpp
G4double GetIntSp(G4int index);
```

Returns interplanar or interaxial spacing.

**Parameters**:
- `index`: Dimension index (0=x, 1=y, 2=z)

**Returns**: Spacing in length units

**Physical Meaning**:
- For planar channeling: Distance between adjacent atomic planes
- For axial channeling: Distance between adjacent atomic rows

**Typical Values**:
- Si(110): d = 1.92 Å
- Si(111): d = 3.14 Å
- Ge(110): d = 2.00 Å

**Usage**: Used in oscillation period calculation and coordinate wrapping.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh:49`

## File Reading

### ReadFromECHARM

```cpp
virtual void ReadFromECHARM(const G4String& filename, G4double unitOfMeasure);
```

Reads ECHARM format data file.

**Parameters**:
- `filename`: Path to data file
- `unitOfMeasure`: Unit conversion factor

**File Processing**:
1. Parses header for dimensions and spacing
2. Determines if 1D or 2D data
3. Allocates appropriate physics vector (G4PhysicsVector or G4Physics2DVector)
4. Reads values row by row
5. Calculates extrema
6. Stores spacing information

**Error Handling**:
- Throws exception if file not found
- Validates data dimensions
- Checks for consistent spacing

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingECHARM.hh:43`

## Private Data Members

### Physics Vector Storage

```cpp
private:
G4PhysicsVector* fVectorEC;      // Line 52: 1D data (planar channeling)
G4Physics2DVector* fVectorEC2D;  // Line 53: 2D data (axial channeling)
```

One of these will be nullptr depending on data dimensionality.

### Grid Parameters

```cpp
private:
G4double fDistances[3];  // Line 55: Interplanar/interaxial spacings
G4int fPoints[3];        // Line 56: Number of grid points in each dimension
```

### Extrema

```cpp
private:
G4double fMaximum;  // Line 58: Maximum value in dataset
G4double fMinimum;  // Line 59: Minimum value in dataset
```

## ECHARM File Format

### Header Format

```
# ECHARM Data File
# Crystal: Si(110)
# Potential type: Doyle-Turner
DIMENSIONS: 1
POINTS: 200
SPACING: 0.01 angstrom
UNIT: eV
```

### Data Format (1D Example)

```
# Position [Angstrom]   Potential [eV]
0.000000    22.450000
0.010000    22.230000
0.020000    21.780000
...
1.920000    -8.120000
```

### Data Format (2D Example)

```
# X [Angstrom]   Y [Angstrom]   Potential [eV]
0.000    0.000    35.200
0.010    0.000    34.980
...
```

## Usage Example

```cpp
#include "G4ChannelingECHARM.hh"

// Load potential data for Si(110)
G4ChannelingECHARM* potential =
    new G4ChannelingECHARM("data/Si110_pot.dat", eV);

// Get potential well depth
G4double U0 = potential->GetMaxMin();
G4cout << "Potential depth: " << U0/eV << " eV" << G4endl;

// Get interplanar spacing
G4double d = potential->GetIntSp(0);
G4cout << "Interplanar spacing: " << d/angstrom << " Angstrom" << G4endl;

// Interpolate potential at specific position
G4ThreeVector pos(0.5*angstrom, 0.0, 0.0);
G4double U = potential->GetEC(pos);
G4cout << "Potential at x=0.5 A: " << U/eV << " eV" << G4endl;
```

## Data Generation

ECHARM files are typically generated using:

1. **Theoretical Calculations**:
   - Doyle-Turner atomic form factors
   - Moliere approximation
   - Density functional theory (DFT)

2. **Tools**:
   - ECHARM software package
   - Custom scripts for specific crystals
   - Online databases (channeling.eu)

3. **Validation**:
   - Comparison with experimental channeling measurements
   - Critical angle measurements
   - Dechanneling length data

## Performance Notes

**Memory Usage**:
- 1D data: ~1-10 KB (typical 100-1000 points)
- 2D data: ~100 KB - 1 MB (typical 100×100 to 500×500 grid)

**Lookup Speed**:
- 1D interpolation: ~10-20 ns per call
- 2D interpolation: ~50-100 ns per call
- Pre-calculated tables make this very fast

**Accuracy**:
- Grid spacing: Typically 0.01-0.1 Å
- Interpolation error: <1% with proper spacing
- Quantum effects not included (classical continuum potential)

## See Also

- [G4ChannelingMaterialData](g4channelingmaterialdata.md) - Container for multiple ECHARM objects
- [G4Channeling](g4channeling.md) - Main process using these data
- G4PhysicsVector - Underlying interpolation class
- G4Physics2DVector - 2D interpolation class
