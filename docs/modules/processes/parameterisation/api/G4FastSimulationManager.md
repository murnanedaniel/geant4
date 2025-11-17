# G4FastSimulationManager

## Overview

`G4FastSimulationManager` manages fast simulation models for a specific envelope region. Each envelope (G4Region) has its own manager that maintains a list of applicable models, determines when to trigger parameterization, and invokes the selected model's `DoIt` method. This class acts as the regional coordinator between the tracking process and user-defined models.

::: tip Class Location
**Header:** `source/processes/parameterisation/include/G4FastSimulationManager.hh`
**Source:** `source/processes/parameterisation/src/G4FastSimulationManager.cc`
**Role:** Regional model coordinator
:::

## Purpose

`G4FastSimulationManager` provides:
- **Model registration**: Add/remove fast simulation models for an envelope
- **Model selection**: Determine which model (if any) should trigger at each step
- **Trigger evaluation**: Call `IsApplicable` and `ModelTrigger` for candidate models
- **Model invocation**: Execute selected model's `DoIt` method
- **Model activation control**: Enable/disable models by name
- **Process interface**: Bridge between `G4FastSimulationManagerProcess` and models
- **Optimization**: Cache applicable models per particle type

## Class Definition

**Lines 73-162** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
class G4FastSimulationManager
{
  public:
    // Constructor
    G4FastSimulationManager(G4Envelope* anEnvelope, G4bool IsUnique = FALSE);

    // Destructor
    ~G4FastSimulationManager();

    // Model management
    void AddFastSimulationModel(G4VFastSimulationModel* model);
    void RemoveFastSimulationModel(G4VFastSimulationModel* model);

    // Model activation control
    G4bool ActivateFastSimulationModel(const G4String& modelName);
    G4bool InActivateFastSimulationModel(const G4String& modelName);

    // Query methods
    void ListTitle() const;
    void ListModels() const;
    void ListModels(const G4ParticleDefinition* particle) const;
    void ListModels(const G4String& modelName) const;
    const G4Envelope* GetEnvelope() const;

    G4VFastSimulationModel* GetFastSimulationModel(
        const G4String& modelName,
        const G4VFastSimulationModel* previousFound,
        G4bool& foundPrevious) const;

    const std::vector<G4VFastSimulationModel*>& GetFastSimulationModelList() const;

    void FlushModels();

    // Process interface - PostStep
    G4bool PostStepGetFastSimulationManagerTrigger(
        const G4Track& track,
        const G4Navigator* navigator = nullptr);

    G4VParticleChange* InvokePostStepDoIt();

    // Process interface - AtRest
    G4bool AtRestGetFastSimulationManagerTrigger(
        const G4Track& track,
        const G4Navigator* navigator = nullptr);

    G4VParticleChange* InvokeAtRestDoIt();

    // Comparison
    G4bool operator==(const G4FastSimulationManager& other) const;

  private:
    G4FastTrack fFastTrack;
    G4FastStep fFastStep;
    G4VFastSimulationModel* fTriggedFastSimulationModel;
    G4FastSimulationVector<G4VFastSimulationModel> ModelList;
    G4FastSimulationVector<G4VFastSimulationModel> fInactivatedModels;
    G4ParticleDefinition* fLastCrossedParticle;
    G4FastSimulationVector<G4VFastSimulationModel> fApplicableModelList;
};
```

## Constructor

**Lines 86** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
G4FastSimulationManager(G4Envelope* anEnvelope, G4bool IsUnique = FALSE);
```

**Parameters**:
- `anEnvelope`: The `G4Region` where fast simulation is active
- `IsUnique`: Set `true` if envelope placed only once (optimization)

**Behavior**:
- Registers itself with `G4GlobalFastSimulationManager`
- Notifies the envelope region to become a fast simulation region
- Initializes internal `G4FastTrack` and `G4FastStep` objects

**Usage** (typically automatic):
```cpp
// Usually created automatically by G4VFastSimulationModel constructor
// Manual creation (rare):
G4Region* caloRegion = new G4Region("CalorimeterRegion");
G4FastSimulationManager* manager =
    new G4FastSimulationManager(caloRegion, false);

// Add models
MyEMModel* emModel = new MyEMModel("EMShower");
manager->AddFastSimulationModel(emModel);
```

::: tip Automatic Creation
When you use `G4VFastSimulationModel(name, envelope, isUnique)` constructor, the manager is created automatically if needed. Manual creation is rarely necessary.
:::

## Model Management

