# G4ParallelWorldProcess

**Full parallel world navigation with material switching capability**

::: tip Quick Reference
**Header:** `source/processes/scoring/include/G4ParallelWorldProcess.hh`
**Source:** `source/processes/scoring/src/G4ParallelWorldProcess.cc`
**Inherits:** `G4VProcess`
**Process Type:** `fParallel`
**Author:** M. Asai (SLAC), 2010
:::

## Purpose

`G4ParallelWorldProcess` is the most comprehensive parallel world process, providing:

1. **Parallel geometry navigation** - Tracks particles through an independent geometry hierarchy
2. **Step limitation** - Limits steps at parallel world boundaries
3. **Sensitive detector invocation** - Calls SDs in parallel world volumes
4. **Material switching** - Optionally overrides mass world materials
5. **Region switching** - Can override regions for production cuts
6. **Importance biasing support** - Enables geometry-based variance reduction

This is the **full-featured** parallel world process. Use `G4ParallelWorldScoringProcess` if you only need scoring without material switching.

---

## Class Declaration

**File:** Lines 56-159 in `source/processes/scoring/include/G4ParallelWorldProcess.hh`

```cpp
class G4ParallelWorldProcess : public G4VProcess
{
  public:
    // Construction
    G4ParallelWorldProcess(const G4String& processName = "ParaWorld",
                           G4ProcessType theType = fParallel);
    ~G4ParallelWorldProcess() override;

    // Parallel world setup
    void SetParallelWorld(G4String parallelWorldName);
    void SetParallelWorld(G4VPhysicalVolume* parallelWorld);

    // Process interface
    void StartTracking(G4Track*) override;

    // AtRest
    G4double AtRestGetPhysicalInteractionLength(const G4Track&,
                                                G4ForceCondition*) override;
    G4VParticleChange* AtRestDoIt(const G4Track&, const G4Step&) override;

    // AlongStep
    G4double AlongStepGetPhysicalInteractionLength(const G4Track&, G4double,
                                                   G4double, G4double&,
                                                   G4GPILSelection*) override;
    G4VParticleChange* AlongStepDoIt(const G4Track&, const G4Step&) override;

    // PostStep
    G4double PostStepGetPhysicalInteractionLength(const G4Track&, G4double,
                                                  G4ForceCondition*) override;
    G4VParticleChange* PostStepDoIt(const G4Track&, const G4Step&) override;

    // Material switching control
    void SetLayeredMaterialFlag(G4bool flg = true);
    G4bool GetLayeredMaterialFlag() const;

    // Particle applicability
    G4bool IsAtRestRequired(G4ParticleDefinition*);

    // Hyper-step access
    static const G4Step* GetHyperStep();
    static G4int GetHypNavigatorID();

  protected:
    void CopyStep(const G4Step& step);
    void SwitchMaterial(G4StepPoint*);

  protected:
    // Ghost step
    G4Step* fGhostStep;
    G4StepPoint* fGhostPreStepPoint;
    G4StepPoint* fGhostPostStepPoint;

    // Particle changes
    G4VParticleChange aDummyParticleChange;
    G4ParticleChange xParticleChange;

    // Navigation infrastructure
    G4TransportationManager* fTransportationManager;
    G4PathFinder* fPathFinder;

    // Ghost world navigation
    G4String fGhostWorldName;
    G4VPhysicalVolume* fGhostWorld{nullptr};
    G4Navigator* fGhostNavigator{nullptr};
    G4int fNavigatorID{-1};
    G4TouchableHandle fOldGhostTouchable;
    G4TouchableHandle fNewGhostTouchable;
    G4FieldTrack fFieldTrack;
    G4double fGhostSafety{0.};
    G4bool fOnBoundary{false};

    // Material switching
    G4bool layeredMaterialFlag{false};

  private:
    // Thread-local static members
    static G4ThreadLocal G4Step* fpHyperStep;
    static G4ThreadLocal G4int nParallelWorlds;
    static G4ThreadLocal G4int fNavIDHyp;
    G4int iParallelWorld;
};
```

---

## Key Methods

### Constructor/Destructor

#### `G4ParallelWorldProcess()`
**Declaration:** Lines 60-61 in header

```cpp
G4ParallelWorldProcess(const G4String& processName = "ParaWorld",
                       G4ProcessType theType = fParallel);
```

**Parameters:**
- `processName` - Name for this process instance (default: "ParaWorld")
- `theType` - Process type classification (default: `fParallel`)

