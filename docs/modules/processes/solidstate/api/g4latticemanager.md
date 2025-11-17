# G4LatticeManager

**File**: `source/processes/solidstate/phonon/include/G4LatticeManager.hh`

## Overview

G4LatticeManager is a global singleton that manages the registry of logical and physical lattices associated with materials and volumes. It provides the central access point for all lattice properties needed by phonon processes, including dispersion relations, velocities, and material constants.

## Class Description

G4LatticeManager provides lattice management:

- **Singleton Pattern**: Global shared instance across worker threads
- **Lattice Registry**: Stores unique lattice pointers for cleanup
- **Material Association**: Maps materials to logical lattices
- **Volume Association**: Maps physical volumes to physical lattices (with orientation)
- **File Loading**: Reads lattice data from configuration files
- **Dispersion Relations**: Provides ω(k) and v(k) mappings

**Thread Safety**: Global singleton shared across threads (Lines 32, 49).

**Location**: `source/processes/solidstate/phonon/include/G4LatticeManager.hh:47`

## Singleton Access

### GetLatticeManager

```cpp
static G4LatticeManager* GetLatticeManager();
```

Returns pointer to global singleton instance.

**Returns**: G4LatticeManager singleton

**Usage**:
```cpp
G4LatticeManager* latMan = G4LatticeManager::GetLatticeManager();
```

**Thread Safety**: Same instance shared across all threads.

**Location**: Line 52

## Configuration

### SetVerboseLevel

```cpp
void SetVerboseLevel(G4int vb);
```

Sets verbosity for diagnosticmessages.

**Parameters**:
- `vb`: Verbosity level (0=quiet, 1=normal, 2=detailed)

**Location**: Line 54

### Reset

```cpp
void Reset();
```

Removes and deletes all registered lattices.

**Actions**:
1. Clears volume→lattice maps
2. Clears material→lattice maps
3. Deletes all registered lattice objects
4. Resets registries

**Usage**: Called between runs or for cleanup.

**Location**: Line 56

## Lattice Registration

### RegisterLattice (Physical Volume + Physical Lattice)

```cpp
G4bool RegisterLattice(
    G4VPhysicalVolume* volume,
    G4LatticePhysical* lattice
);
```

Associates physical lattice (with orientation) to volume.

**Parameters**:
- `volume`: Physical volume for lattice
- `lattice`: Physical lattice (includes orientation info)

**Returns**: `true` if successful, `false` if already registered

**Usage**:
```cpp
G4LatticePhysical* physLat = new G4LatticePhysical(logicalLat, orientation);
latMan->RegisterLattice(detectorPV, physLat);
```

**Location**: Line 59

### RegisterLattice (Physical Volume + Logical Lattice)

```cpp
G4bool RegisterLattice(
    G4VPhysicalVolume* volume,
    G4LatticeLogical* lattice
);
```

Associates logical lattice to volume (identity orientation assumed).

**Parameters**:
- `volume`: Physical volume
- `lattice`: Logical lattice (dispersion relations, no orientation)

**Returns**: `true` if successful

**Convenience**: Creates G4LatticePhysical internally with identity rotation.

**Location**: Line 60

### RegisterLattice (Material + Logical Lattice)

```cpp
G4bool RegisterLattice(
    G4Material* material,
    G4LatticeLogical* lattice
);
```

Associates logical lattice with material.

**Parameters**:
- `material`: G4Material pointer
- `lattice`: Logical lattice for this material

**Returns**: `true` if successful

**Purpose**: Default lattice for material, used when no volume-specific lattice registered.

**Location**: Line 63

## Lattice Loading

### LoadLattice (Material)

```cpp
G4LatticeLogical* LoadLattice(
    G4Material* material,
    const G4String& latDir
);
```

Loads logical lattice from configuration directory and registers with material.

**Parameters**:
- `material`: Material to associate lattice with
- `latDir`: Directory name under $G4LATTICEDATA (e.g., "Ge")

