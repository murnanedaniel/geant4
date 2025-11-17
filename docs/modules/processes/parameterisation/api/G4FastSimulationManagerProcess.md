# G4FastSimulationManagerProcess

## Overview

`G4FastSimulationManagerProcess` is the `G4VProcess` subclass that serves as the interface between Geant4 tracking and the fast simulation framework. It acts as a wrapper process that queries fast simulation managers, triggers parameterization when conditions are met, and communicates results back to the tracking system. This process must be added to particle process managers to enable fast simulation.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`
**Source:** `source/processes/parameterisation/src/G4FastSimulationManagerProcess.cc`
**Base Class:** `G4VProcess`
**Process Type:** `fParameterisation`
:::

## Purpose

This process:
- **Integrates fast simulation with tracking**: Acts as standard `G4VProcess`
- **Queries managers**: Checks if parameterization should trigger
- **Controls step size**: Limits steps to envelope boundaries in parallel geometry
- **Invokes models**: Executes fast simulation when triggered
- **Supports parallel geometry**: Can operate in mass or parallel worlds
- **Handles both modes**: PostStep (in-flight) and AtRest parameterization

## Class Definition

**Lines 75-148** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
class G4FastSimulationManagerProcess : public G4VProcess
{
  public:
    // Constructors
    G4FastSimulationManagerProcess(
        const G4String& processName = "G4FastSimulationManagerProcess",
        G4ProcessType theType = fParameterisation);

    G4FastSimulationManagerProcess(
        const G4String& processName,
        const G4String& worldVolumeName,
        G4ProcessType theType = fParameterisation);

    G4FastSimulationManagerProcess(
        const G4String& processName,
        G4VPhysicalVolume* worldVolume,
        G4ProcessType theType = fParameterisation);

    ~G4FastSimulationManagerProcess() override;

    // User access
    G4VPhysicalVolume* GetWorldVolume() const;
    void SetWorldVolume(G4String worldName);
    void SetWorldVolume(G4VPhysicalVolume* worldVolume);

    // Process interface - tracking lifecycle
    void StartTracking(G4Track* track) override;
    void EndTracking() override;

    // PostStep interface
    G4double PostStepGetPhysicalInteractionLength(
        const G4Track& track,
        G4double previousStepSize,
        G4ForceCondition* condition) override;

    G4VParticleChange* PostStepDoIt(
        const G4Track& track,
        const G4Step& step) override;

    // AlongStep interface (for parallel geometry)
    G4double AlongStepGetPhysicalInteractionLength(
        const G4Track& track,
        G4double previousStepSize,
        G4double currentMinimumStep,
        G4double& proposedSafety,
        G4GPILSelection* selection) override;

    G4VParticleChange* AlongStepDoIt(
        const G4Track& track,
        const G4Step& step) override;

    // AtRest interface
    G4double AtRestGetPhysicalInteractionLength(
        const G4Track& track,
        G4ForceCondition* condition) override;

    G4VParticleChange* AtRestDoIt(
        const G4Track& track,
        const G4Step& step) override;

  private:
    G4VPhysicalVolume* fWorldVolume;
    G4bool fIsTrackingTime;
    G4bool fIsFirstStep;
    G4Navigator* fGhostNavigator;
    G4int fGhostNavigatorIndex;
    G4bool fIsGhostGeometry;
    G4double fGhostSafety;
    G4FieldTrack fFieldTrack;
    G4FastSimulationManager* fFastSimulationManager;
    G4bool fFastSimulationTrigger;
    G4VParticleChange fDummyParticleChange;
    G4PathFinder* fPathFinder;
    G4TransportationManager* fTransportationManager;
};
```

## Constructors

### Mass Geometry Constructor

**Lines 78-80** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
G4FastSimulationManagerProcess(
    const G4String& processName = "G4FastSimulationManagerProcess",
    G4ProcessType theType = fParameterisation);
```

**Purpose**: Create process for fast simulation in the **mass geometry** (normal world).

**Parameters**:
- `processName`: Process identifier (default is fine)
- `theType`: Process category (default `fParameterisation`)

**Usage**:
```cpp
// Simple constructor - mass geometry
G4FastSimulationManagerProcess* fastSimProcess =
    new G4FastSimulationManagerProcess();

// Add to process manager
G4ProcessManager* pManager = particle->GetProcessManager();
pManager->AddDiscreteProcess(fastSimProcess);
```

### Parallel Geometry Constructors

**Lines 82-89** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
// By world name
G4FastSimulationManagerProcess(
    const G4String& processName,
    const G4String& worldVolumeName,
    G4ProcessType theType = fParameterisation);

// By world volume pointer
G4FastSimulationManagerProcess(
    const G4String& processName,
    G4VPhysicalVolume* worldVolume,
    G4ProcessType theType = fParameterisation);
```

