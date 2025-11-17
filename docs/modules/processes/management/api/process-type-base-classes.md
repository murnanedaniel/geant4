# Process Type Base Classes API Reference

## Overview

Geant4 provides six specialized base classes for implementing physics processes, each designed for different patterns of particle interactions. These classes inherit from `G4VProcess` and implement specific combinations of the three fundamental interaction types:

- **AtRest**: Processes that occur when a particle is at rest (e.g., decay, annihilation)
- **AlongStep**: Continuous processes that occur during transport (e.g., energy loss, multiple scattering)
- **PostStep**: Discrete processes that occur at interaction points (e.g., Compton scattering, photoelectric effect)

The six base classes represent all meaningful combinations of these interaction types:

| Base Class | AtRest | AlongStep | PostStep | Typical Use Case |
|-----------|--------|-----------|----------|------------------|
| `G4VDiscreteProcess` | - | - | ✓ | Discrete scattering interactions |
| `G4VContinuousProcess` | - | ✓ | - | Continuous energy loss |
| `G4VRestProcess` | ✓ | - | - | Decay and annihilation at rest |
| `G4VRestContinuousProcess` | ✓ | ✓ | - | Rare: Rest + continuous |
| `G4VRestDiscreteProcess` | ✓ | - | ✓ | Rest + discrete interactions |
| `G4VRestContinuousDiscreteProcess` | ✓ | ✓ | ✓ | Complete process description |

---

## Choosing the Right Base Class

### Decision Tree

```
Start: What type of interaction does your process model?

├─ Does it happen when the particle is AT REST?
│  ├─ YES
│  │  ├─ Does it ALSO happen while moving?
│  │  │  ├─ Is the moving interaction CONTINUOUS?
│  │  │  │  ├─ YES → Does it ALSO have DISCRETE interactions?
│  │  │  │  │  ├─ YES → G4VRestContinuousDiscreteProcess
│  │  │  │  │  └─ NO  → G4VRestContinuousProcess
│  │  │  │  └─ NO (only discrete)
│  │  │  │     └─ → G4VRestDiscreteProcess
│  │  │  └─ NO (only at rest)
│  │  │     └─ → G4VRestProcess
│  │  └─ NO
│  │     └─ → G4VRestProcess
│  └─ NO
│     ├─ Is it a CONTINUOUS process (happens along the entire step)?
│     │  └─ YES → G4VContinuousProcess
│     └─ Is it a DISCRETE process (happens at specific points)?
│        └─ YES → G4VDiscreteProcess
```

### Quick Reference

**Choose G4VDiscreteProcess if:**
- Your process occurs at discrete interaction points
- Examples: Compton scattering, photoelectric effect, bremsstrahlung

**Choose G4VContinuousProcess if:**
- Your process acts continuously along the particle's path
- Examples: Cerenkov radiation, transition radiation (rare usage)

**Choose G4VRestProcess if:**
- Your process only occurs when the particle is at rest
- Examples: particle decay, positron annihilation at rest

**Choose G4VRestDiscreteProcess if:**
- Your process can occur both at rest AND at discrete points while moving
- Examples: muon decay (at rest or in flight), some exotic particle processes

**Choose G4VRestContinuousProcess if:**
- Your process occurs at rest AND continuously while moving (very rare)
- Examples: mostly theoretical; rarely used in practice

**Choose G4VRestContinuousDiscreteProcess if:**
- Your process has all three interaction types
- Examples: scintillation (at rest + along step + post step components)

---

## G4VDiscreteProcess

### Class Description

**File:** `/home/user/geant4/source/processes/management/include/G4VDiscreteProcess.hh`

`G4VDiscreteProcess` defines the behavior of discrete physics interactions that occur at specific points along a particle's trajectory, based on a mean free path calculation.

### Active Methods (Lines 57-66)

Methods that **must be implemented** by derived classes:

```cpp
// Pure virtual - MUST implement
virtual G4double GetMeanFreePath(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4ForceCondition* condition) = 0;  // Line 110-112
```

Methods with **default implementations** that can be overridden:

```cpp
// Default implementation provided - MAY override
virtual G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition);  // Lines 57-61

virtual G4VParticleChange* PostStepDoIt(
    const G4Track&,
    const G4Step&);  // Lines 63-66
```

### Inactive Methods (Lines 70-106)

These methods are **disabled** and return default values:

```cpp
// Always returns -1.0 (disabled)
virtual G4double AlongStepGetPhysicalInteractionLength(...) { return -1.0; }  // Lines 70-76
virtual G4double AtRestGetPhysicalInteractionLength(...) { return -1.0; }    // Lines 78-81

// Always returns nullptr or 0.0 (disabled)
virtual G4VParticleChange* AtRestDoIt(...) { return nullptr; }     // Lines 85-88
virtual G4VParticleChange* AlongStepDoIt(...) { return nullptr; }  // Lines 90-93
virtual G4double GetCrossSection(...) { return 0.0; }              // Lines 97-100
virtual G4double MinPrimaryEnergy(...) { return 0.0; }             // Lines 103-106
```

### Pure Virtual Methods to Implement

```cpp
// Calculate the mean free path for this process
virtual G4double GetMeanFreePath(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4ForceCondition* condition) = 0;
```

**Parameters:**
- `aTrack`: Current track information
- `previousStepSize`: Length of the previous step
- `condition`: Set to specify if process is forced, conditional, etc.

**Returns:** Mean free path in length units

### Typical Implementation Pattern

```cpp
class MyDiscreteProcess : public G4VDiscreteProcess
{
public:
    MyDiscreteProcess(const G4String& name = "MyProcess")
        : G4VDiscreteProcess(name, fElectromagnetic)
    {}

    virtual ~MyDiscreteProcess() {}

    // MUST implement: Calculate mean free path
    virtual G4double GetMeanFreePath(
        const G4Track& aTrack,
        G4double previousStepSize,
        G4ForceCondition* condition) override
    {
        const G4Material* material = aTrack.GetMaterial();
        G4double kineticEnergy = aTrack.GetKineticEnergy();

        // Get cross section from your physics model
        G4double crossSection = CalculateCrossSection(kineticEnergy, material);

        if (crossSection <= 0.0) {
            return DBL_MAX;  // Infinite mean free path
        }

        // Mean free path = 1 / (n * sigma)
        // where n is number density, sigma is cross section
        G4double meanFreePath = 1.0 / (material->GetTotNbOfAtomsPerVolume() * crossSection);

        return meanFreePath;
    }

    // SHOULD implement: Perform the actual interaction
    virtual G4VParticleChange* PostStepDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        // Your physics interaction here
        // - Sample scattering angles
        // - Create secondaries
        // - Update primary particle

        return &aParticleChange;
    }

private:
    G4ParticleChange aParticleChange;
};
```

### When to Use

**Use G4VDiscreteProcess when:**
- Your process occurs at discrete interaction points
- The interaction probability is described by a cross section
- The process can be characterized by a mean free path
- The particle state changes instantaneously at the interaction point

**Don't use if:**
- The process acts continuously (use `G4VContinuousProcess`)
- The process only happens at rest (use `G4VRestProcess`)
- You need both discrete and continuous components (use combined classes)

### Real-World Examples from Geant4

1. **G4ComptonScattering** (Compton scattering of photons)
   - File: `source/processes/electromagnetic/standard/include/G4ComptonScattering.hh`
   - Discrete photon-electron scattering interaction

