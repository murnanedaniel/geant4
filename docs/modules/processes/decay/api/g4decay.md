# G4Decay

**File**: `source/processes/decay/include/G4Decay.hh`

## Overview

G4Decay is the standard decay process class in Geant4, handling the decay of unstable particles both in-flight and at-rest. It inherits from G4VRestDiscreteProcess, enabling it to handle both discrete decay during particle propagation (PostStepDoIt) and decay of stopped particles (AtRestDoIt). The class manages decay tables, selects decay channels based on branching ratios, performs Lorentz transformations, and supports integration with external decay libraries.

## Class Description

G4Decay implements the complete decay process for all unstable particles in Geant4:

- **Dual Mode Operation**: Handles both in-flight decay (moving particles) and at-rest decay (stopped particles)
- **Decay Table Management**: Accesses particle decay tables and selects channels based on branching ratios
- **External Decayer Support**: Can delegate to external libraries (EvtGen, Pythia) for complex decays
- **Lorentz Transformations**: Boosts decay products from rest frame to laboratory frame
- **Pre-Assigned Decays**: Supports fixed decay products for testing and special applications
- **Daughter Polarization**: Provides hook for setting daughter particle spin states

The process calculates decay probabilities using particle lifetimes and handles the kinematics of creating daughter particles with proper four-momentum conservation.

**Inheritance**: G4VRestDiscreteProcess → G4VProcess

**Location**: `source/processes/decay/include/G4Decay.hh:62`

## Constructor & Destructor

### Constructor

```cpp
G4Decay(const G4String& processName = "Decay");
```

Creates a new decay process with the specified name.

**Parameters**:
- `processName`: Name of the process (default: "Decay")

**Implementation**: Lines 62-78 in `source/processes/decay/src/G4Decay.cc`

**Initialization**:
- Sets process type to `fDecay`
- Sets process sub-type to `DECAY` (201)
- Initializes verboseLevel to 1
- Sets fRemainderLifeTime to -1.0
- Initializes pExtDecayer to nullptr
- Assigns particle change object

**Location**: `source/processes/decay/include/G4Decay.hh:69`

### Destructor

```cpp
virtual ~G4Decay();
```

Virtual destructor that cleans up external decayer if present.

**Implementation**: Lines 80-85 in `source/processes/decay/src/G4Decay.cc`

```cpp
if (pExtDecayer != nullptr) {
    delete pExtDecayer;
}
```

**Location**: `source/processes/decay/include/G4Decay.hh:72`

## Core Process Methods

### IsApplicable

```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& aParticleType) override;
```

Determines if the decay process can be applied to a given particle type.

**Parameters**:
- `aParticleType`: Particle definition to check

**Returns**: `true` if particle is unstable and has positive mass, `false` otherwise

**Implementation**: Lines 87-97 in `source/processes/decay/src/G4Decay.cc`

Checks:
1. Particle has finite lifetime (PDGLifeTime >= 0)
2. Particle has positive mass (PDGMass > 0)

```cpp
if (aParticleType.GetPDGLifeTime() < 0.0) {
    return false;
} else if (aParticleType.GetPDGMass() <= 0.0*MeV) {
    return false;
} else {
    return true;
}
```

**Location**: `source/processes/decay/include/G4Decay.hh:104`

### BuildPhysicsTable

```cpp
virtual void BuildPhysicsTable(const G4ParticleDefinition&) override;
```

Builds physics tables for the process. For G4Decay, this is a no-op as decay tables are stored in particle definitions.

**Parameters**:
- Particle definition (unused)

**Implementation**: Lines 171-174 in `source/processes/decay/src/G4Decay.cc`

**Note**: Earlier versions (pre-2002) stored β√(1-β²) tables, but this was removed as decay uses particle-specific decay tables.

**Location**: `source/processes/decay/include/G4Decay.hh:97`

## DoIt Methods

### PostStepDoIt

```cpp
virtual G4VParticleChange* PostStepDoIt(
    const G4Track& aTrack,
    const G4Step& aStep
) override;
```

