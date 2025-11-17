# G4ParallelWorldScoringProcess

**Pure scoring process for parallel worlds - no material switching**

::: tip Quick Reference
**Header:** `source/processes/scoring/include/G4ParallelWorldScoringProcess.hh`
**Source:** `source/processes/scoring/src/G4ParallelWorldScoringProcess.cc`
**Inherits:** `G4VProcess`
**Process Type:** `fParameterisation`
**Author:** M. Asai (SLAC), 2010
:::

## Purpose

`G4ParallelWorldScoringProcess` provides **non-invasive scoring** through parallel world navigation:

1. **Parallel geometry navigation** - Tracks particles through independent geometry
2. **Step limitation** - Limits steps at parallel world boundaries
3. **Sensitive detector invocation** - Calls SDs in parallel world volumes
4. **No physics modification** - Never affects materials, cross-sections, or interactions

This is the **simplified, scoring-only** version of `G4ParallelWorldProcess`. It cannot switch materials and is lighter weight. Use this when you only need to collect data without affecting physics.

**Key Difference from G4ParallelWorldProcess:**
- **No material switching** - Materials always come from mass world
- **No region override** - Production cuts from mass world
- **Process type** `fParameterisation` instead of `fParallel`
- **Simpler implementation** - Fewer features, slightly better performance

---

## Class Declaration

**File:** Lines 52-128 in `source/processes/scoring/include/G4ParallelWorldScoringProcess.hh`

```cpp
class G4ParallelWorldScoringProcess : public G4VProcess
{
  public:
    // Construction
    G4ParallelWorldScoringProcess(const G4String& processName = "ParaWorldScore",
                                  G4ProcessType theType = fParameterisation);
    ~G4ParallelWorldScoringProcess() override;

    // Parallel world setup
    void SetParallelWorld(G4String parallelWorldName);
    void SetParallelWorld(G4VPhysicalVolume* parallelWorld);

    // Particle applicability
    G4bool IsAtRestRequired(G4ParticleDefinition* partDef);

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
    G4double PostStepGetPhysicalInteractionLength(const G4Track& track,
                                                  G4double previousStepSize,
                                                  G4ForceCondition* condition) override;
    G4VParticleChange* PostStepDoIt(const G4Track&, const G4Step&) override;

    // Debugging
    void Verbose(const G4Step&) const;

  private:
    // Ghost step construction
    void CopyStep(const G4Step& step);

    // Ghost step
    G4Step* fGhostStep;
    G4StepPoint* fGhostPreStepPoint;
    G4StepPoint* fGhostPostStepPoint;

    // Particle changes (always dummy - no physics modification)
    G4VParticleChange aDummyParticleChange;
    G4ParticleChange xParticleChange;

    // Navigation infrastructure
    G4TransportationManager* fTransportationManager;
    G4PathFinder* fPathFinder;

    // Ghost world navigation
    G4String fGhostWorldName;
    G4VPhysicalVolume* fGhostWorld;
    G4Navigator* fGhostNavigator{nullptr};
    G4int fNavigatorID{-1};
    G4TouchableHandle fOldGhostTouchable;
    G4TouchableHandle fNewGhostTouchable;
    G4FieldTrack fFieldTrack;
    G4double fGhostSafety;
    G4bool fOnBoundary;
};
```

---

## Key Methods

### Constructor/Destructor

#### `G4ParallelWorldScoringProcess()`
**Declaration:** Lines 56-57 in header

```cpp
G4ParallelWorldScoringProcess(const G4String& processName = "ParaWorldScore",
                              G4ProcessType theType = fParameterisation);
```

**Parameters:**
- `processName` - Name for this process instance (default: "ParaWorldScore")
- `theType` - Process type classification (default: `fParameterisation`)

**Note:** Process type is `fParameterisation`, **not** `fParallel` like `G4ParallelWorldProcess`.

**Initialization:**
- Sets up navigation infrastructure
- Allocates ghost step and step points
- Initializes dummy particle changes (no actual changes)

**Usage:**
```cpp
G4ParallelWorldScoringProcess* scoringProc =
    new G4ParallelWorldScoringProcess("DoseScoring");
scoringProc->SetParallelWorld("DoseMesh");
```

