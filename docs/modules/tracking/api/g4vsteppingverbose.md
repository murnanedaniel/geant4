# G4VSteppingVerbose API Documentation

## Overview

`G4VSteppingVerbose` is the abstract base class for controlling verbose output during particle stepping in Geant4. It provides hooks for printing detailed step-by-step information about particle tracking, including positions, energies, processes, and volumes traversed. Users can inherit from this class to customize the verbosity format or implement specialized step-level debugging and monitoring.

::: tip Header File
**Location:** `source/tracking/include/G4VSteppingVerbose.hh`
**Source:** `source/tracking/src/G4VSteppingVerbose.cc`
:::

## Class Declaration

```cpp
class G4VSteppingVerbose
{
 public:
  virtual ~G4VSteppingVerbose();

  // Static methods for singleton pattern
  static void SetInstance(G4VSteppingVerbose* Instance);
  static G4VSteppingVerbose* GetInstance();
  static G4VSteppingVerbose* GetMasterInstance();
  static G4int GetSilent();
  static void SetSilent(G4int fSilent);
  static G4int GetSilentStepInfo();
  static void SetSilentStepInfo(G4int fSilent);

  // Cloning for multi-threading
  virtual G4VSteppingVerbose* Clone();

  // Pure virtual hooks - must be implemented
  virtual void NewStep() = 0;
  virtual void AtRestDoItInvoked() = 0;
  virtual void AlongStepDoItAllDone() = 0;
  virtual void PostStepDoItAllDone() = 0;
  virtual void AlongStepDoItOneByOne() = 0;
  virtual void PostStepDoItOneByOne() = 0;
  virtual void StepInfo() = 0;
  virtual void TrackingStarted() = 0;
  virtual void DPSLStarted() = 0;
  virtual void DPSLUserLimit() = 0;
  virtual void DPSLPostStep() = 0;
  virtual void DPSLAlongStep() = 0;
  virtual void VerboseTrack() = 0;
  virtual void VerboseParticleChange() = 0;

  // Configuration
  void CopyState();
  virtual void SetManager(G4SteppingManager* const);

 protected:
  G4VSteppingVerbose();  // Singleton

  static G4ThreadLocal G4VSteppingVerbose* fInstance;
  static G4VSteppingVerbose* fMasterInstance;
  G4TRACKING_DLL static G4ThreadLocal G4int Silent;
  G4TRACKING_DLL static G4ThreadLocal G4int SilentStepInfo;

  G4SteppingManager* fManager = nullptr;
  G4UserSteppingAction* fUserSteppingAction = nullptr;

  // [Many data members copied from stepping manager...]
};
```

## Key Characteristics

- **Abstract Base Class**: Must be inherited to implement
- **Singleton Pattern**: One instance per thread
- **Step-by-Step Output**: Detailed tracking information
- **Customizable Format**: Override methods to change output
- **Debugging Tool**: Essential for understanding tracking behavior
- **Thread-Safe**: Separate instances per worker thread
- **Performance Impact**: Can significantly slow simulation

## Singleton Management

### SetInstance()
`source/tracking/include/G4VSteppingVerbose.hh:72`

```cpp
static void SetInstance(G4VSteppingVerbose* Instance);
```

**Purpose:** Sets the verbose instance for current thread

**Parameters:**
- `Instance`: Pointer to verbose object

**Usage:** Called at initialization to install custom verbose class

**Example:**
```cpp
// In main() for sequential or in ActionInitialization for MT
MySteppingVerbose* verbose = new MySteppingVerbose();
G4VSteppingVerbose::SetInstance(verbose);
```

### GetInstance()
`source/tracking/include/G4VSteppingVerbose.hh:73`

```cpp
static G4VSteppingVerbose* GetInstance();
```

**Purpose:** Returns the verbose instance for current thread

**Returns:** Pointer to verbose object, or nullptr if not set

**Example:**
```cpp
G4VSteppingVerbose* verbose = G4VSteppingVerbose::GetInstance();
if (verbose) {
    // Configure verbose settings
}
```

### GetMasterInstance()
`source/tracking/include/G4VSteppingVerbose.hh:74`

