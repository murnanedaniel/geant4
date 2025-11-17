# G4StackManager API Documentation

## Overview

`G4StackManager` is the central class responsible for managing all track stacks during event processing in Geant4. It maintains three main stack types (urgent, waiting, and postpone) and orchestrates track flow between them based on user-defined classification rules.

This singleton-like class is constructed and managed by `G4EventManager` and should not be directly instantiated by users. It provides the infrastructure for sophisticated event processing strategies including staged processing, track postponement, and sub-event parallelism.

::: tip Header File
**Location:** `source/event/include/G4StackManager.hh`
**Source:** `source/event/src/G4StackManager.cc`
:::

## Class Declaration

`source/event/include/G4StackManager.hh:69-184`

```cpp
class G4StackManager
{
  public:
    G4StackManager();
   ~G4StackManager();

    const G4StackManager& operator=(const G4StackManager&) = delete;
    G4bool operator==(const G4StackManager&) const = delete;
    G4bool operator!=(const G4StackManager&) const = delete;

    // Core track management
    G4int PushOneTrack(G4Track* newTrack, G4VTrajectory* newTrajectory = nullptr);
    G4Track* PopNextTrack(G4VTrajectory** newTrajectory);
    G4int PrepareNewEvent(G4Event* currentEvent);

    // Stack manipulation
    void ReClassify();
    void SetNumberOfAdditionalWaitingStacks(G4int iAdd);
    void TransferStackedTracks(G4ClassificationOfNewTrack origin,
                               G4ClassificationOfNewTrack destination);
    void TransferOneStackedTrack(G4ClassificationOfNewTrack origin,
                                 G4ClassificationOfNewTrack destination);

    // Sub-event parallelism
    void RegisterSubEventType(G4int ty, G4int maxEnt);
    void ReleaseSubEvent(G4int ty);

    // Default classification
    void SetDefaultClassification(G4TrackStatus, G4ClassificationOfNewTrack,
                                  G4ExceptionSeverity = IgnoreTheIssue);
    void SetDefaultClassification(const G4ParticleDefinition*,
                                  G4ClassificationOfNewTrack,
                                  G4ExceptionSeverity = IgnoreTheIssue);
    inline G4ClassificationOfNewTrack GetDefaultClassification();

    // Stack queries
    void clear();
    void ClearUrgentStack();
    void ClearWaitingStack(G4int i = 0);
    void ClearPostponeStack();
    G4int GetNTotalTrack() const;
    G4int GetNUrgentTrack() const;
    G4int GetNWaitingTrack(G4int i = 0) const;
    G4int GetNPostponedTrack() const;

    // Configuration
    void SetVerboseLevel(G4int const value);
    void SetUserStackingAction(G4UserStackingAction* value);
};
```

## Stack Architecture

### Three Main Stacks

`source/event/include/G4StackManager.hh:30-38`

The stack manager maintains three primary stacks:

1. **Urgent Stack** (`fUrgent`)
   - Tracks processed immediately
   - LIFO (Last-In-First-Out) order
   - Default destination for new tracks
   - Can be `G4TrackStack` or `G4SmartTrackStack` (compile-time option)

2. **Waiting Stack** (`fWaiting`)
   - Tracks postponed until urgent stack empties
   - Transferred to urgent when urgent becomes empty
   - Triggers `NewStage()` callback on transfer
   - Up to 10 additional waiting stacks can be configured

3. **Postpone Stack** (`fPostpone`)
   - Tracks saved for next event
   - Re-injected at start of next event
   - Parent ID becomes negative to indicate postponed origin

```
┌─────────────────┐
│  Urgent Stack   │ ←── Process immediately (fUrgent)
│    (LIFO)       │
└────────┬────────┘
         │ Empty
         ↓
┌─────────────────┐
│ Waiting Stack   │ ←── Process later (fWaiting)
│                 │     Transfer to urgent when urgent empty
└─────────────────┘     Triggers NewStage()

┌─────────────────┐
│ Postpone Stack  │ ←── Save for next event (fPostpone)
│                 │     Re-inject at event start
└─────────────────┘

     fKill ──→  [Delete immediately]
```

