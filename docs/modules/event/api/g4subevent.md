# G4SubEvent API Documentation

## Overview

`G4SubEvent` is a container class for managing tracks within a sub-event during parallel event processing. It extends `std::vector<G4StackedTrack>` to provide specialized functionality for sub-event parallelism, enabling intra-event parallelization where groups of related tracks can be processed in parallel by different worker threads.

Sub-events enable processing electromagnetic showers, hadronic cascades, or other track groups in parallel within a single event, significantly improving performance for complex events on multi-core systems.

::: tip Header File
**Location:** `source/event/include/G4SubEvent.hh`
:::

::: warning Advanced Feature
Sub-event parallelism is an advanced feature for expert users requiring deep understanding of thread safety and parallel processing in Geant4.
:::

## Class Declaration

`source/event/include/G4SubEvent.hh:45-102`

```cpp
class G4SubEvent : public std::vector<G4StackedTrack>
{
  public:
    G4SubEvent() = default;
    explicit G4SubEvent(G4int ty, std::size_t maxEnt);
   ~G4SubEvent();

    G4SubEvent& operator=(const G4SubEvent&) = delete;
    G4bool operator==(const G4SubEvent&) const = delete;
    G4bool operator!=(const G4SubEvent&) const = delete;

    // Memory management
    inline void *operator new(std::size_t);
    inline void operator delete(void* anEvent);

    // Stack operations
    inline void PushToStack(const G4StackedTrack& aStackedTrack);
    G4StackedTrack PopFromStack();
    void clearAndDestroy();

    // Query methods
    inline G4int GetSubEventType() const;
    inline std::size_t GetNTrack() const;
    inline std::size_t GetMaxNTrack() const;

    // Energy
    G4double getTotalEnergy() const;

    // Parent event
    inline void SetEvent(G4Event* evt);
    inline G4Event* GetEvent() const;

  private:
    G4int fSubEventType = -1;
    std::size_t fMaxEnt = 1000;
    G4Event* fpEvent = nullptr;
};
```

## Memory Management

### Custom Allocator
`source/event/include/G4SubEvent.hh:56-57, 86-100`

```cpp
inline void *operator new(std::size_t);
inline void operator delete(void* anEvent);
```

Uses `G4Allocator` for efficient memory allocation:

```cpp
inline void* G4SubEvent::operator new(std::size_t)
{
    if (aSubEventAllocator() == nullptr)
        aSubEventAllocator() = new G4Allocator<G4SubEvent>;
    return (void*)aSubEventAllocator()->MallocSingle();
}

inline void G4SubEvent::operator delete(void* aSubEvent)
{
    aSubEventAllocator()->FreeSingle((G4SubEvent*)aSubEvent);
}
```

**Benefits:**
- Fast allocation/deallocation
- Reduced memory fragmentation
- Pool-based memory management

## Constructors and Destructor

### Default Constructor
`source/event/include/G4SubEvent.hh:49`

```cpp
G4SubEvent() = default;
```

**Purpose:** Create empty sub-event with default values

**Default Values:**
- `fSubEventType` = -1
- `fMaxEnt` = 1000
- `fpEvent` = nullptr

### Parametrized Constructor
`source/event/include/G4SubEvent.hh:50-51`

```cpp
explicit G4SubEvent(G4int ty, std::size_t maxEnt)
  : fSubEventType(ty), fMaxEnt(maxEnt)
{}
```

**Parameters:**
- `ty`: Sub-event type ID (100-115 for fSubEvent_0 to fSubEvent_F)
- `maxEnt`: Maximum number of tracks for this sub-event

**Example:**
```cpp
// Create sub-event for EM shower with capacity for 1000 tracks
G4SubEvent* emShowerSubEvent = new G4SubEvent(fSubEvent_1, 1000);

// Create sub-event for hadronic cascade with capacity for 500 tracks
G4SubEvent* hadronicSubEvent = new G4SubEvent(fSubEvent_2, 500);
```

### Destructor
`source/event/include/G4SubEvent.hh:52`

```cpp
~G4SubEvent();
```

**Behavior:**
- Does NOT delete tracks by default
- Use `clearAndDestroy()` before deletion to clean up tracks
- Calls vector destructor to clear container

**Example:**
```cpp
{
    G4SubEvent* subEvent = new G4SubEvent(fSubEvent_1, 1000);
    // ... use sub-event ...
    subEvent->clearAndDestroy();  // Clean up tracks
    delete subEvent;  // Now safe to delete
}
```