---

### Parallel World Configuration

#### `SetParallelWorld(G4String)`
**Declaration:** Line 64 in header

```cpp
void SetParallelWorld(G4String parallelWorldName);
```

**Purpose:** Associate this process with a named parallel world.

**Parameters:**
- `parallelWorldName` - Name of parallel world (must match registered parallel world)

**Behavior:**
- Stores world name
- Navigator created automatically when tracking starts
- Must be called before `G4RunManager::Initialize()`

**Usage:**
```cpp
scoringProc->SetParallelWorld("ScoringMesh");
// Name must match parallel world registered in detector construction
```

---

#### `SetParallelWorld(G4VPhysicalVolume*)`
**Declaration:** Line 65 in header

```cpp
void SetParallelWorld(G4VPhysicalVolume* parallelWorld);
```

**Purpose:** Directly set parallel world volume.

**Parameters:**
- `parallelWorld` - Pointer to parallel world top physical volume

**Usage:** Less common than string version.

---

### Process Interface Implementation

#### `StartTracking()`
**Declaration:** Line 72 in header

```cpp
void StartTracking(G4Track*) override;
```

**Purpose:** Initialize parallel world navigation for new track.

**Behavior:**
- Locates particle in parallel world
- Initializes ghost navigator
- Sets initial touchable
- Resets boundary flag and safety

**Called by:** Tracking manager at track start.

---

#### `AlongStepGetPhysicalInteractionLength()`
**Declaration:** Lines 86-87 in header

```cpp
G4double AlongStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& proposedSafety,
    G4GPILSelection* selection
) override;
```

**Purpose:** Compute step limit imposed by parallel world boundaries.

**Algorithm:**
1. Check safety (optimization: skip if far from boundaries)
2. Call `G4PathFinder::ComputeStep()` for parallel navigation
3. Return parallel world's step limit

**Returns:**
- Step length to next parallel world boundary
- `DBL_MAX` if no boundary within current minimum step

**Side Effects:**
- Updates `proposedSafety` with distance to nearest boundary
- Sets `selection` if parallel world limits the step

**Performance:**
- Called every step for every particle
- Safety check avoids expensive navigation when possible

---

#### `AlongStepDoIt()`
**Declaration:** Line 89 in header

```cpp
G4VParticleChange* AlongStepDoIt(const G4Track& track, const G4Step& step) override;
```

**Purpose:** Execute parallel world navigation and invoke sensitive detectors.

**Algorithm:**
1. Copy true step to ghost step (preserving geometry info from mass world)
2. Perform parallel world navigation to post-step point
3. Update parallel world touchables
4. If in parallel volume with sensitive detector:
   - Invoke SD with ghost step
5. Return dummy particle change (**no physics modification**)

**Returns:**
- `aDummyParticleChange` - Always! This process never modifies physics.

**Scoring:**
- Ghost step has parallel world geometry (volumes, touchables)
- Ghost step has same physical quantities (energy, position, momentum)
- Sensitive detectors score using parallel world volume hierarchy

**Key Point:** Unlike `G4ParallelWorldProcess`, **never** switches materials. Physics completely unaffected.

---

#### `PostStepGetPhysicalInteractionLength()`
**Declaration:** Lines 95-96 in header

```cpp
G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition
) override;
```

**Purpose:** Handle discrete actions at parallel world boundaries.

**Returns:**
- `DBL_MAX` (no discrete interaction)
- Sets `condition` to `Forced` at boundaries (ensures SD call)

**Usage:** Ensures sensitive detectors invoked at boundary crossings.

---

#### `PostStepDoIt()`
**Declaration:** Line 98 in header

```cpp
G4VParticleChange* PostStepDoIt(const G4Track& track, const G4Step& step) override;
```

**Purpose:** Handle post-step actions (mainly SD invocation at boundaries).

**Behavior:**
- Updates parallel world location
- Invokes sensitive detectors if needed
- Returns dummy particle change

**Returns:** `aDummyParticleChange` (no physics modification)

---

### AtRest Methods

#### `IsAtRestRequired()`
**Declaration:** Line 66 in header

