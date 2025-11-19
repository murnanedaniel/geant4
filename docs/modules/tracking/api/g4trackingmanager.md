# G4TrackingManager API Documentation

## Overview

`G4TrackingManager` is the central interface class that manages the tracking of individual particles in Geant4. It acts as a bridge between the event management layer and the stepping/tracking layers, orchestrating the complete lifecycle of a track from creation to termination. This class is used exclusively by the Geant4 kernel and handles message passing between hierarchical tracking objects.

::: tip Header File
**Location:** `source/tracking/include/G4TrackingManager.hh`
**Source:** `source/tracking/src/G4TrackingManager.cc`
:::

## Class Declaration

```cpp
class G4TrackingManager
{
 public:
  G4TrackingManager();
  ~G4TrackingManager();

  G4Track* GetTrack() const;
  G4int GetStoreTrajectory() const;
  void SetStoreTrajectory(G4int value);
  G4SteppingManager* GetSteppingManager() const;
  G4UserTrackingAction* GetUserTrackingAction() const;
  G4VTrajectory* GimmeTrajectory() const;
  void SetTrajectory(G4VTrajectory* aTrajectory);
  G4TrackVector* GimmeSecondaries() const;
  void SetUserAction(G4UserTrackingAction* apAction);
  void SetUserAction(G4UserSteppingAction* apAction);
  void SetVerboseLevel(G4int vLevel);
  G4int GetVerboseLevel() const;
  void ProcessOneTrack(G4Track* apValueG4Track);
  void EventAborted();
  void SetUserTrackInformation(G4VUserTrackInformation* aValue);

 private:
  void TrackBanner();
  G4Track* fpTrack = nullptr;
  G4SteppingManager* fpSteppingManager = nullptr;
  G4UserTrackingAction* fpUserTrackingAction = nullptr;
  G4VTrajectory* fpTrajectory = nullptr;
  G4int StoreTrajectory = 0;
  G4int verboseLevel = 0;
  G4TrackingMessenger* messenger = nullptr;
  G4bool EventIsAborted = false;
};
```

## Key Characteristics

- **Interface Layer**: Bridges event management and track stepping
- **Track Lifecycle Control**: Manages complete track processing from start to finish
- **User Action Integration**: Interfaces with user tracking and stepping actions
- **Trajectory Management**: Controls trajectory storage and retrieval
- **Kernel-Only**: Used exclusively by Geant4 kernel, not directly by users
- **Message Passing**: Handles communication between hierarchical objects

## Constructor and Destructor

### Constructor
`source/tracking/include/G4TrackingManager.hh:70`

```cpp
G4TrackingManager();
```

**Purpose:** Constructs the tracking manager and initializes internal components

**Behavior:**
- Creates a new `G4SteppingManager` instance
- Initializes the tracking messenger for UI commands
- Sets up default trajectory storage (disabled)
- Initializes verbose level to 0

**Note:** G4TrackingManager must be dynamically allocated using `new`. The constructor automatically creates the stepping manager and passes "this" pointer to user actions.

**Example:**
```cpp
// In G4EventManager initialization
G4TrackingManager* trackingManager = new G4TrackingManager();
```

### Destructor
`source/tracking/include/G4TrackingManager.hh:71`

```cpp
~G4TrackingManager();
```

**Purpose:** Cleans up tracking manager resources

**Behavior:**
- Deletes the stepping manager
- Deletes the tracking messenger
- Cleans up any remaining trajectory

## Core Methods

### ProcessOneTrack()
`source/tracking/include/G4TrackingManager.hh:97-99`

```cpp
void ProcessOneTrack(G4Track* apValueG4Track);
```

**Purpose:** Main tracking method that processes a complete track from start to finish

**Parameters:**
- `apValueG4Track`: Pointer to the track to be processed

**Tracking Loop Algorithm:**

The tracking loop implements the following sequence:

1. **Initialization Phase:**
   - Set the track pointer
   - Call `PreUserTrackingAction()` if defined
   - Initialize trajectory if storage is enabled
   - Call `SetInitialStep()` on stepping manager
   - Print track banner if verbose

2. **Stepping Loop:**
   - While track status is `fAlive`:
     - Call `Stepping()` on stepping manager
     - Update trajectory with current step
     - Check for event abortion
     - Process secondaries if generated

3. **Finalization Phase:**
   - Call `PostUserTrackingAction()` if defined
   - Delete the track object
   - Reset internal pointers

