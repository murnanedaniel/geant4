# G4GlobalFastSimulationManager

## Overview

`G4GlobalFastSimulationManager` is a thread-local singleton class that serves as the global coordinator for all fast simulation managers and models across the entire geometry. It provides a centralized interface for querying, controlling, and displaying the complete fast simulation setup, including all envelopes, regions, and models.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`
**Source:** `source/processes/parameterisation/src/G4GlobalFastSimulationManager.cc`
**Pattern:** Thread-local Singleton
:::

## Purpose

`G4GlobalFastSimulationManager` provides:
- **Global registry**: Track all `G4FastSimulationManager` instances
- **Model search**: Find models by name across all envelopes
- **Global activation**: Enable/disable models throughout geometry
- **Setup display**: Show complete fast simulation configuration
- **Process management**: Track all `G4FastSimulationManagerProcess` instances
- **Global flush**: Clean up all models at once

## Singleton Access

**Lines 93, 96** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
static G4GlobalFastSimulationManager* GetGlobalFastSimulationManager();
static G4GlobalFastSimulationManager* GetInstance();  // Same as above
```

**Usage**:
```cpp
#include "G4GlobalFastSimulationManager.hh"

// Get singleton instance
G4GlobalFastSimulationManager* globalFSM =
    G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

// Use it...
globalFSM->ShowSetup();
```

::: warning Thread-Local
The singleton is thread-local, not global across all threads. Each worker thread has its own instance.
:::

## Model Search

### GetFastSimulationModel

**Lines 98-113** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
G4VFastSimulationModel* GetFastSimulationModel(
    const G4String& modelName,
    const G4VFastSimulationModel* previousFound = nullptr) const;
```

**Purpose**: Iteratively search for models by name across ALL envelopes.

**Parameters**:
- `modelName`: Model name to search for
- `previousFound`: Previous match in iteration (nullptr for first search)

**Return**: Next matching model, or nullptr if no more found

**Usage - Single Model**:
```cpp
G4GlobalFastSimulationManager* globalFSM =
    G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

// Find first (or only) model with this name
G4VFastSimulationModel* model =
    globalFSM->GetFastSimulationModel("EMShowerModel");

if (model != nullptr) {
    G4cout << "Found model: " << model->GetName() << G4endl;
} else {
    G4cerr << "Model not found!" << G4endl;
}
```

**Usage - Multiple Models with Same Name**:
```cpp
// Find all models named "EMShowerModel"
G4VFastSimulationModel* model = nullptr;

// Get first match
model = globalFSM->GetFastSimulationModel("EMShowerModel", nullptr);

while (model != nullptr) {
    G4cout << "Found model in envelope: "
           << /* get envelope info */ << G4endl;

    // Get next match
    model = globalFSM->GetFastSimulationModel("EMShowerModel", model);
}
```

**Example - Configure Model at Runtime**:
```cpp
void ConfigureModel(const G4String& modelName, G4double threshold)
{
    G4GlobalFastSimulationManager* globalFSM =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    // Find model (assuming derived type with setter)
    G4VFastSimulationModel* baseModel =
        globalFSM->GetFastSimulationModel(modelName);

    if (baseModel != nullptr) {
        MyEMShowerModel* model = dynamic_cast<MyEMShowerModel*>(baseModel);
        if (model != nullptr) {
            model->SetEnergyThreshold(threshold);
            G4cout << "Model configured successfully" << G4endl;
        }
    }
}
```

## Manager Registration

These methods are used internally when managers are created/destroyed:

**Lines 120-121** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
void AddFastSimulationManager(G4FastSimulationManager* manager);
void RemoveFastSimulationManager(G4FastSimulationManager* manager);
```

::: warning Internal Use Only
These are called automatically by `G4FastSimulationManager` constructor/destructor. Users should not call them directly.
:::

## Process Management