Handles decay in-flight (moving particles).

**Parameters**:
- `aTrack`: Current track being processed
- `aStep`: Step information

**Returns**: Particle change object with decay products

**Implementation**: Lines 503-515 in `source/processes/decay/src/G4Decay.cc`

**Behavior**:
- If particle is stopping or stopped: returns without action
- Otherwise: calls DecayIt() to perform decay

```cpp
if ((aTrack.GetTrackStatus() == fStopButAlive) ||
    (aTrack.GetTrackStatus() == fStopAndKill)) {
    fParticleChangeForDecay.Initialize(aTrack);
    return &fParticleChangeForDecay;
} else {
    return DecayIt(aTrack, aStep);
}
```

**Location**: `source/processes/decay/include/G4Decay.hh:87-90`

### AtRestDoIt

```cpp
virtual G4VParticleChange* AtRestDoIt(
    const G4Track& aTrack,
    const G4Step& aStep
) override;
```

Handles decay at rest (stopped particles).

**Parameters**:
- `aTrack`: Current track being processed
- `aStep`: Step information

**Returns**: Particle change object with decay products

**Implementation**: Lines 181-187 in `source/processes/decay/include/G4Decay.hh` (inline)

Simply calls DecayIt():

```cpp
return DecayIt(aTrack, aStep);
```

**Location**: `source/processes/decay/include/G4Decay.hh:92-95`

### DecayIt (Protected)

```cpp
protected:
virtual G4VParticleChange* DecayIt(
    const G4Track& aTrack,
    const G4Step& aStep
);
```

The main decay implementation called by both PostStepDoIt and AtRestDoIt.

**Parameters**:
- `aTrack`: Current track
- `aStep`: Current step

**Returns**: Particle change with daughter particles

**Implementation**: Lines 176-380 in `source/processes/decay/src/G4Decay.cc`

**Algorithm**:

1. **Initialize**: Set up particle change object
2. **Stability Check**: Return if particle is stable
3. **Decay Source Selection** (priority order):
   - Pre-assigned decay products (for testing/special cases)
   - External decayer (if set and no decay table)
   - Standard decay table (normal operation)
4. **Channel Selection**: Choose decay channel based on branching ratios and kinematics
5. **Decay Generation**: Call channel's DecayIt() to generate products
6. **Frame Transformation**: Boost products to lab frame if needed
7. **Polarization**: Set daughter polarizations via DaughterPolarization()
8. **Track Creation**: Create secondary tracks for daughter particles
9. **Parent Termination**: Kill parent track and deposit energy

**Key Code Sections**:

**Pre-assigned decay check** (lines 194-231):
```cpp
const G4DecayProducts* o_products = (aParticle->GetPreAssignedDecayProducts());
G4bool isPreAssigned = (o_products != nullptr);
```

**External decayer check** (lines 202-234):
```cpp
G4bool isExtDecayer = (decaytable == nullptr) && (pExtDecayer != nullptr);
if (isExtDecayer) {
    products = pExtDecayer->ImportDecayProducts(aTrack);
}
```

**Decay table selection** (lines 236-302):
```cpp
G4VDecayChannel* decaychannel = decaytable->SelectADecayChannel(massParent);
products = decaychannel->DecayIt(aParticle->GetMass());
```

**Lorentz boost** (lines 320-333):
```cpp
if (aTrack.GetTrackStatus() == fStopButAlive) {
    // AtRest case
    if (isPreAssigned) products->Boost(ParentEnergy, ParentDirection);
} else {
    // PostStep case
    if (!isExtDecayer) products->Boost(ParentEnergy, ParentDirection);
}
```

**Note**: External decayers handle boosting themselves, so no boost is applied for external decays in flight.

**Location**: `source/processes/decay/include/G4Decay.hh:109-112`

## GPIL Methods (Get Physical Interaction Length)

### PostStepGetPhysicalInteractionLength

```cpp
virtual G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition
) override;
```

