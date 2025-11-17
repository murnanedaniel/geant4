# G4SubEventTrackStack API Documentation

## Overview

`G4SubEventTrackStack` is a specialized stack manager for organizing tracks into sub-events for parallel processing. Unlike regular track stacks that hold individual tracks, this class manages the creation, filling, and release of `G4SubEvent` objects, automatically spawning new sub-events when capacity limits are reached.

This class bridges the gap between the stacking mechanism and the sub-event parallelism framework, enabling efficient batching of tracks for parallel worker threads.

::: tip Header File
**Location:** `source/event/include/G4SubEventTrackStack.hh`
:::

::: warning Advanced Feature
Sub-event track stacks are part of the advanced sub-event parallelism feature. Most users should use standard stacking mechanisms.
:::

## Class Declaration

`source/event/include/G4SubEventTrackStack.hh:42-79`

```cpp
class G4SubEventTrackStack
{
  public:
    G4SubEventTrackStack() = default;
    explicit G4SubEventTrackStack(G4int ty, std::size_t maxEnt);
   ~G4SubEventTrackStack();

    G4SubEventTrackStack& operator=(const G4SubEventTrackStack&) = delete;
    G4bool operator==(const G4SubEventTrackStack&) const = delete;
    G4bool operator!=(const G4SubEventTrackStack&) const = delete;

    void PushToStack(const G4StackedTrack& aStackedTrack);
    void ReleaseSubEvent();

    void PrepareNewEvent(G4Event* ev);
    void clearAndDestroy();

    inline G4int GetSubEventType() const;
    inline G4int GetNTrack() const;
    inline std::size_t GetMaxNTrack() const;
    inline void SetVerboseLevel(G4int val);

  private:
    G4int fSubEventType = -1;
    std::size_t fMaxEnt = 1000;
    G4SubEvent* fCurrentSE = nullptr;
    G4Event* fCurrentEvent = nullptr;
    G4int verboseLevel = 0;
};
```

## Constructors and Destructor

### Default Constructor
`source/event/include/G4SubEventTrackStack.hh:46`

```cpp
G4SubEventTrackStack() = default;
```

**Purpose:** Create empty sub-event stack with default values

**Default Values:**
- `fSubEventType` = -1 (invalid)
- `fMaxEnt` = 1000
- `fCurrentSE` = nullptr
- `verboseLevel` = 0

### Parametrized Constructor
`source/event/include/G4SubEventTrackStack.hh:47-48`

```cpp
explicit G4SubEventTrackStack(G4int ty, std::size_t maxEnt)
  : fSubEventType(ty), fMaxEnt(maxEnt)
{}
```

**Parameters:**
- `ty`: Sub-event type ID (100-115 for fSubEvent_0 to fSubEvent_F)
- `maxEnt`: Maximum tracks per sub-event

**Example:**
```cpp
// Create stack for EM shower sub-events
// Each sub-event holds up to 1000 tracks
G4SubEventTrackStack* emStack =
    new G4SubEventTrackStack(fSubEvent_1, 1000);

// Create stack for hadronic cascade sub-events
// Each sub-event holds up to 500 tracks
G4SubEventTrackStack* hadronicStack =
    new G4SubEventTrackStack(fSubEvent_2, 500);
```

**Usage Pattern:**
```cpp
// In G4StackManager initialization
void G4StackManager::RegisterSubEventType(G4int ty, G4int maxEnt)
{
    // Create sub-event track stack
    G4SubEventTrackStack* stack =
        new G4SubEventTrackStack(ty, maxEnt);

    // Store in map
    subEvtStackMap[ty] = stack;
}
```

### Destructor
`source/event/include/G4SubEventTrackStack.hh:49`

```cpp
~G4SubEventTrackStack();
```

**Behavior:**
- Deletes current sub-event if exists
- Does NOT delete tracks (tracks owned by sub-events)
- Use `clearAndDestroy()` before destruction to clean up

## Core Operations

### PushToStack()
`source/event/include/G4SubEventTrackStack.hh:55`

```cpp
void PushToStack(const G4StackedTrack& aStackedTrack);
```

**Parameters:**
- `aStackedTrack`: Track to add to current sub-event

**Behavior:**
1. If no current sub-event exists, create one
2. Push track to current sub-event
3. If sub-event reaches capacity (`fMaxEnt`):
   - Release current sub-event for processing
   - Create new sub-event for subsequent tracks

