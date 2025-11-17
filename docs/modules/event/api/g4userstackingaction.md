# G4UserStackingAction API Documentation

## Overview

`G4UserStackingAction` is the base class for one of Geant4's user action classes that provides hooks into the track stacking mechanism managed by `G4StackManager`. This class allows users to control how newly created tracks are classified and processed, enabling sophisticated event processing strategies.

Users implement their own stacking action by deriving from this class and overriding its virtual methods. The stacking action is invoked at critical points:
- When a new track is created (`ClassifyNewTrack`)
- When the urgent stack becomes empty (`NewStage`)
- At the beginning of each event (`PrepareNewEvent`)

::: tip Header File
**Location:** `source/event/include/G4UserStackingAction.hh`
:::

## Class Declaration

`source/event/include/G4UserStackingAction.hh:44-117`

```cpp
class G4UserStackingAction
{
  public:
    G4UserStackingAction();
    virtual ~G4UserStackingAction() = default;

    inline void SetStackManager(G4StackManager* value);

    // Virtual methods to be implemented by user
    virtual G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* aTrack);
    virtual void NewStage();
    virtual void PrepareNewEvent();

  protected:
    G4StackManager* stackManager = nullptr;  // Not owned
};
```

## Constructor and Destructor

### Constructor
`source/event/include/G4UserStackingAction.hh:48`

```cpp
G4UserStackingAction();
```

**Purpose:** Initialize base class

**Usage:**
```cpp
class MyStackingAction : public G4UserStackingAction
{
public:
    MyStackingAction()
        : G4UserStackingAction(),
          fEnergyThreshold(1*keV),
          fKillOpticalPhotons(true)
    {
        G4cout << "MyStackingAction constructed" << G4endl;
    }

private:
    G4double fEnergyThreshold;
    G4bool fKillOpticalPhotons;
};
```

### Destructor
`source/event/include/G4UserStackingAction.hh:49`

```cpp
virtual ~G4UserStackingAction() = default;
```

**Behavior:** Default virtual destructor for proper cleanup of derived classes

## Core Virtual Methods

### ClassifyNewTrack()
`source/event/include/G4UserStackingAction.hh:57-77`

```cpp
virtual G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* aTrack);
```

**Purpose:** Determine how a newly created track should be handled

**Parameters:**
- `aTrack`: Pointer to the newly created track (do not modify or delete)

**Returns:** `G4ClassificationOfNewTrack` enum value:
- `fUrgent`: Process immediately (pushed to urgent stack)
- `fWaiting`: Process later (pushed to waiting stack)
- `fPostpone`: Save for next event (pushed to postpone stack)
- `fKill`: Delete immediately without processing
- `fWaiting_1` through `fWaiting_10`: Additional waiting stacks (if configured)
- `fSubEvent_0` through `fSubEvent_F`: Sub-event parallel processing (advanced)

**Default Implementation:** Returns `fUrgent` for all tracks

**Track Parent ID:**
- `parentID == 0`: Primary particle
- `parentID > 0`: Secondary particle from current event
- `parentID < 0`: Postponed particle from previous event

**Example 1: Energy-Based Filtering**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Kill low-energy particles
    if (track->GetKineticEnergy() < fEnergyThreshold) {
        return fKill;
    }

    // Process primaries immediately
    if (track->GetParentID() == 0) {
        return fUrgent;
    }

    return fUrgent;
}
```

**Example 2: Particle Type Filtering**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    G4ParticleDefinition* particle = track->GetDefinition();

    // Kill optical photons if not needed
    if (particle == G4OpticalPhoton::Definition()) {
        return fKill;
    }

    // Postpone thermal neutrons
    if (particle == G4Neutron::Definition() &&
        track->GetKineticEnergy() < 1*eV) {
        return fPostpone;
    }

    // Separate EM shower for staged processing
    if (particle == G4Gamma::Definition() ||
        particle == G4Electron::Definition() ||
        particle == G4Positron::Definition()) {
        if (track->GetParentID() != 0) {  // Secondaries only
            return fWaiting;
        }
    }

    return fUrgent;
}
```