**Returns**: Pointer to loaded logical lattice

**Process**:
1. Looks for `$G4LATTICEDATA/<latDir>/config.txt`
2. Uses G4LatticeReader to parse configuration
3. Loads velocity maps and other properties
4. Registers lattice with material
5. Returns lattice pointer

**Example**:
```cpp
G4Material* Ge = nistManager->FindOrBuildMaterial("G4_Ge");
G4LatticeLogical* geLattice = latMan->LoadLattice(Ge, "Ge");
```

**Location**: Line 66

### LoadLattice (Physical Volume)

```cpp
G4LatticePhysical* LoadLattice(
    G4VPhysicalVolume* volume,
    const G4String& latDir
);
```

Loads and registers lattice for physical volume.

**Parameters**:
- `volume`: Physical volume
- `latDir`: Directory under $G4LATTICEDATA

**Returns**: Pointer to physical lattice

**Process**:
1. Extracts material from volume
2. Loads logical lattice from latDir
3. Creates physical lattice (oriented)
4. Registers with volume
5. Returns physical lattice pointer

**Convenience**: Combines loading and registration in one call.

**Location**: Line 71

## Lattice Retrieval

### GetLattice (Material)

```cpp
G4LatticeLogical* GetLattice(G4Material* material) const;
```

Retrieves logical lattice for material.

**Parameters**:
- `material`: Material to query

**Returns**: Logical lattice pointer, or nullptr if not registered

**Usage**:
```cpp
G4LatticeLogical* lattice = latMan->GetLattice(material);
if (lattice) {
    // Use lattice properties
}
```

**Location**: Line 67

### GetLattice (Physical Volume)

```cpp
G4LatticePhysical* GetLattice(G4VPhysicalVolume* volume) const;
```

Retrieves physical lattice for volume.

**Parameters**:
- `volume`: Volume to query (pass nullptr for default)

**Returns**: Physical lattice pointer, or nullptr if not registered

**Note**: Passing volume==0 returns the default lattice (Line 73).

**Location**: Line 74

### HasLattice (Material)

```cpp
G4bool HasLattice(G4Material* material) const;
```

Checks if material has registered lattice.

**Parameters**:
- `material`: Material to check

**Returns**: `true` if lattice registered, `false` otherwise

**Location**: Line 68

### HasLattice (Physical Volume)

```cpp
G4bool HasLattice(G4VPhysicalVolume* volume) const;
```

Checks if volume has registered lattice.

**Parameters**:
- `volume`: Volume to check

**Returns**: `true` if lattice registered, `false` otherwise

**Location**: Line 75

## Dispersion Relation Access

### MapKtoV

```cpp
G4double MapKtoV(
    G4VPhysicalVolume* volume,
    G4int polarization,
    const G4ThreeVector& k
) const;
```

Returns phonon group velocity magnitude for given k-vector.

**Parameters**:
- `volume`: Volume containing lattice
- `polarization`: Polarization code (0=L, 1=TS, 2=TF)
- `k`: Wavevector in crystal frame

**Returns**: Group velocity magnitude |v_g| [length/time]

**Formula**: v_g = dω/dk (from dispersion relation)

**Usage**:
```cpp
G4ThreeVector k(0.1/nm, 0, 0);
G4double vL = latMan->MapKtoV(volume, 0, k);  // L phonon velocity
```

**Location**: Line 77

### MapKtoVDir

```cpp
G4ThreeVector MapKtoVDir(
    G4VPhysicalVolume* volume,
    G4int polarization,
    const G4ThreeVector& k
) const;
```

Returns phonon group velocity direction for given k-vector.

**Parameters**:
- `volume`: Volume containing lattice
- `polarization`: Polarization code
- `k`: Wavevector

**Returns**: Unit vector in direction of group velocity

**Anisotropy**: Direction not necessarily parallel to k for anisotropic crystals.

**Usage**:
```cpp
G4ThreeVector vDir = latMan->MapKtoVDir(volume, 0, k);
G4double vMag = latMan->MapKtoV(volume, 0, k);
G4ThreeVector velocity = vDir * vMag;
```

