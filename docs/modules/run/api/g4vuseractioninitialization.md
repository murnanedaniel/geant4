# G4VUserActionInitialization API Documentation

## Overview

`G4VUserActionInitialization` is the abstract base class for instantiating all user action classes in a unified, thread-safe manner. It provides a centralized mechanism for creating and registering user actions, with specific support for multi-threaded applications. This class is mandatory in Geant4 applications and separates action initialization for master and worker threads.

::: tip Header File
**Location:** `source/run/include/G4VUserActionInitialization.hh`
**Source:** `source/run/src/G4VUserActionInitialization.cc`
:::

## Class Declaration

```cpp
class G4VUserActionInitialization
{
  public:
    G4VUserActionInitialization() = default;
    virtual ~G4VUserActionInitialization() = default;

    // Pure virtual - must be implemented
    virtual void Build() const = 0;

    // Virtual - override for master thread actions
    virtual void BuildForMaster() const {}

    // Virtual - override for custom stepping verbose
    virtual G4VSteppingVerbose* InitializeSteppingVerbose() const { return nullptr; }

  protected:
    void SetUserAction(G4VUserPrimaryGeneratorAction*) const;
    void SetUserAction(G4UserRunAction*) const;
    void SetUserAction(G4UserEventAction*) const;
    void SetUserAction(G4UserStackingAction*) const;
    void SetUserAction(G4UserTrackingAction*) const;
    void SetUserAction(G4UserSteppingAction*) const;
};
```

## Key Characteristics

- **Abstract Base Class**: Must be subclassed - Build() is pure virtual
- **Const Methods**: All virtual methods are const - don't store action pointers as members
- **Thread-Aware**: Separate Build() and BuildForMaster() for MT mode
- **Centralized Registration**: Single location for all user action initialization
- **Mandatory**: Required for all Geant4 applications (since Geant4 10.0)

## Important Notes

::: warning Const Correctness
All virtual methods are **const**. This means:
- You can construct user action objects
- You **cannot** store pointers as data members
- Actions are owned by G4RunManager, not your class
- This enforces proper object lifetime management
:::

::: tip Thread Safety
In multi-threaded mode:
- `Build()` called for each worker thread
- `BuildForMaster()` called once for master thread
- Each thread gets its own action instances
- No synchronization needed - fully thread-safe design
:::

## Virtual Methods

### Build() - Pure Virtual
`source/run/include/G4VUserActionInitialization.hh:66`

```cpp
virtual void Build() const = 0;
```

**Purpose:** Instantiate and register user action classes

**Execution Context:**
- **Sequential mode**: Called once by G4RunManager
- **MT mode**: Called by each G4WorkerRunManager (once per worker thread)

**Must Register:**
- Primary generator action (mandatory)
- Optional: Run, Event, Tracking, Stepping, Stacking actions

**Example:**
```cpp
class MyActionInitialization : public G4VUserActionInitialization
{
public:
    void Build() const override {
        // Mandatory: Primary generator
        SetUserAction(new MyPrimaryGenerator);

        // Optional: Run action
        SetUserAction(new MyRunAction);

        // Optional: Event action
        SetUserAction(new MyEventAction);

        // Optional: Tracking action
        SetUserAction(new MyTrackingAction);

        // Optional: Stepping action
        SetUserAction(new MySteppingAction);

        // Optional: Stacking action
        SetUserAction(new MyStackingAction);
    }
};
```

**Common Use Cases:**
- Register mandatory primary generator
- Initialize event processing actions
- Setup tracking and stepping hooks
- Configure particle stacking behavior
- Initialize thread-local data

### BuildForMaster()
`source/run/include/G4VUserActionInitialization.hh:73`

```cpp
virtual void BuildForMaster() const {}
```

**Purpose:** Instantiate run action for master thread in multi-threaded mode

**Execution Context:**
- **Sequential mode**: NOT called
- **MT mode**: Called once by G4MTRunManager for master thread