**Example 3: Region of Interest**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Get track position
    G4ThreeVector position = track->GetPosition();
    G4double r = std::sqrt(position.x()*position.x() +
                          position.y()*position.y());
    G4double z = std::abs(position.z());

    // Kill tracks outside detector region
    if (r > fMaxRadius || z > fMaxZ) {
        return fKill;
    }

    return fUrgent;
}
```

**Example 4: Time Window**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Kill tracks created after time window
    if (track->GetGlobalTime() > fTimeWindow) {
        return fKill;
    }

    return fUrgent;
}
```

::: tip Performance Optimization
Killing unwanted tracks early (in `ClassifyNewTrack`) avoids expensive tracking, geometry navigation, and physics calculations.
:::

### NewStage()
`source/event/include/G4UserStackingAction.hh:78-102`

```cpp
virtual void NewStage();
```

**Purpose:** Called when urgent stack becomes empty and waiting tracks transfer to urgent stack

**Trigger Conditions:**
1. Urgent stack becomes empty
2. Waiting stack(s) have tracks
3. Tracks transferred from waiting to urgent

**Calling Sequence:**
```
1. Process all tracks in urgent stack
2. Urgent stack becomes empty
3. Transfer waiting → urgent
4. Call NewStage()
5. Resume processing urgent stack
```

**Default Implementation:** Does nothing

**Usage Scenarios:**
- Monitor event processing stages
- Implement stage-dependent behavior
- Re-classify tracks in urgent stack
- Abort event based on conditions

**Example 1: Stage Monitoring**
```cpp
void MyStackingAction::NewStage()
{
    fStage++;
    G4cout << "=== Stage " << fStage << " ===" << G4endl;
    G4cout << "Primary track complete, processing secondaries"
           << G4endl;

    // Log stack sizes
    G4cout << "Urgent stack: "
           << stackManager->GetNUrgentTrack() << " tracks" << G4endl;
    G4cout << "Waiting stack: "
           << stackManager->GetNWaitingTrack() << " tracks" << G4endl;
}
```

**Example 2: Re-classification**
```cpp
void MyStackingAction::NewStage()
{
    fStage++;

    if (fStage == 2) {
        // Re-classify all waiting tracks now in urgent stack
        // This will call ClassifyNewTrack() again for each track
        stackManager->ReClassify();

        G4cout << "Re-classified tracks for stage 2" << G4endl;
    }
}
```

**Example 3: Conditional Event Abortion**
```cpp
void MyStackingAction::NewStage()
{
    // Abort if too many secondaries
    G4int nUrgent = stackManager->GetNUrgentTrack();

    if (nUrgent > fMaxAllowedTracks) {
        G4cout << "ERROR: Too many tracks (" << nUrgent
               << "), aborting event" << G4endl;

        stackManager->clear();  // Clear all stacks
        return;
    }

    // Or use global abort
    // G4UImanager::GetUIpointer()->ApplyCommand("/event/abort");
}
```

**Example 4: Stage-Dependent Classification**
```cpp
class MultiStageStackingAction : public G4UserStackingAction
{
public:
    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        if (fStage == 0) {
            // Stage 0: Only process primary
            if (track->GetParentID() == 0)
                return fUrgent;
            else
                return fWaiting;
        }
        else if (fStage == 1) {
            // Stage 1: Process high-energy secondaries
            if (track->GetKineticEnergy() > 100*MeV)
                return fUrgent;
            else
                return fWaiting;
        }
        else {
            // Stage 2+: Process everything
            return fUrgent;
        }
    }

    void NewStage() override
    {
        fStage++;
        G4cout << "Entering stage " << fStage << G4endl;
    }

private:
    G4int fStage = 0;
};
```

::: info Re-classification
Call `stackManager->ReClassify()` in `NewStage()` to re-evaluate all tracks currently in the urgent stack (transferred from waiting).
:::

### PrepareNewEvent()
`source/event/include/G4UserStackingAction.hh:103-112`

```cpp
virtual void PrepareNewEvent();
```

**Purpose:** Called at the beginning of each event, before primary particles are generated

**Calling Sequence:**
```
1. Call PrepareNewEvent()
2. Generate primary particles
3. Start event processing
```

**Stack State:**
- Urgent stack: Empty
- Waiting stack: Empty
- Postpone stack: May contain postponed tracks from previous event

