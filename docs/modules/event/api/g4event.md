# G4Event API Documentation

## Overview

`G4Event` is the central container class that represents a complete event in Geant4 simulation. It holds all event-related data including primary vertices, hits collections, digits collections, and trajectories. Events are created and managed by `G4RunManager` and processed by `G4EventManager`.

::: tip Header File
**Location:** `source/event/include/G4Event.hh`
**Source:** `source/event/src/G4Event.cc`
:::

## Class Declaration

```cpp
class G4Event
{
  public:
    G4Event() = default;
    explicit G4Event(G4int evID);
   ~G4Event();

    G4Event(const G4Event &) = delete;
    G4Event& operator=(const G4Event &) = delete;

    // Memory management
    void *operator new(std::size_t);
    void operator delete(void* anEvent);

    // Comparison
    G4bool operator==(const G4Event& right) const;
    G4bool operator!=(const G4Event& right) const;

    // ... (methods detailed below)
};
```

## Memory Management

### Custom Allocator
`source/event/include/G4Event.hh:307-322`

Uses `G4Allocator` for efficient memory allocation:

```cpp
inline void* G4Event::operator new(std::size_t)
{
    if (anEventAllocator() == nullptr)
        anEventAllocator() = new G4Allocator<G4Event>;
    return (void*)anEventAllocator()->MallocSingle();
}

inline void G4Event::operator delete(void* anEvent)
{
    anEventAllocator()->FreeSingle((G4Event*)anEvent);
}
```

::: warning Memory Management
Events are typically created and deleted by `G4RunManager`. Manual creation requires proper memory management.
:::

## Constructors and Destructor

### Default Constructor
`source/event/include/G4Event.hh:61`

```cpp
G4Event() = default;
```

Creates event with default initialization (event ID = 0).

### Parametrized Constructor
`source/event/include/G4Event.hh:62`

```cpp
explicit G4Event(G4int evID);
```

**Parameters:**
- `evID`: Event ID number (typically starts at 0)

### Destructor
`source/event/include/G4Event.hh:63`

```cpp
~G4Event();
```

Automatically deletes:
- All primary vertices and their associated particles
- Hits collections (`G4HCofThisEvent`)
- Digits collections (`G4DCofThisEvent`)
- Trajectory container
- User information
- Random number status strings
- Sub-event objects

## Event Identification

### GetEventID()
`source/event/include/G4Event.hh:126-127`

```cpp
inline G4int GetEventID() const;
```

**Returns:** Event ID number

**Example:**
```cpp
G4int eventNumber = event->GetEventID();
G4cout << "Processing event " << eventNumber << G4endl;
```

### SetEventID()
`source/event/include/G4Event.hh:81-82`

```cpp
inline void SetEventID(G4int i);
```

**Parameters:**
- `i`: Event ID to set

::: tip Usage
Normally set by `G4RunManager`. Manual setting rarely needed.
:::

## Primary Vertices and Particles

### AddPrimaryVertex()
`source/event/include/G4Event.hh:129-139`

```cpp
inline void AddPrimaryVertex(G4PrimaryVertex* aPrimaryVertex);
```

**Parameters:**
- `aPrimaryVertex`: Pointer to primary vertex to add

**Behavior:**
- Vertices stored as linked list
- First vertex becomes head of list
- Subsequent vertices appended via `SetNext()`
- Increments `numberOfPrimaryVertex` counter

**Example:**
```cpp
G4PrimaryVertex* vertex = new G4PrimaryVertex(0, 0, 0, 0);
G4PrimaryParticle* particle = new G4PrimaryParticle(
    G4Electron::Definition(), px, py, pz);
vertex->SetPrimary(particle);
event->AddPrimaryVertex(vertex);
```

::: warning Ownership
Event takes ownership of vertex. Do not delete manually.
:::

### GetNumberOfPrimaryVertex()
`source/event/include/G4Event.hh:141-142`

```cpp
inline G4int GetNumberOfPrimaryVertex() const;
```

**Returns:** Total number of primary vertices in event

