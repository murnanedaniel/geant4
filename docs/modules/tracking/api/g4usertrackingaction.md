# G4UserTrackingAction API Documentation

## Overview

`G4UserTrackingAction` is the base class for user-defined actions executed at the start and end of particle tracking. It provides hooks for track initialization and finalization, making it ideal for track filtering, trajectory management, and track-level data collection. This optional user action sits between event-level and step-level granularity, offering efficient access to complete track information.

::: tip Header File
**Location:** `source/tracking/include/G4UserTrackingAction.hh`
**Source:** `source/tracking/src/G4UserTrackingAction.cc`
:::

## Class Declaration

```cpp
class G4UserTrackingAction
{
  public:
    G4UserTrackingAction();
    virtual ~G4UserTrackingAction() = default;

    virtual void SetTrackingManagerPointer(G4TrackingManager* pValue);
    virtual void PreUserTrackingAction(const G4Track*) {}
    virtual void PostUserTrackingAction(const G4Track*) {}

  protected:
    G4TrackingManager* fpTrackingManager = nullptr;
};
```

## Key Characteristics

- **Optional User Action**: Not mandatory but commonly used
- **Track Lifecycle Hooks**: Pre and Post tracking actions
- **Efficient Filtering**: Good balance between granularity and performance
- **Trajectory Control**: Enable/disable trajectory storage per track
- **Read-Only Access**: Track object is const (cannot modify track state)

## Important Notes

::: warning Key Restrictions
- Track object is const in both methods - **cannot modify track**
- To kill tracks, use track->SetTrackStatus() before tracking begins
- Trajectories must be enabled before PreUserTrackingAction()
:::

::: tip When to Use
Use G4UserTrackingAction when you need:
- Track initialization/finalization logic
- Trajectory filtering (save only specific tracks)
- Parent-daughter relationship analysis
- Track-level statistics
- Particle type filtering

**Don't use** for step-by-step analysis - use G4UserSteppingAction for that.
:::

## Constructors and Destructor

### Constructor
`source/tracking/include/G4UserTrackingAction.hh:49`

```cpp
G4UserTrackingAction();
```

Default constructor initializing the tracking action.

**Example:**
```cpp
class MyTrackingAction : public G4UserTrackingAction {
public:
    MyTrackingAction() : G4UserTrackingAction() {
        fTrackCounter = 0;
    }

private:
    G4int fTrackCounter;
};
```

### Destructor
`source/tracking/include/G4UserTrackingAction.hh:50`

```cpp
virtual ~G4UserTrackingAction() = default;
```

Virtual destructor for proper cleanup in derived classes.

## Virtual Methods

### PreUserTrackingAction()
`source/tracking/include/G4UserTrackingAction.hh:55`

```cpp
virtual void PreUserTrackingAction(const G4Track*) {}
```

**Purpose:** Hook called before track processing begins

**Parameters:**
- `aTrack`: Pointer to G4Track object (const - read-only)

**When Called:**
- After track is created
- Before any steps are processed
- Once per track at track creation

**Use Cases:**
- Decide whether to save trajectory
- Extract initial track information
- Filter tracks by particle type
- Initialize track-level variables
- Print initial track information

**Example:**
```cpp
void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    // Get track information
    G4int trackID = track->GetTrackID();
    G4int parentID = track->GetParentID();
    G4String particleName = track->GetDefinition()->GetParticleName();
    G4double kineticEnergy = track->GetKineticEnergy();

    // Print primary particle info
    if (parentID == 0) {  // Primary particle
        G4cout << "Primary track " << trackID
               << ": " << particleName
               << " with energy " << kineticEnergy/MeV << " MeV" << G4endl;
    }

    // Selective trajectory storage
    if (particleName == "gamma" || particleName == "e-" || particleName == "e+") {
        // Store trajectory for EM particles
        fpTrackingManager->SetStoreTrajectory(true);
    } else {
        // Don't store trajectory for other particles
        fpTrackingManager->SetStoreTrajectory(false);
    }

    // Track only high-energy particles
    if (kineticEnergy < 1.0*keV && parentID != 0) {
        // Kill low-energy secondaries (not primaries)
        const_cast<G4Track*>(track)->SetTrackStatus(fStopAndKill);
    }
}
```

