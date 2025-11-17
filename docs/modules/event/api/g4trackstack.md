# G4TrackStack API Documentation

## Overview

`G4TrackStack` is a LIFO (Last-In-First-Out) stack container for managing `G4StackedTrack` objects during event processing. It is implemented as a specialized `std::vector<G4StackedTrack>` with additional functionality for track stacking, transfer operations, and performance monitoring.

This class is used internally by `G4StackManager` to implement the urgent, waiting, and postpone stacks. The LIFO behavior ensures that the most recently added track is processed first, which is important for depth-first event processing.

::: tip Header File
**Location:** `source/event/include/G4TrackStack.hh`
:::

## Class Declaration

`source/event/include/G4TrackStack.hh:44-85`

```cpp
class G4TrackStack : public std::vector<G4StackedTrack>
{
  public:
    G4TrackStack() = default;
    explicit G4TrackStack(std::size_t n);
   ~G4TrackStack();

    G4TrackStack& operator=(const G4TrackStack&) = delete;
    G4bool operator==(const G4TrackStack&) const = delete;
    G4bool operator!=(const G4TrackStack&) const = delete;

    inline void PushToStack(const G4StackedTrack& aStackedTrack);
    inline G4StackedTrack PopFromStack();
    void TransferTo(G4TrackStack* aStack);
    void TransferTo(G4SmartTrackStack* aStack);

    void clearAndDestroy();

    inline std::size_t GetNTrack() const;
    inline std::size_t GetMaxNTrack() const;
    inline G4int GetSafetyValue1() const;
    inline G4int GetSafetyValue2() const;
    inline G4int GetNStick() const;

    G4double getTotalEnergy() const;
    inline void SetSafetyValue2(G4int x);
};
```

::: info Inheritance
`G4TrackStack` inherits from `std::vector<G4StackedTrack>`, providing all standard vector operations plus specialized stacking methods.
:::

## Constructors and Destructor

### Default Constructor
`source/event/include/G4TrackStack.hh:48`

```cpp
G4TrackStack() = default;
```

**Purpose:** Creates empty stack with default capacity

**Usage:**
```cpp
G4TrackStack urgentStack;  // Empty stack
```

### Capacity Constructor
`source/event/include/G4TrackStack.hh:49-51`

```cpp
explicit G4TrackStack(std::size_t n)
  : safetyValue1(G4int(4*n/5)),
    safetyValue2(G4int(4*n/5-100)),
    nstick(100)
{
    reserve(n);
}
```

**Parameters:**
- `n`: Initial capacity to reserve

**Behavior:**
- Reserves memory for `n` tracks
- Sets `safetyValue1` = 80% of capacity
- Sets `safetyValue2` = 80% of capacity - 100
- Sets `nstick` = 100

**Usage:**
```cpp
// Pre-allocate for expected track count
G4TrackStack waitingStack(10000);  // Reserve space for 10k tracks
```

::: tip Performance
Pre-allocating capacity avoids multiple reallocations as stack grows, improving performance for events with many secondaries.
:::

### Destructor
`source/event/include/G4TrackStack.hh:52`

```cpp
~G4TrackStack();
```