### AddFastSimulationModel

**Lines 104, 164-169** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
void AddFastSimulationModel(G4VFastSimulationModel* model);
```

**Purpose**: Register a fast simulation model with this manager.

**Effect**:
- Adds model to the active model list
- Forces rebuild of applicable model cache on next trigger check

**Example**:
```cpp
G4FastSimulationManager* manager = // get manager
MyCustomModel* model = new MyCustomModel("MyModel");
manager->AddFastSimulationModel(model);
```

**Implementation** (inline):
```cpp
inline void G4FastSimulationManager::AddFastSimulationModel(
    G4VFastSimulationModel* fsm)
{
    ModelList.push_back(fsm);
    // forces the fApplicableModelList to be rebuilt
    fLastCrossedParticle = nullptr;
}
```

### RemoveFastSimulationModel

**Lines 107, 171-176** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
void RemoveFastSimulationModel(G4VFastSimulationModel* model);
```

**Purpose**: Unregister a model from this manager.

**Effect**:
- Removes from active list or inactivated list
- Forces applicable model cache rebuild

**Example**:
```cpp
manager->RemoveFastSimulationModel(myModel);
delete myModel;  // Now safe to delete
```

## Model Activation Control

### ActivateFastSimulationModel

**Lines 110** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
G4bool ActivateFastSimulationModel(const G4String& modelName);
```

**Purpose**: Enable a previously inactivated model.

**Parameters**: Model name (as given in constructor)

**Return**: `true` if model found and activated, `false` otherwise

**Example**:
```cpp
// Disable for validation run
manager->InActivateFastSimulationModel("EMShowerModel");

// Run simulation with detailed tracking...

// Re-enable for production
G4bool success = manager->ActivateFastSimulationModel("EMShowerModel");
if (success) {
    G4cout << "Model reactivated" << G4endl;
}
```

### InActivateFastSimulationModel

**Lines 113** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
G4bool InActivateFastSimulationModel(const G4String& modelName);
```

**Purpose**: Temporarily disable a model without removing it.

**Parameters**: Model name

**Return**: `true` if model found and inactivated, `false` otherwise

**Use Cases**:
- Validation runs (compare with/without fast simulation)
- Energy-dependent activation
- Debugging

## Query Methods

### ListTitle

**Lines 116** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
void ListTitle() const;
```

**Purpose**: Print manager title/header information.

**Example Output**:
```
Fast Simulation Manager for envelope: CalorimeterRegion
```

### ListModels

**Lines 117-119** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
void ListModels() const;
void ListModels(const G4ParticleDefinition* particle) const;
void ListModels(const G4String& modelName) const;
```

**Purpose**: Print information about registered models.

**Overloads**:
- `ListModels()`: All models in this manager
- `ListModels(particle)`: Models applicable to specific particle type
- `ListModels(modelName)`: Search for models by name

**Example**:
```cpp
// List all models
manager->ListModels();

// List models for electrons
manager->ListModels(G4Electron::Definition());

// Find specific model
manager->ListModels("EMShowerModel");
```

### GetEnvelope

**Lines 120, 183-186** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
const G4Envelope* GetEnvelope() const;
```

**Purpose**: Returns the envelope (G4Region) this manager handles.

**Example**:
```cpp
const G4Envelope* envelope = manager->GetEnvelope();
G4String regionName = envelope->GetName();
```

### GetFastSimulationModel

**Lines 122-124** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
G4VFastSimulationModel* GetFastSimulationModel(
    const G4String& modelName,
    const G4VFastSimulationModel* previousFound,
    G4bool& foundPrevious) const;
```

**Purpose**: Iterative search for models by name (handles multiple models with same name).

**Parameters**:
- `modelName`: Model name to search for
- `previousFound`: Previous match in iteration (nullptr for first call)
- `foundPrevious`: Output flag (set to true when previousFound is encountered)

**Return**: Next matching model, or nullptr if no more found

**Example** (finding all models with same name):
```cpp
G4VFastSimulationModel* model = nullptr;
G4bool foundPrev = false;

// Get first match
model = manager->GetFastSimulationModel("CommonName", nullptr, foundPrev);

while (model != nullptr) {
    // Process model...
    G4cout << "Found model: " << model->GetName() << G4endl;

    // Get next match
    model = manager->GetFastSimulationModel("CommonName", model, foundPrev);
}
```

### GetFastSimulationModelList

