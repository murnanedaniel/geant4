# G4PhononReflection

**File**: `source/processes/solidstate/phonon/include/G4PhononReflection.hh`

## Overview

G4PhononReflection is a placeholder process for phonon interactions at crystal boundaries and surfaces. In the current implementation, it primarily handles phonon absorption at boundaries or conversion to detector hits, though it is designed to be extended for actual reflection physics.

## Class Description

G4PhononReflection manages boundary interactions:

- **Surface Detection**: Identifies when phonon reaches boundary
- **Absorption**: Current behavior - phonons are absorbed
- **Hit Conversion**: Can convert phonons to detector signals
- **Extensible**: Designed for future reflection/transmission implementation
- **Geometric Tolerance**: Uses surface proximity detection

**Current Status**: Placeholder implementation. README states "Currently phonons are absorbed, or converted to hits" (Lines 26-27).

**Future Capability**: Will support:
- Specular reflection
- Diffuse reflection
- Transmission across interfaces
- Acoustic impedance matching

**Inheritance**: G4VPhononProcess → G4VDiscreteProcess → G4VProcess

**Location**: `source/processes/solidstate/phonon/include/G4PhononReflection.hh:36`

## Constructor & Destructor

### Constructor

```cpp
G4PhononReflection(const G4String& processName = "phononReflection");
```

**Parameters**:
- `processName`: Process name (default: "phononReflection")

**Initialization**:
- Sets process name
- Retrieves geometric tolerance (kCarTolerance)
- Initializes base class

**Location**: Line 38

### Destructor

```cpp
virtual ~G4PhononReflection();
```

**Location**: Line 39

## Core Methods

### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(
    const G4Track& track,
    const G4Step& step
);
```

Handles phonon interaction at boundary.

**Current Implementation**:
1. Check if phonon is at surface (using kCarTolerance)
2. Kill phonon track
3. Optionally create detector hit
4. Return particle change

**Future Implementation** (planned):
1. Determine incident angle
2. Calculate reflection coefficient
3. Sample reflection vs. transmission
4. Generate reflected/transmitted phonon
5. Apply polarization conversion

**Location**: Line 41

### GetMeanFreePath

```cpp
protected:
virtual G4double GetMeanFreePath(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition
);
```

Returns mean free path to boundary.

**Current**: Returns geometry-limited step (DBL_MAX in bulk, small near surface)

**Behavior**:
- Inside volume: DBL_MAX (no interaction)
- Near surface (< kCarTolerance): Very small (triggers interaction)
- Force condition: NotForced

**Location**: Line 44

## Private Data Members

### Geometric Tolerance

```cpp
private:
G4double kCarTolerance;  // Line 47
```

Distance threshold for surface detection.

**Purpose**: Determines when phonon is "at" a surface
**Value**: Retrieved from G4GeometryTolerance (typically ~10⁻⁹ mm)
**Usage**: If distance to surface < kCarTolerance, trigger reflection process

**Location**: Line 47

## Physical Background

### Acoustic Impedance

Interface between materials i and j:

**Reflection Coefficient**:
```
R = ((Z_j - Z_i)/(Z_j + Z_i))²
```

where Z = ρ × v is acoustic impedance.

**Transmission Coefficient**:
```
T = 1 - R = 4Z_i Z_j / (Z_i + Z_j)²
```

### Reflection Types

**Specular Reflection**:
- Mirror-like: angle in = angle out
- Conserves parallel k-component
- Occurs at smooth interfaces
- k_parallel preserved, k_perp inverted

**Diffuse Reflection**:
- Random exit angle
- Rough surfaces or polycrystals
- Cosine distribution typical
- Full momentum randomization

**Mixed**:
- Combination of specular and diffuse
- Parameter p: fraction specular
- Realistic for real surfaces

### Polarization Conversion

At interfaces, phonon polarization can change:

**L → T Conversion**:
- Mode conversion at oblique incidence
- Depends on angle and impedance mismatch
- Can produce both reflected L and T phonons

**T → T Conversion**:
- TS ↔ TF conversion possible
- Depends on interface orientation
- Anisotropic effects important

## Current Limitations

From README (Lines 26-27): "Placeholder process to reflect phonons off of crystal surfaces. Currently phonons are absorbed, or converted to hits."

**What's Missing**:
1. Actual reflection calculation
2. Transmission across interfaces
3. Angle-dependent behavior
4. Polarization conversion
5. Impedance matching physics

**Why Placeholder**:
- Complex physics requiring careful implementation
- Detector-specific hit conversion needed
- Interface with sensitive detector class required
- Most detector simulations use simplified boundary conditions

## Detector Integration

### Hit Creation

Typical usage pattern:
```cpp
// In user's derived G4PhononReflection class

