# G4Channeling

**File**: `source/processes/solidstate/channeling/include/G4Channeling.hh`

## Overview

G4Channeling is the main process class for simulating particle channeling in oriented crystals. It implements the physics of charged particle motion in the periodic potential created by crystalline atomic planes, including trajectory integration, electric field calculations, and channeling/dechanneling dynamics. This process is essential for simulating coherent effects in crystals used for beam manipulation, radiation generation, and other accelerator physics applications.

## Class Description

G4Channeling simulates the complete channeling phenomenon:

- **Trajectory Integration**: Runge-Kutta integration of particle motion in crystal potential
- **Electric Field Calculation**: Retrieves and interpolates crystal electric fields from ECHARM tables
- **Channeling State Tracking**: Maintains particle position and momentum in crystal coordinate system
- **Bent Crystal Support**: Handles curved crystals for beam steering applications
- **Critical Angle Calculations**: Computes channeling acceptance parameters
- **Coordinate Transformations**: Maps between laboratory and crystal reference frames

The process operates as a discrete process, checking at each step whether the particle enters a crystal volume and integrating its trajectory through the crystal potential.

**Inheritance**: G4VDiscreteProcess → G4VProcess

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:40`

## Constructor & Destructor

### Constructor

```cpp
G4Channeling();
```

Creates a new channeling process with default parameters.

**Initialization**:
- Sets process name to "Channeling"
- Initializes time step parameters
- Sets transverse variation limits
- Creates auxiliary track information registry

**Default Parameters**:
- `fTimeStepMin`: Minimum integration time step
- `fTimeStepMax`: Maximum integration time step
- `fTransverseVariationMax`: Maximum transverse position change per step

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:44`

### Destructor

```cpp
virtual ~G4Channeling();
```

Virtual destructor that cleans up allocated resources.

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:45`

## Core Process Methods

### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aPD);
```

Determines if channeling process can be applied to a given particle type.

**Parameters**:
- `aPD`: Particle definition to check

**Returns**: `true` if particle is charged, `false` otherwise

**Implementation**: Lines 48-50

```cpp
return (aPD.GetPDGCharge() != 0.);
```

Only charged particles can experience channeling since the effect depends on electromagnetic interaction with the crystal potential.

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:48-50`

### BuildPhysicsTable

```cpp
virtual void BuildPhysicsTable(const G4ParticleDefinition&);
```

Builds physics tables for the process. For G4Channeling, this is a no-op as crystal properties are loaded dynamically from ECHARM files.

**Parameters**:
- Particle definition (unused)

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:51`

## DoIt Methods

### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(
    const G4Track& aTrack,
    const G4Step& aStep
);
```

Main execution method that handles particle propagation through crystal.

**Parameters**:
- `aTrack`: Current track being processed
- `aStep`: Current step information

**Returns**: Particle change object with updated track state

**Process Flow**:
1. Check if track is in crystal volume with channeling material
2. Retrieve or create auxiliary channeling track data
3. Transform coordinates to crystal reference frame
4. Integrate trajectory through crystal potential
5. Update particle position and momentum
6. Check for channeling/dechanneling transitions
7. Transform back to laboratory frame

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:46-47`

### GetMeanFreePath

```cpp
protected:
virtual G4double GetMeanFreePath(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4ForceCondition* condition
);
```

Returns the mean free path for channeling process.

**Parameters**:
- `aTrack`: Current track
- `previousStepSize`: Size of previous step
- `condition`: Force condition output parameter

**Returns**: Mean free path (effectively determines step size in crystal)

**Behavior**:
- Returns short distance in crystal volumes to enable fine trajectory integration
- Returns DBL_MAX in non-crystal volumes
- Sets force condition based on crystal entry/exit

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:54-56`

## Material Data Access

### GetMatData

```cpp
private:
G4ChannelingMaterialData* GetMatData(const G4Track& aTrack);
```

Retrieves channeling material data for current track location.

**Parameters**:
- `aTrack`: Track to query

**Returns**: Pointer to channeling material data, or nullptr if not in crystal

**Implementation**: Lines 68-77

```cpp
G4LogicalVolume* aLV = aTrack.GetVolume()->GetLogicalVolume();
if(aLV->IsExtended() == true){
    G4ExtendedMaterial* aEM = (G4ExtendedMaterial*)
        aTrack.GetVolume()->GetLogicalVolume()->GetMaterial();
    return (G4ChannelingMaterialData*) aEM->RetrieveExtension("channeling");
}
else{
    return nullptr;
}
```

The method checks if the logical volume uses an extended material and retrieves the "channeling" extension containing crystal properties.

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:68-77`

## Channeling Physics Calculations

### GetCriticalAngle