Calculates the physical interaction length for in-flight decay.

**Parameters**:
- `track`: Current track
- `previousStepSize`: Length of previous step
- `condition`: Returns force condition (set to NotForced)

**Returns**: Physical interaction length (distance to decay)

**Implementation**: Lines 406-471 in `source/processes/decay/src/G4Decay.cc`

**Algorithm**:

For **normal decay** (no pre-assigned time):
1. Update number of interaction lengths left based on previous step
2. Get mean free path: `λ = GetMeanFreePath()`
3. Calculate distance: `PIL = NumberOfInteractionLengthsLeft × λ`
4. Update remainder lifetime: `fRemainderLifeTime = NumberOfInteractionLengthsLeft × τ`

For **pre-assigned decay time**:
1. Calculate remainder proper time: `Δτ = PreAssignedTime - ProperTime`
2. Convert to distance: `PIL = Δτ × c × (p/m)` accounting for time dilation

**Key formulas** (lines 442-469):
```cpp
// Normal case
if (currentInteractionLength < DBL_MAX) {
    value = theNumberOfInteractionLengthLeft * currentInteractionLength;
} else {
    value = DBL_MAX;
}

// Pre-assigned case
if (aLife > 0.0) {
    // Ordinary particle
    rvalue = (fRemainderLifeTime/aLife) * GetMeanFreePath(track, ...);
} else {
    // Short-lived particle
    rvalue = c_light * fRemainderLifeTime;
    rvalue *= track.GetDynamicParticle()->GetTotalMomentum()/aMass;
}
```

**Location**: `source/processes/decay/include/G4Decay.hh:127-131`

### AtRestGetPhysicalInteractionLength

```cpp
virtual G4double AtRestGetPhysicalInteractionLength(
    const G4Track& track,
    G4ForceCondition* condition
) override;
```

Calculates the interaction length (time) for at-rest decay.

**Parameters**:
- `track`: Current track
- `condition`: Returns force condition (set to NotForced)

**Returns**: Remainder lifetime (time to decay)

**Implementation**: Lines 473-490 in `source/processes/decay/src/G4Decay.cc`

**Algorithm**:

If **pre-assigned decay time** exists:
```cpp
fRemainderLifeTime = pTime - track.GetProperTime();
if (fRemainderLifeTime <= 0.0) fRemainderLifeTime = DBL_MIN;
```

Otherwise (normal case):
```cpp
fRemainderLifeTime = theNumberOfInteractionLengthLeft * GetMeanLifeTime(track, condition);
```

**Note**: For at-rest, no relativistic effects—uses proper lifetime directly.

**Location**: `source/processes/decay/include/G4Decay.hh:122-125`

### GetMeanFreePath (Protected)

```cpp
protected:
virtual G4double GetMeanFreePath(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4ForceCondition* condition
) override;
```

Returns the mean free path for decay in flight: `cτβγ`.

**Parameters**:
- `aTrack`: Current track
- `previousStepSize`: Previous step size (unused)
- `condition`: Force condition (unused)

**Returns**: Mean free path in GEANT4 internal units (mm)

**Implementation**: Lines 128-169 in `source/processes/decay/src/G4Decay.cc`

**Calculation**:

```cpp
G4double aLife = aParticleDef->GetPDGLifeTime();
G4double aCtau = c_light * aLife;  // cτ

// Stable particle
if (aParticleDef->GetPDGStable()) {
    pathlength = DBL_MAX;
}
// Very short lifetime
else if (aCtau < DBL_MIN) {
    pathlength = DBL_MIN;
}
// Normal case
else {
    // β = p/E, γ = E/m
    // Mean free path = cτ × βγ = cτ × (p/m)
    pathlength = (aParticle->GetTotalMomentum())/aMass * aCtau;
}
```

**Location**: `source/processes/decay/include/G4Decay.hh:136-139`

### GetMeanLifeTime (Protected)

```cpp
protected:
virtual G4double GetMeanLifeTime(
    const G4Track& aTrack,
    G4ForceCondition* condition
) override;
```