## Stack Operations

### PushToStack()
`source/event/include/G4SubEvent.hh:62-63`

```cpp
inline void PushToStack(const G4StackedTrack& aStackedTrack)
{
    push_back(aStackedTrack);
}
```

**Parameters:**
- `aStackedTrack`: Track to add to sub-event

**Behavior:**
- Adds track to end of vector (LIFO semantics)
- Automatically grows capacity if needed

**Example:**
```cpp
G4SubEvent* subEvent = new G4SubEvent(fSubEvent_1, 1000);

// Add tracks to sub-event
for (auto track : emShowerTracks) {
    G4StackedTrack stackedTrack(track);
    subEvent->PushToStack(stackedTrack);
}

G4cout << "Sub-event contains " << subEvent->GetNTrack()
       << " tracks" << G4endl;
```

### PopFromStack()
`source/event/include/G4SubEvent.hh:64`

```cpp
G4StackedTrack PopFromStack();
```

**Returns:** Last track added (LIFO order)

**Behavior:**
- Retrieves and removes last element
- Decrements size by 1

**Example:**
```cpp
// Process all tracks in sub-event
while (subEvent->GetNTrack() > 0) {
    G4StackedTrack stackedTrack = subEvent->PopFromStack();
    G4Track* track = stackedTrack.GetTrack();

    // Process track
    trackingManager->ProcessOneTrack(track);

    delete track;
    delete stackedTrack.GetTrajectory();
}
```

::: warning Empty Sub-Event
Calling `PopFromStack()` on empty sub-event causes undefined behavior. Always check `GetNTrack() > 0` first.
:::

### clearAndDestroy()
`source/event/include/G4SubEvent.hh:66`

```cpp
void clearAndDestroy();
```

**Purpose:** Delete all tracks and trajectories, then clear sub-event

**Behavior:**
- Iterates through all `G4StackedTrack` objects
- Deletes associated `G4Track` and `G4VTrajectory` objects
- Clears the vector

**Example:**
```cpp
// Clean up sub-event at end of processing
subEvent->clearAndDestroy();

// Sub-event now empty and all tracks deleted
G4cout << "Sub-event cleared, " << subEvent->GetNTrack()
       << " tracks remaining" << G4endl;  // Should be 0
```

## Query Methods

### GetSubEventType()
`source/event/include/G4SubEvent.hh:68`

```cpp
inline G4int GetSubEventType() const { return fSubEventType; }
```

**Returns:** Sub-event type ID

**Example:**
```cpp
G4int type = subEvent->GetSubEventType();

switch (type) {
    case fSubEvent_1:
        G4cout << "EM shower sub-event" << G4endl;
        break;
    case fSubEvent_2:
        G4cout << "Hadronic cascade sub-event" << G4endl;
        break;
    default:
        G4cout << "Sub-event type: " << type << G4endl;
}
```

### GetNTrack()
`source/event/include/G4SubEvent.hh:69`

```cpp
inline std::size_t GetNTrack() const { return size(); }
```

**Returns:** Current number of tracks in sub-event

**Example:**
```cpp
std::size_t nTracks = subEvent->GetNTrack();
G4cout << "Sub-event contains " << nTracks << " tracks" << G4endl;

if (nTracks >= subEvent->GetMaxNTrack()) {
    G4cout << "Sub-event full, creating new sub-event" << G4endl;
}
```

### GetMaxNTrack()
`source/event/include/G4SubEvent.hh:70`

```cpp
inline std::size_t GetMaxNTrack() const { return fMaxEnt; }
```

**Returns:** Maximum capacity of sub-event

**Example:**
```cpp
std::size_t capacity = subEvent->GetMaxNTrack();
std::size_t current = subEvent->GetNTrack();

G4cout << "Sub-event usage: " << current << "/" << capacity
       << " (" << (100.0*current/capacity) << "%)" << G4endl;
```

### getTotalEnergy()
`source/event/include/G4SubEvent.hh:72`

```cpp
G4double getTotalEnergy() const;
```

**Returns:** Sum of kinetic energies of all tracks in sub-event

**Purpose:** Energy balance monitoring and debugging