**Detailed Flow:**
```cpp
// Pseudocode of ProcessOneTrack logic
fpTrack = aTrack;

// Pre-tracking user action
if (fpUserTrackingAction) {
    fpUserTrackingAction->PreUserTrackingAction(fpTrack);
}

// Initialize trajectory if requested
if (StoreTrajectory && !fpTrajectory) {
    fpTrajectory = new G4Trajectory(fpTrack);
}

// Initialize stepping
fpSteppingManager->SetInitialStep(fpTrack);

// Main stepping loop
while (fpTrack->GetTrackStatus() == fAlive) {
    fpSteppingManager->Stepping();

    // Add step to trajectory
    if (StoreTrajectory) {
        fpTrajectory->AppendStep(fpSteppingManager->GetStep());
    }

    // Check for abortion
    if (EventIsAborted) {
        fpTrack->SetTrackStatus(fKillTrackAndSecondaries);
    }
}

// Post-tracking user action
if (fpUserTrackingAction) {
    fpUserTrackingAction->PostUserTrackingAction(fpTrack);
}

// Cleanup
delete fpTrack;
fpTrack = nullptr;
```

**Example Usage:**
```cpp
// In G4EventManager
void G4EventManager::DoProcessing(G4Event* anEvent) {
    // Get primary tracks
    G4TrackVector* primaryTracks = anEvent->GetPrimaryVertex()->GetPrimary();

    for (auto* track : *primaryTracks) {
        trackingManager->ProcessOneTrack(track);
    }
}
```

**Important Notes:**
- The track is deleted by this method after processing
- User should not delete the track manually
- Secondaries are handled by the event manager's track stack
- Track status determines when stepping loop terminates

### EventAborted()
`source/tracking/include/G4TrackingManager.hh:101-106`

```cpp
void EventAborted();
```

**Purpose:** Aborts the current track immediately

**Behavior:**
- Sets internal `EventIsAborted` flag to true
- On next step, track status is set to `fKillTrackAndSecondaries`
- Causes immediate termination of tracking loop
- All secondaries associated with the track are also killed

**Use Case:** Called by event manager when event must be terminated early

**Example:**
```cpp
// In event processing
if (criticalError) {
    trackingManager->EventAborted();
}
```

::: warning Important
This kills the current track AND all its secondaries. Use with caution as it discards all pending secondary particles.
:::

## Trajectory Management

### GetStoreTrajectory() / SetStoreTrajectory()
`source/tracking/include/G4TrackingManager.hh:77-78, 136`

```cpp
G4int GetStoreTrajectory() const;
void SetStoreTrajectory(G4int value);
```

**Purpose:** Controls whether trajectory information is stored

**Parameters:**
- `value`: Trajectory storage mode
  - `0` = No trajectory storage (default)
  - `1` = Store trajectory
  - `2` = Store rich trajectory with extra information

**Returns:** Current trajectory storage mode

**Usage:** Typically called from `G4UserTrackingAction::PreUserTrackingAction()`

**Example:**
```cpp
// In MyTrackingAction::PreUserTrackingAction
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    // Store trajectories only for primary particles
    if (track->GetParentID() == 0) {
        fpTrackingManager->SetStoreTrajectory(1);
    } else {
        fpTrackingManager->SetStoreTrajectory(0);
    }
}

// Store rich trajectories for electrons
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    if (track->GetDefinition()->GetParticleName() == "e-") {
        fpTrackingManager->SetStoreTrajectory(2);  // Rich trajectory
    }
}
```

**Performance Note:** Trajectory storage increases memory usage, especially for events with many tracks. Use selective filtering.

### GimmeTrajectory() / SetTrajectory()
`source/tracking/include/G4TrackingManager.hh:84-85, 148`

```cpp
G4VTrajectory* GimmeTrajectory() const;
void SetTrajectory(G4VTrajectory* aTrajectory);
```

**Purpose:** Accesses or sets the current trajectory

**Returns:** Pointer to the trajectory, or `nullptr` if not stored

**Usage:**
- `GimmeTrajectory()` is typically called in `PostUserTrackingAction()`
- `SetTrajectory()` allows custom trajectory implementations

