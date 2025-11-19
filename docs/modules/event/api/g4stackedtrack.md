# G4StackedTrack API Documentation

## Overview

`G4StackedTrack` is a lightweight wrapper class that pairs a `G4Track` object with its optional trajectory (`G4VTrajectory`). This class is used internally by `G4StackManager` and `G4TrackStack` for managing tracks in various stacks (urgent, waiting, postpone).

The class serves as a container to maintain the association between a track and its trajectory during event processing, ensuring that both are properly managed throughout the track's lifecycle.

::: tip Header File
**Location:** `source/event/include/G4StackedTrack.hh`
:::

## Class Declaration

`source/event/include/G4StackedTrack.hh:39-56`

```cpp
class G4StackedTrack
{
  public:
    G4StackedTrack() = default;
    G4StackedTrack(G4Track* aTrack, G4VTrajectory* aTraj = nullptr);
   ~G4StackedTrack() = default;

    inline G4Track* GetTrack() const;
    inline G4VTrajectory* GetTrajectory() const;

  private:
    G4Track* track = nullptr;
    G4VTrajectory* trajectory = nullptr;
};
```

::: info Lightweight Design
`G4StackedTrack` only stores pointers and does not own the objects. Track and trajectory lifetime managed by `G4StackManager`.
:::

## Constructors and Destructor

### Default Constructor
`source/event/include/G4StackedTrack.hh:43`

```cpp
G4StackedTrack() = default;
```

**Purpose:** Creates empty stacked track with null pointers

**Usage:**
```cpp
G4StackedTrack emptyTrack;  // Both track and trajectory are nullptr
```

### Parametrized Constructor
`source/event/include/G4StackedTrack.hh:44-45`

```cpp
G4StackedTrack(G4Track* aTrack, G4VTrajectory* aTraj = nullptr);
```

**Parameters:**
- `aTrack`: Pointer to the G4Track object
- `aTraj`: Pointer to the trajectory (optional, default = nullptr)

**Usage:**
```cpp
// Create track without trajectory
G4Track* track = new G4Track(particle, time, position);
G4StackedTrack stackedTrack(track);

// Create track with trajectory (if trajectory storing is enabled)
G4VTrajectory* trajectory = new G4Trajectory(track);
G4StackedTrack stackedTrackWithTraj(track, trajectory);
```

::: warning Memory Management
`G4StackedTrack` does NOT take ownership of the track or trajectory. The caller (typically `G4StackManager`) is responsible for deletion.
:::

### Destructor
`source/event/include/G4StackedTrack.hh:46`

```cpp
~G4StackedTrack() = default;
```

**Behavior:**
- Does NOT delete track or trajectory
- Pointers are simply released
- Actual object deletion handled by `G4StackManager`

## Public Methods

### GetTrack()
`source/event/include/G4StackedTrack.hh:48`

```cpp
inline G4Track* GetTrack() const;
```

**Returns:** Pointer to the associated `G4Track` object

**Usage:**
```cpp
G4StackedTrack stackedTrack = urgentStack->PopFromStack();
G4Track* track = stackedTrack.GetTrack();

if (track != nullptr) {
    G4cout << "Track ID: " << track->GetTrackID() << G4endl;
    G4cout << "Particle: " << track->GetDefinition()->GetParticleName()
           << G4endl;
    G4cout << "Energy: " << track->GetKineticEnergy()/MeV << " MeV"
           << G4endl;
}
```

::: tip Null Check
Always check for nullptr before using the returned pointer, especially when dealing with default-constructed instances.
:::

### GetTrajectory()
`source/event/include/G4StackedTrack.hh:49`

```cpp
inline G4VTrajectory* GetTrajectory() const;
```

**Returns:** Pointer to the associated `G4VTrajectory` object (may be nullptr)

**Usage:**
```cpp
G4StackedTrack stackedTrack = urgentStack->PopFromStack();
G4VTrajectory* trajectory = stackedTrack.GetTrajectory();

if (trajectory != nullptr) {
    // Trajectory exists - store or visualize it
    G4TrajectoryContainer* trajectoryContainer =
        event->GetTrajectoryContainer();
    if (trajectoryContainer == nullptr) {
        trajectoryContainer = new G4TrajectoryContainer;
        event->SetTrajectoryContainer(trajectoryContainer);
    }
    trajectoryContainer->insert(trajectory);
} else {
    // No trajectory (trajectory storage disabled)
    G4cout << "No trajectory stored for this track" << G4endl;
}
```

