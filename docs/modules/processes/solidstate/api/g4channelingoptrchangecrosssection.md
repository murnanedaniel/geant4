# G4ChannelingOptrChangeCrossSection

**File**: `source/processes/solidstate/channeling/include/G4ChannelingOptrChangeCrossSection.hh`

## Overview

G4ChannelingOptrChangeCrossSection is a biasing operator that modifies process cross-sections based on local crystal density variations experienced by channeled particles. This operator is essential for accurate simulation of interaction rates in channeling, where particles in channel centers see significantly reduced density compared to bulk material.

## Class Description

G4ChannelingOptrChangeCrossSection implements density-dependent biasing:

- **Cross-Section Scaling**: Multiplies nominal cross-sections by local density ratios
- **Process-Specific Biasing**: Different density ratios for nuclear vs. electromagnetic processes
- **Automatic Setup**: Configures biasing operations for all relevant processes
- **Weight Tracking**: Maintains proper Monte Carlo weights for unbiased results
- **Single Particle**: Biases one particle type at a time

The operator ensures that interaction probabilities correctly reflect the reduced/enhanced density experienced by channeled particles.

**Inheritance**: G4VBiasingOperator

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingOptrChangeCrossSection.hh:60`

## Physical Motivation

In channeling, particles oscillate in regions of varying density:

**Channel Center**:
- Low nuclear density: ρ_n ~ 0.1-0.3 × bulk
- Low electron density: ρ_e ~ 0.1-0.3 × bulk
- Reduced interaction probability

**Near Atomic Plane**:
- High nuclear density: ρ_n ~ 1.5-2.0 × bulk
- High electron density: ρ_e ~ 1.5-2.0 × bulk
- Enhanced interaction probability

Without biasing, Geant4 uses bulk density for all interactions, leading to:
- Over-prediction of interactions in channels
- Under-prediction near atomic planes
- Incorrect dechanneling rates

## Density Ratio Enumeration

### G4ChannelingDensityRatio

```cpp
enum G4ChannelingDensityRatio {
    fDensityRatioNotDefined = -1,  // Line 53
    fDensityRatioNone = 0,         // Line 54
    fDensityRatioNuDElD = 1,       // Line 55: (ρ_n + ρ_e)/2
    fDensityRatioNuD = 2,          // Line 56: ρ_n only
    fDensityRatioElD = 3           // Line 57: ρ_e only
};
```

Specifies which density to use for each process type.

**Process Assignment**:
- **Hadronic processes**: `fDensityRatioNuD` (nuclear density only)
- **Electromagnetic processes**: `fDensityRatioElD` (electron density for ionization)
- **Mixed processes**: `fDensityRatioNuDElD` (average)

**Location**: Lines 52-58

## Constructor & Destructor

### Constructor

```cpp
G4ChannelingOptrChangeCrossSection(
    const G4String& particleToBias,
    const G4String& name = "ChannelingChangeXS"
);
```

Creates biasing operator for specified particle type.

**Parameters**:
- `particleToBias`: Name of particle to bias (e.g., "proton", "pi+")
- `name`: Operator name for identification

**Initialization**:
- Sets particle to bias
- Initializes process-to-density mapping
- Prepares biasing operation storage
- Sets setup flag to false

**Example**:
```cpp
G4ChannelingOptrChangeCrossSection* protonBias =
    new G4ChannelingOptrChangeCrossSection("proton");
```

**Location**: Lines 65-66

### Destructor

```cpp
virtual ~G4ChannelingOptrChangeCrossSection();
```

Cleans up biasing operations and mappings.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingOptrChangeCrossSection.hh:67`

## Core Biasing Methods

### StartRun

```cpp
virtual void StartRun();
```

Initializes biasing at start of run.

**Operations**:
1. Retrieves particle definition from name
2. Scans all processes for particle
3. Creates G4BOptnChangeCrossSection for each process
4. Maps processes to appropriate density ratios
5. Sets setup flag

**Process Classification**:
```cpp
// Hadronic processes use nuclear density
if (processType == fHadronic) {
    fProcessToDensity[processName] = fDensityRatioNuD;
}
// EM ionization uses electron density
else if (processName.contains("Ioni")) {
    fProcessToDensity[processName] = fDensityRatioElD;
}
// Others use average
else {
    fProcessToDensity[processName] = fDensityRatioNuDElD;
}
```

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingOptrChangeCrossSection.hh:68`

### ProposeOccurenceBiasingOperation

```cpp
private:
virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
    const G4Track* track,
    const G4BiasingProcessInterface* callingProcess
);
```

Proposes biasing operation for process occurrence.

**Parameters**:
- `track`: Current track being processed
- `callingProcess`: Process requesting biasing

**Returns**: Biasing operation with modified cross-section, or nullptr if no biasing

**Algorithm**:
1. Check if particle type matches
2. Retrieve channeling track data
3. Get appropriate density ratio
4. Calculate biased cross-section
5. Return change cross-section operation

**Implementation**:
```cpp
// Get track data
G4ChannelingTrackData* chanData =
    (G4ChannelingTrackData*) track->GetAuxiliaryTrackInformation(fChannelingID);

if (!chanData) return nullptr;  // Not in crystal

// Get process name
G4String processName = callingProcess->GetWrappedProcess()->GetProcessName();

// Determine density ratio
G4double densityRatio = 1.0;
switch(fProcessToDensity[processName]) {
    case fDensityRatioNuD:
        densityRatio = chanData->GetNuD();
        break;
    case fDensityRatioElD:
        densityRatio = chanData->GetElD();
        break;
    case fDensityRatioNuDElD:
        densityRatio = chanData->GetDensity();
        break;
}