```cpp
G4bool IsAtRestRequired(G4ParticleDefinition* partDef);
```

**Purpose:** Determine if at-rest processing needed for this particle.

**Returns:**
- `true` if particle can come to rest AND parallel world has sensitive detectors
- `false` otherwise

**Usage:** Process manager optimization - skip at-rest if not needed.

---

#### `AtRestGetPhysicalInteractionLength()`
**Declaration:** Line 78 in header

```cpp
G4double AtRestGetPhysicalInteractionLength(
    const G4Track& track,
    G4ForceCondition* condition
) override;
```

**Purpose:** Enable sensitive detector calls for at-rest particles.

**Returns:** `DBL_MAX` (no actual interaction, just SD invocation)

**Example:** Score stopped muon decays in parallel world volume.

---

#### `AtRestDoIt()`
**Declaration:** Line 80 in header

```cpp
G4VParticleChange* AtRestDoIt(const G4Track& track, const G4Step& step) override;
```

**Purpose:** Invoke sensitive detectors for at-rest particles.

**Returns:** Dummy particle change (no physics modification)

---

### Debugging

#### `Verbose()`
**Declaration:** Line 100 in header

```cpp
void Verbose(const G4Step& step) const;
```

**Purpose:** Print debugging information about parallel world navigation.

**Output:**
- Current position in mass and parallel worlds
- Touchable information
- Step length and safety
- Boundary crossing status

**Usage:**
```cpp
// In your code (requires recompilation with verbose flag)
#ifdef G4VERBOSE
if (verboseLevel > 1) {
    scoringProc->Verbose(step);
}
#endif
```

---

## Data Members

### Ghost Step

**Lines 106-108 in header**

```cpp
G4Step* fGhostStep;                    // Parallel world step
G4StepPoint* fGhostPreStepPoint;       // Entry point
G4StepPoint* fGhostPostStepPoint;      // Exit point
```

**Purpose:** Step information for parallel world, passed to sensitive detectors.

**Content:**
- Same step length, energy deposit as true step
- Different volume hierarchy (parallel world)
- Different touchables (parallel world navigation)

---

### Particle Changes

**Lines 110-111 in header**

```cpp
G4VParticleChange aDummyParticleChange;  // Returned always (no changes)
G4ParticleChange xParticleChange;        // Unused (kept for consistency)
```

**Purpose:**
- `aDummyParticleChange` - Always returned, never modified
- Ensures process has no physics impact

**Note:** `xParticleChange` exists but is never used (unlike `G4ParallelWorldProcess` which uses it for material switching).

---

### Navigation Infrastructure

**Lines 113-114 in header**

```cpp
G4TransportationManager* fTransportationManager;  // Access to navigators
G4PathFinder* fPathFinder;                        // Multi-world coordinator
```

**Purpose:** Core navigation services.

- `fTransportationManager` - Singleton managing all navigators
- `fPathFinder` - Coordinates navigation through mass + parallel worlds

---

### Ghost World State

**Lines 118-127 in header**

```cpp
G4String fGhostWorldName;               // Parallel world name
G4VPhysicalVolume* fGhostWorld;         // Top volume
G4Navigator* fGhostNavigator{nullptr};  // Dedicated navigator
G4int fNavigatorID{-1};                 // PathFinder index
G4TouchableHandle fOldGhostTouchable;   // Previous location
G4TouchableHandle fNewGhostTouchable;   // Current location
G4FieldTrack fFieldTrack;               // Field propagation
G4double fGhostSafety;                  // Distance to boundary
G4bool fOnBoundary;                     // At boundary?
```

**Purpose:** Maintains parallel world navigation state for current track.

---

## Usage Patterns

### Basic Scoring Mesh