::: info Trajectory Storage
Trajectories are only created when trajectory storage is enabled via `/tracking/storeTrajectory 1`. Otherwise, this method returns nullptr.
:::

## Usage Patterns

### Pattern 1: Creating and Pushing to Stack

```cpp
// In G4StackManager::PushOneTrack()
G4Track* newTrack = new G4Track(particle, time, position);
G4VTrajectory* trajectory = nullptr;

// Create trajectory if storing is enabled
if (fStoreTrajectory) {
    trajectory = fTrackingManager->GimmeTrajectory();
}

// Wrap track and trajectory together
G4StackedTrack stackedTrack(newTrack, trajectory);

// Push to appropriate stack based on classification
urgentStack->PushToStack(stackedTrack);
```

### Pattern 2: Popping and Processing

```cpp
// In G4StackManager::PopNextTrack()
if (urgentStack->GetNTrack() > 0) {
    G4StackedTrack stackedTrack = urgentStack->PopFromStack();

    G4Track* track = stackedTrack.GetTrack();
    G4VTrajectory* trajectory = stackedTrack.GetTrajectory();

    // Process the track
    trackingManager->ProcessOneTrack(track);

    // Handle trajectory
    if (trajectory != nullptr) {
        event->GetTrajectoryContainer()->insert(trajectory);
    }
}
```

### Pattern 3: Stack Transfer

```cpp
// Transfer tracks between stacks (used in G4TrackStack::TransferTo)
while (!sourceStack.empty()) {
    G4StackedTrack stackedTrack = sourceStack.PopFromStack();

    // Track and trajectory move together
    destinationStack->PushToStack(stackedTrack);
}
```

### Pattern 4: Clearing Stacks

```cpp
// In G4TrackStack::clearAndDestroy()
for (auto& stackedTrack : *this) {
    G4Track* track = stackedTrack.GetTrack();
    G4VTrajectory* trajectory = stackedTrack.GetTrajectory();

    // Clean up both track and trajectory
    delete track;
    delete trajectory;
}
this->clear();
```

## Complete Example: Stack Management

```cpp
class SimpleStackManager
{
public:
    void PushTrack(G4Track* track, G4VTrajectory* traj = nullptr)
    {
        // Create stacked track
        G4StackedTrack stackedTrack(track, traj);

        // Push to urgent stack
        fUrgentStack.PushToStack(stackedTrack);

        G4cout << "Pushed track " << track->GetTrackID()
               << " (trajectory: " << (traj ? "yes" : "no") << ")"
               << G4endl;
    }

    G4Track* PopTrack(G4VTrajectory*& trajectory)
    {
        if (fUrgentStack.GetNTrack() == 0) {
            trajectory = nullptr;
            return nullptr;
        }

        // Pop stacked track
        G4StackedTrack stackedTrack = fUrgentStack.PopFromStack();

        // Extract track and trajectory
        G4Track* track = stackedTrack.GetTrack();
        trajectory = stackedTrack.GetTrajectory();

        G4cout << "Popped track " << track->GetTrackID()
               << G4endl;

        return track;
    }

    void ClearAll()
    {
        // Clean up all stacked tracks
        while (fUrgentStack.GetNTrack() > 0) {
            G4VTrajectory* traj;
            G4Track* track = PopTrack(traj);

            delete track;
            delete traj;
        }
    }

private:
    G4TrackStack fUrgentStack;
};
```

## Example: Trajectory Management

```cpp
class MyTrackingAction : public G4UserTrackingAction
{
public:
    void PreUserTrackingAction(const G4Track* track) override
    {
        // Create trajectory if storing is enabled
        if (fStoreTrajectory) {
            G4VTrajectory* trajectory = new G4Trajectory(track);
            fpTrackingManager->SetTrajectory(trajectory);

            // Later, G4StackManager will create G4StackedTrack
            // pairing this track with its trajectory
        }
    }

    void PostUserTrackingAction(const G4Track* track) override
    {
        G4VTrajectory* trajectory = fpTrackingManager->GimmeTrajectory();

        if (trajectory != nullptr) {
            // Add final trajectory point
            trajectory->AppendStep(track->GetStep());

            // Store in event (G4StackManager handles this via G4StackedTrack)
            G4TrajectoryContainer* container =
                fpEventManager->GetConstCurrentEvent()
                    ->GetTrajectoryContainer();

            if (container != nullptr) {
                container->insert(trajectory);
            }
        }
    }

private:
    G4bool fStoreTrajectory = false;
};
```