**Lines 124-126** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
void AddFSMP(G4FastSimulationManagerProcess* process);
void RemoveFSMP(G4FastSimulationManagerProcess* process);
```

**Purpose**: Track all fast simulation process instances (internal bookkeeping).

::: warning Internal Use Only
Called automatically by `G4FastSimulationManagerProcess`. Not for user code.
:::

## Global Control

### ActivateFastSimulationModel

**Lines 138** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
void ActivateFastSimulationModel(const G4String& modelName);
```

**Purpose**: Enable all models with the given name in ALL envelopes.

**Usage**:
```cpp
G4GlobalFastSimulationManager* globalFSM =
    G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

// Enable all EM shower models everywhere
globalFSM->ActivateFastSimulationModel("EMShowerModel");

G4cout << "EM parameterization activated globally" << G4endl;
```

### InActivateFastSimulationModel

**Lines 139** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
void InActivateFastSimulationModel(const G4String& modelName);
```

**Purpose**: Disable all models with the given name in ALL envelopes.

**Usage**:
```cpp
// Disable for validation run
globalFSM->InActivateFastSimulationModel("EMShowerModel");

// Run with detailed tracking...

// Re-enable
globalFSM->ActivateFastSimulationModel("EMShowerModel");
```

**Use Cases**:
- Validation: Compare fast sim vs detailed tracking
- Debugging: Isolate which model causes issues
- Conditional simulation: Energy-dependent activation
- A/B testing: Performance and accuracy studies

### Flush

**Lines 141** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
void Flush();
```

**Purpose**: Call `Flush()` on all models in all managers.

**When to Use**:
- End of event cleanup
- Before outputting statistics
- Flushing buffered hits

**Usage**:
```cpp
// In EndOfEventAction
void MyEventAction::EndOfEventAction(const G4Event* event)
{
    // Flush all fast simulation models
    G4GlobalFastSimulationManager* globalFSM =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    globalFSM->Flush();

    // Now safe to process accumulated data
}
```

## Display and Query Methods

### ShowSetup

**Lines 131-133** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
void ShowSetup();
```

**Purpose**: Display the complete fast simulation setup including worlds, regions, models, and their relationships.

**Requirements**: Geometry must be closed before calling.

**Usage**:
```cpp
// After geometry construction, before run
void MyRunAction::BeginOfRunAction(const G4Run* run)
{
    if (run->GetRunID() == 0) {  // First run only
        G4GlobalFastSimulationManager* globalFSM =
            G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

        G4cout << "\n========== Fast Simulation Setup ==========" << G4endl;
        globalFSM->ShowSetup();
        G4cout << "==========================================\n" << G4endl;
    }
}
```

**Example Output**:
```
Fast Simulation Setup:
  World: WorldPhysical
    Region: DefaultRegion
      (no fast simulation models)
    Region: CalorimeterRegion
      Volume: CalorimeterLV
      Models:
        - EMShowerModel (active)
          Applicable to: e-, e+, gamma
        - HadronicShowerModel (active)
          Applicable to: pi+, pi-, pi0, proton, neutron
```

### ListEnvelopes

**Lines 135-136** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
void ListEnvelopes(const G4String& name = "all",
                   listType type = NAMES_ONLY);

void ListEnvelopes(const G4ParticleDefinition* particle);
```

**Purpose**: List envelopes (regions) with fast simulation models.

**Parameters**:
- `name`: Envelope name or "all" (default)
- `type`: Display detail level (NAMES_ONLY, MODELS, ISAPPLICABLE)
- `particle`: Show only envelopes with models applicable to this particle

**List Types** (Lines 59-64):
```cpp
enum listType {
    NAMES_ONLY,    // Just envelope names
    MODELS,        // Envelope names and model names
    ISAPPLICABLE   // Full detail including particle applicability
};
```

**Usage - All Envelopes**:
```cpp
G4GlobalFastSimulationManager* globalFSM =
    G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

// Simple list
globalFSM->ListEnvelopes("all", NAMES_ONLY);

// With model names
globalFSM->ListEnvelopes("all", MODELS);

// Full detail
globalFSM->ListEnvelopes("all", ISAPPLICABLE);
```