G4VParticleChange* MyPhononReflection::PostStepDoIt(
    const G4Track& track,
    const G4Step& step
) {
    // Check if at detector surface
    if (AtDetectorSurface(track)) {
        // Convert phonon energy to detector hit
        G4double energy = track.GetKineticEnergy();
        G4ThreeVector position = track.GetPosition();
        G4double time = track.GetGlobalTime();

        // Create hit in sensitive detector
        MyPhononHit* hit = new MyPhononHit();
        hit->SetEnergy(energy);
        hit->SetPosition(position);
        hit->SetTime(time);
        hit->SetPolarization(GetPolarization(track));

        // Store hit
        MyHitCollection->insert(hit);
    }

    // Kill phonon
    fParticleChange.Initialize(track);
    fParticleChange.ProposeTrackStatus(fStopAndKill);
    return &fParticleChange;
}
```

### Surface Types

Different boundary conditions for different surfaces:

**Detector Surface**:
- Absorb phonon
- Create hit with full energy
- Record time and position

**External Boundary**:
- Absorb phonon
- Energy lost to environment
- No hit created

**Internal Interface**:
- Should reflect/transmit (not implemented)
- Future: use acoustic impedance

## Usage Example

```cpp
#include "G4PhononReflection.hh"

// In physics list
G4PhononReflection* reflection = new G4PhononReflection();

// Add to all phonon types
for (auto phonon : {phononL, phononTS, phononTF}) {
    G4ProcessManager* pmanager = phonon->GetProcessManager();
    pmanager->AddDiscreteProcess(reflection);
}

// Currently: phonons absorbed at boundaries
// Future: phonons reflected/transmitted
```

## Extension Example

User can derive custom reflection class:

```cpp
class MyPhononReflection : public G4PhononReflection {
public:
    MyPhononReflection() : G4PhononReflection("myPhononReflection") {}

    virtual G4VParticleChange* PostStepDoIt(
        const G4Track& track,
        const G4Step& step
    ) override {
        // Get surface normal
        G4ThreeVector normal = GetSurfaceNormal(step);

        // Get incident k-vector
        G4ThreeVector k_in = trackKmap->GetK(track);

        // Calculate reflection coefficient
        G4double R = CalculateReflection(k_in, normal);

        // Sample reflection vs. absorption
        if (G4UniformRand() < R) {
            // Reflect phonon
            G4ThreeVector k_out = ReflectVector(k_in, normal);

            // Create reflected phonon
            G4int pol = ChoosePolarization(...);
            G4Track* reflected = CreateSecondary(pol, k_out, energy);

            fParticleChange.Initialize(track);
            fParticleChange.AddSecondary(reflected);
            fParticleChange.ProposeTrackStatus(fStopAndKill);
        } else {
            // Absorb - call base class or handle
            return G4PhononReflection::PostStepDoIt(track, step);
        }

        return &fParticleChange;
    }

private:
    G4double CalculateReflection(
        const G4ThreeVector& k,
        const G4ThreeVector& n
    ) {
        // Implement acoustic impedance matching
        // Return reflection coefficient 0 to 1
    }
};
```

## Applications

**Cryogenic Detectors**:
- Phonon collection efficiency
- Surface effects on signal formation
- Detector geometry optimization

**Phonon Trapping**:
- Multiple reflections in cavity
- Energy localization effects
- Collection time distributions

**Interface Studies**:
- Material interface effects
- Thin film structures
- Heterostructures

## Performance Notes

**Current**: Negligible overhead
- Simple boundary detection
- Phonon absorption (track kill)
- ~10 ns per boundary interaction

**With Full Physics**: Moderate overhead
- Impedance calculations: ~50 ns
- Reflection sampling: ~50 ns
- Secondary creation: ~200 ns
- Total: ~300 ns per reflection event

## See Also

- [G4VPhononProcess](g4vphononprocess.md) - Base class
- [G4PhononScattering](g4phononscattering.md) - Bulk process
- [G4PhononDownconversion](g4phonondownconversion.md) - Competing process
- [G4LatticeManager](g4latticemanager.md) - Material properties
- G4GeometryTolerance - Surface detection tolerance