2. **G4PhotoElectricEffect** (Photoelectric absorption)
   - File: `source/processes/electromagnetic/standard/include/G4PhotoElectricEffect.hh`
   - Discrete photon absorption with electron emission

3. **G4GammaConversion** (Pair production)
   - File: `source/processes/electromagnetic/standard/include/G4GammaConversion.hh`
   - Discrete photon conversion to e+e- pair

4. **G4HadronElasticProcess** (Hadronic elastic scattering)
   - File: `source/processes/hadronic/management/include/G4HadronElasticProcess.hh`
   - Discrete hadron-nucleus elastic scattering

### Best Practices

1. **Mean Free Path Calculation**
   - Return `DBL_MAX` when the process cannot occur (zero cross section)
   - Account for material composition correctly
   - Consider energy thresholds

2. **Cross Section Tables**
   - Pre-calculate and cache cross sections for efficiency
   - Use G4PhysicsTable for energy-dependent data
   - Initialize tables in `BuildPhysicsTable()`

3. **PostStepDoIt Implementation**
   - Always initialize `aParticleChange` with the track
   - Conserve energy and momentum
   - Set proper track status (alive, kill, suspend, etc.)
   - Create secondaries with proper kinematic distributions

4. **Applicability**
   - Override `IsApplicable()` to restrict to specific particles
   - Check particle type in constructor

### Common Mistakes to Avoid

1. **Returning negative or zero mean free path**
   - Always return positive value or `DBL_MAX`
   - Negative values cause tracking errors

2. **Not handling zero cross sections**
   - Check for zero/negative cross sections
   - Return `DBL_MAX` when process cannot occur

3. **Forgetting to initialize ParticleChange**
   - Always call `aParticleChange.Initialize(aTrack)` first
   - Failure causes incorrect particle updates

4. **Incorrect secondary particle handling**
   - Set proper time, position, polarization
   - Add secondaries to the ParticleChange
   - Don't create secondaries below production threshold

5. **Not setting force condition properly**
   - Use `NotForced` for normal physics
   - Use `Forced` only when required by biasing

---

## G4VContinuousProcess

### Class Description

**File:** `/home/user/geant4/source/processes/management/include/G4VContinuousProcess.hh`

`G4VContinuousProcess` defines the behavior of continuous physics interactions that act along the entire particle trajectory, limiting the step size and modifying particle properties continuously.

### Active Methods (Lines 57-68)

Methods that **must be implemented** by derived classes:

```cpp
// Pure virtual - MUST implement
virtual G4double GetContinuousStepLimit(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& currentSafety) = 0;  // Lines 97-100
```

Methods with **default implementations** that can be overridden:

```cpp
// Default implementation provided - MAY override
virtual G4double AlongStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& proposedSafety,
    G4GPILSelection* selection);  // Lines 57-63

virtual G4VParticleChange* AlongStepDoIt(
    const G4Track&,
    const G4Step&);  // Lines 65-68
```

### Inactive Methods (Lines 72-93)

These methods are **disabled** and return default values:

```cpp
// Always returns -1.0 (disabled)
virtual G4double PostStepGetPhysicalInteractionLength(...) { return -1.0; }  // Lines 72-76
virtual G4double AtRestGetPhysicalInteractionLength(...) { return -1.0; }    // Lines 78-81

// Always returns 0 (disabled)
virtual G4VParticleChange* AtRestDoIt(...) { return 0; }    // Lines 85-88
virtual G4VParticleChange* PostStepDoIt(...) { return 0; }  // Lines 90-93
```

### Pure Virtual Methods to Implement

```cpp
// Calculate the maximum step size this process allows
virtual G4double GetContinuousStepLimit(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& currentSafety) = 0;
```

**Parameters:**
- `aTrack`: Current track information
- `previousStepSize`: Length of the previous step
- `currentMinimumStep`: Current minimum step proposed by other processes
- `currentSafety`: Distance to nearest geometry boundary (can be updated)

**Returns:** Maximum step length this process allows

### Protected Helper Methods (Lines 104-108)

```cpp
inline void SetGPILSelection(G4GPILSelection selection)
    { valueGPILSelection = selection; }  // Lines 104-105

inline G4GPILSelection GetGPILSelection() const
    { return valueGPILSelection; }  // Lines 107-108
```

### Typical Implementation Pattern

```cpp
class MyContinuousProcess : public G4VContinuousProcess
{
public:
    MyContinuousProcess(const G4String& name = "MyProcess")
        : G4VContinuousProcess(name, fElectromagnetic)
    {}

    virtual ~MyContinuousProcess() {}

    // MUST implement: Calculate step limit
    virtual G4double GetContinuousStepLimit(
        const G4Track& aTrack,
        G4double previousStepSize,
        G4double currentMinimumStep,
        G4double& currentSafety) override
    {
        G4double kineticEnergy = aTrack.GetKineticEnergy();
        const G4Material* material = aTrack.GetMaterial();

        // Calculate characteristic length for this process
        // e.g., radiation length, mean free path for small angle scattering
        G4double characteristicLength = CalculateCharacteristicLength(
            kineticEnergy, material);

        // Limit step to some fraction of characteristic length
        G4double stepLimit = 0.1 * characteristicLength;

        // Use CandidateForSelection when this is a normal limiting process
        SetGPILSelection(CandidateForSelection);

        return stepLimit;
    }

    // SHOULD implement: Apply continuous effects
    virtual G4VParticleChange* AlongStepDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        G4double stepLength = aStep.GetStepLength();

        // Apply continuous changes:
        // - Energy loss
        // - Direction change (multiple scattering)
        // - Other continuous effects

        G4double energyLoss = CalculateEnergyLoss(aTrack, stepLength);
        aParticleChange.ProposeEnergy(aTrack.GetKineticEnergy() - energyLoss);

        return &aParticleChange;
    }

    // SHOULD implement: Specify which particles this applies to
    virtual G4bool IsApplicable(const G4ParticleDefinition& particle) override
    {
        return (particle.GetPDGCharge() != 0.0);  // Only charged particles
    }

private:
    G4ParticleChange aParticleChange;
};
```

### When to Use

**Use G4VContinuousProcess when:**
- Your process acts continuously along the particle trajectory
- The process limits the step size based on physics constraints
- Effects accumulate smoothly over the step length
- You need to modify particle properties continuously

**Don't use if:**
- The process occurs at discrete points (use `G4VDiscreteProcess`)
- The process only happens at rest (use `G4VRestProcess`)
- You need both continuous and discrete components (use combined classes)

**Note:** `G4VContinuousProcess` is rarely used alone in modern Geant4. Most continuous processes like ionization are combined with discrete processes and use `G4VContinuousDiscreteProcess` or `G4VEnergyLossProcess` instead.

### Real-World Examples from Geant4

1. **G4Cerenkov** (Cerenkov radiation)
   - File: `source/processes/optical/include/G4Cerenkov.hh`
   - Continuous emission of Cerenkov photons
   - Note: Often uses a discrete process wrapper for practical implementation

2. **G4TransitionRadiation** (Transition radiation at boundaries)
   - File: `source/processes/electromagnetic/xrays/include/G4TransitionRadiation.hh`
   - Continuous tracking through interfaces
   - Actually implemented as discrete in practice

**Important:** Pure continuous processes are rare. Most "continuous" physics (like energy loss) actually use `G4VContinuousDiscreteProcess` or specialized classes like `G4VEnergyLossProcess` to combine continuous energy loss with discrete interactions.

### Best Practices