```cpp
G4double GetCriticalAngle(const G4Track& aTrack);
```

Calculates the critical angle for channeling acceptance.

**Parameters**:
- `aTrack`: Track to calculate for

**Returns**: Critical angle in radians

**Formula**: θ_c = √(2U₀/E)

**Implementation**: Lines 84-86

```cpp
return std::sqrt(2.0*GetMatData(aTrack)->GetPot()->GetMaxMin()
                 /GetPre(aTrack)->GetTotalEnergy());
```

where:
- `GetMaxMin()`: Potential well depth U₀ from ECHARM tables
- `GetTotalEnergy()`: Total particle energy E

**Physical Meaning**: Maximum incident angle at which particle can enter channeling state. Particles entering at angles less than θ_c will be captured by the crystal potential.

**Typical Values**:
- 400 GeV protons in Si(110): θ_c ≈ 5 μrad
- 1 GeV protons in Si(110): θ_c ≈ 10 μrad

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:84-86`

### GetOscillationPeriod

```cpp
G4double GetOscillationPeriod(const G4Track& aTrack);
```

Calculates the oscillation period of channeled particle.

**Parameters**:
- `aTrack`: Track to calculate for

**Returns**: Oscillation period in length units

**Formula**: L_osc = πd/θ_c

**Implementation**: Lines 87-90

```cpp
return (CLHEP::pi * GetMatData(aTrack)->GetPot()->GetIntSp(0)
        / GetCriticalAngle(aTrack));
```

where:
- `GetIntSp(0)`: Interplanar spacing d
- `GetCriticalAngle()`: Critical angle θ_c

**Physical Meaning**: Length over which particle completes one transverse oscillation in the crystal channel.

**Applications**:
- Channeling radiation wavelength: λ ~ L_osc/γ
- Coherence length calculations
- Dechanneling rate estimates

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:87-90`

## Trajectory Integration

### UpdateIntegrationStep

```cpp
private:
G4bool UpdateIntegrationStep(
    const G4Track& aTrack,
    G4ThreeVector& position,
    G4double& step
);
```

Updates integration step size based on trajectory curvature and accuracy requirements.

**Parameters**:
- `aTrack`: Current track
- `position`: Current position in crystal frame (modified)
- `step`: Integration step size (modified)

**Returns**: `true` if integration should continue, `false` otherwise

**Algorithm**:
- Calculates local electric field strength
- Estimates trajectory curvature
- Adjusts step size to maintain transverse position accuracy
- Respects minimum and maximum step limits

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:103-105`

### UpdateParameters

```cpp
private:
G4bool UpdateParameters(const G4Track& aTrack);
```

Updates integration parameters at start of each step.

**Parameters**:
- `aTrack`: Current track

**Returns**: `true` if parameters updated successfully

**Updates**:
- Time step bounds based on particle velocity
- Transverse accuracy requirements
- Crystal orientation matrices

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:106`

### GetEF

```cpp
private:
void GetEF(
    const G4Track& aTrack,
    G4ThreeVector& pos,
    G4ThreeVector& field
);
```

Retrieves electric field at specified position in crystal.

**Parameters**:
- `aTrack`: Current track
- `pos`: Position in crystal coordinates
- `field`: Output electric field vector (modified)

**Process**:
1. Retrieves E_x and E_y components from ECHARM tables
2. Interpolates to exact position
3. Handles bent crystal corrections if needed
4. Returns field in crystal reference frame

**Field Components**:
- E_x: Field perpendicular to channel direction
- E_y: Field perpendicular to channel direction
- E_z: Typically zero (planar channeling) or small (axial)

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:108`

## Coordinate Transformations

### PosToLattice

```cpp
void PosToLattice(
    G4StepPoint* step,
    G4ThreeVector& position
);
```

Transforms position from laboratory frame to crystal lattice frame.

**Parameters**:
- `step`: Step point containing position and volume information
- `position`: Output position in crystal coordinates (modified)

**Transformation**:
1. Applies inverse of crystal rotation matrix
2. Translates to crystal origin
3. Handles bent crystal geometry if applicable
4. Wraps coordinates to unit cell for periodic potential lookup

**Usage**: Called at start of trajectory integration to set initial conditions.

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:111`

## Auxiliary Track Data

### GetTrackData

```cpp
private:
G4ChannelingTrackData* GetTrackData(const G4Track& aTrack);
```

Retrieves or creates auxiliary channeling information for track.

**Parameters**:
- `aTrack`: Track to query

**Returns**: Pointer to channeling track data object

**Data Stored**:
- Position in crystal coordinates
- Momentum in crystal coordinates
- Nuclear density at particle position
- Electron density at particle position
- Electric field components

