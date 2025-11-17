# G4VPhononProcess

**File**: `source/processes/solidstate/phonon/include/G4VPhononProcess.hh`

## Overview

G4VPhononProcess is the abstract base class for all phonon interaction processes in Geant4. It provides common functionality for phonon processes including wavevector management, lattice access, polarization utilities, and secondary phonon creation. All concrete phonon processes (downconversion, scattering, reflection) inherit from this class.

## Class Description

G4VPhononProcess provides phonon process infrastructure:

- **Wavevector Management**: Interfaces with G4PhononTrackMap for k-vector storage
- **Lattice Access**: Retrieves crystal lattice properties from G4LatticeManager
- **Polarization Utilities**: Maps particle definitions to polarization codes
- **Secondary Creation**: Factory methods for creating daughter phonons
- **Track Lifecycle**: Handles StartTracking and EndTracking for cleanup
- **Applicability Check**: Ensures process only acts on phonon particles

This base class encapsulates phonon-specific functionality, allowing derived classes to focus on physics-specific implementations.

**Inheritance**: G4VDiscreteProcess → G4VProcess

**Location**: `source/processes/solidstate/phonon/include/G4VPhononProcess.hh:41`

## Constructor & Destructor

### Constructor

```cpp
G4VPhononProcess(const G4String& processName);
```

Creates phonon process with specified name.

**Parameters**:
- `processName`: Name for this process type

**Initialization**:
- Sets process name
- Retrieves G4PhononTrackMap singleton
- Initializes lattice pointer to nullptr
- Sets current track pointer to nullptr

**Location**: `source/processes/solidstate/phonon/include/G4VPhononProcess.hh:43`

### Destructor

```cpp
virtual ~G4VPhononProcess();
```

Virtual destructor. Cleans up process resources.

**Note**: Does not delete lattice or track map (managed elsewhere).

**Location**: `source/processes/solidstate/phonon/include/G4VPhononProcess.hh:44`

## Applicability

### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aPD);
```

Determines if process can be applied to given particle.

**Parameters**:
- `aPD`: Particle definition to check

**Returns**: `true` if particle is a phonon (L, TS, or TF), `false` otherwise

**Implementation**:
```cpp
return (G4PhononPolarization::Get(&aPD) != G4PhononPolarization::UNKNOWN);
```

**Phonon Particles**:
- `G4PhononLong` - Longitudinal acoustic phonons
- `G4PhononTransSlow` - Slow transverse acoustic phonons
- `G4PhononTransFast` - Fast transverse acoustic phonons

**Location**: `source/processes/solidstate/phonon/include/G4VPhononProcess.hh:46`

## Track Lifecycle Management

### StartTracking

```cpp
virtual void StartTracking(G4Track* track);
```

Called when phonon track starts.

**Parameters**:
- `track`: Track being started

**Actions**:
1. Stores track pointer for process use
2. Retrieves lattice for current volume
3. Initializes wavevector if not already set
4. Calls base class StartTracking

**Implementation**:
```cpp
currentTrack = track;

// Get lattice for this volume
G4VPhysicalVolume* volume = track->GetVolume();
theLattice = G4LatticeManager::GetLatticeManager()->GetLattice(volume);

// Ensure wavevector is registered
if (!trackKmap->Find(track)) {
    // Generate initial k-vector from momentum
    G4ThreeVector k = CalculateKFromP(track);
    trackKmap->SetK(track, k);
}

// Call base class
G4VDiscreteProcess::StartTracking(track);
```

**Important**: Derived classes MUST call this base implementation!

**Location**: `source/processes/solidstate/phonon/include/G4VPhononProcess.hh:50`

### EndTracking

```cpp
virtual void EndTracking();
```

Called when phonon track ends.

**Actions**:
1. Removes wavevector from track map
2. Clears current track pointer
3. Clears lattice pointer
4. Calls base class EndTracking

**Implementation**:
```cpp
if (currentTrack) {
    trackKmap->RemoveTrack(currentTrack);
    currentTrack = nullptr;
}
theLattice = nullptr;