**Example:**
```cpp
G4int nVertex = event->GetNumberOfPrimaryVertex();
for (G4int i = 0; i < nVertex; ++i) {
    G4PrimaryVertex* vertex = event->GetPrimaryVertex(i);
    // Process vertex
}
```

### GetPrimaryVertex()
`source/event/include/G4Event.hh:145-161`

```cpp
inline G4PrimaryVertex* GetPrimaryVertex(G4int i = 0) const;
```

**Parameters:**
- `i`: Vertex index (0-based). Default = 0 (first vertex)

**Returns:**
- Pointer to i-th primary vertex
- `nullptr` if index out of range

**Implementation:**
```cpp
inline G4PrimaryVertex* G4Event::GetPrimaryVertex(G4int i) const
{
    if (i == 0)
        return thePrimaryVertex;  // Fast path for first vertex

    if (i > 0 && i < numberOfPrimaryVertex) {
        G4PrimaryVertex* primaryVertex = thePrimaryVertex;
        for (G4int j = 0; j < i; ++j) {
            if (primaryVertex == nullptr) return nullptr;
            primaryVertex = primaryVertex->GetNext();
        }
        return primaryVertex;
    }
    return nullptr;
}
```

**Example:**
```cpp
// Get first vertex
G4PrimaryVertex* firstVertex = event->GetPrimaryVertex();

// Iterate all vertices
for (G4int i = 0; i < event->GetNumberOfPrimaryVertex(); ++i) {
    G4PrimaryVertex* vertex = event->GetPrimaryVertex(i);
    ProcessVertex(vertex);
}
```

## Hits and Digits Collections

### SetHCofThisEvent() / GetHCofThisEvent()
`source/event/include/G4Event.hh:83-84, 164-165`

```cpp
inline void SetHCofThisEvent(G4HCofThisEvent* value);
inline G4HCofThisEvent* GetHCofThisEvent() const;
```

**Purpose:** Manage hits collections container

**Example:**
```cpp
// Retrieve hits collections at end of event
G4HCofThisEvent* hitsCollection = event->GetHCofThisEvent();
if (hitsCollection) {
    G4int nCollections = hitsCollection->GetNumberOfCollections();
    for (G4int i = 0; i < nCollections; ++i) {
        G4VHitsCollection* hc = hitsCollection->GetHC(i);
        ProcessHits(hc);
    }
}
```

### SetDCofThisEvent() / GetDCofThisEvent()
`source/event/include/G4Event.hh:85-86, 166-167`

```cpp
inline void SetDCofThisEvent(G4DCofThisEvent* value);
inline G4DCofThisEvent* GetDCofThisEvent() const;
```

**Purpose:** Manage digits collections container

::: info Hits vs Digits
- **Hits**: Raw detector response (analog)
- **Digits**: Digitized signals (after ADC/TDC simulation)
:::

## Trajectory Storage

### SetTrajectoryContainer() / GetTrajectoryContainer()
`source/event/include/G4Event.hh:87-88, 168-169`

```cpp
inline void SetTrajectoryContainer(G4TrajectoryContainer* value);
inline G4TrajectoryContainer* GetTrajectoryContainer() const;
```

**Purpose:** Store particle trajectories for visualization/analysis

**Example:**
```cpp
G4TrajectoryContainer* trajectories = event->GetTrajectoryContainer();
if (trajectories) {
    G4int nTraj = trajectories->entries();
    for (G4int i = 0; i < nTraj; ++i) {
        G4VTrajectory* trajectory = (*trajectories)[i];
        AnalyzeTrajectory(trajectory);
    }
}
```

::: tip Performance
Storing trajectories consumes memory. Enable only when needed for visualization or detailed analysis.
:::

## Event Status and Control

### SetEventAborted() / IsAborted()
`source/event/include/G4Event.hh:89-90, 175`

```cpp
inline void SetEventAborted();
inline G4bool IsAborted() const;
```

**Purpose:** Mark/check if event processing was aborted

