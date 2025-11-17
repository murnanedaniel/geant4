# G4UserSteppingAction API Documentation

## Overview

`G4UserSteppingAction` is the base class for user-defined actions executed at the end of each simulation step. It provides the most granular level of control in Geant4, allowing users to inspect and analyze every step a particle takes. This optional user action is commonly used for detailed tracking analysis, trajectory filtering, and step-level data collection.

::: tip Header File
**Location:** `source/tracking/include/G4UserSteppingAction.hh`
**Source:** `source/tracking/src/G4UserSteppingAction.cc`
:::

## Class Declaration

```cpp
class G4UserSteppingAction
{
  public:
    G4UserSteppingAction();
    virtual ~G4UserSteppingAction() = default;

    virtual void SetSteppingManagerPointer(G4SteppingManager* pValue);
    virtual void UserSteppingAction(const G4Step*) {}

  protected:
    G4SteppingManager* fpSteppingManager = nullptr;
};
```

## Key Characteristics

- **Optional User Action**: Not mandatory, use only if step-level analysis needed
- **Highest Frequency**: Called at every step for every track
- **Performance Impact**: Can significantly slow simulation if used inefficiently
- **Detailed Access**: Full information about step, track, process, volume
- **Read-Only**: Step object is const (cannot be modified)

## Important Notes

::: warning Performance Impact
UserSteppingAction() is called for **EVERY STEP** of **EVERY TRACK**:
- Typical event: 1000s to millions of steps
- Keep implementation extremely lightweight
- Avoid expensive operations (I/O, complex calculations)
- Use sparingly - prefer tracking or event actions when possible
:::

::: tip When to Use
Use G4UserSteppingAction when you need:
- Step-by-step particle tracking
- Detailed trajectory analysis
- Step filtering for specific conditions
- Volume-crossing detection
- Process-specific information
- Custom scoring at step level

**Don't use** for simple event-level quantities - use G4UserEventAction instead.
:::

## Constructors and Destructor

### Constructor
`source/tracking/include/G4UserSteppingAction.hh:49`

```cpp
G4UserSteppingAction();
```

Default constructor initializing the stepping action.

**Example:**
```cpp
class MySteppingAction : public G4UserSteppingAction {
public:
    MySteppingAction() : G4UserSteppingAction() {
        fStepCounter = 0;
    }

private:
    G4int fStepCounter;
};
```

### Destructor
`source/tracking/include/G4UserSteppingAction.hh:50`

```cpp
virtual ~G4UserSteppingAction() = default;
```

Virtual destructor for proper cleanup in derived classes.

## Virtual Methods

### UserSteppingAction()
`source/tracking/include/G4UserSteppingAction.hh:55`

```cpp
virtual void UserSteppingAction(const G4Step*) {}
```

**Purpose:** Hook called at the end of every step

**Parameters:**
- `aStep`: Pointer to G4Step object (const - read-only)

**When Called:**
- After step is completed
- After all physics processes are applied
- Before next step begins

**Frequency:**
- Every step of every track
- Potentially millions of calls per event

**Use Cases:**
- Analyze step information
- Filter trajectories
- Collect detailed tracking data
- Detect volume boundaries
- Monitor specific processes
- Custom scoring

**Example:**
```cpp
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    // Get step information
    G4Track* track = step->GetTrack();
    G4StepPoint* preStepPoint = step->GetPreStepPoint();
    G4StepPoint* postStepPoint = step->GetPostStepPoint();

    // Get particle information
    G4String particleName = track->GetDefinition()->GetParticleName();
    G4double kineticEnergy = track->GetKineticEnergy();

    // Get volume information
    G4VPhysicalVolume* volume = preStepPoint->GetPhysicalVolume();
    G4String volumeName = volume->GetName();

    // Get step properties
    G4double stepLength = step->GetStepLength();
    G4double energyDeposit = step->GetTotalEnergyDeposit();

    // Example: Kill low-energy particles in specific volume
    if (volumeName == "Detector" && kineticEnergy < 1.0*keV) {
        track->SetTrackStatus(fStopAndKill);
    }

    // Example: Collect energy deposition
    if (energyDeposit > 0.) {
        fTotalEdep += energyDeposit;
    }

    // Example: Detect volume boundary crossing
    if (postStepPoint->GetStepStatus() == fGeomBoundary) {
        G4String nextVolume =
            postStepPoint->GetPhysicalVolume()->GetName();
        G4cout << particleName << " entered " << nextVolume << G4endl;
    }
}
```

