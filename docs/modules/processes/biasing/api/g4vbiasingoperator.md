# G4VBiasingOperator

## Overview

`G4VBiasingOperator` is the abstract base class for all biasing operators in the generic biasing framework. A biasing operator is the decision-making entity that determines which biasing operations to apply during particle tracking. It is attached to logical volumes and queried by `G4BiasingProcessInterface` objects during tracking.

**Location:** `source/processes/biasing/management/include/G4VBiasingOperator.hh`

**Base Class:** None (abstract base)

**Derived Classes:** User-defined operators, `G4BOptrForceCollision`

## Purpose

The biasing operator:
- **Makes Decisions:** Determines when and how to apply biasing
- **Volume-Based:** Attached to logical volumes in detector construction
- **Three Query Types:** Responds to non-physics, occurrence, and final-state queries
- **Strategy Manager:** Implements overall biasing strategy for a region

## Class Definition

```cpp
class G4VBiasingOperator
{
public:
    // Constructor
    G4VBiasingOperator(const G4String& name);
    virtual ~G4VBiasingOperator() = default;

    // Lifecycle callbacks
    virtual void Configure() {}
    virtual void ConfigureForWorker() {}
    virtual void StartRun() {}
    virtual void StartTracking(const G4Track* track) {}
    virtual void EndTracking() {}

    // Attach to geometry
    void AttachTo(const G4LogicalVolume*);

    // Get operator name
    const G4String& GetName() const;

    // Get operators (static methods)
    static const std::vector<G4VBiasingOperator*>& GetBiasingOperators();
    static G4VBiasingOperator* GetBiasingOperator(const G4LogicalVolume*);

protected:
    // === MANDATORY METHODS - Must be implemented by derived classes ===

    // Non-physics biasing (splitting, killing, etc.)
    virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) = 0;

    // Occurrence biasing (modify interaction probability)
    virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) = 0;

    // Final state biasing (modify interaction products)
    virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) = 0;

    // === OPTIONAL METHODS ===

    // Called after operation is applied (for bookkeeping)
    virtual void OperationApplied(
        const G4BiasingProcessInterface* callingProcess,
        G4BiasingAppliedCase biasingCase,
        G4VBiasingOperation* operationApplied,
        const G4VParticleChange* particleChangeProduced);

    // Called after occurrence biasing is applied
    virtual void OperationApplied(
        const G4BiasingProcessInterface* callingProcess,
        G4BiasingAppliedCase biasingCase,
        G4VBiasingOperation* occurenceOperationApplied,
        G4double weightForOccurenceInteraction,
        G4VBiasingOperation* finalStateOperationApplied,
        const G4VParticleChange* particleChangeProduced);

    // Called when exiting biased volume
    virtual void ExitBiasing(const G4Track* track,
                             const G4BiasingProcessInterface* callingProcess);
};
```

**Key Lines:**
- Line 185: Constructor takes operator name
- Line 256: ProposeNonPhysicsBiasingOperation - first query in step
- Line 268: ProposeOccurenceBiasingOperation - second query in step
- Line 271: ProposeFinalStateBiasingOperation - third query in step
- Line 205: AttachTo() - attach operator to logical volume

## Three Mandatory Methods

### 1. ProposeNonPhysicsBiasingOperation()

**Called:** Beginning of step (PostStepGPIL level)
**Purpose:** Propose operations not tied to physics processes (splitting, killing)

```cpp
virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(
    const G4Track* track,
    const G4BiasingProcessInterface* callingProcess)
{
    // Example: Split particles in important regions
    if (ShouldSplitParticle(track)) {
        return fCloningOperation;
    }
    return nullptr;  // No non-physics biasing
}
```

**Returns:**
- Pointer to biasing operation to apply
- `nullptr` if no non-physics biasing

**Use Cases:**
- Particle splitting (geometry-based)
- Russian roulette
- Track killing in certain regions
- Custom track modifications

### 2. ProposeOccurenceBiasingOperation()

**Called:** Beginning of step (PostStepGPIL level), after non-physics query
**Purpose:** Modify physics process occurrence (interaction probability)

```cpp
virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
    const G4Track* track,
    const G4BiasingProcessInterface* callingProcess)
{
    // Get the wrapped physics process
    G4String processName = callingProcess->GetWrappedProcess()->GetProcessName();

    // Bias specific process
    if (processName == "photonNuclear") {
        // Enhance photonuclear cross-section
        return fChangeCrossSectionOperation;
    }

    return nullptr;  // No occurrence biasing for this process
}
```

