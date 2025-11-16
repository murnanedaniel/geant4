# G4Run

**File**: `source/run/include/G4Run.hh`

## Overview

G4Run is a data container class that represents a single run in a Geant4 simulation. A run consists of a sequence of events processed together under identical conditions. G4Run stores run-level information including event counts, hits and digits collections, and random number generator status. This class is typically instantiated by G4RunManager (or its variants) and accessed by user code through run actions. Users can derive custom run classes to store additional run-specific data and statistics.

## Class Description

G4Run serves as the primary data structure for run management in Geant4:

- **Run Container**: Holds information about all events processed in a single run
- **Data Accumulation**: Stores aggregated results like hits and digit collections across all events
- **Event History**: Optionally maintains pointers to individual events for pileup or special analysis
- **User Extension**: Designed for users to derive custom run classes with additional statistics
- **Factory Creation**: Instantiated by G4RunManager, not directly by users

### Key Characteristics

- **Responsibility**: G4RunManager creates and manages G4Run objects; users typically only access them
- **Virtual Methods**: Provides override points for run recording, merging, and event merging
- **Non-copyable**: Copy construction and assignment are explicitly deleted
- **Extensibility**: Expected to be subclassed for custom run data storage

## Important Notes

- Do NOT construct G4Run objects directly; G4RunManager handles instantiation
- User should extend G4Run to store run-specific statistics and data
- The run object is available during BeginOfRunAction() and EndOfRunAction()
- RecordEvent() is meant to be overridden for user-specific event recording
- In multi-threaded mode, Merge() is essential for combining worker thread results
- Kept events are stored in a vector and can consume significant memory

## Constructors & Destructor

### Constructor

```cpp
G4Run();
```

Default constructor for G4Run object.

**Location**: G4Run.hh:50

**Details**:
- Initializes all member variables to default values
- runID = 0
- numberOfEvent = 0
- numberOfEventToBeProcessed = 0
- All pointers set to nullptr
- randomNumberStatus = ""
- eventVector = nullptr

**Usage Notes**:
```cpp
// Users should NOT directly construct G4Run
// Instead, derive a custom class:
class MyRun : public G4Run {
  public:
    MyRun() : G4Run() { /* additional initialization */ }
    // ... custom methods and data members ...
};

// G4RunManager creates instances automatically
```

### Destructor

```cpp
virtual ~G4Run();
```

Destroys the G4Run object and cleans up stored events.

**Location**: G4Run.hh:51

**Details**:
- Virtual to allow proper cleanup in derived classes
- Deletes the eventVector if it was allocated
- Calls destructors for all stored G4Event objects
- Cleans up HCtable and DCtable if owned

**Important**: Derived classes should override destructor if they allocate resources.

### Deleted Copy Operations

```cpp
G4Run(const G4Run&) = delete;
G4Run& operator=(const G4Run&) = delete;
```

Copy construction and assignment are explicitly disabled.

**Location**: G4Run.hh:52-53

**Rationale**: Prevents accidental copying of run data; each run should be unique.

## Virtual Methods (Overridable)

### RecordEvent

```cpp
virtual void RecordEvent(const G4Event*);
```

Records event data into the run; meant to be overridden for user-specific recording.

**Parameters**:
- `G4Event*`: Pointer to the event being recorded (nullptr at end of event loop)

**Location**: G4Run.hh:59

**Default Behavior**: Base class implementation does nothing; derived classes should override.

**Important Notes**:
- Called at the END of each event processing by G4EventManager
- If overridden, user must manually increment numberOfEvent
- The passed G4Event pointer is nullptr at the end of event loop
- Base class does NOT increment numberOfEvent

**Usage Notes**:
```cpp
class MyRun : public G4Run {
  private:
    G4double totalEnergy;
    std::vector<G4double> eventEnergies;

  public:
    MyRun() : G4Run(), totalEnergy(0.) {}

    virtual void RecordEvent(const G4Event* evt) {
        if (evt == nullptr) return;  // End of event loop signal

        // Extract custom data from event
        G4double eventEnergy = GetEventEnergy(evt);
        eventEnergies.push_back(eventEnergy);
        totalEnergy += eventEnergy;

        // IMPORTANT: Must manually increment event counter
        numberOfEvent++;
    }

    G4double GetTotalEnergy() const { return totalEnergy; }
};
```