// Get operation and set biased cross-section
G4BOptnChangeCrossSection* operation = fChangeCrossSectionOperations[callingProcess];
operation->SetBiasedCrossSection(nominalXS * densityRatio);

return operation;
```

**Location**: Lines 74-76

### ProposeFinalStateBiasingOperation

```cpp
private:
virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(
    const G4Track*,
    const G4BiasingProcessInterface*
);
```

Not used for channeling - returns nullptr.

**Returns**: Always nullptr (no final state biasing)

**Location**: Lines 77-79

### ProposeNonPhysicsBiasingOperation

```cpp
private:
virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(
    const G4Track*,
    const G4BiasingProcessInterface*
);
```

Not used for channeling - returns nullptr.

**Returns**: Always nullptr (no non-physics biasing)

**Location**: Lines 80-82

### OperationApplied

```cpp
private:
using G4VBiasingOperator::OperationApplied;

virtual void OperationApplied(
    const G4BiasingProcessInterface* callingProcess,
    G4BiasingAppliedCase biasingCase,
    G4VBiasingOperation* occurenceOperationApplied,
    G4double weightForOccurenceInteraction,
    G4VBiasingOperation* finalStateOperationApplied,
    const G4VParticleChange* particleChangeProduced
);
```

Called after biasing operation is applied.

**Parameters**:
- `callingProcess`: Process that was biased
- `biasingCase`: Type of biasing applied
- `occurenceOperationApplied`: Occurrence operation used
- `weightForOccurenceInteraction`: Monte Carlo weight
- `finalStateOperationApplied`: Final state operation (unused)
- `particleChangeProduced`: Resulting particle change

**Operations**:
- Updates statistics
- Verifies weight correctness
- Logs biasing information if verbose

**Location**: Lines 86-91

## Private Data Members

### Biasing Operations Map

```cpp
private:
std::map<const G4BiasingProcessInterface*,
         G4BOptnChangeCrossSection*> fChangeCrossSectionOperations;  // Lines 94-95
```

Associates each process interface with its change cross-section operation.

### Setup Flag

```cpp
private:
G4bool fSetup;  // Line 96
```

Indicates whether operator has been initialized. Set to true after `StartRun()`.

### Particle Definition

```cpp
private:
const G4ParticleDefinition* fParticleToBias;  // Line 97
```

Pointer to particle definition being biased.

### Process Density Map

```cpp
private:
std::unordered_map<std::string, G4ChannelingDensityRatio> fProcessToDensity;  // Line 100
```

Maps process names to density ratio types for cross-section calculation.

### Channeling ID

```cpp
private:
G4int fChannelingID;  // Line 71
```

ID for accessing channeling track data from auxiliary information system.

## Complete Usage Example

```cpp
#include "G4ChannelingOptrChangeCrossSection.hh"
#include "G4LogicalVolume.hh"

// In physics list or main program

// Create crystal logical volume with channeling material
G4LogicalCrystalVolume* crystalLV = ...;

// Create biasing operator for protons
G4ChannelingOptrChangeCrossSection* protonBiasing =
    new G4ChannelingOptrChangeCrossSection("proton", "ProtonChannelingBias");

// Attach operator to crystal volume
G4BiasingHelper::ActivateVolume(crystalLV);
G4BiasingHelper::AttachVolume(crystalLV, protonBiasing);

// Now all proton processes in crystal will be biased by local density
```

## Process-Specific Density Assignment

The operator automatically assigns appropriate density ratios:

**Hadronic Processes** (Nuclear Density):
- `hadElastic` - Elastic scattering
- `protonInelastic` - Inelastic collisions
- `neutronInelastic`
- `pionPlusInelastic`
- etc.

**Electromagnetic Ionization** (Electron Density):
- `eIoni` - Electron ionization
- `muIoni` - Muon ionization
- `hIoni` - Hadron ionization

**Other EM Processes** (Average Density):
- `eBrem` - Bremsstrahlung
- `compt` - Compton scattering
- `phot` - Photoelectric effect
- `conv` - Pair production

## Physics Impact

**Without Biasing**:
```
Cross-section = σ_0 (constant bulk value)
Interaction rate = λ^(-1) = σ_0 × n_bulk
```

**With Channeling Biasing**:
```
Cross-section = σ_0 × ρ_local(x,y,z)
Interaction rate = λ^(-1) = σ_0 × ρ_local × n_bulk
```

**Effect on Observables**:
- Dechanneling length increases (less scattering in channels)
- Channeling efficiency improves
- Radiation emission patterns change
- Beam deflection efficiency more accurate

## Performance Considerations

**Overhead**: Minimal (~1-5% CPU increase)
- Density lookup from track data (already cached)
- Single multiplication per cross-section query
- Map lookup for process type

**Memory**: Small (~1 KB per operator)
- Operation map storage
- Process-to-density mapping

**Benefit**: Essential for physics accuracy
- Dechanneling predictions: Factor of 2-3 improvement
- Channeling efficiency: 10-30% correction
- Critical for bent crystal applications

## See Also

- [G4ChannelingOptrMultiParticleChangeCrossSection](g4channelingoptrmultiparticlechangecrosssection.md) - Multi-particle wrapper
- [G4ChannelingTrackData](g4channelingtrackdata.md) - Source of density information
- [G4Channeling](g4channeling.md) - Process that updates track data
- G4VBiasingOperator - Base biasing class
- G4BOptnChangeCrossSection - Cross-section change operation