**Lines 126-129** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
const std::vector<G4VFastSimulationModel*>& GetFastSimulationModelList() const;
```

**Purpose**: Direct access to the model list.

**Return**: Vector of model pointers

**Example**:
```cpp
const auto& models = manager->GetFastSimulationModelList();
G4cout << "Number of models: " << models.size() << G4endl;

for (const auto* model : models) {
    G4cout << "  - " << model->GetName() << G4endl;
}
```

### FlushModels

**Lines 131** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
void FlushModels();
```

**Purpose**: Call `Flush()` on all registered models.

**When Called**:
- End of event
- Via `G4GlobalFastSimulationManager::Flush()`

**Effect**: Each model's `Flush()` method is invoked for cleanup

## Process Interface

These methods are called by `G4FastSimulationManagerProcess` and are not typically used by end users.

### PostStepGetFastSimulationManagerTrigger

**Lines 138** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
G4bool PostStepGetFastSimulationManagerTrigger(
    const G4Track& track,
    const G4Navigator* navigator = nullptr);
```

**Purpose**: Determine if any model should trigger for this step.

**Internal Workflow**:
1. Setup `fFastTrack` with current track
2. Build applicable model list for this particle type (if needed)
3. Loop through applicable models
4. For each model, call `ModelTrigger(fFastTrack)`
5. If any model returns `true`, store it and return `true`
6. Otherwise return `false`

**Called By**: `G4FastSimulationManagerProcess::PostStepGetPhysicalInteractionLength`

### InvokePostStepDoIt

**Lines 140** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
G4VParticleChange* InvokePostStepDoIt();
```

**Purpose**: Execute the triggered model's parameterization.

**Internal Workflow**:
1. Initialize `fFastStep` with `fFastTrack`
2. Call triggered model's `DoIt(fFastTrack, fFastStep)`
3. Return `fFastStep` as `G4VParticleChange*`

**Called By**: `G4FastSimulationManagerProcess::PostStepDoIt`

**Precondition**: `PostStepGetFastSimulationManagerTrigger` returned `true`

### AtRest Methods

**Lines 143-144** in `source/processes/parameterisation/include/G4FastSimulationManager.hh`

```cpp
G4bool AtRestGetFastSimulationManagerTrigger(
    const G4Track& track,
    const G4Navigator* navigator = nullptr);

G4VParticleChange* InvokeAtRestDoIt();
```

**Purpose**: Same as PostStep versions, but for at-rest parameterization.

**Usage**: Rare - most fast simulation occurs during steps, not at rest.

## Internal Mechanism

### Applicable Model Caching

For efficiency, the manager caches which models apply to each particle type:

**Lines 157-158** (private members)

```cpp
G4ParticleDefinition* fLastCrossedParticle;
G4FastSimulationVector<G4VFastSimulationModel> fApplicableModelList;
```

**Algorithm**:
1. When a new particle type enters the envelope:
   - Call `IsApplicable(particle)` for all active models
   - Build `fApplicableModelList` with applicable models
   - Store `fLastCrossedParticle` = particle type
2. On subsequent steps for same particle type:
   - Use cached `fApplicableModelList` (skip `IsApplicable` calls)
3. When models added/removed/activated/inactivated:
   - Set `fLastCrossedParticle = nullptr` to force rebuild

This optimization is crucial for performance since `IsApplicable` would otherwise be called at every step.

### Trigger Selection

When `PostStepGetFastSimulationManagerTrigger` is called:

```
For each model in fApplicableModelList:
    if (model->ModelTrigger(fFastTrack)):
        fTriggedFastSimulationModel = model
        return true

return false  // No model triggered
```

**Important**: Only the **first** model to return `true` from `ModelTrigger` is used. Model order in the list matters.

## Usage Example

### Manual Setup (Rare)

```cpp
// In detector construction
void MyDetectorConstruction::Construct()
{
    // Create region
    G4Region* caloRegion = new G4Region("CalorimeterRegion");
    fCalorimeterLV->SetRegion(caloRegion);
    caloRegion->AddRootLogicalVolume(fCalorimeterLV);

    // Create manager manually
    G4FastSimulationManager* manager =
        new G4FastSimulationManager(caloRegion);

    // Create and add models
    MyEMShowerModel* emModel = new MyEMShowerModel("EMShower");
    manager->AddFastSimulationModel(emModel);

    MyHadronicModel* hadModel = new MyHadronicModel("HadShower");
    manager->AddFastSimulationModel(hadModel);

    // Query
    manager->ListTitle();
    manager->ListModels();

    return physWorld;
}
```

### Typical Setup (Automatic)