**Location**: Lines 79-80

## Private Data Members

### Verbosity

```cpp
protected:
G4int verboseLevel;  // Line 86
```

Controls diagnostic output (0=quiet, 1=normal, 2=verbose).

### Logical Lattice Storage

```cpp
protected:
typedef std::map<G4Material*, G4LatticeLogical*> LatticeMatMap;
typedef std::set<G4LatticeLogical*> LatticeLogReg;

LatticeLogReg fLLattices;      // Line 91: Registry of unique lattice pointers
LatticeMatMap fLLatticeList;   // Line 92: Material → Lattice map
```

**Registry**: Owns lattice pointers for deletion at cleanup.
**Map**: Fast lookup from material to lattice.

### Physical Lattice Storage

```cpp
protected:
typedef std::map<G4VPhysicalVolume*, G4LatticePhysical*> LatticeVolMap;
typedef std::set<G4LatticePhysical*> LatticePhyReg;

LatticePhyReg fPLattices;      // Line 97: Registry of unique lattice pointers
LatticeVolMap fPLatticeList;   // Line 98: Volume → Lattice map
```

## Data Organization

```
$G4LATTICEDATA/
├── Ge/
│   ├── config.txt          # Main configuration
│   ├── FT_map.ssv          # Fast transverse dispersion
│   ├── ST_map.ssv          # Slow transverse dispersion
│   └── L_map.ssv           # Longitudinal dispersion
├── Si/
│   └── ...
└── Al/
    └── ...
```

## Configuration File Format

**config.txt** example:
```
# Germanium lattice configuration
dyn 0.141e12 0.141e12 0.366e12 0.366e12
scat 3.67e-41 0 0 0
decay 1.6e-54 0 0 0
LDOS 0.0000093451
STDOS 0.0000093451
FTDOS 0.0000093451
FT FT_map.ssv
ST ST_map.ssv
L L_map.ssv
```

**Fields**:
- `dyn`: Dynamical constants (4 values)
- `scat`: Scattering parameters
- `decay`: Decay constants
- `LDOS`, `STDOS`, `FTDOS`: Density of states
- `FT`, `ST`, `L`: Velocity map filenames

## Complete Usage Example

```cpp
#include "G4LatticeManager.hh"
#include "G4NistManager.hh"

// In detector construction

// Get managers
G4LatticeManager* latMan = G4LatticeManager::GetLatticeManager();
G4NistManager* nistMan = G4NistManager::Instance();

// Set verbosity
latMan->SetVerboseLevel(1);

// Create material
G4Material* Ge = nistMan->FindOrBuildMaterial("G4_Ge");

// Load lattice from $G4LATTICEDATA/Ge/
G4LatticeLogical* geLattice = latMan->LoadLattice(Ge, "Ge");

// Create detector volume
G4Box* detectorSolid = new G4Box("DetectorBox", 1*cm, 1*cm, 1*cm);
G4LogicalVolume* detectorLV = new G4LogicalVolume(detectorSolid, Ge, "DetectorLV");
G4VPhysicalVolume* detectorPV = new G4PVPlacement(..., detectorLV, ...);

// Associate lattice with volume
latMan->RegisterLattice(detectorPV, geLattice);

// Later: query lattice properties
G4LatticePhysical* lattice = latMan->GetLattice(detectorPV);
if (lattice) {
    G4ThreeVector k(0.1/nm, 0, 0);
    G4double vL = latMan->MapKtoV(detectorPV, 0, k);
    G4cout << "L phonon velocity: " << vL/(m/s) << " m/s" << G4endl;
}
```

## See Also

- [G4LatticeReader](g4latticereader.md) - Configuration file parser
- [G4VPhononProcess](g4vphononprocess.md) - Uses lattice data
- G4LatticeLogical - Dispersion relation storage
- G4LatticePhysical - Oriented lattice with transformations
