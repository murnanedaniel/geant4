# G4Trajectory API Documentation

## Overview

`G4Trajectory` is the standard concrete implementation of `G4VTrajectory` that stores the path history of a tracked particle. It records a sequence of `G4TrajectoryPoint` objects representing the particle's position at each step, along with static particle information from track creation. This class provides efficient trajectory storage for visualization and analysis.

::: tip Header File
**Location:** `source/tracking/include/G4Trajectory.hh`
**Source:** `source/tracking/src/G4Trajectory.cc`
:::

## Class Declaration

```cpp
class G4Trajectory : public G4VTrajectory
{
  using G4TrajectoryPointContainer = std::vector<G4VTrajectoryPoint*>;

  friend class G4ClonedTrajectory;

 public:
  // Constructors/Destructor
  G4Trajectory() = default;
  G4Trajectory(const G4Track* aTrack);
  G4Trajectory(G4Trajectory&);
  ~G4Trajectory() override;

  // Operators
  inline void* operator new(size_t);
  inline void operator delete(void*);
  inline G4bool operator==(const G4Trajectory& r) const;

  // Cloning for multi-threading
  G4VTrajectory* CloneForMaster() const override;

  // Accessors (from G4VTrajectory)
  inline G4int GetTrackID() const override;
  inline G4int GetParentID() const override;
  inline G4String GetParticleName() const override;
  inline G4double GetCharge() const override;
  inline G4int GetPDGEncoding() const override;
  inline G4double GetInitialKineticEnergy() const;
  inline G4ThreeVector GetInitialMomentum() const override;

  // Trajectory point access
  G4int GetPointEntries() const override;
  G4VTrajectoryPoint* GetPoint(G4int i) const override;

  // Trajectory management
  void ShowTrajectory(std::ostream& os = G4cout) const override;
  void DrawTrajectory() const override;
  void AppendStep(const G4Step* aStep) override;
  void MergeTrajectory(G4VTrajectory* secondTrajectory) override;

  // Particle definition
  G4ParticleDefinition* GetParticleDefinition();

  // Attributes for visualization/picking
  const std::map<G4String, G4AttDef>* GetAttDefs() const override;
  std::vector<G4AttValue>* CreateAttValues() const override;

 private:
  G4TrajectoryPointContainer* positionRecord = nullptr;
  G4int fTrackID = 0;
  G4int fParentID = 0;
  G4int PDGEncoding = 0;
  G4double PDGCharge = 0.0;
  G4String ParticleName = "dummy";
  G4double initialKineticEnergy = 0.0;
  G4ThreeVector initialMomentum;
};
```

## Key Characteristics

- **Standard Implementation**: Most commonly used trajectory class
- **Efficient Storage**: Stores only positions (no momentum/energy at each point)
- **Visualization Ready**: Built-in drawing and attribute support
- **Memory Optimized**: Uses G4Allocator for efficient allocation
- **Thread-Safe**: Supports cloning for master thread in MT mode
- **Lightweight**: Minimal memory footprint per trajectory

## Constructors and Destructor

### Default Constructor
`source/tracking/include/G4Trajectory.hh:73`

```cpp
G4Trajectory() = default;
```

**Purpose:** Creates an empty trajectory

**Usage:** Rarely used directly; mainly for internal purposes

### Constructor from Track
`source/tracking/include/G4Trajectory.hh:74`

```cpp
G4Trajectory(const G4Track* aTrack);
```

**Purpose:** Creates trajectory from track's initial state

**Parameters:**
- `aTrack`: Track to create trajectory from

**Behavior:**
- Stores track ID and parent ID
- Copies particle name, charge, PDG code
- Records initial kinetic energy and momentum
- Creates position record vector
- Adds first trajectory point at track's position

**Example:**
```cpp
// In tracking manager or user action
void PreUserTrackingAction(const G4Track* track) {
    G4Trajectory* trajectory = new G4Trajectory(track);
    fpTrackingManager->SetTrajectory(trajectory);
}
```

### Copy Constructor
`source/tracking/include/G4Trajectory.hh:75`

```cpp
G4Trajectory(G4Trajectory&);
```

**Purpose:** Creates a copy of a trajectory

**Parameters:**
- Source trajectory (unnamed)

**Behavior:**
- Copies all trajectory data
- Deep copies trajectory points
- Used by `CloneForMaster()`