**Returns:**
- Pointer to operation that provides biased interaction law
- `nullptr` if no occurrence biasing

**Use Cases:**
- Cross-section enhancement/reduction
- Force collision techniques
- Rare event simulation
- Energy-dependent biasing

### 3. ProposeFinalStateBiasingOperation()

**Called:** End of step (PostStepDoIt level)
**Purpose:** Modify physics process final state (interaction products)

```cpp
virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(
    const G4Track* track,
    const G4BiasingProcessInterface* callingProcess)
{
    // Modify secondaries from interaction
    if (NeedToModifySecondaries(track)) {
        return fFinalStateBiasingOperation;
    }

    return nullptr;  // Use analog final state
}
```

**Returns:**
- Pointer to operation that modifies final state
- `nullptr` if no final state biasing

**Use Cases:**
- Secondary particle modification
- Angular distribution changes
- Energy spectrum changes
- Leading particle biasing

## Lifecycle Methods

### Configure()

**Called:** Once during initialization (master thread in MT mode)

```cpp
virtual void Configure() override
{
    // Register model IDs with physics
    // Initialize shared resources
    // One-time setup
}
```

### ConfigureForWorker()

**Called:** Per worker thread in MT mode

```cpp
virtual void ConfigureForWorker() override
{
    // Setup thread-local resources
    // Don't register model IDs here
}
```

### StartRun()

**Called:** At beginning of each run

```cpp
virtual void StartRun() override
{
    G4cout << "Starting biasing for run" << G4endl;
    // Reset statistics
    // Initialize run-level data
}
```

### StartTracking()

**Called:** When track enters biased volume

```cpp
virtual void StartTracking(const G4Track* track) override
{
    // Initialize track-specific data
    fPreviousStepSize = 0.0;
    fLastVolume = track->GetVolume();
}
```

### EndTracking()

**Called:** When track exits biased volume or is killed

```cpp
virtual void EndTracking() override
{
    // Clean up track-specific data
    // Accumulate statistics
}
```

## Attaching to Geometry

**Method:** `AttachTo(const G4LogicalVolume*)`

**Usage in Detector Construction:**

```cpp
void DetectorConstruction::ConstructSDandField()
{
    // Create biasing operator
    MyBiasingOperator* biasOp = new MyBiasingOperator("MyBias");

    // Attach to logical volume
    biasOp->AttachTo(fTargetLogical);

    G4cout << "Biasing operator attached to "
           << fTargetLogical->GetName() << G4endl;
}
```

**Important Notes:**
- Must be called in `ConstructSDandField()` method
- Can attach same operator to multiple volumes
- One operator per volume (last attachment wins)
- Operator becomes active immediately

## Optional Callback Methods

### OperationApplied()

**Called:** After operation is executed (for monitoring/bookkeeping)

**Single Operation Version:**
```cpp
virtual void OperationApplied(
    const G4BiasingProcessInterface* callingProcess,
    G4BiasingAppliedCase biasingCase,
    G4VBiasingOperation* operationApplied,
    const G4VParticleChange* particleChangeProduced) override
{
    // Track what operations were applied
    fOperationCount[operationApplied->GetName()]++;

    // Monitor weights
    if (particleChangeProduced) {
        G4double weight = particleChangeProduced->GetWeight();
        fWeightHistogram->Fill(weight);
    }
}
```

**Occurrence Biasing Version:**
```cpp
virtual void OperationApplied(
    const G4BiasingProcessInterface* callingProcess,
    G4BiasingAppliedCase biasingCase,
    G4VBiasingOperation* occurenceOperationApplied,
    G4double weightForOccurenceInteraction,
    G4VBiasingOperation* finalStateOperationApplied,
    const G4VParticleChange* particleChangeProduced) override
{
    // Track occurrence biasing statistics
    fOccurrenceBiasCount++;
    fWeightSum += weightForOccurenceInteraction;

    // Both occurrence and final state biasing applied
    if (finalStateOperationApplied) {
        fCombinedBiasCount++;
    }
}
```

### ExitBiasing()

**Called:** When track leaves biased volume

```cpp
virtual void ExitBiasing(
    const G4Track* track,
    const G4BiasingProcessInterface* callingProcess) override
{
    // Cleanup for this track
    // Record exit statistics
    G4cout << "Track exiting biased volume with weight "
           << track->GetWeight() << G4endl;
}
```