**Restrictions:**
- Can **only** register G4UserRunAction
- All other actions are not allowed on master thread
- Master run action handles merged results from workers

**Example:**
```cpp
void MyActionInitialization::BuildForMaster() const
{
    // Only run action allowed for master thread
    SetUserAction(new MyRunAction);

    // Master run action receives merged data from all workers
    // Typically used for final output, file writing, summaries
}
```

**When to Override:**
```cpp
// Use separate master run action if:
// 1. Different behavior needed for master vs workers
// 2. Master handles final file I/O
// 3. Master prints global statistics

void MyActionInitialization::BuildForMaster() const
{
    // Master-specific run action
    auto masterRunAction = new MyRunAction;
    masterRunAction->SetMasterMode(true);
    SetUserAction(masterRunAction);
}

void MyActionInitialization::Build() const
{
    // Worker-specific run action
    auto workerRunAction = new MyRunAction;
    workerRunAction->SetMasterMode(false);
    SetUserAction(workerRunAction);

    // Other actions (workers only)
    SetUserAction(new MyPrimaryGenerator);
    SetUserAction(new MyEventAction);
}
```

::: tip Master vs Worker
- If BuildForMaster() not overridden, master gets no run action
- Often the same MyRunAction class is used for both, using IsMaster() flag internally
- Can use different classes for master vs worker for specialized behavior
:::

### InitializeSteppingVerbose()
`source/run/include/G4VUserActionInitialization.hh:81`

```cpp
virtual G4VSteppingVerbose* InitializeSteppingVerbose() const { return nullptr; }
```

**Purpose:** Create custom stepping verbose output handler

**Returns:**
- Pointer to user-defined G4VSteppingVerbose subclass
- `nullptr` (default) uses standard G4SteppingVerbose

**Execution Context:**
- Called for worker threads only
- NOT used for master thread

**Example:**
```cpp
// Custom stepping verbose class
class MySteppingVerbose : public G4VSteppingVerbose
{
public:
    void StepInfo() override {
        // Custom step information output
        G4cout << "Step " << fManager->GetfStepNumber()
               << " Track ID " << fTrack->GetTrackID()
               << " in " << fTrack->GetVolume()->GetName()
               << G4endl;
    }

    void TrackingStarted() override {
        G4cout << "Tracking started for "
               << fTrack->GetDefinition()->GetParticleName()
               << G4endl;
    }
};

// In action initialization
class MyActionInitialization : public G4VUserActionInitialization
{
public:
    G4VSteppingVerbose* InitializeSteppingVerbose() const override {
        return new MySteppingVerbose;
    }

    void Build() const override {
        SetUserAction(new MyPrimaryGenerator);
        // ... other actions
    }
};
```

**Use Cases:**
- Custom debugging output format
- Selective step information printing
- Integration with external logging systems
- Performance-optimized verbose output

## Protected SetUserAction() Methods

All SetUserAction() methods are protected and const-qualified, designed to be called from Build() or BuildForMaster().

### SetUserAction() - Primary Generator
`source/run/include/G4VUserActionInitialization.hh:85`

```cpp
void SetUserAction(G4VUserPrimaryGeneratorAction*) const;
```

**Purpose:** Register primary particle generator

**Requirement:** Mandatory - must be set

**Example:**
```cpp
SetUserAction(new MyPrimaryGenerator);
```

### SetUserAction() - Run Action
`source/run/include/G4VUserActionInitialization.hh:86`

```cpp
void SetUserAction(G4UserRunAction*) const;
```

**Purpose:** Register run action

**Requirement:** Optional

**Example:**
```cpp
SetUserAction(new MyRunAction);
```

### SetUserAction() - Event Action
`source/run/include/G4VUserActionInitialization.hh:87`

```cpp
void SetUserAction(G4UserEventAction*) const;
```