```cpp
// In physics list
#include "G4ParallelWorldScoringProcess.hh"

void MyPhysicsList::ConstructParallel() {
    // Create scoring process
    G4ParallelWorldScoringProcess* scoringProcess =
        new G4ParallelWorldScoringProcess("ScoringProcess");
    scoringProcess->SetParallelWorld("ScoringMesh");

    // Add to all particles
    auto particleIterator = GetParticleIterator();
    particleIterator->reset();

    while((*particleIterator)()) {
        G4ParticleDefinition* particle = particleIterator->value();
        G4ProcessManager* pmanager = particle->GetProcessManager();

        // Add as AlongStep and PostStep
        pmanager->AddProcess(scoringProcess);
        pmanager->SetProcessOrdering(scoringProcess, idxAlongStep, 1);
        pmanager->SetProcessOrdering(scoringProcess, idxPostStep, 1);
    }
}
```

---

### Multiple Scoring Meshes

```cpp
void MyPhysicsList::ConstructParallel() {
    // Dose scoring mesh
    G4ParallelWorldScoringProcess* doseScoring =
        new G4ParallelWorldScoringProcess("DoseScoring");
    doseScoring->SetParallelWorld("DoseMesh");

    // Flux scoring mesh
    G4ParallelWorldScoringProcess* fluxScoring =
        new G4ParallelWorldScoringProcess("FluxScoring");
    fluxScoring->SetParallelWorld("FluxMesh");

    // Add both to particles
    auto particleIterator = GetParticleIterator();
    particleIterator->reset();

    while((*particleIterator)()) {
        G4ParticleDefinition* particle = particleIterator->value();
        G4ProcessManager* pmanager = particle->GetProcessManager();

        // Order matters - dose first, flux second
        pmanager->AddProcess(doseScoring);
        pmanager->SetProcessOrdering(doseScoring, idxAlongStep, 1);
        pmanager->SetProcessOrdering(doseScoring, idxPostStep, 1);

        pmanager->AddProcess(fluxScoring);
        pmanager->SetProcessOrdering(fluxScoring, idxAlongStep, 2);
        pmanager->SetProcessOrdering(fluxScoring, idxPostStep, 2);
    }
}
```

**Result:** Independent scoring in two different parallel geometries.

---

### Particle-Specific Scoring

```cpp
void MyPhysicsList::ConstructParallel() {
    G4ParallelWorldScoringProcess* scoringProcess =
        new G4ParallelWorldScoringProcess("ElectronScoring");
    scoringProcess->SetParallelWorld("ElectronMesh");

    // Only add to electrons and positrons
    G4ProcessManager* eMinus_pmanager =
        G4Electron::Definition()->GetProcessManager();
    eMinus_pmanager->AddProcess(scoringProcess);
    eMinus_pmanager->SetProcessOrdering(scoringProcess, idxAlongStep, 1);
    eMinus_pmanager->SetProcessOrdering(scoringProcess, idxPostStep, 1);

    G4ProcessManager* ePlus_pmanager =
        G4Positron::Definition()->GetProcessManager();
    ePlus_pmanager->AddProcess(scoringProcess);
    ePlus_pmanager->SetProcessOrdering(scoringProcess, idxAlongStep, 1);
    ePlus_pmanager->SetProcessOrdering(scoringProcess, idxPostStep, 1);
}
```

**Benefit:** Reduced overhead for particles that don't need scoring.

---

### Using with G4ParallelWorldPhysics Helper

```cpp
#include "G4ParallelWorldPhysics.hh"

MyPhysicsList::MyPhysicsList() {
    // ... other physics ...

    // Automatic setup - uses G4ParallelWorldScoringProcess internally
    RegisterPhysics(new G4ParallelWorldPhysics("ScoringWorld", false));
    //                                                          ^^^^^ false = no layered materials
}
```

**Note:** `G4ParallelWorldPhysics` with `layeredMaterialFlag = false` uses `G4ParallelWorldScoringProcess`.

---

## Comparison with G4ParallelWorldProcess

| Feature | G4ParallelWorldScoringProcess | G4ParallelWorldProcess |
|---------|------------------------------|------------------------|
| **Process Type** | `fParameterisation` | `fParallel` |
| **Material Switching** | Not available | Optional (via `SetLayeredMaterialFlag()`) |
| **Region Override** | No | Yes (with materials) |
| **Physics Impact** | **Never** | Possible (if flag set) |
| **Use Case** | **Pure scoring only** | Biasing, material override, scoring |
| **Methods** | No `SetLayeredMaterialFlag()` | Has `SetLayeredMaterialFlag()` |
| **Performance** | Slightly faster | Slightly slower |
| **Complexity** | Simpler | More features |

