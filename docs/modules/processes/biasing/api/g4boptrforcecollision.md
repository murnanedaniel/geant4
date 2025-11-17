# G4BOptrForceCollision

## Overview

`G4BOptrForceCollision` is a complete biasing operator that implements MCNP-style forced collision (interaction forcing). This operator guarantees that particles interact within a specified volume by splitting each track into two: one that is forced to interact, and one that exits without interaction. This is ideal for thin targets, gas detectors, or any situation where analog simulation would have very few interactions.

**Location:** `source/processes/biasing/generic/include/G4BOptrForceCollision.hh`

**Base Class:** `G4VBiasingOperator`

**Typical Use:** Thin detectors, gas chambers, thin foils, short path lengths

## Purpose

Force collision technique solves the problem of rare interactions in thin materials:

**Problem (Analog Simulation):**
- 1 cm gas detector
- Neutron mean free path = 10 m
- Interaction probability ~ 1%
- Need 10,000 particles for 100 interactions

**Solution (Force Collision):**
- **Every** particle contributes
- 100 particles → 100 interactions
- **100x improvement** in efficiency
- Statistically correct through weight adjustment

## Algorithm

When a particle enters the biased volume:

**1. Track Cloning:** Create two copies of the incoming track

**2. Non-Interacting Clone:**
- Travels to volume exit without interaction
- Weight: `w_non_interact = w_original × exp(-σL)`
- Contribution: Represents particles that pass through

**3. Interacting Clone:**
- Forced to interact within distance [0, L]
- Weight: `w_interact = w_original × [1 - exp(-σL)]`
- Interaction point sampled from biased distribution

Where:
- `L` = distance to volume exit
- `σ` = total cross-section (sum of all processes)
- `exp(-σL)` = non-interaction probability

**Weight Conservation:**
```
w_non_interact + w_interact = w_original × [exp(-σL) + (1 - exp(-σL))]
                              = w_original ✓
```

## Class Definition

```cpp
class G4BOptrForceCollision : public G4VBiasingOperator
{
public:
    // Constructors
    G4BOptrForceCollision(const G4String& particleToForce,
                          const G4String& name = "ForceCollision");

    G4BOptrForceCollision(const G4ParticleDefinition* particleToForce,
                          const G4String& name = "ForceCollision");

    ~G4BOptrForceCollision();

    // Lifecycle methods (called by framework)
    virtual void Configure() final;
    virtual void ConfigureForWorker() final;
    virtual void StartRun() final;
    virtual void StartTracking(const G4Track* track) final;
    virtual void EndTracking() final;

    // Called after operation applied
    virtual void OperationApplied(
        const G4BiasingProcessInterface* callingProcess,
        G4BiasingAppliedCase biasingCase,
        G4VBiasingOperation* operationApplied,
        const G4VParticleChange* particleChangeProduced) final;

    virtual void OperationApplied(
        const G4BiasingProcessInterface* callingProcess,
        G4BiasingAppliedCase biasingCase,
        G4VBiasingOperation* occurenceOperationApplied,
        G4double weightForOccurenceInteraction,
        G4VBiasingOperation* finalStateOperationApplied,
        const G4VParticleChange* particleChangeProduced) final;

protected:
    // Three mandatory methods from G4VBiasingOperator
    virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) final;

    virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) final;

    virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) final;

private:
    const G4ParticleDefinition* fParticleToBias;
    G4BOptnForceCommonTruncatedExp* fSharedForceInteractionOperation;
    std::map<const G4BiasingProcessInterface*, G4BOptnForceFreeFlight*> fFreeFlightOperations;
    G4BOptnCloning* fCloningOperation;
};
```

**Key Lines:**
- Line 59: Constructor specifies particle type to bias
- Line 65: Configure() - setup method
- Line 68: StartTracking() - initialize for new track
- Line 88: ProposeNonPhysicsBiasingOperation - handles cloning
- Line 91: ProposeOccurenceBiasingOperation - implements forcing
- Line 94: ProposeFinalStateBiasingOperation - selects which process

## Basic Usage

### Simplest Case

**For a single particle type and single volume:**

```cpp
// In DetectorConstruction::ConstructSDandField()

#include "G4BOptrForceCollision.hh"

void DetectorConstruction::ConstructSDandField()
{
    // Create force collision operator for neutrons
    G4BOptrForceCollision* forceCollision =
        new G4BOptrForceCollision("neutron", "ForceCollisionOp");

    // Attach to thin detector volume
    forceCollision->AttachTo(fGasDetectorLogical);

    G4cout << "Force collision enabled for neutrons in "
           << fGasDetectorLogical->GetName() << G4endl;
}
```

