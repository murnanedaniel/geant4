# G4FastSimulationHelper

## Overview

`G4FastSimulationHelper` is a static utility class that provides a simplified interface for adding fast simulation capability to particles. It encapsulates the complexity of creating and registering `G4FastSimulationManagerProcess` with the correct process ordering, making it easy to enable fast simulation in physics lists.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4FastSimulationHelper.hh`
**Source:** `source/processes/parameterisation/src/G4FastSimulationHelper.cc`
**Type:** Static Utility Class
:::

## Purpose

This helper class:
- **Simplifies setup**: Single method call to enable fast simulation
- **Correct ordering**: Handles process ordering automatically
- **Mass or parallel geometry**: Supports both geometry types
- **Physics list integration**: Easy to add to any physics list
- **Error prevention**: Avoids common process registration mistakes

## Class Definition

**Lines 50-57** in `source/processes/parameterisation/include/G4FastSimulationHelper.hh`

```cpp
class G4FastSimulationHelper
{
  public:
    // Activate fast simulation for particle
    static void ActivateFastSimulation(G4ProcessManager* pmanager,
                                        G4String parallelGeometryName = "");
};
```

## Main Method

### ActivateFastSimulation

**Lines 53-56** in `source/processes/parameterisation/include/G4FastSimulationHelper.hh`

```cpp
static void ActivateFastSimulation(G4ProcessManager* pmanager,
                                    G4String parallelGeometryName = "");
```

**Purpose**: Add `G4FastSimulationManagerProcess` to a particle's process manager with correct ordering.

**Parameters**:
- `pmanager`: Process manager for the particle (from `particle->GetProcessManager()`)
- `parallelGeometryName`: Name of parallel world (empty string = mass geometry)

**Behavior**:
- Creates `G4FastSimulationManagerProcess` instance
- Registers it with appropriate ordering:
  - `ordAtRestDoIt = 0`
  - `ordAlongStepDoIt = 0`
  - `ordPostStepDoIt = 0`
- Handles both mass geometry and parallel geometry

**Return**: void (no return value)

## Usage Examples

### Basic Setup (Mass Geometry)

```cpp
// In your physics list ConstructProcess() method
#include "G4FastSimulationHelper.hh"
#include "G4Electron.hh"
#include "G4Positron.hh"
#include "G4Gamma.hh"