**Purpose:** Register event action

**Requirement:** Optional

**Example:**
```cpp
SetUserAction(new MyEventAction);
```

### SetUserAction() - Stacking Action
`source/run/include/G4VUserActionInitialization.hh:88`

```cpp
void SetUserAction(G4UserStackingAction*) const;
```

**Purpose:** Register particle stacking action

**Requirement:** Optional

**Example:**
```cpp
SetUserAction(new MyStackingAction);
```

### SetUserAction() - Tracking Action
`source/run/include/G4VUserActionInitialization.hh:89`

```cpp
void SetUserAction(G4UserTrackingAction*) const;
```

**Purpose:** Register tracking action

**Requirement:** Optional

**Example:**
```cpp
SetUserAction(new MyTrackingAction);
```

### SetUserAction() - Stepping Action
`source/run/include/G4VUserActionInitialization.hh:90`

```cpp
void SetUserAction(G4UserSteppingAction*) const;
```

**Purpose:** Register stepping action

**Requirement:** Optional

**Example:**
```cpp
SetUserAction(new MySteppingAction);
```

## Complete Usage Examples

### Basic Sequential Application

```cpp
// MyActionInitialization.hh
#ifndef MyActionInitialization_h
#define MyActionInitialization_h 1

#include "G4VUserActionInitialization.hh"

class MyActionInitialization : public G4VUserActionInitialization
{
public:
    MyActionInitialization() = default;
    virtual ~MyActionInitialization() = default;

    virtual void Build() const override;
};

#endif

// MyActionInitialization.cc
#include "MyActionInitialization.hh"
#include "MyPrimaryGenerator.hh"
#include "MyRunAction.hh"
#include "MyEventAction.hh"
#include "MyTrackingAction.hh"
#include "MySteppingAction.hh"

void MyActionInitialization::Build() const
{
    // Mandatory: Primary generator
    SetUserAction(new MyPrimaryGenerator);

    // Optional: Analysis and output
    SetUserAction(new MyRunAction);
    SetUserAction(new MyEventAction);

    // Optional: Detailed tracking
    SetUserAction(new MyTrackingAction);
    SetUserAction(new MySteppingAction);
}
```

### Multi-threaded Application

```cpp
class MyActionInitialization : public G4VUserActionInitialization
{
public:
    MyActionInitialization() = default;
    virtual ~MyActionInitialization() = default;

    virtual void BuildForMaster() const override;
    virtual void Build() const override;
};

void MyActionInitialization::BuildForMaster() const
{
    // Master thread: Only run action for merged results
    auto masterRunAction = new MyRunAction;
    SetUserAction(masterRunAction);
}

void MyActionInitialization::Build() const
{
    // Worker threads: All actions

    // Mandatory
    SetUserAction(new MyPrimaryGenerator);

    // Run action for worker thread
    SetUserAction(new MyRunAction);

    // Event processing
    SetUserAction(new MyEventAction);

    // Optional: Detailed tracking
    SetUserAction(new MyTrackingAction);
    SetUserAction(new MySteppingAction);
}
```

### With Custom Stepping Verbose

```cpp
class MySteppingVerbose : public G4VSteppingVerbose
{
public:
    MySteppingVerbose();
    virtual ~MySteppingVerbose() = default;

    virtual void StepInfo() override;
    virtual void TrackingStarted() override;
};

class MyActionInitialization : public G4VUserActionInitialization
{
public:
    virtual G4VSteppingVerbose* InitializeSteppingVerbose() const override
    {
        return new MySteppingVerbose;
    }

    virtual void Build() const override
    {
        SetUserAction(new MyPrimaryGenerator);
        SetUserAction(new MyRunAction);
        SetUserAction(new MyEventAction);
    }
};
```

### Parameterized Action Initialization

