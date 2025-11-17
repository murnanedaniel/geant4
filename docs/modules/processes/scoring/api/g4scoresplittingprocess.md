# G4ScoreSplittingProcess

**Splits particle steps across voxelized phantoms for accurate dose scoring**

::: tip Quick Reference
**Header:** `source/processes/scoring/include/G4ScoreSplittingProcess.hh`
**Source:** `source/processes/scoring/src/G4ScoreSplittingProcess.cc`
**Inherits:** `G4VProcess`
**Process Type:** `fParameterisation`
**Authors:** J. Apostolakis, M. Asai (SLAC), 2010
:::

## Purpose

`G4ScoreSplittingProcess` solves the **voxel scoring problem** in regular voxelized geometries (CT-based phantoms):

**The Problem:**
- Particle steps may cross **multiple voxels** (10, 50, 100+ voxels)
- Energy loss varies across voxels (different materials, decreasing kinetic energy)
- Simple scoring at mid-step point → **incorrect dose distribution**

**The Solution:**
- **Split single step** into sub-steps, one per voxel
- **Distribute energy** accounting for:
  - Material-dependent dE/dx in each voxel
  - Particle energy loss along path
  - Multiple scattering corrections
- **Invoke sensitive detector** for each sub-step
- **Accurate voxel-level dose** for medical physics applications

**Key Features:**
1. Works in **mass world** (not parallel world)
2. Requires **regular voxelized geometry** (`G4PhantomParameterisation`)
3. Uses **G4EnergySplitter** for energy distribution
4. **Iterative refinement** for accuracy (configurable)
5. **No physics modification** - scoring only

---

## Class Declaration

**File:** Lines 54-123 in `source/processes/scoring/include/G4ScoreSplittingProcess.hh`

```cpp
class G4ScoreSplittingProcess : public G4VProcess
{
  public:
    // Construction
    G4ScoreSplittingProcess(const G4String& processName = "ScoreSplittingProc",
                            G4ProcessType theType = fParameterisation);
    ~G4ScoreSplittingProcess() override;

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
    // Sub-step creation
    G4TouchableHistory* CreateTouchableForSubStep(G4int newVoxelNum,
                                                  G4ThreeVector newPosition);
    void CopyStepStart(const G4Step& step);

    // Split step
    G4Step* fSplitStep;
    G4StepPoint* fSplitPreStepPoint;
    G4StepPoint* fSplitPostStepPoint;

    // Particle changes
    G4VParticleChange dummyParticleChange;
    G4ParticleChange xParticleChange;

    // Touchables for sub-steps
    G4TouchableHandle fOldTouchableH;       // Current sub-step
    G4TouchableHandle fNewTouchableH;       // Next sub-step

    // Full step touchables (memory)
    G4TouchableHandle fInitialTouchableH;   // Step start
    G4TouchableHandle fFinalTouchableH;     // Step end

    // Energy splitting engine
    G4EnergySplitter* fpEnergySplitter;
};
```

---

## Key Concepts

### Voxel Scoring Problem

**Scenario:** Particle crosses multiple voxels in single step.

```
┌─────┬─────┬─────┬─────┬─────┐
│ V1  │ V2  │ V3  │ V4  │ V5  │  Voxels (1mm each)
│Water│Bone │Lung │Bone │Water│  Different materials
└─────┴─────┴─────┴─────┴─────┘
   ↑                         ↑
   Start                    End
   <-------- 5mm step -------->

Total energy deposit: 100 keV

Without splitting:
  - Score 100 keV at mid-step (voxel 3)
  - Voxels 1,2,4,5 get zero ❌

With splitting:
  - V1: 15 keV (water, high energy)
  - V2: 25 keV (bone, high dE/dx)
  - V3: 25 keV (lung, low density)
  - V4: 25 keV (bone, lower energy)
  - V5: 10 keV (water, lowest energy)
  - Accurate distribution! ✓
```

---

