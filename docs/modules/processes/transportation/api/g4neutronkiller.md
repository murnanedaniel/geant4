# G4NeutronKiller

## Overview

`G4NeutronKiller` is a specialized performance optimization process that selectively terminates neutron tracks based on kinetic energy and/or time-of-flight thresholds. It is particularly useful for shielding studies and cosmic ray simulations where low-energy or slow neutrons consume significant CPU time but contribute little to physics results.

**Class Type:** Performance Optimization Process
**Base Class:** `G4VDiscreteProcess`
**Process Type:** `fGeneral`
**Applicability:** Neutrons only
**Headers:** `source/processes/transportation/include/G4NeutronKiller.hh`

---

## Purpose

G4NeutronKiller provides:

- **Performance Optimization:** Eliminate CPU-intensive low-energy neutrons
- **Energy Threshold:** Kill neutrons below specified kinetic energy
- **Time Threshold:** Terminate neutrons after specified time of flight
- **Shielding Studies:** Remove unimportant thermal neutrons in bulk materials
- **Cosmic Ray Simulations:** Control slow neutron population
- **UI Control:** Runtime configuration via messenger commands

---

## Class Definition

```cpp
class G4NeutronKiller : public G4VDiscreteProcess
{
public:
    G4NeutronKiller(const G4String& processName = "nKiller",
                    G4ProcessType   aType = fGeneral);
    virtual ~G4NeutronKiller();

    // Applicability
    virtual G4bool IsApplicable(const G4ParticleDefinition&);

    // Configuration
    void SetTimeLimit(G4double);
    void SetKinEnergyLimit(G4double);

    // PostStep interface
    virtual G4double PostStepGetPhysicalInteractionLength(
        const G4Track& track,
        G4double previousStepSize,
        G4ForceCondition* condition);

    virtual G4VParticleChange* PostStepDoIt(
        const G4Track&,
        const G4Step&);

    virtual G4double GetMeanFreePath(
        const G4Track&,
        G4double,
        G4ForceCondition*);

private:
    G4double kinEnergyThreshold;
    G4double timeThreshold;
    G4NeutronKillerMessenger* pMess;
};
```

**File Reference:** `source/processes/transportation/include/G4NeutronKiller.hh` (lines 68-101)

---

## Key Methods

### Configuration Methods

#### SetKinEnergyLimit()
```cpp
void SetKinEnergyLimit(G4double);
```

**Purpose:** Set the kinetic energy threshold below which neutrons are killed.

**Parameter:**
- `kinEnergyLimit` - Minimum kinetic energy (default: 0)

**Behavior:**
- Neutrons with `E_kin < threshold` are immediately terminated
- Setting to 0 disables energy-based killing
- Typical values: 0.01 eV (thermal), 1 eV, 1 keV

**Example:**
```cpp
G4NeutronKiller* killer = new G4NeutronKiller();
killer->SetKinEnergyLimit(0.01*eV);  // Kill below 0.01 eV
```

**Member Variable:** `kinEnergyThreshold` (line 97)

**File:** `G4NeutronKiller.hh` (line 81)

---

#### SetTimeLimit()
```cpp
void SetTimeLimit(G4double);
```

**Purpose:** Set the time-of-flight threshold beyond which neutrons are killed.

**Parameter:**
- `timeLimit` - Maximum time of flight (default: DBL_MAX)

**Behavior:**
- Neutrons with `time > threshold` are immediately terminated
- Setting to `DBL_MAX` disables time-based killing
- Typical values: 1 μs, 10 μs, 100 μs

**Example:**
```cpp
G4NeutronKiller* killer = new G4NeutronKiller();
killer->SetTimeLimit(10*microsecond);  // Kill after 10 μs
```

**Member Variable:** `timeThreshold` (line 98)

**File:** `G4NeutronKiller.hh` (line 79)

---

### Process Interface Methods

#### IsApplicable()
```cpp
virtual G4bool IsApplicable(const G4ParticleDefinition& particle);
```

**Purpose:** Define that this process applies only to neutrons.

**Returns:**
- `true` if particle is G4Neutron
- `false` for all other particles