**Initialization:**
- Sets up navigation infrastructure (`G4PathFinder`, `G4TransportationManager`)
- Registers with `G4ParallelWorldProcessStore`
- Allocates ghost step and step points
- Initializes particle change objects

**Usage:**
```cpp
G4ParallelWorldProcess* proc = new G4ParallelWorldProcess("MyParallelWorld");
proc->SetParallelWorld("ScoringWorld");
proc->SetLayeredMaterialFlag(true);  // If material switching needed
```

---

### Parallel World Configuration

#### `SetParallelWorld(G4String)`
**Declaration:** Line 68 in header

```cpp
void SetParallelWorld(G4String parallelWorldName);
```

**Purpose:** Associate this process with a named parallel world.

**Parameters:**
- `parallelWorldName` - Name of parallel world (must match `G4VUserParallelWorld` name)

**Behavior:**
- Stores world name
- Navigator will be created when first used
- Must be called before tracking begins

**Usage:**
```cpp
proc->SetParallelWorld("ImportanceWorld");
// Name must match registered parallel world construction
```

---

#### `SetParallelWorld(G4VPhysicalVolume*)`
**Declaration:** Line 69 in header

```cpp
void SetParallelWorld(G4VPhysicalVolume* parallelWorld);
```

**Purpose:** Directly set the parallel world volume.

**Parameters:**
- `parallelWorld` - Pointer to parallel world's top volume

**Usage:** Less common; typically use string version.

---

### Material Switching

#### `SetLayeredMaterialFlag()`
**Declaration:** Line 104 in header

```cpp
void SetLayeredMaterialFlag(G4bool flg = true);
```

**Purpose:** Enable or disable material override from parallel world.

**Parameters:**
- `flg` - `true` to enable material switching, `false` to disable (default: `true`)

**Behavior:**
When enabled:
- Materials from parallel world volumes override mass world materials
- Physics processes use parallel world materials for cross-sections, dE/dx, etc.
- **Affects physics** - not purely scoring!

When disabled:
- Functions like `G4ParallelWorldScoringProcess` (scoring only)

**Usage:**
```cpp
// For importance biasing with material override
proc->SetLayeredMaterialFlag(true);

// For pure scoring (though G4ParallelWorldScoringProcess is better)
proc->SetLayeredMaterialFlag(false);
```

**Warning:** Material switching changes physics. Use carefully and validate results.

---

#### `GetLayeredMaterialFlag()`
**Declaration:** Line 105 in header

```cpp
G4bool GetLayeredMaterialFlag() const;
```

**Returns:** Current material switching state.

---

### Process Interface Implementation

#### `StartTracking()`
**Declaration:** Line 75 in header

```cpp
void StartTracking(G4Track*) override;
```

**Purpose:** Initialize process at beginning of track.

**Behavior:**
- Locates particle in parallel world
- Initializes ghost navigator
- Sets initial touchable
- Resets safety values

**Called by:** Tracking manager when new track begins.

---

#### `AlongStepGetPhysicalInteractionLength()`
**Declaration:** Lines 88-89 in header

```cpp
G4double AlongStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& proposedSafety,
    G4GPILSelection* selection
) override;
```

**Purpose:** Compute maximum step allowed by parallel world geometry.

**Algorithm:**
1. Check if far from boundaries (safety optimization)
2. Call `G4PathFinder::ComputeStep()` for parallel navigation
3. Return minimum of all navigators' step limits

**Returns:**
- Step limit imposed by parallel world boundary
- `DBL_MAX` if no boundary within current minimum step

**Side Effects:**
- Updates `proposedSafety` with parallel world safety
- Sets `selection` to `CandidateForSelection` if limiting step

**Performance:** This is called for EVERY step, so optimizations matter:
- Safety check avoids expensive navigation when particle is far from boundaries
- Coordinates with other worlds via `G4PathFinder`

---

#### `AlongStepDoIt()`
**Declaration:** Line 90 in header

```cpp
G4VParticleChange* AlongStepDoIt(const G4Track& track, const G4Step& step) override;
```

**Purpose:** Update parallel world navigation and invoke sensitive detectors.

**Algorithm:**
1. Copy true step to ghost step
2. Perform parallel world navigation to post-step point
3. Update touchables
4. If boundary crossed or within parallel volume:
   - Switch material (if `layeredMaterialFlag` enabled)
   - Invoke sensitive detectors with ghost step
5. Return particle change (typically no changes)