**Automatic Sub-Event Management:**
```cpp
// Conceptual implementation
void G4SubEventTrackStack::PushToStack(const G4StackedTrack& st)
{
    // Create sub-event if needed
    if (fCurrentSE == nullptr) {
        fCurrentSE = new G4SubEvent(fSubEventType, fMaxEnt);
        fCurrentSE->SetEvent(fCurrentEvent);
    }

    // Push track to current sub-event
    fCurrentSE->PushToStack(st);

    // Release if full
    if (fCurrentSE->GetNTrack() >= fCurrentSE->GetMaxNTrack()) {
        ReleaseSubEvent();
    }
}
```

**Example Usage:**
```cpp
G4SubEventTrackStack stack(fSubEvent_1, 1000);

// Push tracks - sub-events automatically spawned
for (auto track : emShowerTracks) {
    G4StackedTrack stackedTrack(track);
    stack.PushToStack(stackedTrack);

    // Sub-event automatically released and new one created
    // when 1000 tracks accumulated
}
```

### ReleaseSubEvent()
`source/event/include/G4SubEventTrackStack.hh:56`

```cpp
void ReleaseSubEvent();
```

**Purpose:** Release current sub-event for parallel processing

**Behavior:**
1. Send current sub-event to event for worker thread processing
2. Create new empty sub-event
3. Increment sub-event counter

**When Called:**
- Automatically when sub-event reaches capacity in `PushToStack()`
- Manually at end of event via `PrepareNewEvent()`

**Example:**
```cpp
void G4SubEventTrackStack::ReleaseSubEvent()
{
    if (fCurrentSE == nullptr) return;

    if (fCurrentSE->GetNTrack() > 0) {
        if (verboseLevel > 0) {
            G4cout << "Releasing sub-event type " << fSubEventType
                   << " with " << fCurrentSE->GetNTrack() << " tracks"
                   << G4endl;
        }

        // Send to parent event for parallel processing
        fCurrentEvent->SpawnSubEvent(fCurrentSE);
    } else {
        // Empty sub-event - delete it
        delete fCurrentSE;
    }

    // Create new sub-event for next batch
    fCurrentSE = new G4SubEvent(fSubEventType, fMaxEnt);
    fCurrentSE->SetEvent(fCurrentEvent);
}
```

## Event Management

### PrepareNewEvent()
`source/event/include/G4SubEventTrackStack.hh:59`

```cpp
void PrepareNewEvent(G4Event* ev);
```

**Parameters:**
- `ev`: Pointer to the new event being prepared

**Behavior:**
1. Release any remaining sub-event from previous event
2. Set current event pointer
3. Prepare for new event processing

**Example:**
```cpp
// At start of new event
void G4StackManager::PrepareNewEvent(G4Event* event)
{
    // Prepare all sub-event stacks
    for (auto& pair : subEvtStackMap) {
        G4SubEventTrackStack* stack = pair.second;
        stack->PrepareNewEvent(event);
    }

    // ... other preparation ...
}
```

**Typical Flow:**
```cpp
void G4SubEventTrackStack::PrepareNewEvent(G4Event* ev)
{
    // Release remaining tracks from previous event
    if (fCurrentSE != nullptr && fCurrentSE->GetNTrack() > 0) {
        ReleaseSubEvent();
    }

    // Set new event
    fCurrentEvent = ev;

    // Create fresh sub-event
    if (fCurrentSE == nullptr) {
        fCurrentSE = new G4SubEvent(fSubEventType, fMaxEnt);
        fCurrentSE->SetEvent(fCurrentEvent);
    }
}
```

### clearAndDestroy()
`source/event/include/G4SubEventTrackStack.hh:60`

```cpp
void clearAndDestroy();
```

**Purpose:** Delete current sub-event and all its tracks

**Behavior:**
- Calls `clearAndDestroy()` on current sub-event
- Deletes sub-event object
- Resets pointer to nullptr

**Example:**
```cpp
// Emergency cleanup or event abortion
void AbortEvent()
{
    for (auto& pair : subEvtStackMap) {
        G4SubEventTrackStack* stack = pair.second;
        stack->clearAndDestroy();
    }
}
```

## Query Methods

### GetSubEventType()
`source/event/include/G4SubEventTrackStack.hh:62`

```cpp
inline G4int GetSubEventType() const { return fSubEventType; }
```

**Returns:** Sub-event type ID for this stack