Returns the mean lifetime for decay at rest (proper lifetime τ).

**Parameters**:
- `aTrack`: Current track
- `condition`: Force condition (unused)

**Returns**: Mean lifetime in GEANT4 internal units (ns)

**Implementation**: Lines 99-126 in `source/processes/decay/src/G4Decay.cc`

**Calculation**:

```cpp
G4double aLife = aParticleDef->GetPDGLifeTime();

if (aParticleDef->GetPDGStable()) {
    // 1000000 times the life time of the universe
    meanlife = 1e24 * s;
} else {
    meanlife = aLife;
}
```

**Location**: `source/processes/decay/include/G4Decay.hh:141-143`

## Tracking Lifecycle

### StartTracking

```cpp
virtual void StartTracking(G4Track*) override;
```

Called at the start of tracking each particle.

**Parameters**:
- Pointer to track being started

**Implementation**: Lines 389-395 in `source/processes/decay/src/G4Decay.cc`

**Actions**:
```cpp
currentInteractionLength = -1.0;
ResetNumberOfInteractionLengthLeft();
fRemainderLifeTime = -1.0;
```

Resets process state for new track.

**Location**: `source/processes/decay/include/G4Decay.hh:146`

### EndTracking

```cpp
virtual void EndTracking() override;
```

Called at the end of tracking each particle.

**Implementation**: Lines 397-403 in `source/processes/decay/src/G4Decay.cc`

**Actions**:
```cpp
ClearNumberOfInteractionLengthLeft();
currentInteractionLength = -1.0;
```

Cleans up process state.

**Location**: `source/processes/decay/include/G4Decay.hh:147`

## External Decayer Management

### SetExtDecayer

```cpp
void SetExtDecayer(G4VExtDecayer* val);
```

Sets an external decayer for this process.

**Parameters**:
- `val`: Pointer to external decayer object

**Implementation**: Lines 493-501 in `source/processes/decay/src/G4Decay.cc`

```cpp
pExtDecayer = val;

// Set process sub-type to external
if (pExtDecayer != nullptr) {
    SetProcessSubType(static_cast<int>(DECAY_External));
}
```

**Note**: When an external decayer is set, the process sub-type changes to DECAY_External (231).

**Location**: `source/processes/decay/include/G4Decay.hh:151`

### GetExtDecayer

```cpp
const G4VExtDecayer* GetExtDecayer() const;
```

Returns the current external decayer.

**Returns**: Pointer to external decayer (nullptr if not set)

**Implementation**: Lines 191-194 in `source/processes/decay/include/G4Decay.hh` (inline)

```cpp
return pExtDecayer;
```

**Location**: `source/processes/decay/include/G4Decay.hh:152`

## Lifetime Information

### GetRemainderLifeTime

```cpp
G4double GetRemainderLifeTime() const;
```

Returns the remainder of lifetime for at-rest decay.

**Returns**: Remainder lifetime in GEANT4 units

**Implementation**: Lines 197-200 in `source/processes/decay/include/G4Decay.hh` (inline)

```cpp
return fRemainderLifeTime;
```

**Usage**: Useful for debugging and accessing remaining decay time during simulation.

**Location**: `source/processes/decay/include/G4Decay.hh:155`

## Polarization Handling

### DaughterPolarization (Protected)

```cpp
protected:
virtual void DaughterPolarization(
    const G4Track& aTrack,
    G4DecayProducts* products
);
```

Sets polarization for daughter particles. Base implementation is empty—override in derived classes.

**Parameters**:
- `aTrack`: Parent track
- `products`: Decay products to set polarization for

**Implementation**: Lines 382-385 in `source/processes/decay/src/G4Decay.cc`

```cpp
// empty implementation
```

**Override Examples**:
- `G4DecayWithSpin`: Sets polarization considering spin precession
- `G4PionDecayMakeSpin`: Sets muon polarization from pion decay

**Location**: `source/processes/decay/include/G4Decay.hh:118-119`