G4VDiscreteProcess::EndTracking();
```

**Memory Management**: Ensures wavevector data is cleaned up when track ends, preventing memory leaks.

**Location**: `source/processes/solidstate/phonon/include/G4VPhononProcess.hh:51`

## Polarization Utilities

### GetPolarization (Track Reference)

```cpp
protected:
virtual G4int GetPolarization(const G4Track& track) const;
```

Returns polarization code for track's phonon.

**Parameters**:
- `track`: Track to query

**Returns**: Polarization code (0=L, 1=TS, 2=TF, -1=UNKNOWN)

**Implementation**:
```cpp
return G4PhononPolarization::Get(track.GetParticleDefinition());
```

**Usage**:
```cpp
G4int pol = GetPolarization(aTrack);
if (pol == G4PhononPolarization::Long) {
    // Handle longitudinal phonon
}
```

**Location**: `source/processes/solidstate/phonon/include/G4VPhononProcess.hh:55`

### GetPolarization (Track Pointer)

```cpp
protected:
virtual G4int GetPolarization(const G4Track* track) const;
```

Overload accepting track pointer.

**Parameters**:
- `track`: Track pointer

**Returns**: Polarization code

**Implementation**: Lines 56-58

```cpp
return GetPolarization(*track);
```

**Location**: Lines 56-58

### ChoosePolarization

```cpp
protected:
virtual G4int ChoosePolarization(
    G4double Ldos,
    G4double STdos,
    G4double FTdos
) const;
```

Randomly selects polarization based on density of states.

**Parameters**:
- `Ldos`: Longitudinal density of states (relative weight)
- `STdos`: Slow transverse density of states
- `FTdos`: Fast transverse density of states

**Returns**: Selected polarization code (0, 1, or 2)

**Algorithm**:
```cpp
G4double total = Ldos + STdos + FTdos;
G4double rand = G4UniformRand() * total;

if (rand < Ldos) return G4PhononPolarization::Long;
else if (rand < Ldos + STdos) return G4PhononPolarization::TransSlow;
else return G4PhononPolarization::TransFast;
```

**Physical Basis**: Density of states determines relative probability of phonon creation in each polarization mode.

**Usage in Processes**:
- **Downconversion**: Daughter phonon polarizations from phase space
- **Scattering**: Re-emitted phonon polarization
- **Boundary**: Transmitted/reflected phonon polarization

**Example**:
```cpp
// Get density of states at k-vector
G4double Ldos = theLattice->GetLDOS(k);
G4double STdos = theLattice->GetSTDOS(k);
G4double FTdos = theLattice->GetFTDOS(k);

// Choose polarization
G4int polarization = ChoosePolarization(Ldos, STdos, FTdos);
```

**Location**: Lines 62-63

## Secondary Creation

### CreateSecondary

```cpp
protected:
virtual G4Track* CreateSecondary(
    G4int polarization,
    const G4ThreeVector& K,
    G4double energy
) const;
```

Creates new phonon track with specified properties.

**Parameters**:
- `polarization`: Polarization code (0, 1, or 2)
- `K`: Wavevector in crystal frame
- `energy`: Phonon energy

**Returns**: Pointer to new G4Track

**Process**:
1. Get particle definition from polarization code
2. Calculate velocity from lattice dispersion relation
3. Create G4DynamicParticle with velocity and energy
4. Create G4Track with particle, position, and time
5. Register wavevector in track map
6. Return track

**Implementation**:
```cpp
// Get phonon particle type
G4ParticleDefinition* phononDef = G4PhononPolarization::Get(polarization);

// Get velocity from lattice
G4ThreeVector velocity = theLattice->MapKtoVDir(polarization, K);
velocity = velocity * theLattice->MapKtoV(polarization, K);

// Create dynamic particle
G4DynamicParticle* phonon = new G4DynamicParticle(phononDef, velocity, energy);

// Create track (inherit position and time from parent)
G4Track* phononTrack = new G4Track(
    phonon,
    currentTrack->GetGlobalTime(),
    currentTrack->GetPosition()
);

// Register wavevector
trackKmap->SetK(phononTrack, K);

// Set creator process
phononTrack->SetCreatorProcess(this);

return phononTrack;
```

**Usage in Derived Classes**:
```cpp
// In G4PhononDownconversion::PostStepDoIt()

// Create two daughter phonons
G4Track* daughter1 = CreateSecondary(pol1, k1, E1);
G4Track* daughter2 = CreateSecondary(pol2, k2, E2);