**Default Implementation:** Does nothing

**Usage Scenarios:**
- Initialize per-event counters
- Reset classification criteria
- Log event start
- Configure event-specific behavior

**Example 1: Event Initialization**
```cpp
void MyStackingAction::PrepareNewEvent()
{
    // Reset per-event counters
    fStage = 0;
    fTracksKilled = 0;
    fTracksPostponed = 0;

    G4cout << "=== Event " << GetEventID() << " ===" << G4endl;

    // Check for postponed tracks from previous event
    G4int nPostponed = stackManager->GetNPostponedTrack();
    if (nPostponed > 0) {
        G4cout << "Processing " << nPostponed
               << " postponed tracks from previous event" << G4endl;
    }
}
```

**Example 2: Dynamic Configuration**
```cpp
class AdaptiveStackingAction : public G4UserStackingAction
{
public:
    void PrepareNewEvent() override
    {
        // Adapt energy threshold based on event number
        G4int eventID = GetCurrentEventID();

        if (eventID < 100) {
            fEnergyThreshold = 10*keV;  // Tight cut for early events
        } else {
            fEnergyThreshold = 1*keV;   // Relaxed cut later
        }

        G4cout << "Event " << eventID
               << ": energy threshold = "
               << fEnergyThreshold/keV << " keV" << G4endl;
    }

    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        if (track->GetKineticEnergy() < fEnergyThreshold)
            return fKill;
        return fUrgent;
    }

private:
    G4double fEnergyThreshold = 1*keV;
};
```

**Example 3: Event Monitoring**
```cpp
void MyStackingAction::PrepareNewEvent()
{
    fEventStartTime = std::chrono::high_resolution_clock::now();
    fInitialMemory = GetCurrentMemoryUsage();

    G4cout << "Event preparation complete" << G4endl;
}
```

## Protected Members

### stackManager
`source/event/include/G4UserStackingAction.hh:115`

```cpp
protected:
    G4StackManager* stackManager = nullptr;  // Not owned
```

**Type:** `G4StackManager*`

**Purpose:** Pointer to the stack manager for advanced operations

**Set By:** `G4EventManager` via `SetStackManager()`

**Usage:**
```cpp
void MyStackingAction::NewStage()
{
    // Query stack manager
    G4int nUrgent = stackManager->GetNUrgentTrack();
    G4int nWaiting = stackManager->GetNWaitingTrack();

    // Re-classify if needed
    if (someCondition) {
        stackManager->ReClassify();
    }

    // Abort event if needed
    if (errorCondition) {
        stackManager->clear();
    }

    // Transfer stacks manually
    stackManager->TransferStackedTracks(fWaiting, fUrgent);
}
```

**Available Methods:**
- `GetNUrgentTrack()`: Count urgent tracks
- `GetNWaitingTrack()`: Count waiting tracks
- `GetNPostponedTrack()`: Count postponed tracks
- `ReClassify()`: Re-run ClassifyNewTrack on all urgent tracks
- `clear()`: Clear all stacks (abort event)
- `TransferStackedTracks()`: Manually transfer between stacks
- `SetNumberOfAdditionalWaitingStacks()`: Configure extra waiting stacks

::: warning Ownership
The stacking action does NOT own the stack manager. Do not delete it.
:::

## Complete Examples

### Example 1: Energy and Region Filtering

```cpp
class FilteringStackingAction : public G4UserStackingAction
{
public:
    FilteringStackingAction()
        : fEnergyThreshold(10*keV),
          fMaxRadius(50*cm),
          fMaxZ(100*cm)
    {}

    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        // Energy cut
        if (track->GetKineticEnergy() < fEnergyThreshold) {
            fKilledLowEnergy++;
            return fKill;
        }

        // Geometry cut
        G4ThreeVector pos = track->GetPosition();
        G4double r = pos.perp();
        G4double z = std::abs(pos.z());

        if (r > fMaxRadius || z > fMaxZ) {
            fKilledOutsideROI++;
            return fKill;
        }

        return fUrgent;
    }

    void PrepareNewEvent() override
    {
        fKilledLowEnergy = 0;
        fKilledOutsideROI = 0;
    }

    void EndOfEvent()  // Called by your EventAction
    {
        G4cout << "Tracks killed:" << G4endl;
        G4cout << "  Low energy: " << fKilledLowEnergy << G4endl;
        G4cout << "  Outside ROI: " << fKilledOutsideROI << G4endl;
    }

private:
    G4double fEnergyThreshold;
    G4double fMaxRadius;
    G4double fMaxZ;
    G4int fKilledLowEnergy = 0;
    G4int fKilledOutsideROI = 0;
};
```