**Purpose**: Create process for fast simulation in a **parallel (ghost) geometry**.

**Parameters**:
- `processName`: Process identifier
- `worldVolumeName` or `worldVolume`: Parallel world specification
- `theType`: Process category

**Usage**:
```cpp
// For parallel world
G4FastSimulationManagerProcess* fastSimProcess =
    new G4FastSimulationManagerProcess(
        "FastSimProcess",
        "FastSimWorld"  // Name of parallel world
    );

// Add to process manager
pManager->AddDiscreteProcess(fastSimProcess);
```

**Use Case**: Define simplified geometry for fast simulation without affecting mass geometry used for detailed tracking.

## World Volume Access

### GetWorldVolume

**Lines 95** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
G4VPhysicalVolume* GetWorldVolume() const;
```

**Purpose**: Returns the world volume this process operates in.

**Return**: World physical volume (mass world if not using parallel geometry)

### SetWorldVolume

**Lines 98-99** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
void SetWorldVolume(G4String worldName);
void SetWorldVolume(G4VPhysicalVolume* worldVolume);
```

**Purpose**: Change the world volume (rare - usually set in constructor).

## Process Integration

The process implements standard `G4VProcess` interface methods for integration with tracking.

### StartTracking

**Lines 106** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
void StartTracking(G4Track* track) override;
```

**Purpose**: Initialize process at start of each track.

**When Called**: Before tracking a new particle

**Internal Actions**:
- Set `fIsTrackingTime = true`
- Reset `fIsFirstStep = true`
- Initialize navigator if using parallel geometry
- Clear trigger flag

### EndTracking

**Lines 107** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
void EndTracking() override;
```

**Purpose**: Clean up at end of track.

**When Called**: After particle stops tracking

**Internal Actions**:
- Set `fIsTrackingTime = false`

## PostStep Methods (In-Flight Parameterization)

### PostStepGetPhysicalInteractionLength

**Lines 110-111** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition) override;
```

**Purpose**: Determine if fast simulation should trigger and return step limit.

**Internal Workflow**:
1. Locate current envelope/region
2. Get fast simulation manager for this region (if exists)
3. Query manager: `PostStepGetFastSimulationManagerTrigger(track)`
4. If trigger returns `true`:
   - Set `fFastSimulationTrigger = true`
   - Set `*condition = Forced` (force this process to happen)
   - Return 0.0 (trigger immediately)
5. Otherwise:
   - Set `fFastSimulationTrigger = false`
   - Return `DBL_MAX` (no fast simulation this step)

**Result**: Tracking uses shortest step among all processes.

### PostStepDoIt

**Lines 113** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
G4VParticleChange* PostStepDoIt(const G4Track& track,
                                 const G4Step& step) override;
```

**Purpose**: Execute the fast simulation parameterization.

**When Called**: At end of step if this process had shortest interaction length.

**Internal Workflow**:
1. Check `fFastSimulationTrigger` (should be true)
2. Get fast simulation manager for current region
3. Call `manager->InvokePostStepDoIt()`
4. Return the `G4VParticleChange*` (actually a `G4FastStep*`)

**Result**: Primary track modified/killed, secondaries created, energy deposited.

## AlongStep Methods (Parallel Geometry Navigation)

### AlongStepGetPhysicalInteractionLength

**Lines 116-120** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
G4double AlongStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& proposedSafety,
    G4GPILSelection* selection) override;
```

**Purpose**: When using parallel geometry, limit step size to ghost volume boundaries.

**Why Needed**: Ensure particle steps properly through parallel world to enter/exit envelopes.

**Return**: Distance to next parallel geometry boundary

::: tip Parallel Geometry Only
This method only does work when using parallel (ghost) geometry. For mass geometry, it returns `DBL_MAX`.
:::

### AlongStepDoIt

**Lines 120** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
G4VParticleChange* AlongStepDoIt(const G4Track& track,
                                  const G4Step& step) override;
```

**Purpose**: Update particle position in parallel geometry.

**When Called**: During the step if in parallel geometry mode.

**Return**: Dummy particle change (no modifications)

## AtRest Methods

### AtRestGetPhysicalInteractionLength

**Lines 123** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
G4double AtRestGetPhysicalInteractionLength(
    const G4Track& track,
    G4ForceCondition* condition) override;