**Common Patterns:**
```cpp
// Pattern 1: Trajectory filtering by particle type
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    G4String particleName = track->GetDefinition()->GetParticleName();

    // Only save electron and photon trajectories
    if (particleName == "e-" || particleName == "gamma") {
        fpTrackingManager->SetStoreTrajectory(true);
    } else {
        fpTrackingManager->SetStoreTrajectory(false);
    }
}

// Pattern 2: Save only primary tracks
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    if (track->GetParentID() == 0) {  // Primary particle
        fpTrackingManager->SetStoreTrajectory(true);
    } else {
        fpTrackingManager->SetStoreTrajectory(false);
    }
}

// Pattern 3: Energy threshold filtering
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    if (track->GetKineticEnergy() > 1.0*MeV) {
        fpTrackingManager->SetStoreTrajectory(true);
    } else {
        fpTrackingManager->SetStoreTrajectory(false);
    }
}

// Pattern 4: Particle counting
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    G4String particleName = track->GetDefinition()->GetParticleName();
    fParticleCount[particleName]++;
}
```

### PostUserTrackingAction()
`source/tracking/include/G4UserTrackingAction.hh:56`

```cpp
virtual void PostUserTrackingAction(const G4Track*) {}
```

**Purpose:** Hook called after track processing completes

**Parameters:**
- `aTrack`: Pointer to G4Track object (const - read-only)

**When Called:**
- After all steps for the track are complete
- After track is stopped or killed
- Once per track at track completion

**Use Cases:**
- Extract final track information
- Analyze complete track history
- Collect track statistics
- Print final track information
- Access trajectory if stored

**Example:**
```cpp
void MyTrackingAction::PostUserTrackingAction(const G4Track* track)
{
    // Get track information
    G4int trackID = track->GetTrackID();
    G4String particleName = track->GetDefinition()->GetParticleName();
    G4double trackLength = track->GetTrackLength();
    G4TrackStatus status = track->GetTrackStatus();

    // Print track summary
    G4cout << "Track " << trackID << " (" << particleName << ") "
           << "traveled " << trackLength/mm << " mm" << G4endl;

    // Analyze why track stopped
    if (status == fStopAndKill) {
        G4cout << "  Track killed" << G4endl;
    } else if (status == fStopButAlive) {
        G4cout << "  Track stopped but alive" << G4endl;
    }

    // Access trajectory if stored
    G4VTrajectory* trajectory = fpTrackingManager->GimmeTrajectory();
    if (trajectory) {
        G4int nPoints = trajectory->GetPointEntries();
        G4cout << "  Trajectory has " << nPoints << " points" << G4endl;
    }

    // Collect statistics
    if (track->GetParentID() == 0) {  // Primary
        fPrimaryTrackLength += trackLength;
    } else {  // Secondary
        fSecondaryTrackLength += trackLength;
    }
}
```

**Common Patterns:**
```cpp
// Pattern 1: Track statistics
void MyTrackingAction::PostUserTrackingAction(const G4Track* track) {
    G4double trackLength = track->GetTrackLength();
    G4int nSteps = track->GetCurrentStepNumber();

    fTotalTrackLength += trackLength;
    fTotalSteps += nSteps;
}

// Pattern 2: Analysis by particle type
void MyTrackingAction::PostUserTrackingAction(const G4Track* track) {
    G4String particleName = track->GetDefinition()->GetParticleName();
    G4double trackLength = track->GetTrackLength();

    fTrackLengthByParticle[particleName] += trackLength;
}

// Pattern 3: Check track completion
void MyTrackingAction::PostUserTrackingAction(const G4Track* track) {
    if (track->GetTrackStatus() == fStopAndKill) {
        G4cout << "Track " << track->GetTrackID()
               << " was killed" << G4endl;
    }
}

// Pattern 4: Trajectory analysis
void MyTrackingAction::PostUserTrackingAction(const G4Track* track) {
    G4VTrajectory* trajectory = fpTrackingManager->GimmeTrajectory();

    if (trajectory) {
        AnalyzeTrajectory(trajectory);
    }
}
```

