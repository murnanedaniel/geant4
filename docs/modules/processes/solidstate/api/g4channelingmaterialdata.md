# G4ChannelingMaterialData

**File**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh`

## Overview

G4ChannelingMaterialData is a material extension class that stores all channeling-related properties for a crystal material. It manages ECHARM data tables for potentials, electric fields, and density distributions, and handles bent crystal configurations. This class must be attached to G4ExtendedMaterial instances to enable channeling simulation.

## Class Description

G4ChannelingMaterialData provides complete crystal characterization:

- **ECHARM Table Management**: Stores potential, electric field, and density distributions
- **Composite Materials**: Supports element-specific data for compounds
- **Bent Crystal Geometry**: Manages position-dependent bending radius
- **Material Extension**: Integrates with Geant4's extended material system
- **File Loading**: Automatic data loading from file paths

This class serves as the bridge between crystallographic data files and the channeling process, making crystal properties accessible during simulation.

**Inheritance**: G4VMaterialExtension

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:41`

## Constructor & Destructor

### Constructor

```cpp
G4ChannelingMaterialData(const G4String& name);
```

Creates channeling material data object.

**Parameters**:
- `name`: Extension name (typically "channeling")

**Initialization**:
- Sets extension name for retrieval
- Initializes ECHARM pointers to nullptr
- Sets bent crystal flag to false
- Prepares element maps for compounds

**Usage**: Created and attached to G4ExtendedMaterial:

```cpp
G4ExtendedMaterial* crystal = new G4ExtendedMaterial("Si_Crystal", baseMaterial);
G4ChannelingMaterialData* chanData = new G4ChannelingMaterialData("channeling");
crystal->RegisterExtension(chanData);
```

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:44`

### Destructor

```cpp
virtual ~G4ChannelingMaterialData();
```

Cleans up all allocated ECHARM objects and element-specific data.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:45`

## File Configuration

### SetFilename

```cpp
void SetFilename(const G4String& filename);
```

Sets base filename for loading all ECHARM data files.

**Parameters**:
- `filename`: Base filename (without extension) for crystal data

**File Loading**:
Automatically loads five ECHARM files:
- `<filename>_pot.dat`: Continuum potential U(x,y)
- `<filename>_efx.dat`: Electric field x-component E_x(x,y)
- `<filename>_efy.dat`: Electric field y-component E_y(x,y)
- `<filename>_nud.dat`: Nuclear density ρ_n(x,y)
- `<filename>_eld.dat`: Electron density ρ_e(x,y)

**Search Path**: Looks in:
1. Current directory
2. `$G4CHANNELINGDATA` environment variable path
3. Geant4 data directory

**Example**:
```cpp
chanData->SetFilename("Si110");
// Loads: Si110_pot.dat, Si110_efx.dat, Si110_efy.dat, Si110_nud.dat, Si110_eld.dat
```

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:49`

### SetFilenameElement

```cpp
void SetFilenameElement(const G4String& filename, std::string elementName);
```

Sets filename for element-specific data in compound materials.

**Parameters**:
- `filename`: Base filename for element data
- `elementName`: Chemical symbol of element (e.g., "Si", "O")

**Usage for Compounds**:

```cpp
// For SiO2 crystal
G4ChannelingMaterialData* sio2Data = new G4ChannelingMaterialData("channeling");

// Load Si channeling data
sio2Data->SetFilenameElement("Si110", "Si");

// Load O channeling data
sio2Data->SetFilenameElement("O110", "O");
```

**Process**: Each element's potential and fields are loaded separately, allowing simulation of multi-element channeling effects.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:50`

## ECHARM Data Access

### Overall Material Data

```cpp
G4ChannelingECHARM* GetPot();  // Line 53: Potential
G4ChannelingECHARM* GetEFX();  // Line 54: Electric field X
G4ChannelingECHARM* GetEFY();  // Line 55: Electric field Y
G4ChannelingECHARM* GetNuD();  // Line 56: Nuclear density
G4ChannelingECHARM* GetElD();  // Line 57: Electron density
```