1. **Step Limitation**
   - Don't return steps that are too small (causes performance issues)
   - Don't return steps that are too large (causes accuracy issues)
   - Typical: limit to ~10% of characteristic length
   - Consider previous step size for stability

2. **GPIL Selection**
   - Use `CandidateForSelection` for normal processes
   - Use `NotCandidateForSelection` when not limiting step
   - Set properly in `GetContinuousStepLimit()`

3. **AlongStepDoIt Efficiency**
   - This is called every step - must be fast
   - Cache material-dependent quantities
   - Use physics tables where possible

4. **Safety Distance**
   - Update `currentSafety` if you compute a better value
   - Use safety to avoid geometry queries when possible
   - Don't trust safety beyond current step

5. **Energy Loss**
   - Ensure energy doesn't go negative
   - Consider range limitations
   - Handle particles near rest properly

### Common Mistakes to Avoid

1. **Returning very small step limits**
   - Causes excessive number of steps
   - Severely impacts performance
   - Use reasonable fraction of characteristic length

2. **Not setting GPIL selection**
   - Causes incorrect process selection
   - May lead to steps not being limited properly
   - Always set via `SetGPILSelection()`

3. **Ignoring currentMinimumStep**
   - Should consider the current proposed step
   - Helps maintain step stability
   - Prevents oscillations

4. **Not handling low energy correctly**
   - Check for near-zero kinetic energy
   - Handle range straggling
   - Avoid division by zero in energy-dependent calculations

5. **Continuous energy loss without range limitation**
   - Can cause particles to go below zero energy
   - Must check range vs. step length
   - Use `G4VEnergyLossProcess` for proper handling

6. **Forgetting material dependencies**
   - Step limits must account for material properties
   - Update when material changes
   - Cache material-dependent values properly

---

## G4VRestProcess

### Class Description

**File:** `/home/user/geant4/source/processes/management/include/G4VRestProcess.hh`

`G4VRestProcess` defines the behavior of physics interactions that occur only when a particle is at rest, such as particle decay or positron annihilation.

### Active Methods (Lines 57-65)

Methods that **must be implemented** by derived classes:

```cpp
// Pure virtual - MUST implement
virtual G4double GetMeanLifeTime(
    const G4Track& aTrack,
    G4ForceCondition* condition) = 0;  // Lines 97-98
```

Methods with **default implementations** that can be overridden:

```cpp
// Default implementation provided - MAY override
virtual G4double AtRestGetPhysicalInteractionLength(
    const G4Track& track,
    G4ForceCondition* condition);  // Lines 57-60

virtual G4VParticleChange* AtRestDoIt(
    const G4Track&,
    const G4Step&);  // Lines 62-65
```

### Inactive Methods (Lines 67-93)

These methods are **disabled** and return default values:

```cpp
// Always returns -1.0 (disabled)
virtual G4double AlongStepGetPhysicalInteractionLength(...) { return -1.0; }  // Lines 67-73
virtual G4double PostStepGetPhysicalInteractionLength(...) { return -1.0; }   // Lines 76-80

// Always returns 0 (disabled)
virtual G4VParticleChange* PostStepDoIt(...) { return 0; }    // Lines 83-86
virtual G4VParticleChange* AlongStepDoIt(...) { return 0; }   // Lines 89-92
```

### Pure Virtual Methods to Implement

```cpp
// Calculate the mean lifetime for this process
virtual G4double GetMeanLifeTime(
    const G4Track& aTrack,
    G4ForceCondition* condition) = 0;
```

**Parameters:**
- `aTrack`: Current track information (particle at rest)
- `condition`: Set to specify if process is forced, conditional, etc.

**Returns:** Mean lifetime in time units (or converted from probability)

**Description (Lines 99-103):**
Calculates the mean life-time (for decays) of the particle at rest due to the occurrence of the given process, or converts the probability of interaction (for annihilation) into the life-time of the particle.

### Typical Implementation Pattern

```cpp
class MyRestProcess : public G4VRestProcess
{
public:
    MyRestProcess(const G4String& name = "MyRestProcess")
        : G4VRestProcess(name, fDecay)
    {}

    virtual ~MyRestProcess() {}

    // MUST implement: Calculate mean lifetime
    virtual G4double GetMeanLifeTime(
        const G4Track& aTrack,
        G4ForceCondition* condition) override
    {
        // For decay: return particle's proper lifetime
        const G4ParticleDefinition* particle = aTrack.GetDefinition();
        G4double lifetime = particle->GetPDGLifeTime();

        // Can apply conditions
        *condition = NotForced;

        // For processes with branching ratios
        // lifetime = proper_lifetime / branching_ratio

        return lifetime;
    }

    // SHOULD implement: Perform the at-rest interaction
    virtual G4VParticleChange* AtRestDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        // Kill the primary particle (it decayed/annihilated)
        aParticleChange.ProposeTrackStatus(fStopAndKill);

        // Create decay/annihilation products
        std::vector<G4DynamicParticle*> secondaries = GenerateSecondaries(aTrack);

        for (auto* secondary : secondaries) {
            aParticleChange.AddSecondary(secondary);
        }

        // All energy/momentum in secondaries
        aParticleChange.ProposeLocalEnergyDeposit(0.0);

        return &aParticleChange;
    }

    // SHOULD implement: Specify which particles this applies to
    virtual G4bool IsApplicable(const G4ParticleDefinition& particle) override
    {
        // e.g., only for mu- particles
        return (particle.GetParticleName() == "mu-");
    }

private:
    G4ParticleChange aParticleChange;
};
```

### When to Use

**Use G4VRestProcess when:**
- Your process only occurs when the particle is at rest
- The interaction time is characterized by a lifetime
- The process terminates the particle (decay, annihilation)
- Examples: particle decay, positron annihilation at rest

**Don't use if:**
- The process occurs while the particle is moving (use discrete or combined classes)
- You need continuous effects (use continuous or combined classes)
- The process needs both at-rest and in-flight components (use `G4VRestDiscreteProcess`)

### Real-World Examples from Geant4

1. **G4Decay** (Particle decay at rest and in flight)
   - File: `source/processes/decay/include/G4Decay.hh`
   - Actually uses `G4VRestDiscreteProcess` to handle both at-rest and in-flight decay
   - AtRest component handles stopped particle decay

2. **G4eplusAnnihilation** (Positron annihilation)
   - File: `source/processes/electromagnetic/standard/include/G4eplusAnnihilation.hh`
   - Uses `G4VEmProcess` which handles at-rest annihilation
   - Primarily occurs at rest for low-energy positrons

3. **G4MuonMinusAtomicCapture** (Muon capture at rest)
   - File: `source/processes/hadronic/stopping/include/G4MuonMinusAtomicCapture.hh`
   - Implements mu- capture by nucleus
   - Pure at-rest process

### Best Practices

1. **Lifetime Calculation**
   - Return proper lifetime in Geant4 time units
   - For branching ratios: `lifetime = proper_lifetime / branching_ratio`
   - Return `DBL_MAX` if process cannot occur
   - Consider atomic binding effects if relevant

2. **Force Condition**
   - Usually set to `NotForced`
   - Use `Forced` only for variance reduction
   - Set in `GetMeanLifeTime()`

3. **Secondary Generation**
   - Always conserve energy-momentum
   - Set proper secondary positions (at rest position)
   - Set proper secondary times (including decay time)
   - Sample decay channels according to branching ratios

4. **Track Status**
   - Usually `fStopAndKill` for decay/annihilation
   - Could be `fSuspend` for special cases
   - Never leave as `fAlive` if particle is consumed