**Example:**
```cpp
// Access trajectory after tracking
void MyTrackingAction::PostUserTrackingAction(const G4Track* track) {
    G4VTrajectory* trajectory = fpTrackingManager->GimmeTrajectory();

    if (trajectory) {
        G4int nPoints = trajectory->GetPointEntries();
        G4cout << "Trajectory has " << nPoints << " points" << G4endl;

        // Analyze trajectory
        for (G4int i = 0; i < nPoints; ++i) {
            G4VTrajectoryPoint* point = trajectory->GetPoint(i);
            // Process point...
        }
    }
}

// Use custom trajectory
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    if (needCustomTrajectory) {
        MyCustomTrajectory* customTraj = new MyCustomTrajectory(track);
        fpTrackingManager->SetTrajectory(customTraj);
    }
}
```

## User Action Management

### SetUserAction() (Tracking)
`source/tracking/include/G4TrackingManager.hh:89, 155-161`

```cpp
void SetUserAction(G4UserTrackingAction* apAction);
```

**Purpose:** Sets the user tracking action

**Parameters:**
- `apAction`: Pointer to user tracking action, or `nullptr` to disable

**Behavior:**
- Stores the tracking action pointer
- Sets the tracking manager pointer in the action
- Enables PreUserTrackingAction() and PostUserTrackingAction() callbacks

**Example:**
```cpp
// In action initialization
MyTrackingAction* trackingAction = new MyTrackingAction();
trackingManager->SetUserAction(trackingAction);
```

### SetUserAction() (Stepping)
`source/tracking/include/G4TrackingManager.hh:90, 163-169`

```cpp
void SetUserAction(G4UserSteppingAction* apAction);
```

**Purpose:** Sets the user stepping action

**Parameters:**
- `apAction`: Pointer to user stepping action, or `nullptr` to disable

**Behavior:**
- Delegates to stepping manager
- Sets the stepping manager pointer in the action
- Enables UserSteppingAction() callback at each step

**Example:**
```cpp
// Set both tracking and stepping actions
trackingManager->SetUserAction(new MyTrackingAction());
trackingManager->SetUserAction(new MySteppingAction());
```

### GetUserTrackingAction()
`source/tracking/include/G4TrackingManager.hh:82, 143-146`

```cpp
G4UserTrackingAction* GetUserTrackingAction() const;
```

**Purpose:** Retrieves the current user tracking action

**Returns:** Pointer to tracking action, or `nullptr` if not set

## Access Methods

### GetTrack()
`source/tracking/include/G4TrackingManager.hh:75, 134`

```cpp
G4Track* GetTrack() const;
```

**Purpose:** Returns the track currently being processed

**Returns:** Pointer to current track, or `nullptr` if no track is being processed

**Note:** Only valid during `ProcessOneTrack()` execution

**Example:**
```cpp
// In a user action
void MySteppingAction::UserSteppingAction(const G4Step* step) {
    G4Track* track = fpTrackingManager->GetTrack();
    // Use track information
}
```

### GetSteppingManager()
`source/tracking/include/G4TrackingManager.hh:80, 138-141`

```cpp
G4SteppingManager* GetSteppingManager() const;
```

**Purpose:** Returns the stepping manager

**Returns:** Pointer to the stepping manager

**Usage:** Provides access to detailed stepping information

**Example:**
```cpp
G4SteppingManager* stepMgr = trackingManager->GetSteppingManager();
G4Step* step = stepMgr->GetStep();
```

### GimmeSecondaries()
`source/tracking/include/G4TrackingManager.hh:87, 150-153`

```cpp
G4TrackVector* GimmeSecondaries() const;
```

**Purpose:** Returns secondary tracks generated during stepping

**Returns:** Pointer to vector of secondary tracks

**Note:** Delegates to stepping manager's secondary track vector

**Example:**
```cpp
G4TrackVector* secondaries = trackingManager->GimmeSecondaries();
G4int nSecondaries = secondaries->size();

for (auto* secondary : *secondaries) {
    G4String particleName = secondary->GetDefinition()->GetParticleName();
    G4double energy = secondary->GetKineticEnergy();
    G4cout << "Secondary: " << particleName
           << " with E=" << energy/MeV << " MeV" << G4endl;
}
```

## Verbosity Control

### SetVerboseLevel() / GetVerboseLevel()
`source/tracking/include/G4TrackingManager.hh:92-93, 171-177`

```cpp
void SetVerboseLevel(G4int vLevel);
G4int GetVerboseLevel() const;
```

**Purpose:** Controls tracking verbosity

**Parameters:**
- `vLevel`: Verbosity level
  - `0` = Silent
  - `1` = Minimal output (track start/stop)
  - `2` = Detailed output (each step)
  - `3+` = Very detailed output

