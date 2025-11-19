# G4VTrajectory API Documentation

## Overview

`G4VTrajectory` is the abstract base class for trajectory objects in Geant4. It defines the interface for storing and accessing the path history of a tracked particle, including trajectory points, particle properties, and track identification. Concrete implementations like `G4Trajectory`, `G4SmoothTrajectory`, and `G4RichTrajectory` inherit from this class to provide different levels of detail and functionality.

::: tip Header File
**Location:** `source/tracking/include/G4VTrajectory.hh`
**Source:** Inline methods in header file
:::

## Class Declaration

```cpp
class G4VTrajectory
{
 public:
  G4VTrajectory() = default;
  virtual ~G4VTrajectory() = default;

  // Equality operator
  G4bool operator==(const G4VTrajectory& right) const;

  // Cloning for multi-threading
  virtual G4VTrajectory* CloneForMaster() const;

  // Pure virtual accessors - must be implemented
  virtual G4int GetTrackID() const = 0;
  virtual G4int GetParentID() const = 0;
  virtual G4String GetParticleName() const = 0;
  virtual G4double GetCharge() const = 0;
  virtual G4int GetPDGEncoding() const = 0;
  virtual G4ThreeVector GetInitialMomentum() const = 0;
  virtual G4int GetPointEntries() const = 0;
  virtual G4VTrajectoryPoint* GetPoint(G4int i) const = 0;

  // Optional virtual methods with default implementation
  virtual void ShowTrajectory(std::ostream& os = G4cout) const;
  virtual void DrawTrajectory() const;
  virtual const std::map<G4String, G4AttDef>* GetAttDefs() const;
  virtual std::vector<G4AttValue>* CreateAttValues() const;

  // Smart pointer access for attribute values
  std::shared_ptr<std::vector<G4AttValue>> GetAttValues() const;

  // Methods called by G4TrackingManager
  virtual void AppendStep(const G4Step* aStep) = 0;
  virtual void MergeTrajectory(G4VTrajectory* secondTrajectory) = 0;

 protected:
  G4VTrajectory(const G4VTrajectory& right) = default;
  G4VTrajectory& operator=(const G4VTrajectory& right) = default;
  G4VTrajectory(G4VTrajectory&&) = default;
  G4VTrajectory& operator=(G4VTrajectory&&) = default;

 private:
  mutable std::shared_ptr<std::vector<G4AttValue>> fpAttValues;
};
```

## Key Characteristics

- **Abstract Base Class**: Cannot be instantiated directly
- **Interface Definition**: Defines contract for all trajectory implementations
- **Polymorphic**: Virtual methods allow different implementations
- **Visualization Support**: Built-in drawing and attribute support
- **Thread-Safe Cloning**: Support for multi-threaded event merging
- **Flexible**: Derived classes can add custom information

## Pure Virtual Methods (Must Implement)

These methods **must** be implemented by any concrete trajectory class:

### GetTrackID()
`source/tracking/include/G4VTrajectory.hh:74`

```cpp
virtual G4int GetTrackID() const = 0;
```

**Purpose:** Returns the unique track ID

**Returns:** Track identification number (positive integer)

**Example Implementation:**
```cpp
// In G4Trajectory.hh
inline G4int GetTrackID() const override { return fTrackID; }
```

### GetParentID()
`source/tracking/include/G4VTrajectory.hh:75`

```cpp
virtual G4int GetParentID() const = 0;
```

**Purpose:** Returns the parent track ID

**Returns:** Parent track ID (0 for primary particles)

**Usage:** Enables parent-daughter relationship tracking

**Example Implementation:**
```cpp
// In G4Trajectory.hh
inline G4int GetParentID() const override { return fParentID; }
```

### GetParticleName()
`source/tracking/include/G4VTrajectory.hh:76`

```cpp
virtual G4String GetParticleName() const = 0;
```

**Purpose:** Returns the particle type name

**Returns:** Particle name (e.g., "e-", "gamma", "proton")

**Example Implementation:**
```cpp
inline G4String GetParticleName() const override { return ParticleName; }
```

### GetCharge()
`source/tracking/include/G4VTrajectory.hh:79`

```cpp
virtual G4double GetCharge() const = 0;
```