**Registry**: Uses G4VAuxiliaryTrackInformation system with unique ID stored in `fChannelingID`.

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:96`

## Configuration Methods

### SetTransverseVariationMax

```cpp
void SetTransverseVariationMax(G4double aDouble);
```

Sets maximum allowed transverse position change per integration step.

**Parameters**:
- `aDouble`: Maximum variation in length units

**Default**: Implementation-dependent (typically ~0.01 Angstrom)

**Effect on Accuracy**:
- Smaller values: More accurate trajectories, slower simulation
- Larger values: Less accurate, faster simulation

**Recommended Values**:
- High precision: 0.001-0.01 Angstrom
- Standard: 0.01-0.1 Angstrom
- Fast: 0.1-1.0 Angstrom

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:115`

### GetTransverseVariationMax

```cpp
G4double GetTransverseVariationMax();
```

Returns current transverse variation limit.

**Returns**: Maximum transverse variation in length units

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:114`

### SetTimeStepMin

```cpp
void SetTimeStepMin(G4double aDouble);
```

Sets minimum integration time step.

**Parameters**:
- `aDouble`: Minimum time step

**Purpose**: Prevents excessively small steps that could slow simulation without improving accuracy.

**Typical Values**: 0.01-1.0 picoseconds depending on particle velocity

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:118`

### GetTimeStepMin

```cpp
G4double GetTimeStepMin();
```

Returns current minimum time step setting.

**Returns**: Minimum time step in time units

**Location**: `source/processes/solidstate/channeling/include/G4Channeling.hh:117`

## Private Data Members

### Integration Parameters

```cpp
private:
G4double fTimeStepMin;          // Line 121
G4double fTimeStepMax;          // Line 122
G4double fTransverseVariationMax;  // Line 124
```

Control trajectory integration accuracy and performance.

### Crystal Orientation

```cpp
private:
const G4ThreeVector k010;  // Line 126
```

Crystal axis vector for coordinate transformations. Typically (0,1,0) representing the channeling plane/axis normal.

### Spin Tracking

```cpp
private:
G4ThreeVector fSpin;  // Line 127
```

Stores particle spin vector for spin-dependent channeling effects (currently not fully implemented).

### Auxiliary Data ID

```cpp
private:
G4int fChannelingID;  // Line 95
```

Unique identifier for registering auxiliary track information in G4VAuxiliaryTrackInformation system.

## Usage Example

```cpp
// In physics list construction
#include "G4Channeling.hh"

void MyPhysicsList::ConstructProcess() {
    // Create channeling process
    G4Channeling* channeling = new G4Channeling();

    // Configure integration parameters
    channeling->SetTimeStepMin(0.1*picosecond);
    channeling->SetTransverseVariationMax(0.01*angstrom);

    // Add to charged particle process managers
    auto particleIterator = GetParticleIterator();
    particleIterator->reset();

    while((*particleIterator)()) {
        G4ParticleDefinition* particle = particleIterator->value();
        G4ProcessManager* pmanager = particle->GetProcessManager();

        if(particle->GetPDGCharge() != 0.0) {
            // Add as discrete process
            pmanager->AddDiscreteProcess(channeling);
        }
    }
}
```

## Physics Validation

The G4Channeling process has been validated against:

1. **Bent Crystal Experiments**:
   - LHC crystal collimation (UA9, CERN)
   - Tevatron crystal extraction (E853, FNAL)
   - SPS bent crystal tests

2. **Channeling Radiation**:
   - Photon spectra measurements
   - Angular distributions
   - Intensity predictions

3. **Dechanneling**:
   - Dechanneling length measurements
   - Efficiency vs. crystal length
   - Efficiency vs. particle energy

## Performance Notes

**Computational Cost**:
- Integration step calculation: ~100-1000 steps per crystal passage
- Electric field lookup: Interpolation from pre-calculated tables (fast)
- Coordinate transformations: Minimal overhead

**Memory Usage**:
- ECHARM tables: ~1-10 MB per crystal type
- Track auxiliary data: ~200 bytes per channeled track

**Optimization Tips**:
1. Use coarser transverse variation limits for faster simulation
2. Pre-load all ECHARM tables at initialization
3. Enable biasing for rare channeling events
4. Use appropriate crystal thickness (too thick = wasted computation)

## See Also

- [G4ChannelingMaterialData](g4channelingmaterialdata.md) - Crystal property storage
- [G4ChannelingTrackData](g4channelingtrackdata.md) - Auxiliary track information
- [G4ChannelingECHARM](g4channelingecharm.md) - Potential table format
- [G4ChannelingOptrChangeCrossSection](g4channelingoptrchangecrosssection.md) - Biasing support