**Behavior:**
- Sets verbose level for both tracking and stepping managers
- Controls `TrackBanner()` output
- Affects stepping verbose output

**Example:**
```cpp
// Set verbose output for debugging
trackingManager->SetVerboseLevel(2);

// Silence output for production runs
trackingManager->SetVerboseLevel(0);
```

## User Track Information

### SetUserTrackInformation()
`source/tracking/include/G4TrackingManager.hh:108-111, 179-182`

```cpp
void SetUserTrackInformation(G4VUserTrackInformation* aValue);
```

**Purpose:** Attaches user information to the current track

**Parameters:**
- `aValue`: Pointer to user track information object

**Usage:** Can be called from user tracking action to attach custom data

**Example:**
```cpp
// Define custom track information
class MyTrackInfo : public G4VUserTrackInformation {
public:
    G4int customID;
    G4double importanceWeight;
};

// In PreUserTrackingAction
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    MyTrackInfo* info = new MyTrackInfo();
    info->customID = GetNextID();
    info->importanceWeight = CalculateWeight(track);

    fpTrackingManager->SetUserTrackInformation(info);
}

// In PostUserTrackingAction or SteppingAction
void MyTrackingAction::PostUserTrackingAction(const G4Track* track) {
    MyTrackInfo* info =
        dynamic_cast<MyTrackInfo*>(track->GetUserInformation());
    if (info) {
        G4cout << "Track custom ID: " << info->customID << G4endl;
    }
}
```

## Tracking Loop Detailed Explanation

The tracking loop in `ProcessOneTrack()` is the heart of particle tracking in Geant4. Understanding its flow is crucial for advanced applications.

### Phase 1: Pre-Tracking Initialization

```cpp
// 1. Store track pointer
fpTrack = aTrack;

// 2. Print initial banner (if verbose)
if (verboseLevel > 0) {
    TrackBanner();
}

// 3. Call user pre-tracking action
if (fpUserTrackingAction) {
    fpUserTrackingAction->PreUserTrackingAction(fpTrack);
}
```

**What Happens:**
- Track is assigned to tracking manager
- Track information is printed if verbose mode is on
- User can examine initial track state
- User can enable/disable trajectory storage
- User can attach user information to track

**Timing:** Before any stepping occurs

### Phase 2: Trajectory Initialization

```cpp
// 4. Create trajectory if requested
if (StoreTrajectory > 0) {
    fpTrajectory = new G4Trajectory(fpTrack);
    // Or G4SmoothTrajectory, G4RichTrajectory, etc.
}
```

**What Happens:**
- Trajectory object created based on storage flag
- Initial track information stored in trajectory
- Trajectory type depends on StoreTrajectory value

**Memory Note:** Trajectories persist beyond tracking and must be managed

### Phase 3: Stepping Initialization

```cpp
// 5. Initialize first step
fpSteppingManager->SetInitialStep(fpTrack);
```

**What Happens:**
- Sets up first step's pre-step point
- Initializes step status to `fUndefined`
- Prepares for stepping loop
- No actual particle movement yet

### Phase 4: Main Stepping Loop

```cpp
// 6. Step until track is no longer alive
while (fpTrack->GetTrackStatus() == fAlive) {

    // Execute one step
    fpSteppingManager->Stepping();

    // Append step to trajectory
    if (StoreTrajectory) {
        fpTrajectory->AppendStep(fpSteppingManager->GetStep());
    }

    // Check for event abortion
    if (EventIsAborted) {
        fpTrack->SetTrackStatus(fKillTrackAndSecondaries);
    }
}
```

**Stepping() Details:**
Each `Stepping()` call performs:

1. **GetPhysicalInteractionLength (GPIL)**
   - At-rest processes propose time to interaction
   - Along-step processes propose step limitations
   - Post-step processes propose step limitations
   - Minimum step is selected

2. **AlongStepDoIt**
   - Transport moves particle
   - Continuous processes modify particle state
   - Energy loss, multiple scattering, etc.

3. **PostStepDoIt**
   - Discrete processes invoked
   - Secondaries may be generated
   - Track status may change

4. **User Actions**
   - `UserSteppingAction()` called if defined
   - User can examine/modify track

**Loop Termination:**
Track status changes to anything other than `fAlive`:
- `fStopAndKill` - Track killed
- `fStopButAlive` - Suspended
- `fKillTrackAndSecondaries` - Kill all
- `fPostponeToNextEvent` - Defer tracking