**Usage - Specific Envelope**:
```cpp
// List models in specific envelope
globalFSM->ListEnvelopes("CalorimeterRegion", MODELS);
```

**Usage - Particle-Specific**:
```cpp
// Show envelopes where electron fast simulation is available
globalFSM->ListEnvelopes(G4Electron::Definition());

// Show for photons
globalFSM->ListEnvelopes(G4Gamma::Definition());
```

## Geometry Closure

**Lines 129** in `source/processes/parameterisation/include/G4GlobalFastSimulationManager.hh`

```cpp
void FastSimulationNeedsToBeClosed();
```

**Purpose**: Signal that fast simulation parameterization must be closed (internal use).

::: warning Internal Use Only
Called automatically by the framework. Not for user code.
:::

## Typical Usage Patterns

### Pattern 1: Setup Verification

```cpp
// In main() or RunAction::BeginOfRunAction
void VerifyFastSimSetup()
{
    G4GlobalFastSimulationManager* globalFSM =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    G4cout << "\n=== Fast Simulation Configuration ===" << G4endl;

    // Show complete setup
    globalFSM->ShowSetup();

    // Check specific particles
    G4cout << "\nElectron fast simulation:" << G4endl;
    globalFSM->ListEnvelopes(G4Electron::Definition());

    G4cout << "\nPhoton fast simulation:" << G4endl;
    globalFSM->ListEnvelopes(G4Gamma::Definition());

    G4cout << "======================================\n" << G4endl;
}
```

### Pattern 2: Runtime Control via UI Commands

```cpp
// Define UI commands for fast simulation control
class MyFastSimMessenger : public G4UImessenger
{
public:
    MyFastSimMessenger() {
        fActivateCmd = new G4UIcmdWithAString("/fastsim/activate", this);
        fActivateCmd->SetGuidance("Activate fast simulation model");
        fActivateCmd->SetParameterName("modelName", false);

        fDeactivateCmd = new G4UIcmdWithAString("/fastsim/deactivate", this);
        fDeactivateCmd->SetGuidance("Deactivate fast simulation model");
        fDeactivateCmd->SetParameterName("modelName", false);

        fShowCmd = new G4UIcommand("/fastsim/show", this);
        fShowCmd->SetGuidance("Show fast simulation setup");
    }

    void SetNewValue(G4UIcommand* command, G4String value) override {
        G4GlobalFastSimulationManager* globalFSM =
            G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

        if (command == fActivateCmd) {
            globalFSM->ActivateFastSimulationModel(value);
            G4cout << "Activated: " << value << G4endl;
        }
        else if (command == fDeactivateCmd) {
            globalFSM->InActivateFastSimulationModel(value);
            G4cout << "Deactivated: " << value << G4endl;
        }
        else if (command == fShowCmd) {
            globalFSM->ShowSetup();
        }
    }

private:
    G4UIcmdWithAString* fActivateCmd;
    G4UIcmdWithAString* fDeactivateCmd;
    G4UIcommand* fShowCmd;
};
```

**Macro usage**:
```
# Validation run - disable fast simulation
/fastsim/deactivate EMShowerModel
/run/beamOn 1000

# Production run - enable fast simulation
/fastsim/activate EMShowerModel
/run/beamOn 100000

# Show configuration
/fastsim/show
```

### Pattern 3: Conditional Activation

```cpp
// In BeginOfRunAction
void MyRunAction::BeginOfRunAction(const G4Run* run)
{
    G4GlobalFastSimulationManager* globalFSM =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    // Enable fast simulation for high statistics runs only
    if (run->GetNumberOfEventToBeProcessed() > 10000) {
        globalFSM->ActivateFastSimulationModel("EMShowerModel");
        globalFSM->ActivateFastSimulationModel("HadronicShowerModel");
        G4cout << "Fast simulation ENABLED (large statistics run)" << G4endl;
    } else {
        globalFSM->InActivateFastSimulationModel("EMShowerModel");
        globalFSM->InActivateFastSimulationModel("HadronicShowerModel");
        G4cout << "Fast simulation DISABLED (validation run)" << G4endl;
    }
}
```

