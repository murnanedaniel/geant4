# G4TrajectoryContainer API Documentation

## Overview

`G4TrajectoryContainer` is a specialized container class for storing `G4VTrajectory` objects within a `G4Event`. It provides an efficient wrapper around `std::vector<G4VTrajectory*>` with trajectory-specific operations like adding, accessing, and batch deletion of trajectories. This container is automatically managed by the event and filled during particle tracking when trajectory storage is enabled.

::: tip Header File
**Location:** `source/event/include/G4TrajectoryContainer.hh`
**Source:** `source/event/src/G4TrajectoryContainer.cc`
:::

::: warning Module Location
While G4TrajectoryContainer is physically located in the Event module, it is documented here due to its intimate relationship with trajectory classes in the Tracking module.
:::

## Class Declaration

```cpp
using TrajectoryVector = std::vector<G4VTrajectory*>;

class G4TrajectoryContainer
{
  public:
    G4TrajectoryContainer();
    ~G4TrajectoryContainer();

    G4TrajectoryContainer(const G4TrajectoryContainer&) = delete;
    G4TrajectoryContainer& operator=(const G4TrajectoryContainer&) = delete;

    inline void *operator new(std::size_t);
    inline void operator delete(void* anEvent);

    G4bool operator==(const G4TrajectoryContainer& right) const;
    G4bool operator!=(const G4TrajectoryContainer& right) const;

    // Container operations
    inline std::size_t size() const;
    inline void push_back(G4VTrajectory* p);
    inline std::size_t entries() const;
    inline G4bool insert(G4VTrajectory* p);
    inline void clearAndDestroy();
    inline G4VTrajectory* operator[](std::size_t n);
    inline TrajectoryVector* GetVector() const;

  private:
    TrajectoryVector* vect = nullptr;
};
```

## Key Characteristics

- **Event-Level Storage**: One container per event
- **Trajectory Collection**: Stores all trajectories from all tracks in an event
- **Efficient Allocation**: Uses G4Allocator for fast memory management
- **Automatic Management**: Created and destroyed by G4Event
- **Vector Wrapper**: Thin wrapper around std::vector with trajectory operations
- **Deletion Support**: Can delete all contained trajectories in one call

## Constructor and Destructor

### Constructor
`source/event/include/G4TrajectoryContainer.hh:51`

```cpp
G4TrajectoryContainer();
```

**Purpose:** Creates an empty trajectory container

**Behavior:**
- Allocates new TrajectoryVector (std::vector)
- Initializes with zero trajectories
- Uses G4Allocator for efficient memory management

**Usage:** Automatically called by G4Event when first trajectory is stored

**Example:**
```cpp
// Typically not called directly - managed by G4Event
G4TrajectoryContainer* container = new G4TrajectoryContainer();
```

### Destructor
`source/event/include/G4TrajectoryContainer.hh:52`

```cpp
~G4TrajectoryContainer();
```

**Purpose:** Destroys the container

**Behavior:**
- Does NOT delete contained trajectories by default
- Only deletes the vector itself
- Trajectories must be explicitly deleted with clearAndDestroy()

**Important:** User must call clearAndDestroy() before deletion to avoid memory leaks

**Example:**
```cpp
container->clearAndDestroy();  // Delete all trajectories
delete container;              // Delete container itself
```

## Memory Management

### operator new
`source/event/include/G4TrajectoryContainer.hh:57, 83-90`

```cpp
inline void *operator new(std::size_t);
```

**Purpose:** Allocates container using G4Allocator

**Returns:** Pointer to allocated memory

**Implementation:**
```cpp
inline void* G4TrajectoryContainer::operator new(std::size_t) {
    if (aTrajectoryContainerAllocator() == nullptr) {
        aTrajectoryContainerAllocator() =
            new G4Allocator<G4TrajectoryContainer>;
    }
    return (void*)aTrajectoryContainerAllocator()->MallocSingle();
}
```

**Benefit:** Much faster than standard allocation for many events

### operator delete
`source/event/include/G4TrajectoryContainer.hh:58, 92-96`

```cpp
inline void operator delete(void* aTrajectoryContainer);
```

**Purpose:** Returns container to allocator pool

**Implementation:**
```cpp
inline void G4TrajectoryContainer::operator delete(void* aTrajectoryContainer) {
    aTrajectoryContainerAllocator()->FreeSingle(
        (G4TrajectoryContainer*)aTrajectoryContainer
    );
}
```

## Deleted Operations