**Example:**
```cpp
G4int type = stack->GetSubEventType();

if (type == fSubEvent_1) {
    G4cout << "EM shower stack" << G4endl;
} else if (type == fSubEvent_2) {
    G4cout << "Hadronic cascade stack" << G4endl;
}
```

### GetNTrack()
`source/event/include/G4SubEventTrackStack.hh:63-67`

```cpp
inline G4int GetNTrack() const
{
    if (fCurrentSE == nullptr) return 0;
    return (G4int)fCurrentSE->size();
}
```

**Returns:** Number of tracks in current sub-event (0 if no current sub-event)

**Example:**
```cpp
G4int nTracks = stack->GetNTrack();

if (nTracks > 0) {
    G4cout << "Current sub-event has " << nTracks << " tracks"
           << G4endl;
}

// Check if close to capacity
if (nTracks > 0.9 * stack->GetMaxNTrack()) {
    G4cout << "Sub-event almost full, will release soon" << G4endl;
}
```

### GetMaxNTrack()
`source/event/include/G4SubEventTrackStack.hh:68`

```cpp
inline std::size_t GetMaxNTrack() const { return fMaxEnt; }
```

**Returns:** Maximum capacity per sub-event

**Example:**
```cpp
std::size_t capacity = stack->GetMaxNTrack();
G4int current = stack->GetNTrack();

G4cout << "Sub-event capacity: " << current << "/" << capacity
       << " (" << (100.0*current/capacity) << "%)" << G4endl;
```

### SetVerboseLevel()
`source/event/include/G4SubEventTrackStack.hh:69`

```cpp
inline void SetVerboseLevel(G4int val) { verboseLevel = val; }
```

**Parameters:**
- `val`: Verbosity level (0 = quiet, higher = more verbose)

**Example:**
```cpp
// Enable detailed logging
stack->SetVerboseLevel(2);

// Now PushToStack and ReleaseSubEvent will print detailed info
```

## Complete Examples

### Example 1: Basic Sub-Event Stack Setup

```cpp
class SubEventStackManager
{
public:
    void Initialize()
    {
        // Create sub-event stacks for different particle types

        // EM shower: frequent, many tracks
        fEMStack = new G4SubEventTrackStack(fSubEvent_1, 1000);
        fEMStack->SetVerboseLevel(1);

        // Hadronic cascade: less frequent, fewer tracks
        fHadronicStack = new G4SubEventTrackStack(fSubEvent_2, 500);
        fHadronicStack->SetVerboseLevel(1);

        // Neutron transport: very frequent, many tracks
        fNeutronStack = new G4SubEventTrackStack(fSubEvent_3, 2000);
        fNeutronStack->SetVerboseLevel(0);  // Quiet - too many
    }

    void PrepareNewEvent(G4Event* event)
    {
        fEMStack->PrepareNewEvent(event);
        fHadronicStack->PrepareNewEvent(event);
        fNeutronStack->PrepareNewEvent(event);

        G4cout << "Prepared sub-event stacks for event "
               << event->GetEventID() << G4endl;
    }

    void PushTrack(const G4StackedTrack& st)
    {
        G4Track* track = st.GetTrack();
        G4ParticleDefinition* particle = track->GetDefinition();

        // Route to appropriate stack
        if (particle == G4Gamma::Definition() ||
            particle == G4Electron::Definition() ||
            particle == G4Positron::Definition()) {
            fEMStack->PushToStack(st);
        }
        else if (particle == G4Neutron::Definition()) {
            fNeutronStack->PushToStack(st);
        }
        else {
            fHadronicStack->PushToStack(st);
        }
    }

    void PrintStatistics()
    {
        G4cout << "\nSub-Event Stack Statistics:" << G4endl;
        G4cout << "  EM stack: " << fEMStack->GetNTrack()
               << "/" << fEMStack->GetMaxNTrack() << G4endl;
        G4cout << "  Hadronic stack: " << fHadronicStack->GetNTrack()
               << "/" << fHadronicStack->GetMaxNTrack() << G4endl;
        G4cout << "  Neutron stack: " << fNeutronStack->GetNTrack()
               << "/" << fNeutronStack->GetMaxNTrack() << G4endl;
    }

private:
    G4SubEventTrackStack* fEMStack = nullptr;
    G4SubEventTrackStack* fHadronicStack = nullptr;
    G4SubEventTrackStack* fNeutronStack = nullptr;
};
```