**Purpose:** Returns the particle charge

**Returns:** Charge in units of electron charge (e.g., -1.0 for electron)

**Note:** This is the dynamic particle charge, not the PDG definition charge

**Example Implementation:**
```cpp
inline G4double GetCharge() const override { return PDGCharge; }
```

### GetPDGEncoding()
`source/tracking/include/G4VTrajectory.hh:82`

```cpp
virtual G4int GetPDGEncoding() const = 0;
```

**Purpose:** Returns the PDG particle code

**Returns:** PDG encoding (e.g., 11 for e-, 22 for gamma, 2212 for proton)

**Returns:** 0 if particle has no PDG code

**Example Implementation:**
```cpp
inline G4int GetPDGEncoding() const override { return PDGEncoding; }
```

### GetInitialMomentum()
`source/tracking/include/G4VTrajectory.hh:85`

```cpp
virtual G4ThreeVector GetInitialMomentum() const = 0;
```

**Purpose:** Returns the momentum at track creation

**Returns:** Initial momentum 3-vector in global coordinates

**Example Implementation:**
```cpp
inline G4ThreeVector GetInitialMomentum() const override {
    return initialMomentum;
}
```

### GetPointEntries()
`source/tracking/include/G4VTrajectory.hh:88`

```cpp
virtual G4int GetPointEntries() const = 0;
```

**Purpose:** Returns the number of trajectory points stored

**Returns:** Number of points in the trajectory

**Usage:** Iterate through trajectory points

**Example Implementation:**
```cpp
G4int GetPointEntries() const override {
    return G4int(positionRecord->size());
}
```

### GetPoint()
`source/tracking/include/G4VTrajectory.hh:91`

```cpp
virtual G4VTrajectoryPoint* GetPoint(G4int i) const = 0;
```

**Purpose:** Returns the i-th trajectory point

**Parameters:**
- `i`: Index of the point (0 to GetPointEntries()-1)

**Returns:** Pointer to trajectory point

**Example Implementation:**
```cpp
G4VTrajectoryPoint* GetPoint(G4int i) const override {
    return (*positionRecord)[i];
}
```

### AppendStep()
`source/tracking/include/G4VTrajectory.hh:131`

```cpp
virtual void AppendStep(const G4Step* aStep) = 0;
```

**Purpose:** Adds step information to the trajectory

**Parameters:**
- `aStep`: The step to append

**Called By:** G4TrackingManager after each step (if trajectory storage enabled)

**Example Implementation:**
```cpp
void G4Trajectory::AppendStep(const G4Step* aStep) {
    positionRecord->push_back(
        new G4TrajectoryPoint(aStep->GetPostStepPoint()->GetPosition())
    );
}
```

### MergeTrajectory()
`source/tracking/include/G4VTrajectory.hh:132`

```cpp
virtual void MergeTrajectory(G4VTrajectory* secondTrajectory) = 0;
```

**Purpose:** Merges another trajectory into this one

**Parameters:**
- `secondTrajectory`: Trajectory to merge

**Usage:** Combining trajectories when track is suspended and resumed

**Example Implementation:**
```cpp
void G4Trajectory::MergeTrajectory(G4VTrajectory* secondTrajectory) {
    if (!secondTrajectory) return;

    G4Trajectory* second = dynamic_cast<G4Trajectory*>(secondTrajectory);
    if (!second) return;

    // Append all points from second trajectory
    G4int entries = second->GetPointEntries();
    for (G4int i = 1; i < entries; ++i) {  // Skip first point (duplicate)
        positionRecord->push_back(second->GetPoint(i));
    }
}
```

## Virtual Methods with Default Implementation

These methods have default implementations but can be overridden:

### ShowTrajectory()
`source/tracking/include/G4VTrajectory.hh:98`

```cpp
virtual void ShowTrajectory(std::ostream& os = G4cout) const;
```

**Purpose:** Prints trajectory information to output stream

**Parameters:**
- `os`: Output stream (default: G4cout)

**Default Implementation:** Prints using attribute values if available

**Example Override:**
```cpp
void MyTrajectory::ShowTrajectory(std::ostream& os) const {
    os << "Trajectory " << fTrackID
       << " (" << ParticleName << ")" << G4endl;
    os << "  Parent: " << fParentID << G4endl;
    os << "  Initial momentum: " << initialMomentum << G4endl;
    os << "  Points: " << GetPointEntries() << G4endl;
}
```