### Energy Splitting Algorithm

**File:** `source/processes/scoring/include/private/G4EnergySplitter.hh`

**Steps:**

1. **Get voxel crossings** from `G4RegularNavigationHelper`
   - List of (voxelID, geometricStepLength) pairs

2. **Iteration 0** (if configured): Simple proportional split
   ```
   E_voxel = E_total × (stepLength_voxel / stepLength_total)
   ```

3. **Iteration 1**: Energy-loss weighted split
   - Calculate dE/dx in each voxel material
   - Distribute energy accounting for decreasing particle energy
   - Apply true/geometric step length correction

4. **Iteration 2+**: Refine with corrected step lengths
   - Use improved energy estimates for dE/dx calculation
   - Renormalize to conserve total energy

**Default:** 2 iterations (good accuracy, reasonable speed)

**Configuration:**
```cpp
G4EnergySplitter* splitter = new G4EnergySplitter();
splitter->SetNIterations(2);  // Default, ~1% error
// splitter->SetNIterations(1);  // Faster, ~5% error
// splitter->SetNIterations(0);  // Fastest, ~20% error (proportional only)
```

---

## Key Methods

### Constructor/Destructor

#### `G4ScoreSplittingProcess()`
**Declaration:** Lines 58-59 in header

```cpp
G4ScoreSplittingProcess(const G4String& processName = "ScoreSplittingProc",
                        G4ProcessType theType = fParameterisation);
```

**Parameters:**
- `processName` - Process name (default: "ScoreSplittingProc")
- `theType` - Process type (default: `fParameterisation`)

**Initialization:**
- Creates `G4EnergySplitter` instance
- Allocates split step and step points
- Initializes touchable handles

**Usage:**
```cpp
G4ScoreSplittingProcess* splitProc = new G4ScoreSplittingProcess("VoxelSplitting");
// Add to charged particles only (splitting handles dE/dx)
```

---

#### `~G4ScoreSplittingProcess()`

**Cleanup:**
- Deletes `G4EnergySplitter`
- Deallocates split step

---

### Process Interface Implementation

#### `StartTracking()`
**Declaration:** Line 66 in header

```cpp
void StartTracking(G4Track*) override;
```

**Purpose:** Initialize for new track.

**Behavior:**
- Saves initial touchable
- Resets split step state

---

#### `AlongStepGetPhysicalInteractionLength()`
**Declaration:** Lines 80-81 in header

```cpp
G4double AlongStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4double currentMinimumStep,
    G4double& proposedSafety,
    G4GPILSelection* selection
) override;
```

**Purpose:** This process does **not** limit steps along step.

**Returns:** `DBL_MAX` (no step limitation)

**Note:** Regular navigation limits steps at voxel boundaries; this process just splits afterward.

---

#### `AlongStepDoIt()`
**Declaration:** Line 83 in header

```cpp
G4VParticleChange* AlongStepDoIt(const G4Track& track, const G4Step& step) override;
```

**Purpose:** Currently not used for splitting.

**Returns:** Dummy particle change

**Note:** Main splitting happens in `PostStepDoIt()`.

---

#### `PostStepGetPhysicalInteractionLength()`
**Declaration:** Lines 89-90 in header

```cpp
G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition
) override;
```

**Purpose:** Force post-step action for splitting.

**Returns:**
- `DBL_MAX`
- Sets `condition` to `Forced` if step crossed voxels

**Trigger:** Ensures `PostStepDoIt()` called after each step in phantom.

---

#### `PostStepDoIt()`
**Declaration:** Line 92 in header

```cpp
G4VParticleChange* PostStepDoIt(const G4Track& track, const G4Step& step) override;
```

**Purpose:** **Main method** - perform energy splitting and invoke sensitive detectors.

**Algorithm:**

1. **Check if in phantom:**
   - Uses `G4RegularNavigationHelper::GetStepLengths()`
   - If empty or single voxel → no splitting needed → return