```cpp
static G4VSteppingVerbose* GetMasterInstance();
```

**Purpose:** Returns the master thread verbose instance

**Returns:** Pointer to master verbose object

**Usage:** In multi-threaded applications

## Verbosity Control

### SetSilent() / GetSilent()
`source/tracking/include/G4VSteppingVerbose.hh:75-76`

```cpp
static G4int GetSilent();
static void SetSilent(G4int fSilent);
```

**Purpose:** Controls overall verbose output

**Parameters:**
- `fSilent`: Silence level
  - `0` = Normal verbose output
  - `1` = Suppressed output

**Example:**
```cpp
// Disable verbose output
G4VSteppingVerbose::SetSilent(1);

// Re-enable
G4VSteppingVerbose::SetSilent(0);
```

### SetSilentStepInfo() / GetSilentStepInfo()
`source/tracking/include/G4VSteppingVerbose.hh:77-78`

```cpp
static G4int GetSilentStepInfo();
static void SetSilentStepInfo(G4int fSilent);
```

**Purpose:** Controls step info verbose output separately

**Parameters:**
- `fSilent`: Step info silence level

**Usage:** Suppress step-by-step details while keeping other output

## Multi-Threading Support

### Clone()
`source/tracking/include/G4VSteppingVerbose.hh:80`

```cpp
virtual G4VSteppingVerbose* Clone();
```

**Purpose:** Creates a copy for worker threads

**Returns:** Pointer to cloned verbose object

**Default Implementation:** Returns nullptr (no cloning)

**Example Override:**
```cpp
G4VSteppingVerbose* MySteppingVerbose::Clone() {
    return new MySteppingVerbose(*this);
}
```

## Pure Virtual Hooks

These methods **must** be implemented by derived classes:

### NewStep()
`source/tracking/include/G4VSteppingVerbose.hh:84`

```cpp
virtual void NewStep() = 0;
```

**Purpose:** Called at the beginning of each new step

**When Called:** Before GPIL calls

**Typical Use:** Print step header, reset counters

### StepInfo()
`source/tracking/include/G4VSteppingVerbose.hh:92`

```cpp
virtual void StepInfo() = 0;
```

**Purpose:** Called at end of step to print step information

**When Called:** After all DoIt methods

**Typical Use:** Print detailed step results

### TrackingStarted()
`source/tracking/include/G4VSteppingVerbose.hh:93`

```cpp
virtual void TrackingStarted() = 0;
```

**Purpose:** Called when tracking of a new track begins

**When Called:** Before first step

**Typical Use:** Print track header information

### AtRestDoItInvoked()
`source/tracking/include/G4VSteppingVerbose.hh:87`

```cpp
virtual void AtRestDoItInvoked() = 0;
```

**Purpose:** Called when at-rest processes are invoked

**When Called:** During at-rest process execution

**Typical Use:** Print at-rest process information

### AlongStepDoItAllDone()
`source/tracking/include/G4VSteppingVerbose.hh:88`

```cpp
virtual void AlongStepDoItAllDone() = 0;
```

**Purpose:** Called after all along-step DoIt methods complete

**When Called:** End of along-step phase

**Typical Use:** Print along-step summary

### PostStepDoItAllDone()
`source/tracking/include/G4VSteppingVerbose.hh:89`

```cpp
virtual void PostStepDoItAllDone() = 0;
```

**Purpose:** Called after all post-step DoIt methods complete

**When Called:** End of post-step phase

**Typical Use:** Print post-step summary

### AlongStepDoItOneByOne()
`source/tracking/include/G4VSteppingVerbose.hh:90`

```cpp
virtual void AlongStepDoItOneByOne() = 0;
```

**Purpose:** Called during each along-step DoIt execution

**When Called:** Inside along-step loop

**Typical Use:** Print each along-step process

### PostStepDoItOneByOne()
`source/tracking/include/G4VSteppingVerbose.hh:91`

```cpp
virtual void PostStepDoItOneByOne() = 0;
```

**Purpose:** Called during each post-step DoIt execution

**When Called:** Inside post-step loop

**Typical Use:** Print each post-step process

### DPSL Methods

DefinePhysicalStepLength (DPSL) hooks:

