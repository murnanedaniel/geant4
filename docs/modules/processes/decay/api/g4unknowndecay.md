# G4UnknownDecay

**File**: `source/processes/decay/include/G4UnknownDecay.hh`

## Overview

G4UnknownDecay is a specialized decay process designed exclusively for "unknown" particles in Geant4. Unlike the standard G4Decay process, it only handles in-flight decay (PostStepDoIt) and requires pre-assigned decay products. This class is used for exotic, hypothetical, or user-defined particles that don't fit into the standard particle classification system.

## Class Description

G4UnknownDecay provides a minimal decay mechanism for unknown particles:

- **Unknown Particles Only**: Applicable only to particles named "unknown"
- **No Decay Table**: Does not use G4DecayTable mechanism
- **Pre-Assigned Products Required**: Decay products must be set explicitly
- **Discrete Process Only**: Inherits from G4VDiscreteProcess (no AtRest)
- **Pre-Assigned Decay Time**: Uses particle's pre-assigned proper time
- **Simplified Implementation**: Minimal functionality for special use cases

The class is intended for:
- User-defined exotic particles
- Hypothetical beyond-Standard-Model particles
- Temporary placeholder particles in custom physics
- Specialized event generation scenarios

**Inheritance**: G4VDiscreteProcess → G4VProcess

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:43`

## Constructor & Destructor

### Constructor

```cpp
G4UnknownDecay(const G4String& processName = "UnknownDecay");
```

Creates a new unknown decay process.

**Parameters**:
- `processName`: Name of the process (default: "UnknownDecay")

**Implementation**: Lines 46-60 in `source/processes/decay/src/G4UnknownDecay.cc`

```cpp
G4UnknownDecay::G4UnknownDecay(const G4String& processName)
    : G4VDiscreteProcess(processName, fDecay),
      verboseLevel(1),
      HighestValue(20.0)
{
    // Set Process Sub Type
    SetProcessSubType(static_cast<int>(DECAY_Unknown));

    pParticleChange = &fParticleChangeForDecay;
}
```

**Initialization**:
- Process type: `fDecay`
- Process sub-type: `DECAY_Unknown` (211)
- Verbose level: 1 (warning messages)
- HighestValue: 20.0 (used as maximum interaction length multiplier)

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:50`

### Destructor

```cpp
virtual ~G4UnknownDecay();
```

Virtual destructor (empty implementation).

**Implementation**: Lines 62-64 in `source/processes/decay/src/G4UnknownDecay.cc`

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:53`

## Core Process Methods

### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aParticleType) override;
```

Determines if the process applies to a particle. Returns true only for particles named "unknown".

**Parameters**:
- `aParticleType`: Particle definition to check

**Returns**: `true` if particle name is "unknown", `false` otherwise

**Implementation**: Lines 66-70 in `source/processes/decay/src/G4UnknownDecay.cc`

```cpp
if (aParticleType.GetParticleName() == "unknown") return true;
return false;
```

**Note**: This is a strict name check. The particle must be explicitly named "unknown" to use this process.

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:76`

### BuildPhysicsTable

```cpp
virtual void BuildPhysicsTable(const G4ParticleDefinition&) override;
```

Builds physics tables. Empty implementation—no tables needed for unknown decay.

**Parameters**:
- Particle definition (unused)

**Implementation**: Lines 77-80 in `source/processes/decay/src/G4UnknownDecay.cc`

```cpp
return;
```

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:69`

## DoIt Methods

### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(
    const G4Track& aTrack,
    const G4Step& aStep
) override;
```

Handles decay in-flight. Inline implementation that calls DecayIt().

**Parameters**:
- `aTrack`: Current track
- `aStep`: Current step

**Returns**: Particle change with decay products

**Implementation**: Lines 149-156 in `source/processes/decay/include/G4UnknownDecay.hh` (inline)

```cpp
return DecayIt(aTrack, aStep);
```

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:64-67`

### DecayIt (Protected)

```cpp
protected:
virtual G4VParticleChange* DecayIt(
    const G4Track& aTrack,
    const G4Step& aStep
);
```

Main decay implementation for unknown particles.

**Parameters**:
- `aTrack`: Current track
- `aStep`: Current step

**Returns**: Particle change with daughter particles