### Destructor
`source/tracking/include/G4Trajectory.hh:76`

```cpp
~G4Trajectory() override;
```

**Purpose:** Cleans up trajectory resources

**Behavior:**
- Deletes all trajectory points
- Clears position record vector
- Frees allocated memory

## Memory Management

### operator new
`source/tracking/include/G4Trajectory.hh:80, 124-130`

```cpp
inline void* operator new(size_t);
```

**Purpose:** Allocates memory using G4Allocator

**Returns:** Pointer to allocated memory

**Implementation:**
```cpp
inline void* G4Trajectory::operator new(size_t) {
    if (aTrajectoryAllocator() == nullptr) {
        aTrajectoryAllocator() = new G4Allocator<G4Trajectory>;
    }
    return (void*)aTrajectoryAllocator()->MallocSingle();
}
```

**Benefit:** Much faster than standard new/delete for many allocations

### operator delete
`source/tracking/include/G4Trajectory.hh:81, 132-135`

```cpp
inline void operator delete(void*);
```

**Purpose:** Returns memory to G4Allocator pool

**Implementation:**
```cpp
inline void G4Trajectory::operator delete(void* aTrajectory) {
    aTrajectoryAllocator()->FreeSingle((G4Trajectory*)aTrajectory);
}
```

### operator==
`source/tracking/include/G4Trajectory.hh:82, 137`

```cpp
inline G4bool operator==(const G4Trajectory& r) const;
```

**Purpose:** Compares trajectories for equality

**Returns:** True if same object (pointer comparison)

**Implementation:**
```cpp
inline G4bool G4Trajectory::operator==(const G4Trajectory& r) const {
    return (this == &r);
}
```

## Cloning for Multi-Threading

### CloneForMaster()
`source/tracking/include/G4Trajectory.hh:85`

```cpp
G4VTrajectory* CloneForMaster() const override;
```

**Purpose:** Creates a copy using master thread allocator

**Returns:** Pointer to cloned trajectory

**Usage:** Called in sub-event parallel mode to merge trajectories

**Implementation:**
- Uses master thread's G4Allocator
- Deep copies all trajectory data
- Required for sub-event parallelism

## Accessor Methods

### Track Identification

```cpp
inline G4int GetTrackID() const override;          // Line 89
inline G4int GetParentID() const override;         // Line 90
```

**Purpose:** Returns track and parent IDs

**Example:**
```cpp
G4int trackID = trajectory->GetTrackID();
G4int parentID = trajectory->GetParentID();

if (parentID == 0) {
    G4cout << "Primary particle, track " << trackID << G4endl;
} else {
    G4cout << "Secondary from track " << parentID << G4endl;
}
```

### Particle Information

```cpp
inline G4String GetParticleName() const override;  // Line 91
inline G4double GetCharge() const override;        // Line 92
inline G4int GetPDGEncoding() const override;      // Line 93
```

**Purpose:** Returns particle properties

**Example:**
```cpp
G4String particle = trajectory->GetParticleName();
G4double charge = trajectory->GetCharge();
G4int pdg = trajectory->GetPDGEncoding();

G4cout << "Particle: " << particle
       << " (PDG=" << pdg << ", Q=" << charge << ")" << G4endl;
```

### Initial Kinematics

```cpp
inline G4double GetInitialKineticEnergy() const;   // Line 94
inline G4ThreeVector GetInitialMomentum() const override; // Line 95
```

**Purpose:** Returns particle state at creation

**Example:**
```cpp
G4double initialKE = trajectory->GetInitialKineticEnergy();
G4ThreeVector initialP = trajectory->GetInitialMomentum();

G4cout << "Initial kinetic energy: " << initialKE/MeV << " MeV" << G4endl;
G4cout << "Initial momentum: " << initialP/MeV << " MeV/c" << G4endl;
G4cout << "Initial direction: " << initialP.unit() << G4endl;
```

### Particle Definition

`source/tracking/include/G4Trajectory.hh:106`

```cpp
G4ParticleDefinition* GetParticleDefinition();
```

**Purpose:** Returns particle definition object

**Returns:** Pointer to G4ParticleDefinition, or nullptr if not found

**Usage:** Access detailed particle properties