void MyPhysicsList::ConstructProcess()
{
    // Standard physics first
    AddTransportation();
    G4EmStandardPhysics::ConstructProcess();

    // Enable fast simulation for electrons
    G4ProcessManager* pmElectron =
        G4Electron::Definition()->GetProcessManager();
    G4FastSimulationHelper::ActivateFastSimulation(pmElectron);

    // Enable for positrons
    G4ProcessManager* pmPositron =
        G4Positron::Definition()->GetProcessManager();
    G4FastSimulationHelper::ActivateFastSimulation(pmPositron);

    // Enable for photons
    G4ProcessManager* pmGamma =
        G4Gamma::Definition()->GetProcessManager();
    G4FastSimulationHelper::ActivateFastSimulation(pmGamma);
}
```

### Parallel Geometry Setup

```cpp
void MyPhysicsList::ConstructProcess()
{
    // Standard physics...
    AddTransportation();

    // Enable fast simulation in parallel world
    G4ProcessManager* pmElectron =
        G4Electron::Definition()->GetProcessManager();

    G4FastSimulationHelper::ActivateFastSimulation(
        pmElectron,
        "FastSimWorld"  // Name of your parallel world
    );

    // Repeat for other particles...
}
```

### Loop Over Multiple Particles

```cpp
void MyPhysicsList::ConstructProcess()
{
    // Standard physics...
    AddTransportation();
    ConstructEM();

    // List of particles for fast simulation
    std::vector<G4ParticleDefinition*> particles = {
        G4Electron::Definition(),
        G4Positron::Definition(),
        G4Gamma::Definition()
    };

    // Enable fast simulation for all
    for (auto* particle : particles) {
        G4ProcessManager* pManager = particle->GetProcessManager();
        G4FastSimulationHelper::ActivateFastSimulation(pManager);

        G4cout << "Fast simulation enabled for "
               << particle->GetParticleName() << G4endl;
    }
}
```

### Conditional Activation

```cpp
void MyPhysicsList::ConstructProcess()
{
    // Standard physics...
    AddTransportation();
    ConstructEM();

    // Enable fast simulation only if requested
    if (useFastSimulation) {
        G4FastSimulationHelper::ActivateFastSimulation(
            G4Electron::Definition()->GetProcessManager()
        );
        G4FastSimulationHelper::ActivateFastSimulation(
            G4Positron::Definition()->GetProcessManager()
        );
        G4FastSimulationHelper::ActivateFastSimulation(
            G4Gamma::Definition()->GetProcessManager()
        );

        G4cout << "Fast simulation ENABLED" << G4endl;
    } else {
        G4cout << "Fast simulation DISABLED" << G4endl;
    }
}
```

## Complete Physics List Examples

### Example 1: Simple Physics List

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
#include "G4EmStandardPhysics.hh"
#include "G4Electron.hh"
#include "G4Positron.hh"
#include "G4Gamma.hh"

MyPhysicsList::MyPhysicsList()
    : G4VUserPhysicsList()
{
    defaultCutValue = 1.0*mm;
}

void MyPhysicsList::ConstructParticle()
{
    // Construct minimal set
    G4BosonConstructor::ConstructParticle();
    G4LeptonConstructor::ConstructParticle();
}

void MyPhysicsList::ConstructProcess()
{
    AddTransportation();
    ConstructEM();
    ConstructFastSimulation();
}

void MyPhysicsList::ConstructEM()
{
    // Use standard EM physics
    G4EmStandardPhysics emPhysics;
    emPhysics.ConstructProcess();
}

void MyPhysicsList::ConstructFastSimulation()
{
    // Add fast simulation to EM particles
    G4FastSimulationHelper::ActivateFastSimulation(
        G4Electron::Definition()->GetProcessManager()
    );
    G4FastSimulationHelper::ActivateFastSimulation(
        G4Positron::Definition()->GetProcessManager()
    );
    G4FastSimulationHelper::ActivateFastSimulation(
        G4Gamma::Definition()->GetProcessManager()
    );

    G4cout << "Fast simulation activated for e-, e+, gamma" << G4endl;
}
```

### Example 2: Modular Physics Constructor

```cpp
// MyFastSimPhysics.hh
#ifndef MyFastSimPhysics_h
#define MyFastSimPhysics_h

#include "G4VPhysicsConstructor.hh"

class MyFastSimPhysics : public G4VPhysicsConstructor
{
public:
    MyFastSimPhysics(const G4String& name = "FastSimulation");
    ~MyFastSimPhysics() override = default;

    void ConstructParticle() override {}
    void ConstructProcess() override;
};

#endif

// MyFastSimPhysics.cc
#include "MyFastSimPhysics.hh"
#include "G4FastSimulationHelper.hh"
#include "G4Electron.hh"
#include "G4Positron.hh"
#include "G4Gamma.hh"
#include "G4ProcessManager.hh"

MyFastSimPhysics::MyFastSimPhysics(const G4String& name)
    : G4VPhysicsConstructor(name)
{
}

void MyFastSimPhysics::ConstructProcess()
{
    // Activate for electrons
    G4ProcessManager* pmElectron =
        G4Electron::Definition()->GetProcessManager();
    G4FastSimulationHelper::ActivateFastSimulation(pmElectron);

    // Activate for positrons
    G4ProcessManager* pmPositron =
        G4Positron::Definition()->GetProcessManager();
    G4FastSimulationHelper::ActivateFastSimulation(pmPositron);

    // Activate for photons
    G4ProcessManager* pmGamma =
        G4Gamma::Definition()->GetProcessManager();
    G4FastSimulationHelper::ActivateFastSimulation(pmGamma);

    if (verboseLevel > 0) {
        G4cout << GetPhysicsName() << ": Fast simulation activated"
               << G4endl;
    }
}
```