## Constructor and Destructor

### Constructor
`source/event/include/G4StackManager.hh:73`

```cpp
G4StackManager();
```

**Behavior:**
- Creates urgent stack (`G4SmartTrackStack` or `G4TrackStack`)
- Creates waiting stack (`G4TrackStack`)
- Creates postpone stack (`G4TrackStack`)
- Initializes messengers for UI commands
- Sets default classification to `fUrgent`

**Note:** Typically called only by `G4EventManager`. Not for user instantiation.

### Destructor
`source/event/include/G4StackManager.hh:74`

```cpp
~G4StackManager();
```

**Behavior:**
- Deletes all stack objects
- Deletes messenger
- Deletes additional waiting stacks if configured

## Core Track Management

### PushOneTrack()
`source/event/include/G4StackManager.hh:80-81`

```cpp
G4int PushOneTrack(G4Track* newTrack, G4VTrajectory* newTrajectory = nullptr);
```

**Parameters:**
- `newTrack`: Pointer to the newly created track
- `newTrajectory`: Optional pointer to trajectory (default = nullptr)

**Returns:**
- 1 if track pushed successfully
- 0 if track killed (classification = fKill)
- Sub-event type ID if pushed to sub-event stack

**Behavior:**
1. Wraps track and trajectory in `G4StackedTrack`
2. Calls `G4UserStackingAction::ClassifyNewTrack()`
3. Routes to appropriate stack based on classification
4. Updates track counts

**Example Usage:**
```cpp
// In G4TrackingManager (not typically called by users)
void G4TrackingManager::ProcessOneTrack(G4Track* track)
{
    // ... tracking ...

    // Push secondaries to stack
    G4TrackVector* secondaries = track->GetStep()->GetSecondary();
    for (auto secondary : *secondaries) {
        G4VTrajectory* trajectory = nullptr;
        if (storeTrajectory) {
            trajectory = new G4Trajectory(secondary);
        }

        stackManager->PushOneTrack(secondary, trajectory);
    }
}
```

**Classification Flow:**
```cpp
// Conceptual implementation
G4int G4StackManager::PushOneTrack(G4Track* track, G4VTrajectory* traj)
{
    // Apply default classification if set
    DefineDefaultClassification(track);

    // Get user classification
    G4ClassificationOfNewTrack classification = fUrgent;
    if (userStackingAction) {
        classification = userStackingAction->ClassifyNewTrack(track);
    }

    // Create stacked track
    G4StackedTrack stackedTrack(track, traj);

    // Route to appropriate stack
    switch (classification) {
        case fUrgent:
            urgentStack->PushToStack(stackedTrack);
            return 1;

        case fWaiting:
            waitingStack->PushToStack(stackedTrack);
            return 1;

        case fPostpone:
            postponeStack->PushToStack(stackedTrack);
            return 1;

        case fKill:
            delete track;
            delete traj;
            return 0;

        // Additional waiting stacks...
        // Sub-event classifications...
    }
}
```

### PopNextTrack()
`source/event/include/G4StackManager.hh:82`

```cpp
G4Track* PopNextTrack(G4VTrajectory** newTrajectory);
```

**Parameters:**
- `newTrajectory`: Output parameter receiving trajectory pointer

**Returns:**
- Pointer to next track to process
- `nullptr` if all stacks empty (event complete)

**Behavior:**
1. Check urgent stack first
2. If urgent empty, transfer waiting → urgent and call `NewStage()`
3. Pop from urgent stack
4. Extract track and trajectory from `G4StackedTrack`
5. Return track, set trajectory output parameter

**Example Usage:**
```cpp
// In G4EventManager::DoProcessing()
while (G4Track* track = stackManager->PopNextTrack(&trajectory)) {
    // Process the track
    trackingManager->ProcessOneTrack(track);

    // Handle trajectory
    if (trajectory) {
        event->GetTrajectoryContainer()->insert(trajectory);
    }
}
```