**When to Use Each:**

**Use G4ParallelWorldScoringProcess:**
- Pure scoring (dose, flux, spectrum)
- No physics modification desired
- Multiple independent scoring meshes
- Simpler implementation

**Use G4ParallelWorldProcess:**
- Importance biasing needed
- Material override for variance reduction
- Region-based splitting/killing
- Combined scoring and biasing

---

## Performance Considerations

### Navigation Overhead

**Cost per parallel world:**
- ~10-20% slowdown for simple geometries
- ~20-30% slowdown for complex geometries

**Mitigation:**
```cpp
// Use simple scoring volumes
G4Box* scoreBox = new G4Box("Score", 10*cm, 10*cm, 10*cm);
// Avoid complex boolean solids, many replicas in parallel world
```

---

### Particle Selection

**Optimization:** Only add process to particles that need scoring.

```cpp
// Bad: Add to all particles including optical photons
while((*particleIterator)()) {
    pmanager->AddProcess(scoringProcess);  // Even optical photons!
}

// Good: Only particles of interest
if (particle->GetParticleName() == "gamma" ||
    particle->GetParticleName() == "e-" ||
    particle->GetParticleName() == "e+") {
    pmanager->AddProcess(scoringProcess);
}
```

**Benefit:** Reduces overhead for particles that don't contribute to scoring.

---

### Multiple Parallel Worlds

**Impact:** Each additional parallel world adds ~10-20% overhead.

**Strategy:**
```cpp
// Prefer: Single parallel world with multiple scoring volumes/SDs
RegisterPhysics(new G4ParallelWorldPhysics("ScoringWorld"));
// Within "ScoringWorld": multiple logical volumes, each with different SD

// Avoid: Many parallel worlds for similar purposes
RegisterPhysics(new G4ParallelWorldPhysics("DoseWorld"));
RegisterPhysics(new G4ParallelWorldPhysics("FluxWorld"));
RegisterPhysics(new G4ParallelWorldPhysics("SpectrumWorld"));
```

---

## Thread Safety

### Thread-Local Instances

**Behavior:**
- Each worker thread has independent process instances
- No shared state between threads
- Parallel world navigation is thread-local

**Implication:** Safe for multi-threading by design.

---

### Sensitive Detector Thread Safety

**Important:** Your sensitive detector **must** be thread-safe.

```cpp
// Thread-safe scoring using G4THitsMap
#include "G4MultiFunctionalDetector.hh"
#include "G4PSEnergyDeposit.hh"

G4MultiFunctionalDetector* scorer =
    new G4MultiFunctionalDetector("Scorer");
scorer->RegisterPrimitive(new G4PSEnergyDeposit("Edep"));
// G4PSEnergyDeposit uses G4THitsMap - automatically thread-safe

logicVolume->SetSensitiveDetector(scorer);
```

**Automatic merging:** Geant4 merges `G4THitsMap` from worker threads at end of run.

---

## Common Pitfalls

### 1. Parallel World Name Mismatch

**Error:**
```
G4Exception: Cannot find parallel world 'MyWorld'
```

**Cause:** Name in `SetParallelWorld()` doesn't match registered parallel world.

**Fix:**
```cpp
// In main() - register parallel world
detectorConstruction->RegisterParallelWorld(
    new MyScoringWorld("ScoringMesh")  // Name here
);

// In physics list
scoringProc->SetParallelWorld("ScoringMesh");  // Must match!
```

---

### 2. Wrong Process for Material Switching

**Problem:** Trying to enable material switching with `G4ParallelWorldScoringProcess`.

**Error:** No `SetLayeredMaterialFlag()` method exists!

**Solution:**
```cpp
// If material switching needed, use full process:
G4ParallelWorldProcess* proc = new G4ParallelWorldProcess("Biasing");
proc->SetLayeredMaterialFlag(true);

// For pure scoring, use scoring process:
G4ParallelWorldScoringProcess* scoreProc =
    new G4ParallelWorldScoringProcess("Scoring");
// No material switching available
```

---

### 3. Process Ordering Issues