### Copy Constructor and Assignment
`source/event/include/G4TrajectoryContainer.hh:54-55`

```cpp
G4TrajectoryContainer(const G4TrajectoryContainer&) = delete;
G4TrajectoryContainer& operator=(const G4TrajectoryContainer&) = delete;
```

**Purpose:** Prevents copying of containers

**Reason:** Trajectories are owned by the container; copying would create ambiguous ownership

## Comparison Operators

### operator== / operator!=
`source/event/include/G4TrajectoryContainer.hh:60-61`

```cpp
G4bool operator==(const G4TrajectoryContainer& right) const;
G4bool operator!=(const G4TrajectoryContainer& right) const;
```

**Purpose:** Compares containers for equality

**Returns:** True if same object (pointer comparison)

**Example:**
```cpp
if (*container1 == *container2) {
    // Same container object
}
```

## Container Operations

### size() / entries()
`source/event/include/G4TrajectoryContainer.hh:63, 65`

```cpp
inline std::size_t size() const { return vect->size(); }
inline std::size_t entries() const { return size(); }
```

**Purpose:** Returns number of trajectories in container

**Returns:** Number of stored trajectories

**Note:** `entries()` is an alias for `size()`

**Example:**
```cpp
G4TrajectoryContainer* container = event->GetTrajectoryContainer();

if (container) {
    G4int nTrajectories = container->entries();
    G4cout << "Event has " << nTrajectories << " trajectories" << G4endl;
}
```

### push_back()
`source/event/include/G4TrajectoryContainer.hh:64`

```cpp
inline void push_back(G4VTrajectory* p) { vect->push_back(p); }
```

**Purpose:** Adds a trajectory to the container

**Parameters:**
- `p`: Pointer to trajectory to add

**Behavior:**
- Appends trajectory to end of vector
- Takes ownership of the trajectory
- Does not check for duplicates

**Usage:** Called by event manager when track completes

**Example:**
```cpp
// In event manager (automatic)
G4VTrajectory* trajectory = trackingManager->GimmeTrajectory();
if (trajectory) {
    container->push_back(trajectory);
}
```

### insert()
`source/event/include/G4TrajectoryContainer.hh:66`

```cpp
inline G4bool insert(G4VTrajectory* p) { push_back(p); return true; }
```

**Purpose:** Inserts a trajectory (alias for push_back)

**Parameters:**
- `p`: Pointer to trajectory to insert

**Returns:** Always true

**Note:** Identical to push_back(), provided for compatibility

### operator[]
`source/event/include/G4TrajectoryContainer.hh:72`

```cpp
inline G4VTrajectory* operator[](std::size_t n) { return (*vect)[n]; }
```

**Purpose:** Access trajectory by index

**Parameters:**
- `n`: Index (0 to size()-1)

**Returns:** Pointer to trajectory at index n

**Warning:** No bounds checking - undefined behavior if n >= size()

**Example:**
```cpp
G4int nTraj = container->entries();
for (G4int i = 0; i < nTraj; ++i) {
    G4VTrajectory* trajectory = (*container)[i];
    G4cout << "Trajectory " << i << ": "
           << trajectory->GetParticleName() << G4endl;
}
```

### clearAndDestroy()
`source/event/include/G4TrajectoryContainer.hh:67-71`

```cpp
inline void clearAndDestroy()
{
    for(std::size_t i=0; i<size(); ++i) delete (*vect)[i];
    vect->clear();
}
```

**Purpose:** Deletes all trajectories and clears container

**Behavior:**
- Iterates through all trajectories
- Deletes each trajectory object
- Clears the vector

**Important:** Must be called before container destruction to avoid memory leaks

**Example:**
```cpp
// In EndOfEventAction
void MyEventAction::EndOfEventAction(const G4Event* event) {
    // Process trajectories
    ProcessTrajectories(event);

    // Clean up if not needed for output
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (container) {
        container->clearAndDestroy();
    }
}
```

### GetVector()
`source/event/include/G4TrajectoryContainer.hh:73`

```cpp
inline TrajectoryVector* GetVector() const { return vect; }
```

**Purpose:** Access underlying vector directly

**Returns:** Pointer to internal std::vector<G4VTrajectory*>

**Usage:** For STL algorithms and range-based for loops

**Example:**
```cpp
TrajectoryVector* vec = container->GetVector();

// Range-based loop
for (auto* trajectory : *vec) {
    ProcessTrajectory(trajectory);
}

// STL algorithms
auto it = std::find_if(vec->begin(), vec->end(),
    [](G4VTrajectory* t) { return t->GetParticleName() == "e-"; }
);
```