**Stage Transition:**
```cpp
// When urgent stack becomes empty
if (urgentStack->GetNTrack() == 0) {
    if (waitingStack->GetNTrack() > 0) {
        // Transfer waiting to urgent
        waitingStack->TransferTo(urgentStack);

        // Notify user
        if (userStackingAction) {
            userStackingAction->NewStage();
        }
    }
}

// Pop from urgent
if (urgentStack->GetNTrack() > 0) {
    G4StackedTrack stackedTrack = urgentStack->PopFromStack();
    *newTrajectory = stackedTrack.GetTrajectory();
    return stackedTrack.GetTrack();
}

return nullptr;  // All stacks empty
```

### PrepareNewEvent()
`source/event/include/G4StackManager.hh:83`

```cpp
G4int PrepareNewEvent(G4Event* currentEvent);
```

**Parameters:**
- `currentEvent`: Pointer to the event being prepared

**Returns:** Number of postponed tracks from previous event

**Behavior:**
1. Call `G4UserStackingAction::PrepareNewEvent()`
2. Transfer postponed tracks to urgent stack
3. Set parent ID negative for postponed tracks
4. Clear urgent and waiting stacks (should already be empty)
5. Return count of re-injected tracks

**Example Usage:**
```cpp
// In G4EventManager
void G4EventManager::DoProcessing(G4Event* event)
{
    // Prepare stacks for new event
    G4int nPostponed = stackManager->PrepareNewEvent(event);

    if (nPostponed > 0) {
        G4cout << "Re-injecting " << nPostponed
               << " postponed tracks" << G4endl;
    }

    // Process event...
}
```

## Stack Manipulation Methods

### ReClassify()
`source/event/include/G4StackManager.hh:85-92`

```cpp
void ReClassify();
```

**Purpose:** Re-evaluate all tracks in urgent stack using `ClassifyNewTrack()`

**Behavior:**
1. Pop all tracks from urgent stack
2. Call `ClassifyNewTrack()` for each
3. Push to new destination based on new classification
4. Can result in tracks moving to waiting/postpone/killed

**Usage:** Typically called from `G4UserStackingAction::NewStage()`

**Example:**
```cpp
void MyStackingAction::NewStage()
{
    fStage++;

    if (fStage == 2) {
        // Change classification criteria for stage 2
        fEnergyThreshold = 1*MeV;  // Lower threshold

        // Re-classify all tracks now in urgent stack
        stackManager->ReClassify();

        G4cout << "Re-classified tracks for stage 2" << G4endl;
    }
}

G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Classification depends on current stage
    if (track->GetKineticEnergy() < fEnergyThreshold) {
        return fKill;
    }

    return fUrgent;
}
```

::: warning Performance Impact
Re-classification processes all urgent tracks. Use judiciously in stages with many tracks.
:::

### SetNumberOfAdditionalWaitingStacks()
`source/event/include/G4StackManager.hh:94-100`

```cpp
void SetNumberOfAdditionalWaitingStacks(G4int iAdd);
```

**Parameters:**
- `iAdd`: Number of additional waiting stacks (0-10)

**Purpose:** Enable use of `fWaiting_1` through `fWaiting_10` classifications

**Constraints:**
- Must be called at PreInit, Init, or Idle state
- Maximum 10 additional stacks
- Cannot be changed after initialization

**Example:**
```cpp
int main()
{
    G4RunManager* runManager = new G4RunManager();

    // ... set mandatory initialization ...

    // Enable 5 additional waiting stacks
    runManager->SetNumberOfAdditionalWaitingStacks(5);
    // Now can use fWaiting_1 through fWaiting_5

    runManager->Initialize();

    // ... run simulation ...
}
```

**In Stacking Action:**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    G4double energy = track->GetKineticEnergy();

    if (energy > 1*GeV)
        return fUrgent;
    else if (energy > 100*MeV)
        return fWaiting_1;    // High energy waiting
    else if (energy > 10*MeV)
        return fWaiting_2;    // Medium energy waiting
    else if (energy > 1*MeV)
        return fWaiting_3;    // Low energy waiting
    else
        return fWaiting_4;    // Very low energy waiting
}
```

### TransferStackedTracks()
`source/event/include/G4StackManager.hh:102-106`

```cpp
void TransferStackedTracks(G4ClassificationOfNewTrack origin,
                           G4ClassificationOfNewTrack destination);