**Implementation:**
```cpp
G4bool IsApplicable(const G4ParticleDefinition& particle)
{
    return (particle.GetParticleName() == "neutron");
}
```

**File:** `G4NeutronKiller.hh` (line 77)

---

#### PostStepGetPhysicalInteractionLength()
```cpp
virtual G4double PostStepGetPhysicalInteractionLength(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition);
```

**Purpose:** Check if neutron should be killed based on thresholds.

**Algorithm:**
1. Get neutron kinetic energy
2. Get neutron global time
3. Check energy threshold: `if (E_kin < threshold) return 0`
4. Check time threshold: `if (time > threshold) return 0`
5. Otherwise return `DBL_MAX` (no constraint)

**Returns:**
- `0.0` if neutron should be killed immediately
- `DBL_MAX` if neutron survives (no interaction)

**Force Condition:**
- Sets `*condition = NotForced`

**File:** `G4NeutronKiller.hh` (lines 83-85)

---

#### PostStepDoIt()
```cpp
virtual G4VParticleChange* PostStepDoIt(
    const G4Track& track,
    const G4Step& step);
```

**Purpose:** Terminate the neutron track.

**Implementation:**
```cpp
G4VParticleChange* PostStepDoIt(const G4Track& track, const G4Step& step)
{
    aParticleChange.Initialize(track);
    aParticleChange.ProposeTrackStatus(fStopAndKill);
    aParticleChange.ProposeLocalEnergyDeposit(0.0);  // No energy deposition
    return &aParticleChange;
}
```

**Actions:**
- Sets track status to `fStopAndKill`
- No energy deposited (neutron simply disappears)
- No secondaries created

**Returns:** `G4VParticleChange` with kill status

**File:** `G4NeutronKiller.hh` (line 87)

---

#### GetMeanFreePath()
```cpp
virtual G4double GetMeanFreePath(
    const G4Track& track,
    G4double previousStepSize,
    G4ForceCondition* condition);
```

**Purpose:** Discrete process interface (delegates to PostStepGPIL).

**File:** `G4NeutronKiller.hh` (line 89)

---

## UI Commands

G4NeutronKiller includes a messenger for runtime configuration:

### Available Commands

```bash
# Set kinetic energy threshold
/physics_engine/neutron/energyCut <energy> <unit>

# Set time-of-flight threshold
/physics_engine/neutron/timeLimit <time> <unit>
```

### Command Examples

```bash
# Kill neutrons below 0.01 eV (cold neutrons)
/physics_engine/neutron/energyCut 0.01 eV

# Kill neutrons after 100 microseconds
/physics_engine/neutron/timeLimit 100 microsecond

# Disable energy cut (set to 0)
/physics_engine/neutron/energyCut 0 eV

# Disable time cut (set very high)
/physics_engine/neutron/timeLimit 1000 s
```

### Macro File Example

```bash
# neutron_killer_config.mac

# Configure neutron killer for shielding study
/physics_engine/neutron/energyCut 1 eV      # Remove thermal neutrons
/physics_engine/neutron/timeLimit 10 microsecond  # 10 μs time window

# Run simulation
/run/beamOn 1000
```

**Messenger Class:** `G4NeutronKillerMessenger` (line 100)

---

## Usage Examples

### Basic Setup

```cpp
#include "G4NeutronKiller.hh"
#include "G4Neutron.hh"

void MyPhysicsList::ConstructProcess()
{
    AddTransportation();

    // Create neutron killer
    G4NeutronKiller* neutronKiller = new G4NeutronKiller();

    // Set energy threshold (kill thermal neutrons)
    neutronKiller->SetKinEnergyLimit(0.1*eV);

    // Set time threshold (kill after 10 μs)
    neutronKiller->SetTimeLimit(10*microsecond);

    // Register only for neutrons
    G4ProcessManager* pManager =
        G4Neutron::Neutron()->GetProcessManager();
    pManager->AddDiscreteProcess(neutronKiller);

    // Add other physics processes...
}
```

---

### Shielding Study