### Merge

```cpp
virtual void Merge(const G4Run*);
```

Merges a local G4Run object into the global G4Run object; critical for multi-threaded mode.

**Parameters**:
- `const G4Run*`: Pointer to local/worker run to merge (typically from worker thread)

**Location**: G4Run.hh:63

**Default Behavior**: Base class implementation does nothing; MUST be overridden for multi-threaded simulations.

**Thread Context**:
- Called in master thread
- Input run is from worker thread
- Should be thread-safe for merging operations

**Multi-threaded Importance**:
- ESSENTIAL in G4MTRunManager-based simulations
- Each worker thread produces a local run
- Master thread collects and merges all worker runs via this method
- Without proper implementation, worker thread results are lost

**Usage Notes**:
```cpp
class MyRun : public G4Run {
  private:
    G4double totalEnergy;
    std::vector<G4double> eventEnergies;

  public:
    virtual void Merge(const G4Run* localRun) {
        const MyRun* localMyRun = static_cast<const MyRun*>(localRun);

        // Merge simple data
        totalEnergy += localMyRun->totalEnergy;
        numberOfEvent += localMyRun->numberOfEvent;

        // Merge collections
        for (G4double energy : localMyRun->eventEnergies) {
            eventEnergies.push_back(energy);
        }

        // Call base class if needed
        G4Run::Merge(localRun);
    }
};
```

### MergeSubEvent

```cpp
virtual void MergeSubEvent(G4Event* masterEv, const G4Event* subEv);
```

Merges sub-event results (hits, digits) from worker event into master event.

**Parameters**:
- `G4Event* masterEv`: Master/main event to merge into
- `const G4Event* subEv`: Sub-event results from worker thread

**Location**: G4Run.hh:70

**Default Behavior**: Base class merges trajectories; user must call base class method.

**Trajectory Merging**:
- Base class handles trajectory merging automatically
- Should be called at the END of user override

**User Override Purpose**:
- Merge custom hits collections
- Merge custom digits collections
- Merge custom user-defined data attached to events

**Important Notes**:
- Trajectories are merged by base class method
- User MUST invoke base class MergeSubEvent() at the end
- Called in master thread context
- Sub-event should not be modified

**Usage Notes**:
```cpp
class MyRun : public G4Run {
  public:
    virtual void MergeSubEvent(G4Event* masterEv, const G4Event* subEv) {
        // Merge hits collections
        MergeHitsCollections(masterEv, subEv);

        // Merge digits collections
        MergeDigitsCollections(masterEv, subEv);

        // IMPORTANT: Call base class to handle trajectories
        G4Run::MergeSubEvent(masterEv, subEv);
    }

  private:
    void MergeHitsCollections(G4Event* master, const G4Event* sub) {
        // Custom merge logic for hits
        // ...
    }

    void MergeDigitsCollections(G4Event* master, const G4Event* sub) {
        // Custom merge logic for digits
        // ...
    }
};
```

## Event Storage Methods

### StoreEvent

```cpp
void StoreEvent(G4Event* evt);
```

Stores a G4Event object for later access; event remains in memory until run is deleted.

**Parameters**:
- `evt`: Pointer to G4Event to store

**Location**: G4Run.hh:79

**Memory Warning**:
- G4Event objects can be very large
- Storing many events consumes significant memory
- Use with caution in production simulations

**Storage Mechanism**:
- Creates eventVector on first call if not already created
- Appends event to vector
- Stored events persist until G4Run is deleted

**Usage Context**:
- Invoked by G4RunManager when G4EventManager::KeepTheCurrentEvent() is called
- Also invoked when "/event/keepCurrentEvent" UI command is used
- Typically during EndOfEventAction()

**Usage Notes**:
```cpp
class MyEventAction : public G4UserEventAction {
  public:
    virtual void EndOfEventAction(const G4Event* event) {
        // Keep events with high energy
        if (GetEventEnergy(event) > threshold) {
            G4RunManager::GetRunManager()->GetNonConstCurrentRun()
                ->StoreEvent(const_cast<G4Event*>(event));
        }
    }
};
```