5. **Particle Applicability**
   - Override `IsApplicable()` to select specific particles
   - Check particle properties (charge, mass, type)
   - Return false for particles that can't undergo this process

### Common Mistakes to Avoid

1. **Not killing the primary particle**
   - Must set track status to `fStopAndKill` for decay/annihilation
   - Otherwise particle continues to exist after process

2. **Incorrect energy-momentum conservation**
   - Sum of secondary energies must equal primary rest mass energy
   - Account for binding energies if relevant
   - Momentum must be conserved (usually zero at rest)

3. **Wrong time for secondaries**
   - Secondaries should have time = primary time + decay time
   - Use proper time, not global time
   - Consider time dilation for moving particles (if using combined class)

4. **Returning negative or zero lifetime**
   - Always return positive value or `DBL_MAX`
   - Zero lifetime causes immediate process invocation
   - Negative values cause errors

5. **Not considering branching ratios**
   - If process is one of several decay modes, adjust lifetime
   - Sample decay channel in `AtRestDoIt()`
   - Ensure sum of branching ratios ≤ 1

6. **Incorrect secondary particle position**
   - Secondaries should be created at the particle's rest position
   - Don't propagate position backward
   - Use `aTrack.GetPosition()`

---

## G4VRestContinuousProcess

### Class Description

**File:** `/home/user/geant4/source/processes/management/include/G4VRestContinuousProcess.hh`

`G4VRestContinuousProcess` defines the behavior of physics interactions that combine at-rest and continuous (along-step) components. This is a relatively rare combination in Geant4.

### Active Methods (Lines 57-78)

Methods that **must be implemented** by derived classes:

```cpp
// Pure virtual - MUST implement
virtual G4double GetContinuousStepLimit(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& currentSafety) = 0;  // Lines 95-98

virtual G4double GetMeanLifeTime(
    const G4Track& aTrack,
    G4ForceCondition* condition) = 0;  // Lines 102-103
```

Methods with **default implementations** that can be overridden:

```cpp
// Default implementation provided - MAY override
virtual G4double AtRestGetPhysicalInteractionLength(
    const G4Track&,
    G4ForceCondition*);  // Lines 57-60

virtual G4VParticleChange* AtRestDoIt(
    const G4Track&,
    const G4Step&);  // Lines 62-65

virtual G4double AlongStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& currentSafety,
    G4GPILSelection* selection);  // Lines 67-73

virtual G4VParticleChange* AlongStepDoIt(
    const G4Track&,
    const G4Step&);  // Lines 75-78
```

### Inactive Methods (Lines 80-91)

These methods are **disabled** and return default values:

```cpp
// Always returns -1.0 (disabled)
virtual G4double PostStepGetPhysicalInteractionLength(...) { return -1.0; }  // Lines 80-84

// Always returns 0 (disabled)
virtual G4VParticleChange* PostStepDoIt(...) { return 0; }  // Lines 87-90
```

### Pure Virtual Methods to Implement

```cpp
// Calculate the maximum step size this process allows
virtual G4double GetContinuousStepLimit(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& currentSafety) = 0;

// Calculate the mean lifetime for the at-rest process
virtual G4double GetMeanLifeTime(
    const G4Track& aTrack,
    G4ForceCondition* condition) = 0;
```

### Protected Helper Methods (Lines 109-113)

```cpp
inline void SetGPILSelection(G4GPILSelection selection)
    { valueGPILSelection = selection; }  // Lines 109-110

inline G4GPILSelection GetGPILSelection() const
    { return valueGPILSelection; }  // Lines 112-113
```

### Typical Implementation Pattern

```cpp
class MyRestContinuousProcess : public G4VRestContinuousProcess
{
public:
    MyRestContinuousProcess(const G4String& name = "MyRestContinuousProcess")
        : G4VRestContinuousProcess(name, fUserDefined)
    {}

    virtual ~MyRestContinuousProcess() {}

    // MUST implement: Step limit for continuous part
    virtual G4double GetContinuousStepLimit(
        const G4Track& aTrack,
        G4double previousStepSize,
        G4double currentMinimumStep,
        G4double& currentSafety) override
    {
        G4double stepLimit = CalculateStepLimit(aTrack);
        SetGPILSelection(CandidateForSelection);
        return stepLimit;
    }

    // MUST implement: Lifetime for at-rest part
    virtual G4double GetMeanLifeTime(
        const G4Track& aTrack,
        G4ForceCondition* condition) override
    {
        *condition = NotForced;
        return CalculateLifetime(aTrack);
    }

    // SHOULD implement: Continuous effects during transport
    virtual G4VParticleChange* AlongStepDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        // Apply continuous changes during transport
        G4double stepLength = aStep.GetStepLength();
        ApplyContinuousEffects(aTrack, stepLength, aParticleChange);

        return &aParticleChange;
    }

    // SHOULD implement: At-rest interaction
    virtual G4VParticleChange* AtRestDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        // Perform at-rest interaction
        PerformAtRestInteraction(aTrack, aParticleChange);

        return &aParticleChange;
    }

private:
    G4ParticleChange aParticleChange;
};
```

### When to Use

**Use G4VRestContinuousProcess when:**
- Your process has both at-rest and continuous components
- The same physical phenomenon occurs both at rest and during transport
- You need to limit step size continuously AND handle at-rest interactions

**Don't use if:**
- You only need at-rest (use `G4VRestProcess`)
- You only need continuous (use `G4VContinuousProcess`)
- You need discrete interactions (use `G4VRestDiscreteProcess` or `G4VRestContinuousDiscreteProcess`)

**Note:** This is a rare combination. Most processes are either purely at-rest or combine discrete and continuous components.

### Real-World Examples from Geant4

This combination is **very rarely used** in practice. Most processes that might seem to fit this pattern actually use other base classes:

- Processes with continuous energy loss and decay use `G4VRestContinuousDiscreteProcess` or separate processes
- Optical processes use discrete or specialized base classes
- Most at-rest processes don't need continuous components

If you think you need this class, consider:
1. Can you split into separate `G4VRestProcess` + `G4VContinuousProcess`?
2. Do you actually need discrete interactions? (Use `G4VRestContinuousDiscreteProcess`)
3. Is there a specialized base class that better fits your needs?

### Best Practices

1. **Consistent Physics**
   - Ensure at-rest and continuous parts represent the same physics
   - Handle transition smoothly as particle slows down
   - Avoid double-counting effects

2. **Step Limitation**
   - Continuous step limit should account for changing conditions
   - Consider proximity to rest
   - Set GPIL selection appropriately

3. **Lifetime vs. Cross Section**
   - At-rest lifetime should be physical
   - Don't use artificial lifetimes to trigger continuous behavior
   - Keep physics models consistent

4. **Performance**
   - Both AlongStepDoIt and AtRestDoIt are called
   - Keep both implementations efficient
   - Consider if separate processes would be clearer

### Common Mistakes to Avoid

1. **Using this class when not needed**
   - Most cases can use simpler combinations
   - Consider splitting into separate processes
   - Check if discrete component is needed instead

2. **Inconsistent physics between at-rest and continuous**
   - Ensure both parts model the same phenomenon correctly
   - Handle transition as particle slows down
   - Avoid artificial separation

3. **Not setting GPIL selection**
   - Continuous part must set selection properly
   - Usually `CandidateForSelection`
   - Failure causes incorrect step limitation

4. **Competing with other processes**
   - If multiple continuous processes compete, step can become very small
   - Coordinate with other processes
   - Use reasonable step limits