**Example:**
```cpp
// In user code - abort event if condition met
if (criticalError) {
    G4EventManager::GetEventManager()->AbortCurrentEvent();
}

// Later - check if event was aborted
if (event->IsAborted()) {
    G4cout << "Event " << event->GetEventID()
           << " was aborted" << G4endl;
    // Event data may be incomplete
}
```

### KeepTheEvent() / KeepTheEventFlag() / ToBeKept()
`source/event/include/G4Event.hh:101-111`

```cpp
inline void KeepTheEvent(G4bool vl = true) const;
inline G4bool KeepTheEventFlag() const;
inline G4bool ToBeKept() const;
```

**Purpose:** Control event persistence

**Parameters:**
- `vl`: `true` to keep event (default), `false` to allow deletion

**Behavior:**
- `KeepTheEvent()`: Set flag to keep event until end of run
- `KeepTheEventFlag()`: Check if keep flag is set
- `ToBeKept()`: Check if event should be kept (includes sub-event logic)

**Example:**
```cpp
void MyEventAction::EndOfEventAction(const G4Event* event) {
    // Keep only interesting events
    if (totalEnergyDeposit > threshold) {
        event->KeepTheEvent();
    }
}
```

::: warning Memory Impact
Kept events accumulate in memory. Use sparingly to avoid memory exhaustion in long runs.
:::

### KeepForPostProcessing() / PostProcessingFinished() / GetNumberOfGrips()
`source/event/include/G4Event.hh:112-124`

```cpp
inline void KeepForPostProcessing() const;
inline void PostProcessingFinished() const;
inline G4int GetNumberOfGrips() const;
```

**Purpose:** Reference counting for post-processing

**Behavior:**
- `KeepForPostProcessing()`: Increments grip counter
- `PostProcessingFinished()`: Decrements grip counter
- `GetNumberOfGrips()`: Returns current grip count
- Event kept while grips > 0

**Example:**
```cpp
// Begin asynchronous processing
event->KeepForPostProcessing();
SubmitToAsyncProcessor(event);

// When processing complete
event->PostProcessingFinished();
```

## User Information

### SetUserInformation() / GetUserInformation()
`source/event/include/G4Event.hh:179-182`

```cpp
inline void SetUserInformation(G4VUserEventInformation* anInfo);
inline G4VUserEventInformation* GetUserInformation() const;
```

**Purpose:** Attach custom user-defined data to event

**Example:**
```cpp
// Define custom event information
class MyEventInfo : public G4VUserEventInformation {
public:
    void Print() const override { /* ... */ }

    G4double totalEdep;
    G4int primaryPDG;
    std::vector<G4ThreeVector> hitPositions;
};

// Set at begin of event
void MyEventAction::BeginOfEventAction(const G4Event* event) {
    MyEventInfo* info = new MyEventInfo();
    event->SetUserInformation(info);
}

// Access during/after event
void MyEventAction::EndOfEventAction(const G4Event* event) {
    MyEventInfo* info =
        dynamic_cast<MyEventInfo*>(event->GetUserInformation());
    if (info) {
        G4cout << "Total Edep: " << info->totalEdep << G4endl;
    }
}
```

::: tip Ownership
Event takes ownership of user information. Will be deleted with event.
:::

## Random Number Status

### SetRandomNumberStatus() / GetRandomNumberStatus()
`source/event/include/G4Event.hh:91-95, 185-192`

```cpp
inline void SetRandomNumberStatus(G4String& st);
inline const G4String& GetRandomNumberStatus() const;
```

**Purpose:** Store RNG state before primary particle generation

**Example:**
```cpp
// Store RNG status (typically done by framework)
G4String rngStatus = CLHEP::HepRandom::getTheEngine()->name();
event->SetRandomNumberStatus(rngStatus);

// Retrieve for event reproduction
try {
    const G4String& status = event->GetRandomNumberStatus();
    // Use to reproduce event
} catch (G4Exception& e) {
    // Status not available
}
```

::: info Exception
`GetRandomNumberStatus()` throws `G4Exception` if status not set (Event0701).
:::

### SetRandomNumberStatusForProcessing() / GetRandomNumberStatusForProcessing()
`source/event/include/G4Event.hh:96-100, 193-201`