```cpp
virtual void DPSLStarted() = 0;        // Line 94
virtual void DPSLUserLimit() = 0;      // Line 95
virtual void DPSLPostStep() = 0;       // Line 96
virtual void DPSLAlongStep() = 0;      // Line 97
```

**Purpose:** Called during physical step length determination

**Usage:** Print which processes propose step limits

### VerboseTrack()
`source/tracking/include/G4VSteppingVerbose.hh:98`

```cpp
virtual void VerboseTrack() = 0;
```

**Purpose:** Prints detailed track information

**Usage:** Called for comprehensive track dump

### VerboseParticleChange()
`source/tracking/include/G4VSteppingVerbose.hh:99`

```cpp
virtual void VerboseParticleChange() = 0;
```

**Purpose:** Prints particle change information

**Usage:** Shows how processes modified the particle

## Configuration Methods

### CopyState()
`source/tracking/include/G4VSteppingVerbose.hh:85`

```cpp
void CopyState();
```

**Purpose:** Copies state from stepping manager

**Behavior:**
- Copies all relevant stepping data
- Called automatically before hooks
- Ensures verbose has current state

**Note:** Usually called internally, not by users

### SetManager()
`source/tracking/include/G4VSteppingVerbose.hh:86`

```cpp
virtual void SetManager(G4SteppingManager* const);
```

**Purpose:** Sets the stepping manager pointer

**Parameters:**
- Stepping manager instance

**Called By:** Stepping manager during initialization

## Protected Members

The verbose class has access to copied stepping data:

```cpp
G4SteppingManager* fManager = nullptr;
G4UserSteppingAction* fUserSteppingAction = nullptr;

G4double PhysicalStep = 0.0;
G4double GeometricalStep = 0.0;
G4double CorrectedStep = 0.0;
G4bool PreStepPointIsGeom = false;
G4bool FirstStep = false;
G4StepStatus fStepStatus = fUndefined;

G4Track* fTrack = nullptr;
G4Step* fStep = nullptr;
G4StepPoint* fPreStepPoint = nullptr;
G4StepPoint* fPostStepPoint = nullptr;

G4VPhysicalVolume* fCurrentVolume = nullptr;
G4VSensitiveDetector* fSensitive = nullptr;
G4VProcess* fCurrentProcess = nullptr;

// Process vectors
G4ProcessVector* fAtRestDoItVector = nullptr;
G4ProcessVector* fAlongStepDoItVector = nullptr;
G4ProcessVector* fPostStepDoItVector = nullptr;

// [Many more members - see header file lines 112-186]
```

**Usage:** Access these in derived class implementations

## Complete Implementation Example

