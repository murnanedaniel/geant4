# G4DecayProcessType

**File**: `source/processes/decay/include/G4DecayProcessType.hh`

## Overview

G4DecayProcessType is an enumeration that defines process sub-types for all decay processes in Geant4. It provides a classification system to distinguish between different decay mechanisms, allowing for process identification, filtering, and specialized handling. The enumeration is used by decay process classes to set their sub-type through `SetProcessSubType()`, enabling runtime queries and process selection.

## Enumeration Definition

```cpp
enum G4DecayProcessType
{
    DECAY = 201,
    DECAY_WithSpin,
    DECAY_PionMakeSpin,
    DECAY_Radioactive = 210,
    DECAY_Unknown = 211,
    DECAY_MuAtom = 221,
    DECAY_External = 231
};
```

**Location**: `source/processes/decay/include/G4DecayProcessType.hh:42-51`

## Enumeration Values

### DECAY = 201

**Standard particle decay process**

The base decay process type for normal unstable particle decay. Used by G4Decay class.

**Used By**: [G4Decay](./g4decay.md)

**Implementation**: Line 69 in `source/processes/decay/src/G4Decay.cc`
```cpp
SetProcessSubType(static_cast<int>(DECAY));
```

**Characteristics**:
- Handles both in-flight and at-rest decay
- Uses particle decay tables
- Supports external decayers
- Standard Lorentz transformations
- No special polarization handling

**Applicable To**: All unstable particles with finite lifetime

---

### DECAY_WithSpin

**Decay process with spin and polarization tracking**

Extended decay process that includes spin precession in magnetic fields and polarization propagation.

**Value**: 202 (implicit: DECAY + 1)

**Used By**: [G4DecayWithSpin](./g4decaywithspin.md)

**Implementation**: Line 55 in `source/processes/decay/src/G4DecayWithSpin.cc`
```cpp
SetProcessSubType(static_cast<int>(DECAY_WithSpin));
```

**Characteristics**:
- Includes spin precession calculation
- Handles muon g-2 effects in magnetic fields
- Propagates polarization to decay channels
- Generates random polarization if not set
- Essential for muon physics experiments

**Applicable To**: Polarized particles, especially muons

---

### DECAY_PionMakeSpin

**Pion/kaon decay with muon spin calculation**

Specialized decay for mesons decaying to muons, implementing correct V-A weak interaction helicity.

**Value**: 203 (implicit: DECAY_WithSpin + 1)

**Used By**: [G4PionDecayMakeSpin](./g4piondecaymakespin.md)

**Implementation**: Line 42 in `source/processes/decay/src/G4PionDecayMakeSpin.cc`
```cpp
SetProcessSubType(static_cast<int>(DECAY_PionMakeSpin));
```

**Characteristics**:
- Calculates muon polarization from V-A theory
- Handles π→μν and K→μν decays
- Sets correct muon helicity
- Critical for polarized muon sources

**Applicable To**: π±, K±, K⁰_L

---

### DECAY_Radioactive = 210

**Radioactive decay process**

Nuclear decay including alpha, beta, gamma emission and nuclear de-excitation. Not part of the decay sub-module—implemented in radioactive_decay module.

**Value**: 210 (explicit assignment)

**Used By**: `G4RadioactiveDecay` (in processes/hadronic/models/radioactive_decay/)

**Characteristics**:
- Nuclear transitions
- Alpha, beta, gamma emission
- Isomeric transitions
- Atomic de-excitation
- Long time scales (seconds to years)

**Note**: Different from particle decay—handles nuclear physics

---

### DECAY_Unknown = 211

**Decay of unknown particles**

Simplified decay process for particles named "unknown" with pre-assigned decay products.

**Value**: 211 (explicit: DECAY_Radioactive + 1)

**Used By**: [G4UnknownDecay](./g4unknowndecay.md)

**Implementation**: Line 52 in `source/processes/decay/src/G4UnknownDecay.cc`
```cpp
SetProcessSubType(static_cast<int>(DECAY_Unknown));
```

**Characteristics**:
- Only for particles named "unknown"
- Requires pre-assigned decay products
- No decay table mechanism
- In-flight only (no AtRest)
- For exotic/hypothetical particles

**Applicable To**: "unknown" particle definition only

---

### DECAY_MuAtom = 221

**Muonic atom decay/transition**

Decay process for bound muon systems (muonic atoms, muonium). Not implemented in decay sub-module—would be in atomic processes.