**Example:**
```cpp
G4ParticleDefinition* particleDef = trajectory->GetParticleDefinition();
if (particleDef) {
    G4double mass = particleDef->GetPDGMass();
    G4double lifetime = particleDef->GetPDGLifeTime();
    G4cout << "Mass: " << mass/MeV << " MeV, "
           << "Lifetime: " << lifetime/ns << " ns" << G4endl;
}
```

## Trajectory Point Access

### GetPointEntries()
`source/tracking/include/G4Trajectory.hh:102`

```cpp
G4int GetPointEntries() const override;
```

**Purpose:** Returns number of trajectory points

**Returns:** Number of stored positions

**Implementation:**
```cpp
G4int GetPointEntries() const override {
    return G4int(positionRecord->size());
}
```

**Example:**
```cpp
G4int nPoints = trajectory->GetPointEntries();
G4cout << "Trajectory has " << nPoints << " points" << G4endl;
```

### GetPoint()
`source/tracking/include/G4Trajectory.hh:103`

```cpp
G4VTrajectoryPoint* GetPoint(G4int i) const override;
```

**Purpose:** Returns i-th trajectory point

**Parameters:**
- `i`: Point index (0 to GetPointEntries()-1)

**Returns:** Pointer to trajectory point

**Implementation:**
```cpp
G4VTrajectoryPoint* GetPoint(G4int i) const override {
    return (*positionRecord)[i];
}
```

**Example:**
```cpp
G4int nPoints = trajectory->GetPointEntries();
for (G4int i = 0; i < nPoints; ++i) {
    G4VTrajectoryPoint* point = trajectory->GetPoint(i);
    G4ThreeVector pos = point->GetPosition();
    G4cout << "Point " << i << ": " << pos/cm << " cm" << G4endl;
}
```

## Trajectory Management

### AppendStep()
`source/tracking/include/G4Trajectory.hh:101`

```cpp
void AppendStep(const G4Step* aStep) override;
```

**Purpose:** Adds step information to trajectory

**Parameters:**
- `aStep`: Step to append

**Behavior:**
- Extracts post-step position
- Creates new G4TrajectoryPoint
- Adds to position record

**Called By:** G4TrackingManager after each step (if trajectory storage enabled)

**Implementation:**
```cpp
void G4Trajectory::AppendStep(const G4Step* aStep) {
    positionRecord->push_back(
        new G4TrajectoryPoint(aStep->GetPostStepPoint()->GetPosition())
    );
}
```

**Example Usage:**
```cpp
// In tracking manager (automatic)
while (track->GetTrackStatus() == fAlive) {
    fpSteppingManager->Stepping();

    if (StoreTrajectory) {
        fpTrajectory->AppendStep(fpSteppingManager->GetStep());
    }
}
```

### MergeTrajectory()
`source/tracking/include/G4Trajectory.hh:104`

```cpp
void MergeTrajectory(G4VTrajectory* secondTrajectory) override;
```

**Purpose:** Merges another trajectory into this one

**Parameters:**
- `secondTrajectory`: Trajectory to merge

**Behavior:**
- Casts to G4Trajectory (returns if cast fails)
- Appends all points from second trajectory
- Skips first point (duplicate of last point in first trajectory)

**Usage:** For suspended/resumed tracks

**Example:**
```cpp
// When track is resumed
void ResumeTrack(G4VTrajectory* originalTraj,
                 G4VTrajectory* continuationTraj) {
    originalTraj->MergeTrajectory(continuationTraj);
    // originalTraj now contains complete path
}
```

## Visualization

### ShowTrajectory()
`source/tracking/include/G4Trajectory.hh:99`

```cpp
void ShowTrajectory(std::ostream& os = G4cout) const override;
```

**Purpose:** Prints trajectory information

**Parameters:**
- `os`: Output stream (default: G4cout)

**Output:** Trajectory details including track ID, particle name, points

**Example:**
```cpp
trajectory->ShowTrajectory();
// Output:
// Track ID: 1
// Particle: e-
// Parent ID: 0
// Initial KE: 10 MeV
// Number of points: 245
```

### DrawTrajectory()
`source/tracking/include/G4Trajectory.hh:100`

```cpp
void DrawTrajectory() const override;
```

**Purpose:** Draws trajectory in visualization system

**Behavior:**
- Creates G4Polyline from trajectory points
- Sets color based on particle charge:
  - Red: Negative charge
  - Blue: Positive charge
  - Green: Neutral
- Draws using G4VVisManager