## Data Members

`source/event/include/G4StackedTrack.hh:52-54`

```cpp
private:
    G4Track* track = nullptr;
    G4VTrajectory* trajectory = nullptr;
```

### track
**Type:** `G4Track*`
**Purpose:** Pointer to the track being stacked
**Ownership:** Not owned by `G4StackedTrack`

### trajectory
**Type:** `G4VTrajectory*`
**Purpose:** Pointer to the trajectory associated with the track
**Ownership:** Not owned by `G4StackedTrack`

## Memory Management

### Ownership Model

```cpp
// G4StackManager owns the actual objects
class G4StackManager {
    // When pushing:
    G4Track* track = new G4Track(...);              // StackManager owns
    G4VTrajectory* traj = new G4Trajectory(...);    // StackManager owns
    G4StackedTrack stacked(track, traj);            // Just stores pointers
    urgentStack->PushToStack(stacked);

    // When popping:
    G4StackedTrack stacked = urgentStack->PopFromStack();
    G4Track* track = stacked.GetTrack();            // Extract pointer
    // StackManager must delete track when done
    delete track;
    delete stacked.GetTrajectory();
};
```

### Copy Semantics

```cpp
// Copying is allowed - just copies pointers
G4StackedTrack original(track, trajectory);
G4StackedTrack copy = original;  // Both point to same track/trajectory

// Be careful: deleting through one affects the other
G4Track* t1 = original.GetTrack();
G4Track* t2 = copy.GetTrack();
// t1 == t2 (same object)
```

::: warning Shallow Copy
`G4StackedTrack` uses shallow copy (default copy constructor). Multiple instances can point to the same track/trajectory.
:::

## Performance Characteristics

1. **Memory:** Very small overhead (2 pointers = 16 bytes on 64-bit systems)
2. **Creation:** Trivial - just pointer assignment
3. **Copying:** Cheap - shallow copy of pointers
4. **Access:** Direct pointer dereferencing

::: tip Efficiency
The lightweight design makes `G4StackedTrack` efficient for stack operations with millions of tracks.
:::

## Thread Safety

### Thread-Local Usage
- Each worker thread has independent stacks
- No sharing of `G4StackedTrack` instances between threads
- No synchronization needed

### Stack Transfer
- Transfer operations within single thread only
- No concurrent access to same `G4StackedTrack` instance

## Common Pitfalls

### Pitfall 1: Assuming Ownership
```cpp
// WRONG - Don't delete through G4StackedTrack destructor
{
    G4StackedTrack stacked(new G4Track(...));
}  // Track NOT deleted - memory leak!

// CORRECT - Explicit cleanup
{
    G4Track* track = new G4Track(...);
    G4StackedTrack stacked(track);
    // ... use stacked ...
    delete stacked.GetTrack();  // Manual deletion required
}
```

### Pitfall 2: Dangling Pointers
```cpp
// WRONG - Track deleted while G4StackedTrack still exists
G4Track* track = new G4Track(...);
G4StackedTrack stacked(track);
delete track;  // Oops!
G4Track* t = stacked.GetTrack();  // Dangling pointer!
```

### Pitfall 3: Shared Ownership Confusion
```cpp
// CAREFUL - Multiple G4StackedTrack instances can point to same track
G4StackedTrack stacked1(track);
G4StackedTrack stacked2(track);
delete stacked1.GetTrack();  // Now stacked2 has dangling pointer!
```

## Best Practices

1. **Let G4StackManager Manage:** Don't manually create/delete in user code
2. **Null Checks:** Always verify pointers before use
3. **Trajectory Optional:** Code must handle nullptr trajectories
4. **No Double Delete:** Track ownership clarity is critical

## See Also

- [G4Track](../../track/api/g4track.md) - Track class wrapped by G4StackedTrack
- [G4VTrajectory](../../../tracking/api/g4vtrajectory.md) - Trajectory base class
- [G4TrackStack](g4trackstack.md) - LIFO stack storing G4StackedTrack
- [G4StackManager](g4stackmanager.md) - Manager class using G4StackedTrack
- [Event Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4StackedTrack.hh`
:::