**Example:**
```cpp
G4double totalEnergy = subEvent->getTotalEnergy();

G4cout << "Sub-event total energy: "
       << totalEnergy/GeV << " GeV" << G4endl;

G4cout << "Average track energy: "
       << totalEnergy/subEvent->GetNTrack()/MeV << " MeV"
       << G4endl;
```

## Parent Event Association

### SetEvent()
`source/event/include/G4SubEvent.hh:75`

```cpp
inline void SetEvent(G4Event* evt) { fpEvent = evt; }
```

**Parameters:**
- `evt`: Pointer to parent event

**Purpose:** Associate sub-event with its parent event

**Example:**
```cpp
G4Event* event = GetCurrentEvent();
G4SubEvent* subEvent = new G4SubEvent(fSubEvent_1, 1000);

// Link sub-event to parent event
subEvent->SetEvent(event);
```

### GetEvent()
`source/event/include/G4SubEvent.hh:76`

```cpp
inline G4Event* GetEvent() const { return fpEvent; }
```

**Returns:** Pointer to parent event (may be nullptr)

**Example:**
```cpp
G4Event* parentEvent = subEvent->GetEvent();

if (parentEvent != nullptr) {
    G4int eventID = parentEvent->GetEventID();
    G4cout << "Sub-event belongs to event " << eventID << G4endl;

    // Access parent event data
    G4HCofThisEvent* hc = parentEvent->GetHCofThisEvent();
    // ... use hits collection ...
}
```

## Complete Examples

### Example 1: Basic Sub-Event Usage

```cpp
void DemonstrateSubEvent()
{
    // Create sub-event for EM shower
    G4SubEvent* emSubEvent = new G4SubEvent(fSubEvent_1, 1000);

    // Link to parent event
    G4Event* event = GetCurrentEvent();
    emSubEvent->SetEvent(event);

    // Add EM shower tracks
    std::vector<G4Track*> emTracks = GetEMShowerTracks();
    for (auto track : emTracks) {
        G4StackedTrack stackedTrack(track);
        emSubEvent->PushToStack(stackedTrack);
    }

    G4cout << "Created EM sub-event with "
           << emSubEvent->GetNTrack() << " tracks" << G4endl;
    G4cout << "Total energy: "
           << emSubEvent->getTotalEnergy()/MeV << " MeV" << G4endl;

    // Process sub-event...
    ProcessSubEvent(emSubEvent);

    // Clean up
    emSubEvent->clearAndDestroy();
    delete emSubEvent;
}
```

### Example 2: Multi-Type Sub-Event System

```cpp
class SubEventManager
{
public:
    void Initialize(G4Event* event)
    {
        fpEvent = event;

        // Create sub-events for different particle types
        fEMSubEvent = new G4SubEvent(fSubEvent_1, 1000);
        fHadronicSubEvent = new G4SubEvent(fSubEvent_2, 500);
        fNeutronSubEvent = new G4SubEvent(fSubEvent_3, 2000);

        // Link to parent event
        fEMSubEvent->SetEvent(event);
        fHadronicSubEvent->SetEvent(event);
        fNeutronSubEvent->SetEvent(event);
    }

    void ClassifyAndPush(G4Track* track)
    {
        G4StackedTrack stackedTrack(track);
        G4ParticleDefinition* particle = track->GetDefinition();

        if (particle == G4Gamma::Definition() ||
            particle == G4Electron::Definition() ||
            particle == G4Positron::Definition()) {
            // EM shower
            if (fEMSubEvent->GetNTrack() < fEMSubEvent->GetMaxNTrack()) {
                fEMSubEvent->PushToStack(stackedTrack);
            } else {
                // Sub-event full, spawn for processing
                SpawnSubEvent(fEMSubEvent);
                fEMSubEvent = new G4SubEvent(fSubEvent_1, 1000);
                fEMSubEvent->SetEvent(fpEvent);
                fEMSubEvent->PushToStack(stackedTrack);
            }
        }
        else if (particle == G4Neutron::Definition()) {
            // Neutron cascade
            fNeutronSubEvent->PushToStack(stackedTrack);
        }
        else {
            // Hadronic
            fHadronicSubEvent->PushToStack(stackedTrack);
        }
    }

    void ProcessAll()
    {
        // Process all sub-events (potentially in parallel)
        if (fEMSubEvent->GetNTrack() > 0) {
            ProcessSubEvent(fEMSubEvent);
        }
        if (fHadronicSubEvent->GetNTrack() > 0) {
            ProcessSubEvent(fHadronicSubEvent);
        }
        if (fNeutronSubEvent->GetNTrack() > 0) {
            ProcessSubEvent(fNeutronSubEvent);
        }
    }

    void Cleanup()
    {
        fEMSubEvent->clearAndDestroy();
        fHadronicSubEvent->clearAndDestroy();
        fNeutronSubEvent->clearAndDestroy();

        delete fEMSubEvent;
        delete fHadronicSubEvent;
        delete fNeutronSubEvent;
    }

private:
    void SpawnSubEvent(G4SubEvent* subEvent)
    {
        // Send to worker thread for parallel processing
        G4cout << "Spawning sub-event type "
               << subEvent->GetSubEventType()
               << " with " << subEvent->GetNTrack() << " tracks"
               << G4endl;
        // ... parallel processing logic ...
    }

    void ProcessSubEvent(G4SubEvent* subEvent)
    {
        G4cout << "Processing sub-event type "
               << subEvent->GetSubEventType() << G4endl;

        while (subEvent->GetNTrack() > 0) {
            G4StackedTrack st = subEvent->PopFromStack();
            G4Track* track = st.GetTrack();

            // Process track...
            delete track;
            delete st.GetTrajectory();
        }
    }

    G4Event* fpEvent = nullptr;
    G4SubEvent* fEMSubEvent = nullptr;
    G4SubEvent* fHadronicSubEvent = nullptr;
    G4SubEvent* fNeutronSubEvent = nullptr;
};
```