```cpp
// MySteppingVerbose.hh
#ifndef MySteppingVerbose_h
#define MySteppingVerbose_h 1

#include "G4VSteppingVerbose.hh"

class MySteppingVerbose : public G4VSteppingVerbose
{
public:
    MySteppingVerbose();
    ~MySteppingVerbose() override;

    // Clone for MT
    G4VSteppingVerbose* Clone() override;

    // Required virtual methods
    void NewStep() override;
    void StepInfo() override;
    void TrackingStarted() override;
    void AtRestDoItInvoked() override;
    void AlongStepDoItAllDone() override;
    void PostStepDoItAllDone() override;
    void AlongStepDoItOneByOne() override;
    void PostStepDoItOneByOne() override;
    void DPSLStarted() override;
    void DPSLUserLimit() override;
    void DPSLPostStep() override;
    void DPSLAlongStep() override;
    void VerboseTrack() override;
    void VerboseParticleChange() override;

private:
    void PrintHeader();
    void PrintStepInfo();
};

#endif

// MySteppingVerbose.cc
#include "MySteppingVerbose.hh"
#include "G4SteppingManager.hh"
#include "G4Track.hh"
#include "G4Step.hh"
#include "G4StepPoint.hh"
#include "G4VProcess.hh"
#include "G4VPhysicalVolume.hh"
#include "G4UnitsTable.hh"

MySteppingVerbose::MySteppingVerbose()
    : G4VSteppingVerbose()
{}

MySteppingVerbose::~MySteppingVerbose()
{}

G4VSteppingVerbose* MySteppingVerbose::Clone()
{
    return new MySteppingVerbose(*this);
}

void MySteppingVerbose::TrackingStarted()
{
    CopyState();  // Get current state

    G4cout << "\n************************************" << G4endl;
    G4cout << "*   Tracking Started              *" << G4endl;
    G4cout << "************************************" << G4endl;

    if (fTrack) {
        G4cout << "Track ID: " << fTrack->GetTrackID() << G4endl;
        G4cout << "Particle: " << fTrack->GetDefinition()->GetParticleName() << G4endl;
        G4cout << "Parent ID: " << fTrack->GetParentID() << G4endl;
        G4cout << "Energy: " << G4BestUnit(fTrack->GetKineticEnergy(), "Energy") << G4endl;
        G4cout << "Position: " << G4BestUnit(fTrack->GetPosition(), "Length") << G4endl;

        const G4VProcess* creator = fTrack->GetCreatorProcess();
        if (creator) {
            G4cout << "Created by: " << creator->GetProcessName() << G4endl;
        } else {
            G4cout << "Primary particle" << G4endl;
        }
    }

    PrintHeader();
}

void MySteppingVerbose::NewStep()
{
    CopyState();

    G4cout << "\n========== New Step ==========" << G4endl;
}

void MySteppingVerbose::StepInfo()
{
    CopyState();

    if (Silent == 1) return;

    PrintStepInfo();
}

void MySteppingVerbose::PrintHeader()
{
    G4cout << G4endl;
    G4cout << std::setw(5) << "Step#"
           << std::setw(8) << "X"
           << std::setw(8) << "Y"
           << std::setw(8) << "Z"
           << std::setw(10) << "KinE"
           << std::setw(10) << "dE"
           << std::setw(10) << "StepLen"
           << std::setw(12) << "Volume"
           << std::setw(12) << "Process"
           << G4endl;
}

void MySteppingVerbose::PrintStepInfo()
{
    if (!fTrack || !fStep || !fPreStepPoint || !fPostStepPoint) return;

    G4int stepNo = fTrack->GetCurrentStepNumber();
    G4ThreeVector pos = fTrack->GetPosition();
    G4double kinE = fTrack->GetKineticEnergy();
    G4double edep = fStep->GetTotalEnergyDeposit();
    G4double stepLen = fStep->GetStepLength();

    G4String volumeName = "OutOfWorld";
    if (fCurrentVolume) {
        volumeName = fCurrentVolume->GetName();
    }

    G4String processName = "None";
    const G4VProcess* process = fPostStepPoint->GetProcessDefinedStep();
    if (process) {
        processName = process->GetProcessName();
    }

    G4cout << std::setw(5) << stepNo
           << std::setw(8) << G4BestUnit(pos.x(), "Length")
           << std::setw(8) << G4BestUnit(pos.y(), "Length")
           << std::setw(8) << G4BestUnit(pos.z(), "Length")
           << std::setw(10) << G4BestUnit(kinE, "Energy")
           << std::setw(10) << G4BestUnit(edep, "Energy")
           << std::setw(10) << G4BestUnit(stepLen, "Length")
           << std::setw(12) << volumeName
           << std::setw(12) << processName
           << G4endl;
}

void MySteppingVerbose::AtRestDoItInvoked()
{
    CopyState();

    if (Silent == 1) return;

    G4cout << "  AtRestDoIt invoked" << G4endl;
    if (fCurrentProcess) {
        G4cout << "    Process: " << fCurrentProcess->GetProcessName() << G4endl;
    }
}

void MySteppingVerbose::AlongStepDoItAllDone()
{
    CopyState();

    if (Silent == 1) return;

    G4cout << "  AlongStepDoIt completed" << G4endl;
    G4cout << "    Physical step: "
           << G4BestUnit(PhysicalStep, "Length") << G4endl;
}

void MySteppingVerbose::PostStepDoItAllDone()
{
    CopyState();

    if (Silent == 1) return;

    G4cout << "  PostStepDoIt completed" << G4endl;
}

void MySteppingVerbose::AlongStepDoItOneByOne()
{
    CopyState();

    if (Silent == 1) return;

    if (fCurrentProcess) {
        G4cout << "    AlongStep: " << fCurrentProcess->GetProcessName() << G4endl;
    }
}

void MySteppingVerbose::PostStepDoItOneByOne()
{
    CopyState();

    if (Silent == 1) return;

    if (fCurrentProcess) {
        G4cout << "    PostStep: " << fCurrentProcess->GetProcessName() << G4endl;
    }
}

void MySteppingVerbose::DPSLStarted()
{
    CopyState();

    if (Silent == 1) return;

    G4cout << "  DefinePhysicalStepLength started" << G4endl;
}

void MySteppingVerbose::DPSLUserLimit()
{
    CopyState();

    if (Silent == 1) return;

    G4cout << "    User limit: "
           << G4BestUnit(PhysicalStep, "Length") << G4endl;
}

void MySteppingVerbose::DPSLPostStep()
{
    CopyState();

    if (Silent == 1) return;

    if (fCurrentProcess) {
        G4cout << "    PostStep limit (" << fCurrentProcess->GetProcessName()
               << "): " << G4BestUnit(PhysicalStep, "Length") << G4endl;
    }
}

void MySteppingVerbose::DPSLAlongStep()
{
    CopyState();

    if (Silent == 1) return;

    if (fCurrentProcess) {
        G4cout << "    AlongStep limit (" << fCurrentProcess->GetProcessName()
               << "): " << G4BestUnit(PhysicalStep, "Length") << G4endl;
    }
}

void MySteppingVerbose::VerboseTrack()
{
    CopyState();

    if (Silent == 1) return;

    G4cout << "\n*** Verbose Track Information ***" << G4endl;
    if (fTrack) {
        G4cout << "Track ID: " << fTrack->GetTrackID() << G4endl;
        G4cout << "Particle: " << fTrack->GetDefinition()->GetParticleName() << G4endl;
        G4cout << "Energy: " << G4BestUnit(fTrack->GetKineticEnergy(), "Energy") << G4endl;
        G4cout << "Position: " << G4BestUnit(fTrack->GetPosition(), "Length") << G4endl;
        G4cout << "Track length: " << G4BestUnit(fTrack->GetTrackLength(), "Length") << G4endl;
        G4cout << "Step number: " << fTrack->GetCurrentStepNumber() << G4endl;
    }
}

void MySteppingVerbose::VerboseParticleChange()
{
    CopyState();

    if (Silent == 1) return;

    G4cout << "*** Particle Change Information ***" << G4endl;
    // Print particle change details
    // (requires access to particle change object)
}
```