**Value**: 221 (explicit assignment)

**Used By**: Muonic atom processes (if implemented)

**Characteristics**:
- Muon bound to nucleus
- Atomic transitions
- Muon capture processes
- Specialized atomic physics

**Note**: Placeholder for future or specialized implementations

---

### DECAY_External = 231

**Decay handled by external library**

Indicates that an external decay generator (EvtGen, Pythia, etc.) is controlling the decay.

**Value**: 231 (explicit assignment)

**Set By**: G4Decay when external decayer is assigned

**Implementation**: Lines 498-500 in `source/processes/decay/src/G4Decay.cc`
```cpp
if (pExtDecayer != nullptr) {
    SetProcessSubType(static_cast<int>(DECAY_External));
}
```

**Characteristics**:
- External library handles decay generation
- Complex matrix elements
- Full angular correlations
- CP violation, time-dependent effects
- No Lorentz boost by G4Decay

**Used With**: [G4VExtDecayer](./g4vextdecayer.md) interface

## Value Ranges and Organization

The enumeration uses a structured numbering scheme:

| Range | Category | Usage |
|-------|----------|-------|
| **201-209** | Standard Particle Decay | Basic decay processes |
| **210-219** | Nuclear Decay | Radioactive decay processes |
| **221-229** | Atomic Processes | Muonic atoms, exotic atoms |
| **231-239** | External Decayers | External library integration |

This organization allows for:
- Easy categorization by range
- Future expansion within each category
- Clear separation of physics domains

## Usage Examples

### Example 1: Identifying Decay Type

```cpp
#include "G4Step.hh"
#include "G4VProcess.hh"
#include "G4DecayProcessType.hh"

void MySteppingAction::UserSteppingAction(const G4Step* step) {
    const G4VProcess* process =
        step->GetPostStepPoint()->GetProcessDefinedStep();

    if (process && process->GetProcessType() == fDecay) {
        G4int subType = process->GetProcessSubType();

        switch (subType) {
            case DECAY:
                G4cout << "Standard decay" << G4endl;
                break;

            case DECAY_WithSpin:
                G4cout << "Decay with spin tracking" << G4endl;
                break;

            case DECAY_PionMakeSpin:
                G4cout << "Pion/kaon decay with muon spin" << G4endl;
                break;

            case DECAY_Radioactive:
                G4cout << "Radioactive decay" << G4endl;
                break;

            case DECAY_Unknown:
                G4cout << "Unknown particle decay" << G4endl;
                break;

            case DECAY_External:
                G4cout << "External decayer" << G4endl;
                break;

            default:
                G4cout << "Other decay type: " << subType << G4endl;
        }
    }
}
```

### Example 2: Filtering Specific Decay Types

```cpp
#include "G4Track.hh"
#include "G4Step.hh"

// Count only standard decays, excluding external decayers
void MyAnalysis::ProcessStep(const G4Step* step) {
    const G4VProcess* process =
        step->GetPostStepPoint()->GetProcessDefinedStep();

    if (process && process->GetProcessType() == fDecay) {
        G4int subType = process->GetProcessSubType();

        // Exclude external decayers from analysis
        if (subType != DECAY_External) {
            nStandardDecays++;

            // Your analysis code here
        }
    }
}
```

### Example 3: Detecting External Decayer Usage

```cpp
#include "G4Decay.hh"
#include "G4ProcessManager.hh"

// Check if a particle uses external decayer
bool UsesExternalDecayer(G4ParticleDefinition* particle) {
    G4ProcessManager* pManager = particle->GetProcessManager();
    G4ProcessVector* processVector = pManager->GetProcessList();

    for (size_t i = 0; i < processVector->size(); ++i) {
        G4VProcess* process = (*processVector)[i];

        if (process->GetProcessType() == fDecay &&
            process->GetProcessSubType() == DECAY_External) {
            return true;
        }
    }

    return false;
}
```

### Example 4: Process Statistics