### Example 2: Integration with G4StackManager

```cpp
// In G4StackManager

void G4StackManager::RegisterSubEventType(G4int ty, G4int maxEnt)
{
    // Create sub-event track stack
    G4SubEventTrackStack* stack =
        new G4SubEventTrackStack(ty, maxEnt);

    stack->SetVerboseLevel(verboseLevel);

    // Store in map
    subEvtStackMap[ty] = stack;
    subEvtTypes.push_back(ty);

    if (verboseLevel > 0) {
        G4cout << "Registered sub-event type " << ty
               << " with capacity " << maxEnt << G4endl;
    }
}

G4int G4StackManager::PushOneTrack(G4Track* track,
                                   G4VTrajectory* traj)
{
    // Get classification from user
    G4ClassificationOfNewTrack classification =
        userStackingAction->ClassifyNewTrack(track);

    // Check if it's a sub-event classification
    if (classification >= fSubEvent_0 && classification <= fSubEvent_F) {
        G4int seType = classification;

        // Find corresponding stack
        auto it = subEvtStackMap.find(seType);
        if (it != subEvtStackMap.end()) {
            G4SubEventTrackStack* stack = it->second;

            // Push to sub-event stack
            G4StackedTrack st(track, traj);
            stack->PushToStack(st);

            return seType;  // Return sub-event type
        } else {
            G4Exception("G4StackManager::PushOneTrack",
                       "Event0102", FatalException,
                       "Sub-event type not registered");
        }
    }

    // ... handle other classifications ...
}

void G4StackManager::PrepareNewEvent(G4Event* event)
{
    // Prepare all sub-event stacks
    for (auto& pair : subEvtStackMap) {
        G4SubEventTrackStack* stack = pair.second;
        stack->PrepareNewEvent(event);
    }

    // ... other preparation ...
}
```

### Example 3: Monitoring and Optimization

```cpp
class SubEventStackMonitor
{
public:
    void MonitorStack(G4SubEventTrackStack* stack, const G4String& name)
    {
        G4int nTracks = stack->GetNTrack();
        std::size_t capacity = stack->GetMaxNTrack();

        fStats[name].pushes++;
        fStats[name].totalTracks += nTracks;

        if (nTracks > fStats[name].maxTracks) {
            fStats[name].maxTracks = nTracks;
        }

        // Check efficiency
        G4double fillRatio = static_cast<G4double>(nTracks) / capacity;

        if (fillRatio < 0.5 && nTracks > 0) {
            fStats[name].lowEfficiency++;

            if (verboseLevel > 1) {
                G4cout << "WARNING: " << name << " sub-event stack "
                       << "has low fill ratio: " << (fillRatio*100)
                       << "%" << G4endl;
            }
        }
    }

    void PrintReport()
    {
        G4cout << "\n=== Sub-Event Stack Monitor Report ===" << G4endl;

        for (const auto& pair : fStats) {
            const G4String& name = pair.first;
            const StackStats& stats = pair.second;

            G4cout << "\n" << name << ":" << G4endl;
            G4cout << "  Total pushes: " << stats.pushes << G4endl;
            G4cout << "  Total tracks: " << stats.totalTracks << G4endl;
            G4cout << "  Max tracks in sub-event: " << stats.maxTracks
                   << G4endl;
            G4cout << "  Average tracks per sub-event: "
                   << (stats.totalTracks / stats.pushes) << G4endl;
            G4cout << "  Low efficiency spawns: "
                   << stats.lowEfficiency << G4endl;

            // Recommendations
            if (stats.lowEfficiency > stats.pushes * 0.3) {
                G4cout << "  RECOMMENDATION: Reduce capacity to improve"
                       << " parallelism efficiency" << G4endl;
            }
        }
    }

private:
    struct StackStats {
        G4int pushes = 0;
        G4int totalTracks = 0;
        G4int maxTracks = 0;
        G4int lowEfficiency = 0;
    };

    std::map<G4String, StackStats> fStats;
    G4int verboseLevel = 0;
};
```

### Example 4: Dynamic Capacity Adjustment