**Problem:** Parallel world process added after transportation.

**Impact:** Steps not limited by parallel world boundaries.

**Fix:**
```cpp
// Correct ordering - BEFORE transportation (ordering index = 1)
pmanager->SetProcessOrdering(scoringProcess, idxAlongStep, 1);
pmanager->SetProcessOrdering(scoringProcess, idxPostStep, 1);

// Transportation typically at index 0 or higher
```

---

### 4. Forgetting to Call SetParallelWorld()

**Symptom:** Process registered but parallel world never used.

**Solution:**
```cpp
G4ParallelWorldScoringProcess* proc =
    new G4ParallelWorldScoringProcess("Scoring");
proc->SetParallelWorld("ScoringMesh");  // Don't forget this!
```

---

## Advanced Usage

### Accessing Ghost Step Information

The ghost step contains parallel world geometry:

```cpp
// In your sensitive detector
G4bool MyScoringSD::ProcessHits(G4Step* step, G4TouchableHistory* touchable) {
    // This is the GHOST step (not mass world step)

    // Parallel world volume info
    G4String volName = touchable->GetVolume()->GetName();
    G4int copyNo = touchable->GetReplicaNumber();

    // Physical quantities (same as mass world)
    G4double edep = step->GetTotalEnergyDeposit();
    G4ThreeVector pos = step->GetPreStepPoint()->GetPosition();

    // Score in parallel world volume
    fEnergyMap[copyNo] += edep;

    return true;
}
```

---

### Combining with Other Processes

Parallel world scoring works alongside all physics processes:

```cpp
// Physics processes in mass world
RegisterPhysics(new G4EmStandardPhysics());
RegisterPhysics(new G4HadronPhysicsFTFP_BERT());
RegisterPhysics(new G4DecayPhysics());

// Parallel world scoring (no interference)
RegisterPhysics(new G4ParallelWorldPhysics("ScoringMesh"));

// Result: Physics in mass world, scoring in parallel world
```

**Key Point:** Scoring process **never** modifies physics, so it's completely compatible with any physics list.

---

## Debugging

### Enable Verbose Output

```cpp
// Set verbose level (requires recompilation with G4VERBOSE)
scoringProcess->SetVerboseLevel(2);

// In your code
#ifdef G4VERBOSE
if (GetVerboseLevel() > 1) {
    Verbose(step);  // Print navigation details
}
#endif
```

---

### Check Process Registration

```cpp
// Verify process added to particle
G4ProcessManager* pmanager = particle->GetProcessManager();
G4ProcessVector* procList = pmanager->GetProcessList();

for (size_t i = 0; i < procList->size(); ++i) {
    G4cout << "Process " << i << ": "
           << (*procList)[i]->GetProcessName()
           << G4endl;
}
```

---

## Summary

`G4ParallelWorldScoringProcess` provides:

**Strengths:**
- **Pure scoring** - Never affects physics
- **Simple** - Fewer features than `G4ParallelWorldProcess`
- **Performance** - Slightly faster than full process
- **Safe** - No risk of unintended physics changes

**Limitations:**
- **No material switching** - Cannot override materials
- **No region override** - Cannot change production cuts
- **Scoring only** - Not suitable for biasing

**Best For:**
- Dose meshes
- Flux tallies
- Spectrum scoring
- Multiple independent scoring regions
- When physics accuracy is paramount

**Avoid When:**
- Importance biasing needed → Use `G4ParallelWorldProcess`
- Material override required → Use `G4ParallelWorldProcess`
- Variance reduction desired → Use `G4ParallelWorldProcess`

---

## See Also

- [G4ParallelWorldProcess](./g4parallelworldprocess.md) - Full-featured version with material switching
- [G4ParallelWorldProcessStore](./g4parallelworldprocessstore.md) - Process registry
- [Scoring Sub-Module Overview](../index.md) - Architecture and concepts
- G4MultiFunctionalDetector - Thread-safe scoring infrastructure
- G4THitsMap - Thread-safe hit collection

**External Documentation:**
- Geant4 User's Guide: Scoring
- Application Developer's Guide: Parallel Geometries
- Examples: extended/parallel