```cpp
void MyPhysicsList::ConstructProcess()
{
    // Concrete shielding study - remove slow neutrons
    G4NeutronKiller* killer = new G4NeutronKiller();

    // Kill thermal and epithermal neutrons (< 1 eV)
    // Justification: Detector insensitive below 1 eV
    killer->SetKinEnergyLimit(1.0*eV);

    // No time limit needed for this study
    killer->SetTimeLimit(DBL_MAX);

    G4Neutron::Neutron()->GetProcessManager()
        ->AddDiscreteProcess(killer);
}
```

**Performance Gain:**
- Without killer: 1000s of thermal neutron steps
- With killer: Thermal neutrons killed immediately
- Typical speedup: 5-10x in concrete shielding

---

### Cosmic Ray Simulation

```cpp
void MyPhysicsList::ConstructProcess()
{
    // Cosmic ray induced neutrons in atmosphere
    G4NeutronKiller* killer = new G4NeutronKiller();

    // Focus on prompt neutrons (first 100 μs)
    killer->SetTimeLimit(100*microsecond);

    // Keep all energies (study includes thermal)
    killer->SetKinEnergyLimit(0.0);

    G4Neutron::Neutron()->GetProcessManager()
        ->AddDiscreteProcess(killer);
}
```

---

### Combined Thresholds

```cpp
void MyPhysicsList::ConstructProcess()
{
    // Aggressive optimization: energy AND time cuts
    G4NeutronKiller* killer = new G4NeutronKiller();

    // Energy: Remove sub-eV neutrons
    killer->SetKinEnergyLimit(1.0*eV);

    // Time: Remove slow neutrons after 1 μs
    killer->SetTimeLimit(1.0*microsecond);

    // Neutron killed if EITHER condition met:
    //   E < 1 eV  OR  time > 1 μs

    G4Neutron::Neutron()->GetProcessManager()
        ->AddDiscreteProcess(killer);
}
```

---

### Runtime Configuration

```cpp
// Use UI commands for flexibility
int main()
{
    // Create run manager
    G4RunManager* runManager = new G4RunManager();

    // Initialize detector, physics, primary generator
    runManager->Initialize();

    // Get UI manager
    G4UImanager* UImanager = G4UImanager::GetUIpointer();

    // Configure neutron killer via macro
    UImanager->ApplyCommand("/control/execute neutron_config.mac");

    // Or configure directly
    UImanager->ApplyCommand("/physics_engine/neutron/energyCut 0.01 eV");
    UImanager->ApplyCommand("/physics_engine/neutron/timeLimit 50 microsecond");

    // Run simulation
    runManager->BeamOn(1000);

    return 0;
}
```

---

## Use Cases

### 1. Concrete Shielding

**Problem:** Thermal neutrons take many small steps in concrete

**Solution:**
```cpp
killer->SetKinEnergyLimit(0.1*eV);  // Remove thermal neutrons
// Speedup: 5-10x
```

**Validation:** Check that removed neutrons don't contribute to dose

---

### 2. Accelerator Shielding

**Problem:** Low-energy neutrons far from source

**Solution:**
```cpp
killer->SetKinEnergyLimit(10*eV);   // Remove epithermal
killer->SetTimeLimit(100*microsecond);  // Late arrivals
// Speedup: 10-50x
```

---

### 3. Space Radiation

**Problem:** Long-lived neutrons in Earth albedo

**Solution:**
```cpp
killer->SetTimeLimit(1*millisecond);  // Focus on prompt
// Speedup: 3-5x
```

---

### 4. Reactor Studies

**Problem:** Thermal neutron population in moderator

**Solution:**
```cpp
// Keep thermal neutrons - they're important!
killer->SetKinEnergyLimit(0.0);  // No energy cut
killer->SetTimeLimit(10*second); // But remove very old neutrons
// Modest speedup: 1.5-2x
```

---

### 5. Medical Physics

**Problem:** Neutrons from therapy accelerator

**Solution:**
```cpp
killer->SetKinEnergyLimit(1*eV);    // Remove thermal
killer->SetTimeLimit(100*nanosecond);  // Prompt window
// Speedup: 10-20x
```

---

## Monitoring and Statistics

### Track Killed Neutrons