### Example 2: Multi-Stage Calorimeter Simulation

```cpp
class CalorimeterStackingAction : public G4UserStackingAction
{
public:
    CalorimeterStackingAction()
    {
        // Enable additional waiting stacks for staging
        // (Must be called via G4RunManager in main())
    }

    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        G4ParticleDefinition* particle = track->GetDefinition();
        G4double energy = track->GetKineticEnergy();

        // Stage 0: Primary particles
        if (track->GetParentID() == 0) {
            return fUrgent;
        }

        // Stage 1: High-energy secondaries
        if (energy > 1*GeV) {
            return fUrgent;
        }

        // Stage 2: Hadronic particles
        if (particle->GetParticleType() == "nucleus" ||
            particle->GetParticleType() == "baryon" ||
            particle->GetParticleType() == "meson") {
            return fWaiting;
        }

        // Stage 3: EM shower
        if (particle == G4Gamma::Definition() ||
            particle == G4Electron::Definition() ||
            particle == G4Positron::Definition()) {
            return fWaiting_1;
        }

        // Stage 4: Everything else
        return fWaiting_2;
    }

    void NewStage() override
    {
        fStage++;

        const char* stageNames[] = {
            "Primary particles",
            "Hadronic cascade",
            "EM shower",
            "Low-energy particles"
        };

        if (fStage <= 3) {
            G4cout << "=== Stage " << fStage << ": "
                   << stageNames[fStage] << " ===" << G4endl;
        }

        // Monitor stack sizes
        G4cout << "  Urgent: " << stackManager->GetNUrgentTrack()
               << " tracks" << G4endl;
    }

    void PrepareNewEvent() override
    {
        fStage = 0;
    }

private:
    G4int fStage = 0;
};
```

### Example 3: Time-Based Event Abortion

```cpp
class TimeWindowStackingAction : public G4UserStackingAction
{
public:
    TimeWindowStackingAction(G4double timeWindow = 100*ns)
        : fTimeWindow(timeWindow)
    {}

    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        G4double globalTime = track->GetGlobalTime();

        // Kill tracks beyond time window
        if (globalTime > fTimeWindow) {
            return fKill;
        }

        // Postpone tracks near window edge
        if (globalTime > 0.9 * fTimeWindow) {
            return fPostpone;
        }

        return fUrgent;
    }

    void NewStage() override
    {
        // Check if event took too long
        if (fProcessingTime > fMaxProcessingTime) {
            G4cout << "WARNING: Event processing timeout, aborting"
                   << G4endl;
            stackManager->clear();
        }
    }

    void PrepareNewEvent() override
    {
        fEventStartTime = std::chrono::high_resolution_clock::now();
        fProcessingTime = 0;
    }

private:
    G4double fTimeWindow;
    G4double fMaxProcessingTime = 10.0;  // seconds
    G4double fProcessingTime = 0;
    std::chrono::time_point<std::chrono::high_resolution_clock>
        fEventStartTime;
};
```

### Example 4: Particle Counting and Statistics