### Example 3: Sub-Event Statistics and Monitoring

```cpp
class SubEventAnalyzer
{
public:
    void AnalyzeSubEvent(G4SubEvent* subEvent)
    {
        G4cout << "\n=== Sub-Event Analysis ===" << G4endl;
        G4cout << "Type: " << subEvent->GetSubEventType() << G4endl;
        G4cout << "Tracks: " << subEvent->GetNTrack()
               << "/" << subEvent->GetMaxNTrack() << G4endl;

        // Energy analysis
        G4double totalEnergy = subEvent->getTotalEnergy();
        G4cout << "Total energy: " << totalEnergy/GeV << " GeV" << G4endl;

        // Particle type distribution
        std::map<G4String, G4int> particleCounts;
        std::map<G4String, G4double> particleEnergies;

        // Extract all tracks (non-destructive)
        std::vector<G4StackedTrack> tempStorage;
        while (subEvent->GetNTrack() > 0) {
            G4StackedTrack st = subEvent->PopFromStack();
            G4Track* track = st.GetTrack();

            G4String name = track->GetDefinition()->GetParticleName();
            particleCounts[name]++;
            particleEnergies[name] += track->GetKineticEnergy();

            tempStorage.push_back(st);
        }

        // Print particle distribution
        G4cout << "\nParticle Distribution:" << G4endl;
        for (const auto& pair : particleCounts) {
            G4cout << "  " << pair.first << ": "
                   << pair.second << " tracks, "
                   << particleEnergies[pair.first]/MeV << " MeV"
                   << G4endl;
        }

        // Restore tracks
        for (const auto& st : tempStorage) {
            subEvent->PushToStack(st);
        }

        // Parent event info
        G4Event* parentEvent = subEvent->GetEvent();
        if (parentEvent) {
            G4cout << "\nParent Event ID: "
                   << parentEvent->GetEventID() << G4endl;
        }
    }
};
```

### Example 4: Capacity-Based Sub-Event Spawning