```cpp
// Create model with automatic manager creation
MyEMShowerModel::MyEMShowerModel(G4Envelope* region)
    : G4VFastSimulationModel("EMShower", region, false)
{
    // Manager created and model registered automatically
}

// In detector construction
void MyDetectorConstruction::ConstructSDandField()
{
    G4Region* caloRegion = new G4Region("CalorimeterRegion");
    fCalorimeterLV->SetRegion(caloRegion);
    caloRegion->AddRootLogicalVolume(fCalorimeterLV);

    // This automatically creates manager if needed
    MyEMShowerModel* model = new MyEMShowerModel(caloRegion);

    // Done! Model is active.
}
```

### Runtime Control

```cpp
// In a UI command
void MyMessenger::SetNewValue(G4UIcommand* command, G4String value)
{
    if (command == fActivateCmd) {
        // Get the manager from global manager
        G4GlobalFastSimulationManager* globalMgr =
            G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

        // Activate/inactivate model globally
        if (value == "on") {
            globalMgr->ActivateFastSimulationModel("EMShower");
        } else {
            globalMgr->InActivateFastSimulationModel("EMShower");
        }
    }
}
```

## Debugging

### List All Managers and Models

```cpp
// After geometry construction
void MyActionInitialization::Build() const
{
    G4GlobalFastSimulationManager* globalMgr =
        G4GlobalFastSimulationManager::GetGlobalFastSimulationManager();

    // Show complete fast simulation setup
    globalMgr->ShowSetup();

    // List envelopes for specific particle
    globalMgr->ListEnvelopes(G4Electron::Definition());
}
```

### Monitor Trigger Calls

Add debug output in your model:

```cpp
G4bool MyModel::ModelTrigger(const G4FastTrack& fastTrack)
{
    static G4long nCalls = 0;
    static G4long nTriggered = 0;

    nCalls++;

    // Your trigger logic
    G4bool trigger = /* ... */;

    if (trigger) nTriggered++;

    // Periodic reporting
    if (nCalls % 10000 == 0) {
        G4cout << "Model trigger statistics:" << G4endl;
        G4cout << "  Total calls: " << nCalls << G4endl;
        G4cout << "  Triggered: " << nTriggered << G4endl;
        G4cout << "  Efficiency: "
               << 100.0*nTriggered/nCalls << "%" << G4endl;
    }

    return trigger;
}
```

## Best Practices

1. **Use Automatic Creation**: Let `G4VFastSimulationModel` constructor create the manager

2. **Model Order Matters**: First model to trigger wins. Order models by priority:
   ```cpp
   manager->AddFastSimulationModel(highPriorityModel);  // Add first
   manager->AddFastSimulationModel(lowPriorityModel);   // Add last
   ```

3. **Activation Control**: Use for validation, don't repeatedly add/remove models

4. **IsUnique Flag**: Set true only if certain (no replicas, no multiple placements)

5. **Query Methods**: Use `ListModels()` for debugging setup issues

## Performance Considerations

- **Applicable Model Caching**: Avoids repeated `IsApplicable` calls
- **IsUnique Optimization**: Avoids coordinate transformation recalculation
- **Model Order**: Affects average trigger evaluation cost

**Trigger Cost**: If first model triggers frequently, subsequent models never evaluated. Order by:
- Likelihood to trigger (high → low)
- Evaluation cost (cheap → expensive)

## Common Issues

**Issue**: Model never triggers
- Check if model is in applicable list: `ListModels(particleType)`
- Verify `IsApplicable` returns true for your particles
- Add debug output in `ModelTrigger`

**Issue**: Wrong model triggers
- Check model order
- Verify trigger conditions in each model
- Use unique trigger conditions for different models

**Issue**: Crash during DoIt
- Check that triggered model is not null
- Verify `fFastTrack` and `fFastStep` are properly initialized

## Related Classes

- [G4VFastSimulationModel](G4VFastSimulationModel.md) - Models managed by this class
- [G4GlobalFastSimulationManager](G4GlobalFastSimulationManager.md) - Global coordinator
- [G4FastSimulationManagerProcess](G4FastSimulationManagerProcess.md) - Process wrapper
- [G4FastTrack](G4FastTrack.md) - Data structure used internally
- [G4FastStep](G4FastStep.md) - Data structure used internally

## References

- Main overview: [Parameterisation Module](../index.md)
- History: Lines 36-38 in header (first implementation Oct 97)
- Example: `examples/extended/parameterisations/Par03/`