## Usage and Installation

### Sequential Mode

```cpp
// In main()
int main(int argc, char** argv)
{
    // Set verbose before run manager
    MySteppingVerbose* verbose = new MySteppingVerbose();
    G4VSteppingVerbose::SetInstance(verbose);

    // Create run manager
    G4RunManager* runManager = new G4RunManager;

    // ... rest of initialization ...

    return 0;
}
```

### Multi-Threaded Mode

```cpp
// In ActionInitialization
class MyActionInitialization : public G4VUserActionInitialization
{
public:
    void BuildForMaster() const override {
        // Master thread verbose
        MySteppingVerbose* verbose = new MySteppingVerbose();
        G4VSteppingVerbose::SetInstance(verbose);
    }

    void Build() const override {
        // Worker thread verbose
        MySteppingVerbose* verbose = new MySteppingVerbose();
        G4VSteppingVerbose::SetInstance(verbose);

        // ... set other user actions ...
    }
};
```

### Controlling Verbosity

```cpp
// Enable verbose output for specific track
void MyTrackingAction::PreUserTrackingAction(const G4Track* track)
{
    if (track->GetTrackID() == 1) {  // Only primary
        fpTrackingManager->SetVerboseLevel(2);
    } else {
        fpTrackingManager->SetVerboseLevel(0);
    }
}

// Or control globally
/tracking/verbose 2  // UI command
```

## Performance Considerations

::: warning Performance Impact
Verbose output significantly slows simulation:
- I/O operations in hot path
- String formatting overhead
- Can reduce performance by 10-100x
:::