## Complete Usage Examples

### Basic Trajectory Retrieval

```cpp
void MyEventAction::EndOfEventAction(const G4Event* event)
{
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();

    if (!container) {
        G4cout << "No trajectories stored" << G4endl;
        return;
    }

    G4int nTrajectories = container->entries();
    G4cout << "Event " << event->GetEventID()
           << " has " << nTrajectories << " trajectories" << G4endl;

    // Iterate through all trajectories
    for (G4int i = 0; i < nTrajectories; ++i) {
        G4VTrajectory* trajectory = (*container)[i];

        G4cout << "Trajectory " << i << ": "
               << "Track ID=" << trajectory->GetTrackID()
               << ", Particle=" << trajectory->GetParticleName()
               << ", Parent=" << trajectory->GetParentID()
               << ", Points=" << trajectory->GetPointEntries()
               << G4endl;
    }
}
```

### Filtering and Processing

```cpp
void ProcessPrimaryTrajectories(const G4Event* event)
{
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    std::vector<G4VTrajectory*> primaryTrajectories;

    // Find all primary trajectories
    for (G4int i = 0; i < container->entries(); ++i) {
        G4VTrajectory* traj = (*container)[i];
        if (traj->GetParentID() == 0) {  // Primary particle
            primaryTrajectories.push_back(traj);
        }
    }

    G4cout << "Found " << primaryTrajectories.size()
           << " primary trajectories" << G4endl;

    // Process primary trajectories
    for (auto* traj : primaryTrajectories) {
        AnalyzePrimaryTrajectory(traj);
    }
}

void AnalyzePrimaryTrajectory(const G4VTrajectory* traj)
{
    G4cout << "Primary " << traj->GetTrackID()
           << " (" << traj->GetParticleName() << ")" << G4endl;

    // Find all secondaries from this primary
    FindSecondaries(traj->GetTrackID());
}
```

### Grouping by Particle Type

```cpp
void GroupTrajectories(const G4Event* event)
{
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    // Group trajectories by particle name
    std::map<G4String, std::vector<G4VTrajectory*>> groups;

    for (G4int i = 0; i < container->entries(); ++i) {
        G4VTrajectory* traj = (*container)[i];
        G4String particle = traj->GetParticleName();
        groups[particle].push_back(traj);
    }

    // Print summary
    G4cout << "\n=== Trajectory Summary ===" << G4endl;
    for (const auto& [particle, trajectories] : groups) {
        G4cout << particle << ": " << trajectories.size() << " tracks" << G4endl;

        // Statistics for each particle type
        if (particle == "e-") {
            AnalyzeElectrons(trajectories);
        } else if (particle == "gamma") {
            AnalyzePhotons(trajectories);
        }
    }
}
```

### Parent-Daughter Relationship Analysis

```cpp
void AnalyzeTrackingTree(const G4Event* event)
{
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    // Build track ID to trajectory map
    std::map<G4int, G4VTrajectory*> trackMap;
    for (G4int i = 0; i < container->entries(); ++i) {
        G4VTrajectory* traj = (*container)[i];
        trackMap[traj->GetTrackID()] = traj;
    }

    // Find primaries and build tree
    for (G4int i = 0; i < container->entries(); ++i) {
        G4VTrajectory* traj = (*container)[i];

        if (traj->GetParentID() == 0) {  // Primary
            G4cout << "Primary track " << traj->GetTrackID()
                   << " (" << traj->GetParticleName() << ")" << G4endl;

            // Find all descendants
            PrintDescendants(traj->GetTrackID(), trackMap, 1);
        }
    }
}

void PrintDescendants(G4int parentID,
                      const std::map<G4int, G4VTrajectory*>& trackMap,
                      G4int level)
{
    G4String indent(level * 2, ' ');

    for (const auto& [trackID, traj] : trackMap) {
        if (traj->GetParentID() == parentID) {
            G4cout << indent << "└─ Track " << trackID
                   << " (" << traj->GetParticleName() << ")" << G4endl;

            // Recursively print descendants
            PrintDescendants(trackID, trackMap, level + 1);
        }
    }
}
```

### Trajectory Visualization