**Example:**
```cpp
// In event display
void DrawEvent(const G4Event* event) {
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();

    if (container) {
        for (G4int i = 0; i < container->entries(); ++i) {
            G4VTrajectory* trajectory = (*container)[i];
            trajectory->DrawTrajectory();  // Automatic visualization
        }
    }
}
```

## Attributes for Picking

### GetAttDefs()
`source/tracking/include/G4Trajectory.hh:108`

```cpp
const std::map<G4String, G4AttDef>* GetAttDefs() const override;
```

**Purpose:** Returns attribute definitions

**Returns:** Map of attribute definitions for visualization tools

**Attributes Defined:**
- "ID" - Track ID
- "PID" - Parent ID
- "PN" - Particle name
- "Ch" - Charge
- "PDG" - PDG encoding
- "IMom" - Initial momentum magnitude
- "IMag" - Initial momentum vector
- "NTP" - Number of trajectory points

**Usage:** Enables interactive picking in visualization tools

### CreateAttValues()
`source/tracking/include/G4Trajectory.hh:109`

```cpp
std::vector<G4AttValue>* CreateAttValues() const override;
```

**Purpose:** Creates attribute values for this trajectory

**Returns:** Vector of attribute values (caller must delete)

**Example:**
```cpp
std::vector<G4AttValue>* values = trajectory->CreateAttValues();

for (const auto& value : *values) {
    G4cout << value.GetName() << ": "
           << value.GetValue() << G4endl;
}

delete values;  // Caller's responsibility

// Better: Use smart pointer version
const auto attValues = trajectory->GetAttValues();
if (attValues) {
    for (const auto& value : *attValues) {
        // Process values
    }
    // Automatic cleanup
}
```

## Complete Usage Examples

### Basic Trajectory Storage

```cpp
// Enable trajectory storage in tracking action
class MyTrackingAction : public G4UserTrackingAction
{
public:
    void PreUserTrackingAction(const G4Track* track) override {
        // Store all trajectories
        fpTrackingManager->SetStoreTrajectory(1);
    }

    void PostUserTrackingAction(const G4Track* track) override {
        G4VTrajectory* trajectory = fpTrackingManager->GimmeTrajectory();

        if (trajectory) {
            G4cout << "Track " << trajectory->GetTrackID()
                   << ": " << trajectory->GetParticleName()
                   << " with " << trajectory->GetPointEntries()
                   << " points" << G4endl;
        }
    }
};
```

### Selective Trajectory Storage

```cpp
void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    G4bool storeTrajectory = false;

    // Store primaries
    if (track->GetParentID() == 0) {
        storeTrajectory = true;
    }
    // Store high-energy electrons
    else if (track->GetDefinition()->GetParticleName() == "e-" &&
             track->GetKineticEnergy() > 1.0*MeV) {
        storeTrajectory = true;
    }
    // Store all gammas
    else if (track->GetDefinition()->GetParticleName() == "gamma") {
        storeTrajectory = true;
    }

    fpTrackingManager->SetStoreTrajectory(storeTrajectory ? 1 : 0);
}
```

### Trajectory Analysis

```cpp
void AnalyzeTrajectory(const G4VTrajectory* trajectory)
{
    // Basic information
    G4int trackID = trajectory->GetTrackID();
    G4String particle = trajectory->GetParticleName();
    G4int nPoints = trajectory->GetPointEntries();

    G4cout << "\n=== Trajectory Analysis ===" << G4endl;
    G4cout << "Track " << trackID << ": " << particle << G4endl;

    // Initial conditions
    G4double initialKE = 0.0;
    if (const G4Trajectory* traj = dynamic_cast<const G4Trajectory*>(trajectory)) {
        initialKE = traj->GetInitialKineticEnergy();
        G4ThreeVector initialP = traj->GetInitialMomentum();
        G4cout << "Initial KE: " << initialKE/MeV << " MeV" << G4endl;
        G4cout << "Initial momentum: " << initialP/MeV << " MeV/c" << G4endl;
    }

    // Path analysis
    if (nPoints > 1) {
        G4VTrajectoryPoint* firstPoint = trajectory->GetPoint(0);
        G4VTrajectoryPoint* lastPoint = trajectory->GetPoint(nPoints-1);

        G4ThreeVector startPos = firstPoint->GetPosition();
        G4ThreeVector endPos = lastPoint->GetPosition();
        G4double displacement = (endPos - startPos).mag();

        G4cout << "Number of points: " << nPoints << G4endl;
        G4cout << "Start position: " << startPos/cm << " cm" << G4endl;
        G4cout << "End position: " << endPos/cm << " cm" << G4endl;
        G4cout << "Displacement: " << displacement/cm << " cm" << G4endl;

        // Calculate path length (approximate)
        G4double pathLength = 0.0;
        for (G4int i = 1; i < nPoints; ++i) {
            G4ThreeVector pos1 = trajectory->GetPoint(i-1)->GetPosition();
            G4ThreeVector pos2 = trajectory->GetPoint(i)->GetPosition();
            pathLength += (pos2 - pos1).mag();
        }
        G4cout << "Path length: " << pathLength/cm << " cm" << G4endl;
        G4cout << "Path/displacement ratio: " << pathLength/displacement << G4endl;
    }
}
```