```cpp
class AutoSpawnSubEventManager
{
public:
    AutoSpawnSubEventManager(G4int type, std::size_t capacity)
        : fSubEventType(type), fCapacity(capacity)
    {
        CreateNewSubEvent();
    }

    void PushTrack(G4Track* track, G4Event* event)
    {
        // Check if current sub-event is full
        if (fCurrentSubEvent->GetNTrack() >= fCurrentSubEvent->GetMaxNTrack()) {
            G4cout << "Sub-event full, spawning for parallel processing"
                   << G4endl;

            // Spawn full sub-event
            SpawnSubEvent(fCurrentSubEvent);

            // Create new sub-event
            CreateNewSubEvent();
            fCurrentSubEvent->SetEvent(event);
        }

        // Push to current sub-event
        G4StackedTrack stackedTrack(track);
        fCurrentSubEvent->PushToStack(stackedTrack);
    }

    void Finalize()
    {
        // Spawn remaining sub-event if not empty
        if (fCurrentSubEvent->GetNTrack() > 0) {
            G4cout << "Spawning final sub-event with "
                   << fCurrentSubEvent->GetNTrack() << " tracks"
                   << G4endl;
            SpawnSubEvent(fCurrentSubEvent);
        } else {
            delete fCurrentSubEvent;
        }

        fCurrentSubEvent = nullptr;

        // Wait for all spawned sub-events to complete
        WaitForCompletion();
    }

    void PrintStatistics()
    {
        G4cout << "\n=== Sub-Event Statistics ===" << G4endl;
        G4cout << "Sub-events created: " << fSubEventsCreated << G4endl;
        G4cout << "Total tracks processed: " << fTotalTracks << G4endl;
        G4cout << "Average tracks per sub-event: "
               << (fTotalTracks / fSubEventsCreated) << G4endl;
    }

private:
    void CreateNewSubEvent()
    {
        fCurrentSubEvent = new G4SubEvent(fSubEventType, fCapacity);
        fSubEventsCreated++;
    }

    void SpawnSubEvent(G4SubEvent* subEvent)
    {
        fTotalTracks += subEvent->GetNTrack();
        fSpawnedSubEvents.push_back(subEvent);

        // Send to worker thread for parallel processing
        // ... parallel processing logic ...
    }

    void WaitForCompletion()
    {
        // Wait for all parallel sub-events to complete
        for (auto subEvent : fSpawnedSubEvents) {
            // ... wait logic ...
            subEvent->clearAndDestroy();
            delete subEvent;
        }
        fSpawnedSubEvents.clear();
    }

    G4int fSubEventType;
    std::size_t fCapacity;
    G4SubEvent* fCurrentSubEvent = nullptr;
    std::vector<G4SubEvent*> fSpawnedSubEvents;
    G4int fSubEventsCreated = 0;
    G4int fTotalTracks = 0;
};
```

## Integration with Stacking Action

```cpp
class ParallelStackingAction : public G4UserStackingAction
{
public:
    ParallelStackingAction()
    {
        // Register sub-event types
        // (Done via G4RunManager::RegisterSubEventType)
    }

    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override
    {
        G4ParticleDefinition* particle = track->GetDefinition();

        // Classify for sub-event parallel processing
        if (particle == G4Gamma::Definition() ||
            particle == G4Electron::Definition() ||
            particle == G4Positron::Definition()) {
            return fSubEvent_1;  // EM shower sub-event
        }

        if (particle == G4Neutron::Definition()) {
            return fSubEvent_2;  // Neutron cascade sub-event
        }

        if (particle->GetParticleType() == "nucleus" ||
            particle->GetParticleType() == "baryon") {
            return fSubEvent_3;  // Hadronic sub-event
        }

        return fUrgent;  // Sequential processing
    }
};
```

## Performance Characteristics

### Benefits
1. **Parallelism**: Multiple sub-events processed simultaneously
2. **Load Balancing**: Distribute work across worker threads
3. **Cache Efficiency**: Similar particles processed together
4. **Scalability**: Leverages multi-core processors

### Overhead
1. **Memory**: Additional containers and management structures
2. **Synchronization**: Thread coordination overhead
3. **Communication**: Data transfer between threads
4. **Complexity**: More complex code and debugging

### Best Practices
1. **Capacity Sizing**: Choose `maxEnt` based on typical shower size
2. **Type Selection**: Group similar particles for cache efficiency
3. **Balance**: Avoid creating too many small sub-events
4. **Monitoring**: Track sub-event creation and processing times

## Thread Safety

### Sub-Event Processing
- Each sub-event processed by single thread
- No concurrent access to same sub-event
- Parent event may have multiple sub-events in different threads

### Synchronization
- Sub-event creation and spawning must be thread-safe
- Results merging requires synchronization
- Parent event access needs protection

## See Also

- [G4SubEventTrackStack](g4subeventtrackstack.md) - Sub-event track stack manager
- [G4Event](g4event.md) - Parent event class
- [G4StackedTrack](g4stackedtrack.md) - Track wrapper
- [G4StackManager](g4stackmanager.md) - Stack management with sub-event support
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4SubEvent.hh`
- Source: `source/event/src/G4SubEvent.cc`
:::