Returns ECHARM objects for the bulk material (or primary element in compounds).

**Returns**: Pointer to corresponding ECHARM data object

**Usage**:
```cpp
G4double criticalAngle = std::sqrt(
    2.0 * chanData->GetPot()->GetMaxMin() / energy
);
```

**Location**: Lines 53-57

### Element-Specific Data

```cpp
G4ChannelingECHARM* GetPotEl(std::string elementName);  // Line 67
G4ChannelingECHARM* GetEFXEl(std::string elementName);  // Line 68
G4ChannelingECHARM* GetEFYEl(std::string elementName);  // Line 69
G4ChannelingECHARM* GetNuDEl(std::string elementName);  // Line 70
G4ChannelingECHARM* GetElDEl(std::string elementName);  // Line 71
```

Returns element-specific ECHARM data for compound materials.

**Parameters**:
- `elementName`: Chemical symbol of element

**Returns**: Pointer to element's ECHARM data, or nullptr if not found

**Usage**:
```cpp
// Get Si-specific potential in SiO2
G4ChannelingECHARM* siPot = chanData->GetPotEl("Si");
G4double siDepth = siPot->GetMaxMin();
```

**Location**: Lines 67-71

## Bent Crystal Support

### IsBent

```cpp
virtual G4bool IsBent();
```

Checks if crystal has bent geometry.

**Returns**: `true` if bending radius is defined, `false` for straight crystal

**Implementation**: Line 81-83

```cpp
return bIsBent;
```

**Usage**: Called by G4Channeling to determine if centrifugal corrections are needed.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:81-83`

### GetBR

```cpp
virtual G4ThreeVector GetBR(G4ThreeVector& position);
```

Returns bending radius at specified position.

**Parameters**:
- `position`: Position in crystal coordinates (z-component used)

**Returns**: Vector with bending radius components (typically only x-component non-zero)

**Implementation**: Lines 85-87

```cpp
return G4ThreeVector(fVectorR->Value(v3.z()), 0., 0.);
```

**Bent Crystal Physics**:
- Particles experience centrifugal force: F = mv²/R
- Creates effective potential: U_eff = U(x) - px/R
- Used for beam deflection and extraction

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:85-87`

### SetBR (Constant Radius)

```cpp
virtual void SetBR(G4double radius);
```

Sets constant bending radius for entire crystal.

**Parameters**:
- `radius`: Bending radius (positive = convex, negative = concave)

**Effect**:
- Sets `bIsBent = true`
- Creates constant-value physics vector
- Applies to all z-positions

**Typical Values**:
- Crystal collimators: R ~ 10-100 m
- Beam extraction: R ~ 50-200 m
- Smaller R = stronger deflection, more dechanneling

**Usage**:
```cpp
chanData->SetBR(40.0*m);  // 40 meter radius
```

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:89`

### SetBR (Position-Dependent)

```cpp
virtual void SetBR(const G4String& filename);
```

Loads position-dependent bending radius from file.

**Parameters**:
- `filename`: Path to file containing R(z) data

**File Format**:
```
# z [mm]    R [m]
0.0        50.0
1.0        48.5
2.0        47.2
...
```

**Applications**:
- Periodically bent crystals (crystalline undulators)
- Non-uniform bending from mechanical constraints
- Optimized bending profiles

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:88`

## Print Method

### Print

```cpp
void Print() const;
```

Prints material data information to console.

**Output**:
- Extension name
- Loaded ECHARM files
- Bent crystal status
- Element-specific data (if any)

**Implementation**: Line 48