---

## G4VRestDiscreteProcess

### Class Description

**File:** `/home/user/geant4/source/processes/management/include/G4VRestDiscreteProcess.hh`

`G4VRestDiscreteProcess` defines the behavior of physics interactions that can occur both when a particle is at rest and at discrete points while moving. This is commonly used for particle decay, which can happen both at rest and in flight.

### Active Methods (Lines 57-76)

Methods that **must be implemented** by derived classes:

```cpp
// Pure virtual - MUST implement
virtual G4double GetMeanFreePath(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4ForceCondition* condition) = 0;  // Lines 95-97

virtual G4double GetMeanLifeTime(
    const G4Track& aTrack,
    G4ForceCondition* condition) = 0;  // Lines 101-102
```

Methods with **default implementations** that can be overridden:

```cpp
// Default implementation provided - MAY override
virtual G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition);  // Lines 57-61

virtual G4VParticleChange* PostStepDoIt(
    const G4Track&,
    const G4Step&);  // Lines 63-66

virtual G4double AtRestGetPhysicalInteractionLength(
    const G4Track&,
    G4ForceCondition*);  // Lines 68-71

virtual G4VParticleChange* AtRestDoIt(
    const G4Track&,
    const G4Step&);  // Lines 73-76
```

### Inactive Methods (Lines 78-91)

These methods are **disabled** and return default values:

```cpp
// Always returns -1.0 (disabled)
virtual G4double AlongStepGetPhysicalInteractionLength(...) { return -1.0; }  // Lines 78-84

// Always returns 0 (disabled)
virtual G4VParticleChange* AlongStepDoIt(...) { return 0; }  // Lines 87-90
```

### Pure Virtual Methods to Implement

```cpp
// Calculate the mean free path for in-flight interactions
virtual G4double GetMeanFreePath(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4ForceCondition* condition) = 0;

// Calculate the mean lifetime for at-rest interactions
virtual G4double GetMeanLifeTime(
    const G4Track& aTrack,
    G4ForceCondition* condition) = 0;
```

**Description (Lines 98-107):**
- `GetMeanFreePath`: Calculates from the macroscopic cross-section a mean free path, the value is returned in units of distance
- `GetMeanLifeTime`: Calculates the mean life-time (for decays) of the particle at rest due to the occurrence of the given process, or converts the probability of interaction (for annihilation) into the life-time of the particle

### Typical Implementation Pattern

```cpp
class MyRestDiscreteProcess : public G4VRestDiscreteProcess
{
public:
    MyRestDiscreteProcess(const G4String& name = "MyRestDiscreteProcess")
        : G4VRestDiscreteProcess(name, fDecay)
    {}

    virtual ~MyRestDiscreteProcess() {}

    // MUST implement: Mean free path for in-flight interactions
    virtual G4double GetMeanFreePath(
        const G4Track& aTrack,
        G4double previousStepSize,
        G4ForceCondition* condition) override
    {
        const G4DynamicParticle* particle = aTrack.GetDynamicParticle();
        G4double properLifetime = particle->GetDefinition()->GetPDGLifeTime();

        if (properLifetime < 0.0) {
            return DBL_MAX;  // Stable particle
        }

        // Convert lifetime to mean free path using relativity
        // MFP = c * tau * gamma * beta
        G4double gamma = particle->GetTotalEnergy() / particle->GetMass();
        G4double beta = particle->GetBeta();
        G4double meanFreePath = CLHEP::c_light * properLifetime * gamma * beta;

        *condition = NotForced;
        return meanFreePath;
    }

    // MUST implement: Lifetime for at-rest interactions
    virtual G4double GetMeanLifeTime(
        const G4Track& aTrack,
        G4ForceCondition* condition) override
    {
        G4double properLifetime = aTrack.GetDefinition()->GetPDGLifeTime();

        if (properLifetime < 0.0) {
            return DBL_MAX;  // Stable particle
        }

        *condition = NotForced;
        return properLifetime;
    }

    // SHOULD implement: In-flight interaction
    virtual G4VParticleChange* PostStepDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        // Decay in flight
        aParticleChange.ProposeTrackStatus(fStopAndKill);

        // Generate decay products (boost from rest frame)
        std::vector<G4DynamicParticle*> secondaries =
            GenerateDecayProducts(aTrack);

        for (auto* secondary : secondaries) {
            aParticleChange.AddSecondary(secondary);
        }

        return &aParticleChange;
    }

    // SHOULD implement: At-rest interaction
    virtual G4VParticleChange* AtRestDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        // Decay at rest
        aParticleChange.ProposeTrackStatus(fStopAndKill);

        // Generate decay products (no boost needed)
        std::vector<G4DynamicParticle*> secondaries =
            GenerateDecayProductsAtRest(aTrack);

        for (auto* secondary : secondaries) {
            aParticleChange.AddSecondary(secondary);
        }

        return &aParticleChange;
    }

    // SHOULD implement: Specify which particles this applies to
    virtual G4bool IsApplicable(const G4ParticleDefinition& particle) override
    {
        // Apply to particles with finite lifetime
        return (particle.GetPDGLifeTime() > 0.0);
    }

private:
    G4ParticleChange aParticleChange;
};
```

### When to Use

**Use G4VRestDiscreteProcess when:**
- Your process can occur both at rest and in flight as discrete events
- The physics is similar for both cases (e.g., decay)
- You need mean free path for in-flight and lifetime for at-rest
- Examples: particle decay, exotic particle annihilation

**Don't use if:**
- Process only occurs at rest (use `G4VRestProcess`)
- Process only occurs in flight (use `G4VDiscreteProcess`)
- You need continuous components (use `G4VRestContinuousDiscreteProcess`)

### Real-World Examples from Geant4

1. **G4Decay** (Universal particle decay)
   - File: `source/processes/decay/include/G4Decay.hh`
   - Handles decay both at rest and in flight
   - Uses relativistic time dilation for in-flight decay
   - Most common use of this base class

2. **G4RadioactiveDecay** (Radioactive decay of ions)
   - File: `source/processes/hadronic/models/radioactive_decay/include/G4RadioactiveDecay.hh`
   - Implements nuclear decay chains
   - Can occur at rest or in flight
   - Uses decay tables and branching ratios

### Best Practices

1. **Relativistic Transformations**
   - For in-flight: Use gamma and beta factors correctly
   - Mean free path: `mfp = c * tau * gamma * beta`
   - Boost decay products correctly in PostStepDoIt
   - At rest: Use proper lifetime directly

2. **Consistent Physics**
   - AtRestDoIt and PostStepDoIt should implement the same decay physics
   - Only difference is Lorentz boost for PostStepDoIt
   - Use same decay channels and branching ratios
   - Sample in rest frame, then boost if needed

3. **Time and Position**
   - Secondaries inherit parent's time (plus decay time)
   - In-flight: decay happens along the step
   - At-rest: decay happens at the stopping point
   - Proper time calculations are critical

4. **Force Conditions**
   - Usually `NotForced` for physical decay
   - Can use `Forced` for variance reduction (with care)
   - Be consistent between GetMeanFreePath and GetMeanLifeTime

5. **Branching Ratios**
   - Sample decay channel in DoIt methods
   - Adjust lifetime if modeling only one channel
   - Ensure branching ratios sum correctly

### Common Mistakes to Avoid

1. **Incorrect relativistic factors**
   - Must use gamma (time dilation) for in-flight decay
   - Must include beta (velocity) for mean free path
   - Formula: `mfp = c * tau * gamma * beta`, not `c * tau * gamma`