### Trajectory Filtering and Processing

```cpp
void ProcessEventTrajectories(const G4Event* event)
{
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    G4int nTrajectories = container->entries();
    G4cout << "Event " << event->GetEventID()
           << " has " << nTrajectories << " trajectories" << G4endl;

    // Separate by particle type
    std::map<G4String, std::vector<G4VTrajectory*>> trajectoriesByParticle;

    for (G4int i = 0; i < nTrajectories; ++i) {
        G4VTrajectory* traj = (*container)[i];
        G4String particle = traj->GetParticleName();
        trajectoriesByParticle[particle].push_back(traj);
    }

    // Print summary
    for (const auto& [particle, trajectories] : trajectoriesByParticle) {
        G4cout << "  " << particle << ": "
               << trajectories.size() << " tracks" << G4endl;

        // Analyze each particle type
        AnalyzeParticleTrajectories(particle, trajectories);
    }
}

void AnalyzeParticleTrajectories(const G4String& particle,
                                  const std::vector<G4VTrajectory*>& trajectories)
{
    if (particle == "e-") {
        AnalyzeElectronTrajectories(trajectories);
    } else if (particle == "gamma") {
        AnalyzeGammaTrajectories(trajectories);
    }
    // ... other particle types
}
```

### Custom Trajectory Drawing

```cpp
void DrawCustomTrajectories(const G4Event* event)
{
    G4VVisManager* visManager = G4VVisManager::GetConcreteInstance();
    if (!visManager) return;

    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    for (G4int i = 0; i < container->entries(); ++i) {
        const G4VTrajectory* traj = (*container)[i];

        // Create polyline
        G4Polyline polyline;
        for (G4int j = 0; j < traj->GetPointEntries(); ++j) {
            G4VTrajectoryPoint* point = traj->GetPoint(j);
            polyline.push_back(point->GetPosition());
        }

        // Customize appearance
        G4VisAttributes attribs;

        // Color by particle
        if (traj->GetParticleName() == "e-") {
            attribs.SetColour(G4Colour::Red());
            attribs.SetLineWidth(2.0);
        } else if (traj->GetParticleName() == "gamma") {
            attribs.SetColour(G4Colour::Green());
            attribs.SetLineWidth(1.0);
        } else if (traj->GetParticleName() == "proton") {
            attribs.SetColour(G4Colour::Blue());
            attribs.SetLineWidth(3.0);
        } else {
            attribs.SetColour(G4Colour::White());
            attribs.SetLineWidth(1.0);
        }

        // Only draw primaries with solid line
        if (traj->GetParentID() == 0) {
            attribs.SetLineStyle(G4VisAttributes::solid);
        } else {
            attribs.SetLineStyle(G4VisAttributes::dashed);
        }

        polyline.SetVisAttributes(attribs);
        visManager->Draw(polyline);

        // Add markers at interaction points
        DrawInteractionMarkers(traj);
    }
}
```

### Trajectory Persistence