### DrawTrajectory()
`source/tracking/include/G4VTrajectory.hh:102`

```cpp
virtual void DrawTrajectory() const;
```

**Purpose:** Draws the trajectory in visualization

**Default Implementation:** Empty (does nothing)

**Example Override:**
```cpp
void G4Trajectory::DrawTrajectory() const {
    G4VVisManager* pVVisManager = G4VVisManager::GetConcreteInstance();
    if (!pVVisManager) return;

    // Create polyline from trajectory points
    G4Polyline pPolyline;
    for (G4int i = 0; i < GetPointEntries(); ++i) {
        G4VTrajectoryPoint* point = GetPoint(i);
        pPolyline.push_back(point->GetPosition());
    }

    // Draw with color based on particle charge
    G4Colour colour;
    if (PDGCharge < 0) colour = G4Colour(1., 0., 0.);      // Red for negative
    else if (PDGCharge > 0) colour = G4Colour(0., 0., 1.); // Blue for positive
    else colour = G4Colour(0., 1., 0.);                    // Green for neutral

    G4VisAttributes attribs(colour);
    pPolyline.SetVisAttributes(attribs);
    pVVisManager->Draw(pPolyline);
}
```

### GetAttDefs()
`source/tracking/include/G4VTrajectory.hh:108`

```cpp
virtual const std::map<G4String, G4AttDef>* GetAttDefs() const {
    return nullptr;
}
```

**Purpose:** Returns attribute definitions for picking and display

**Returns:** Map of attribute definitions, or nullptr

**Usage:** Defines what attributes are available for visualization tools

**Example Override:**
```cpp
const std::map<G4String, G4AttDef>* G4Trajectory::GetAttDefs() const {
    // Create static map of attribute definitions
    static std::map<G4String, G4AttDef>* definitions = nullptr;

    if (!definitions) {
        definitions = new std::map<G4String, G4AttDef>;
        (*definitions)["ID"] = G4AttDef("ID", "Track ID", "Physics", "ID", "G4int");
        (*definitions)["PID"] = G4AttDef("PID", "Parent ID", "Physics", "ID", "G4int");
        (*definitions)["PN"] = G4AttDef("PN", "Particle Name", "Physics", "", "G4String");
        // ... more definitions
    }

    return definitions;
}
```

### CreateAttValues()
`source/tracking/include/G4VTrajectory.hh:120`

```cpp
virtual std::vector<G4AttValue>* CreateAttValues() const {
    return nullptr;
}
```

**Purpose:** Creates attribute values for this trajectory

**Returns:** Vector of attribute values, or nullptr

**Note:** Caller takes ownership and must delete the returned vector

**Example Override:**
```cpp
std::vector<G4AttValue>* G4Trajectory::CreateAttValues() const {
    auto values = new std::vector<G4AttValue>;

    values->push_back(G4AttValue("ID", G4UIcommand::ConvertToString(fTrackID), ""));
    values->push_back(G4AttValue("PID", G4UIcommand::ConvertToString(fParentID), ""));
    values->push_back(G4AttValue("PN", ParticleName, ""));
    values->push_back(G4AttValue("Ch", G4UIcommand::ConvertToString(PDGCharge), ""));
    values->push_back(G4AttValue("PDG", G4UIcommand::ConvertToString(PDGEncoding), ""));

    return values;
}
```

## Non-Virtual Methods

### operator==
`source/tracking/include/G4VTrajectory.hh:66`

```cpp
G4bool operator==(const G4VTrajectory& right) const;
```

**Purpose:** Compares two trajectories for equality

**Returns:** True if trajectories are the same object (pointer comparison)

**Usage:**
```cpp
if (*trajectory1 == *trajectory2) {
    // Same trajectory object
}
```

### CloneForMaster()
`source/tracking/include/G4VTrajectory.hh:71`

```cpp
virtual G4VTrajectory* CloneForMaster() const;
```

**Purpose:** Creates a copy for the master thread in MT mode

**Returns:** Pointer to cloned trajectory, or nullptr (default)