**Usage in main physics list**:
```cpp
#include "MyFastSimPhysics.hh"
#include "FTFP_BERT.hh"

// In main() or physics list constructor
G4VModularPhysicsList* physicsList = new FTFP_BERT;

// Add fast simulation physics
physicsList->RegisterPhysics(new MyFastSimPhysics());

runManager->SetUserInitialization(physicsList);
```

### Example 3: Iterator-Based Activation

```cpp
void MyPhysicsList::ConstructFastSimulation()
{
    // Activate for all charged leptons and photons
    auto theParticleIterator = GetParticleIterator();
    theParticleIterator->reset();

    while ((*theParticleIterator)()) {
        G4ParticleDefinition* particle = theParticleIterator->value();
        G4String particleName = particle->GetParticleName();
        G4ProcessManager* pManager = particle->GetProcessManager();

        // Check if particle should have fast simulation
        if (particleName == "e-" ||
            particleName == "e+" ||
            particleName == "gamma" ||
            particleName == "mu-" ||
            particleName == "mu+")
        {
            G4FastSimulationHelper::ActivateFastSimulation(pManager);

            if (verboseLevel > 0) {
                G4cout << "Fast sim enabled for: " << particleName << G4endl;
            }
        }
    }
}
```

## What the Helper Does Internally

The `ActivateFastSimulation` method performs these steps:

1. **Creates Process**:
   ```cpp
   G4FastSimulationManagerProcess* fastSimProcess;

   if (parallelGeometryName == "") {
       // Mass geometry
       fastSimProcess = new G4FastSimulationManagerProcess();
   } else {
       // Parallel geometry
       fastSimProcess = new G4FastSimulationManagerProcess(
           "FastSimManagerProc", parallelGeometryName);
   }
   ```

2. **Adds to Process Manager**:
   ```cpp
   // ordAtRestDoIt = 0, ordAlongStepDoIt = 0, ordPostStepDoIt = 0
   pmanager->AddProcess(fastSimProcess, 0, 0, 0);
   ```

**Process Ordering Explanation**:
- `ordAtRestDoIt = 0`: AtRest process (optional, rarely used)
- `ordAlongStepDoIt = 0`: AlongStep process (for parallel geometry navigation)
- `ordPostStepDoIt = 0`: PostStep process (main fast simulation trigger point)

## Manual Alternative (Not Recommended)

You can add the process manually without the helper, but this is more error-prone:

```cpp
// Without helper (more code, easier to make mistakes)
void MyPhysicsList::ConstructProcess()
{
    // ...standard physics...

    // Manual approach
    G4FastSimulationManagerProcess* fastSimProc =
        new G4FastSimulationManagerProcess();

    G4ProcessManager* pmElectron =
        G4Electron::Definition()->GetProcessManager();

    // Must get ordering right!
    pmElectron->AddProcess(fastSimProc, 0, 0, 0);
    // OR for discrete only:
    // pmElectron->AddDiscreteProcess(fastSimProc);

    // Repeat for other particles...
}
```

::: warning Use the Helper
Always use `G4FastSimulationHelper::ActivateFastSimulation()` instead of manually creating and adding the process. The helper ensures correct setup and is less error-prone.
:::

## Common Patterns

### Pattern 1: Configurable Fast Simulation

```cpp
class MyPhysicsList : public G4VUserPhysicsList
{
public:
    MyPhysicsList();

    void SetFastSimulation(G4bool flag) { fUseFastSim = flag; }

protected:
    void ConstructProcess() override;

private:
    G4bool fUseFastSim;
};

void MyPhysicsList::ConstructProcess()
{
    AddTransportation();
    ConstructEM();

    if (fUseFastSim) {
        // Enable fast simulation
        G4FastSimulationHelper::ActivateFastSimulation(
            G4Electron::Definition()->GetProcessManager()
        );
        G4FastSimulationHelper::ActivateFastSimulation(
            G4Positron::Definition()->GetProcessManager()
        );
        G4FastSimulationHelper::ActivateFastSimulation(
            G4Gamma::Definition()->GetProcessManager()
        );
    }
}

// In main()
MyPhysicsList* physicsList = new MyPhysicsList();
physicsList->SetFastSimulation(true);  // or false
```

### Pattern 2: Separate Messenger for Control