## Public Accessor Methods

### GetRunID

```cpp
inline G4int GetRunID() const { return runID; }
```

Returns the run ID number.

**Returns**: Run identification number (typically 0, 1, 2, ... for sequential runs)

**Location**: G4Run.hh:82

**Details**: Set by G4RunManager before run processing starts.

### GetNumberOfEvent

```cpp
inline G4int GetNumberOfEvent() const { return numberOfEvent; }
```

Returns the number of events processed in this run.

**Returns**: Event count (incremented at end of each event processing)

**Location**: G4Run.hh:86

**Details**:
- Updated at end of each event
- If RecordEvent() is overridden, user must manually increment this
- Reflects actual events processed

### GetNumberOfEventToBeProcessed

```cpp
inline G4int GetNumberOfEventToBeProcessed() const { return numberOfEventToBeProcessed; }
```

Returns the total number of events configured for this run.

**Returns**: Total event count for run

**Location**: G4Run.hh:88

**Details**: Set by G4RunManager before run starts; represents BeamOn() parameter.

### GetHCtable

```cpp
inline const G4HCtable* GetHCtable() const { return HCtable; }
```

Returns the hits collection table.

**Returns**: Pointer to G4HCtable (nullptr if not set)

**Location**: G4Run.hh:91

**Details**: References collection definitions available for this run.

### GetDCtable

```cpp
inline const G4DCtable* GetDCtable() const { return DCtable; }
```

Returns the digits collection table.

**Returns**: Pointer to G4DCtable (nullptr if not set)

**Location**: G4Run.hh:94

**Details**: References digit collection definitions available for this run.

### GetRandomNumberStatus

```cpp
inline const G4String& GetRandomNumberStatus() const { return randomNumberStatus; }
```

Returns the random number generator status from run start.

**Returns**: RNG status string/file reference

**Location**: G4Run.hh:97

**Details**:
- Stores initial RNG state for run reproducibility
- Set by G4RunManager at run initialization
- Used for restoring RNG state for event reproduction

## Event Vector Access Methods

### GetEventVector

```cpp
inline std::vector<const G4Event*>* GetEventVector() const { return eventVector; }
```

Returns the vector of stored event pointers.

**Returns**: Pointer to vector of G4Event pointers (nullptr if no events stored)

**Location**: G4Run.hh:100

**Details**:
- Only contains events explicitly stored via StoreEvent()
- nullptr if StoreEvent() was never called
- Vector is empty initially

**Usage Notes**:
```cpp
// Access stored events
const std::vector<const G4Event*>* events = run->GetEventVector();
if (events) {
    for (const G4Event* evt : *events) {
        // Analyze stored event
        ProcessEvent(evt);
    }
}
```

### GetEventVectorSize

```cpp
inline G4int GetEventVectorSize() const
{ return (eventVector!=nullptr) ? (G4int)(eventVector->size()) : 0; }
```

Returns the number of stored events.

**Returns**: Number of events in storage (0 if none stored)

**Location**: G4Run.hh:101-102

**Details**: Safely returns 0 if eventVector not allocated.

### GetNumberOfKeptEvents

```cpp
G4int GetNumberOfKeptEvents() const;
```

Returns the number of stored events (alternative accessor).

**Returns**: Number of stored G4Event objects

**Location**: G4Run.hh:103

**Details**: Same as GetEventVectorSize(); alternative naming convention.

## Public Setter Methods

### SetRunID

```cpp
inline void SetRunID(G4int id) { runID = id; }
```

Sets the run ID number.

**Parameters**:
- `id`: Run identification number

**Location**: G4Run.hh:105

**Note**: Typically set by G4RunManager, not user code.

### SetNumberOfEventToBeProcessed

```cpp
inline void SetNumberOfEventToBeProcessed(G4int n_ev) { numberOfEventToBeProcessed = n_ev; }
```

Sets the total number of events for this run.

**Parameters**:
- `n_ev`: Total event count

**Location**: G4Run.hh:106