**Best Practices:**

1. **Use Sparingly:**
```cpp
// Only for debugging specific events
if (event->GetEventID() < 10) {
    trackingManager->SetVerboseLevel(2);
} else {
    trackingManager->SetVerboseLevel(0);
}
```

2. **Conditional Output:**
```cpp
void StepInfo() {
    CopyState();

    // Only print interesting steps
    if (fStep->GetTotalEnergyDeposit() > 0.1*MeV) {
        PrintStepInfo();
    }
}
```

3. **Silent Mode:**
```cpp
// Disable for production
G4VSteppingVerbose::SetSilent(1);
```

## Thread Safety

::: info Multi-Threading
- Separate instance per thread
- Use Clone() to create worker instances
- Thread-local static members
- No synchronization needed
:::

**MT Implementation:**
```cpp
G4VSteppingVerbose* MySteppingVerbose::Clone() {
    // Create copy for worker thread
    MySteppingVerbose* clone = new MySteppingVerbose(*this);

    // Copy any custom settings
    // (base class handles standard members)

    return clone;
}
```

## Common Use Cases

### Debugging Physics Processes

```cpp
void MySteppingVerbose::PostStepDoItOneByOne()
{
    CopyState();

    if (fCurrentProcess) {
        G4String procName = fCurrentProcess->GetProcessName();

        // Detailed output for specific processes
        if (procName == "phot" || procName == "compt") {
            G4cout << "EM Process: " << procName << G4endl;
            G4cout << "  Pre-step E: "
                   << G4BestUnit(fPreStepPoint->GetKineticEnergy(), "Energy")
                   << G4endl;
            G4cout << "  Post-step E: "
                   << G4BestUnit(fPostStepPoint->GetKineticEnergy(), "Energy")
                   << G4endl;
            G4cout << "  Energy deposit: "
                   << G4BestUnit(fStep->GetTotalEnergyDeposit(), "Energy")
                   << G4endl;
        }
    }
}
```

### Tracking Geometry Navigation

```cpp
void MySteppingVerbose::StepInfo()
{
    CopyState();

    if (fStepStatus == fGeomBoundary) {
        G4String preVol = "OutOfWorld";
        G4String postVol = "OutOfWorld";

        if (fPreStepPoint->GetPhysicalVolume()) {
            preVol = fPreStepPoint->GetPhysicalVolume()->GetName();
        }
        if (fPostStepPoint->GetPhysicalVolume()) {
            postVol = fPostStepPoint->GetPhysicalVolume()->GetName();
        }

        G4cout << "Boundary crossing: " << preVol
               << " -> " << postVol << G4endl;
    }
}
```

### Monitoring Energy Deposition

```cpp
void MySteppingVerbose::AlongStepDoItAllDone()
{
    CopyState();

    G4double edep = fStep->GetTotalEnergyDeposit();
    if (edep > 0) {
        G4cout << "Energy deposited: " << G4BestUnit(edep, "Energy")
               << " in " << fCurrentVolume->GetName() << G4endl;
    }
}
```

## Related Classes

### Tracking
- [G4SteppingManager](g4steppingmanager.md) - Uses verbose class
- [G4TrackingManager](g4trackingmanager.md) - Controls verbosity
- G4SteppingVerbose - Default implementation

### Track and Step
- [G4Track](../../track/api/g4track.md) - Track information
- [G4Step](../../track/api/g4step.md) - Step information
- [G4StepPoint](../../track/api/g4steppoint.md) - Step points

### User Actions
- [G4UserSteppingAction](g4usersteppingaction.md) - Alternative step hooks
- [G4UserTrackingAction](g4usertrackingaction.md) - Track-level hooks

## See Also

- [Tracking Module Overview](../overview.md)
- [Debugging Guide](../../guides/debugging.md)
- [Verbosity Control](../../guides/verbosity.md)

---

::: info Source Reference
Complete implementation in:
- Header: `source/tracking/include/G4VSteppingVerbose.hh`
- Source: `source/tracking/src/G4VSteppingVerbose.cc`
- Default: `source/tracking/src/G4SteppingVerbose.cc`
:::