### Pattern 4: Model Configuration

```cpp
// Configure all models of a given type
void ConfigureEMModels(G4double threshold)
{
    G4GlobalFastSimulationManager* globalFSM =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    // Find first model
    G4VFastSimulationModel* model =
        globalFSM->GetFastSimulationModel("EMShowerModel", nullptr);

    G4int nConfigured = 0;

    while (model != nullptr) {
        // Cast to derived type
        MyEMShowerModel* emModel = dynamic_cast<MyEMShowerModel*>(model);
        if (emModel != nullptr) {
            emModel->SetEnergyThreshold(threshold);
            nConfigured++;
        }

        // Get next model with same name
        model = globalFSM->GetFastSimulationModel("EMShowerModel", model);
    }

    G4cout << "Configured " << nConfigured << " EM models" << G4endl;
}
```

### Pattern 5: Event Cleanup

```cpp
void MyEventAction::EndOfEventAction(const G4Event* event)
{
    // Flush all fast simulation models
    G4GlobalFastSimulationManager* globalFSM =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    globalFSM->Flush();

    // Now process hits, compute energies, etc.
    // All buffered hits have been flushed
}
```

## Debugging and Diagnostics

### Check if Fast Simulation is Active

```cpp
void CheckFastSimStatus()
{
    G4GlobalFastSimulationManager* globalFSM =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    // Try to find any model
    G4VFastSimulationModel* anyModel =
        globalFSM->GetFastSimulationModel("EMShowerModel");

    if (anyModel != nullptr) {
        G4cout << "Fast simulation is configured" << G4endl;
        globalFSM->ShowSetup();
    } else {
        G4cout << "No fast simulation models found" << G4endl;
    }
}
```

### List All Models

```cpp
void ListAllModels()
{
    G4GlobalFastSimulationManager* globalFSM =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    G4cout << "\n=== All Fast Simulation Models ===" << G4endl;
    globalFSM->ListEnvelopes("all", ISAPPLICABLE);
    G4cout << "==================================\n" << G4endl;
}
```

### Particle-Specific Diagnostics

```cpp
void DiagnoseParticle(const G4ParticleDefinition* particle)
{
    G4GlobalFastSimulationManager* globalFSM =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    G4cout << "\nFast simulation for " << particle->GetParticleName() << ":"
           << G4endl;

    globalFSM->ListEnvelopes(particle);
}

// Usage
DiagnoseParticle(G4Electron::Definition());
DiagnoseParticle(G4PionPlus::Definition());
```

## Common Use Cases

1. **Validation Runs**: Disable fast sim, compare with detailed
2. **Setup Verification**: Check configuration at startup
3. **Runtime Control**: Enable/disable based on run conditions
4. **Performance Tuning**: Identify which models are active
5. **Debugging**: Find models not triggering as expected

## Performance Considerations

- Singleton access is fast (thread-local pointer lookup)
- `ShowSetup()` can be expensive for complex geometries (use sparingly)
- Model search is linear - cache results if calling repeatedly
- Activation/inactivation is fast (no geometry rebuild needed)

## Thread Safety

::: warning Multi-Threading
The class is thread-safe via thread-local storage:
- Each worker thread has its own instance
- No synchronization needed within a thread
- Master thread has its own instance (used during construction)
:::

## Limitations

1. **Model Search**: Finds models by name only (no type-based search)
2. **No Model Removal**: No global method to remove models (use manager-level)
3. **Display Only**: `ShowSetup()` requires closed geometry

## Related Classes

- [G4FastSimulationManager](G4FastSimulationManager.md) - Regional managers registered here
- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Models searchable via this class
- [G4FastSimulationManagerProcess](G4FastSimulationManagerProcess.md) - Processes tracked here

## References

- Main overview: [Parameterisation Module](../index.md)
- Thread-local singleton pattern: `G4ThreadLocalSingleton`
- History: Lines 38-43 in header (first implementation Feb 98)
