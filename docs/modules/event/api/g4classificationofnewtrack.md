# G4ClassificationOfNewTrack API Documentation

## Overview

`G4ClassificationOfNewTrack` is an enumeration that defines the possible classifications for tracks newly pushed to the stack. This classification determines how tracks are handled by the stacking mechanism and controls track execution priority, postponement, or termination.

The classification is returned by `G4UserStackingAction::ClassifyNewTrack()` and determines which stack (urgent, waiting, or postpone) a track is placed in, or whether it should be killed immediately.

::: tip Header File
**Location:** `source/event/include/G4ClassificationOfNewTrack.hh`
:::

## Enumeration Values

### Core Classifications

`source/event/include/G4ClassificationOfNewTrack.hh:41-46`

```cpp
enum G4ClassificationOfNewTrack
{
  fUrgent = 0,     // put into the urgent stack
  fWaiting = 1,    // put into the waiting stack
  fPostpone = -1,  // postpone to the next event
  fKill = -9       // kill without stacking
}
```

#### fUrgent (Value: 0)
**Purpose:** Track processed immediately with highest priority

**Behavior:**
- Track pushed to urgent stack
- Processed before any tracks in waiting stacks
- Default classification for primary particles
- Used for tracks requiring immediate processing

**Example Usage:**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Primary particles and their immediate secondaries
    if (track->GetParentID() == 0) {
        return fUrgent;
    }

    // High-energy particles processed immediately
    if (track->GetKineticEnergy() > 100*MeV) {
        return fUrgent;
    }

    return fWaiting;
}
```

#### fWaiting (Value: 1)
**Purpose:** Track postponed until urgent stack is empty

**Behavior:**
- Track pushed to waiting stack
- Processed only after all urgent tracks complete
- Transferred to urgent stack when urgent becomes empty
- Triggers `G4UserStackingAction::NewStage()` callback

**Example Usage:**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Separate electromagnetic shower from hadronic cascade
    if (track->GetDefinition() == G4Gamma::Definition() ||
        track->GetDefinition() == G4Electron::Definition() ||
        track->GetDefinition() == G4Positron::Definition()) {
        return fWaiting;  // Process EM shower after primary track
    }

    return fUrgent;
}
```

::: tip Stage Processing
When urgent stack empties, waiting tracks move to urgent stack and `NewStage()` is called. This enables stage-by-stage event processing.
:::

#### fPostpone (Value: -1)
**Purpose:** Track saved for next event

**Behavior:**
- Track pushed to postpone stack
- Not processed in current event
- Automatically re-injected at start of next event
- Parent ID becomes negative to indicate postponed origin

**Example Usage:**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Postpone low-energy neutrons for later processing
    if (track->GetDefinition() == G4Neutron::Definition() &&
        track->GetKineticEnergy() < 1*eV) {
        return fPostpone;
    }

    // Check if track was previously postponed
    if (track->GetParentID() < 0) {
        G4cout << "Processing postponed track from previous event"
               << G4endl;
    }

    return fUrgent;
}
```

::: warning Performance Impact
Postponing many tracks can accumulate across events. Monitor postpone stack size to avoid memory issues.
:::

#### fKill (Value: -9)
**Purpose:** Track immediately deleted without processing

**Behavior:**
- Track deleted without stacking
- No further processing occurs
- Trajectory not stored
- Memory immediately freed

**Example Usage:**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Kill tracks outside region of interest
    G4double r = track->GetPosition().mag();
    if (r > 10*m) {
        return fKill;
    }

    // Kill low-energy electrons to save time
    if (track->GetDefinition() == G4Electron::Definition() &&
        track->GetKineticEnergy() < 10*keV) {
        return fKill;
    }

    // Kill optical photons if not needed
    if (track->GetDefinition() == G4OpticalPhoton::Definition()) {
        return fKill;
    }

    return fUrgent;
}
```

::: tip Performance Optimization
Killing uninteresting tracks early improves performance by reducing tracking overhead.
:::

### Additional Waiting Stacks

`source/event/include/G4ClassificationOfNewTrack.hh:47-52`

```cpp
// Available only if user increases number of waiting stacks
fWaiting_1 = 11, fWaiting_2 = 12, fWaiting_3 = 13,
fWaiting_4 = 14, fWaiting_5 = 15, fWaiting_6 = 16,
fWaiting_7 = 17, fWaiting_8 = 18, fWaiting_9 = 19,
fWaiting_10 = 20
```

