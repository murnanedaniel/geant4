# G4BOptnChangeCrossSection

## Overview

`G4BOptnChangeCrossSection` is a biasing operation that modifies a physics process cross-section to enhance or suppress interaction rates. This is one of the most commonly used biasing techniques for rare event simulation and detector optimization.

**Location:** `source/processes/biasing/generic/include/G4BOptnChangeCrossSection.hh`

**Base Class:** `G4VBiasingOperation`

**Typical Use:** Enhance rare processes (photonuclear, capture), suppress dominant processes

## Purpose

This operation allows you to:
- **Enhance Rare Events:** Increase cross-section to make rare interactions more likely
- **Suppress Common Events:** Decrease cross-section to reduce unwanted interactions
- **Energy-Dependent Biasing:** Adjust cross-section based on particle energy
- **Process-Specific Biasing:** Target individual physics processes

**Physics Principle:**
```
Analog:    σ_analog, interaction probability ∝ σ_analog
Biased:    σ_biased = f × σ_analog
Weight:    w_new = w_old × (σ_analog / σ_biased)

Result: Same expected value, reduced variance
```

## Class Definition

```cpp
class G4BOptnChangeCrossSection : public G4VBiasingOperation
{
public:
    // Constructor
    G4BOptnChangeCrossSection(const G4String& name);
    virtual ~G4BOptnChangeCrossSection();

    // === From G4VBiasingOperation (used methods) ===

    // Provide the biased interaction law
    virtual const G4VBiasingInteractionLaw*
    ProvideOccurenceBiasingInteractionLaw(
        const G4BiasingProcessInterface* callingProcess,
        G4ForceCondition& proposeForceCondition) override;

    // === Specific to this class ===

    // Set the biased cross-section value
    void SetBiasedCrossSection(G4double xst,
                               G4bool updateInteractionLength = false);

    // Get current biased cross-section
    G4double GetBiasedCrossSection() const;

    // Get the underlying interaction law
    G4InteractionLawPhysical* GetBiasedExponentialLaw();

    // Sample the biased distribution
    void Sample();

    // Update for a step without resampling
    void UpdateForStep(G4double stepLength);

    // Check/set interaction occurred flag
    G4bool GetInteractionOccured() const;
    void SetInteractionOccured();

private:
    G4InteractionLawPhysical* fBiasedExponentialLaw;
    G4bool fInteractionOccured;
};
```

**Key Lines:**
- Line 46: Constructor takes operation name
- Line 54: ProvideOccurenceBiasingInteractionLaw - returns biased law
- Line 71: SetBiasedCrossSection - main configuration method
- Line 74: Sample - must be called before returning operation

## Key Methods

### SetBiasedCrossSection()

**Purpose:** Set the modified cross-section value

```cpp
void SetBiasedCrossSection(G4double xst,
                           G4bool updateInteractionLength = false);
```

**Parameters:**
- `xst` - Biased cross-section value (in Geant4 internal units)
- `updateInteractionLength` - If true, update interaction length immediately

**Usage:**
```cpp
// Get analog cross-section from process
G4double analogXS = /* query from process */;

// Enhancement factor
G4double enhancementFactor = 100.0;

// Set biased value
G4double biasedXS = enhancementFactor * analogXS;
fChangeCrossSection->SetBiasedCrossSection(biasedXS);
```

**Important:** Always call `Sample()` after setting cross-section!

### Sample()

**Purpose:** Sample the biased interaction length distribution

```cpp
void Sample();
```

**Must be called:** Before returning operation from operator

```cpp
// Correct usage
fChangeCrossSection->SetBiasedCrossSection(biasedXS);
fChangeCrossSection->Sample();  // REQUIRED
return fChangeCrossSection;

// Wrong - will crash!
fChangeCrossSection->SetBiasedCrossSection(biasedXS);
return fChangeCrossSection;  // Missing Sample()!
```

### GetBiasedCrossSection()

**Purpose:** Retrieve current biased cross-section

```cpp
G4double GetBiasedCrossSection() const;
```

**Usage:**
```cpp
G4double currentXS = fChangeCrossSection->GetBiasedCrossSection();
G4cout << "Biased cross-section: " << currentXS/barn << " barn" << G4endl;
```