```cpp
G4cout << "Channeling Material Data" << G4endl;
```

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingMaterialData.hh:48`

## Private Data Members

### Bulk Material ECHARM Data

```cpp
private:
G4ChannelingECHARM* fPotential;        // Line 60: Continuum potential
G4ChannelingECHARM* fElectricFieldX;   // Line 61: E_x component
G4ChannelingECHARM* fElectricFieldY;   // Line 62: E_y component
G4ChannelingECHARM* fNucleiDensity;    // Line 63: Nuclear density
G4ChannelingECHARM* fElectronDensity;  // Line 64: Electron density
```

### Element-Specific Maps

```cpp
private:
std::unordered_map<std::string, G4ChannelingECHARM*> fPotentialElement;       // Line 74
std::unordered_map<std::string, G4ChannelingECHARM*> fElectricFieldXElement;  // Line 75
std::unordered_map<std::string, G4ChannelingECHARM*> fElectricFieldYElement;  // Line 76
std::unordered_map<std::string, G4ChannelingECHARM*> fNucleiDensityElement;   // Line 77
std::unordered_map<std::string, G4ChannelingECHARM*> fElectronDensityElement; // Line 78
```

Maps element symbols to their ECHARM data for compound materials.

### Bending Parameters

```cpp
private:
G4PhysicsVector* fVectorR;  // Line 92: R(z) bending radius function
G4bool bIsBent;             // Line 93: Bent crystal flag
```

## Complete Usage Example

```cpp
#include "G4ChannelingMaterialData.hh"
#include "G4ExtendedMaterial.hh"
#include "G4NistManager.hh"

// Create base Si material
G4Material* Si = G4NistManager::Instance()->FindOrBuildMaterial("G4_Si");

// Create extended material for crystal
G4ExtendedMaterial* SiCrystal = new G4ExtendedMaterial(
    "SiliconCrystal",  // Name
    Si,                // Base material
    nullptr,           // No world material
    kStateSolid,       // State
    293.15*kelvin,     // Temperature
    1.0*atmosphere     // Pressure
);

// Create channeling material data
G4ChannelingMaterialData* chanData =
    new G4ChannelingMaterialData("channeling");

// Load Si(110) planar channeling data
chanData->SetFilename("Si110");

// Configure as bent crystal
chanData->SetBR(50.0*m);  // 50 meter bending radius

// Verify data loaded
G4double U0 = chanData->GetPot()->GetMaxMin();
G4double d = chanData->GetPot()->GetIntSp(0);
G4cout << "Si(110) potential depth: " << U0/eV << " eV" << G4endl;
G4cout << "Interplanar spacing: " << d/angstrom << " A" << G4endl;

// Register extension with material
SiCrystal->RegisterExtension(chanData);

// Use in geometry
G4LogicalCrystalVolume* crystalLV =
    new G4LogicalCrystalVolume(solidBox, SiCrystal, "CrystalLV");
```

## Compound Material Example

```cpp
// Create SiO2 material
G4Material* SiO2 = G4NistManager::Instance()->FindOrBuildMaterial("G4_SILICON_DIOXIDE");
G4ExtendedMaterial* SiO2Crystal = new G4ExtendedMaterial("QuartzCrystal", SiO2);

// Create channeling data
G4ChannelingMaterialData* quartzData =
    new G4ChannelingMaterialData("channeling");

// Load element-specific data
quartzData->SetFilenameElement("Si110", "Si");
quartzData->SetFilenameElement("O110", "O");

// Access element-specific properties
G4double siPotDepth = quartzData->GetPotEl("Si")->GetMaxMin();
G4double oPotDepth = quartzData->GetPotEl("O")->GetMaxMin();

G4cout << "Si potential in quartz: " << siPotDepth/eV << " eV" << G4endl;
G4cout << "O potential in quartz: " << oPotDepth/eV << " eV" << G4endl;

// Register and use
SiO2Crystal->RegisterExtension(quartzData);
```

## See Also

- [G4ChannelingECHARM](g4channelingecharm.md) - ECHARM data format handler
- [G4Channeling](g4channeling.md) - Main process using this data
- G4ExtendedMaterial - Base material extension system
- G4VMaterialExtension - Material extension base class