### Phase 5: Post-Tracking Finalization

```cpp
// 7. Call user post-tracking action
if (fpUserTrackingAction) {
    fpUserTrackingAction->PostUserTrackingAction(fpTrack);
}

// 8. Cleanup
delete fpTrack;
fpTrack = nullptr;
```

**What Happens:**
- User examines final track state
- User can access complete trajectory
- Track object is deleted
- Trajectory remains for event processing

**Important:** Track is deleted but trajectory persists

### Secondary Particle Handling

Secondaries are not processed immediately:

```cpp
// Secondaries generated during stepping
G4TrackVector* secondaries = fpSteppingManager->GetfSecondary();

// These are pushed to event manager's stack
// Event manager pops and processes them later
for (auto* secondary : *secondaries) {
    eventManager->StackTracks(secondary);
}
```

**Processing Order:**
1. Primary track processed completely
2. Secondaries pushed to stack
3. Event manager pops next track
4. That track processed by tracking manager
5. Repeat until stack is empty

## Complete Usage Example

```cpp
// Custom tracking action with full features
class MyTrackingAction : public G4UserTrackingAction
{
public:
    MyTrackingAction() : G4UserTrackingAction() {}

    void PreUserTrackingAction(const G4Track* track) override {
        // Selective trajectory storage
        G4String particleName = track->GetDefinition()->GetParticleName();
        G4double energy = track->GetKineticEnergy();

        if (particleName == "e-" && energy > 1.0*MeV) {
            fpTrackingManager->SetStoreTrajectory(2);  // Rich trajectory
        } else if (track->GetParentID() == 0) {
            fpTrackingManager->SetStoreTrajectory(1);  // Primary always stored
        } else {
            fpTrackingManager->SetStoreTrajectory(0);  // Others not stored
        }

        // Attach custom information
        MyTrackInfo* info = new MyTrackInfo();
        info->creationTime = std::chrono::system_clock::now();
        info->importance = CalculateImportance(track);
        fpTrackingManager->SetUserTrackInformation(info);

        // Print initial state
        G4cout << "Starting track " << track->GetTrackID()
               << ": " << particleName
               << " with E=" << energy/MeV << " MeV" << G4endl;
    }

    void PostUserTrackingAction(const G4Track* track) override {
        // Analyze final state
        G4double trackLength = track->GetTrackLength();
        G4int nSteps = track->GetCurrentStepNumber();

        G4cout << "Track " << track->GetTrackID() << " finished:"
               << " Length=" << trackLength/cm << " cm"
               << " Steps=" << nSteps << G4endl;

        // Access trajectory if stored
        G4VTrajectory* trajectory = fpTrackingManager->GimmeTrajectory();
        if (trajectory) {
            AnalyzeTrajectory(trajectory);
        }

        // Access secondaries
        G4TrackVector* secondaries = fpTrackingManager->GimmeSecondaries();
        if (secondaries->size() > 0) {
            G4cout << "  Generated " << secondaries->size()
                   << " secondaries" << G4endl;
        }
    }

private:
    void AnalyzeTrajectory(G4VTrajectory* traj) {
        G4int nPoints = traj->GetPointEntries();
        G4ThreeVector startPos = traj->GetPoint(0)->GetPosition();
        G4ThreeVector endPos = traj->GetPoint(nPoints-1)->GetPosition();
        G4double displacement = (endPos - startPos).mag();

        G4cout << "  Trajectory: " << nPoints << " points, "
               << "displacement=" << displacement/cm << " cm" << G4endl;
    }
};
```

## Thread Safety

### Sequential Mode
- Single `G4TrackingManager` instance
- Linear track processing
- No threading concerns

### Multi-threaded Mode
- **Separate instance per worker thread**
- Each thread has its own tracking manager
- No shared state between threads
- Trajectories are thread-local

::: warning Thread Safety
G4TrackingManager is **not thread-safe**. In MT mode:
- Each worker thread has its own instance
- Do not share tracking manager between threads
- User actions are also per-thread
- Trajectories belong to their thread's event
:::

### Best Practices

1. **No Global State**: Avoid static variables in user actions
2. **Thread-Local Data**: Use `G4ThreadLocal` for counters/maps
3. **Event-Local Trajectories**: Trajectories belong to events, not runs
4. **Independent Threads**: No communication between worker threads

## Performance Considerations

### Trajectory Storage