2. **Not boosting decay products**
   - PostStepDoIt products must be boosted to lab frame
   - AtRestDoIt products are already in lab frame
   - Use Lorentz transformations correctly

3. **Inconsistent decay channels**
   - AtRestDoIt and PostStepDoIt should use same physics
   - Don't use different branching ratios
   - Keep decay models consistent

4. **Wrong secondary times**
   - Include proper decay time
   - Account for time dilation in flight
   - Use global time for secondaries

5. **Forgetting stable particles**
   - Check for negative or infinite lifetime
   - Return `DBL_MAX` for stable particles
   - Don't try to decay stable particles

6. **Energy-momentum conservation errors**
   - Must conserve in lab frame, not rest frame
   - Boost correctly from rest frame to lab frame
   - Check conservation in PostStepDoIt

7. **Not handling stopped particles correctly**
   - Ensure AtRestDoIt is called when particle stops
   - Don't assume particle is always moving
   - Handle kinetic energy = 0 case

---

## G4VRestContinuousDiscreteProcess

### Class Description

**File:** `/home/user/geant4/source/processes/management/include/G4VRestContinuousDiscreteProcess.hh`

`G4VRestContinuousDiscreteProcess` is the most complete base class, supporting all three interaction types: at-rest, continuous (along-step), and discrete (post-step). This provides maximum flexibility for complex physics processes.

### Active Methods (Lines 57-89)

Methods that **must be implemented** by derived classes:

```cpp
// Pure virtual - MUST implement
virtual G4double GetMeanLifeTime(
    const G4Track& aTrack,
    G4ForceCondition* condition) = 0;  // Lines 93-94

virtual G4double GetContinuousStepLimit(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& currentSafety) = 0;  // Lines 101-104

virtual G4double GetMeanFreePath(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4ForceCondition* condition) = 0;  // Lines 106-108
```

Methods with **default implementations** that can be overridden:

```cpp
// Default implementation provided - MAY override
virtual G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition);  // Lines 57-61

virtual G4VParticleChange* PostStepDoIt(
    const G4Track&,
    const G4Step&);  // Lines 63-66

virtual G4double AlongStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& currentSafety,
    G4GPILSelection* selection);  // Lines 68-74

virtual G4VParticleChange* AlongStepDoIt(
    const G4Track&,
    const G4Step&);  // Lines 76-79

virtual G4double AtRestGetPhysicalInteractionLength(
    const G4Track&,
    G4ForceCondition*);  // Lines 81-84

virtual G4VParticleChange* AtRestDoIt(
    const G4Track&,
    const G4Step&);  // Lines 86-89
```

### No Inactive Methods

All six methods (three GPIL and three DoIt) are **active** in this class. This is the only process base class with no disabled methods.

### Pure Virtual Methods to Implement

```cpp
// Calculate the mean lifetime for at-rest interactions
virtual G4double GetMeanLifeTime(
    const G4Track& aTrack,
    G4ForceCondition* condition) = 0;

// Calculate the maximum step size for continuous effects
virtual G4double GetContinuousStepLimit(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& currentSafety) = 0;

// Calculate the mean free path for discrete interactions
virtual G4double GetMeanFreePath(
    const G4Track& aTrack,
    G4double previousStepSize,
    G4ForceCondition* condition) = 0;
```

### Protected Helper Methods (Lines 112-116)

```cpp
inline void SetGPILSelection(G4GPILSelection selection)
    { valueGPILSelection = selection; }  // Lines 112-113

inline G4GPILSelection GetGPILSelection() const
    { return valueGPILSelection; }  // Lines 115-116
```

### Typical Implementation Pattern

```cpp
class MyCompleteProcess : public G4VRestContinuousDiscreteProcess
{
public:
    MyCompleteProcess(const G4String& name = "MyCompleteProcess")
        : G4VRestContinuousDiscreteProcess(name, fElectromagnetic)
    {}

    virtual ~MyCompleteProcess() {}

    // MUST implement: Lifetime for at-rest
    virtual G4double GetMeanLifeTime(
        const G4Track& aTrack,
        G4ForceCondition* condition) override
    {
        *condition = NotForced;
        return CalculateAtRestLifetime(aTrack);
    }

    // MUST implement: Step limit for continuous part
    virtual G4double GetContinuousStepLimit(
        const G4Track& aTrack,
        G4double previousStepSize,
        G4double currentMinimumStep,
        G4double& currentSafety) override
    {
        G4double stepLimit = CalculateContinuousStepLimit(aTrack);
        SetGPILSelection(CandidateForSelection);
        return stepLimit;
    }

    // MUST implement: Mean free path for discrete part
    virtual G4double GetMeanFreePath(
        const G4Track& aTrack,
        G4double previousStepSize,
        G4ForceCondition* condition) override
    {
        *condition = NotForced;
        G4double crossSection = CalculateCrossSection(aTrack);

        if (crossSection <= 0.0) return DBL_MAX;

        const G4Material* material = aTrack.GetMaterial();
        G4double mfp = 1.0 / (material->GetTotNbOfAtomsPerVolume() * crossSection);
        return mfp;
    }

    // SHOULD implement: At-rest interaction
    virtual G4VParticleChange* AtRestDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        // Perform at-rest interaction
        // (e.g., annihilation, decay)
        PerformAtRestInteraction(aTrack, aParticleChange);

        return &aParticleChange;
    }

    // SHOULD implement: Continuous effects
    virtual G4VParticleChange* AlongStepDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        // Apply continuous effects
        // (e.g., energy loss, multiple scattering)
        G4double stepLength = aStep.GetStepLength();
        ApplyContinuousEffects(aTrack, stepLength, aParticleChange);

        return &aParticleChange;
    }

    // SHOULD implement: Discrete interaction
    virtual G4VParticleChange* PostStepDoIt(
        const G4Track& aTrack,
        const G4Step& aStep) override
    {
        aParticleChange.Initialize(aTrack);

        // Perform discrete interaction
        // (e.g., hard scattering, particle production)
        PerformDiscreteInteraction(aTrack, aParticleChange);

        return &aParticleChange;
    }

private:
    G4ParticleChange aParticleChange;
};
```

### When to Use

**Use G4VRestContinuousDiscreteProcess when:**
- Your process has all three components: at-rest, continuous, and discrete
- You need maximum flexibility
- The physics naturally combines these interaction types
- Example: scintillation (continuous emission + discrete photons + at-rest component)

**Don't use if:**
- You only need one or two interaction types (use simpler base classes)
- The components are independent (use separate processes instead)
- A specialized base class exists for your use case (e.g., `G4VEnergyLossProcess`)

### Real-World Examples from Geant4

1. **G4Scintillation** (Scintillation light production)
   - File: `source/processes/optical/include/G4Scintillation.hh`
   - Combines continuous and discrete photon emission
   - Can occur at rest for stopped particles
   - Most complete optical process

2. **G4OpWLS** (Wavelength shifting in optical materials)
   - File: `source/processes/optical/include/G4OpWLS.hh`
   - Wavelength-dependent absorption and re-emission
   - Combines multiple interaction types

**Note:** Even though this is the most complete base class, it's not the most commonly used. Most processes use simpler base classes or specialized variants like `G4VEnergyLossProcess` or `G4VEmProcess`.

### Best Practices

1. **Clear Separation of Physics**
   - Keep at-rest, continuous, and discrete physics clearly separated
   - Don't duplicate effects between DoIt methods
   - Each component should address distinct physics