```cpp
class MyFastSimMessenger : public G4UImessenger
{
public:
    MyFastSimMessenger(MyPhysicsList* pl)
        : fPhysicsList(pl)
    {
        fFastSimCmd = new G4UIcmdWithABool("/physics/useFastSim", this);
        fFastSimCmd->SetGuidance("Enable/disable fast simulation");
        fFastSimCmd->SetParameterName("flag", true);
        fFastSimCmd->SetDefaultValue(true);
    }

    void SetNewValue(G4UIcommand* command, G4String value) override
    {
        if (command == fFastSimCmd) {
            fPhysicsList->SetFastSimulation(
                fFastSimCmd->GetNewBoolValue(value)
            );
        }
    }

private:
    MyPhysicsList* fPhysicsList;
    G4UIcmdWithABool* fFastSimCmd;
};
```

## Debugging

### Verify Process is Added

```cpp
void VerifyFastSimProcess(G4ParticleDefinition* particle)
{
    G4ProcessManager* pManager = particle->GetProcessManager();
    G4ProcessVector* processList = pManager->GetProcessList();

    G4bool found = false;
    for (G4int i = 0; i < processList->size(); ++i) {
        G4VProcess* process = (*processList)[i];

        if (dynamic_cast<G4FastSimulationManagerProcess*>(process)) {
            G4cout << "Fast sim process found for "
                   << particle->GetParticleName() << G4endl;
            found = true;
            break;
        }
    }

    if (!found) {
        G4cerr << "WARNING: No fast sim process for "
               << particle->GetParticleName() << G4endl;
    }
}

// In your initialization
VerifyFastSimProcess(G4Electron::Definition());
VerifyFastSimProcess(G4Positron::Definition());
VerifyFastSimProcess(G4Gamma::Definition());
```

## Best Practices

1. **Call after standard physics**: Ensure transportation and EM physics are constructed first

2. **Use helper, not manual**: Let the helper handle process ordering

3. **Be consistent**: Enable for all relevant particles (e-, e+, gamma at minimum)

4. **Check it worked**: Verify process was added during initialization

5. **Document choice**: Comment why certain particles have fast simulation enabled

## Common Issues

**Issue**: Fast simulation never triggers

**Solution**: Verify helper was called:
```cpp
// Add verbose output
G4cout << "Calling ActivateFastSimulation for electrons" << G4endl;
G4FastSimulationHelper::ActivateFastSimulation(
    G4Electron::Definition()->GetProcessManager()
);
G4cout << "Done" << G4endl;
```

**Issue**: Called too early

**Solution**: Ensure `ConstructProcess()` is called, not `ConstructParticle()`:
```cpp
// WRONG - too early
void MyPhysicsList::ConstructParticle()
{
    G4FastSimulationHelper::ActivateFastSimulation(...);  // NO!
}

// CORRECT
void MyPhysicsList::ConstructProcess()
{
    G4FastSimulationHelper::ActivateFastSimulation(...);  // YES!
}
```

**Issue**: Process manager is null

**Solution**: Ensure particles are constructed:
```cpp
void MyPhysicsList::ConstructProcess()
{
    G4ProcessManager* pm = G4Electron::Definition()->GetProcessManager();

    if (pm == nullptr) {
        G4cerr << "ERROR: Process manager is null!" << G4endl;
        G4cerr << "Did you call ConstructParticle()?" << G4endl;
        return;
    }

    G4FastSimulationHelper::ActivateFastSimulation(pm);
}
```

## Performance Notes

- Adding the process has negligible overhead (~microseconds at initialization)
- Process is only invoked in/near envelopes
- No performance cost if no fast simulation managers are defined
- Helper creates one process instance per particle type

## Related Classes

- [G4FastSimulationManagerProcess](G4FastSimulationManagerProcess.md) - Process created by this helper
- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Models used with this process
- [G4FastSimulationManager](G4FastSimulationManager.md) - Managers invoked by the process

## References

- Main overview: [Parameterisation Module](../index.md)
- History: Lines 37-39 in header (first implementation Nov 2016)
- Example: `examples/extended/parameterisations/Par03/`
