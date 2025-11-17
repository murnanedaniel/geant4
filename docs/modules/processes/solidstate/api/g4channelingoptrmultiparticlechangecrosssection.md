# G4ChannelingOptrMultiParticleChangeCrossSection

**File**: `source/processes/solidstate/channeling/include/G4ChannelingOptrMultiParticleChangeCrossSection.hh`

## Overview

G4ChannelingOptrMultiParticleChangeCrossSection is a wrapper biasing operator that applies density-based cross-section modifications to multiple particle types simultaneously. It internally manages a collection of G4ChannelingOptrChangeCrossSection operators, one per particle type, providing a convenient interface for biasing all channeling interactions.

## Class Description

G4ChannelingOptrMultiParticleChangeCrossSection provides multi-particle biasing:

- **Particle Registration**: Add individual particles or all charged particles
- **Operator Delegation**: Routes biasing requests to particle-specific operators
- **Unified Interface**: Single operator for entire crystal volume
- **Statistics Tracking**: Monitors biasing across all particle types
- **Automatic Setup**: Handles operator creation and management

This operator is the recommended way to enable channeling biasing when multiple particle types are present in the simulation.

**Inheritance**: G4VBiasingOperator

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingOptrMultiParticleChangeCrossSection.hh:50`

## Constructor & Destructor

### Constructor

```cpp
G4ChannelingOptrMultiParticleChangeCrossSection();
```

Creates multi-particle biasing operator with default name.

**Initialization**:
- Sets operator name to "ChannelingMultiParticleXS"
- Initializes operator map (empty)
- Prepares particle list
- Sets current operator to nullptr

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingOptrMultiParticleChangeCrossSection.hh:52`

### Destructor

```cpp
virtual ~G4ChannelingOptrMultiParticleChangeCrossSection();
```

Virtual destructor. Cleans up managed operators.

**Note**: Operators are owned and deleted by this class.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingOptrMultiParticleChangeCrossSection.hh:53`

## Particle Registration

### AddParticle

```cpp
void AddParticle(const G4String& particleName);
```

Adds a particle type to be biased.

**Parameters**:
- `particleName`: Name of particle (e.g., "proton", "pi+", "mu-")

**Process**:
1. Retrieves particle definition from name
2. Creates G4ChannelingOptrChangeCrossSection for particle
3. Stores operator in internal map
4. Adds particle to tracking list

**Example**:
```cpp
multiParticleBias->AddParticle("proton");
multiParticleBias->AddParticle("pi+");
multiParticleBias->AddParticle("pi-");
multiParticleBias->AddParticle("kaon+");
```

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingOptrMultiParticleChangeCrossSection.hh:61`

### AddChargedParticles

```cpp
void AddChargedParticles();
```

Adds all charged particles in particle table.

**Process**:
1. Iterates through G4ParticleTable
2. Checks PDG charge for each particle
3. Calls AddParticle() for each charged particle
4. Includes: leptons, hadrons, ions

**Convenience**: Automatically biases:
- e±, μ±, τ±
- p, p̄
- π±, K±, etc.
- All charged ions

**Usage**:
```cpp
multiParticleBias->AddChargedParticles();
// Now all charged particles will be biased
```

**Note**: May include rare particles not relevant to application. For performance, prefer explicitly adding only needed particles.

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingOptrMultiParticleChangeCrossSection.hh:62`

## Biasing Method Delegation

### ProposeOccurenceBiasingOperation

```cpp
private:
virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
    const G4Track* track,
    const G4BiasingProcessInterface* callingProcess
);
```

Proposes occurrence biasing by delegating to appropriate particle-specific operator.

**Parameters**:
- `track`: Current track
- `callingProcess`: Process requesting biasing

**Returns**: Biasing operation from particle-specific operator, or nullptr

**Algorithm**:
1. Get particle definition from track
2. Lookup operator for this particle type
3. If found, delegate to that operator's ProposeOccurenceBiasingOperation
4. If not found, return nullptr (no biasing)

**Implementation**:
```cpp
const G4ParticleDefinition* particle = track->GetParticleDefinition();