```cpp
class AdaptiveSubEventStack
{
public:
    AdaptiveSubEventStack(G4int type, std::size_t initialCapacity)
        : fType(type), fBaseCapacity(initialCapacity)
    {
        fStack = new G4SubEventTrackStack(type, initialCapacity);
    }

    void PushTrack(const G4StackedTrack& st)
    {
        fStack->PushToStack(st);
        fTotalPushes++;

        // Monitor release frequency
        G4int currentTracks = fStack->GetNTrack();
        if (currentTracks == 0) {
            // Just released a sub-event
            fReleaseCount++;

            // Analyze efficiency
            if (fReleaseCount % 10 == 0) {
                AnalyzeAndAdjust();
            }
        }
    }

    void PrepareNewEvent(G4Event* event)
    {
        fStack->PrepareNewEvent(event);
        fEventCount++;
    }

private:
    void AnalyzeAndAdjust()
    {
        G4double avgPushesPerRelease =
            static_cast<G4double>(fTotalPushes) / fReleaseCount;

        std::size_t currentCapacity = fStack->GetMaxNTrack();

        G4cout << "Analysis after " << fReleaseCount << " releases:"
               << G4endl;
        G4cout << "  Average pushes per release: "
               << avgPushesPerRelease << G4endl;
        G4cout << "  Current capacity: " << currentCapacity << G4endl;

        // Adjust capacity based on actual usage
        std::size_t newCapacity = currentCapacity;

        if (avgPushesPerRelease < currentCapacity * 0.5) {
            // Under-utilized - reduce capacity
            newCapacity = static_cast<std::size_t>(avgPushesPerRelease * 1.2);
            G4cout << "  RECOMMENDATION: Reduce capacity to "
                   << newCapacity << G4endl;
        }
        else if (avgPushesPerRelease > currentCapacity * 0.95) {
            // Over-utilized - increase capacity
            newCapacity = static_cast<std::size_t>(avgPushesPerRelease * 1.5);
            G4cout << "  RECOMMENDATION: Increase capacity to "
                   << newCapacity << G4endl;
        }

        // In production code, would recreate stack with new capacity
    }

    G4int fType;
    std::size_t fBaseCapacity;
    G4SubEventTrackStack* fStack;
    G4int fTotalPushes = 0;
    G4int fReleaseCount = 0;
    G4int fEventCount = 0;
};
```

## Performance Considerations

### Capacity Selection
- **Too Small**: Frequent sub-event releases, overhead
- **Too Large**: Delayed parallelism, memory waste
- **Optimal**: Release sub-events when ~1000-2000 tracks accumulated

### Particle Type Grouping
- Group similar particles for cache efficiency
- Separate particle types that have different processing characteristics
- Balance parallelism opportunities with overhead

### Release Strategy
- Automatic release on capacity ensures bounded memory
- Manual release at event end ensures all tracks processed
- Monitor fill ratios to optimize capacity

## Thread Safety

### Single-Threaded Creation
- Sub-event stacks created and managed by master/worker thread
- Each stack operates within single thread context

### Sub-Event Release
- Released sub-events sent to worker threads
- No concurrent access to same sub-event
- Thread-safe passing via event's sub-event container

## Common Pitfalls

### Pitfall 1: Not Releasing Remaining Tracks
```cpp
// WRONG - Tracks left in stack
~G4SubEventTrackStack() {
    delete fCurrentSE;  // Tracks lost!
}

// CORRECT - Release or destroy first
void PrepareNewEvent(G4Event* event) {
    if (fCurrentSE && fCurrentSE->GetNTrack() > 0) {
        ReleaseSubEvent();  // Release remaining tracks
    }
    // ... continue ...
}
```

### Pitfall 2: Incorrect Capacity
```cpp
// BAD - Capacity too small, excessive releases
G4SubEventTrackStack stack(fSubEvent_1, 10);  // Only 10 tracks!

// GOOD - Reasonable capacity
G4SubEventTrackStack stack(fSubEvent_1, 1000);  // ~1000 tracks
```

### Pitfall 3: Not Registering Sub-Event Type
```cpp
// WRONG - Stack created but type not registered
auto stack = new G4SubEventTrackStack(fSubEvent_5, 1000);

// CORRECT - Register via G4RunManager
runManager->RegisterSubEventType(fSubEvent_5, 1000);
// This creates the stack properly
```

## See Also

- [G4SubEvent](g4subevent.md) - Sub-event container
- [G4StackManager](g4stackmanager.md) - Main stack manager with sub-event support
- [G4Event](g4event.md) - Parent event class
- [G4StackedTrack](g4stackedtrack.md) - Track wrapper
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4SubEventTrackStack.hh`
- Source: `source/event/src/G4SubEventTrackStack.cc`
:::