2. **Consistent GPIL Implementations**
   - All three GPIL methods are active
   - Ensure they don't conflict
   - Return appropriate values for each type

3. **ParticleChange Management**
   - Can use single `G4ParticleChange` or specialized types
   - Initialize properly in each DoIt method
   - Be careful with state between calls

4. **Step Limitation Coordination**
   - Both AlongStepGPIL and PostStepGPIL can limit step
   - Set GPIL selection appropriately for continuous part
   - Ensure reasonable step sizes

5. **Performance Considerations**
   - All three GPIL methods are called every step
   - Keep calculations efficient
   - Cache expensive computations
   - Consider if simpler base class would suffice

### Common Mistakes to Avoid

1. **Using this class when not needed**
   - Only use if you truly need all three components
   - Simpler base classes are more efficient
   - Consider splitting into multiple simpler processes

2. **Conflicting step limitations**
   - AlongStep and PostStep both limit steps
   - Ensure they work together correctly
   - Very small steps indicate conflict

3. **Double-counting effects**
   - Don't apply same physics in multiple DoIt methods
   - Be clear which effect goes in which method
   - Careful with energy deposition

4. **Not initializing ParticleChange properly**
   - Must initialize in each DoIt method
   - State from previous calls can persist
   - Always call `Initialize(aTrack)` first

5. **Incorrect GPIL return values**
   - All three GPIL methods should return sensible values
   - -1.0 means "not applicable" but methods are active here
   - Return DBL_MAX if process cannot occur, not -1.0

6. **Performance overhead**
   - Three GPIL calls per step is expensive
   - Profile your code
   - Consider if you can use simpler base class
   - Cache material/energy-dependent values

7. **Complex logic in DoIt methods**
   - Keep each DoIt method focused
   - Don't try to handle all cases in one method
   - Use helper functions for shared code

---

## Comparison Table

### Active Methods by Process Type

| Method | Discrete | Continuous | Rest | Rest+Cont | Rest+Disc | Rest+Cont+Disc |
|--------|----------|------------|------|-----------|-----------|----------------|
| **AtRestGPIL** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **AtRestDoIt** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **AlongStepGPIL** | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **AlongStepDoIt** | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **PostStepGPIL** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **PostStepDoIt** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |

### Pure Virtual Methods by Process Type

| Process Type | Pure Virtual Methods |
|-------------|---------------------|
| **G4VDiscreteProcess** | `GetMeanFreePath` |
| **G4VContinuousProcess** | `GetContinuousStepLimit` |
| **G4VRestProcess** | `GetMeanLifeTime` |
| **G4VRestContinuousProcess** | `GetContinuousStepLimit`<br>`GetMeanLifeTime` |
| **G4VRestDiscreteProcess** | `GetMeanFreePath`<br>`GetMeanLifeTime` |
| **G4VRestContinuousDiscreteProcess** | `GetMeanLifeTime`<br>`GetContinuousStepLimit`<br>`GetMeanFreePath` |

### Return Values for Inactive Methods

| Return Type | Inactive Return Value |
|------------|----------------------|
| `G4double` (GPIL methods) | `-1.0` |
| `G4VParticleChange*` (DoIt methods) | `nullptr` or `0` |

---

## Common Patterns and Best Practices

### 1. Process Selection Strategy

**Start Simple:**
- Use the simplest base class that fits your physics
- Don't use combined classes unless necessary
- Consider splitting complex physics into multiple simple processes

**Ask These Questions:**
1. Does it happen at rest? → Consider Rest variants
2. Does it happen continuously? → Consider Continuous variants
3. Does it happen discretely? → Consider Discrete variants
4. Multiple types? → Use combined variant

### 2. Implementation Checklist

**For All Processes:**
- [ ] Override constructor with proper name and type
- [ ] Implement destructor if needed
- [ ] Override `IsApplicable()` to specify particles
- [ ] Initialize member variables properly
- [ ] Implement all pure virtual methods

**For GPIL Methods:**
- [ ] Return positive values or `DBL_MAX`
- [ ] Never return negative values (except inactive methods)
- [ ] Set force condition appropriately
- [ ] For continuous: set GPIL selection

**For DoIt Methods:**
- [ ] Always call `aParticleChange.Initialize(aTrack)` first
- [ ] Conserve energy and momentum
- [ ] Set proper track status
- [ ] Handle secondaries correctly (time, position, momentum)
- [ ] Set local energy deposit when appropriate

### 3. ParticleChange Patterns

**Basic Pattern:**
```cpp
virtual G4VParticleChange* SomeDoIt(const G4Track& aTrack, const G4Step& aStep)
{
    // 1. Initialize
    aParticleChange.Initialize(aTrack);

    // 2. Perform physics
    // ...

    // 3. Update primary particle
    aParticleChange.ProposeEnergy(newEnergy);
    aParticleChange.ProposeMomentumDirection(newDirection);

    // 4. Add secondaries if any
    aParticleChange.AddSecondary(secondary);

    // 5. Set track status if needed
    aParticleChange.ProposeTrackStatus(fAlive);  // or fStopAndKill, etc.

    // 6. Return
    return &aParticleChange;
}
```

**For Particle Termination:**
```cpp
aParticleChange.ProposeTrackStatus(fStopAndKill);
aParticleChange.ProposeEnergy(0.0);
```

**For Energy Deposition:**
```cpp
G4double energyDeposit = initialEnergy - finalEnergy - secondaryTotalEnergy;
aParticleChange.ProposeLocalEnergyDeposit(energyDeposit);
```

### 4. Cross Section and Mean Free Path

**Standard Pattern:**
```cpp
virtual G4double GetMeanFreePath(const G4Track& aTrack,
                                  G4double previousStepSize,
                                  G4ForceCondition* condition)
{
    const G4Material* material = aTrack.GetMaterial();
    G4double energy = aTrack.GetKineticEnergy();

    // Get cross section (in appropriate units)
    G4double crossSection = GetCrossSection(energy, material);

    if (crossSection <= 0.0) {
        return DBL_MAX;  // Process cannot occur
    }

    // Calculate mean free path
    G4double atomDensity = material->GetTotNbOfAtomsPerVolume();
    G4double mfp = 1.0 / (atomDensity * crossSection);

    *condition = NotForced;
    return mfp;
}
```

### 5. Step Limitation for Continuous Processes

**Standard Pattern:**
```cpp
virtual G4double GetContinuousStepLimit(const G4Track& aTrack,
                                         G4double previousStepSize,
                                         G4double currentMinimumStep,
                                         G4double& currentSafety)
{
    G4double energy = aTrack.GetKineticEnergy();
    const G4Material* material = aTrack.GetMaterial();

    // Calculate characteristic length
    G4double characteristicLength = CalculateCharacteristicLength(energy, material);

    // Limit to fraction of characteristic length
    // (typically 10-20% for accuracy)
    G4double stepLimit = 0.1 * characteristicLength;

    // Consider current minimum to avoid oscillations
    if (stepLimit > currentMinimumStep) {
        stepLimit = currentMinimumStep;
    }

    SetGPILSelection(CandidateForSelection);
    return stepLimit;
}
```

### 6. Relativistic Decay (Rest + Discrete)