```

**Parameters:**
- `origin`: Source stack classification
- `destination`: Destination stack classification

**Behavior:**
- Transfers ALL tracks from origin to destination
- Origin stack becomes empty
- If destination = `fKill`, all tracks deleted
- If origin = `fKill`, nothing happens

**Example:**
```cpp
void MyStackingAction::NewStage()
{
    // Manually control stack transfers

    // Move all waiting tracks to urgent
    stackManager->TransferStackedTracks(fWaiting, fUrgent);

    // Kill all postponed tracks
    stackManager->TransferStackedTracks(fPostpone, fKill);

    // Transfer between waiting stacks
    stackManager->TransferStackedTracks(fWaiting_2, fWaiting_1);
}
```

### TransferOneStackedTrack()
`source/event/include/G4StackManager.hh:109-116`

```cpp
void TransferOneStackedTrack(G4ClassificationOfNewTrack origin,
                             G4ClassificationOfNewTrack destination);
```

**Parameters:**
- `origin`: Source stack
- `destination`: Destination stack

**Behavior:**
- Transfers ONE track (most recently added) from origin to destination
- If destination = `fKill`, track is deleted
- If origin = `fKill` or empty, nothing happens

**Example:**
```cpp
// Transfer one track at a time for fine control
void MyStackingAction::NewStage()
{
    // Move one waiting track to urgent for sampling
    stackManager->TransferOneStackedTrack(fWaiting, fUrgent);

    // Process it...
    // Then decide whether to transfer more
}
```

## Sub-Event Parallelism (Advanced)

### RegisterSubEventType()
`source/event/include/G4StackManager.hh:118-120`

```cpp
void RegisterSubEventType(G4int ty, G4int maxEnt);
```

**Parameters:**
- `ty`: Sub-event type ID (100-115: fSubEvent_0 to fSubEvent_F)
- `maxEnt`: Maximum tracks per sub-event of this type

**Purpose:** Enable sub-event parallel processing

**Example:**
```cpp
// In initialization
void MyActionInitialization::Build() const
{
    // Get stack manager via run manager
    G4RunManager* runManager = G4RunManager::GetRunManager();

    // Register sub-event types
    runManager->RegisterSubEventType(fSubEvent_1, 1000);  // EM showers
    runManager->RegisterSubEventType(fSubEvent_2, 500);   // Hadronic

    // Set stacking action
    SetUserAction(new MyStackingAction());
}
```

**In Stacking Action:**
```cpp
G4ClassificationOfNewTrack
MyStackingAction::ClassifyNewTrack(const G4Track* track)
{
    // Route to sub-event for parallel processing
    if (IsEMParticle(track)) {
        return fSubEvent_1;  // EM shower sub-event
    }

    if (IsHadronicParticle(track)) {
        return fSubEvent_2;  // Hadronic sub-event
    }

    return fUrgent;  // Sequential processing
}
```

::: warning Advanced Feature
Sub-event parallelism is complex and requires deep understanding of thread safety and Geant4 architecture. Use only if necessary.
:::

### ReleaseSubEvent()
`source/event/include/G4StackManager.hh:137`

```cpp
void ReleaseSubEvent(G4int ty);
```

**Parameters:**
- `ty`: Sub-event type to release

**Purpose:** Release completed sub-event for parallel processing

## Default Classification

### SetDefaultClassification (by Track Status)
`source/event/include/G4StackManager.hh:122-124`

```cpp
void SetDefaultClassification(G4TrackStatus status,
                              G4ClassificationOfNewTrack classification,
                              G4ExceptionSeverity es = IgnoreTheIssue);