**Usage:** Called in sub-event parallel mode to merge trajectories to master

**Default Implementation:** Returns nullptr (cloning not supported)

**Example Override:**
```cpp
G4VTrajectory* G4Trajectory::CloneForMaster() const {
    // Use master thread allocator
    G4Trajectory* clone = new G4Trajectory(*this);
    return clone;
}
```

### GetAttValues()
`source/tracking/include/G4VTrajectory.hh:128`

```cpp
std::shared_ptr<std::vector<G4AttValue>> GetAttValues() const;
```

**Purpose:** Smart pointer access to attribute values (cached)

**Returns:** Shared pointer to attribute values

**Advantage:** Automatically manages memory, caches result

**Usage:**
```cpp
const auto attValues = trajectory->GetAttValues();
if (attValues) {
    for (const auto& value : *attValues) {
        G4cout << value.GetName() << ": " << value.GetValue() << G4endl;
    }
    // No need to delete - shared_ptr handles cleanup
}
```

## Usage Examples

### Implementing a Custom Trajectory

```cpp
// MyCustomTrajectory.hh
#include "G4VTrajectory.hh"
#include "G4Allocator.hh"
#include <vector>

class MyCustomTrajectory : public G4VTrajectory
{
public:
    MyCustomTrajectory(const G4Track* aTrack);
    virtual ~MyCustomTrajectory();

    // Required pure virtual methods
    G4int GetTrackID() const override { return fTrackID; }
    G4int GetParentID() const override { return fParentID; }
    G4String GetParticleName() const override { return fParticleName; }
    G4double GetCharge() const override { return fCharge; }
    G4int GetPDGEncoding() const override { return fPDGCode; }
    G4ThreeVector GetInitialMomentum() const override { return fInitialMomentum; }

    G4int GetPointEntries() const override {
        return static_cast<G4int>(fPoints.size());
    }

    G4VTrajectoryPoint* GetPoint(G4int i) const override {
        return fPoints[i];
    }

    void AppendStep(const G4Step* aStep) override;
    void MergeTrajectory(G4VTrajectory* secondTrajectory) override;

    // Optional overrides
    void ShowTrajectory(std::ostream& os = G4cout) const override;
    void DrawTrajectory() const override;

    // Custom methods
    G4double GetTotalEnergyDeposit() const { return fTotalEdep; }
    G4int GetNumberOfInteractions() const { return fNInteractions; }

private:
    G4int fTrackID;
    G4int fParentID;
    G4String fParticleName;
    G4double fCharge;
    G4int fPDGCode;
    G4ThreeVector fInitialMomentum;

    std::vector<G4VTrajectoryPoint*> fPoints;

    // Custom data
    G4double fTotalEdep;
    G4int fNInteractions;
};

// MyCustomTrajectory.cc
MyCustomTrajectory::MyCustomTrajectory(const G4Track* aTrack)
    : G4VTrajectory(),
      fTrackID(aTrack->GetTrackID()),
      fParentID(aTrack->GetParentID()),
      fParticleName(aTrack->GetDefinition()->GetParticleName()),
      fCharge(aTrack->GetDefinition()->GetPDGCharge()),
      fPDGCode(aTrack->GetDefinition()->GetPDGEncoding()),
      fInitialMomentum(aTrack->GetMomentum()),
      fTotalEdep(0.0),
      fNInteractions(0)
{
    // Store initial point
    fPoints.push_back(new MyTrajectoryPoint(aTrack->GetPosition()));
}

MyCustomTrajectory::~MyCustomTrajectory()
{
    // Clean up trajectory points
    for (auto* point : fPoints) {
        delete point;
    }
    fPoints.clear();
}

void MyCustomTrajectory::AppendStep(const G4Step* aStep)
{
    // Add new trajectory point
    G4StepPoint* postPoint = aStep->GetPostStepPoint();
    fPoints.push_back(new MyTrajectoryPoint(postPoint->GetPosition()));

    // Update custom data
    fTotalEdep += aStep->GetTotalEnergyDeposit();

    const G4VProcess* process = postPoint->GetProcessDefinedStep();
    if (process && process->GetProcessType() != fTransportation) {
        fNInteractions++;
    }
}

void MyCustomTrajectory::MergeTrajectory(G4VTrajectory* secondTrajectory)
{
    MyCustomTrajectory* second = dynamic_cast<MyCustomTrajectory*>(secondTrajectory);
    if (!second) return;

    // Merge points (skip first as it's duplicate)
    for (G4int i = 1; i < second->GetPointEntries(); ++i) {
        fPoints.push_back(second->GetPoint(i));
    }

    // Merge custom data
    fTotalEdep += second->fTotalEdep;
    fNInteractions += second->fNInteractions;
}

void MyCustomTrajectory::ShowTrajectory(std::ostream& os) const
{
    os << "=== Custom Trajectory ===" << G4endl;
    os << "Track ID: " << fTrackID << G4endl;
    os << "Particle: " << fParticleName << G4endl;
    os << "Points: " << fPoints.size() << G4endl;
    os << "Total energy deposit: " << fTotalEdep/MeV << " MeV" << G4endl;
    os << "Number of interactions: " << fNInteractions << G4endl;
}
```