```cpp
void SaveTrajectoriesToFile(const G4Event* event, const G4String& filename)
{
    std::ofstream outfile(filename, std::ios::app);

    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    outfile << "# Event " << event->GetEventID() << G4endl;
    outfile << "# Number of trajectories: " << container->entries() << G4endl;

    for (G4int i = 0; i < container->entries(); ++i) {
        const G4VTrajectory* traj = (*container)[i];
        const G4Trajectory* stdTraj = dynamic_cast<const G4Trajectory*>(traj);

        if (stdTraj) {
            outfile << "Trajectory " << traj->GetTrackID() << G4endl;
            outfile << "  Particle: " << traj->GetParticleName() << G4endl;
            outfile << "  Parent: " << traj->GetParentID() << G4endl;
            outfile << "  PDG: " << traj->GetPDGEncoding() << G4endl;
            outfile << "  Charge: " << traj->GetCharge() << G4endl;
            outfile << "  Initial KE: " << stdTraj->GetInitialKineticEnergy()/MeV
                    << " MeV" << G4endl;
            outfile << "  Initial P: " << stdTraj->GetInitialMomentum()/MeV
                    << " MeV/c" << G4endl;
            outfile << "  Points: " << traj->GetPointEntries() << G4endl;

            // Save all points
            for (G4int j = 0; j < traj->GetPointEntries(); ++j) {
                G4VTrajectoryPoint* point = traj->GetPoint(j);
                G4ThreeVector pos = point->GetPosition();
                outfile << "    " << j << " " << pos/cm << " cm" << G4endl;
            }
        }
    }

    outfile.close();
}
```

## Performance Considerations

### Memory Usage

Each G4Trajectory stores:
- Basic info: ~120 bytes
- Each G4TrajectoryPoint: ~40 bytes
- For 100 points: ~4.1 KB per trajectory

**Example:**
```cpp
// Event with 10,000 tracks, average 50 points each:
// Memory ~ 10,000 * (120 + 50*40) = ~21 MB per event

// For high-statistics run: Can quickly exceed GB of RAM
```

### Optimization Strategies

**1. Selective Storage:**
```cpp
void PreUserTrackingAction(const G4Track* track) {
    // Only store primaries and high-energy secondaries
    if (track->GetParentID() == 0 ||
        track->GetKineticEnergy() > 10*MeV) {
        fpTrackingManager->SetStoreTrajectory(1);
    } else {
        fpTrackingManager->SetStoreTrajectory(0);
    }
}
```

**2. Point Reduction:**
```cpp
// For visualization, every Nth point is usually sufficient
class ThinTrajectory : public G4Trajectory {
    void AppendStep(const G4Step* aStep) override {
        if (++stepCount % 10 == 0) {  // Every 10th step
            G4Trajectory::AppendStep(aStep);
        }
    }
private:
    G4int stepCount = 0;
};
```

**3. Clear After Use:**
```cpp
void EndOfEventAction(const G4Event* event) {
    // Process trajectories
    ProcessTrajectories(event);

    // Clear if not needed for visualization
    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (container) {
        container->clearAndDestroy();
    }
}
```

## Thread Safety

::: warning Multi-Threading
- Trajectories are per-event, thread-local by design
- Each worker thread has independent trajectories
- G4Allocator is thread-local
- CloneForMaster() supports sub-event parallelism
:::

**Best Practices:**
- No synchronization needed for normal use
- Trajectories stay within their thread
- Master thread accumulates via CloneForMaster()

## Related Classes

### Base and Container
- [G4VTrajectory](g4vtrajectory.md) - Trajectory base class
- [G4TrajectoryContainer](g4trajectorycontainer.md) - Trajectory storage
- G4TrajectoryPoint - Position storage
- G4VTrajectoryPoint - Point base class

### Related Implementations
- G4SmoothTrajectory - Auxiliary point interpolation
- G4RichTrajectory - Additional momentum/energy info
- G4ClonedTrajectory - MT cloning support

### Tracking
- [G4TrackingManager](g4trackingmanager.md) - Creates/manages trajectories
- [G4UserTrackingAction](g4usertrackingaction.md) - Access in user code
- [G4Track](../track/api/g4track.md) - Source of trajectory data

### Event
- [G4Event](../event/api/g4event.md) - Stores trajectory container
- [G4EventManager](../event/api/g4eventmanager.md) - Event processing

## See Also

- [Tracking Module Overview](../overview.md)
- [Visualization](../../visualization/overview.md)
- [User Actions](../../run/overview.md#user-actions)

---

::: info Source Reference
Complete implementation in:
- Header: `source/tracking/include/G4Trajectory.hh`
- Source: `source/tracking/src/G4Trajectory.cc`
- Allocator: `source/tracking/include/trkgdefs.hh`
:::