### UpdateForStep()

**Purpose:** Update interaction length after a step without resampling

```cpp
void UpdateForStep(G4double stepLength);
```

**Typically:** Not called directly (framework handles this)

## Basic Usage Pattern

### 1. Create Operation (in Operator Constructor)

```cpp
class MyBiasing : public G4VBiasingOperator
{
public:
    MyBiasing() : G4VBiasingOperator("MyBias")
    {
        // Create once
        fXSBiasing = new G4BOptnChangeCrossSection("BiasXS");
    }

    ~MyBiasing()
    {
        delete fXSBiasing;
    }

private:
    G4BOptnChangeCrossSection* fXSBiasing;
};
```

### 2. Configure and Return (in ProposeOccurenceBiasingOperation)

```cpp
virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
    const G4Track* track,
    const G4BiasingProcessInterface* callingProcess) override
{
    // Get process name
    G4String processName =
        callingProcess->GetWrappedProcess()->GetProcessName();

    if (processName == "targetProcess") {
        // Set biased cross-section
        G4double biasedXS = CalculateBiasedXS(track);
        fXSBiasing->SetBiasedCrossSection(biasedXS);

        // MUST sample before returning
        fXSBiasing->Sample();

        return fXSBiasing;
    }

    return nullptr;
}
```

## Complete Examples

### Example 1: Constant Enhancement Factor

**Scenario:** Enhance photonuclear cross-section by 100x

```cpp
class PhotonuclearBiasing : public G4VBiasingOperator
{
public:
    PhotonuclearBiasing()
        : G4VBiasingOperator("PhotonuclearBias"),
          fEnhancementFactor(100.0)
    {
        fXSBiasing = new G4BOptnChangeCrossSection("BiasPhotonuclear");
    }

    ~PhotonuclearBiasing()
    {
        delete fXSBiasing;
    }

    virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) override
    {
        // Check if this is photonuclear process
        if (callingProcess->GetWrappedProcess()->GetProcessName() != "photonNuclear") {
            return nullptr;
        }

        // Get the wrapped process
        const G4VProcess* process = callingProcess->GetWrappedProcess();

        // Query analog cross-section
        // (This is simplified - see full implementation for cross-section queries)
        G4MaterialCutsCouple* couple = track->GetMaterialCutsCouple();
        G4double energy = track->GetKineticEnergy();

        // In reality, query cross-section from process/cross-section store
        G4double analogXS = QueryCrossSection(process, energy, couple);

        // Apply enhancement
        G4double biasedXS = fEnhancementFactor * analogXS;

        // Configure operation
        fXSBiasing->SetBiasedCrossSection(biasedXS);
        fXSBiasing->Sample();

        return fXSBiasing;
    }

    virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(...) override
        { return nullptr; }

    virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(...) override
        { return nullptr; }

private:
    G4BOptnChangeCrossSection* fXSBiasing;
    G4double fEnhancementFactor;

    G4double QueryCrossSection(const G4VProcess* process,
                               G4double energy,
                               const G4MaterialCutsCouple* couple)
    {
        // Query cross-section from process
        // Implementation depends on process type
        return 1.0 * barn;  // Placeholder
    }
};
```

### Example 2: Energy-Dependent Biasing

**Scenario:** Enhance low-energy neutron capture (higher enhancement at lower energies)