**Note**: Set by G4RunManager from BeamOn() parameter; user typically doesn't call this.

### SetHCtable

```cpp
inline void SetHCtable(G4HCtable* HCtbl) { HCtable = HCtbl; }
```

Sets the hits collection table.

**Parameters**:
- `HCtbl`: Pointer to G4HCtable

**Location**: G4Run.hh:107

**Note**: Set by G4RunManager; user typically doesn't call this.

### SetDCtable

```cpp
inline void SetDCtable(G4DCtable* DCtbl) { DCtable = DCtbl; }
```

Sets the digits collection table.

**Parameters**:
- `DCtbl`: Pointer to G4DCtable

**Location**: G4Run.hh:108

**Note**: Set by G4RunManager; user typically doesn't call this.

### SetRandomNumberStatus

```cpp
inline void SetRandomNumberStatus(G4String& st) { randomNumberStatus = st; }
```

Sets the random number generator status string.

**Parameters**:
- `st`: RNG status string/file reference

**Location**: G4Run.hh:109

**Note**: Set by G4RunManager; user typically doesn't call this.

## Protected Member Variables

The following member variables are protected and intended for derived classes:

```cpp
protected:
    G4int runID = 0;
    G4int numberOfEvent = 0;
    G4int numberOfEventToBeProcessed = 0;
    G4HCtable* HCtable = nullptr;
    G4DCtable* DCtable = nullptr;
    G4String randomNumberStatus = "";
    std::vector<const G4Event*>* eventVector = nullptr;
```

**Location**: G4Run.hh:112-118

**Details**:
- Accessible to derived classes for custom implementation
- numberOfEvent should be incremented in overridden RecordEvent()
- eventVector is lazy-allocated on first StoreEvent() call
- All other members are managed by G4RunManager

## Usage Patterns

### Basic Custom Run Class

```cpp
// MyRun.hh
class MyRun : public G4Run {
  private:
    G4double totalEdep;
    G4double totalTrackLength;
    std::map<G4String, G4int> particleCount;

  public:
    MyRun() : G4Run(), totalEdep(0.), totalTrackLength(0.) {}

    virtual ~MyRun() = default;

    // Record event data
    virtual void RecordEvent(const G4Event* evt);

    // Merge worker results in multi-threaded mode
    virtual void Merge(const G4Run* localRun);

    // Accessors
    G4double GetTotalEdep() const { return totalEdep; }
    G4double GetTotalTrackLength() const { return totalTrackLength; }
    G4int GetParticleCount(const G4String& name) const;
};

// MyRun.cc
void MyRun::RecordEvent(const G4Event* evt) {
    if (evt == nullptr) return;  // End of run signal

    // Extract energy deposition
    totalEdep += GetEventEdep(evt);
    totalTrackLength += GetEventTrackLength(evt);

    // Count particles
    for (const auto& particle : GetEventParticles(evt)) {
        particleCount[particle]++;
    }

    // IMPORTANT: Increment event counter
    numberOfEvent++;
}

void MyRun::Merge(const G4Run* localRun) {
    const MyRun* local = static_cast<const MyRun*>(localRun);

    // Merge energy and track data
    totalEdep += local->totalEdep;
    totalTrackLength += local->totalTrackLength;
    numberOfEvent += local->numberOfEvent;

    // Merge particle counts
    for (const auto& entry : local->particleCount) {
        particleCount[entry.first] += entry.second;
    }
}
```

### Run Action Integration

```cpp
class MyRunAction : public G4UserRunAction {
  private:
    MyRun* fRun;

  public:
    virtual G4Run* GenerateRun() {
        // Create custom run
        fRun = new MyRun();
        return fRun;
    }

    virtual void BeginOfRunAction(const G4Run* run) {
        G4cout << "Run " << run->GetRunID() << " started" << G4endl;
    }

    virtual void EndOfRunAction(const G4Run* run) {
        // Access custom data
        const MyRun* myRun = static_cast<const MyRun*>(run);

        G4cout << "Total energy: " << myRun->GetTotalEdep() << G4endl;
        G4cout << "Total track length: " << myRun->GetTotalTrackLength() << G4endl;
        G4cout << "Events processed: " << run->GetNumberOfEvent() << G4endl;
    }
};
```