**That's it!** The operator handles everything else automatically.

### Multiple Volumes

```cpp
void DetectorConstruction::ConstructSDandField()
{
    // Single operator can be attached to multiple volumes
    G4BOptrForceCollision* forceCollision =
        new G4BOptrForceCollision("neutron");

    // Attach to multiple detectors
    forceCollision->AttachTo(fDetector1Logical);
    forceCollision->AttachTo(fDetector2Logical);
    forceCollision->AttachTo(fDetector3Logical);

    G4cout << "Force collision enabled in 3 volumes" << G4endl;
}
```

### Multiple Particle Types

```cpp
void DetectorConstruction::ConstructSDandField()
{
    // Create separate operator for each particle type
    G4BOptrForceCollision* forceNeutrons =
        new G4BOptrForceCollision("neutron", "ForceNeutrons");

    G4BOptrForceCollision* forcePhotons =
        new G4BOptrForceCollision("gamma", "ForcePhotons");

    // Attach to detector
    forceNeutrons->AttachTo(fDetectorLogical);
    forcePhotons->AttachTo(fDetectorLogical);

    G4cout << "Force collision enabled for neutrons and photons" << G4endl;
}
```

## Physics List Requirements

**Critical:** Processes must be wrapped with `G4BiasingProcessInterface`

### Wrap All Processes

```cpp
#include "G4BiasingHelper.hh"

void PhysicsList::ConstructProcess()
{
    // Standard process construction
    G4VModularPhysicsList::ConstructProcess();

    // Wrap processes for biasing
    // This wraps ALL processes for the specified particle
    G4BiasingHelper::ActivatePhysicsBiasing(
        particleManager,
        "neutron"  // Particle to bias
    );
}
```

### Manual Wrapping (More Control)

```cpp
#include "G4BiasingProcessInterface.hh"

void PhysicsList::WrapProcessesForNeutrons()
{
    // Get neutron
    G4ParticleDefinition* neutron = G4Neutron::Definition();
    G4ProcessManager* pManager = neutron->GetProcessManager();

    // Get process list
    G4ProcessVector* processList = pManager->GetProcessList();

    // Wrap each process (except transportation)
    std::vector<G4VProcess*> processesToWrap;
    for (size_t i = 0; i < processList->size(); ++i) {
        G4VProcess* process = (*processList)[i];

        // Skip transportation
        if (process->GetProcessType() == fTransportation) continue;

        processesToWrap.push_back(process);
    }

    // Create wrappers
    for (G4VProcess* process : processesToWrap) {
        // Create wrapper
        G4BiasingProcessInterface* wrapper =
            new G4BiasingProcessInterface(
                process,
                false,  // isAtRest
                true,   // isAlongStep
                true,   // isPostStep
                "biasWrapper(" + process->GetProcessName() + ")"
            );

        // Get original ordering
        G4int ord = pManager->GetProcessOrdering(process, idxPostStep);

        // Replace process with wrapper
        pManager->RemoveProcess(process);
        pManager->AddProcess(wrapper);
        pManager->SetProcessOrdering(wrapper, idxAlongStep);
        pManager->SetProcessOrdering(wrapper, idxPostStep, ord);
    }

    G4cout << "Wrapped " << processesToWrap.size()
           << " processes for neutrons" << G4endl;
}
```

## Complete Examples

### Example 1: Thin Gas Detector

**Scenario:** 1 cm argon gas detector for neutron detection