```

**Parameters:**
- `status`: Track status to apply default classification
- `classification`: Default classification for this status
- `es`: Exception severity if user overrides default

**Example:**
```cpp
// In initialization
void Initialize()
{
    G4StackManager* stackManager = GetStackManager();

    // Kill all suspended tracks by default
    stackManager->SetDefaultClassification(
        fSuspend, fKill, JustWarning);

    // Postpone stopped tracks
    stackManager->SetDefaultClassification(
        fStopButAlive, fPostpone);
}
```

### SetDefaultClassification (by Particle Type)
`source/event/include/G4StackManager.hh:125-127`

```cpp
void SetDefaultClassification(const G4ParticleDefinition* particle,
                              G4ClassificationOfNewTrack classification,
                              G4ExceptionSeverity es = IgnoreTheIssue);
```

**Parameters:**
- `particle`: Particle type for default classification
- `classification`: Default classification for this particle
- `es`: Exception severity if user overrides

**Example:**
```cpp
// In initialization
void Initialize()
{
    G4StackManager* stackManager = GetStackManager();

    // Kill optical photons by default
    stackManager->SetDefaultClassification(
        G4OpticalPhoton::Definition(), fKill);

    // Postpone thermal neutrons by default
    stackManager->SetDefaultClassification(
        G4Neutron::Definition(), fPostpone);
}
```

::: info Exception Severity
If `G4ExceptionSeverity` set to `JustWarning` or higher, a warning is issued when user's `ClassifyNewTrack()` overrides the default.
:::

### GetDefaultClassification()
`source/event/include/G4StackManager.hh:133-134`

```cpp
inline G4ClassificationOfNewTrack GetDefaultClassification()
{
    return fDefaultClassification;
}
```

**Returns:** Current default classification (default = `fUrgent`)

## Stack Clearing Methods

### clear()
`source/event/include/G4StackManager.hh:143`

```cpp
void clear();
```

**Purpose:** Clear all stacks and delete all tracks (event abortion)

**Behavior:**
- Calls `clearAndDestroy()` on urgent, waiting, and postpone stacks
- Deletes all `G4Track` and `G4VTrajectory` objects
- Resets all counters

**Usage:**
```cpp
void MyStackingAction::NewStage()
{
    // Abort event if too many tracks
    if (stackManager->GetNUrgentTrack() > 1000000) {
        G4cout << "ERROR: Event too complex, aborting" << G4endl;
        stackManager->clear();
        return;
    }
}
```

::: warning Event Abortion
Calling `clear()` aborts current event. All track data is lost.
:::

### ClearUrgentStack()
`source/event/include/G4StackManager.hh:144`

```cpp
void ClearUrgentStack();
```

**Purpose:** Clear only the urgent stack

**Warning:** Do NOT call from user code. Reserved for framework use.

### ClearWaitingStack()
`source/event/include/G4StackManager.hh:145`

```cpp
void ClearWaitingStack(G4int i = 0);
```

**Parameters:**
- `i`: Waiting stack index (0 = main, 1-10 = additional)

**Purpose:** Clear specific waiting stack

**Warning:** Do NOT call from user code. Reserved for framework use.

### ClearPostponeStack()
`source/event/include/G4StackManager.hh:146`

```cpp
void ClearPostponeStack();
```

**Purpose:** Clear the postpone stack and delete all postponed tracks

**Warning:** Do NOT call from user code. Reserved for framework use.

## Stack Query Methods

### GetNTotalTrack()
`source/event/include/G4StackManager.hh:147`

```cpp
G4int GetNTotalTrack() const;
```

**Returns:** Total number of tracks in all stacks

**Example:**
```cpp
G4int total = stackManager->GetNTotalTrack();
G4cout << "Total tracks in all stacks: " << total << G4endl;
```

### GetNUrgentTrack()
`source/event/include/G4StackManager.hh:148`

```cpp
G4int GetNUrgentTrack() const;
```

**Returns:** Number of tracks in urgent stack

**Example:**
```cpp
void MyStackingAction::NewStage()
{
    G4int nUrgent = stackManager->GetNUrgentTrack();
    G4cout << "Urgent stack has " << nUrgent << " tracks" << G4endl;
}
```

### GetNWaitingTrack()
`source/event/include/G4StackManager.hh:149`

```cpp
G4int GetNWaitingTrack(G4int i = 0) const;
```

**Parameters:**
- `i`: Waiting stack index (0 = main, 1-10 = additional)

**Returns:** Number of tracks in specified waiting stack

**Example:**
```cpp
G4int mainWaiting = stackManager->GetNWaitingTrack(0);
G4int waiting1 = stackManager->GetNWaitingTrack(1);