**Implementation**: Lines 82-179 in `source/processes/decay/src/G4UnknownDecay.cc`

**Algorithm**:

1. **Initialize**: Set up particle change object
2. **Check Pre-Assigned Products**: Get pre-assigned decay products
3. **No Products Case**: If no pre-assigned products, kill particle without decay
4. **Copy Products**: Create new G4DecayProducts from pre-assigned products
5. **Energy Check**: Verify parent energy >= mass
6. **Lorentz Boost**: Apply boost if pre-assigned decay time is valid
7. **Create Secondaries**: Generate daughter tracks
8. **Kill Parent**: Terminate parent track

**Key Code Sections**:

**Pre-assigned check** (lines 95-108):
```cpp
const G4DecayProducts* o_products = (aParticle->GetPreAssignedDecayProducts());
G4bool isPreAssigned = (o_products != nullptr);

if (!isPreAssigned) {
    fParticleChangeForDecay.SetNumberOfSecondaries(0);
    // Kill the parent particle
    fParticleChangeForDecay.ProposeTrackStatus(fStopAndKill);
    fParticleChangeForDecay.ProposeLocalEnergyDeposit(0.0);

    ClearNumberOfInteractionLengthLeft();
    return &fParticleChangeForDecay;
}
```

**Energy validation** (lines 114-127):
```cpp
G4double ParentEnergy = aParticle->GetTotalEnergy();
G4double ParentMass = aParticle->GetMass();
if (ParentEnergy < ParentMass) {
    ParentEnergy = ParentMass;
    // Warning message if verbose
}
```

**Lorentz boost** (lines 130-136):
```cpp
if (aParticle->GetPreAssignedDecayProperTime() >= 0.) {
    products->Boost(ParentEnergy, ParentDirection);
}
```

**Note**: Boost is only applied if pre-assigned decay time is valid (>= 0).

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:84-87`

## GPIL Methods

### PostStepGetPhysicalInteractionLength

```cpp
virtual G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition
) override;
```

Calculates physical interaction length using pre-assigned decay time.

**Parameters**:
- `track`: Current track
- `previousStepSize`: Previous step size (unused)
- `condition`: Returns NotForced

**Returns**: Distance to decay point

**Implementation**: Lines 124-146 in `source/processes/decay/include/G4UnknownDecay.hh` (inline)

**Algorithm**:

1. **Get Pre-Assigned Time**: Retrieve pre-assigned proper time
2. **Ensure Valid Time**: If invalid (<0), set to minimum value
3. **Set Condition**: Set to NotForced
4. **Calculate Remainder**: `remainder = PreAssignedTime - ProperTime`
5. **Convert to Distance**: `PIL = remainder × c`

```cpp
// Pre-assigned UnknownDecay time
G4double pTime = track.GetDynamicParticle()->GetPreAssignedDecayProperTime();

if (pTime < 0.) pTime = DBL_MIN;

// Condition is set to "Not Forced"
*condition = NotForced;

// Reminder proper time
G4double remainder = pTime - track.GetProperTime();
if (remainder <= 0.0) remainder = DBL_MIN;

// Use pre-assigned Decay time to determine PIL
return remainder * CLHEP::c_light;
```

**Note**: Unlike G4Decay, this always uses pre-assigned time. There is no random sampling from exponential distribution.

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:93-97`

### GetMeanFreePath (Protected)

```cpp
protected:
virtual G4double GetMeanFreePath(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4ForceCondition* condition
) override;
```

Returns mean free path. Always returns 0.0 for unknown particles.

**Parameters**:
- `aTrack`: Current track (unused)
- `previousStepSize`: Previous step size (unused)
- `condition`: Force condition (unused)

**Returns**: 0.0 (always)

**Implementation**: Lines 72-75 in `source/processes/decay/src/G4UnknownDecay.cc`

```cpp
return 0.0;
```

**Note**: Mean free path is not used since decay time is pre-assigned. The PostStepGetPhysicalInteractionLength handles distance calculation.

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:102-105`

## Process Description

### ProcessDescription

```cpp
virtual void ProcessDescription(std::ostream& outFile) const override;
```

Writes process description to output stream.

**Parameters**:
- `outFile`: Output stream

**Implementation**: Lines 181-187 in `source/processes/decay/src/G4UnknownDecay.cc`

```cpp
outFile << GetProcessName()
        << ": Decay of 'unknown' particles. \n"
        << "kinematics of daughters are determined "
        << "by PreAssignedDecayProducts. \n";