**Common Patterns:**
```cpp
// Pattern 1: Energy deposition in specific volume
void MySteppingAction::UserSteppingAction(const G4Step* step) {
    G4String volumeName =
        step->GetPreStepPoint()->GetPhysicalVolume()->GetName();

    if (volumeName == "Detector") {
        G4double edep = step->GetTotalEnergyDeposit();
        if (edep > 0.) {
            fDetectorEdep += edep;
        }
    }
}

// Pattern 2: Kill particles in region
void MySteppingAction::UserSteppingAction(const G4Step* step) {
    G4Track* track = step->GetTrack();
    G4String volume =
        step->GetPreStepPoint()->GetPhysicalVolume()->GetName();

    if (volume == "Shielding" && track->GetKineticEnergy() < 10*keV) {
        track->SetTrackStatus(fStopAndKill);
    }
}

// Pattern 3: Trajectory filtering
void MySteppingAction::UserSteppingAction(const G4Step* step) {
    G4Track* track = step->GetTrack();

    // Only keep trajectories that enter detector
    if (step->GetPreStepPoint()->GetPhysicalVolume()->GetName() == "Detector") {
        track->SetTrackStatus(fKeepAndKill);  // Keep for visualization
    }
}

// Pattern 4: Detect specific process
void MySteppingAction::UserSteppingAction(const G4Step* step) {
    const G4VProcess* process =
        step->GetPostStepPoint()->GetProcessDefinedStep();

    if (process && process->GetProcessName() == "compt") {
        G4cout << "Compton scattering at "
               << step->GetPostStepPoint()->GetPosition() << G4endl;
    }
}
```

### SetSteppingManagerPointer()
`source/tracking/include/G4UserSteppingAction.hh:54`

```cpp
virtual void SetSteppingManagerPointer(G4SteppingManager* pValue);
```

**Purpose:** Set pointer to stepping manager (called by framework)

**Parameters:**
- `pValue`: Pointer to G4SteppingManager

::: warning Internal Use
This method is called by G4SteppingManager. Users typically **do not** need to call or override this.
:::

## Protected Members

### fpSteppingManager
`source/tracking/include/G4UserSteppingAction.hh:58`

```cpp
protected:
    G4SteppingManager* fpSteppingManager = nullptr;
```

**Purpose:** Pointer to stepping manager (advanced use)

**Access:** Protected - available to derived classes

**Use:** Access additional stepping information if needed

## Complete Usage Examples

### Basic Stepping Action

```cpp
// MySteppingAction.hh
#ifndef MySteppingAction_h
#define MySteppingAction_h 1

#include "G4UserSteppingAction.hh"
#include "globals.hh"

class G4Step;

class MySteppingAction : public G4UserSteppingAction
{
public:
    MySteppingAction();
    virtual ~MySteppingAction() = default;

    virtual void UserSteppingAction(const G4Step*) override;

private:
    G4double fTotalEdep;
};

#endif

// MySteppingAction.cc
#include "MySteppingAction.hh"
#include "G4Step.hh"
#include "G4Track.hh"
#include "G4StepPoint.hh"

MySteppingAction::MySteppingAction()
    : G4UserSteppingAction(),
      fTotalEdep(0.)
{}

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    // Get energy deposit
    G4double edep = step->GetTotalEnergyDeposit();

    // Get volume name
    G4VPhysicalVolume* volume =
        step->GetPreStepPoint()->GetPhysicalVolume();

    if (volume && volume->GetName() == "Detector" && edep > 0.) {
        fTotalEdep += edep;
    }
}
```

### Volume Boundary Detection

```cpp
class MySteppingAction : public G4UserSteppingAction
{
public:
    virtual void UserSteppingAction(const G4Step*) override;
};

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    // Check if particle crossed volume boundary
    G4StepPoint* postStepPoint = step->GetPostStepPoint();

    if (postStepPoint->GetStepStatus() == fGeomBoundary) {
        G4VPhysicalVolume* nextVolume = postStepPoint->GetPhysicalVolume();

        if (nextVolume && nextVolume->GetName() == "Detector") {
            G4Track* track = step->GetTrack();

            G4cout << "Particle "
                   << track->GetDefinition()->GetParticleName()
                   << " entered detector with energy "
                   << track->GetKineticEnergy()/MeV << " MeV" << G4endl;
        }
    }
}
```

### Trajectory Filtering

```cpp
class MySteppingAction : public G4UserSteppingAction
{
public:
    virtual void UserSteppingAction(const G4Step*) override;
};

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4Track* track = step->GetTrack();

    // Only save trajectories for particles entering detector
    G4String volumeName =
        step->GetPreStepPoint()->GetPhysicalVolume()->GetName();

    if (volumeName == "Detector") {
        // Mark track to be saved for visualization
        track->SetTrackStatus(fAlive);  // Continue tracking

        // Or kill but keep trajectory
        // track->SetTrackStatus(fStopAndKill);
    }

    // Kill low-energy particles outside detector
    if (volumeName != "Detector" &&
        track->GetKineticEnergy() < 10*keV) {
        track->SetTrackStatus(fStopAndKill);
    }
}
```

### Process-Specific Analysis