```

**Purpose**: Check if at-rest parameterization should trigger.

**Usage**: Rare - most fast simulation is PostStep (in-flight).

**Example Use Case**: Parameterize stopped negative particle capture.

### AtRestDoIt

**Lines 125** in `source/processes/parameterisation/include/G4FastSimulationManagerProcess.hh`

```cpp
G4VParticleChange* AtRestDoIt(const G4Track& track,
                               const G4Step& step) override;
```

**Purpose**: Execute at-rest parameterization.

**When Called**: When particle stops and at-rest trigger was true.

## Setup in Physics List

The typical way to use this process is via `G4FastSimulationHelper`:

**Lines 52-56** in `source/processes/parameterisation/include/G4FastSimulationHelper.hh`

```cpp
// Static helper method
G4FastSimulationHelper::ActivateFastSimulation(
    G4ProcessManager* pmanager,
    G4String parallelGeometryName = "");
```

### Simple Setup (Mass Geometry)

```cpp
// In your physics list ConstructProcess() method
#include "G4FastSimulationHelper.hh"

void MyPhysicsList::ConstructProcess()
{
    // Standard physics first
    G4EmStandardPhysics::ConstructProcess();

    // Add fast simulation to electrons
    G4ProcessManager* pmElectron =
        G4Electron::Definition()->GetProcessManager();
    G4FastSimulationHelper::ActivateFastSimulation(pmElectron);

    // Add fast simulation to positrons
    G4ProcessManager* pmPositron =
        G4Positron::Definition()->GetProcessManager();
    G4FastSimulationHelper::ActivateFastSimulation(pmPositron);

    // Add fast simulation to photons
    G4ProcessManager* pmGamma =
        G4Gamma::Definition()->GetProcessManager();
    G4FastSimulationHelper::ActivateFastSimulation(pmGamma);
}
```

### Parallel Geometry Setup

```cpp
void MyPhysicsList::ConstructProcess()
{
    // Add fast simulation in parallel world
    G4ProcessManager* pmElectron =
        G4Electron::Definition()->GetProcessManager();

    G4FastSimulationHelper::ActivateFastSimulation(
        pmElectron,
        "FastSimWorld"  // Name of parallel world
    );

    // Repeat for other particles...
}
```

### Manual Setup (Advanced)

```cpp
void MyPhysicsList::ConstructProcess()
{
    // Create process manually
    G4FastSimulationManagerProcess* fastSimProcess =
        new G4FastSimulationManagerProcess("MyFastSim");

    // Add to electron
    G4ProcessManager* pmElectron =
        G4Electron::Definition()->GetProcessManager();

    // Important: Use correct ordering
    // ordAtRestDoIt, ordAlongStepDoIt, ordPostStepDoIt
    pmElectron->AddProcess(fastSimProcess, -1, 0, 0);

    // For discrete process only (no AlongStep):
    // pmElectron->AddDiscreteProcess(fastSimProcess);
}
```

::: warning Process Ordering
When adding manually, ensure proper ordering. The helper `ActivateFastSimulation` handles this automatically - **use the helper unless you have specific reasons not to**.
:::

## Complete Example

### Physics List with Fast Simulation

```cpp
// MyPhysicsList.hh
#ifndef MyPhysicsList_h
#define MyPhysicsList_h

#include "G4VUserPhysicsList.hh"

class MyPhysicsList : public G4VUserPhysicsList
{
public:
    MyPhysicsList();
    ~MyPhysicsList() override = default;

protected:
    void ConstructParticle() override;
    void ConstructProcess() override;
    void ConstructEM();
    void ConstructFastSimulation();
};

#endif

// MyPhysicsList.cc
#include "MyPhysicsList.hh"
#include "G4FastSimulationHelper.hh"
#include "G4Electron.hh"
#include "G4Positron.hh"
#include "G4Gamma.hh"
#include "G4EmStandardPhysics.hh"

void MyPhysicsList::ConstructProcess()
{
    // Add standard processes
    AddTransportation();
    ConstructEM();

    // Add fast simulation
    ConstructFastSimulation();
}

void MyPhysicsList::ConstructEM()
{
    // Standard EM physics
    G4EmStandardPhysics emPhysics;
    emPhysics.ConstructProcess();
}

void MyPhysicsList::ConstructFastSimulation()
{
    // Activate fast simulation for EM particles
    auto theParticleIterator = GetParticleIterator();
    theParticleIterator->reset();

    while ((*theParticleIterator)()) {
        G4ParticleDefinition* particle = theParticleIterator->value();
        G4ProcessManager* pmanager = particle->GetProcessManager();

        G4String particleName = particle->GetParticleName();

        // Add fast simulation to EM particles
        if (particleName == "e-" ||
            particleName == "e+" ||
            particleName == "gamma")
        {
            G4FastSimulationHelper::ActivateFastSimulation(pmanager);
        }
    }
}
```

### Modular Physics List Approach

```cpp
// MyFastSimPhysics.hh
#include "G4VPhysicsConstructor.hh"