### SetTrackingManagerPointer()
`source/tracking/include/G4UserTrackingAction.hh:54`

```cpp
virtual void SetTrackingManagerPointer(G4TrackingManager* pValue);
```

**Purpose:** Set pointer to tracking manager (called by framework)

**Parameters:**
- `pValue`: Pointer to G4TrackingManager

::: warning Internal Use
This method is called by G4TrackingManager. Users typically **do not** need to call or override this.
:::

## Protected Members

### fpTrackingManager
`source/tracking/include/G4UserTrackingAction.hh:59`

```cpp
protected:
    G4TrackingManager* fpTrackingManager = nullptr;
```

**Purpose:** Pointer to tracking manager

**Access:** Protected - available to derived classes

**Use:** Control trajectory storage and access trajectories

**Example:**
```cpp
void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    // Use tracking manager to control trajectory storage
    if (track->GetKineticEnergy() > fEnergyThreshold) {
        fpTrackingManager->SetStoreTrajectory(true);
    } else {
        fpTrackingManager->SetStoreTrajectory(false);
    }
}

void MyTrackingAction::PostUserTrackingAction(const G4Track* track)
{
    // Access stored trajectory
    G4VTrajectory* trajectory = fpTrackingManager->GimmeTrajectory();
    if (trajectory) {
        // Process trajectory
    }
}
```

## Complete Usage Examples

### Basic Tracking Action

```cpp
// MyTrackingAction.hh
#ifndef MyTrackingAction_h
#define MyTrackingAction_h 1

#include "G4UserTrackingAction.hh"
#include "globals.hh"

class G4Track;

class MyTrackingAction : public G4UserTrackingAction
{
public:
    MyTrackingAction();
    virtual ~MyTrackingAction() = default;

    virtual void PreUserTrackingAction(const G4Track*) override;
    virtual void PostUserTrackingAction(const G4Track*) override;

private:
    G4int fPrimaryCount;
    G4int fSecondaryCount;
};

#endif

// MyTrackingAction.cc
#include "MyTrackingAction.hh"
#include "G4Track.hh"
#include "G4TrackingManager.hh"

MyTrackingAction::MyTrackingAction()
    : G4UserTrackingAction(),
      fPrimaryCount(0),
      fSecondaryCount(0)
{}

void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    if (track->GetParentID() == 0) {
        fPrimaryCount++;
    } else {
        fSecondaryCount++;
    }
}

void MyTrackingAction::PostUserTrackingAction(const G4Track* track)
{
    G4cout << "Track " << track->GetTrackID() << " completed" << G4endl;
}
```

### Trajectory Filtering

```cpp
class MyTrackingAction : public G4UserTrackingAction
{
public:
    MyTrackingAction();
    virtual void PreUserTrackingAction(const G4Track*) override;

private:
    G4double fEnergyThreshold;
    std::vector<G4String> fParticlesToSave;
};

MyTrackingAction::MyTrackingAction()
    : G4UserTrackingAction(),
      fEnergyThreshold(1.0*MeV)
{
    // Define particles to save
    fParticlesToSave.push_back("gamma");
    fParticlesToSave.push_back("e-");
    fParticlesToSave.push_back("e+");
}

void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    G4String particleName = track->GetDefinition()->GetParticleName();
    G4double energy = track->GetKineticEnergy();

    // Check if particle type should be saved
    bool saveParticle = false;
    for (const auto& name : fParticlesToSave) {
        if (particleName == name) {
            saveParticle = true;
            break;
        }
    }

    // Save trajectory if particle matches AND energy is above threshold
    if (saveParticle && energy > fEnergyThreshold) {
        fpTrackingManager->SetStoreTrajectory(true);
    } else {
        fpTrackingManager->SetStoreTrajectory(false);
    }
}
```