**Purpose:** Additional priority levels for complex stacking scenarios

**Activation:**
```cpp
// In main() or initialization
G4RunManager* runManager = G4RunManager::GetRunManager();
runManager->SetNumberOfAdditionalWaitingStacks(5);  // Enable fWaiting_1 to fWaiting_5
```

**Example Usage:**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Multi-level particle separation by energy
    G4double energy = track->GetKineticEnergy();

    if (energy > 1*GeV)
        return fUrgent;        // High energy - immediate
    else if (energy > 100*MeV)
        return fWaiting_1;     // Medium-high energy
    else if (energy > 10*MeV)
        return fWaiting_2;     // Medium energy
    else if (energy > 1*MeV)
        return fWaiting_3;     // Low-medium energy
    else
        return fWaiting_4;     // Low energy
}
```

::: info Processing Order
Waiting stacks process in order: fWaiting, fWaiting_1, fWaiting_2, etc. Each triggers `NewStage()` when transferring to urgent.
:::

### Sub-Event Parallelism Classifications

`source/event/include/G4ClassificationOfNewTrack.hh:53-60`

```cpp
// Available only for sub-event parallelism (advanced feature)
fSubEvent_0 = 100,
fSubEvent_1 = 101, fSubEvent_2 = 102, fSubEvent_3 = 103,
fSubEvent_4 = 104, fSubEvent_5 = 105, fSubEvent_6 = 106,
fSubEvent_7 = 107, fSubEvent_8 = 108, fSubEvent_9 = 109,
fSubEvent_A = 110, fSubEvent_B = 111, fSubEvent_C = 112,
fSubEvent_D = 113, fSubEvent_E = 114, fSubEvent_F = 115
```

**Purpose:** Classify tracks for parallel sub-event processing

**Behavior:**
- Tracks grouped into sub-events for parallel processing
- Enables intra-event parallelism
- Requires sub-event type registration

**Example Usage:**
```cpp
// In initialization
void MyActionInitialization::Build() const
{
    G4RunManager* runManager = G4RunManager::GetRunManager();

    // Register sub-event types with track capacity
    runManager->RegisterSubEventType(fSubEvent_1, 1000);  // EM showers
    runManager->RegisterSubEventType(fSubEvent_2, 500);   // Hadronic
}

// In stacking action
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Classify for parallel processing
    if (track->GetDefinition() == G4Gamma::Definition() ||
        track->GetDefinition() == G4Electron::Definition()) {
        return fSubEvent_1;  // EM shower - parallel processing
    }

    if (track->GetDefinition()->GetParticleType() == "nucleus" ||
        track->GetDefinition()->GetParticleType() == "baryon") {
        return fSubEvent_2;  // Hadronic - parallel processing
    }

    return fUrgent;
}
```

::: warning Advanced Feature
Sub-event parallelism is an advanced feature for expert users. Requires careful setup and understanding of thread safety.
:::

## Complete Usage Examples

### Example 1: Energy-Based Track Filtering

```cpp
class MyStackingAction : public G4UserStackingAction
{
public:
    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        // Kill very low energy particles
        if (track->GetKineticEnergy() < fEnergyThreshold) {
            return fKill;
        }

        // Process primary particles immediately
        if (track->GetParentID() == 0) {
            return fUrgent;
        }

        // Postpone thermal neutrons
        if (track->GetDefinition() == G4Neutron::Definition() &&
            track->GetKineticEnergy() < 0.1*eV) {
            return fPostpone;
        }

        return fUrgent;
    }

private:
    G4double fEnergyThreshold = 1*keV;
};
```

### Example 2: Staged Electromagnetic Shower Processing

```cpp
class ShowerStackingAction : public G4UserStackingAction
{
public:
    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        // Primary particle processes first
        if (track->GetParentID() == 0) {
            return fUrgent;
        }

        // Separate EM shower into waiting stack
        G4String particleName = track->GetDefinition()->GetParticleName();
        if (particleName == "gamma" ||
            particleName == "e-" ||
            particleName == "e+") {
            return fWaiting;
        }