**Behavior:**
- Clears the vector
- Does NOT delete tracks or trajectories (caller's responsibility)
- Use `clearAndDestroy()` to delete tracks before destruction

**Example:**
```cpp
{
    G4TrackStack stack;
    // ... use stack ...
    stack.clearAndDestroy();  // Clean up tracks before destructor
}  // Destructor called - stack structure destroyed
```

## Stack Operations

### PushToStack()
`source/event/include/G4TrackStack.hh:58-62`

```cpp
inline void PushToStack(const G4StackedTrack& aStackedTrack)
{
    push_back(aStackedTrack);
    if(size() > maxEntry) maxEntry = size();
}
```

**Parameters:**
- `aStackedTrack`: Track to push onto stack

**Behavior:**
- Adds track to end of vector (LIFO top)
- Updates maximum stack size if current size exceeds previous max
- Automatically grows vector capacity if needed

**Usage:**
```cpp
G4Track* track = new G4Track(particle, time, position);
G4VTrajectory* trajectory = nullptr;  // Optional

G4StackedTrack stackedTrack(track, trajectory);
urgentStack.PushToStack(stackedTrack);

G4cout << "Stack now has " << urgentStack.GetNTrack()
       << " tracks" << G4endl;
```

**Example: Batch Pushing**
```cpp
void PushSecondaries(G4TrackStack& stack,
                     const G4TrackVector* secondaries)
{
    if (secondaries == nullptr) return;

    for (auto track : *secondaries) {
        G4StackedTrack stackedTrack(track);
        stack.PushToStack(stackedTrack);
    }

    G4cout << "Pushed " << secondaries->size()
           << " secondaries to stack" << G4endl;
}
```

### PopFromStack()
`source/event/include/G4TrackStack.hh:63-64`

```cpp
inline G4StackedTrack PopFromStack()
{
    G4StackedTrack st = back();
    pop_back();
    return st;
}
```

**Returns:** `G4StackedTrack` from top of stack (most recently pushed)

**Behavior:**
- Retrieves last element (LIFO order)
- Removes element from stack
- Decrements size by 1

**Usage:**
```cpp
if (urgentStack.GetNTrack() > 0) {
    G4StackedTrack stackedTrack = urgentStack.PopFromStack();

    G4Track* track = stackedTrack.GetTrack();
    G4VTrajectory* trajectory = stackedTrack.GetTrajectory();

    // Process track
    trackingManager->ProcessOneTrack(track);

    // Clean up
    delete track;
    delete trajectory;
}
```

::: warning Empty Stack
Calling `PopFromStack()` on empty stack causes undefined behavior. Always check `GetNTrack() > 0` first.
:::

**Example: Processing All Tracks**
```cpp
void ProcessAllTracks(G4TrackStack& stack)
{
    G4int tracksProcessed = 0;

    while (stack.GetNTrack() > 0) {
        G4StackedTrack stackedTrack = stack.PopFromStack();
        G4Track* track = stackedTrack.GetTrack();

        G4cout << "Processing track " << track->GetTrackID()
               << " (energy: " << track->GetKineticEnergy()/MeV
               << " MeV)" << G4endl;

        // Process track...
        tracksProcessed++;

        delete track;
        delete stackedTrack.GetTrajectory();
    }

    G4cout << "Processed " << tracksProcessed << " tracks" << G4endl;
}
```

## Transfer Operations

### TransferTo(G4TrackStack*)
`source/event/include/G4TrackStack.hh:65`

```cpp
void TransferTo(G4TrackStack* aStack);
```

**Parameters:**
- `aStack`: Destination track stack

**Behavior:**
- Moves all tracks from this stack to destination stack
- Preserves LIFO order
- Clears this stack after transfer
- Destination need not be empty

**Usage:**
```cpp
// Transfer waiting stack to urgent stack
waitingStack.TransferTo(&urgentStack);

G4cout << "Transferred " << urgentStack.GetNTrack()
       << " tracks to urgent stack" << G4endl;
G4cout << "Waiting stack now has " << waitingStack.GetNTrack()
       << " tracks" << G4endl;  // Should be 0
```

**Example: Stage Transition**
```cpp
void MyStackingAction::NewStage()
{
    G4StackManager* stackManager = G4EventManager::GetEventManager()
                                      ->GetStackManager();

    G4cout << "=== New Stage ===" << G4endl;
    G4cout << "Urgent stack empty - transferring waiting tracks"
           << G4endl;

    // Framework automatically transfers waiting to urgent
    // User can monitor or customize the transition here
}
```

### TransferTo(G4SmartTrackStack*)
`source/event/include/G4TrackStack.hh:66`

```cpp
void TransferTo(G4SmartTrackStack* aStack);
```

**Parameters:**
- `aStack`: Destination smart track stack

**Behavior:**
- Moves all tracks from this stack to smart stack
- Smart stack may reorganize tracks by particle type
- Clears this stack after transfer

**Usage:**
```cpp
G4TrackStack regularStack;
G4SmartTrackStack* smartStack = new G4SmartTrackStack();

// Fill regular stack...

// Transfer to smart stack for optimized processing
regularStack.TransferTo(smartStack);
```

::: info Smart Stack
`G4SmartTrackStack` organizes tracks by particle type for better cache performance. See [G4SmartTrackStack](g4smarttrackstack.md).
:::

## Stack Management

### clearAndDestroy()
`source/event/include/G4TrackStack.hh:68`

```cpp
void clearAndDestroy();
```

**Purpose:** Delete all tracks and trajectories, then clear stack

**Behavior:**
- Iterates through all `G4StackedTrack` objects
- Deletes associated `G4Track` and `G4VTrajectory` objects
- Clears the vector

**Usage:**
```cpp
// At end of event - clean up postpone stack
postponeStack.clearAndDestroy();
```

::: warning Use Carefully
Only call when you own the tracks. Do not call if tracks have been transferred elsewhere.
:::

**Example: Event Abortion**
```cpp
void MyStackingAction::AbortEvent()
{
    G4StackManager* stackManager = GetStackManager();

    // Get direct access to stacks and destroy all tracks
    stackManager->ClearUrgentStack();
    stackManager->ClearWaitingStack();
    stackManager->ClearPostponeStack();

    G4cout << "Event aborted - all stacks cleared" << G4endl;
}
```

## Query Methods

### GetNTrack()
`source/event/include/G4TrackStack.hh:70`

```cpp
inline std::size_t GetNTrack() const { return size(); }
```

**Returns:** Current number of tracks in stack

**Usage:**
```cpp
if (urgentStack.GetNTrack() == 0) {
    G4cout << "Urgent stack is empty" << G4endl;

    if (waitingStack.GetNTrack() > 0) {
        G4cout << "Transferring " << waitingStack.GetNTrack()
               << " tracks from waiting stack" << G4endl;
        waitingStack.TransferTo(&urgentStack);
    }
}
```

### GetMaxNTrack()
`source/event/include/G4TrackStack.hh:71`

```cpp
inline std::size_t GetMaxNTrack() const { return maxEntry; }
```

**Returns:** Maximum number of tracks stack has held

**Purpose:** Performance monitoring and statistics

**Usage:**
```cpp
void MyEventAction::EndOfEventAction(const G4Event* event)
{
    G4StackManager* stackManager = G4EventManager::GetEventManager()
                                      ->GetStackManager();

    G4cout << "Stack Statistics:" << G4endl;
    G4cout << "  Max urgent tracks: "
           << stackManager->GetNUrgentTrack() << G4endl;
    G4cout << "  Max waiting tracks: "
           << stackManager->GetNWaitingTrack() << G4endl;
}
```

### GetSafetyValue1()
`source/event/include/G4TrackStack.hh:72`

```cpp
inline G4int GetSafetyValue1() const { return safetyValue1; }
```

**Returns:** First safety threshold (80% of initial capacity)

**Purpose:** Internal use for stack optimization

### GetSafetyValue2()
`source/event/include/G4TrackStack.hh:73`

```cpp
inline G4int GetSafetyValue2() const { return safetyValue2; }
```

**Returns:** Second safety threshold (80% of capacity - 100)

**Purpose:** Internal use for stack optimization

### SetSafetyValue2()
`source/event/include/G4TrackStack.hh:77`

```cpp
inline void SetSafetyValue2(G4int x) { safetyValue2 = x < 0 ? 0 : x; }
```

**Parameters:**
- `x`: New safety value 2 (clamped to minimum of 0)

**Purpose:** Adjust safety threshold for stack optimization

### GetNStick()
`source/event/include/G4TrackStack.hh:74`

```cpp
inline G4int GetNStick() const { return nstick; }
```

**Returns:** Number of tracks to "stick" together for processing

**Purpose:** Used by smart stack for batch processing optimization

### getTotalEnergy()
`source/event/include/G4TrackStack.hh:76`

```cpp
G4double getTotalEnergy() const;
```

**Returns:** Sum of kinetic energies of all tracks in stack

**Purpose:** Energy balance monitoring and debugging

**Usage:**
```cpp
G4double urgentEnergy = urgentStack.getTotalEnergy();
G4double waitingEnergy = waitingStack.getTotalEnergy();
G4double totalEnergy = urgentEnergy + waitingEnergy;

G4cout << "Energy in stacks:" << G4endl;
G4cout << "  Urgent:  " << urgentEnergy/GeV << " GeV" << G4endl;
G4cout << "  Waiting: " << waitingEnergy/GeV << " GeV" << G4endl;
G4cout << "  Total:   " << totalEnergy/GeV << " GeV" << G4endl;
```

## Complete Examples

### Example 1: Basic Stack Usage

```cpp
void DemonstrateBasicStack()
{
    G4TrackStack stack;

    // Create and push tracks
    for (G4int i = 0; i < 5; ++i) {
        G4Track* track = CreateTrack(i);  // Helper function
        G4StackedTrack stackedTrack(track);
        stack.PushToStack(stackedTrack);
    }

    G4cout << "Pushed 5 tracks. Stack size: "
           << stack.GetNTrack() << G4endl;

    // Pop and process (LIFO order - last in, first out)
    while (stack.GetNTrack() > 0) {
        G4StackedTrack stackedTrack = stack.PopFromStack();
        G4Track* track = stackedTrack.GetTrack();

        G4cout << "Processing track " << track->GetTrackID()
               << G4endl;

        delete track;
    }

    G4cout << "Max stack size was: " << stack.GetMaxNTrack()
           << G4endl;
}
```

### Example 2: Energy-Based Stack Management

```cpp
class EnergyMonitoringStack
{
public:
    void PushTrack(G4Track* track)
    {
        G4StackedTrack stackedTrack(track);
        fStack.PushToStack(stackedTrack);

        // Monitor energy
        G4double energy = track->GetKineticEnergy();
        fTotalPushedEnergy += energy;

        G4cout << "Pushed track: " << energy/MeV << " MeV"
               << " (total: " << fStack.getTotalEnergy()/MeV
               << " MeV)" << G4endl;
    }

    G4Track* PopTrack()
    {
        if (fStack.GetNTrack() == 0) return nullptr;

        G4StackedTrack stackedTrack = fStack.PopFromStack();
        G4Track* track = stackedTrack.GetTrack();

        G4double energy = track->GetKineticEnergy();
        fTotalPoppedEnergy += energy;

        return track;
    }

    void PrintStatistics()
    {
        G4cout << "=== Stack Energy Statistics ===" << G4endl;
        G4cout << "Total pushed:  " << fTotalPushedEnergy/GeV
               << " GeV" << G4endl;
        G4cout << "Total popped:  " << fTotalPoppedEnergy/GeV
               << " GeV" << G4endl;
        G4cout << "Remaining:     " << fStack.getTotalEnergy()/GeV
               << " GeV" << G4endl;
    }

private:
    G4TrackStack fStack;
    G4double fTotalPushedEnergy = 0.0;
    G4double fTotalPoppedEnergy = 0.0;
};
```

### Example 3: Multi-Stack System

```cpp
class MultiStackSystem
{
public:
    void ClassifyAndPush(G4Track* track)
    {
        G4StackedTrack stackedTrack(track);
        G4double energy = track->GetKineticEnergy();

        // Energy-based classification
        if (energy > 1*GeV) {
            fHighEnergyStack.PushToStack(stackedTrack);
        } else if (energy > 100*MeV) {
            fMediumEnergyStack.PushToStack(stackedTrack);
        } else {
            fLowEnergyStack.PushToStack(stackedTrack);
        }
    }

    G4Track* GetNextTrack()
    {
        // Process high energy first
        if (fHighEnergyStack.GetNTrack() > 0) {
            return fHighEnergyStack.PopFromStack().GetTrack();
        }

        // Then medium energy
        if (fMediumEnergyStack.GetNTrack() > 0) {
            return fMediumEnergyStack.PopFromStack().GetTrack();
        }

        // Finally low energy
        if (fLowEnergyStack.GetNTrack() > 0) {
            return fLowEnergyStack.PopFromStack().GetTrack();
        }

        return nullptr;
    }

    void ConsolidateStacks()
    {
        // Merge all into one stack
        G4TrackStack consolidatedStack;

        fHighEnergyStack.TransferTo(&consolidatedStack);
        fMediumEnergyStack.TransferTo(&consolidatedStack);
        fLowEnergyStack.TransferTo(&consolidatedStack);

        G4cout << "Consolidated " << consolidatedStack.GetNTrack()
               << " tracks" << G4endl;
    }

private:
    G4TrackStack fHighEnergyStack;
    G4TrackStack fMediumEnergyStack;
    G4TrackStack fLowEnergyStack;
};
```

### Example 4: Stack with Capacity Management

```cpp
class OptimizedTrackStack
{
public:
    OptimizedTrackStack(std::size_t initialCapacity = 1000)
        : fStack(initialCapacity)
    {
        G4cout << "Created stack with capacity "
               << initialCapacity << G4endl;
    }

    void PushTrack(G4Track* track, G4VTrajectory* traj = nullptr)
    {
        G4StackedTrack stackedTrack(track, traj);
        fStack.PushToStack(stackedTrack);

        // Monitor for reallocation
        if (fStack.size() == fStack.capacity()) {
            G4cout << "WARNING: Stack at capacity, will reallocate"
                   << G4endl;
        }
    }

    void ProcessAll()
    {
        std::size_t initialSize = fStack.GetNTrack();
        std::size_t maxSize = fStack.GetMaxNTrack();

        G4cout << "Processing " << initialSize << " tracks"
               << " (max was " << maxSize << ")" << G4endl;

        while (fStack.GetNTrack() > 0) {
            G4StackedTrack stackedTrack = fStack.PopFromStack();
            ProcessTrack(stackedTrack.GetTrack());
        }
    }

private:
    void ProcessTrack(G4Track* track)
    {
        // Process track...
        delete track;
    }

    G4TrackStack fStack;
};
```

## Performance Characteristics

### Time Complexity
- `PushToStack()`: O(1) amortized (may reallocate)
- `PopFromStack()`: O(1)
- `TransferTo()`: O(n) where n = number of tracks
- `clearAndDestroy()`: O(n) where n = number of tracks
- `getTotalEnergy()`: O(n) where n = number of tracks

### Space Complexity
- Storage: O(n) where n = number of tracks
- Per-track overhead: sizeof(G4StackedTrack) = 16 bytes (2 pointers)

### Memory Management
- Uses `std::vector` dynamic array
- Capacity grows by factor (typically 2x) when full
- Pre-allocating capacity avoids reallocations
- `reserve()` doesn't construct objects

## Thread Safety

### Thread-Local Stacks
- Each worker thread has independent stack instances
- No synchronization needed within thread
- Stack pointers not shared between threads

### Transfer Operations
- All transfers occur within single thread
- No concurrent access to same stack instance

## Common Patterns

### Pattern 1: LIFO Processing
```cpp
while (stack.GetNTrack() > 0) {
    G4StackedTrack st = stack.PopFromStack();
    ProcessTrack(st.GetTrack());
}
```

### Pattern 2: Conditional Transfer
```cpp
if (urgentStack.GetNTrack() == 0 && waitingStack.GetNTrack() > 0) {
    waitingStack.TransferTo(&urgentStack);
    stackingAction->NewStage();
}
```

### Pattern 3: Energy Monitoring
```cpp
G4double energyBefore = stack.getTotalEnergy();
// ... process tracks ...
G4double energyAfter = stack.getTotalEnergy();
G4double energyProcessed = energyBefore - energyAfter;
```

### Pattern 4: Capacity Optimization
```cpp
// Pre-allocate for expected event size
G4TrackStack stack(expectedMaxTracks);
```

## See Also

- [G4StackedTrack](g4stackedtrack.md) - Track wrapper stored in stack
- [G4SmartTrackStack](g4smarttrackstack.md) - Optimized multi-stack implementation
- [G4StackManager](g4stackmanager.md) - Stack manager using G4TrackStack
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4TrackStack.hh`
- Source: `source/event/src/G4TrackStack.cc`
:::