```cpp
class MySteppingAction : public G4UserSteppingAction
{
public:
    virtual void UserSteppingAction(const G4Step*) override;

private:
    G4int fComptonCount;
    G4int fPhotoelectricCount;
};

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    const G4VProcess* process =
        step->GetPostStepPoint()->GetProcessDefinedStep();

    if (process) {
        G4String processName = process->GetProcessName();

        if (processName == "compt") {
            fComptonCount++;

            G4cout << "Compton scattering at position: "
                   << step->GetPostStepPoint()->GetPosition()
                   << G4endl;

        } else if (processName == "phot") {
            fPhotoelectricCount++;

            G4cout << "Photoelectric effect, energy: "
                   << step->GetPreStepPoint()->GetKineticEnergy()/keV
                   << " keV" << G4endl;
        }
    }
}
```

### Custom Scoring

```cpp
class MySteppingAction : public G4UserSteppingAction
{
public:
    MySteppingAction();
    virtual void UserSteppingAction(const G4Step*) override;

    G4double GetDoseInDetector() const { return fDose; }
    void Reset() { fDose = 0.; }

private:
    G4double fDose;
    G4String fDetectorName;
};

MySteppingAction::MySteppingAction()
    : G4UserSteppingAction(),
      fDose(0.),
      fDetectorName("Detector")
{}

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4VPhysicalVolume* volume =
        step->GetPreStepPoint()->GetPhysicalVolume();

    if (volume && volume->GetName() == fDetectorName) {
        G4double edep = step->GetTotalEnergyDeposit();

        if (edep > 0.) {
            // Get mass of volume for dose calculation
            G4LogicalVolume* logicVolume = volume->GetLogicalVolume();
            G4Material* material = logicVolume->GetMaterial();
            G4double density = material->GetDensity();
            G4double volume = logicVolume->GetSolid()->GetCubicVolume();
            G4double mass = density * volume;

            // Calculate dose (energy/mass)
            fDose += edep / mass;
        }
    }
}
```

### Particle Killing Conditions

```cpp
class MySteppingAction : public G4UserSteppingAction
{
public:
    virtual void UserSteppingAction(const G4Step*) override;

private:
    G4double fMaxTrackLength = 10*m;
    G4double fMinEnergy = 1*keV;
};

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4Track* track = step->GetTrack();

    // Kill particles that traveled too far
    if (track->GetTrackLength() > fMaxTrackLength) {
        track->SetTrackStatus(fStopAndKill);
        return;
    }

    // Kill low-energy particles
    if (track->GetKineticEnergy() < fMinEnergy) {
        track->SetTrackStatus(fStopAndKill);
        return;
    }

    // Kill particles outside world
    G4VPhysicalVolume* volume =
        step->GetPostStepPoint()->GetPhysicalVolume();
    if (!volume) {  // Outside world
        track->SetTrackStatus(fStopAndKill);
    }
}
```

### With Event Information

```cpp
// Use with MyEventAction that sets user event information

class MySteppingAction : public G4UserSteppingAction
{
public:
    virtual void UserSteppingAction(const G4Step*) override;
};

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    // Get event information
    const G4Event* event =
        G4RunManager::GetRunManager()->GetCurrentEvent();

    auto eventInfo =
        static_cast<MyEventInfo*>(event->GetUserInformation());

    if (eventInfo) {
        G4double edep = step->GetTotalEnergyDeposit();

        if (edep > 0.) {
            eventInfo->AddEnergy(edep);
            eventInfo->AddHit();
        }
    }
}
```

### Multi-threaded Application

```cpp
class MySteppingAction : public G4UserSteppingAction
{
public:
    MySteppingAction();
    virtual void UserSteppingAction(const G4Step*) override;

private:
    G4ThreadLocal static G4int fStepCount;
};

// Initialize thread-local variable
G4ThreadLocal G4int MySteppingAction::fStepCount = 0;

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    // Each thread has its own counter
    fStepCount++;

    // Thread-safe operations only
    G4String volumeName =
        step->GetPreStepPoint()->GetPhysicalVolume()->GetName();

    if (volumeName == "Detector") {
        G4double edep = step->GetTotalEnergyDeposit();
        // Process step data...
    }
}
```

## Registration Pattern

```cpp
// In MyActionInitialization::Build()
#include "MySteppingAction.hh"

void MyActionInitialization::Build() const
{
    SetUserAction(new MyPrimaryGenerator);
    SetUserAction(new MyRunAction);
    SetUserAction(new MyEventAction);

    // Register stepping action (optional - use with caution)
    SetUserAction(new MySteppingAction);
}
```

## Step Information Access