        return fUrgent;
    }

    void NewStage() override
    {
        G4cout << "Primary track complete. Processing EM shower..."
               << G4endl;

        // EM shower tracks now transferred to urgent stack
        // and will be processed
    }
};
```

### Example 3: Region of Interest Tracking

```cpp
class ROIStackingAction : public G4UserStackingAction
{
public:
    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        G4ThreeVector position = track->GetPosition();

        // Kill tracks outside cylindrical region of interest
        G4double r = std::sqrt(position.x()*position.x() +
                              position.y()*position.y());
        G4double z = std::abs(position.z());

        if (r > fMaxRadius || z > fMaxZ) {
            return fKill;
        }

        // Kill tracks below energy threshold
        if (track->GetKineticEnergy() < fMinEnergy) {
            return fKill;
        }

        return fUrgent;
    }

private:
    G4double fMaxRadius = 50*cm;
    G4double fMaxZ = 100*cm;
    G4double fMinEnergy = 1*keV;
};
```

### Example 4: Multi-Stage Calorimeter Simulation

```cpp
class CalorimeterStackingAction : public G4UserStackingAction
{
public:
    CalorimeterStackingAction() {
        // Enable 3 additional waiting stacks
        G4RunManager::GetRunManager()->SetNumberOfAdditionalWaitingStacks(3);
    }

    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        G4String particleName = track->GetDefinition()->GetParticleName();
        G4double energy = track->GetKineticEnergy();

        // Stage 1 (Urgent): Primary hadrons
        if (track->GetParentID() == 0) {
            return fUrgent;
        }

        // Stage 2 (Waiting): High-energy secondaries
        if (energy > 100*MeV) {
            return fWaiting;
        }

        // Stage 3 (Waiting_1): Hadronic secondaries
        if (particleName == "neutron" || particleName == "proton" ||
            particleName == "pi+" || particleName == "pi-") {
            return fWaiting_1;
        }

        // Stage 4 (Waiting_2): Electromagnetic shower
        if (particleName == "gamma" || particleName == "e-" ||
            particleName == "e+") {
            return fWaiting_2;
        }

        // Stage 5 (Waiting_3): Low-energy particles
        return fWaiting_3;
    }

    void NewStage() override
    {
        fStage++;
        G4cout << "Starting stage " << fStage << G4endl;
    }

private:
    G4int fStage = 0;
};
```

## Decision Flow Chart

```
ClassifyNewTrack() called
         |
         v
    [Evaluate track properties]
         |
         +--- Track should be killed? ---------> return fKill
         |
         +--- Track for next event? -----------> return fPostpone
         |
         +--- Immediate processing? -----------> return fUrgent
         |
         +--- Delayed processing? -------------> return fWaiting[_N]
         |
         +--- Parallel sub-event? -------------> return fSubEvent_N
```

## Performance Considerations

1. **fKill vs Processing**: Killing unneeded tracks saves CPU time
   - No tracking, physics processes, or geometry navigation
   - Immediate memory release

2. **fWaiting for Showers**: Separating EM showers improves cache performance
   - Primary track completes before secondaries
   - Better memory locality

3. **fPostpone for Rare Events**: Thermal neutrons or long-lived particles
   - Prevents event stalling on slow processes
   - Distributes computational load

4. **Multiple Waiting Stacks**: Fine-grained control
   - Process tracks in energy order
   - Group similar particles together

## Common Patterns

### Pattern 1: Kill Low-Energy Particles
```cpp
if (track->GetKineticEnergy() < threshold) return fKill;
```

### Pattern 2: Separate EM Cascade
```cpp
if (IsEMParticle(track)) return fWaiting;
```

### Pattern 3: Postpone Thermal Neutrons
```cpp
if (IsThermalNeutron(track)) return fPostpone;
```

### Pattern 4: ROI Culling
```cpp
if (!InsideROI(track->GetPosition())) return fKill;
```

## Thread Safety

### Thread-Local Classification
- Classification occurs within worker thread
- No synchronization needed
- Each thread has independent stacks

### Sub-Event Parallelism
- Sub-event classifications enable thread-level parallelism
- Requires mutex protection in stacking action
- Managed automatically by framework

## See Also

- [G4UserStackingAction](g4userstackingaction.md) - Base class for user stacking actions
- [G4StackManager](g4stackmanager.md) - Stack management system
- [G4TrackStack](g4trackstack.md) - LIFO track stack
- [G4StackedTrack](g4stackedtrack.md) - Track wrapper for stacking
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4ClassificationOfNewTrack.hh`
:::