**Returns:**
- `aDummyParticleChange` (no modifications) if no material switching
- `xParticleChange` if material switching active

**Sensitive Detector Calls:**
- Uses ghost step with parallel world geometry
- SD gets parallel world touchable, not mass world
- Enables scoring in volumes that don't exist in mass world

---

#### `PostStepGetPhysicalInteractionLength()`
**Declaration:** Lines 96-97 in header

```cpp
G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition
) override;
```

**Purpose:** Handle discrete interactions at parallel world boundaries.

**Returns:**
- `DBL_MAX` typically (no discrete interaction)
- Forced condition at boundaries for sensitive detector calls

**Usage:** Ensures sensitive detectors called at boundary crossings.

---

#### `PostStepDoIt()`
**Declaration:** Line 98 in header

```cpp
G4VParticleChange* PostStepDoIt(const G4Track& track, const G4Step& step) override;
```

**Purpose:** Handle post-step actions at boundaries.

**Behavior:**
- Updates parallel world location
- Invokes sensitive detectors if at boundary
- Manages material switching if enabled

**Returns:** Particle change (no modifications for pure navigation)

---

### AtRest Methods

#### `IsAtRestRequired()`
**Declaration:** Line 110 in header

```cpp
G4bool IsAtRestRequired(G4ParticleDefinition* particle);
```

**Purpose:** Determine if this particle needs at-rest processing in parallel world.

**Returns:**
- `true` if particle has at-rest processes and parallel world has sensitive detectors
- `false` otherwise

**Usage:** Called during process manager setup to optimize process lists.

---

#### `AtRestGetPhysicalInteractionLength()`
**Declaration:** Line 81 in header

```cpp
G4double AtRestGetPhysicalInteractionLength(
    const G4Track& track,
    G4ForceCondition* condition
) override;
```

**Purpose:** Enable at-rest sensitive detector calls (e.g., for stopped muons).

**Returns:** `DBL_MAX` (no actual interaction, just SD invocation)

---

#### `AtRestDoIt()`
**Declaration:** Line 82 in header

```cpp
G4VParticleChange* AtRestDoIt(const G4Track& track, const G4Step& step) override;
```

**Purpose:** Invoke sensitive detectors for at-rest particles in parallel world.

**Usage:** Rare, but enables scoring of decay-at-rest, capture, etc. in parallel volumes.

---

### Hyper-Step Access

#### `GetHyperStep()`
**Declaration:** Line 115 in header

```cpp
static const G4Step* GetHyperStep();
```

**Purpose:** Provide access to parallel world step from other processes.

**Returns:** Pointer to current ghost step (thread-local)

**Usage:**
```cpp
// In another process
const G4Step* parallelStep = G4ParallelWorldProcess::GetHyperStep();
if (parallelStep) {
    G4VTouchable* parallelTouch =
        parallelStep->GetPreStepPoint()->GetTouchable();
    G4String parallelVolName = parallelTouch->GetVolume()->GetName();

    // Use parallel world info for biasing decisions
    if (parallelVolName == "HighImportanceRegion") {
        ApplySplitting();
    }
}
```

**Implementation:** Lines 155-157 (thread-local static)

---

#### `GetHypNavigatorID()`
**Declaration:** Line 116 in header

```cpp
static G4int GetHypNavigatorID();
```

**Purpose:** Get navigator ID for the "hyper-navigator" (first parallel world).

**Returns:** Navigator index in `G4PathFinder`

**Usage:** Advanced navigation queries.

---

### Protected Methods

#### `CopyStep()`
**Declaration:** Line 120 in header

```cpp
void CopyStep(const G4Step& step);
```

**Purpose:** Copy true step to ghost step.

**Behavior:**
- Copies step length, energy deposit, etc.
- Replaces touchables with parallel world touchables
- Used internally in `AlongStepDoIt()`

---

#### `SwitchMaterial()`
**Declaration:** Line 121 in header

```cpp
void SwitchMaterial(G4StepPoint* stepPoint);
```

**Purpose:** Override step point material with parallel world material.

**Parameters:**
- `stepPoint` - Pre or post-step point to modify

**Behavior:**
- If `layeredMaterialFlag` enabled
- If parallel world volume has material
- Replace mass world material with parallel world material
- Also switches region if parallel world defines one

**Warning:** Modifies track state - affects subsequent physics processes!

---

## Data Members

### Navigation Infrastructure

**Lines 132-146 in header**