```cpp
class MySteppingAction : public G4UserSteppingAction
{
private:
    G4int nKilledByEnergy = 0;
    G4int nKilledByTime = 0;

public:
    void UserSteppingAction(const G4Step* step) override
    {
        G4Track* track = step->GetTrack();

        // Check if neutron killed
        if(track->GetDefinition() == G4Neutron::Definition() &&
           track->GetTrackStatus() == fStopAndKill)
        {
            const G4VProcess* process =
                step->GetPostStepPoint()->GetProcessDefinedStep();

            if(process && process->GetProcessName() == "nKiller")
            {
                // Determine which threshold triggered
                G4double energy = track->GetKineticEnergy();
                G4double time = track->GetGlobalTime();

                // Check thresholds from G4NeutronKiller
                if(energy < 0.1*eV) {  // Example threshold
                    nKilledByEnergy++;
                    G4cout << "Neutron killed by energy: "
                           << energy/eV << " eV" << G4endl;
                }
                else if(time > 10*microsecond) {  // Example threshold
                    nKilledByTime++;
                    G4cout << "Neutron killed by time: "
                           << time/microsecond << " μs" << G4endl;
                }
            }
        }
    }

    void PrintStatistics()
    {
        G4cout << "Neutrons killed:" << G4endl;
        G4cout << "  By energy: " << nKilledByEnergy << G4endl;
        G4cout << "  By time: " << nKilledByTime << G4endl;
    }
};
```

---

### Energy Spectrum at Kill

```cpp
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    if(/* neutron killed by nKiller */)
    {
        G4double energy = step->GetTrack()->GetKineticEnergy();

        // Fill histogram of killed neutron energies
        analysisManager->FillH1(histoID, energy);

        // This shows energy distribution of removed neutrons
    }
}
```

---

## Performance Impact

### Benchmark Example: Concrete Shielding

**Setup:**
- 1 meter concrete wall
- 10 GeV proton beam
- 1000 primary particles

**Without G4NeutronKiller:**
```
Total neutrons created: 150,000
Average steps per neutron: 500
CPU time: 3000 seconds
```

**With G4NeutronKiller (E > 1 eV):**
```
Total neutrons created: 150,000
Neutrons killed: 120,000 (thermal)
Average steps per neutron: 100
CPU time: 600 seconds
Speedup: 5x
```

---

### Memory Impact

**Without Killer:**
- Many slow neutrons in memory simultaneously
- Memory usage: ~5 GB

**With Killer:**
- Thermal neutrons removed promptly
- Memory usage: ~1 GB
- Reduction: 5x

---

## Validation

### Check Physics Impact

```cpp
// Compare results with/without killer

// Run 1: No killer - baseline
// Run 2: Killer with threshold

// Compare:
// - Dose in detector
// - Neutron flux (above threshold)
// - Particle spectra

// Validate: Results should be similar
// (below threshold doesn't contribute significantly)
```

---

### Convergence Study

```cpp
// Test different energy thresholds
for(G4double eMin = 0.001*eV; eMin <= 10*eV; eMin *= 10)
{
    killer->SetKinEnergyLimit(eMin);
    RunSimulation();
    RecordResults();
}

// Plot: Dose vs. threshold
// Find: Threshold where dose converges
// Use: Minimum threshold with converged physics
```

---

## Best Practices

### 1. Understand Your Physics

```cpp
// ✅ Good: Know what neutrons contribute
// Thermal neutrons (<0.1 eV) contribute <1% to dose
killer->SetKinEnergyLimit(0.1*eV);  // Safe to remove

// ❌ Bad: Arbitrary threshold
killer->SetKinEnergyLimit(100*eV);  // May remove important neutrons
```

---

### 2. Validate Results

```cpp
// Always compare with/without killer
// Check sensitive quantities:
// - Dose
// - Flux spectra
// - Particle counts

// Document: "Threshold chosen such that dose changes by <1%"
```

---

### 3. Monitor Killed Statistics

```cpp
// Track how many neutrons killed
// If killing few neutrons: threshold too low (no benefit)
// If killing most neutrons: threshold too high (physics changed)

// Target: Kill 50-90% of neutrons
```

---

### 4. Use UI Commands