**Memory Impact:**
```cpp
// Without trajectories: ~few KB per event
// With all trajectories: ~MB per event (depends on track count)

// Good: Selective storage
if (track->GetParentID() == 0) {
    fpTrackingManager->SetStoreTrajectory(1);  // Primaries only
}

// Bad: Store everything
fpTrackingManager->SetStoreTrajectory(1);  // Memory intensive!
```

**Recommendations:**
- Store only necessary trajectories
- Use energy/particle type filters
- Consider trajectory compression for long-lived particles
- Clear trajectories after visualization

### Stepping Overhead

User actions are called frequently:
- `PreUserTrackingAction()`: Once per track
- `PostUserTrackingAction()`: Once per track
- `UserSteppingAction()`: Every step (high frequency!)

**Optimization:**
```cpp
// Good: Lightweight operations
void PreUserTrackingAction(const G4Track* track) {
    fTrackCount++;  // Fast
    fpTrackingManager->SetStoreTrajectory(track->GetParentID() == 0);
}

// Bad: Heavy operations
void PreUserTrackingAction(const G4Track* track) {
    PerformComplexAnalysis(track);  // Slow!
    WriteToFile(track);  // I/O in hot path!
}
```

## Common Patterns

### Pattern 1: Conditional Trajectory Storage

```cpp
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    G4bool storeTrajectory = false;

    // Store primaries
    if (track->GetParentID() == 0) {
        storeTrajectory = true;
    }
    // Store high-energy secondaries
    else if (track->GetKineticEnergy() > 10*MeV) {
        storeTrajectory = true;
    }
    // Store specific particles
    else if (track->GetDefinition()->GetParticleName() == "mu-") {
        storeTrajectory = true;
    }

    fpTrackingManager->SetStoreTrajectory(storeTrajectory ? 1 : 0);
}
```

### Pattern 2: Track Counting by Type

```cpp
class MyTrackingAction : public G4UserTrackingAction {
private:
    std::map<G4String, G4int> fTrackCounts;

public:
    void PreUserTrackingAction(const G4Track* track) override {
        G4String particle = track->GetDefinition()->GetParticleName();
        fTrackCounts[particle]++;
    }

    void PrintStatistics() {
        G4cout << "\n=== Track Statistics ===" << G4endl;
        for (const auto& [name, count] : fTrackCounts) {
            G4cout << name << ": " << count << " tracks" << G4endl;
        }
    }
};
```

### Pattern 3: Secondary Analysis

```cpp
void MyTrackingAction::PostUserTrackingAction(const G4Track* track) {
    G4TrackVector* secondaries = fpTrackingManager->GimmeSecondaries();

    if (secondaries->size() > 0) {
        G4cout << "Track " << track->GetTrackID()
               << " produced " << secondaries->size()
               << " secondaries:" << G4endl;

        for (auto* sec : *secondaries) {
            G4String name = sec->GetDefinition()->GetParticleName();
            G4double energy = sec->GetKineticEnergy();

            G4cout << "  - " << name
                   << " E=" << energy/MeV << " MeV" << G4endl;
        }
    }
}
```

## Related Classes

### Core Tracking
- [G4SteppingManager](g4steppingmanager.md) - Handles individual steps
- [G4UserTrackingAction](g4usertrackingaction.md) - User tracking hooks
- [G4UserSteppingAction](g4usersteppingaction.md) - User stepping hooks
- [G4Track](../../track/api/g4track.md) - Track data container
- [G4Step](../../track/api/g4step.md) - Step information

### Trajectory
- [G4VTrajectory](g4vtrajectory.md) - Trajectory base class
- [G4Trajectory](g4trajectory.md) - Standard trajectory
- [G4TrajectoryContainer](g4trajectorycontainer.md) - Trajectory storage

### Event Management
- [G4EventManager](../../event/api/g4eventmanager.md) - Event processing
- [G4Event](../../event/api/g4event.md) - Event data
- [G4StackManager](../../event/api/g4stackmanager.md) - Track stack

## See Also

- [Tracking Module Overview](../overview.md) - Module documentation
- [Track Module](../../../track/overview.md) - Track classes
- [Event Module](../../../event/overview.md) - Event processing

---

::: info Source Reference
Complete implementation in:
- Header: `source/tracking/include/G4TrackingManager.hh`
- Source: `source/tracking/src/G4TrackingManager.cc`
- Messenger: `source/tracking/src/G4TrackingMessenger.cc`
:::