G4cout << "Main waiting: " << mainWaiting << G4endl;
G4cout << "Waiting_1: " << waiting1 << G4endl;
```

### GetNPostponedTrack()
`source/event/include/G4StackManager.hh:150`

```cpp
G4int GetNPostponedTrack() const;
```

**Returns:** Number of tracks in postpone stack

**Example:**
```cpp
void MyEventAction::EndOfEventAction(const G4Event* event)
{
    G4int nPostponed = stackManager->GetNPostponedTrack();

    if (nPostponed > 0) {
        G4cout << "Postponing " << nPostponed
               << " tracks to next event" << G4endl;
    }
}
```

## Configuration Methods

### SetVerboseLevel()
`source/event/include/G4StackManager.hh:151`

```cpp
void SetVerboseLevel(G4int const value);
```

**Parameters:**
- `value`: Verbosity level (0 = quiet, higher = more verbose)

**Example:**
```cpp
stackManager->SetVerboseLevel(2);
// Will print detailed stack operations
```

### SetUserStackingAction()
`source/event/include/G4StackManager.hh:152`

```cpp
void SetUserStackingAction(G4UserStackingAction* value);
```

**Parameters:**
- `value`: Pointer to user stacking action

**Note:** Typically called by framework, not users

## Complete Examples

### Example 1: Event Monitoring and Statistics

```cpp
class MonitoringStackingAction : public G4UserStackingAction
{
public:
    void PrepareNewEvent() override
    {
        fTracksCreated = 0;
        fTracksKilled = 0;
        fStageNumber = 0;

        G4int nPostponed = stackManager->GetNPostponedTrack();
        if (nPostponed > 0) {
            G4cout << "Event starting with " << nPostponed
                   << " postponed tracks" << G4endl;
        }
    }

    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        fTracksCreated++;

        if (track->GetKineticEnergy() < 1*keV) {
            fTracksKilled++;
            return fKill;
        }

        return fUrgent;
    }

    void NewStage() override
    {
        fStageNumber++;

        G4cout << "=== Stage " << fStageNumber << " ===" << G4endl;
        G4cout << "  Urgent: " << stackManager->GetNUrgentTrack() << G4endl;
        G4cout << "  Waiting: " << stackManager->GetNWaitingTrack() << G4endl;
        G4cout << "  Postponed: " << stackManager->GetNPostponedTrack()
               << G4endl;
    }

    void PrintStatistics()
    {
        G4cout << "\nEvent Statistics:" << G4endl;
        G4cout << "  Tracks created: " << fTracksCreated << G4endl;
        G4cout << "  Tracks killed: " << fTracksKilled << G4endl;
        G4cout << "  Stages: " << fStageNumber << G4endl;
    }

private:
    G4int fTracksCreated = 0;
    G4int fTracksKilled = 0;
    G4int fStageNumber = 0;
};
```

### Example 2: Adaptive Stack Management

```cpp
class AdaptiveStackingAction : public G4UserStackingAction
{
public:
    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        // Check stack overflow risk
        G4int totalTracks = stackManager->GetNTotalTrack();

        if (totalTracks > fMaxTracks) {
            // Emergency: kill low-energy particles
            if (track->GetKineticEnergy() < 10*fEnergyThreshold) {
                G4cout << "WARNING: Stack overflow protection - killing track"
                       << G4endl;
                return fKill;
            }
        }

        // Normal classification
        if (track->GetKineticEnergy() < fEnergyThreshold) {
            return fKill;
        }