```cpp
void DrawAllTrajectories(const G4Event* event)
{
    G4VVisManager* visManager = G4VVisManager::GetConcreteInstance();
    if (!visManager) return;

    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    G4cout << "Drawing " << container->entries() << " trajectories" << G4endl;

    // Draw each trajectory
    for (G4int i = 0; i < container->entries(); ++i) {
        G4VTrajectory* trajectory = (*container)[i];

        // Use built-in drawing
        trajectory->DrawTrajectory();

        // Or custom drawing
        DrawCustomTrajectory(trajectory);
    }
}

void DrawCustomTrajectory(const G4VTrajectory* trajectory)
{
    G4VVisManager* visManager = G4VVisManager::GetConcreteInstance();

    // Create polyline from points
    G4Polyline polyline;
    for (G4int i = 0; i < trajectory->GetPointEntries(); ++i) {
        G4VTrajectoryPoint* point = trajectory->GetPoint(i);
        polyline.push_back(point->GetPosition());
    }

    // Customize appearance
    G4VisAttributes attribs;

    // Color by particle and hierarchy
    if (trajectory->GetParentID() == 0) {
        // Primary: Bright colors, thick lines
        attribs.SetColour(GetBrightParticleColor(trajectory->GetParticleName()));
        attribs.SetLineWidth(3.0);
        attribs.SetLineStyle(G4VisAttributes::solid);
    } else {
        // Secondary: Dim colors, thin lines
        attribs.SetColour(GetDimParticleColor(trajectory->GetParticleName()));
        attribs.SetLineWidth(1.0);
        attribs.SetLineStyle(G4VisAttributes::dashed);
    }

    polyline.SetVisAttributes(attribs);
    visManager->Draw(polyline);
}
```

### Saving Trajectories to File

```cpp
void SaveTrajectories(const G4Event* event, const G4String& filename)
{
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    std::ofstream outfile(filename, std::ios::app);

    outfile << "# Event " << event->GetEventID() << G4endl;
    outfile << "# Trajectories: " << container->entries() << G4endl;

    for (G4int i = 0; i < container->entries(); ++i) {
        const G4VTrajectory* traj = (*container)[i];

        // Write trajectory header
        outfile << "T " << traj->GetTrackID()
                << " " << traj->GetParentID()
                << " " << traj->GetParticleName()
                << " " << traj->GetPDGEncoding()
                << " " << traj->GetCharge()
                << " " << traj->GetPointEntries()
                << G4endl;

        // Write initial momentum if available
        if (const G4Trajectory* stdTraj = dynamic_cast<const G4Trajectory*>(traj)) {
            G4ThreeVector p = stdTraj->GetInitialMomentum();
            G4double ke = stdTraj->GetInitialKineticEnergy();
            outfile << "  KE " << ke/MeV << G4endl;
            outfile << "  P " << p.x()/MeV << " "
                    << p.y()/MeV << " " << p.z()/MeV << G4endl;
        }

        // Write all points
        for (G4int j = 0; j < traj->GetPointEntries(); ++j) {
            G4VTrajectoryPoint* point = traj->GetPoint(j);
            G4ThreeVector pos = point->GetPosition();
            outfile << "  " << j << " "
                    << pos.x()/cm << " "
                    << pos.y()/cm << " "
                    << pos.z()/cm << G4endl;
        }
    }

    outfile.close();
}
```

### Memory Management Example

```cpp
class MyEventAction : public G4UserEventAction
{
public:
    void EndOfEventAction(const G4Event* event) override {
        G4TrajectoryContainer* container = event->GetTrajectoryContainer();

        if (container) {
            // Process trajectories
            AnalyzeTrajectories(container);

            // Decide whether to keep or clear
            if (ShouldSaveTrajectories(event)) {
                // Keep trajectories (for output, visualization, etc.)
                G4cout << "Keeping trajectories for event "
                       << event->GetEventID() << G4endl;
            } else {
                // Clear to save memory
                container->clearAndDestroy();
            }
        }
    }

private:
    bool ShouldSaveTrajectories(const G4Event* event) {
        // Save every 100th event
        return (event->GetEventID() % 100 == 0);
    }
};
```

### Advanced: Using STL Algorithms

```cpp
void FindHighEnergyElectrons(const G4Event* event)
{
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    TrajectoryVector* vec = container->GetVector();

    // Find electrons using STL algorithm
    auto isHighEnergyElectron = [](const G4VTrajectory* traj) {
        if (traj->GetParticleName() != "e-") return false;

        const G4Trajectory* stdTraj = dynamic_cast<const G4Trajectory*>(traj);
        return stdTraj && stdTraj->GetInitialKineticEnergy() > 10*MeV;
    };

    // Count high-energy electrons
    G4int count = std::count_if(vec->begin(), vec->end(), isHighEnergyElectron);
    G4cout << "High-energy electrons: " << count << G4endl;

    // Collect high-energy electrons
    std::vector<G4VTrajectory*> highEnergyElectrons;
    std::copy_if(vec->begin(), vec->end(),
                 std::back_inserter(highEnergyElectrons),
                 isHighEnergyElectron);

    // Process them
    for (auto* traj : highEnergyElectrons) {
        ProcessHighEnergyElectron(traj);
    }
}
```