### From G4Step
```cpp
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    // Step properties
    G4double stepLength = step->GetStepLength();
    G4double energyDeposit = step->GetTotalEnergyDeposit();
    G4double nonIonizingDeposit = step->GetNonIonizingEnergyDeposit();

    // Track
    G4Track* track = step->GetTrack();

    // Step points
    G4StepPoint* preStep = step->GetPreStepPoint();
    G4StepPoint* postStep = step->GetPostStepPoint();

    // Secondary particles
    const std::vector<const G4Track*>* secondaries =
        step->GetSecondaryInCurrentStep();
}
```

### From G4Track
```cpp
G4Track* track = step->GetTrack();

// Particle properties
G4ParticleDefinition* particle = track->GetDefinition();
G4String particleName = particle->GetParticleName();
G4double kineticEnergy = track->GetKineticEnergy();
G4double totalEnergy = track->GetTotalEnergy();

// Position and direction
G4ThreeVector position = track->GetPosition();
G4ThreeVector momentum = track->GetMomentumDirection();

// Track properties
G4int trackID = track->GetTrackID();
G4int parentID = track->GetParentID();
G4double trackLength = track->GetTrackLength();
G4double globalTime = track->GetGlobalTime();
```

### From G4StepPoint
```cpp
G4StepPoint* point = step->GetPreStepPoint();

// Position and momentum
G4ThreeVector position = point->GetPosition();
G4ThreeVector momentum = point->GetMomentum();

// Energy
G4double kineticEnergy = point->GetKineticEnergy();
G4double totalEnergy = point->GetTotalEnergy();

// Volume
G4VPhysicalVolume* volume = point->GetPhysicalVolume();
G4String volumeName = volume->GetName();

// Process
const G4VProcess* process = point->GetProcessDefinedStep();

// Status
G4StepStatus status = point->GetStepStatus();
```

## Thread Safety

### Sequential Mode
- Single instance of MySteppingAction
- UserSteppingAction() called for every step
- Simple linear execution

### Multi-threaded Mode
- **Separate instance per worker thread**
- Each thread processes independent events
- No synchronization needed between threads
- Use G4ThreadLocal for thread-local data

### Thread-Safe Practices

::: tip Best Practices
1. **Thread-Local Storage**: Use G4ThreadLocal for counters and accumulators
2. **No Shared State**: Avoid static or global variables
3. **Read-Only Access**: Step and track are const, safe to read
4. **No File I/O**: Extremely expensive at step level
5. **Lightweight Operations**: Keep processing minimal
:::

## Performance Optimization

::: warning Critical Performance Tips
1. **Minimize Work**: Only do what's absolutely necessary
2. **Early Return**: Check conditions and return early
3. **Cache Volume Names**: Store detector volume names, don't compare strings every step
4. **Avoid I/O**: Never write to files in UserSteppingAction
5. **Conditional Execution**: Use if-statements to limit processing
6. **Disable When Not Needed**: Comment out or don't register if not required
:::

### Optimized Example
```cpp
class MySteppingAction : public G4UserSteppingAction
{
public:
    MySteppingAction();
    virtual void UserSteppingAction(const G4Step*) override;

private:
    G4String fDetectorName;  // Cache detector name
    G4double fEdepThreshold;
};

MySteppingAction::MySteppingAction()
    : G4UserSteppingAction(),
      fDetectorName("Detector"),  // Initialize once
      fEdepThreshold(0.1*keV)
{}

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    // Early return if no energy deposit
    G4double edep = step->GetTotalEnergyDeposit();
    if (edep <= 0.) return;

    // Early return if below threshold
    if (edep < fEdepThreshold) return;

    // Check volume only if necessary
    G4VPhysicalVolume* volume =
        step->GetPreStepPoint()->GetPhysicalVolume();

    if (volume && volume->GetName() == fDetectorName) {
        // Minimal processing
        fTotalEdep += edep;
    }
}
```

## When to Use vs When to Avoid

### Use G4UserSteppingAction When:
- Need detailed step-by-step information
- Filtering tracks based on complex criteria
- Detecting specific physics processes
- Volume boundary analysis
- Custom step-level scoring

### Avoid G4UserSteppingAction When:
- Only need event-level statistics → use G4UserEventAction
- Only need track start/end → use G4UserTrackingAction
- Counting particles → use sensitive detectors
- General analysis → use hits collections

## See Also

- [G4Step](../track/api/g4step.md) - Step data container
- [G4Track](../track/api/g4track.md) - Track information
- [G4StepPoint](../track/api/g4steppoint.md) - Step point data
- [G4UserTrackingAction](g4usertrackingaction.md) - Track-level actions
- [G4UserEventAction](../event/api/g4usereventaction.md) - Event-level actions
- [G4VUserActionInitialization](../run/api/g4vuseractioninitialization.md) - Action registration

---

::: info Source Reference
Complete implementation in:
- Header: `source/tracking/include/G4UserSteppingAction.hh`
- Source: `source/tracking/src/G4UserSteppingAction.cc`
:::