## Process Description

### ProcessDescription

```cpp
virtual void ProcessDescription(std::ostream& outFile) const override;
```

Writes process description to output stream.

**Parameters**:
- `outFile`: Output stream

**Implementation**: Lines 517-522 in `source/processes/decay/src/G4Decay.cc`

```cpp
outFile << GetProcessName() << ": Decay of particles. \n"
        << "kinematics of daughters are determined by DecayChannels "
        << " or by PreAssignedDecayProducts\n";
```

**Location**: `source/processes/decay/include/G4Decay.hh:158`

## Member Variables

### Protected Members

```cpp
protected:
G4int verboseLevel;
```

Controls output verbosity:
- 0: Silent
- 1: Warning messages
- 2: Detailed information

**Location**: `source/processes/decay/include/G4Decay.hh:162`

---

```cpp
G4double fRemainderLifeTime;
```

Remainder of lifetime for at-rest decay. Updated during GPIL calculations.

**Location**: `source/processes/decay/include/G4Decay.hh:171`

---

```cpp
G4ParticleChangeForDecay fParticleChangeForDecay;
```

Particle change object specialized for decay processes. Stores information about daughter particles and energy deposition.

**Location**: `source/processes/decay/include/G4Decay.hh:174`

---

```cpp
G4VExtDecayer* pExtDecayer;
```

Pointer to external decayer (nullptr if not used).

**Location**: `source/processes/decay/include/G4Decay.hh:177`

## Usage Example

### Basic Usage

```cpp
#include "G4Decay.hh"
#include "G4ProcessManager.hh"

// Create decay process
G4Decay* decay = new G4Decay("Decay");

// Set verbosity
decay->SetVerboseLevel(1);

// Get particle's process manager
G4ProcessManager* pManager = particle->GetProcessManager();

// Add decay process
pManager->AddProcess(decay);
pManager->SetProcessOrdering(decay, idxPostStep);
pManager->SetProcessOrdering(decay, idxAtRest);
```

### With External Decayer

```cpp
#include "G4Decay.hh"
#include "MyExtDecayer.hh"

// Create external decayer
MyExtDecayer* extDecayer = new MyExtDecayer();

// Create decay process
G4Decay* decay = new G4Decay("Decay");
decay->SetExtDecayer(extDecayer);

// Add to process manager
pManager->AddProcess(decay);
pManager->SetProcessOrdering(decay, idxPostStep);
pManager->SetProcessOrdering(decay, idxAtRest);
```

### Accessing Decay Information

```cpp
// In stepping action
const G4VProcess* process = step->GetPostStepPoint()->GetProcessDefinedStep();

if (process && process->GetProcessName() == "Decay") {
    const G4Decay* decay = dynamic_cast<const G4Decay*>(process);

    // Get remainder lifetime
    G4double remainder = decay->GetRemainderLifeTime();

    // Check for external decayer
    if (decay->GetExtDecayer()) {
        G4cout << "Using external decayer: "
               << decay->GetExtDecayer()->GetName() << G4endl;
    }
}
```

## Related Classes

- **[G4VRestDiscreteProcess](../../management/api/g4vprocess.md)**: Base class
- **[G4DecayWithSpin](./g4decaywithspin.md)**: Derived class with spin handling
- **[G4PionDecayMakeSpin](./g4piondecaymakespin.md)**: Derived class for pion decays
- **[G4VExtDecayer](./g4vextdecayer.md)**: External decayer interface
- **G4DecayTable**: Particle decay table (in particles module)
- **G4VDecayChannel**: Decay channel interface
- **G4ParticleChangeForDecay**: Decay-specific particle change

## Notes

- The process handles both in-flight and at-rest decay automatically
- External decayers are responsible for their own Lorentz transformations (no boost applied)
- Pre-assigned decay products are boosted only for at-rest case
- Decay tables are stored in particle definitions, not in the process
- The process is applicable to all particles with finite lifetime and positive mass
- Thread-safe: each thread gets its own process instance