```cpp
class NeutronCaptureBiasing : public G4VBiasingOperator
{
public:
    NeutronCaptureBiasing()
        : G4VBiasingOperator("NeutronCaptureBias")
    {
        fXSBiasing = new G4BOptnChangeCrossSection("BiasnCapture");
        fMinEnergy = 1.0*eV;
        fMaxEnergy = 1.0*MeV;
        fMaxEnhancement = 1000.0;
        fMinEnhancement = 10.0;
    }

    ~NeutronCaptureBiasing()
    {
        delete fXSBiasing;
    }

    virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) override
    {
        // Only bias neutron capture
        if (callingProcess->GetWrappedProcess()->GetProcessName() != "nCapture") {
            return nullptr;
        }

        // Get energy
        G4double energy = track->GetKineticEnergy();

        // Calculate energy-dependent enhancement factor
        G4double enhancementFactor = CalculateEnhancement(energy);

        // Get analog cross-section
        G4double analogXS = QueryCaptureXS(track);

        // Apply biasing
        G4double biasedXS = enhancementFactor * analogXS;

        fXSBiasing->SetBiasedCrossSection(biasedXS);
        fXSBiasing->Sample();

        return fXSBiasing;
    }

    virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(...) override
        { return nullptr; }

    virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(...) override
        { return nullptr; }

private:
    G4BOptnChangeCrossSection* fXSBiasing;
    G4double fMinEnergy, fMaxEnergy;
    G4double fMaxEnhancement, fMinEnhancement;

    G4double CalculateEnhancement(G4double energy)
    {
        // No biasing outside energy range
        if (energy < fMinEnergy || energy > fMaxEnergy) {
            return 1.0;  // No enhancement
        }

        // Log scale interpolation
        // High enhancement at low energy, low enhancement at high energy
        G4double logE = std::log10(energy / fMinEnergy);
        G4double logRange = std::log10(fMaxEnergy / fMinEnergy);
        G4double fraction = logE / logRange;

        // Linear interpolation in log space
        G4double logMinEnh = std::log10(fMinEnhancement);
        G4double logMaxEnh = std::log10(fMaxEnhancement);
        G4double logEnh = logMaxEnh - fraction * (logMaxEnh - logMinEnh);

        return std::pow(10.0, logEnh);
    }

    G4double QueryCaptureXS(const G4Track* track)
    {
        // Query cross-section from hadronic process store
        // or from process directly
        return 1.0 * barn;  // Placeholder
    }
};
```

### Example 3: Multi-Process Biasing

**Scenario:** Enhance multiple rare processes with different factors

```cpp
class MultiProcessBiasing : public G4VBiasingOperator
{
public:
    MultiProcessBiasing()
        : G4VBiasingOperator("MultiProcessBias")
    {
        fXSBiasing = new G4BOptnChangeCrossSection("BiasXS");

        // Define enhancement factors for different processes
        fEnhancementMap["photonNuclear"] = 100.0;
        fEnhancementMap["nCapture"] = 50.0;
        fEnhancementMap["muNuclear"] = 200.0;
    }

    ~MultiProcessBiasing()
    {
        delete fXSBiasing;
    }

    virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) override
    {
        // Get process name
        G4String processName =
            callingProcess->GetWrappedProcess()->GetProcessName();

        // Check if this process should be biased
        auto it = fEnhancementMap.find(processName);
        if (it == fEnhancementMap.end()) {
            return nullptr;  // Process not in bias list
        }

        // Get enhancement factor
        G4double enhancementFactor = it->second;

        // Get analog cross-section
        G4double analogXS = GetAnalogCrossSection(track, callingProcess);

        // Apply biasing
        G4double biasedXS = enhancementFactor * analogXS;

        fXSBiasing->SetBiasedCrossSection(biasedXS);
        fXSBiasing->Sample();

        return fXSBiasing;
    }

    virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(...) override
        { return nullptr; }

    virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(...) override
        { return nullptr; }

private:
    G4BOptnChangeCrossSection* fXSBiasing;
    std::map<G4String, G4double> fEnhancementMap;

    G4double GetAnalogCrossSection(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess)
    {
        // Query from process
        return 1.0 * barn;  // Placeholder
    }
};
```

### Example 4: Spatial and Energy Dependent

**Scenario:** Enhance only in detector region and only for specific energy range