### Accessing Trajectory in User Action

```cpp
void MyTrackingAction::PostUserTrackingAction(const G4Track* track)
{
    // Get trajectory from tracking manager
    G4VTrajectory* trajectory = fpTrackingManager->GimmeTrajectory();

    if (trajectory) {
        // Access basic information
        G4int trackID = trajectory->GetTrackID();
        G4int parentID = trajectory->GetParentID();
        G4String particle = trajectory->GetParticleName();
        G4int nPoints = trajectory->GetPointEntries();

        G4cout << "Trajectory " << trackID << " (" << particle << ")"
               << " has " << nPoints << " points" << G4endl;

        // Iterate through trajectory points
        for (G4int i = 0; i < nPoints; ++i) {
            G4VTrajectoryPoint* point = trajectory->GetPoint(i);
            G4ThreeVector pos = point->GetPosition();
            G4cout << "  Point " << i << ": " << pos/mm << " mm" << G4endl;
        }

        // Show trajectory
        trajectory->ShowTrajectory();

        // If custom trajectory, access custom data
        MyCustomTrajectory* customTraj =
            dynamic_cast<MyCustomTrajectory*>(trajectory);
        if (customTraj) {
            G4double edep = customTraj->GetTotalEnergyDeposit();
            G4int nInt = customTraj->GetNumberOfInteractions();
            G4cout << "  Custom data: Edep=" << edep/MeV
                   << " MeV, Interactions=" << nInt << G4endl;
        }
    }
}
```

### Trajectory Storage and Retrieval

```cpp
// Enable custom trajectory in tracking action
void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    // Create and set custom trajectory
    MyCustomTrajectory* trajectory = new MyCustomTrajectory(track);
    fpTrackingManager->SetTrajectory(trajectory);
}

// Retrieve from event
void MyEventAction::EndOfEventAction(const G4Event* event)
{
    G4TrajectoryContainer* trajectoryContainer = event->GetTrajectoryContainer();

    if (trajectoryContainer) {
        G4int nTrajectories = trajectoryContainer->entries();
        G4cout << "Event has " << nTrajectories << " trajectories" << G4endl;

        for (G4int i = 0; i < nTrajectories; ++i) {
            G4VTrajectory* trajectory = (*trajectoryContainer)[i];

            // Analyze trajectory
            AnalyzeTrajectory(trajectory);

            // Custom trajectory access
            MyCustomTrajectory* customTraj =
                dynamic_cast<MyCustomTrajectory*>(trajectory);
            if (customTraj) {
                // Access custom data
                ProcessCustomTrajectory(customTraj);
            }
        }
    }
}
```

### Visualization with Trajectories