### Particle Statistics Collection

```cpp
#include <map>

class MyTrackingAction : public G4UserTrackingAction
{
public:
    MyTrackingAction();
    virtual void PreUserTrackingAction(const G4Track*) override;
    virtual void PostUserTrackingAction(const G4Track*) override;

    void PrintStatistics() const;
    void Reset();

private:
    std::map<G4String, G4int> fParticleCount;
    std::map<G4String, G4double> fTotalTrackLength;
    std::map<G4String, G4double> fTotalEnergy;
};

MyTrackingAction::MyTrackingAction()
    : G4UserTrackingAction()
{}

void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    G4String particleName = track->GetDefinition()->GetParticleName();
    G4double energy = track->GetKineticEnergy();

    // Count particles
    fParticleCount[particleName]++;

    // Sum initial energies
    fTotalEnergy[particleName] += energy;
}

void MyTrackingAction::PostUserTrackingAction(const G4Track* track)
{
    G4String particleName = track->GetDefinition()->GetParticleName();
    G4double trackLength = track->GetTrackLength();

    // Sum track lengths
    fTotalTrackLength[particleName] += trackLength;
}

void MyTrackingAction::PrintStatistics() const
{
    G4cout << "\n=== Particle Statistics ===" << G4endl;
    for (const auto& entry : fParticleCount) {
        G4String name = entry.first;
        G4int count = entry.second;
        G4double avgLength = fTotalTrackLength.at(name) / count;
        G4double avgEnergy = fTotalEnergy.at(name) / count;

        G4cout << name << ": " << count << " tracks, "
               << "avg length = " << avgLength/mm << " mm, "
               << "avg energy = " << avgEnergy/MeV << " MeV" << G4endl;
    }
}

void MyTrackingAction::Reset()
{
    fParticleCount.clear();
    fTotalTrackLength.clear();
    fTotalEnergy.clear();
}
```

### Primary vs Secondary Analysis

```cpp
class MyTrackingAction : public G4UserTrackingAction
{
public:
    virtual void PreUserTrackingAction(const G4Track*) override;
    virtual void PostUserTrackingAction(const G4Track*) override;

private:
    G4int fPrimaryTracks;
    G4int fSecondaryTracks;
    G4double fPrimaryTrackLength;
    G4double fSecondaryTrackLength;
};

void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    if (track->GetParentID() == 0) {
        fPrimaryTracks++;
        // Always save primary trajectories
        fpTrackingManager->SetStoreTrajectory(true);
    } else {
        fSecondaryTracks++;
        // Selectively save secondary trajectories
        if (track->GetKineticEnergy() > 100*keV) {
            fpTrackingManager->SetStoreTrajectory(true);
        } else {
            fpTrackingManager->SetStoreTrajectory(false);
        }
    }
}

void MyTrackingAction::PostUserTrackingAction(const G4Track* track)
{
    G4double trackLength = track->GetTrackLength();

    if (track->GetParentID() == 0) {
        fPrimaryTrackLength += trackLength;
    } else {
        fSecondaryTrackLength += trackLength;
    }
}
```

### Track Killing Based on Conditions