```cpp
class ConditionalBiasing : public G4VBiasingOperator
{
public:
    ConditionalBiasing(G4LogicalVolume* detectorVolume)
        : G4VBiasingOperator("ConditionalBias"),
          fDetectorVolume(detectorVolume)
    {
        fXSBiasing = new G4BOptnChangeCrossSection("BiasXS");
        fMinEnergy = 1.0*MeV;
        fMaxEnergy = 100.0*MeV;
        fEnhancement = 50.0;
    }

    ~ConditionalBiasing()
    {
        delete fXSBiasing;
    }

    virtual G4VBiasingOperation* ProposeOccurenceBiasingOperation(
        const G4Track* track,
        const G4BiasingProcessInterface* callingProcess) override
    {
        // Check process
        if (callingProcess->GetWrappedProcess()->GetProcessName() != "compt") {
            return nullptr;
        }

        // Check energy range
        G4double energy = track->GetKineticEnergy();
        if (energy < fMinEnergy || energy > fMaxEnergy) {
            return nullptr;
        }

        // Check spatial location
        G4VPhysicalVolume* volume = track->GetVolume();
        if (volume->GetLogicalVolume() != fDetectorVolume) {
            return nullptr;
        }

        // All conditions met - apply biasing
        G4double analogXS = GetComptonXS(track);
        G4double biasedXS = fEnhancement * analogXS;

        fXSBiasing->SetBiasedCrossSection(biasedXS);
        fXSBiasing->Sample();

        return fXSBiasing;
    }

    virtual G4VBiasingOperation* ProposeNonPhysicsBiasingOperation(...) override
        { return nullptr; }

    virtual G4VBiasingOperation* ProposeFinalStateBiasingOperation(...) override
        { return nullptr; }

private:
    G4BOptnChangeCrossSection* fXSBiasing;
    G4LogicalVolume* fDetectorVolume;
    G4double fMinEnergy, fMaxEnergy;
    G4double fEnhancement;

    G4double GetComptonXS(const G4Track* track)
    {
        // Query Compton cross-section
        return 1.0 * barn;
    }
};
```

## Weight Correction

**Automatic:** The framework automatically applies weight correction

```cpp
// During interaction
w_new = w_old × (σ_analog / σ_biased)

// Example: Enhancement factor = 100
σ_biased = 100 × σ_analog
w_new = w_old × (σ_analog / (100 × σ_analog))
      = w_old / 100
      = 0.01 × w_old

Result: Interaction happens 100x more often, but with 1/100 weight
Expected value preserved!
```

## Querying Cross-Sections

**Challenge:** Getting analog cross-section from processes

**Methods:**

### 1. From G4VProcess (if available)

```cpp
// For discrete processes
G4double GetCrossSection(const G4DynamicParticle* particle,
                         const G4Material* material);

// For processes with cross-section store
G4VEmProcess* emProcess = dynamic_cast<G4VEmProcess*>(process);
if (emProcess) {
    G4double xs = emProcess->GetCrossSection(energy, couple);
}
```

### 2. From Cross-Section Stores

```cpp
// Hadronic processes
#include "G4HadronicProcessStore.hh"

G4HadronicProcessStore* store = G4HadronicProcessStore::Instance();
G4double xs = store->GetCrossSectionPerAtom(
    particle, energy, process, element, material);
```

### 3. From Process Interface

```cpp
// Through biasing process interface
// The interface caches the last computed cross-section
const G4BiasingProcessInterface* biasInterface = callingProcess;

// Access cached physics cross-section
// (Implementation-specific, may need process knowledge)
```

## Common Patterns

### Enhancement Factor Schedule

```cpp
struct EnhancementSchedule {
    G4double minEnergy;
    G4double maxEnergy;
    G4double enhancementFactor;
};

std::vector<EnhancementSchedule> schedule = {
    {0.0*eV,    1.0*eV,   1000.0},  // Very low energy
    {1.0*eV,    1.0*keV,  100.0},   // Low energy
    {1.0*keV,   1.0*MeV,  10.0},    // Medium energy
    {1.0*MeV,   DBL_MAX,  1.0}      // High energy (no bias)
};

G4double GetEnhancement(G4double energy) {
    for (const auto& sched : schedule) {
        if (energy >= sched.minEnergy && energy < sched.maxEnergy) {
            return sched.enhancementFactor;
        }
    }
    return 1.0;
}
```

### Process Name Matching

```cpp
bool ShouldBiasProcess(const G4String& processName) {
    static const std::set<G4String> biasedProcesses = {
        "photonNuclear",
        "electronNuclear",
        "muNuclear",
        "nCapture"
    };

    return biasedProcesses.find(processName) != biasedProcesses.end();
}
```

## Best Practices

### 1. Always Sample Before Returning