// Find operator for this particle
auto it = fBOptrForParticle.find(particle);
if (it != fBOptrForParticle.end()) {
    fCurrentOperator = it->second;
    return fCurrentOperator->ProposeOccurenceBiasingOperation(track, callingProcess);
}

return nullptr;
```

**Location**: Lines 70-72

### ProposeFinalStateBiasingOperation

```cpp
private:
virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(
    const G4Track*,
    const G4BiasingProcessInterface*
);
```

Not used - returns nullptr.

**Returns**: Always nullptr (delegated operators don't use final state biasing)

**Location**: Lines 74-76

### ProposeNonPhysicsBiasingOperation

```cpp
private:
virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(
    const G4Track*,
    const G4BiasingProcessInterface*
);
```

Not used - returns nullptr.

**Returns**: Always nullptr (no non-physics biasing)

**Location**: Lines 77-79

## Callback Methods

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
- `biasingCase`: Type of biasing
- `occurenceOperationApplied`: Operation used
- `weightForOccurenceInteraction`: Weight assigned
- `finalStateOperationApplied`: Final state operation (unused)
- `particleChangeProduced`: Result

**Action**:
- Increments interaction counter for current track
- Delegates to current particle operator's OperationApplied
- Updates statistics

**Location**: Lines 90-95

### StartTracking

```cpp
public:
void StartTracking(const G4Track* track);
```

Called when new track starts.

**Parameters**:
- `track`: New track being started

**Action**:
1. Resets interaction counter to zero
2. Determines particle type
3. Sets current operator for this track
4. Delegates to operator's StartTracking if needed

**Implementation**:
```cpp
fnInteractions = 0;

const G4ParticleDefinition* particle = track->GetParticleDefinition();
auto it = fBOptrForParticle.find(particle);

if (it != fBOptrForParticle.end()) {
    fCurrentOperator = it->second;
} else {
    fCurrentOperator = nullptr;
}
```

**Location**: `source/processes/solidstate/channeling/include/G4ChannelingOptrMultiParticleChangeCrossSection.hh:99`

## Private Data Members

### Operator Map

```cpp
private:
std::map<const G4ParticleDefinition*,
         G4ChannelingOptrChangeCrossSection*> fBOptrForParticle;  // Lines 103-104
```

Associates each particle definition with its dedicated biasing operator.

**Key**: Particle definition pointer (unique per particle type)
**Value**: Biasing operator instance for that particle

### Particle List

```cpp
private:
std::vector<const G4ParticleDefinition*> fParticlesToBias;  // Line 105
```

List of particle definitions being biased. Used for iteration and management.

### Current Operator

```cpp
private:
G4ChannelingOptrChangeCrossSection* fCurrentOperator;  // Line 106
```

Pointer to operator handling current track. Set in StartTracking, used in biasing methods.

### Interaction Counter

```cpp
private:
G4int fnInteractions;  // Line 109
```

Counts number of biased interactions for current track. Reset at StartTracking.

**Purpose**: Statistics and validation. Can detect if biasing is working correctly.

## Complete Usage Example

```cpp
#include "G4ChannelingOptrMultiParticleChangeCrossSection.hh"
#include "G4LogicalCrystalVolume.hh"
#include "G4BiasingHelper.hh"

// In main program or physics list

// Create crystal logical volume
G4LogicalCrystalVolume* crystalLV = ...;  // Your crystal volume

// Create multi-particle biasing operator
G4ChannelingOptrMultiParticleChangeCrossSection* channelBias =
    new G4ChannelingOptrMultiParticleChangeCrossSection();

// Option 1: Add specific particles
channelBias->AddParticle("proton");
channelBias->AddParticle("pi+");
channelBias->AddParticle("pi-");

