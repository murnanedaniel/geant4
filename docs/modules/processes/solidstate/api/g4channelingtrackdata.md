# G4ChannelingTrackData

**File**: `source/processes/solidstate/channeling/include/G4ChannelingTrackData.hh`

## Overview

G4ChannelingTrackData extends track properties with channeling-specific information, storing particle position and momentum in the crystal reference frame along with local crystal properties (density, electric field). This auxiliary data persists across steps and is essential for trajectory integration and biasing operations.

## Class Description

G4ChannelingTrackData maintains channeling state:

- **Crystal Frame Coordinates**: Position and momentum in crystal reference system
- **Local Densities**: Nuclear and electron density at particle location
- **Electric Field Components**: Local field values for force calculations
- **Process Association**: Link to active channeling process
- **Automatic Cleanup**: Registered with G4VAuxiliaryTrackInformation system

This class enables the channeling process to maintain state between steps without modifying the core G4Track class.

**Inheritance**: G4VAuxiliaryTrackInformation

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingTrackData.hh:48`

## Constructor & Destructor

### Constructor

```cpp
G4ChannelingTrackData();
```

Creates channeling track data with default initialization.

**Initialization**:
- Sets process pointer to nullptr
- Initializes densities to 1.0
- Sets positions and momenta to DBL_MAX (invalid marker)
- Sets electric fields to zero

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingTrackData.hh:52`

### Destructor

```cpp
~G4ChannelingTrackData();
```

Cleans up track data. Called automatically when track is deleted.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingTrackData.hh:53`

## Utility Methods

### Print

```cpp
void Print() const;
```

Prints track data information for debugging.

**Output**:
- Crystal frame position
- Crystal frame momentum
- Nuclear and electron densities
- Electric field components
- Process association

**Usage**: Called during verbose tracking for diagnostics.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingTrackData.hh:55`

### Reset

```cpp
void Reset();
```

Resets all data members to initial state.

**Implementation**: Lines 61-65

```cpp
fChannelingProcess = nullptr;
fNuD = fElD = 1.;
fPosCh = fMomCh = fDBL;
```

**Usage**: Called when particle exits crystal or dechannels.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingTrackData.hh:61-65`

## Density Methods

### GetDensity

```cpp
G4double GetDensity();
```

Returns average of nuclear and electron density.

**Returns**: (ρ_nuclear + ρ_electron) / 2

**Implementation**: Line 68

```cpp
return (fNuD + fElD) * 0.5;
```

**Physical Meaning**: Combined density used for cross-section modifications in biasing. Channeled particles see reduced density in channel centers, increased density near atomic planes.

**Typical Values**:
- Channel center: 0.1-0.3 × bulk density
- Channel edges: 1.5-2.0 × bulk density
- Bulk average: 1.0 × bulk density

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingTrackData.hh:68`

### SetNuD / GetNuD

```cpp
void SetNuD(G4double aDouble);  // Line 70
G4double GetNuD();              // Line 71
```

Sets/gets nuclear density at particle position.

**Parameters**:
- `aDouble`: Nuclear density (normalized to bulk value)

**Returns**: Current nuclear density value

**Usage**: Updated by G4Channeling at each step from ECHARM tables.

**Location**: Lines 70-71

### SetElD / GetElD

```cpp
void SetElD(G4double aDouble);  // Line 73
G4double GetElD();              // Line 74
```

Sets/gets electron density at particle position.

**Parameters**:
- `aDouble`: Electron density (normalized to bulk value)

**Returns**: Current electron density value

**Physical Difference**: Nuclear and electron densities differ in channeling:
- Nuclear density peaks at atomic positions
- Electron density more spread out (Thomas-Fermi distribution)
- Ratio affects electromagnetic vs. nuclear interaction rates

**Location**: Lines 73-74

## Electric Field Methods

### SetEFX / GetEFX

```cpp
void SetEFX(G4double aDouble);  // Line 76
G4double GetEFX();              // Line 77
```

Sets/gets electric field x-component.

**Parameters**:
- `aDouble`: Field component in crystal coordinates [eV/Angstrom]

**Returns**: Current E_x value

**Usage**: Used for trajectory integration force calculation: F_x = q·E_x

**Location**: Lines 76-77

### SetEFY / GetEFY

```cpp
void SetEFY(G4double aDouble);  // Line 79
G4double GetEFY();              // Line 80
```

Sets/gets electric field y-component.

**Parameters**:
- `aDouble`: Field component in crystal coordinates [eV/Angstrom]

**Returns**: Current E_y value

**Physical Meaning**:
- For planar channeling: E_x points perpendicular to planes, E_y ≈ 0
- For axial channeling: Both E_x and E_y contribute to radial confinement
- E_z typically zero or negligible (assuming alignment with beam axis)

**Location**: Lines 79-80

## Position and Momentum Methods

### GetMomCh / SetMomCh

```cpp
G4ThreeVector GetMomCh();                    // Line 82
void SetMomCh(G4ThreeVector momentum);       // Line 83
```