```cpp
class MyTrackingAction : public G4UserTrackingAction
{
public:
    MyTrackingAction();
    virtual void PreUserTrackingAction(const G4Track*) override;

private:
    G4double fMinEnergy;
    G4double fMaxTrackLength;
};

MyTrackingAction::MyTrackingAction()
    : G4UserTrackingAction(),
      fMinEnergy(1.0*keV),
      fMaxTrackLength(100*m)
{}

void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    // Kill low-energy secondaries
    if (track->GetParentID() != 0 &&
        track->GetKineticEnergy() < fMinEnergy) {
        const_cast<G4Track*>(track)->SetTrackStatus(fStopAndKill);
        return;
    }

    // Kill tracks that would travel too far
    // (approximate based on initial energy and direction)
    G4ThreeVector position = track->GetPosition();
    if (position.mag() > fMaxTrackLength) {
        const_cast<G4Track*>(track)->SetTrackStatus(fStopAndKill);
        return;
    }
}
```

### With Event Information Integration

```cpp
class MyTrackingAction : public G4UserTrackingAction
{
public:
    virtual void PreUserTrackingAction(const G4Track*) override;
    virtual void PostUserTrackingAction(const G4Track*) override;
};

void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    // Get event information
    const G4Event* event =
        G4RunManager::GetRunManager()->GetCurrentEvent();
    auto eventInfo =
        static_cast<MyEventInfo*>(event->GetUserInformation());

    if (eventInfo) {
        // Record track creation
        eventInfo->IncrementTrackCount();

        if (track->GetParentID() == 0) {
            eventInfo->SetPrimaryParticle(
                track->GetDefinition()->GetParticleName());
        }
    }
}

void MyTrackingAction::PostUserTrackingAction(const G4Track* track)
{
    // Update event info with final track statistics
    const G4Event* event =
        G4RunManager::GetRunManager()->GetCurrentEvent();
    auto eventInfo =
        static_cast<MyEventInfo*>(event->GetUserInformation());

    if (eventInfo) {
        eventInfo->AddTrackLength(track->GetTrackLength());
    }
}
```

### Multi-threaded Application

```cpp
class MyTrackingAction : public G4UserTrackingAction
{
public:
    MyTrackingAction();
    virtual void PreUserTrackingAction(const G4Track*) override;

private:
    G4ThreadLocal static std::map<G4String, G4int> fParticleCount;
};

// Initialize thread-local map
G4ThreadLocal std::map<G4String, G4int>
    MyTrackingAction::fParticleCount;

void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    // Each thread has its own particle count map
    G4String particleName = track->GetDefinition()->GetParticleName();
    fParticleCount[particleName]++;

    // Thread-safe trajectory control
    if (track->GetKineticEnergy() > 1.0*MeV) {
        fpTrackingManager->SetStoreTrajectory(true);
    } else {
        fpTrackingManager->SetStoreTrajectory(false);
    }
}
```

## Registration Pattern

```cpp
// In MyActionInitialization::Build()
#include "MyTrackingAction.hh"

void MyActionInitialization::Build() const
{
    SetUserAction(new MyPrimaryGenerator);
    SetUserAction(new MyRunAction);
    SetUserAction(new MyEventAction);

    // Register tracking action (optional)
    SetUserAction(new MyTrackingAction);

    // Stepping action (if needed)
    // SetUserAction(new MySteppingAction);
}
```

## Track Information Access

### Basic Track Information
```cpp
void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    // Identifiers
    G4int trackID = track->GetTrackID();
    G4int parentID = track->GetParentID();

    // Particle
    G4ParticleDefinition* particle = track->GetDefinition();
    G4String particleName = particle->GetParticleName();
    G4int PDG = particle->GetPDGEncoding();

    // Kinematics
    G4double kineticEnergy = track->GetKineticEnergy();
    G4double totalEnergy = track->GetTotalEnergy();
    G4ThreeVector momentum = track->GetMomentum();
    G4ThreeVector direction = track->GetMomentumDirection();

    // Position and time
    G4ThreeVector position = track->GetPosition();
    G4double globalTime = track->GetGlobalTime();
    G4double localTime = track->GetLocalTime();

    // Volume
    G4VPhysicalVolume* volume = track->GetVolume();
    G4String volumeName = volume->GetName();

    // Creation info
    G4String creatorProcess = "";
    const G4VProcess* creator = track->GetCreatorProcess();
    if (creator) {
        creatorProcess = creator->GetProcessName();
    }
}
```