```cpp
G4TransportationManager* fTransportationManager;  // Access to navigators
G4PathFinder* fPathFinder;                        // Multi-world coordinator
```

**Purpose:** Core navigation infrastructure.

- `fTransportationManager` - Singleton managing all navigators
- `fPathFinder` - Coordinates parallel navigation through multiple worlds

---

### Ghost World State

```cpp
G4String fGhostWorldName;               // Name of parallel world
G4VPhysicalVolume* fGhostWorld;         // Top volume of parallel world
G4Navigator* fGhostNavigator;           // Dedicated navigator
G4int fNavigatorID;                     // Index in PathFinder's navigator array
G4TouchableHandle fOldGhostTouchable;   // Previous location
G4TouchableHandle fNewGhostTouchable;   // Current location
G4FieldTrack fFieldTrack;               // Field propagation state
G4double fGhostSafety;                  // Distance to nearest boundary
G4bool fOnBoundary;                     // Currently at boundary?
```

**Purpose:** Maintains parallel world navigation state.

---

### Ghost Step

**Lines 125-127 in header**

```cpp
G4Step* fGhostStep;                    // Parallel step
G4StepPoint* fGhostPreStepPoint;       // Entry point
G4StepPoint* fGhostPostStepPoint;      // Exit point
```

**Purpose:** Step information for parallel world, passed to sensitive detectors.

---

### Material Switching Flag

**Line 151 in header**

```cpp
G4bool layeredMaterialFlag{false};     // Enable material override?
```

**Purpose:** Controls whether parallel world materials override mass world.

---

### Thread-Local Static Members

**Lines 155-158 in header**

```cpp
static G4ThreadLocal G4Step* fpHyperStep;       // Shared ghost step
static G4ThreadLocal G4int nParallelWorlds;     // Count of parallel worlds
static G4ThreadLocal G4int fNavIDHyp;           // Hyper-navigator ID
G4int iParallelWorld;                           // Index of this world
```

**Purpose:**
- `fpHyperStep` - First parallel world's step (accessible via `GetHyperStep()`)
- `nParallelWorlds` - Total count (for indexing)
- `fNavIDHyp` - ID of primary parallel navigator
- `iParallelWorld` - This process's index

---

## Usage Patterns

### Basic Parallel World Scoring

```cpp
// Create process
G4ParallelWorldProcess* proc = new G4ParallelWorldProcess("Scoring");
proc->SetParallelWorld("ScoringWorld");

// Add to all particles
auto particleIterator = GetParticleIterator();
particleIterator->reset();
while((*particleIterator)()) {
    G4ParticleDefinition* particle = particleIterator->value();
    G4ProcessManager* pmanager = particle->GetProcessManager();

    pmanager->AddProcess(proc);
    pmanager->SetProcessOrdering(proc, idxAlongStep, 1);
    pmanager->SetProcessOrdering(proc, idxPostStep, 1);
}
```

---

### Importance Biasing with Material Switching

```cpp
// Create process with material override
G4ParallelWorldProcess* biasProc = new G4ParallelWorldProcess("Biasing");
biasProc->SetParallelWorld("ImportanceWorld");
biasProc->SetLayeredMaterialFlag(true);  // Enable material switching

// Define parallel world with importance regions
// (Lower density materials in high-importance regions → more splitting)

// Add to neutrons only (example)
G4ProcessManager* pmanager = G4Neutron::Definition()->GetProcessManager();
pmanager->AddProcess(biasProc);
pmanager->SetProcessOrdering(biasProc, idxAlongStep, 1);
pmanager->SetProcessOrdering(biasProc, idxPostStep, 1);
```

---

### Accessing Parallel World from Other Process

```cpp
// In some other process's DoIt method
G4VParticleChange* MyProcess::PostStepDoIt(const G4Track& track,
                                           const G4Step& step) {
    // Get parallel world information
    const G4Step* ghostStep = G4ParallelWorldProcess::GetHyperStep();

    if (ghostStep) {
        G4String ghostVol = ghostStep->GetPreStepPoint()
                                     ->GetTouchable()
                                     ->GetVolume()
                                     ->GetName();

        if (ghostVol == "KillRegion") {
            // Kill particle in this parallel world region
            return KillParticle();
        }
    }

    return pParticleChange;
}
```

---

## Performance Considerations

### Navigation Overhead

**Cost:** ~20-30% performance penalty compared to single-world navigation.