// Add to particle change
fParticleChange.AddSecondary(daughter1);
fParticleChange.AddSecondary(daughter2);
```

**Location**: Lines 66-67

## Protected Data Members

### Track Map

```cpp
protected:
G4PhononTrackMap* trackKmap;  // Line 70
```

Pointer to singleton track map for wavevector storage.

**Purpose**: Access phonon wavevectors throughout process execution.

**Access**: `trackKmap->GetK(track)`, `trackKmap->SetK(track, k)`

### Lattice Pointer

```cpp
protected:
const G4LatticePhysical* theLattice;  // Line 71
```

Pointer to lattice for current volume.

**Purpose**: Access dispersion relations, velocities, and material properties.

**Set**: In StartTracking() for each new track.

**Access**: `theLattice->MapKtoV()`, `theLattice->GetLDOS()`, etc.

## Private Data Members

### Current Track

```cpp
private:
const G4Track* currentTrack;  // Line 74
```

Pointer to track currently being processed.

**Purpose**: Used by secondary creation to inherit position and time.

**Lifetime**: Set in StartTracking, cleared in EndTracking.

## Derived Class Implementation

### Required Overrides

Derived classes MUST implement:

```cpp
// Mean free path calculation
virtual G4double GetMeanFreePath(
    const G4Track&,
    G4double previousStepSize,
    G4ForceCondition* condition
);

// Physics interaction
virtual G4VParticleChange* PostStepDoIt(
    const G4Track&,
    const G4Step&
);
```

### Recommended Pattern

```cpp
class G4MyPhononProcess : public G4VPhononProcess {
public:
    G4MyPhononProcess(const G4String& name = "myPhononProcess")
        : G4VPhononProcess(name) {}

    virtual ~G4MyPhononProcess() {}

    // Override StartTracking if needed
    virtual void StartTracking(G4Track* track) {
        // Custom initialization
        myProcessData = ...;

        // MUST call base class!
        G4VPhononProcess::StartTracking(track);
    }

protected:
    virtual G4double GetMeanFreePath(
        const G4Track& track,
        G4double previousStepSize,
        G4ForceCondition* condition
    ) {
        // Get k-vector
        G4ThreeVector k = trackKmap->GetK(track);

        // Calculate mean free path
        G4double lambda = CalculateMyMFP(k);

        *condition = NotForced;
        return lambda;
    }

    virtual G4VParticleChange* PostStepDoIt(
        const G4Track& track,
        const G4Step& step
    ) {
        // Initialize particle change
        fParticleChange.Initialize(track);

        // Get current k-vector
        G4ThreeVector k = trackKmap->GetK(track);

        // Perform physics
        // ... calculate new k-vectors, energies ...

        // Create secondaries
        G4Track* secondary = CreateSecondary(newPol, newK, newE);
        fParticleChange.AddSecondary(secondary);

        // Kill primary
        fParticleChange.ProposeTrackStatus(fStopAndKill);

        return &fParticleChange;
    }
};
```

## Usage Example

```cpp
// Base class not used directly
// See derived classes:

#include "G4PhononDownconversion.hh"
#include "G4PhononScattering.hh"
#include "G4PhononReflection.hh"

// In physics list
G4PhononDownconversion* downconversion = new G4PhononDownconversion();
G4PhononScattering* scattering = new G4PhononScattering();
G4PhononReflection* reflection = new G4PhononReflection();

// Get phonon particle definitions
G4ParticleDefinition* phononL = G4PhononLong::Definition();
G4ParticleDefinition* phononTS = G4PhononTransSlow::Definition();
G4ParticleDefinition* phononTF = G4PhononTransFast::Definition();

// Add processes to each phonon type
for (auto phonon : {phononL, phononTS, phononTF}) {
    G4ProcessManager* pmanager = phonon->GetProcessManager();

    pmanager->AddDiscreteProcess(downconversion);
    pmanager->AddDiscreteProcess(scattering);
    pmanager->AddDiscreteProcess(reflection);
}
```

## Key Design Patterns

### Singleton Access

```cpp
// Track map singleton
trackKmap = G4PhononTrackMap::GetPhononTrackMap();

// Lattice manager singleton
G4LatticeManager* latMan = G4LatticeManager::GetLatticeManager();
theLattice = latMan->GetLattice(volume);
```

### Template Method

Base class provides framework, derived classes fill in specifics:
- `GetMeanFreePath()`: Calculate process-specific interaction length
- `PostStepDoIt()`: Implement process-specific physics

### Factory Method

`CreateSecondary()` encapsulates phonon creation logic, ensuring consistent wavevector registration.

## See Also

- [G4PhononDownconversion](g4phonondownconversion.md) - Anharmonic decay process
- [G4PhononScattering](g4phononscattering.md) - Lattice scattering process
- [G4PhononReflection](g4phononreflection.md) - Boundary reflection process
- [G4PhononTrackMap](g4phonontracmap.md) - Wavevector storage
- [G4LatticeManager](g4latticemanager.md) - Lattice property access
- [G4PhononPolarization](g4phononpolarization.md) - Polarization utilities