```

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:80`

## Member Variables

### Private Members

```cpp
private:
G4int verboseLevel;
```

Controls output verbosity:
- 0: Silent
- 1: Warning messages (default)
- 2: Detailed information

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:108`

---

```cpp
const G4double HighestValue;
```

Maximum value for interaction length multiplier. Set to 20.0.

**Implementation**: Line 49 in `source/processes/decay/src/G4UnknownDecay.cc`

**Note**: This constant is defined but not actively used in the current implementation.

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:116`

---

```cpp
G4ParticleChangeForDecay fParticleChangeForDecay;
```

Particle change object for decay processes.

**Location**: `source/processes/decay/include/G4UnknownDecay.hh:119`

## Usage Examples

### Example 1: Creating an Unknown Particle

```cpp
#include "G4ParticleDefinition.hh"
#include "G4ParticleTable.hh"

// Define unknown particle
G4ParticleDefinition* unknownParticle = new G4ParticleDefinition(
    "unknown",          // name
    100.0*GeV,         // mass
    0.0,               // width
    0.0,               // charge
    0,                 // 2*spin
    0,                 // parity
    0,                 // C-conjugation
    0,                 // 2*isospin
    0,                 // 2*isospin3
    0,                 // G-parity
    "unknown",         // type
    0,                 // lepton number
    0,                 // baryon number
    0,                 // PDG encoding
    false,             // stable?
    -1.0,              // lifetime (negative = unstable)
    nullptr,           // decay table
    false,             // short lived
    "unknown"          // subtype
);

// Register in particle table
G4ParticleTable::GetParticleTable()->Insert(unknownParticle);
```

### Example 2: Adding Unknown Decay Process

```cpp
#include "G4UnknownDecay.hh"
#include "G4ProcessManager.hh"

// Create unknown decay process
G4UnknownDecay* unknownDecay = new G4UnknownDecay("UnknownDecay");

// Get particle's process manager
G4ParticleDefinition* unknown =
    G4ParticleTable::GetParticleTable()->FindParticle("unknown");

if (unknown) {
    G4ProcessManager* pManager = unknown->GetProcessManager();

    // Add process (PostStep only, no AtRest)
    pManager->AddProcess(unknownDecay);
    pManager->SetProcessOrdering(unknownDecay, idxPostStep);
}
```

### Example 3: Setting Pre-Assigned Decay Products

```cpp
#include "G4DecayProducts.hh"
#include "G4DynamicParticle.hh"
#include "G4PrimaryParticle.hh"

// Create parent particle
G4DynamicParticle* parent = new G4DynamicParticle(
    unknownDef,
    G4ThreeVector(px, py, pz)
);

// Set pre-assigned decay time (proper time)
G4double properTime = 10.0*ns;
parent->SetPreAssignedDecayProperTime(properTime);

// Create decay products
G4DecayProducts* products = new G4DecayProducts(*parent);

// Add daughter particles
G4DynamicParticle* daughter1 = new G4DynamicParticle(
    electronDef,
    G4ThreeVector(p1x, p1y, p1z)
);
G4DynamicParticle* daughter2 = new G4DynamicParticle(
    positronDef,
    G4ThreeVector(p2x, p2y, p2z)
);

products->PushProducts(daughter1);
products->PushProducts(daughter2);

// Pre-assign to parent
parent->SetPreAssignedDecayProducts(products);

// When UnknownDecay process acts, it will use these products
```

### Example 4: Using in Primary Generator

```cpp
#include "G4PrimaryParticle.hh"
#include "G4PrimaryVertex.hh"
#include "G4Event.hh"

void MyPrimaryGenerator::GeneratePrimaries(G4Event* event) {
    // Create primary particle
    G4PrimaryParticle* primary = new G4PrimaryParticle(
        unknownDef,
        px, py, pz
    );

    // Set pre-assigned decay time
    primary->SetProperTime(10.0*ns);

    // Create decay products
    G4DecayProducts* products = CreateMyDecayProducts();
    primary->SetDecayProducts(products);

    // Create vertex
    G4PrimaryVertex* vertex = new G4PrimaryVertex(
        x0, y0, z0, t0
    );
    vertex->SetPrimary(primary);

    event->AddPrimaryVertex(vertex);
}
```