### Post-Tracking Information
```cpp
void MyTrackingAction::PostUserTrackingAction(const G4Track* track)
{
    // Track history
    G4double trackLength = track->GetTrackLength();
    G4int nSteps = track->GetCurrentStepNumber();

    // Final status
    G4TrackStatus status = track->GetTrackStatus();

    // Weight (for variance reduction)
    G4double weight = track->GetWeight();

    // Trajectory
    G4VTrajectory* trajectory = fpTrackingManager->GimmeTrajectory();
    if (trajectory) {
        G4int nPoints = trajectory->GetPointEntries();
        // Process trajectory points
    }
}
```

## Thread Safety

### Sequential Mode
- Single instance of MyTrackingAction
- Pre/PostUserTrackingAction() called for every track
- Simple linear execution

### Multi-threaded Mode
- **Separate instance per worker thread**
- Each thread processes independent events and tracks
- No synchronization needed between threads
- Use G4ThreadLocal for thread-local data

### Thread-Safe Practices

::: tip Best Practices
1. **Thread-Local Storage**: Use G4ThreadLocal for counters and maps
2. **No Shared State**: Avoid static or global variables
3. **Read-Only Access**: Track is const, safe to read
4. **Trajectory Storage**: Thread-safe when using fpTrackingManager
5. **No Cross-Thread Communication**: Each thread independent
:::

## Performance Considerations

1. **Moderate Frequency**: Called twice per track (less frequent than stepping)
2. **Trajectory Storage**: Enabling trajectories increases memory usage
3. **Selective Filtering**: Filter trajectories to save memory
4. **Lightweight Processing**: Keep Pre/Post actions efficient
5. **Statistics Collection**: Use maps/vectors for aggregation

## When to Use vs When to Avoid

### Use G4UserTrackingAction When:
- Need track-level statistics
- Filtering trajectories for visualization
- Analyzing parent-daughter relationships
- Counting particles by type
- Track length analysis

### Use G4UserSteppingAction Instead When:
- Need step-by-step information
- Analyzing specific processes
- Volume boundary detection
- Step-level scoring

### Use G4UserEventAction Instead When:
- Only need event-level totals
- Analyzing hits collections
- Event-level decisions

## Common Use Cases

### Use Case 1: Save Only Primary Trajectories
```cpp
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    fpTrackingManager->SetStoreTrajectory(track->GetParentID() == 0);
}
```

### Use Case 2: Count Particles
```cpp
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    fParticleCount[track->GetDefinition()->GetParticleName()]++;
}
```

### Use Case 3: Energy Spectrum
```cpp
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    if (track->GetParentID() == 0) {
        fPrimaryEnergySpectrum.push_back(track->GetKineticEnergy());
    }
}
```

### Use Case 4: Track Secondary Creation
```cpp
void MyTrackingAction::PreUserTrackingAction(const G4Track* track) {
    if (track->GetParentID() != 0) {
        const G4VProcess* creator = track->GetCreatorProcess();
        if (creator) {
            fSecondaryByProcess[creator->GetProcessName()]++;
        }
    }
}
```

## See Also

- [G4Track](../track/api/g4track.md) - Track data container
- [G4UserSteppingAction](g4usersteppingaction.md) - Step-level actions
- [G4UserEventAction](../event/api/g4usereventaction.md) - Event-level actions
- [G4UserRunAction](../run/api/g4userrunaction.md) - Run-level actions
- [G4VUserActionInitialization](../run/api/g4vuseractioninitialization.md) - Action registration

---

::: info Source Reference
Complete implementation in:
- Header: `source/tracking/include/G4UserTrackingAction.hh`
- Source: `source/tracking/src/G4UserTrackingAction.cc`
:::