// Option 2: Add all charged particles (alternative)
// channelBias->AddChargedParticles();

// Attach operator to crystal volume
G4BiasingHelper::ActivateVolume(crystalLV);
G4BiasingHelper::AttachVolume(crystalLV, channelBias);

// All specified particles will now be biased by local density
```

## Comparison with Single-Particle Operator

### Single-Particle Approach

```cpp
// Create operator for each particle
G4ChannelingOptrChangeCrossSection* protonBias =
    new G4ChannelingOptrChangeCrossSection("proton");

G4ChannelingOptrChangeCrossSection* pionPlusBias =
    new G4ChannelingOptrChangeCrossSection("pi+");

G4ChannelingOptrChangeCrossSection* pionMinusBias =
    new G4ChannelingOptrChangeCrossSection("pi-");

// Attach each operator (can't do this to same volume!)
// Problem: Only one operator per volume
```

### Multi-Particle Approach (Recommended)

```cpp
// Create single multi-particle operator
G4ChannelingOptrMultiParticleChangeCrossSection* multiBias =
    new G4ChannelingOptrMultiParticleChangeCrossSection();

// Add all particles
multiBias->AddParticle("proton");
multiBias->AddParticle("pi+");
multiBias->AddParticle("pi-");

// Attach single operator
G4BiasingHelper::AttachVolume(crystalLV, multiBias);

// Works for all particles!
```

## Application Scenarios

### Hadron Beams (Multiple Species)

```cpp
multiBias->AddParticle("proton");
multiBias->AddParticle("pi+");
multiBias->AddParticle("pi-");
multiBias->AddParticle("kaon+");
multiBias->AddParticle("kaon-");
```

**Use Case**: LHC beam halo, fixed-target experiments

### Heavy Ion Collisions

```cpp
multiBias->AddChargedParticles();  // All particles
```

**Use Case**: RHIC, LHC Pb-Pb collisions with crystal collimation

### Electron/Positron Beams

```cpp
multiBias->AddParticle("e-");
multiBias->AddParticle("e+");
```

**Use Case**: Crystal-based beam cooling, positron production

### Mixed Lepton-Hadron

```cpp
multiBias->AddParticle("mu-");
multiBias->AddParticle("mu+");
multiBias->AddParticle("pi+");
multiBias->AddParticle("pi-");
```

**Use Case**: Muon facility beam lines with pion contamination

## Performance Notes

**Overhead per Particle**: ~1 KB memory, negligible CPU

**Lookup Cost**: O(log N) where N = number of particle types
- Map lookup per biasing query
- Typically N < 10, so very fast

**Recommendation**:
- Use specific particle addition for known beam composition
- Use AddChargedParticles() only when particle types unknown
- No significant performance difference either way

## Debugging

### Enable Verbose Output

```cpp
multiBias->SetVerbosity(1);  // If base class supports

// Or check interaction counts manually
```

### Verify Biasing Active

```cpp
// In event action or stepping action
G4int nInteractions = ...; // Access fnInteractions if exposed

if (nInteractions == 0 && trackInCrystal) {
    G4cout << "WARNING: No biased interactions in crystal!" << G4endl;
}
```

### Check Operator Assignment

Print operator map after setup:
```cpp
// After adding all particles
G4cout << "Biasing operators created for:" << G4endl;
for (auto& pair : fBOptrForParticle) {
    G4cout << "  " << pair.first->GetParticleName() << G4endl;
}
```

## See Also

- [G4ChannelingOptrChangeCrossSection](g4channelingoptrchangecrosssection.md) - Single-particle operator used internally
- [G4Channeling](g4channeling.md) - Process being biased
- [G4ChannelingTrackData](g4channelingtrackdata.md) - Density data source
- G4VBiasingOperator - Base biasing operator class
- G4BiasingHelper - Attachment utilities