```cpp
inline void SetRandomNumberStatusForProcessing(G4String& st);
inline const G4String& GetRandomNumberStatusForProcessing() const;
```

**Purpose:** Store RNG state before event processing

::: tip Reproducibility
These methods enable event-by-event reproducibility for debugging and validation.
:::

## Visualization

### Print()
`source/event/include/G4Event.hh:74-75`

```cpp
void Print() const;
```

**Purpose:** Print event ID to `G4cout`

**Example:**
```cpp
event->Print();  // Output: Event ID: 42
```

### Draw()
`source/event/include/G4Event.hh:76-79`

```cpp
void Draw() const;
```

**Purpose:** Visualize event contents

**Behavior:**
- Invokes `Draw()` on all trajectories
- Invokes `Draw()` on all hits (if implemented)
- Invokes `Draw()` on all digits (if implemented)

::: warning Requirements
Concrete hits/digits classes must implement `Draw()` method. Otherwise nothing drawn.
:::

## Sub-Event Parallelism (Advanced)

::: tip Advanced Feature
Sub-event parallelism is for advanced parallel processing within events. Most users won't need these methods.
:::

### PopSubEvent()
`source/event/include/G4Event.hh:244-246`

```cpp
G4SubEvent* PopSubEvent(G4int ty);
```

**Parameters:**
- `ty`: Sub-event type identifier

**Returns:** Pointer to sub-event, or `nullptr` if none available

**Purpose:** Retrieve next sub-event for worker thread processing

### TerminateSubEvent()
`source/event/include/G4Event.hh:247-249`

```cpp
G4int TerminateSubEvent(G4SubEvent* se);
```

**Parameters:**
- `se`: Completed sub-event

**Purpose:** Register completion of sub-event processing

### StoreSubEvent()
`source/event/include/G4Event.hh:251-253`

```cpp
G4int StoreSubEvent(G4int ty, G4SubEvent* se);
```

**Purpose:** Store remaining sub-event at end of event processing

### SpawnSubEvent()
`source/event/include/G4Event.hh:255-256`

```cpp
G4int SpawnSubEvent(G4SubEvent* se);
```

**Purpose:** Register sub-event when sent to worker thread

### GetNumberOfRemainingSubEvents()
`source/event/include/G4Event.hh:257-258`

```cpp
G4int GetNumberOfRemainingSubEvents() const;
```

**Returns:** Number of sub-events waiting or in-process

### GetNumberOfCompletedSubEvent()
`source/event/include/G4Event.hh:260-261`

```cpp
inline G4int GetNumberOfCompletedSubEvent() const;
```

**Returns:** Number of completed sub-events

### MergeSubEventResults()
`source/event/include/G4Event.hh:263`

```cpp
void MergeSubEventResults(const G4Event* se);
```

**Parameters:**
- `se`: Sub-event with results to merge

**Purpose:** Merge worker thread results into master event

### FlagAsSubEvent() / GetMotherEvent() / GetSubEventType()
`source/event/include/G4Event.hh:287-295`

```cpp
void FlagAsSubEvent(G4Event* me, G4int ty);
inline G4Event* GetMotherEvent() const;
inline G4int GetSubEventType() const;
```

**Purpose:** Sub-event identification and relationship

### ScoresRecorded() / ScoresAlreadyRecorded()
`source/event/include/G4Event.hh:301-302`

```cpp
void ScoresRecorded() const;
G4bool ScoresAlreadyRecorded() const;
```

**Purpose:** Track whether scores have been recorded

### EventCompleted() / IsEventCompleted()
`source/event/include/G4Event.hh:303-304`

```cpp
void EventCompleted() const;
G4bool IsEventCompleted() const;
```

**Purpose:** Track event completion status

## Data Members

### Private Members
`source/event/include/G4Event.hh:203-238`