```cpp
#include <map>

class DecayStatistics {
public:
    void RecordDecay(G4int subType) {
        decayCount[subType]++;
    }

    void PrintStatistics() {
        G4cout << "Decay Process Statistics:" << G4endl;
        G4cout << "  Standard decay: "
               << decayCount[DECAY] << G4endl;
        G4cout << "  Decay with spin: "
               << decayCount[DECAY_WithSpin] << G4endl;
        G4cout << "  Pion decay (spin): "
               << decayCount[DECAY_PionMakeSpin] << G4endl;
        G4cout << "  Radioactive decay: "
               << decayCount[DECAY_Radioactive] << G4endl;
        G4cout << "  Unknown decay: "
               << decayCount[DECAY_Unknown] << G4endl;
        G4cout << "  External decay: "
               << decayCount[DECAY_External] << G4endl;
    }

private:
    std::map<G4int, G4int> decayCount;
};
```

### Example 5: Conditional Analysis Based on Type

```cpp
void MyEventAction::EndOfEventAction(const G4Event* event) {
    G4int nTracks = event->GetNumberOfTracks();

    for (G4int i = 0; i < nTracks; ++i) {
        G4Track* track = event->GetTrack(i);

        if (track->GetCreatorProcess()) {
            G4int processType = track->GetCreatorProcess()->GetProcessType();
            G4int subType = track->GetCreatorProcess()->GetProcessSubType();

            if (processType == fDecay) {
                // Analyze based on decay type
                if (subType == DECAY_WithSpin ||
                    subType == DECAY_PionMakeSpin) {
                    // Polarization is meaningful
                    AnalyzePolarization(track);
                }

                if (subType == DECAY_External) {
                    // External decayer used—may have different systematics
                    FlagForSystematicStudy(track);
                }
            }
        }
    }
}
```

## Relationship to Process Types

G4DecayProcessType values are **sub-types** within the broader `G4ProcessType::fDecay` category.

### Process Type Hierarchy

```
G4ProcessType (main categories)
    └─ fDecay = 6
        ├─ DECAY = 201
        ├─ DECAY_WithSpin = 202
        ├─ DECAY_PionMakeSpin = 203
        ├─ DECAY_Radioactive = 210
        ├─ DECAY_Unknown = 211
        ├─ DECAY_MuAtom = 221
        └─ DECAY_External = 231
```

### Querying Process Type and Sub-Type

```cpp
G4VProcess* process = /* ... */;

// Check main process type
if (process->GetProcessType() == fDecay) {
    // It's a decay process

    // Check specific sub-type
    G4int subType = process->GetProcessSubType();
    if (subType == DECAY_External) {
        // It's using an external decayer
    }
}
```

## Design Rationale

### Explicit Value Assignment

Some values are explicitly assigned (210, 211, 221, 231) while others are implicit:
- **Explicit**: Creates gaps for future expansion
- **Related values**: Sequential (201, 202, 203)
- **Different domains**: Separated by gaps (nuclear, atomic, external)

### Numbering Convention

Starting at 201 (not 1):
- Avoids conflicts with other enumerations
- Leaves room below for general process types
- Clear distinction from other process sub-types

### Gap Preservation

Gaps between ranges allow:
- Adding new standard decay types (204-209)
- Expanding nuclear decay types (212-219)
- Adding atomic processes (222-229)
- External decayer variants (232-239)

## Related Enumerations

### G4ProcessType

Main process type enumeration (in processes/management):
```cpp
enum G4ProcessType {
    fNotDefined,
    fTransportation,
    fElectromagnetic,
    fOptical,
    fHadronic,
    fPhotolepton_hadron,
    fDecay,           // ← Decay processes use this
    fGeneral,
    fParameterisation,
    fUserDefined,
    fParallel,
    fPhonon,
    fUCN
};
```

## Related Classes

- **[G4Decay](./g4decay.md)**: Uses `DECAY`
- **[G4DecayWithSpin](./g4decaywithspin.md)**: Uses `DECAY_WithSpin`
- **[G4PionDecayMakeSpin](./g4piondecaymakespin.md)**: Uses `DECAY_PionMakeSpin`
- **[G4UnknownDecay](./g4unknowndecay.md)**: Uses `DECAY_Unknown`
- **G4VProcess**: Base class with `GetProcessSubType()` method
- **G4RadioactiveDecay**: Uses `DECAY_Radioactive` (in hadronic module)

## Notes

- Sub-type values are unique within the decay domain
- The enumeration is defined in a header-only file
- No associated class—pure enumeration
- Values can be cast to `int` for `SetProcessSubType()`
- Used for runtime process identification
- Allows filtering and conditional analysis
- External decayer sub-type is set dynamically by G4Decay
- Gaps in numbering are intentional for future expansion
- Some values (MuAtom) are placeholders for future/specialized implementations