2. **Split energy:**
   ```cpp
   G4int nSplit = fpEnergySplitter->SplitEnergyInVolumes(&step);
   ```
   - Returns number of sub-steps (voxels crossed)

3. **Create sub-steps:**
   ```cpp
   for (G4int i = 0; i < nSplit; ++i) {
       // Get voxel ID, step length, energy deposit
       fpEnergySplitter->GetLengthAndEnergyDeposited(i, voxelID,
                                                     stepLength, edep);

       // Create touchable for this voxel
       G4TouchableHistory* touchable =
           CreateTouchableForSubStep(voxelID, position);

       // Update split step
       fSplitStep->SetStepLength(stepLength);
       fSplitStep->SetTotalEnergyDeposit(edep);
       fSplitPreStepPoint->SetTouchable(touchable);
       fSplitPostStepPoint->SetTouchable(touchable);

       // Invoke sensitive detector
       if (SD) SD->Hit(fSplitStep);

       // Update position for next sub-step
       position += stepLength * direction;
   }
   ```

4. **Return:**
   - Dummy particle change (no physics modification)

**Implementation:** Lines 150-350 in `source/processes/scoring/src/G4ScoreSplittingProcess.cc`

---

### AtRest Methods

#### `AtRestGetPhysicalInteractionLength()`
**Declaration:** Line 72 in header

```cpp
G4double AtRestGetPhysicalInteractionLength(const G4Track&,
                                            G4ForceCondition*) override;
```

**Returns:** `DBL_MAX` (not applicable for splitting)

---

#### `AtRestDoIt()`
**Declaration:** Line 74 in header

```cpp
G4VParticleChange* AtRestDoIt(const G4Track&, const G4Step&) override;
```

**Returns:** Dummy particle change (not used)

---

### Private Methods

#### `CreateTouchableForSubStep()`
**Declaration:** Line 98 in header

```cpp
G4TouchableHistory* CreateTouchableForSubStep(G4int newVoxelNum,
                                              G4ThreeVector newPosition);
```

**Purpose:** Create touchable for a specific voxel.

**Parameters:**
- `newVoxelNum` - Voxel replica number
- `newPosition` - Position within voxel

**Returns:** Touchable pointing to the voxel's logical volume

**Behavior:**
- Creates touchable history
- Sets replica number to voxel ID
- Enables sensitive detector lookup by voxel

---

#### `CopyStepStart()`
**Declaration:** Line 102 in header

```cpp
void CopyStepStart(const G4Step& step);
```

**Purpose:** Copy original step to split step (initialization).

**Behavior:**
- Copies track, pre-step point
- Initializes split step state
- Called once per full step before sub-step loop

---

### Debugging

#### `Verbose()`
**Declaration:** Line 94 in header

```cpp
void Verbose(const G4Step& step) const;
```

**Purpose:** Print debugging information about splitting.

**Output:**
- Number of voxels crossed
- Energy per voxel
- Voxel IDs and step lengths

---

## Data Members

### Split Step

**Lines 104-106 in header**

```cpp
G4Step* fSplitStep;                    // Sub-step for each voxel
G4StepPoint* fSplitPreStepPoint;       // Sub-step entry
G4StepPoint* fSplitPostStepPoint;      // Sub-step exit
```

**Purpose:** Step passed to sensitive detector for each voxel.

**Content:**
- Touchable pointing to specific voxel
- Energy deposit for that voxel only
- Step length within that voxel
- Position at voxel boundaries

---

### Particle Changes

**Lines 108-109 in header**

```cpp
G4VParticleChange dummyParticleChange;  // Always returned
G4ParticleChange xParticleChange;       // Unused
```

**Purpose:** Process never modifies physics → dummy change always returned.

---

### Touchables

**Lines 114-119 in header**

```cpp
G4TouchableHandle fOldTouchableH;       // Previous sub-step voxel
G4TouchableHandle fNewTouchableH;       // Current sub-step voxel

G4TouchableHandle fInitialTouchableH;   // Full step start (saved)
G4TouchableHandle fFinalTouchableH;     // Full step end (saved)
```