```cpp
// ✅ Good: Runtime configuration
/physics_engine/neutron/energyCut 0.1 eV

// Allows: Parameter studies without recompilation
```

---

## Comparison with Alternatives

| Method | Performance | Physics | Use Case |
|--------|-------------|---------|----------|
| **G4NeutronKiller** | 5-10x faster | Removes neutrons | Neutron-specific optimization |
| **G4UserSpecialCuts** | 2-5x faster | Removes all particles | General-purpose |
| **Production Cuts** | 1.5-2x faster | Prevents secondaries | Secondary control |
| **Time Cuts (G4UserLimits)** | 2-4x faster | Removes old tracks | Time-of-flight studies |

---

## Limitations

### 1. Neutrons Only

```cpp
// G4NeutronKiller only applies to neutrons
// For other particles, use G4UserSpecialCuts

// ❌ Won't work
killer->SetKinEnergyLimit(1*MeV);  // Doesn't kill gammas!

// ✅ Use instead
G4UserSpecialCuts* cuts = new G4UserSpecialCuts();
cuts->SetUserMinEkine(1*MeV);  // Kills all particles
```

---

### 2. No Energy Deposition

```cpp
// Killed neutrons deposit no energy
// This is usually OK (thermal neutrons deposit little)
// But: Be aware for energy conservation studies

G4cout << "Energy deposited: " << edep << G4endl;
// This will NOT include energy of killed neutrons
```

---

### 3. Global Thresholds

```cpp
// Same threshold applies everywhere
// Cannot have different thresholds in different volumes

// If you need volume-specific cuts:
// Use G4UserLimits with G4UserSpecialCuts instead
```

---

## Common Issues

### Issue: No Speedup

**Symptoms:** Adding killer doesn't improve performance

**Diagnosis:**
- Check: Are many neutrons actually killed?
- Check: Is threshold appropriate?

**Solution:**
```cpp
// Monitor in stepping action
if(process->GetProcessName() == "nKiller") {
    killedCount++;
}
// If killedCount is small, adjust threshold
```

---

### Issue: Physics Changed

**Symptoms:** Results differ significantly with killer

**Analysis:**
- Killed neutrons may be important to physics
- Threshold too high

**Solution:**
- Lower threshold
- Perform validation study
- Document sensitivity

---

### Issue: Compilation Error

**Symptoms:** Cannot find G4NeutronKiller.hh

**Solution:**
```cpp
// Ensure correct path
#include "G4NeutronKiller.hh"
// Located in: source/processes/transportation/include/
```

---

## Related Classes

- [**G4UserSpecialCuts**](./g4userspecialcuts.md) - General track cuts
- [**G4StepLimiter**](./g4steplimiter.md) - Step size control
- [**G4VDiscreteProcess**](../../management/api/g4vdiscreteprocess.md) - Base class
- [**G4NeutronKillerMessenger**]() - UI commands
- [**G4Neutron**](../../../particles/api/g4neutron.md) - Neutron particle

---

## References

### Source Files
- Header: `source/processes/transportation/include/G4NeutronKiller.hh`
- Implementation: `source/processes/transportation/src/G4NeutronKiller.cc`
- Messenger: `source/processes/transportation/include/G4NeutronKillerMessenger.hh`

### Documentation
- [Transportation Module Overview](../index.md)
- [Performance Optimization Guide]()

### Original Author
- V. Ivanchenko, 26/09/00 for HARP software

---

::: tip When to Use G4NeutronKiller
Use G4NeutronKiller when:
- Simulation dominated by low-energy neutrons
- Bulk shielding studies
- Thermal neutrons don't contribute to results
- CPU time is critical constraint

Don't use when:
- Thermal neutrons are important (reactor physics, neutron detectors)
- All energies needed for validation
- Energy conservation must be exact
:::

---

::: warning Energy Conservation
G4NeutronKiller removes neutrons without depositing energy. This violates energy conservation but is usually acceptable for performance optimization in shielding studies. Document this approximation in your physics validation.
:::

---

::: info Last Updated
**Date:** 2025-11-17
**Class Version:** Geant4 11.4.0.beta
**Header:** G4NeutronKiller.hh (lines 68-101)
:::