```cpp
// CORRECT
fXSBiasing->SetBiasedCrossSection(biasedXS);
fXSBiasing->Sample();  // Required!
return fXSBiasing;

// WRONG - will crash
fXSBiasing->SetBiasedCrossSection(biasedXS);
return fXSBiasing;  // Missing Sample()
```

### 2. Avoid Extreme Enhancement Factors

```cpp
// Good practice: cap enhancement factor
G4double CalculateEnhancement(G4double energy) {
    G4double factor = /* calculation */;

    // Cap at reasonable values
    const G4double maxEnhancement = 1000.0;
    const G4double minEnhancement = 0.1;

    if (factor > maxEnhancement) factor = maxEnhancement;
    if (factor < minEnhancement) factor = minEnhancement;

    return factor;
}
```

### 3. Handle Zero Cross-Sections

```cpp
if (analogXS < 1e-30) {
    // Cross-section effectively zero
    return nullptr;  // Don't bias
}

G4double biasedXS = enhancementFactor * analogXS;
```

### 4. Document Enhancement Factors

```cpp
class MyBiasing : public G4VBiasingOperator {
    virtual void StartRun() override {
        G4cout << "========================================" << G4endl;
        G4cout << "Cross-section biasing active:" << G4endl;
        G4cout << "  Process: photonNuclear" << G4endl;
        G4cout << "  Enhancement: 100x" << G4endl;
        G4cout << "  Energy range: 1 MeV - 100 MeV" << G4endl;
        G4cout << "========================================" << G4endl;
    }
};
```

### 5. Monitor Weight Statistics

```cpp
virtual void OperationApplied(
    const G4BiasingProcessInterface* callingProcess,
    G4BiasingAppliedCase biasingCase,
    G4VBiasingOperation* operationApplied,
    const G4VParticleChange* particleChangeProduced) override
{
    if (particleChangeProduced) {
        G4double weight = particleChangeProduced->GetWeight();

        fWeightSum += weight;
        fWeightSqSum += weight * weight;
        fNInteractions++;

        // Track extremes
        if (weight < fMinWeight) fMinWeight = weight;
        if (weight > fMaxWeight) fMaxWeight = weight;
    }
}

virtual void EndRun() {
    G4double meanWeight = fWeightSum / fNInteractions;
    G4double variance = (fWeightSqSum / fNInteractions) - meanWeight*meanWeight;
    G4double rms = std::sqrt(variance);

    G4cout << "Weight statistics:" << G4endl;
    G4cout << "  Mean: " << meanWeight << G4endl;
    G4cout << "  RMS: " << rms << G4endl;
    G4cout << "  Min: " << fMinWeight << G4endl;
    G4cout << "  Max: " << fMaxWeight << G4endl;
}
```

## Troubleshooting

### Problem: Simulation Crashes

**Cause:** Forgot to call `Sample()` before returning operation

**Solution:**
```cpp
fXSBiasing->SetBiasedCrossSection(biasedXS);
fXSBiasing->Sample();  // Add this!
return fXSBiasing;
```

### Problem: Results Don't Match Analog

**Cause:** Biasing applied incorrectly or in wrong region

**Solution:** Verify conditions and print debug info
```cpp
if (processName == "targetProcess") {
    G4cout << "Biasing " << processName
           << " at E=" << energy/MeV << " MeV"
           << " factor=" << enhancementFactor << G4endl;
    // ... apply biasing
}
```

### Problem: Very Small/Large Weights

**Cause:** Enhancement factor too extreme

**Solution:** Cap enhancement factors and monitor weights
```cpp
if (factor > 1000.0) {
    G4cout << "WARNING: Capping enhancement factor at 1000" << G4endl;
    factor = 1000.0;
}
```

## See Also

- [G4VBiasingOperation](./g4vbiasingoperation.md) - Base class interface
- [G4VBiasingOperator](./g4vbiasingoperator.md) - How to create operators
- [G4BOptnForceCommonTruncatedExp](./g4boptnforcecommontruncatedexp.md) - Force collision
- [Biasing Overview](../) - Complete variance reduction guide

---

**File:** `source/processes/biasing/generic/include/G4BOptnChangeCrossSection.hh`
**Lines:** 41-86
**Author:** Marc Verderi, November 2013