```cpp
class MyActionInitialization : public G4VUserActionInitialization
{
public:
    MyActionInitialization(const G4String& outputFile, G4bool enableVerbose);
    virtual ~MyActionInitialization() = default;

    virtual void Build() const override;
    virtual void BuildForMaster() const override;

private:
    G4String fOutputFileName;
    G4bool fVerbose;
};

MyActionInitialization::MyActionInitialization(
    const G4String& outputFile, G4bool enableVerbose)
    : G4VUserActionInitialization(),
      fOutputFileName(outputFile),
      fVerbose(enableVerbose)
{}

void MyActionInitialization::BuildForMaster() const
{
    auto runAction = new MyRunAction(fOutputFileName);
    runAction->SetVerbose(fVerbose);
    SetUserAction(runAction);
}

void MyActionInitialization::Build() const
{
    SetUserAction(new MyPrimaryGenerator);

    auto runAction = new MyRunAction(fOutputFileName);
    runAction->SetVerbose(fVerbose);
    SetUserAction(runAction);

    SetUserAction(new MyEventAction);
}
```

### Conditional Action Registration

```cpp
void MyActionInitialization::Build() const
{
    // Always required
    SetUserAction(new MyPrimaryGenerator);
    SetUserAction(new MyRunAction);

    // Conditional based on configuration
#ifdef ENABLE_DETAILED_TRACKING
    SetUserAction(new MyTrackingAction);
    SetUserAction(new MySteppingAction);
#endif

#ifdef ENABLE_CUSTOM_STACKING
    SetUserAction(new MyStackingAction);
#endif

    // Always include event action
    SetUserAction(new MyEventAction);
}
```

## Registration Pattern

### Sequential Mode

```cpp
// main.cc
#include "G4RunManager.hh"
#include "MyActionInitialization.hh"
#include "MyDetectorConstruction.hh"
#include "MyPhysicsList.hh"

int main()
{
    // Construct run manager
    auto runManager = new G4RunManager;

    // Set mandatory initialization classes
    runManager->SetUserInitialization(new MyDetectorConstruction);
    runManager->SetUserInitialization(new MyPhysicsList);

    // Set action initialization (replaces individual SetUserAction calls)
    runManager->SetUserInitialization(new MyActionInitialization);

    // Initialize and run
    runManager->Initialize();
    runManager->BeamOn(1000);

    delete runManager;
    return 0;
}
```

### Multi-threaded Mode

```cpp
// main.cc
#include "G4MTRunManager.hh"
#include "MyActionInitialization.hh"
#include "MyDetectorConstruction.hh"
#include "MyPhysicsList.hh"

int main()
{
    // Construct MT run manager
    auto runManager = new G4MTRunManager;
    runManager->SetNumberOfThreads(4);

    // Set mandatory initialization classes
    runManager->SetUserInitialization(new MyDetectorConstruction);
    runManager->SetUserInitialization(new MyPhysicsList);

    // Set action initialization
    // Build() called for each worker thread
    // BuildForMaster() called for master thread
    runManager->SetUserInitialization(new MyActionInitialization);

    runManager->Initialize();
    runManager->BeamOn(10000);

    delete runManager;
    return 0;
}
```

## Action Registration Summary

| Action Class | Mandatory? | Master Thread | Worker Thread | Purpose |
|--------------|------------|---------------|---------------|---------|
| G4VUserPrimaryGeneratorAction | Yes | No | Yes | Generate primary particles |
| G4UserRunAction | No | Optional | Optional | Run-level hooks and statistics |
| G4UserEventAction | No | No | Yes | Event-level processing |
| G4UserTrackingAction | No | No | Yes | Track start/end hooks |
| G4UserSteppingAction | No | No | Yes | Step-level processing |
| G4UserStackingAction | No | No | Yes | Control particle stacking |

## Thread Execution Flow

### Sequential Mode
```
1. G4RunManager::Initialize()
2. MyActionInitialization::Build()
   -> SetUserAction(PrimaryGenerator)
   -> SetUserAction(RunAction)
   -> SetUserAction(EventAction)
   -> ... other actions
3. Run simulation
```