```cpp
// DetectorConstruction.hh
class DetectorConstruction : public G4VUserDetectorConstruction
{
public:
    DetectorConstruction();
    virtual ~DetectorConstruction();

    virtual G4VPhysicalVolume* Construct() override;
    virtual void ConstructSDandField() override;

private:
    G4LogicalVolume* fGasDetectorLogical;
};

// DetectorConstruction.cc
#include "G4BOptrForceCollision.hh"
#include "G4NistManager.hh"
#include "G4Box.hh"
#include "G4LogicalVolume.hh"
#include "G4PVPlacement.hh"
#include "G4SystemOfUnits.hh"

G4VPhysicalVolume* DetectorConstruction::Construct()
{
    G4NistManager* nist = G4NistManager::Instance();

    // World volume
    G4Material* air = nist->FindOrBuildMaterial("G4_AIR");
    G4Box* worldBox = new G4Box("World", 1*m, 1*m, 1*m);
    G4LogicalVolume* worldLogical =
        new G4LogicalVolume(worldBox, air, "World");
    G4VPhysicalVolume* worldPhysical =
        new G4PVPlacement(0, G4ThreeVector(), worldLogical,
                         "World", 0, false, 0);

    // Thin gas detector (1 cm Ar)
    G4Material* argon = nist->FindOrBuildMaterial("G4_Ar");
    G4Box* detectorBox = new G4Box("Detector", 10*cm, 10*cm, 0.5*cm);
    fGasDetectorLogical =
        new G4LogicalVolume(detectorBox, argon, "GasDetector");
    new G4PVPlacement(0, G4ThreeVector(0, 0, 0), fGasDetectorLogical,
                     "GasDetector", worldLogical, false, 0);

    return worldPhysical;
}

void DetectorConstruction::ConstructSDandField()
{
    // Create force collision operator for neutrons
    G4BOptrForceCollision* forceCollision =
        new G4BOptrForceCollision("neutron", "ForceNeutronCollision");

    // Attach to gas detector
    forceCollision->AttachTo(fGasDetectorLogical);

    G4cout << "========================================" << G4endl;
    G4cout << "Force collision biasing configured:" << G4endl;
    G4cout << "  Particle: neutron" << G4endl;
    G4cout << "  Volume: " << fGasDetectorLogical->GetName() << G4endl;
    G4cout << "  Thickness: 1 cm" << G4endl;
    G4cout << "========================================" << G4endl;

    // Attach sensitive detector if needed
    // ...
}
```

### Example 2: Thin Foil Target

**Scenario:** 100 μm aluminum foil, force photon interactions

```cpp
void DetectorConstruction::ConstructSDandField()
{
    // Thin foil dimensions
    G4cout << "Foil thickness: " << fFoilThickness/um << " μm" << G4endl;
    G4cout << "Foil material: " << fFoilMaterial->GetName() << G4endl;

    // Create force collision for photons
    G4BOptrForceCollision* forceFoilInteraction =
        new G4BOptrForceCollision("gamma", "ForceFoilInteraction");

    // Attach to foil volume
    forceFoilInteraction->AttachTo(fFoilLogical);

    // Calculate expected efficiency gain
    // For thin foils: efficiency ~ 1 / (σ × thickness)
    // Typical improvement: 10-1000x

    G4cout << "Force collision enabled in foil" << G4endl;
}
```

### Example 3: Multiple Thin Detectors

**Scenario:** Array of thin semiconductor detectors

```cpp
void DetectorConstruction::ConstructSDandField()
{
    // Create single operator for all detectors
    G4BOptrForceCollision* forceInteraction =
        new G4BOptrForceCollision("e-", "ForceElectronInteraction");

    // Attach to all detector layers
    G4int nDetectors = fDetectorLogicals.size();
    for (G4int i = 0; i < nDetectors; ++i) {
        forceInteraction->AttachTo(fDetectorLogicals[i]);
        G4cout << "Force collision attached to detector " << i << G4endl;
    }

    G4cout << "Total detectors with force collision: "
           << nDetectors << G4endl;
}
```

## How It Works Internally

### Track Entry

**When track enters biased volume:**

1. **Cloning Operation Applied:**
   - `ProposeNonPhysicsBiasingOperation()` returns cloning operation
   - Original track cloned into two copies

2. **Weights Calculated:**
```cpp
// Distance to volume exit
G4double L = DistanceToExit(track);

// Total cross-section (all processes)
G4double totalXS = CalculateTotalCrossSection(track);

// Non-interaction probability
G4double P_NI = std::exp(-totalXS * L);

// Set weights
w_non_interact = w_original * P_NI;
w_interact     = w_original * (1.0 - P_NI);
```

3. **Track Tagging:**
   - One clone tagged as "non-interacting"
   - One clone tagged as "interacting"

### Non-Interacting Clone

**For the clone that exits without interaction:**

1. **Free Flight Operation:**
   - `ProposeOccurenceBiasingOperation()` returns free flight operation
   - Interaction law with zero cross-section
   - Particle travels to exit without interaction

2. **Exit Volume:**
   - Track reaches boundary
   - Exits with weight `w_non_interact`
   - Continues in next volume (analog)

### Interacting Clone