**Purpose:**
- Sub-step touchables: Updated for each voxel
- Full step touchables: Preserved for restoration after splitting

---

### Energy Splitter

**Line 121 in header**

```cpp
G4EnergySplitter* fpEnergySplitter;     // Energy distribution engine
```

**Purpose:** Calculates energy deposit per voxel.

**Configured via:**
```cpp
fpEnergySplitter->SetNIterations(2);  // Accuracy vs speed trade-off
```

---

## Usage Patterns

### Basic Voxelized Phantom

```cpp
// In detector construction
#include "G4PhantomParameterisation.hh"
#include "G4PVParameterised.hh"

void DetectorConstruction::ConstructPhantom() {
    // Container
    G4Box* containerBox = new G4Box("Container", 20*cm, 20*cm, 20*cm);
    G4LogicalVolume* containerLog =
        new G4LogicalVolume(containerBox, air, "ContainerLog");

    // Voxel (single, replicated via parameterisation)
    G4Box* voxelBox = new G4Box("Voxel", 1*mm, 1*mm, 1*mm);
    G4LogicalVolume* voxelLog =
        new G4LogicalVolume(voxelBox, water, "VoxelLog");

    // Parameterisation
    G4PhantomParameterisation* param = new G4PhantomParameterisation();
    param->SetVoxelDimensions(1*mm, 1*mm, 1*mm);
    param->SetNoVoxels(400, 400, 400);  // 400³ = 64M voxels
    param->BuildContainerSolid(containerBox);

    // Assign materials from CT data
    ReadCTData(param);  // Your method to set materials

    // Create parameterised volume
    new G4PVParameterised("Phantom", voxelLog, containerLog,
                         kUndefined, param->GetNoVoxels(), param);

    // Attach sensitive detector
    G4SDManager* SDman = G4SDManager::GetSDMpointer();
    DoseSD* doseSD = new DoseSD("DoseSD", param->GetNoVoxels());
    SDman->AddNewDetector(doseSD);
    voxelLog->SetSensitiveDetector(doseSD);
}
```

---

### Physics List Setup

```cpp
// In physics list
#include "G4ScoreSplittingProcess.hh"

void MyPhysicsList::ConstructProcess() {
    // ... construct standard EM physics ...

    // Add score splitting
    AddScoreSplitting();
}

void MyPhysicsList::AddScoreSplitting() {
    G4ScoreSplittingProcess* splitProc =
        new G4ScoreSplittingProcess("PhantomSplitting");

    // Add to CHARGED particles only (dE/dx-based splitting)
    auto particleIterator = GetParticleIterator();
    particleIterator->reset();

    while((*particleIterator)()) {
        G4ParticleDefinition* particle = particleIterator->value();

        if (particle->GetPDGCharge() != 0) {  // Charged particles
            G4ProcessManager* pmanager = particle->GetProcessManager();

            // Add as PostStep process
            pmanager->AddProcess(splitProc);
            pmanager->SetProcessOrdering(splitProc, idxPostStep);
            // Default ordering = last (after physics processes)
        }
    }
}
```

**Why only charged particles?**
- Energy splitting uses dE/dx (continuous energy loss)
- Photons and neutrons: discrete interactions, no continuous energy loss
- For photons/neutrons: splitting still works but less accurate

---

### Sensitive Detector for Voxel Scoring