        return fUrgent;
    }

    void NewStage() override
    {
        G4int nUrgent = stackManager->GetNUrgentTrack();

        // Adaptive re-classification if too many tracks
        if (nUrgent > fReClassifyThreshold) {
            G4cout << "Large stack detected (" << nUrgent
                   << " tracks), re-classifying..." << G4endl;

            // Temporarily raise energy threshold
            fEnergyThreshold *= 2.0;

            // Re-classify all urgent tracks with new threshold
            stackManager->ReClassify();

            // Restore threshold
            fEnergyThreshold /= 2.0;

            G4cout << "After re-classification: "
                   << stackManager->GetNUrgentTrack() << " tracks"
                   << G4endl;
        }
    }

private:
    G4double fEnergyThreshold = 1*keV;
    G4int fMaxTracks = 100000;
    G4int fReClassifyThreshold = 50000;
};
```

### Example 3: Multi-Stack Calorimeter

```cpp
class CalorimeterStackManager : public G4UserStackingAction
{
public:
    CalorimeterStackManager()
    {
        // Enable 3 additional waiting stacks
        // (Must be done via G4RunManager::SetNumberOfAdditionalWaitingStacks)
    }

    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        G4double energy = track->GetKineticEnergy();
        G4ParticleDefinition* particle = track->GetDefinition();

        // Primary
        if (track->GetParentID() == 0) {
            return fUrgent;  // Stage 0
        }

        // High energy
        if (energy > 1*GeV) {
            return fUrgent;  // Stage 0
        }

        // Hadronic
        if (particle->GetParticleType() == "nucleus" ||
            particle->GetParticleType() == "baryon" ||
            particle->GetParticleType() == "meson") {
            return fWaiting;  // Stage 1
        }

        // EM shower - high energy
        if ((particle == G4Gamma::Definition() ||
             particle == G4Electron::Definition() ||
             particle == G4Positron::Definition()) &&
            energy > 1*MeV) {
            return fWaiting_1;  // Stage 2
        }

        // EM shower - low energy
        if (particle == G4Gamma::Definition() ||
            particle == G4Electron::Definition() ||
            particle == G4Positron::Definition()) {
            return fWaiting_2;  // Stage 3
        }

        // Everything else
        return fWaiting_3;  // Stage 4
    }

    void NewStage() override
    {
        fCurrentStage++;

        const char* stageNames[] = {
            "Primary + High Energy",
            "Hadronic Cascade",
            "EM Shower (High E)",
            "EM Shower (Low E)",
            "Remainder"
        };

        if (fCurrentStage < 5) {
            G4cout << "\n=== Stage " << fCurrentStage << ": "
                   << stageNames[fCurrentStage] << " ===" << G4endl;

            // Report stack sizes
            G4cout << "  Processing " << stackManager->GetNUrgentTrack()
                   << " tracks" << G4endl;
        }
    }

    void PrepareNewEvent() override
    {
        fCurrentStage = 0;
    }

private:
    G4int fCurrentStage = 0;
};
```

## Thread Safety

### Worker Threads
- Each worker thread has its own `G4StackManager` instance
- Completely independent stack management
- No synchronization needed between workers

### Master Thread
- Master thread does NOT have stack manager (events not processed)
- Stack manager created only for worker threads

## Performance Considerations

1. **Stack Type**: `G4SmartTrackStack` can improve performance for EM-heavy events
   - Enable with `G4_USESMARTSTACK` compilation flag
   - Better cache locality for particle types

2. **Classification Overhead**: Keep `ClassifyNewTrack()` fast
   - Avoid expensive calculations
   - Cache particle definitions

3. **Re-classification**: Use sparingly
   - Processes all urgent tracks
   - Can be expensive for large stacks

4. **Multiple Waiting Stacks**: Adds complexity but enables fine control
   - Each stage processes similar particles together
   - Better memory access patterns

## See Also

- [G4UserStackingAction](g4userstackingaction.md) - User stacking action base class
- [G4ClassificationOfNewTrack](g4classificationofnewtrack.md) - Track classification enum
- [G4TrackStack](g4trackstack.md) - LIFO track stack
- [G4SmartTrackStack](g4smarttrackstack.md) - Optimized track stack
- [G4StackedTrack](g4stackedtrack.md) - Track wrapper class
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4StackManager.hh`
- Source: `source/event/src/G4StackManager.cc`
:::