```cpp
private:
    G4int eventID = 0;
    G4PrimaryVertex* thePrimaryVertex = nullptr;
    G4int numberOfPrimaryVertex = 0;
    G4HCofThisEvent* HC = nullptr;
    G4DCofThisEvent* DC = nullptr;
    G4TrajectoryContainer* trajectoryContainer = nullptr;
    G4bool eventAborted = false;
    G4VUserEventInformation* userInfo = nullptr;
    G4String* randomNumberStatus = nullptr;
    G4bool validRandomNumberStatus = false;
    G4String* randomNumberStatusForProcessing = nullptr;
    G4bool validRandomNumberStatusForProcessing = false;
    mutable G4bool keepTheEvent = false;
    mutable G4int grips = 0;
```

### Sub-Event Members
`source/event/include/G4Event.hh:266-299`

```cpp
private:
    std::map<G4int, std::set<G4SubEvent*>*> fSubEvtStackMap;
    std::set<G4SubEvent*> fSubEvtVector;
    std::set<G4SubEvent*> fSubEventGarbageBin;
    G4Event* motherEvent = nullptr;
    G4int subEventType = -1;
    mutable G4bool scoresRecorded = false;
    mutable G4bool eventCompleted = false;
```

## Complete Example

```cpp
// In your PrimaryGeneratorAction
void MyPrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
    // Create primary vertex
    G4PrimaryVertex* vertex = new G4PrimaryVertex(0, 0, 0, 0);

    // Create primary particle (10 GeV electron)
    G4PrimaryParticle* particle = new G4PrimaryParticle(
        G4Electron::Definition());
    particle->SetKineticEnergy(10*GeV);
    particle->SetMomentumDirection(G4ThreeVector(0, 0, 1));

    vertex->SetPrimary(particle);
    event->AddPrimaryVertex(vertex);
}

// In your EventAction
class MyEventAction : public G4UserEventAction
{
public:
    void BeginOfEventAction(const G4Event* event) override
    {
        // Initialize per-event data
        G4int evtID = event->GetEventID();
        if (evtID % 1000 == 0)
            G4cout << "Processing event " << evtID << G4endl;

        // Attach custom information
        MyEventInfo* info = new MyEventInfo();
        event->SetUserInformation(info);
    }

    void EndOfEventAction(const G4Event* event) override
    {
        // Check if event was aborted
        if (event->IsAborted()) {
            G4cout << "Event was aborted!" << G4endl;
            return;
        }

        // Retrieve hits
        G4HCofThisEvent* hitsCollection = event->GetHCofThisEvent();
        if (hitsCollection) {
            ProcessHits(hitsCollection);
        }

        // Analyze trajectories
        G4TrajectoryContainer* trajectories =
            event->GetTrajectoryContainer();
        if (trajectories) {
            AnalyzeTrajectories(trajectories);
        }

        // Access user information
        MyEventInfo* info =
            dynamic_cast<MyEventInfo*>(event->GetUserInformation());
        if (info && info->totalEdep > threshold) {
            event->KeepTheEvent();  // Keep interesting events
        }
    }
};
```

## Thread Safety

### Thread-Local Storage

Events are thread-local in multi-threaded mode:
- Each worker thread has its own `G4Event` instances
- No synchronization needed for event access within thread
- Results merged at run level by `G4RunManager`

### Sub-Event Parallelism

Sub-event methods are mutex-protected:
- `PopSubEvent()`: Thread-safe retrieval
- `TerminateSubEvent()`: Thread-safe completion
- `SpawnSubEvent()`: Thread-safe registration

## Performance Notes

1. **Memory Allocation**: Uses custom allocator for performance
2. **Linked Lists**: Primary vertices stored as linked list (not random access)
3. **Event Keeping**: Kept events accumulate - use sparingly
4. **Trajectory Storage**: Disabled by default - enable only when needed

## See Also

- [G4PrimaryVertex](g4primaryvertex.md) - Primary vertex class
- [G4PrimaryParticle](g4primaryparticle.md) - Primary particle class
- [G4EventManager](g4eventmanager.md) - Event processing manager
- [Event Module Overview](../index.md) - Complete module documentation
- [Run Module](../../run/index.md) - Event management in runs

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4Event.hh`
- Source: `source/event/src/G4Event.cc`
:::