class MyFastSimPhysics : public G4VPhysicsConstructor
{
public:
    MyFastSimPhysics(const G4String& name = "FastSimulation");
    ~MyFastSimPhysics() override = default;

    void ConstructParticle() override {}
    void ConstructProcess() override;
};

// MyFastSimPhysics.cc
#include "MyFastSimPhysics.hh"
#include "G4FastSimulationHelper.hh"
#include "G4Electron.hh"
#include "G4Positron.hh"
#include "G4Gamma.hh"

MyFastSimPhysics::MyFastSimPhysics(const G4String& name)
    : G4VPhysicsConstructor(name)
{
}

void MyFastSimPhysics::ConstructProcess()
{
    // Add to electrons
    G4FastSimulationHelper::ActivateFastSimulation(
        G4Electron::Definition()->GetProcessManager()
    );

    // Add to positrons
    G4FastSimulationHelper::ActivateFastSimulation(
        G4Positron::Definition()->GetProcessManager()
    );

    // Add to photons
    G4FastSimulationHelper::ActivateFastSimulation(
        G4Gamma::Definition()->GetProcessManager()
    );

    G4cout << "Fast simulation activated for e-, e+, gamma" << G4endl;
}

// In your main physics list:
void MyModularPhysicsList::ConstructProcess()
{
    // Add standard physics
    // ...

    // Add fast simulation physics
    RegisterPhysics(new MyFastSimPhysics());
}
```

## Debugging

### Verify Process is Added

```cpp
// Check if process is registered
void CheckFastSimProcess(const G4ParticleDefinition* particle)
{
    G4ProcessManager* pManager = particle->GetProcessManager();
    G4ProcessVector* processList = pManager->GetProcessList();

    G4cout << "Processes for " << particle->GetParticleName() << ":"
           << G4endl;

    for (G4int i = 0; i < processList->size(); ++i) {
        G4VProcess* process = (*processList)[i];
        G4cout << "  " << i << ": " << process->GetProcessName()
               << " (type: " << process->GetProcessType() << ")"
               << G4endl;

        // Check if it's fast simulation process
        G4FastSimulationManagerProcess* fsmProcess =
            dynamic_cast<G4FastSimulationManagerProcess*>(process);

        if (fsmProcess != nullptr) {
            G4cout << "     -> Fast simulation process!" << G4endl;
            G4VPhysicalVolume* world = fsmProcess->GetWorldVolume();
            G4cout << "        World: " << world->GetName() << G4endl;
        }
    }
}

// Usage
CheckFastSimProcess(G4Electron::Definition());
```

### Verbose Output

```cpp
// In your model or detector construction
void EnableFastSimVerbose()
{
    // Unfortunately, no built-in verbose mode
    // Add G4cout statements in your models' ModelTrigger and DoIt
}
```

## Common Issues

**Issue**: Fast simulation never triggers

**Solutions**:
1. Verify process is added to particle
   ```cpp
   CheckFastSimProcess(G4Electron::Definition());
   ```

2. Check envelope is defined
   ```cpp
   G4GlobalFastSimulationManager::GetGlobalFastSimulationManager()->ShowSetup();
   ```

3. Verify model is applicable
   ```cpp
   // In model
   G4cout << "IsApplicable called for: " << particle.GetParticleName() << G4endl;
   ```

4. Debug trigger conditions
   ```cpp
   // In model
   G4bool result = /* your logic */;
   G4cout << "ModelTrigger: " << (result ? "TRUE" : "FALSE") << G4endl;
   return result;
   ```

**Issue**: Process not added via helper

**Solution**: Ensure you call helper **after** AddTransportation and standard physics construction.

## Performance Notes

- Process invoked every step for applicable particles in/near envelopes
- `PostStepGPIL` is cheap when not triggering (returns `DBL_MAX`)
- Parallel geometry adds overhead for boundary navigation
- Consider using mass geometry when possible for best performance

## Related Classes

- [G4FastSimulationHelper](G4FastSimulationHelper.md) - Helper for adding this process
- [G4FastSimulationManager](G4FastSimulationManager.md) - Invoked by this process
- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Models executed by this process
- `G4VProcess` - Base class interface

## References

- Main overview: [Parameterisation Module](../index.md)
- History: Lines 36-47 in header (first implementation Aug 97)
- Example: `examples/extended/parameterisations/Par03/`