```cpp
class StatisticsStackingAction : public G4UserStackingAction
{
public:
    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        // Count particles by type
        G4String particleName = track->GetDefinition()->GetParticleName();
        fParticleCounts[particleName]++;
        fParticleEnergies[particleName] += track->GetKineticEnergy();

        // Count by classification
        G4ClassificationOfNewTrack classification = DetermineClassification(track);
        fClassificationCounts[classification]++;

        return classification;
    }

    void NewStage() override
    {
        fStages++;
    }

    void PrepareNewEvent() override
    {
        fParticleCounts.clear();
        fParticleEnergies.clear();
        fClassificationCounts.clear();
        fStages = 0;
    }

    void PrintStatistics()
    {
        G4cout << "\n=== Stacking Statistics ===" << G4endl;

        G4cout << "Particles created:" << G4endl;
        for (const auto& pair : fParticleCounts) {
            G4cout << "  " << pair.first << ": "
                   << pair.second << " ("
                   << fParticleEnergies[pair.first]/MeV << " MeV)"
                   << G4endl;
        }

        G4cout << "\nClassifications:" << G4endl;
        G4cout << "  fUrgent: " << fClassificationCounts[fUrgent] << G4endl;
        G4cout << "  fWaiting: " << fClassificationCounts[fWaiting] << G4endl;
        G4cout << "  fPostpone: " << fClassificationCounts[fPostpone] << G4endl;
        G4cout << "  fKill: " << fClassificationCounts[fKill] << G4endl;

        G4cout << "\nProcessing stages: " << fStages << G4endl;
    }

private:
    G4ClassificationOfNewTrack DetermineClassification(const G4Track* track)
    {
        // Your classification logic...
        return fUrgent;
    }

    std::map<G4String, G4int> fParticleCounts;
    std::map<G4String, G4double> fParticleEnergies;
    std::map<G4ClassificationOfNewTrack, G4int> fClassificationCounts;
    G4int fStages = 0;
};
```

## Registration

### In ActionInitialization

```cpp
class MyActionInitialization : public G4VUserActionInitialization
{
public:
    void Build() const override
    {
        // Register stacking action
        SetUserAction(new MyStackingAction());

        // Also register other actions...
        SetUserAction(new MyPrimaryGeneratorAction());
        SetUserAction(new MyEventAction());
        SetUserAction(new MyRunAction());
    }

    void BuildForMaster() const override
    {
        // Master thread doesn't need stacking action
        SetUserAction(new MyRunAction());
    }
};
```

### In main()

```cpp
int main(int argc, char** argv)
{
    // Construct run manager
    auto runManager = new G4RunManager();

    // Set mandatory initialization classes
    runManager->SetUserInitialization(new MyDetectorConstruction());
    runManager->SetUserInitialization(new MyPhysicsList());

    // Set user action initialization
    runManager->SetUserInitialization(new MyActionInitialization());

    // Optional: Configure additional waiting stacks
    runManager->SetNumberOfAdditionalWaitingStacks(3);

    // Initialize
    runManager->Initialize();

    // Run
    runManager->BeamOn(numberOfEvents);

    delete runManager;
    return 0;
}
```

## Best Practices

### 1. Kill Early
```cpp
// GOOD: Kill in ClassifyNewTrack
if (uninteresting) return fKill;

// BAD: Let track process then kill in SteppingAction
// (wastes CPU on tracking, geometry, physics)
```

### 2. Use Const Track Pointer
```cpp
// CORRECT: Track is const
G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track)
{
    // Read only - do not modify track
    G4double energy = track->GetKineticEnergy();
    return fUrgent;
}
```

### 3. Thread-Local State
```cpp
class MyStackingAction : public G4UserStackingAction
{
private:
    // GOOD: Thread-local variables (one per thread)
    G4int fEventCounter = 0;

    // AVOID: Static variables shared between threads
    // static G4int fGlobalCounter;  // Race condition!
};
```

### 4. Monitor Performance
```cpp
void NewStage() override
{
    // Check for performance issues
    G4int nTracks = stackManager->GetNUrgentTrack();

    if (nTracks > 100000) {
        G4cout << "WARNING: Very large stack (" << nTracks
               << " tracks). Consider tighter cuts." << G4endl;
    }
}
```

## Thread Safety

### Worker Threads
- Each worker thread has its own stacking action instance
- State variables are thread-local
- No synchronization needed

### Master Thread
- Master thread does NOT have stacking action (events not processed)
- Stacking action created only for worker threads

## See Also

- [G4ClassificationOfNewTrack](g4classificationofnewtrack.md) - Track classification enum
- [G4StackManager](g4stackmanager.md) - Stack management system
- [G4Track](../../track/api/g4track.md) - Track class
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4UserStackingAction.hh`
- Source: `source/event/src/G4UserStackingAction.cc`
:::