**Why:**
- Every step requires navigation in both mass and parallel worlds
- `G4PathFinder` must coordinate multiple navigators
- Safety computations doubled

**Optimization:**
```cpp
// Use simple geometry in parallel world
G4Box* simpleScoring = new G4Box("Mesh", 10*cm, 10*cm, 10*cm);
// Avoid complex boolean solids, many divisions
```

---

### Memory Usage

**Per process instance:**
- Ghost step: ~500 bytes
- Navigator: ~2 KB
- State variables: ~200 bytes

**Thread scaling:**
- Each worker thread has independent process instances
- N threads → N × memory usage

**Typical:** 10 MB for 10 parallel worlds × 10 threads

---

## Common Pitfalls

### 1. Material Switching by Default

**Problem:** `SetLayeredMaterialFlag()` defaults to `true` in some versions.

**Impact:** Physics affected unintentionally.

**Solution:**
```cpp
proc->SetLayeredMaterialFlag(false);  // Explicitly disable if only scoring
// Or better: use G4ParallelWorldScoringProcess instead
```

---

### 2. Process Ordering

**Problem:** Parallel world process after transportation.

**Impact:** Step already completed, parallel world not consulted.

**Solution:**
```cpp
// AlongStep: Put BEFORE transportation (ordering = 1)
pmanager->SetProcessOrdering(proc, idxAlongStep, 1);

// PostStep: Put early (ordering = 1 or 2)
pmanager->SetProcessOrdering(proc, idxPostStep, 1);
```

---

### 3. Parallel World Not Registered

**Error:**
```
G4Exception: Cannot find parallel world 'MyWorld'
```

**Solution:**
```cpp
// In main(), before Initialize()
detectorConstruction->RegisterParallelWorld(
    new MyParallelWorld("MyWorld")  // Name must match SetParallelWorld()
);
```

---

## Advanced Features

### Multi-Navigator Coordination

`G4PathFinder` orchestrates navigation:

```cpp
// Internally, AlongStepGPIL calls:
G4double step = fPathFinder->ComputeStep(
    fFieldTrack,          // Current position/direction
    currentMinimumStep,   // Step limit from other processes
    fNavigatorID,         // This navigator's ID
    // ...
);
```

`G4PathFinder`:
- Calls all navigators in parallel
- Returns minimum step limit
- Updates all touchables
- Handles field propagation in both worlds

---

### Sensitive Detector Invocation

**When:** At boundary crossings or within sensitive volumes.

**How:** Ghost step passed to SD:

```cpp
// In AlongStepDoIt (simplified):
if (fGhostNavigator->IsStepInVolume()) {
    G4VSensitiveDetector* sd = fNewGhostTouchable->GetVolume()
                                                 ->GetLogicalVolume()
                                                 ->GetSensitiveDetector();
    if (sd) {
        sd->Hit(fGhostStep);  // Ghost step, not true step!
    }
}
```

Sensitive detector receives:
- `fGhostStep` with parallel world geometry
- Pre/post-step points with parallel world touchables
- Same energy deposit, step length as true step
- Different volume hierarchy

---

## Comparison with G4ParallelWorldScoringProcess

| Feature | G4ParallelWorldProcess | G4ParallelWorldScoringProcess |
|---------|----------------------|------------------------------|
| **Process Type** | `fParallel` | `fParameterisation` |
| **Material Switching** | Optional (via flag) | No (not supported) |
| **Region Switching** | Yes (with materials) | No |
| **Layered Materials** | Yes | No |
| **Scoring** | Yes | Yes |
| **Physics Impact** | Possible (if flag set) | Never |
| **Use Case** | Biasing, scoring | Pure scoring only |
| **Complexity** | Higher | Lower |
| **Performance** | Slightly slower | Slightly faster |

**Recommendation:**
- Use `G4ParallelWorldProcess` for **importance biasing** or **material override**
- Use `G4ParallelWorldScoringProcess` for **pure scoring**

---

## See Also

- [G4ParallelWorldScoringProcess](./g4parallelworldscoringprocess.md) - Simplified scoring-only version
- [G4ParallelWorldProcessStore](./g4parallelworldprocessstore.md) - Process registry
- [Scoring Sub-Module Overview](../index.md) - Architecture and concepts
- G4PathFinder - Multi-world navigation coordinator
- G4Navigator - Single-world navigation

**External Documentation:**
- Geant4 User's Guide: Parallel Geometries
- Application Developer's Guide: Creating Parallel Worlds