```cpp
#include "G4VSensitiveDetector.hh"
#include "G4Step.hh"
#include "G4TouchableHistory.hh"

class DoseSD : public G4VSensitiveDetector {
public:
    DoseSD(const G4String& name, G4int nVoxels)
        : G4VSensitiveDetector(name), fNVoxels(nVoxels) {
        fDoseMap.resize(nVoxels, 0.0);
    }

    G4bool ProcessHits(G4Step* step, G4TouchableHistory* touchable) override {
        // Get voxel ID from replica number
        G4int voxelID = touchable->GetReplicaNumber();

        if (voxelID < 0 || voxelID >= fNVoxels) {
            G4cerr << "Invalid voxel ID: " << voxelID << G4endl;
            return false;
        }

        // Energy deposited in THIS voxel (already split by process!)
        G4double edep = step->GetTotalEnergyDeposit();

        // Accumulate dose
        fDoseMap[voxelID] += edep;

        return true;
    }

    // Access results
    const std::vector<G4double>& GetDoseMap() const { return fDoseMap; }

private:
    G4int fNVoxels;
    std::vector<G4double> fDoseMap;  // Thread-local
};
```

**Key Points:**
- `voxelID` from replica number identifies voxel
- `edep` is already split - just accumulate
- Thread-local storage (each thread has own `fDoseMap`)
- Merge results at end of run (see multi-threading section)

---

### Configuring Energy Splitter Iterations

```cpp
// Access energy splitter (requires modification to process or subclassing)
class MyScoreSplittingProcess : public G4ScoreSplittingProcess {
public:
    MyScoreSplittingProcess(const G4String& name)
        : G4ScoreSplittingProcess(name) {
        // Configure splitter
        fpEnergySplitter->SetNIterations(3);  // More accurate, slower
    }
};

// In physics list
splitProc = new MyScoreSplittingProcess("HighAccuracySplitting");
```

**Trade-offs:**
| Iterations | Accuracy | Speed | Use Case |
|------------|----------|-------|----------|
| 0 | ~20% error | Fastest | Quick tests |
| 1 | ~5% error | Fast | General use |
| 2 | ~1% error | Default | Production runs |
| 3+ | <0.5% error | Slower | High precision |

---

## Advanced Topics

### Regular Navigation Integration

**Requirements:**
1. Geometry uses `G4PhantomParameterisation`
2. Parameterised volume has `kUndefined` axis (3D parameterisation)
3. Regular structure (constant voxel size)

**How It Works:**

`G4RegularNavigation` tracks voxel crossings during transport:

```cpp
// During step, regular navigator stores crossings
std::vector<std::pair<G4int, G4double>> crossings = {
    {voxelID₁, stepLength₁},
    {voxelID₂, stepLength₂},
    {voxelID₃, stepLength₃},
    // ...
};

// Available via helper
G4RegularNavigationHelper::Instance()->GetStepLengths();
```

`G4ScoreSplittingProcess` retrieves this information in `PostStepDoIt()` and creates sub-steps.

**Implementation:** Lines 95-96 in `source/processes/scoring/src/G4EnergySplitter.cc`

---

### Energy Conservation

**Guarantee:** Total split energy equals original step energy.

**Algorithm:**
1. Calculate energy per voxel using dE/dx
2. Sum total: `E_calc = Σ E_voxel`
3. Renormalize: `E_voxel *= (E_total / E_calc)`

**Implementation:** Lines 259-282 in `source/processes/scoring/src/G4EnergySplitter.cc`

**Result:** Energy conserved to machine precision.

---

### Multiple Scattering Corrections

For charged particles, multiple scattering affects path length:

**Geometric path ≠ True path**

```
True path (curved):     ~~~~~~~~~~~
                        /           \
Geometric path:    ────────────────────
                        Longer!
```

`G4EnergySplitter` corrects for this:

1. **Iteration 1:** Apply global true/geometric ratio
2. **Iteration 2+:** Use `G4EnergyLossForExtrapolator::TrueStepLength()`

**Implementation:** Lines 207-218 in `source/processes/scoring/src/G4EnergySplitter.cc`

**Impact:** ~1-5% difference in high-Z materials for electrons.

---

### Combining with Parallel World Scoring

You can use score splitting AND parallel world scoring:

```cpp
// Parallel world for region-based scoring
G4ParallelWorldScoringProcess* regionScoring =
    new G4ParallelWorldScoringProcess("RegionScoring");
regionScoring->SetParallelWorld("RegionMesh");

// Score splitting in voxelized phantom (mass world)
G4ScoreSplittingProcess* voxelSplitting =
    new G4ScoreSplittingProcess("VoxelSplitting");

// Add both to charged particles
G4ProcessManager* pmanager = particle->GetProcessManager();

pmanager->AddProcess(regionScoring);
pmanager->SetProcessOrdering(regionScoring, idxAlongStep, 1);
pmanager->SetProcessOrdering(regionScoring, idxPostStep, 1);

pmanager->AddProcess(voxelSplitting);
pmanager->SetProcessOrdering(voxelSplitting, idxPostStep, 2);  // After parallel
```

**Result:**
- Coarse scoring in parallel world regions
- Fine splitting in voxelized phantom
- Independent, compatible

---

## Performance Considerations

### Overhead

**Cost:** ~2-5% performance penalty compared to no splitting.

**Why so low?**
- Splitting only happens in phantom volumes
- Information already collected by `G4RegularNavigation`
- Computational cost mainly in dE/dx lookups

**Mitigation:**
```cpp
// Reduce iterations if acceptable
fpEnergySplitter->SetNIterations(1);  // ~3% faster
```

---

### Memory Usage

**Per step in phantom:**
- Energy list: N_voxels × 8 bytes
- Step length list: N_voxels × 8 bytes
- Typical: 50 voxels × 16 bytes = 800 bytes per step

**Not cumulative:** Cleared after each step.

**Phantom size:** Not a memory issue (voxel data stored in parameterisation).

---

### Scaling with Voxel Count

**Performance independent of total voxel count:**
- Only voxels crossed in single step matter
- Typical: 10-100 voxels per step
- 1M voxels vs 100M voxels: same speed per step

**Key factor:** Voxel size
- Smaller voxels → more crossings per step
- More crossings → more sub-steps → slower

**Optimal voxel size:** 1-2 mm for most applications.

---

## Thread Safety

### Thread-Local Processes

Each worker thread has independent process instance:

```cpp
// Master thread: Initialize
runManager->Initialize();  // Creates master process

// Worker threads: Clone processes
// Each thread has separate G4ScoreSplittingProcess instance
```

**Implication:** No shared state, thread-safe by design.

---

### Sensitive Detector Thread Safety

**Critical:** SD must accumulate hits in thread-local storage.

```cpp
// Thread-safe dose scoring
class DoseSD : public G4VSensitiveDetector {
private:
    std::vector<G4double> fDoseMap;  // Thread-local!

public:
    G4bool ProcessHits(G4Step* step, G4TouchableHistory* touchable) override {
        G4int voxelID = touchable->GetReplicaNumber();
        G4double edep = step->GetTotalEnergyDeposit();

        fDoseMap[voxelID] += edep;  // Safe: thread-local

        return true;
    }

    // Merging at end of run
    void Merge(const DoseSD* other) {
        for (size_t i = 0; i < fDoseMap.size(); ++i) {
            fDoseMap[i] += other->fDoseMap[i];
        }
    }
};
```

**Alternative:** Use `G4THitsMap` for automatic thread safety.

---

## Common Pitfalls

### 1. Using with Non-Phantom Geometry

**Error:**
```
G4Exception: G4EnergySplitter called for non-phantom volume
```

**Cause:** Process used with geometry that doesn't use `G4PhantomParameterisation`.

**Solution:**
```cpp
// Ensure phantom uses correct parameterisation
G4PhantomParameterisation* param = new G4PhantomParameterisation();
param->SetVoxelDimensions(1*mm, 1*mm, 1*mm);
param->SetNoVoxels(nx, ny, nz);

// Must use PVParameterised with kUndefined axis
new G4PVParameterised("Phantom", voxelLog, containerLog,
                     kUndefined,  // Important!
                     param->GetNoVoxels(), param);
```