**For the clone that must interact:**

1. **Forced Interaction:**
   - `ProposeOccurenceBiasingOperation()` returns force interaction operation
   - Truncated exponential law in range [0, L]
   - Interaction point sampled from biased distribution

2. **Process Selection:**
   - Multiple processes can contribute
   - Process selected proportional to its cross-section
   - `ProposeFinalStateBiasingOperation()` identifies winning process

3. **Interaction Occurs:**
   - Selected process generates final state
   - Weight remains `w_interact`
   - Secondaries inherit biased environment

## Weight Calculation Details

### Non-Interaction Probability

For a particle traveling distance L through material:

```
P_NI(L) = exp(-Σ σᵢ × L) = exp(-σ_total × L)

Where σᵢ = cross-section of process i
      σ_total = sum of all process cross-sections
```

### Weight Split

```
Original weight:           w₀
Distance to exit:          L
Total cross-section:       σ

Non-interact weight:       w_free = w₀ × exp(-σL)
Interact weight:           w_force = w₀ × [1 - exp(-σL)]

Conservation:              w_free + w_force = w₀ ✓
```

### Thin vs Thick Limits

**Thin limit (σL << 1):**
```
exp(-σL) ≈ 1 - σL
w_free ≈ w₀ × (1 - σL) ≈ w₀
w_force ≈ w₀ × σL       (small)

Most weight in non-interacting clone (expected!)
```

**Thick limit (σL >> 1):**
```
exp(-σL) ≈ 0
w_free ≈ 0
w_force ≈ w₀

Most weight in interacting clone
(but force collision not optimal for thick targets!)
```

## Performance Considerations

### When to Use Force Collision

**Ideal Cases:**
- Thin detectors (σL < 0.1)
- Gas chambers
- Thin foils
- Short path lengths
- Low interaction probability

**Efficiency Gain:**
```
FOM_gain ≈ 1 / (1 - exp(-σL))

For σL = 0.01:  FOM_gain ≈ 100x
For σL = 0.1:   FOM_gain ≈ 10x
For σL = 1.0:   FOM_gain ≈ 1.6x
```

### When NOT to Use

**Avoid for:**
- Thick materials (σL > 1)
- High interaction probability
- Multiple thin layers (use importance sampling instead)
- Very high statistics runs (overhead not worth it)

**Alternative:** Use importance sampling or cross-section biasing

### Computational Overhead

**Additional Cost:**
- Track cloning per volume entry
- Two tracks per primary (in biased volume)
- Weight calculation

**Typical Overhead:** 10-20% increase in CPU time

**Net Benefit:** If efficiency gain > 1.2x, worth using

## Monitoring and Debugging

### Print Information at Run Start

```cpp
class MyForceCollision : public G4BOptrForceCollision
{
public:
    MyForceCollision(G4String particle, G4String name)
        : G4BOptrForceCollision(particle, name)
    {}

    virtual void StartRun() override
    {
        G4BOptrForceCollision::StartRun();  // Call base class

        G4cout << "========================================" << G4endl;
        G4cout << "Force Collision Operator: " << GetName() << G4endl;
        G4cout << "  Particle: " << /* particle name */ << G4endl;
        G4cout << "  Active in this run" << G4endl;
        G4cout << "========================================" << G4endl;
    }
};
```

### Track Entry/Exit Monitoring

```cpp
virtual void StartTracking(const G4Track* track) override
{
    G4BOptrForceCollision::StartTracking(track);

    G4cout << "Track " << track->GetTrackID()
           << " entering biased volume"
           << " with weight " << track->GetWeight() << G4endl;
}

virtual void EndTracking() override
{
    G4cout << "Track exiting biased volume" << G4endl;

    G4BOptrForceCollision::EndTracking();
}
```

### Weight Statistics