Gets/sets particle momentum in crystal frame.

**Parameters**:
- `momentum`: 3-vector momentum [energy units]

**Returns**: Current momentum vector in crystal coordinates

**Coordinate System**:
- x: Perpendicular to channeling plane/axis
- y: Second perpendicular direction
- z: Along channeling direction (beam axis)

**Usage**:
- Stored at each step during trajectory integration
- Used to calculate transverse energy E_⊥ = p_x²/(2m)
- Channeling condition: E_⊥ < U₀ (transverse energy below potential depth)

**Location**: Lines 82-83

### GetPosCh / SetPosCh

```cpp
G4ThreeVector GetPosCh();                    // Line 85
void SetPosCh(G4ThreeVector position);       // Line 86
```

Gets/sets particle position in crystal frame.

**Parameters**:
- `position`: 3-vector position [length units]

**Returns**: Current position vector in crystal coordinates

**Coordinate Wrapping**: Position typically wrapped to unit cell:
- x: 0 to d_planar (interplanar spacing)
- y: 0 to d_y (second dimension for axial)
- z: Absolute position along crystal

**Usage**:
- Indexed into ECHARM tables to get local potential/fields
- Determines if particle in channel vs. near atomic plane
- Used for channeling/dechanneling classification

**Location**: Lines 85-86

## Private Data Members

### Process Association

```cpp
private:
const G4Channeling* fChannelingProcess;  // Line 58
```

Pointer to channeling process managing this track. Enables callbacks and process-specific data access.

### Reset Marker

```cpp
private:
G4ThreeVector fDBL;  // Lines 90-92
```

DBL_MAX vector used to mark uninitialized position/momentum. Comparing with this value indicates if data has been set.

### Crystal Frame Data

```cpp
private:
G4ThreeVector fMomCh;  // Line 97: Momentum in crystal frame
G4ThreeVector fPosCh;  // Line 98: Position in crystal frame
```

Core channeling state variables updated at each integration step.

### Local Properties

```cpp
private:
G4double fNuD;   // Line 100: Nuclear density (normalized)
G4double fElD;   // Line 101: Electron density (normalized)
G4double fEFX;   // Line 103: Electric field x-component
G4double fEFY;   // Line 104: Electric field y-component
```

Local crystal properties interpolated from ECHARM tables at current position.

## Usage in G4Channeling

### Track Data Creation

```cpp
// In G4Channeling::PostStepDoIt()

// Get or create track data
G4ChannelingTrackData* trackData = GetTrackData(aTrack);

if (!trackData) {
    // First time in crystal - create new data
    trackData = new G4ChannelingTrackData();

    // Register with track
    aTrack.GetAuxiliaryTrackInformation(fChannelingID, trackData);
}
```

### Data Updates During Integration

```cpp
// Transform to crystal frame
G4ThreeVector posCrystal = TransformToCrystal(posLab);
G4ThreeVector momCrystal = TransformToCrystal(momLab);

// Store in track data
trackData->SetPosCh(posCrystal);
trackData->SetMomCh(momCrystal);

// Get local properties from ECHARM tables
G4double nucDens = matData->GetNuD()->GetEC(posCrystal);
G4double eleDens = matData->GetElD()->GetEC(posCrystal);
G4double fieldX = matData->GetEFX()->GetEC(posCrystal);
G4double fieldY = matData->GetEFY()->GetEC(posCrystal);

// Store in track data
trackData->SetNuD(nucDens);
trackData->SetElD(eleDens);
trackData->SetEFX(fieldX);
trackData->SetEFY(fieldY);
```

## Usage in Biasing

### Cross-Section Modification

```cpp
// In G4ChannelingOptrChangeCrossSection::ProposeOccurenceBiasingOperation()

// Get track data
G4ChannelingTrackData* trackData =
    (G4ChannelingTrackData*) track->GetAuxiliaryTrackInformation(fChannelingID);

if (trackData) {
    // Get density based on process type
    G4double densityRatio = 1.0;

    switch(fProcessToDensity[processName]) {
        case fDensityRatioNuDElD:
            densityRatio = trackData->GetDensity();
            break;
        case fDensityRatioNuD:
            densityRatio = trackData->GetNuD();
            break;
        case fDensityRatioElD:
            densityRatio = trackData->GetElD();
            break;
    }

    // Modify cross-section based on local density
    G4double biasedXS = nominalXS * densityRatio;
    changeXS->SetBiasedCrossSection(biasedXS);
}
```

## Performance Notes

**Memory Usage**: ~200 bytes per channeled track

**Access Speed**: Direct member access, no overhead

**Lifetime**: Created on first step in crystal, deleted when track ends

**Thread Safety**: Each track has its own data, no sharing between threads

## See Also

- [G4Channeling](g4channeling.md) - Process that creates and uses this data
- [G4ChannelingOptrChangeCrossSection](g4channelingoptrchangecrosssection.md) - Biasing that reads density data
- G4VAuxiliaryTrackInformation - Base class for track extensions
- G4AuxiliaryTrackInformation - Registry system