## Performance Considerations

### Memory Usage

Container overhead is minimal:
- Container object: ~24 bytes
- Vector overhead: ~24 bytes
- Pointers: 8 bytes per trajectory

Main memory usage comes from the trajectories themselves.

### Optimization Strategies

**1. Clear Unused Trajectories:**
```cpp
void EndOfEventAction(const G4Event* event) {
    ProcessTrajectories(event);

    // Clear if not needed for output
    if (!fSaveTrajectories) {
        G4TrajectoryContainer* container = event->GetTrajectoryContainer();
        if (container) {
            container->clearAndDestroy();
        }
    }
}
```

**2. Selective Storage:**
```cpp
// In tracking action - prevent storage in first place
void PreUserTrackingAction(const G4Track* track) {
    // Only store interesting tracks
    if (track->GetParentID() == 0 ||  // Primaries
        track->GetKineticEnergy() > 10*MeV) {  // High energy
        fpTrackingManager->SetStoreTrajectory(1);
    } else {
        fpTrackingManager->SetStoreTrajectory(0);
    }
}
```

**3. Efficient Iteration:**
```cpp
// Use range-based loop for cleaner code
TrajectoryVector* vec = container->GetVector();
for (auto* trajectory : *vec) {
    ProcessTrajectory(trajectory);
}

// Or use direct indexing for maximum performance
G4int n = container->size();
for (G4int i = 0; i < n; ++i) {
    G4VTrajectory* traj = (*container)[i];
    ProcessTrajectory(traj);
}
```

## Thread Safety

::: warning Multi-Threading
- Each event has its own container
- Events are thread-local in MT mode
- No synchronization needed
- Containers are independent between threads
:::

**Best Practices:**
- Containers belong to their thread's events
- No sharing between threads
- Safe to process in parallel

## Common Pitfalls

### 1. Forgetting clearAndDestroy()

**Problem:**
```cpp
// Memory leak - trajectories not deleted!
G4TrajectoryContainer* container = event->GetTrajectoryContainer();
// ... process trajectories ...
// Event ends, container deleted, but trajectories leak
```

**Solution:**
```cpp
G4TrajectoryContainer* container = event->GetTrajectoryContainer();
// ... process trajectories ...
container->clearAndDestroy();  // Clean up properly
```

### 2. Accessing After Clear

**Problem:**
```cpp
container->clearAndDestroy();
G4VTrajectory* traj = (*container)[0];  // Crash! Vector is empty
```

**Solution:**
```cpp
if (container->size() > 0) {
    G4VTrajectory* traj = (*container)[0];  // Safe
}
```

### 3. Assuming Container Exists

**Problem:**
```cpp
G4TrajectoryContainer* container = event->GetTrajectoryContainer();
G4int n = container->entries();  // Crash if container is nullptr!
```

**Solution:**
```cpp
G4TrajectoryContainer* container = event->GetTrajectoryContainer();
if (container) {
    G4int n = container->entries();  // Safe
}
```

## Related Classes

### Trajectory Classes
- [G4VTrajectory](g4vtrajectory.md) - Trajectory base class
- [G4Trajectory](g4trajectory.md) - Standard trajectory
- G4TrajectoryPoint - Position storage

### Event
- [G4Event](../../event/api/g4event.md) - Owns trajectory container
- [G4EventManager](../../event/api/g4eventmanager.md) - Event processing
- [G4UserEventAction](../../event/api/g4usereventaction.md) - Access in user code

### Tracking
- [G4TrackingManager](g4trackingmanager.md) - Creates trajectories
- [G4UserTrackingAction](g4usertrackingaction.md) - Trajectory control

## See Also

- [Tracking Module Overview](../overview.md)
- [Event Module](../../../event/overview.md)
- [Visualization](../../visualization/overview.md)

---

::: info Source Reference
Complete implementation in:
- Header: `source/event/include/G4TrajectoryContainer.hh`
- Source: `source/event/src/G4TrajectoryContainer.cc`
- Allocator: `source/event/include/evtdefs.hh`
:::