---

### 2. Adding to All Particles

**Problem:** Adding process to neutral particles.

**Impact:** Splitting works but is less accurate (no dE/dx for photons/neutrons).

**Solution:**
```cpp
// Only add to charged particles
if (particle->GetPDGCharge() != 0) {
    pmanager->AddProcess(splitProc);
}

// For photons/neutrons: splitting not needed (discrete interactions)
```

---

### 3. Sensitive Detector Not Attached

**Symptom:** Process runs but no hits recorded.

**Cause:** Voxel logical volume has no sensitive detector.

**Solution:**
```cpp
voxelLog->SetSensitiveDetector(doseSD);  // Don't forget!
```

---

### 4. Wrong Process Ordering

**Problem:** Splitting process before physics processes.

**Impact:** Energy deposit not yet calculated.

**Solution:**
```cpp
// Put splitting LAST (default ordering)
pmanager->AddProcess(splitProc);
pmanager->SetProcessOrdering(splitProc, idxPostStep);  // Last

// Or explicitly:
pmanager->SetProcessOrdering(splitProc, idxPostStep, 9999);  // Force last
```

---

### 5. Forgetting Thread Merging

**Problem:** Multi-threading enabled but results not merged.

**Symptom:** Final dose only from master thread (zero or incomplete).

**Solution:**
```cpp
// Implement merging in run action
void RunAction::EndOfRunAction(const G4Run* run) {
    // Get SD
    G4SDManager* SDman = G4SDManager::GetSDMpointer();
    DoseSD* doseSD = static_cast<DoseSD*>(
        SDman->FindSensitiveDetector("DoseSD")
    );

    // Master thread: merge from workers
    if (IsMaster()) {
        // Merge logic here
        const G4Run* masterRun = run;
        // Access worker run data and merge
    }
}
```

**Better:** Use `G4THitsMap` which auto-merges.

---

## Comparison with Other Scoring Methods

| Method | Accuracy | Speed | Complexity | Use Case |
|--------|----------|-------|------------|----------|
| **G4ScoreSplittingProcess** | **High** (sub-voxel) | Medium | Medium | CT phantoms, medical physics |
| **Simple scoring** | Low (single voxel) | Fast | Low | Coarse geometries |
| **Parallel world scoring** | Medium | Slow | High | Independent meshes |
| **Nested parameterisation** | Medium | Medium | High | Hierarchical structures |

**Recommendation:** Use `G4ScoreSplittingProcess` for **voxelized phantoms** where accurate dose distribution is critical.

---

## Summary

`G4ScoreSplittingProcess` provides:

**Capabilities:**
- **Accurate voxel-level scoring** in regular phantoms
- **Energy splitting** with dE/dx and multiple scattering corrections
- **Iterative refinement** for configurable accuracy
- **No physics modification** - pure scoring

**Requirements:**
- `G4PhantomParameterisation` geometry
- Regular voxel structure
- Sensitive detector attached to voxel logical volume

**Best For:**
- CT-based phantoms
- Medical physics dosimetry
- Radiation therapy planning validation
- Any application with regular voxelized geometry

**Performance:**
- ~2-5% overhead
- Memory: ~1 KB per step in phantom
- Scales with voxels crossed per step, not total voxels

**Integration:**
- Works with any physics list
- Compatible with parallel world scoring
- Thread-safe (with proper SD implementation)

---

## See Also

- [G4ParallelWorldScoringProcess](./g4parallelworldscoringprocess.md) - Parallel world scoring
- [Scoring Sub-Module Overview](../index.md) - Architecture and concepts
- G4EnergySplitter - Energy distribution algorithm (private utility)
- G4RegularNavigation - Regular geometry navigation
- G4PhantomParameterisation - Voxelized phantom parameterisation

**External Documentation:**
- Geant4 User's Guide: Scoring in Regular Structures
- Medical Physics Applications Guide
- Examples: extended/medical