## Complete Example

**Energy-Dependent Cross-Section Biasing:**

```cpp
class EnergyDependentBiasing : public G4VBiasingOperator
{
public:
    EnergyDependentBiasing(G4String name)
        : G4VBiasingOperator(name)
    {
        fChangeCrossSection = new G4BOptnChangeCrossSection("BiasXS");
        fMinEnergy = 1.0*keV;
        fMaxEnergy = 10.0*MeV;
    }

    virtual ~EnergyDependentBiasing()
    {
        delete fChangeCrossSection;
    }

    // Lifecycle
    virtual void StartRun() override
    {
        G4cout << "========================================" << G4endl;
        G4cout << "Energy-dependent biasing active" << G4endl;
        G4cout << "  Energy range: " << fMinEnergy/keV << " - "
               << fMaxEnergy/MeV << " MeV" << G4endl;
        G4cout << "========================================" << G4endl;
    }

    virtual void StartTracking(const G4Track* track) override
    {
        fTrackID = track->GetTrackID();
        fInteractionCount = 0;
    }

    // === Mandatory Methods ===

    virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) override
    {
        // No non-physics biasing
        return nullptr;
    }

    virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) override
    {
        // Get track energy
        G4double energy = track->GetKineticEnergy();

        // Only bias in energy range
        if (energy < fMinEnergy || energy > fMaxEnergy) {
            return nullptr;
        }

        // Get process name
        G4String processName =
            callingProcess->GetWrappedProcess()->GetProcessName();

        // Bias photonuclear process
        if (processName == "photonNuclear") {
            // Energy-dependent enhancement
            G4double enhancementFactor = CalculateEnhancement(energy);

            // Get physical cross-section from process
            const G4VProcess* process = callingProcess->GetWrappedProcess();
            // (In real code, query cross-section from process)
            G4double physicalXS = 1.0*barn;  // Example

            // Calculate biased cross-section
            G4double biasedXS = enhancementFactor * physicalXS;

            // Configure operation
            fChangeCrossSection->SetBiasedCrossSection(biasedXS);
            fChangeCrossSection->Sample();

            return fChangeCrossSection;
        }

        return nullptr;
    }

    virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) override
    {
        // No final state biasing
        return nullptr;
    }

    // === Optional Methods ===

    virtual void OperationApplied(
        const G4BiasingProcessInterface* callingProcess,
        G4BiasingAppliedCase biasingCase,
        G4VBiasingOperation* operationApplied,
        const G4VParticleChange* particleChangeProduced) override
    {
        fInteractionCount++;
    }

    virtual void EndTracking() override
    {
        if (fInteractionCount > 0) {
            G4cout << "Track " << fTrackID << " had "
                   << fInteractionCount << " biased interactions" << G4endl;
        }
    }

private:
    G4double CalculateEnhancement(G4double energy)
    {
        // Enhancement decreases with energy
        // 100x at low energy, 10x at high energy
        G4double logE = std::log10(energy / fMinEnergy);
        G4double logRange = std::log10(fMaxEnergy / fMinEnergy);
        G4double factor = 100.0 / std::pow(10.0, logE / logRange);
        return factor;
    }

    G4BOptnChangeCrossSection* fChangeCrossSection;
    G4double fMinEnergy;
    G4double fMaxEnergy;
    G4int fTrackID;
    G4int fInteractionCount;
};
```

**Usage in Detector Construction:**

```cpp
void DetectorConstruction::ConstructSDandField()
{
    EnergyDependentBiasing* biasOp =
        new EnergyDependentBiasing("PhotonuclearBias");

    biasOp->AttachTo(fDetectorLogical);
}
```

## Best Practices

### 1. Return nullptr When Not Biasing

```cpp
virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(...)
{
    // Check conditions
    if (!ShouldBias(track)) {
        return nullptr;  // No biasing - use analog physics
    }

    // Return biasing operation
    return fMyOperation;
}
```

### 2. Initialize Operations in Constructor

```cpp
MyOperator::MyOperator(G4String name)
    : G4VBiasingOperator(name)
{
    // Create all operations once
    fXSBiasing = new G4BOptnChangeCrossSection("BiasXS");
    fCloning = new G4BOptnCloning("Cloning");

    // Don't create in Propose methods (performance issue)
}
```