```cpp
// In your application
class RunAction : public G4UserRunAction
{
    virtual void BeginOfRunAction(const G4Run*) override
    {
        fWeightSum = 0.0;
        fWeightSqSum = 0.0;
        fNTracks = 0;
        fMinWeight = DBL_MAX;
        fMaxWeight = 0.0;
    }

    void RecordWeight(G4double weight)
    {
        fWeightSum += weight;
        fWeightSqSum += weight * weight;
        fNTracks++;
        if (weight < fMinWeight) fMinWeight = weight;
        if (weight > fMaxWeight) fMaxWeight = weight;
    }

    virtual void EndOfRunAction(const G4Run*) override
    {
        G4double mean = fWeightSum / fNTracks;
        G4double variance = (fWeightSqSum / fNTracks) - mean*mean;
        G4double rms = std::sqrt(variance);

        G4cout << "\n========================================" << G4endl;
        G4cout << "Force Collision Weight Statistics:" << G4endl;
        G4cout << "  Tracks: " << fNTracks << G4endl;
        G4cout << "  Mean weight: " << mean << G4endl;
        G4cout << "  RMS weight: " << rms << G4endl;
        G4cout << "  Min weight: " << fMinWeight << G4endl;
        G4cout << "  Max weight: " << fMaxWeight << G4endl;
        G4cout << "  RMS/Mean: " << rms/mean << G4endl;
        G4cout << "========================================\n" << G4endl;
    }

private:
    G4double fWeightSum, fWeightSqSum;
    G4int fNTracks;
    G4double fMinWeight, fMaxWeight;
};
```

## Common Issues and Solutions

### Issue 1: Processes Not Wrapped

**Symptom:** Biasing doesn't work, no effect

**Cause:** Physics processes not wrapped with `G4BiasingProcessInterface`

**Solution:**
```cpp
// In physics list
#include "G4BiasingHelper.hh"

void PhysicsList::ConstructProcess()
{
    G4VModularPhysicsList::ConstructProcess();

    // Add this line!
    G4BiasingHelper::ActivatePhysicsBiasing(particleManager, "neutron");
}
```

### Issue 2: Wrong Particle Name

**Symptom:** Biasing not applied

**Cause:** Incorrect particle name string

**Solution:**
```cpp
// CORRECT - use exact particle names
new G4BOptrForceCollision("neutron");   // ✓
new G4BOptrForceCollision("gamma");     // ✓
new G4BOptrForceCollision("e-");        // ✓

// WRONG
new G4BOptrForceCollision("photon");    // ✗
new G4BOptrForceCollision("electron");  // ✗
```

### Issue 3: Attached to Wrong Volume

**Symptom:** Biasing applied in unexpected places

**Cause:** Operator attached to wrong logical volume

**Solution:**
```cpp
void ConstructSDandField()
{
    // Verify you have the right logical volume
    G4cout << "Attaching to: " << fDetectorLogical->GetName() << G4endl;

    forceCollision->AttachTo(fDetectorLogical);  // Check this is correct!
}
```

### Issue 4: Weight Conservation Violated

**Symptom:** Total score doesn't match analog

**Cause:** Scoring doesn't account for weights

**Solution:**
```cpp
// In sensitive detector
G4double weight = step->GetTrack()->GetWeight();
G4double edep = step->GetTotalEnergyDeposit();

// CORRECT - include weight
fTotalScore += weight * edep;

// WRONG - missing weight
fTotalScore += edep;  // Don't do this!
```

## Best Practices

### 1. Use for Appropriate Geometries

```cpp
// Good use cases
- Gas detectors (low density)
- Thin foils (< 1 mm metal)
- Short path lengths (σL < 0.1)

// Poor use cases
- Thick shielding (use importance sampling)
- Bulk detectors (use standard simulation)
- High interaction probability
```

### 2. Monitor Weight Distribution

```cpp
// Ensure weights stay reasonable
// Rule of thumb: max_weight / min_weight < 10⁴
```

### 3. Validate Against Analog

```cpp
// Run small test with and without biasing
// Verify same mean results
// Check variance reduction factor
```

### 4. Document Configuration

```cpp
virtual void StartRun() override
{
    G4BOptrForceCollision::StartRun();

    G4cout << "Force collision configuration:" << G4endl;
    G4cout << "  Particle type: neutron" << G4endl;
    G4cout << "  Target volume: GasDetector" << G4endl;
    G4cout << "  Thickness: 1 cm" << G4endl;
    G4cout << "  Expected gain: ~100x" << G4endl;
}
```

## See Also

- [G4VBiasingOperator](./g4vbiasingoperator.md) - Base operator class
- [G4BOptnForceCommonTruncatedExp](./g4boptnforcecommontruncatedexp.md) - Truncated exponential operation
- [G4BOptnCloning](./g4boptncloning.md) - Track cloning operation
- [Biasing Overview](../) - Complete variance reduction guide

---

**File:** `source/processes/biasing/generic/include/G4BOptrForceCollision.hh`
**Lines:** 55-108
**Author:** Marc Verderi, November 2013