```cpp
void DrawTrajectories(const G4Event* event)
{
    G4VVisManager* visManager = G4VVisManager::GetConcreteInstance();
    if (!visManager) return;

    G4TrajectoryContainer* container = event->GetTrajectoryContainer();
    if (!container) return;

    // Draw all trajectories
    for (auto* trajectory : *container->GetVector()) {
        // Let trajectory draw itself
        trajectory->DrawTrajectory();

        // Or customize drawing
        G4Polyline polyline;
        for (G4int i = 0; i < trajectory->GetPointEntries(); ++i) {
            G4VTrajectoryPoint* point = trajectory->GetPoint(i);
            polyline.push_back(point->GetPosition());
        }

        // Color by particle type
        G4Colour colour = GetParticleColor(trajectory->GetParticleName());
        polyline.SetVisAttributes(G4VisAttributes(colour));

        visManager->Draw(polyline);
    }
}

G4Colour GetParticleColor(const G4String& particleName)
{
    if (particleName == "e-") return G4Colour::Red();
    if (particleName == "e+") return G4Colour::Blue();
    if (particleName == "gamma") return G4Colour::Green();
    if (particleName == "proton") return G4Colour::Yellow();
    return G4Colour::White();
}
```

## Thread Safety

::: warning Multi-Threading Considerations
- Trajectories are stored per-event
- Each worker thread processes independent events
- Trajectories are thread-local by design
- `CloneForMaster()` enables trajectory merging in sub-event parallel mode
:::

**Best Practices:**
- No need for thread synchronization
- Trajectories belong to their thread's event
- CloneForMaster() must use master thread allocator

## Performance Considerations

### Memory Usage

Trajectories can consume significant memory:

```cpp
// Approximate memory per trajectory:
// - Basic info: ~100 bytes
// - Per point: ~50-200 bytes (depends on point type)
// - Rich trajectory: Much more

// For event with 10,000 tracks, each with 100 points:
// Memory ~ 10,000 * (100 + 100*100) = ~100 MB
```

**Optimization Strategies:**

1. **Selective Storage:**
```cpp
void PreUserTrackingAction(const G4Track* track) {
    // Only store important particles
    if (track->GetParentID() == 0 ||  // Primaries
        track->GetKineticEnergy() > 10*MeV) {  // High energy
        fpTrackingManager->SetStoreTrajectory(1);
    }
}
```

2. **Point Thinning:**
```cpp
void AppendStep(const G4Step* aStep) {
    // Only store every Nth point
    static G4int counter = 0;
    if (++counter % 5 == 0) {  // Store every 5th point
        fPoints.push_back(new MyTrajectoryPoint(
            aStep->GetPostStepPoint()->GetPosition()
        ));
    }
}
```

3. **Smart Point Selection:**
```cpp
void AppendStep(const G4Step* aStep) {
    G4ThreeVector newPos = aStep->GetPostStepPoint()->GetPosition();

    // Store point if significant direction change or boundary
    if (fPoints.size() > 0) {
        G4ThreeVector oldPos = fPoints.back()->GetPosition();
        G4double angle = (newPos - oldPos).angle(fLastDirection);

        if (angle > 0.1 ||  // Significant scattering
            aStep->GetPostStepPoint()->GetStepStatus() == fGeomBoundary) {
            fPoints.push_back(new MyTrajectoryPoint(newPos));
            fLastDirection = newPos - oldPos;
        }
    }
}
```

## Related Classes

### Concrete Implementations
- [G4Trajectory](g4trajectory.md) - Standard trajectory implementation
- G4SmoothTrajectory - Smoothed trajectory for visualization
- G4RichTrajectory - Trajectory with additional information

### Trajectory Components
- [G4TrajectoryContainer](g4trajectorycontainer.md) - Container for trajectories
- G4VTrajectoryPoint - Base class for trajectory points
- G4TrajectoryPoint - Standard trajectory point

### Tracking
- [G4TrackingManager](g4trackingmanager.md) - Manages trajectory creation
- [G4UserTrackingAction](g4usertrackingaction.md) - Access trajectories in user code
- [G4Track](../../track/api/g4track.md) - Track information

### Event
- [G4Event](../../event/api/g4event.md) - Event containing trajectories
- [G4EventManager](../../event/api/g4eventmanager.md) - Event processing

## See Also

- [Tracking Module Overview](../overview.md)
- [Visualization Guide](../../visualization/overview.md)
- [User Actions](../../../run/overview.md#user-actions)

---

::: info Source Reference
Complete implementation in:
- Header: `source/tracking/include/G4VTrajectory.hh`
- Source: `source/tracking/src/G4VTrajectory.cc`
- Examples in concrete classes: G4Trajectory, G4SmoothTrajectory, G4RichTrajectory
:::