### 3. Use StartTracking() to Reset State

```cpp
virtual void StartTracking(const G4Track* track) override
{
    // Reset per-track data
    fPreviousEnergy = track->GetKineticEnergy();
    fStepCount = 0;
    fBoundaryCount = 0;
}
```

### 4. Check Calling Process Identity

```cpp
virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(...)
{
    // Get wrapped process
    const G4VProcess* process = callingProcess->GetWrappedProcess();

    // Check process name
    if (process->GetProcessName() == "targetProcess") {
        // Bias this process
        return fOperation;
    }

    // Check process type
    if (process->GetProcessType() == fElectromagnetic) {
        // Bias EM processes
        return fEMOperation;
    }

    return nullptr;
}
```

### 5. Monitor with OperationApplied()

```cpp
virtual void OperationApplied(
    const G4BiasingProcessInterface* callingProcess,
    G4BiasingAppliedCase biasingCase,
    G4VBiasingOperation* operationApplied,
    const G4VParticleChange* particleChangeProduced) override
{
    // Track statistics
    fOperationCounts[operationApplied->GetName()]++;

    // Monitor weights
    if (particleChangeProduced) {
        G4double weight = particleChangeProduced->GetWeight();
        fMinWeight = std::min(fMinWeight, weight);
        fMaxWeight = std::max(fMaxWeight, weight);

        // Warning for extreme weights
        if (weight > 1e6) {
            G4cout << "WARNING: Very large weight " << weight << G4endl;
        }
    }
}
```

## Common Patterns

### Process-Specific Biasing

```cpp
virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(...)
{
    G4String processName = callingProcess->GetWrappedProcess()->GetProcessName();

    if (processName == "photonNuclear") return fPhotonuclearOp;
    if (processName == "nCapture") return fCaptureOp;
    if (processName == "hadElastic") return fElasticOp;

    return nullptr;
}
```

### Region-Based Biasing

```cpp
class RegionBiasing : public G4VBiasingOperator
{
    virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(...)
    {
        G4VPhysicalVolume* volume = track->GetVolume();

        if (volume == fCriticalVolume) {
            // High importance - split particles
            return fSplitOperation;
        }
        else if (volume == fLowImportanceVolume) {
            // Low importance - Russian roulette
            return fRussianRouletteOperation;
        }

        return nullptr;
    }
};
```

### Conditional Biasing

```cpp
virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(...)
{
    G4double energy = track->GetKineticEnergy();
    G4ThreeVector position = track->GetPosition();

    // Energy threshold
    if (energy < 1.0*MeV) return nullptr;

    // Spatial region
    if (position.z() < 0.0) return nullptr;

    // Particle type
    if (track->GetParticleDefinition() != G4Gamma::Definition()) {
        return nullptr;
    }

    // All conditions met
    return fBiasOperation;
}
```

## Thread Safety

**Operator Instances:**
- One operator instance per thread in MT mode
- Operators automatically cloned for worker threads

**Member Variables:**
- Biasing operations: Create in constructor (thread-local)
- Statistics counters: Thread-local (automatically)
- Shared data: Use `G4Cache` or const data

**Example Thread-Safe Operator:**

```cpp
class ThreadSafeBiasing : public G4VBiasingOperator
{
public:
    ThreadSafeBiasing(G4String name)
        : G4VBiasingOperator(name)
    {
        // Thread-local operation
        fOperation = new G4BOptnChangeCrossSection("XSBias");
    }

    virtual void StartRun() override
    {
        // Thread-local counter
        fInteractionCount = 0;
    }

    virtual void EndTracking() override
    {
        // Thread-local accumulation (OK)
        fInteractionCount++;
    }

private:
    // Thread-local members (automatically)
    G4BOptnChangeCrossSection* fOperation;
    G4int fInteractionCount;

    // Shared constant data (OK)
    static const G4double fEnhancementFactor;
};
```

## See Also

- [G4VBiasingOperation](./g4vbiasingoperation.md) - Base class for operations
- [G4BiasingProcessInterface](./g4biasingprocessinterface.md) - Process wrapper
- [G4BOptrForceCollision](./g4boptrforcecollision.md) - Example concrete operator
- [Biasing Overview](../) - Complete biasing framework documentation

---

**File:** `source/processes/biasing/management/include/G4VBiasingOperator.hh`
**Lines:** 173-356
**Author:** M. Verderi (LLR), November 2013