**Standard Pattern:**
```cpp
// At rest
virtual G4double GetMeanLifeTime(const G4Track& aTrack,
                                  G4ForceCondition* condition)
{
    G4double tau = aTrack.GetDefinition()->GetPDGLifeTime();
    *condition = NotForced;
    return tau;  // Proper lifetime
}

// In flight
virtual G4double GetMeanFreePath(const G4Track& aTrack,
                                  G4double previousStepSize,
                                  G4ForceCondition* condition)
{
    G4double tau = aTrack.GetDefinition()->GetPDGLifeTime();

    const G4DynamicParticle* particle = aTrack.GetDynamicParticle();
    G4double gamma = particle->GetTotalEnergy() / particle->GetMass();
    G4double beta = particle->GetBeta();

    // Relativistic mean free path
    G4double mfp = CLHEP::c_light * tau * gamma * beta;

    *condition = NotForced;
    return mfp;
}
```

---

## Advanced Topics

### 1. Process Ordering and Dependencies

Processes are invoked in a specific order managed by `G4ProcessManager`. Understanding this order is crucial when implementing processes:

**Order of Invocation:**
1. All `AtRestGPIL` methods (for stopped particles)
2. All `AlongStepGPIL` methods (determines minimum step)
3. All `PostStepGPIL` methods (determines interaction point)
4. Selected `AlongStepDoIt` (applied to the step)
5. Selected `PostStepDoIt` (applied if discrete interaction occurs)
6. Selected `AtRestDoIt` (if particle is at rest)

**Implications:**
- AlongStepDoIt is **always** called (if process is active)
- PostStepDoIt is called only if this process wins the competition
- AtRestDoIt is called only for the selected at-rest process

### 2. Force Conditions

The `G4ForceCondition` enum controls how processes are selected:

```cpp
enum G4ForceCondition {
    NotForced,        // Normal physics-based selection
    Forced,           // Always invoked (for biasing)
    Conditionally,    // Invoked based on conditions
    ExclusivelyForced, // Exclusively forced (rare)
    StronglyForced    // Strongly forced (rare)
};
```

**Typical Usage:**
- Use `NotForced` for standard physics
- Use `Forced` for variance reduction biasing
- Rarely use other options (consult advanced documentation)

### 3. GPIL Selection

For continuous processes, the `G4GPILSelection` enum determines how the process participates in step limitation:

```cpp
enum G4GPILSelection {
    CandidateForSelection,     // Process proposes step limit
    NotCandidateForSelection   // Process doesn't limit step
};
```

**Usage:**
- Set via `SetGPILSelection()` in `GetContinuousStepLimit()`
- `CandidateForSelection`: process actively limits step
- `NotCandidateForSelection`: process observes but doesn't limit

### 4. Specialized Base Classes

For electromagnetic processes, Geant4 provides specialized base classes that handle many common patterns:

- **G4VEnergyLossProcess**: For ionization and energy loss
- **G4VEmProcess**: For electromagnetic discrete processes
- **G4VMultipleScattering**: For multiple scattering

**When to use specialized classes:**
- They provide additional infrastructure (tables, models, etc.)
- Better integration with EM physics framework
- Automatic handling of common patterns

**When to use basic process types:**
- Simple custom physics
- Non-EM processes
- Learning and prototyping
- Hadronic and optical processes

---

## Troubleshooting

### Common Error Messages and Solutions

**Error: "G4VProcess::PostStepGPIL() returned negative value"**
- **Cause:** Your GPIL method returned negative value
- **Solution:** Return `DBL_MAX` instead of -1.0 for inactive processes

**Error: "Track stuck or not progressing"**
- **Cause:** Step size becoming infinitesimally small
- **Solution:** Check continuous step limits, ensure minimum step size

**Error: "Energy not conserved"**
- **Cause:** DoIt method not conserving energy correctly
- **Solution:** Sum all secondary energies + energy deposit should equal initial energy

**Error: "Particle has negative energy"**
- **Cause:** Continuous energy loss exceeded particle energy
- **Solution:** Check range vs. step length, limit energy loss to available energy

### Debugging Checklist

1. **Process Not Being Invoked:**
   - [ ] Check `IsApplicable()` returns true for your particle
   - [ ] Verify process is registered with `G4ProcessManager`
   - [ ] Check process ordering
   - [ ] Verify GPIL returns reasonable values

2. **Incorrect Physics Results:**
   - [ ] Verify cross sections/mean free paths are correct
   - [ ] Check unit conversions
   - [ ] Verify material properties are accessed correctly
   - [ ] Check energy-momentum conservation

3. **Performance Issues:**
   - [ ] Check for very small step sizes
   - [ ] Profile GPIL methods (called every step)
   - [ ] Cache expensive calculations
   - [ ] Consider using physics tables

4. **Crashes:**
   - [ ] Check for null pointers
   - [ ] Verify `ParticleChange` is initialized
   - [ ] Check array bounds
   - [ ] Verify secondary particles are valid

---

## References and Related Classes

### Parent Class
- **G4VProcess**: Base class for all processes
  - File: `/home/user/geant4/source/processes/management/include/G4VProcess.hh`
  - Documentation: `g4vprocess.md`

### Management Classes
- **G4ProcessManager**: Manages processes for each particle type
  - File: `/home/user/geant4/source/processes/management/include/G4ProcessManager.hh`
  - Documentation: `g4processmanager.md`

- **G4ProcessTable**: Global table of all processes
  - File: `/home/user/geant4/source/processes/management/include/G4ProcessTable.hh`
  - Documentation: `g4processtable.md`

### Specialized EM Base Classes
- **G4VEnergyLossProcess**: Energy loss processes
  - File: `/home/user/geant4/source/processes/electromagnetic/utils/include/G4VEnergyLossProcess.hh`

- **G4VEmProcess**: EM discrete processes
  - File: `/home/user/geant4/source/processes/electromagnetic/utils/include/G4VEmProcess.hh`

- **G4VMultipleScattering**: Multiple scattering
  - File: `/home/user/geant4/source/processes/electromagnetic/utils/include/G4VMultipleScattering.hh`

### Particle Change Classes
- **G4ParticleChange**: Standard particle change
  - File: `/home/user/geant4/source/track/include/G4ParticleChange.hh`

- **G4VParticleChange**: Base class for particle changes
  - File: `/home/user/geant4/source/track/include/G4VParticleChange.hh`

### Example Implementations
- **Electromagnetic:** `/home/user/geant4/source/processes/electromagnetic/`
- **Hadronic:** `/home/user/geant4/source/processes/hadronic/`
- **Decay:** `/home/user/geant4/source/processes/decay/`
- **Optical:** `/home/user/geant4/source/processes/optical/`

---

## Summary

The six process type base classes provide a flexible framework for implementing physics in Geant4:

1. **G4VDiscreteProcess**: For discrete scattering interactions
2. **G4VContinuousProcess**: For continuous effects (rarely used alone)
3. **G4VRestProcess**: For at-rest processes like decay
4. **G4VRestContinuousProcess**: Rest + continuous (very rare)
5. **G4VRestDiscreteProcess**: Rest + discrete (e.g., decay in flight)
6. **G4VRestContinuousDiscreteProcess**: All three types (maximum flexibility)

**Key Principles:**
- Choose the simplest base class that fits your physics
- Implement only the required pure virtual methods
- Initialize ParticleChange properly in DoIt methods
- Return sensible values from GPIL methods
- Conserve energy and momentum
- Set appropriate force conditions and GPIL selections

**For More Information:**
- Geant4 User's Guide: Chapter on Physics Processes
- Application Developer's Guide: Implementing Custom Processes
- Examples in `/home/user/geant4/source/processes/`
- Related documentation in this directory

---

*Last Updated: 2025-11-17*
*Geant4 Version: Development*