### Multi-threaded Mode
```
Master Thread:
1. G4MTRunManager::Initialize()
2. MyActionInitialization::BuildForMaster()
   -> SetUserAction(RunAction) [optional]

Worker Thread 1:
3. G4WorkerRunManager::Initialize()
4. MyActionInitialization::Build()
   -> SetUserAction(PrimaryGenerator)
   -> SetUserAction(RunAction)
   -> SetUserAction(EventAction)
   -> ... other actions
5. Process events

Worker Thread 2, 3, 4...:
(Repeat steps 3-5 for each worker)
```

## Common Patterns

### Pattern 1: Minimal Setup
```cpp
void MyActionInitialization::Build() const
{
    SetUserAction(new MyPrimaryGenerator);
}
```

### Pattern 2: Standard Analysis
```cpp
void MyActionInitialization::Build() const
{
    SetUserAction(new MyPrimaryGenerator);
    SetUserAction(new MyRunAction);
    SetUserAction(new MyEventAction);
}
```

### Pattern 3: Detailed Tracking
```cpp
void MyActionInitialization::Build() const
{
    SetUserAction(new MyPrimaryGenerator);
    SetUserAction(new MyRunAction);
    SetUserAction(new MyEventAction);
    SetUserAction(new MyTrackingAction);
    SetUserAction(new MySteppingAction);
}
```

### Pattern 4: Master/Worker Separation
```cpp
void MyActionInitialization::BuildForMaster() const
{
    SetUserAction(new MyMasterRunAction);
}

void MyActionInitialization::Build() const
{
    SetUserAction(new MyPrimaryGenerator);
    SetUserAction(new MyWorkerRunAction);
    SetUserAction(new MyEventAction);
}
```

## Migration from Old API

### Before Geant4 10.0
```cpp
// Old style (deprecated)
runManager->SetUserAction(new MyPrimaryGenerator);
runManager->SetUserAction(new MyRunAction);
runManager->SetUserAction(new MyEventAction);
```

### Geant4 10.0 and Later
```cpp
// New style (required)
runManager->SetUserInitialization(new MyActionInitialization);

// In MyActionInitialization::Build()
SetUserAction(new MyPrimaryGenerator);
SetUserAction(new MyRunAction);
SetUserAction(new MyEventAction);
```

## Best Practices

::: tip Recommendations
1. **Don't Store Pointers**: Methods are const - can't use member variables
2. **Master Thread**: Use BuildForMaster() only for run action if needed
3. **Parameterization**: Pass configuration via constructor, not member variables
4. **Thread Safety**: Each thread gets independent action instances
5. **Mandatory Generator**: Always register primary generator action
6. **Clean Initialization**: Single location for all action setup
:::

## Thread Safety

- **Fully Thread-Safe**: Each worker gets independent action instances
- **No Shared State**: const methods prevent member variable storage
- **Automatic Isolation**: G4RunManager handles thread-local registration
- **No Synchronization Needed**: Actions are inherently thread-local

## See Also

- [G4UserRunAction](g4userrunaction.md) - Run-level actions
- [G4UserEventAction](../event/api/g4usereventaction.md) - Event-level actions
- [G4UserTrackingAction](../tracking/api/g4usertrackingaction.md) - Tracking actions
- [G4UserSteppingAction](../tracking/api/g4usersteppingaction.md) - Stepping actions
- [G4VUserPrimaryGeneratorAction](g4vuserprimarygeneratoraction.md) - Primary generation
- [G4RunManager](g4runmanager.md) - Sequential run management
- [G4MTRunManager](g4mtrunmanager.md) - Multi-threaded run management
- [Run Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/run/include/G4VUserActionInitialization.hh`
- Source: `source/run/src/G4VUserActionInitialization.cc`
:::