### Multi-threaded Run Merging

```cpp
class MyRun : public G4Run {
  private:
    std::vector<G4double> energyDeposits;
    std::map<G4String, G4int> processCount;

  public:
    virtual void RecordEvent(const G4Event* evt) {
        if (evt == nullptr) return;

        energyDeposits.push_back(GetEventEdep(evt));
        // Count processes used
        // ...
        numberOfEvent++;
    }

    virtual void Merge(const G4Run* localRun) {
        const MyRun* local = static_cast<const MyRun*>(localRun);

        // Merge energy vector
        energyDeposits.insert(
            energyDeposits.end(),
            local->energyDeposits.begin(),
            local->energyDeposits.end()
        );

        // Merge process counts
        for (const auto& entry : local->processCount) {
            processCount[entry.first] += entry.second;
        }

        numberOfEvent += local->numberOfEvent;
    }
};
```

### Event Storage Example

```cpp
class MyEventAction : public G4UserEventAction {
  private:
    G4double energyThreshold;

  public:
    MyEventAction(G4double threshold)
        : energyThreshold(threshold) {}

    virtual void EndOfEventAction(const G4Event* event) {
        G4double edep = GetEventEnergyDeposition(event);

        // Keep high-energy events for detailed analysis
        if (edep > energyThreshold) {
            // Note: G4EventManager automatically calls run->StoreEvent()
            // when KeepTheCurrentEvent() is called
            G4EventManager::GetEventManager()->KeepTheCurrentEvent();
        }
    }
};

// Later, in run action or analysis:
class MyRunAction : public G4UserRunAction {
  public:
    virtual void EndOfRunAction(const G4Run* run) {
        const std::vector<const G4Event*>* events = run->GetEventVector();
        if (events) {
            G4cout << "High-energy events: " << events->size() << G4endl;

            for (const G4Event* evt : *events) {
                AnalyzeHighEnergyEvent(evt);
            }
        }
    }
};
```

## Important Implementation Details

### numberOfEvent Management

- In base class RecordEvent(), numberOfEvent is NOT incremented
- If you override RecordEvent(), you MUST manually increment numberOfEvent
- G4RunManager calls RecordEvent() at end of each event (including with evt=nullptr at loop end)
- numberOfEvent reflects events successfully recorded by your custom logic

### Event Vector Lifetime

- Created on first StoreEvent() call (lazy initialization)
- Events are NOT copies; stores pointers to G4Event objects
- Events remain valid while G4Event objects exist (managed by G4EventManager)
- All stored events are deleted when G4Run is destroyed

### Merge in Multi-threaded Simulations

- Called in master thread after worker thread completes
- Local run objects are created/destroyed per worker
- CRITICAL: Must properly accumulate all worker results
- Missing implementation causes loss of worker thread data

### Sub-event Merging

- Distinct from Run merging
- Handles event-level data (hits, digits) merging
- Base class handles trajectory merging
- User override must call base class method

## Virtual Method Summary

| Method | Purpose | Override When |
|--------|---------|-----------------|
| RecordEvent() | Record event into run | Storing custom run statistics |
| Merge() | Merge worker run into master | Multi-threaded simulations |
| MergeSubEvent() | Merge event-level data | Custom hits/digits handling |

## Related Classes

- **G4RunManager** - Creates and manages G4Run objects
- **G4MTRunManager** - Multi-threaded variant; calls Merge() on worker runs
- **G4Event** - Individual event data; stored by StoreEvent()
- **G4UserRunAction** - User customization hook; can override GenerateRun()
- **G4HCtable** - Hits collection definitions
- **G4DCtable** - Digits collection definitions

## See Also

- [G4RunManager](./g4runmanager.md) - Run orchestration
- [G4MTRunManager](./g4mtrunmanager.md) - Multi-threaded run management
- [G4Event](./g4event.md) - Event data container
- [G4UserRunAction](./g4userrunaction.md) - User run customization
- [G4EventManager](./g4eventmanager.md) - Event processing