### Example 5: Monitoring Unknown Decay

```cpp
#include "G4SteppingManager.hh"

void MySteppingAction::UserSteppingAction(const G4Step* step) {
    const G4Track* track = step->GetTrack();

    // Check if unknown particle decayed
    if (track->GetDefinition()->GetParticleName() == "unknown") {
        const G4VProcess* process =
            step->GetPostStepPoint()->GetProcessDefinedStep();

        if (process && process->GetProcessName() == "UnknownDecay") {
            G4cout << "Unknown particle decayed at:" << G4endl;
            G4cout << "  Position: " << track->GetPosition()/cm << " cm" << G4endl;
            G4cout << "  Time: " << track->GetGlobalTime()/ns << " ns" << G4endl;
            G4cout << "  Proper time: " << track->GetProperTime()/ns << " ns" << G4endl;

            // Get secondaries
            const std::vector<const G4Track*>* secondaries =
                step->GetSecondaryInCurrentStep();

            if (secondaries) {
                G4cout << "  Produced " << secondaries->size()
                       << " daughters" << G4endl;

                for (auto secondary : *secondaries) {
                    G4cout << "    - "
                           << secondary->GetDefinition()->GetParticleName()
                           << " with momentum "
                           << secondary->GetMomentum()/GeV << " GeV"
                           << G4endl;
                }
            }
        }
    }
}
```

## Differences from G4Decay

| Feature | G4Decay | G4UnknownDecay |
|---------|---------|----------------|
| **Base Class** | G4VRestDiscreteProcess | G4VDiscreteProcess |
| **At-Rest Decay** | Yes (AtRestDoIt) | No |
| **In-Flight Decay** | Yes (PostStepDoIt) | Yes (PostStepDoIt) |
| **Decay Table** | Uses G4DecayTable | Not used |
| **External Decayer** | Supported | Not supported |
| **Pre-Assigned Products** | Optional | Required |
| **Decay Time Sampling** | Exponential or pre-assigned | Pre-assigned only |
| **Applicability** | All unstable particles | Only "unknown" particle |
| **Mean Free Path** | Calculated from lifetime | Always 0.0 |
| **Lorentz Boost** | Always applied | Conditional on pre-assigned time |

## Physics Considerations

### Pre-Assigned Decay Time

Unlike standard particles, unknown particles require explicit decay time:
```cpp
particle->SetPreAssignedDecayProperTime(properTime);
```

The decay occurs at:
```
Distance = (ProperTime) × c × γβ
```

Where γβ = p/m (relativistic factor).

### No Decay Table

Unknown particles bypass the decay table mechanism. All decay information must be pre-assigned:
- Decay time
- Daughter particles
- Daughter momenta
- Daughter positions

### Energy-Momentum Conservation

The user is responsible for ensuring:
- Four-momentum conservation in pre-assigned products
- Kinematically allowed decays
- Correct Lorentz transformation if needed

### Applications

G4UnknownDecay is useful for:

1. **Beyond Standard Model Physics**:
   - Hypothetical particles (SUSY, extra dimensions)
   - Exotic resonances
   - Dark matter candidates

2. **Custom Event Generation**:
   - Interfacing with external generators
   - Fixed decay topology studies
   - Validation and testing

3. **Simplified Models**:
   - Placeholder for complex physics
   - Effective field theory implementations
   - Phenomenological studies

## Related Classes

- **[G4Decay](./g4decay.md)**: Standard decay process
- **G4VDiscreteProcess**: Base class for discrete processes
- **G4DecayProducts**: Container for decay products
- **G4DynamicParticle**: Dynamic particle with pre-assigned decay
- **G4ParticleChangeForDecay**: Decay-specific particle change

## Notes

- Only works with particles named exactly "unknown"
- Pre-assigned decay products are mandatory—without them, particle is simply killed
- No at-rest decay capability (use G4Decay if needed)
- Lorentz boost only applied if pre-assigned decay time >= 0
- GetMeanFreePath returns 0.0—decay distance from PostStepGPIL
- No random decay time sampling—purely deterministic
- No external decayer support
- Thread-safe: each thread gets its own process instance
- User must ensure energy-momentum conservation in pre-assigned products
