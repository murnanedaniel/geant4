# G4ApplicationState

## Enumeration Overview

**Defined in**: `/source/global/management/include/G4ApplicationState.hh`

`G4ApplicationState` is an enumeration that defines the distinct lifecycle phases of a Geant4 application. It represents the fundamental states through which an application progresses from startup through initialization, execution, and termination.

## Purpose

The application state enumeration serves several critical purposes:

- **Lifecycle Tracking**: Clearly defines where the application is in its execution lifecycle
- **Operation Validation**: Enables validation that operations occur only in appropriate states
- **Flow Control**: Guides the sequence of initialization, execution, and termination
- **Error Handling**: Provides special states for exceptional conditions

## Enumeration Definition

```cpp
enum G4ApplicationState
{
  G4State_PreInit,     // 0
  G4State_Init,        // 1
  G4State_Idle,        // 2
  G4State_GeomClosed,  // 3
  G4State_EventProc,   // 4
  G4State_Quit,        // 5
  G4State_Abort        // 6
};
```

## State Descriptions

### G4State_PreInit

**Value**: 0

**Name**: "PreInit"

**Description**: Pre-initialization state - the very beginning of the application

**Entered When**:
- Application starts (default initial state)
- G4StateManager is first created

**Duration**: Very brief - only at application startup

**Characteristics**:
- No materials initialized
- No geometry defined
- No particles defined
- No physics processes initialized
- Minimal framework setup

**Valid Operations**:
- Basic system initialization
- Setting up logging and output
- Preparing for main initialization

**Transitions To**:
- `G4State_Init` - When `G4Initializer::Initialize()` begins
- `G4State_Abort` - On early error

**Example Usage**:
```cpp
G4StateManager* sm = G4StateManager::GetStateManager();
if (sm->GetCurrentState() == G4State_PreInit) {
    G4cout << "Application just started" << G4endl;
}
```

---

### G4State_Init

**Value**: 1

**Name**: "Init"

**Description**: Initialization in progress

**Entered When**:
- `G4Initializer::Initialize()` method starts
- Transition from `PreInit` state

**Duration**: From start of initialization until completion

**Characteristics**:
- Materials being initialized
- Geometry being constructed
- Particles being defined
- Physics processes being configured
- Cuts being set up

**Valid Operations**:
- Material creation
- Geometry construction
- Particle definition
- Physics list setup
- Cross-section table building

**Transitions To**:
- `G4State_Idle` - When initialization completes successfully
- `G4State_Abort` - On initialization failure

**Example Usage**:
```cpp
if (sm->GetCurrentState() == G4State_Init) {
    // Safe to perform initialization tasks
    DefineParticles();
    ConstructPhysics();
}
```

**Common Activities**:
- Building material tables
- Constructing detector geometry
- Defining particle properties
- Initializing physics processes
- Computing cross-section tables

---

### G4State_Idle

**Value**: 2

**Name**: "Idle"

**Description**: Initialized and ready for simulation, or between runs

**Entered When**:
- Initialization completes successfully (from `Init`)
- Run completes (from `GeomClosed`)
- Awaiting user commands or next run

**Duration**: Between runs, or waiting for `BeamOn()` command

**Characteristics**:
- Full initialization complete
- Geometry is open (can be modified)
- No active simulation
- Ready to start new run or terminate

**Valid Operations**:
- Modifying geometry
- Changing physics parameters
- Setting up run configuration
- Starting new run (`BeamOn()`)
- Normal termination
- User commands

**Transitions To**:
- `G4State_GeomClosed` - When `G4RunManager::BeamOn()` starts
- `G4State_Quit` - For normal application termination
- `G4State_Abort` - On error

**Example Usage**:
```cpp
if (sm->GetCurrentState() == G4State_Idle) {
    // Safe to modify detector
    detector->SetSize(newSize);
    detector->UpdateGeometry();

    // Can start new run
    runManager->BeamOn(1000);
}
```

**State Check Pattern**:
```cpp
void ModifyGeometry() {
    G4StateManager* sm = G4StateManager::GetStateManager();
    if (sm->GetCurrentState() != G4State_Idle) {
        G4Exception("ModifyGeometry()", "InvalidState",
                   JustWarning,
                   "Geometry can only be modified in Idle state");
        return;
    }
    // Safe to modify
}
```

---

### G4State_GeomClosed

**Value**: 3

**Name**: "GeomClosed"

**Description**: Geometry closed for optimization, run active but between events

**Entered When**:
- `G4RunManager::BeamOn()` starts (from `Idle`)
- Event completes (from `EventProc`)

**Exits When**:
- Event starts (to `EventProc`)
- Run ends (to `Idle`)

**Duration**: Active during a run, but between events

**Characteristics**:
- Geometry is closed (optimized for navigation)
- Run is active
- No event currently being processed
- Geometry cannot be modified

**Valid Operations**:
- Starting new event
- Run-level data collection
- Preparing for next event
- Ending run

**Invalid Operations**:
- Geometry modifications
- Physics process changes
- Material changes

**Transitions To**:
- `G4State_EventProc` - When event processing begins
- `G4State_Idle` - When run ends (geometry reopens)
- `G4State_Abort` - On error

**Example Usage**:
```cpp
if (sm->GetCurrentState() == G4State_GeomClosed) {
    // Between events during a run
    PrepareForNextEvent();

    // Cannot modify geometry
    // detector->SetSize(newSize);  // Would fail!
}
```

**Typical Flow During Run**:
```
Idle
  └─> GeomClosed (run starts, geometry closes)
        ├─> EventProc (event 1)
        ├─> GeomClosed
        ├─> EventProc (event 2)
        ├─> GeomClosed
        ├─> EventProc (event N)
        └─> GeomClosed
  └─> Idle (run ends, geometry opens)
```

---

### G4State_EventProc

**Value**: 4

**Name**: "EventProc"

**Description**: Event processing in progress

**Entered When**:
- Event construction and primary particle generation begins
- Transition from `GeomClosed`

**Exits When**:
- `G4EventManager::ProcessOneEvent()` completes
- Returns to `GeomClosed`

**Duration**: Duration of single event simulation

**Characteristics**:
- Active particle tracking
- Physics processes executing
- Detector response being recorded
- Sensitive detector hits being created
- Event data being accumulated

**Valid Operations**:
- Particle tracking
- Step processing
- Physics interactions
- Sensitive detector recording
- User action hooks
- Event data collection

**Invalid Operations**:
- Geometry modifications
- Physics list changes
- Starting new events (must finish current event first)

**Transitions To**:
- `G4State_GeomClosed` - When event completes normally
- `G4State_Abort` - On event error (may be suppressed)

**Example Usage**:
```cpp
if (sm->GetCurrentState() == G4State_EventProc) {
    // Event is being processed
    // Safe to collect event data
    CollectHits();
    RecordTrajectories();
}
```

**Abort Suppression**:
```cpp
// Can suppress abort during event processing
sm->SetSuppressAbortion(1);  // Suppress during EventProc
// Now exceptions during event won't transition to Abort
```

**State-Sensitive Operations**:
```cpp
void UserAction() {
    G4StateManager* sm = G4StateManager::GetStateManager();
    if (sm->GetCurrentState() == G4State_EventProc) {
        // Access current event safely
        const G4Event* event = GetCurrentEvent();
        ProcessEventData(event);
    }
}
```

---

### G4State_Quit

**Value**: 5

**Name**: "Quit"

**Description**: Normal application termination

**Entered When**:
- `G4RunManager` destructor is invoked
- Normal application shutdown

**Duration**: Brief - during application shutdown

**Characteristics**:
- Application is terminating normally
- Cleanup operations in progress
- No new operations should start
- Resources being released

**Valid Operations**:
- Cleanup
- Finalization
- Writing final output
- Resource deallocation

**Invalid Operations**:
- Starting new runs
- Processing events
- Modifying simulation setup

**Transitions To**:
- None (terminal state)

**Example Usage**:
```cpp
class Finalizer : public G4VStateDependent {
public:
    Finalizer() : G4VStateDependent(false) {}

    G4bool Notify(G4ApplicationState requestedState) override {
        if (requestedState == G4State_Quit) {
            // Application terminating - save data
            SaveFinalResults();
            CloseFiles();
        }
        return true;
    }

private:
    void SaveFinalResults() {}
    void CloseFiles() {}
};
```

---

### G4State_Abort

**Value**: 6

**Name**: "Abort"

**Description**: Exceptional termination - error condition

**Entered When**:
- `G4Exception` is invoked with fatal severity
- Critical error occurs
- Can be triggered from any state

**Duration**: May be brief or persist depending on error handling

**Characteristics**:
- Error condition active
- May halt further processing
- Exception handling in progress
- May suppress further errors

**Valid Operations**:
- Error reporting
- Emergency cleanup
- Exception handling
- State examination

**Transitions To**:
- None (typically terminal)
- May return to previous state if abort is suppressed and handled

**Suppression Levels**:
```cpp
// 0: No suppression (default)
sm->SetSuppressAbortion(0);

// 1: Suppress during event processing
sm->SetSuppressAbortion(1);

// 2: Suppress all aborts
sm->SetSuppressAbortion(2);
```

**Example Usage**:
```cpp
void CriticalOperation() {
    try {
        // Risky operation
        if (!CanProceed()) {
            G4Exception("CriticalOperation()",
                       "Critical001",
                       FatalException,
                       "Cannot proceed!");
            // State changes to Abort
        }
    } catch (...) {
        G4StateManager* sm = G4StateManager::GetStateManager();
        if (sm->GetCurrentState() == G4State_Abort) {
            // Handle abort state
            EmergencyCleanup();
        }
    }
}
```

**Error Handling Pattern**:
```cpp
class ErrorHandler : public G4VStateDependent {
public:
    ErrorHandler() : G4VStateDependent(false) {}

    G4bool Notify(G4ApplicationState requestedState) override {
        if (requestedState == G4State_Abort) {
            G4cout << "Application entering abort state" << G4endl;
            LogError();
            // Perform emergency actions
            return true;  // Or false to try to prevent abort
        }
        return true;
    }

private:
    void LogError() {
        // Write error information
    }
};
```

## State Transition Diagram

```
        PreInit (0)
           |
           | Initialize()
           v
         Init (1)
           |
           | Complete
           v
         Idle (2) ──────────> Quit (5)
           |                 [normal exit]
           | BeamOn()
           v
      GeomClosed (3)
           |^
           ||  [each event]
           v|
      EventProc (4)


        Abort (6) <─────── [from any state on error]
```

## Common State Sequences

### Application Startup

```
PreInit → Init → Idle
```

**Code Flow**:
```cpp
// Application starts in PreInit
G4RunManager* runManager = new G4RunManager;  // Still PreInit

// Initialize
runManager->Initialize();  // PreInit → Init → Idle

// Now in Idle state, ready for runs
```

### Single Run Execution

```
Idle → GeomClosed → (EventProc ↔ GeomClosed)* → Idle
```

**Code Flow**:
```cpp
// Starting from Idle
runManager->BeamOn(100);  // Idle → GeomClosed

// For each of 100 events:
//   GeomClosed → EventProc [process event] → GeomClosed

// After all events:
//   GeomClosed → Idle
```

### Multiple Runs

```
Idle → GeomClosed → EventProc(s) → GeomClosed → Idle
     → GeomClosed → EventProc(s) → GeomClosed → Idle
     → GeomClosed → EventProc(s) → GeomClosed → Idle
```

**Code Flow**:
```cpp
// In Idle state
runManager->BeamOn(100);  // Run 1
// Back to Idle

runManager->BeamOn(200);  // Run 2
// Back to Idle

runManager->BeamOn(50);   // Run 3
// Back to Idle
```

### Normal Termination

```
Idle → Quit
```

**Code Flow**:
```cpp
// In Idle state
delete runManager;  // Idle → Quit → destruction
```

### Error Termination

```
[Any State] → Abort
```

**Code Flow**:
```cpp
// At any point
G4Exception("Source", "Code", FatalException, "Error message");
// State → Abort
```

## State-Based Validation

### Operation Availability by State

| Operation | PreInit | Init | Idle | GeomClosed | EventProc | Quit | Abort |
|-----------|---------|------|------|------------|-----------|------|-------|
| Define Materials | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Build Geometry | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Modify Geometry | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Define Physics | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Start Run | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Process Event | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Track Particles | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Query State | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Implementation Example

```cpp
class StateValidator {
public:
    static bool CanModifyGeometry() {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState state = sm->GetCurrentState();
        return (state == G4State_Init || state == G4State_Idle);
    }

    static bool CanStartRun() {
        G4StateManager* sm = G4StateManager::GetStateManager();
        return sm->GetCurrentState() == G4State_Idle;
    }

    static bool CanProcessEvent() {
        G4StateManager* sm = G4StateManager::GetStateManager();
        return sm->GetCurrentState() == G4State_EventProc;
    }

    static void ValidateStateForOperation(
        const G4String& operation,
        std::initializer_list<G4ApplicationState> validStates)
    {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState current = sm->GetCurrentState();

        for (G4ApplicationState valid : validStates) {
            if (current == valid) return;  // Valid
        }

        // Invalid state
        G4String msg = operation + " not available in state: "
                     + sm->GetStateString(current);
        G4Exception("StateValidator::ValidateStateForOperation()",
                   "InvalidState", JustWarning, msg);
    }
};

// Usage
void ModifyDetector() {
    StateValidator::ValidateStateForOperation(
        "Geometry modification",
        {G4State_Init, G4State_Idle}
    );
    // Proceed with modification
}
```

## Querying States

### Getting Current State

```cpp
G4StateManager* sm = G4StateManager::GetStateManager();
G4ApplicationState state = sm->GetCurrentState();

// Numeric comparison
if (state == G4State_Idle) {
    // In idle state
}

// String representation
G4String stateName = sm->GetStateString(state);
G4cout << "Current state: " << stateName << G4endl;
```

### Checking State History

```cpp
G4ApplicationState current = sm->GetCurrentState();
G4ApplicationState previous = sm->GetPreviousState();

if (previous == G4State_EventProc && current == G4State_GeomClosed) {
    G4cout << "Event just completed" << G4endl;
}

if (previous == G4State_GeomClosed && current == G4State_Idle) {
    G4cout << "Run just completed" << G4endl;
}
```

### State Transition Detection

```cpp
class TransitionDetector : public G4VStateDependent {
public:
    TransitionDetector() : G4VStateDependent(false) {}

    G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState from = sm->GetCurrentState();

        DetectTransitionType(from, requestedState);
        return true;
    }

private:
    void DetectTransitionType(G4ApplicationState from,
                              G4ApplicationState to) {
        if (from == G4State_PreInit && to == G4State_Init) {
            G4cout << "Initialization starting" << G4endl;
        }
        else if (from == G4State_Init && to == G4State_Idle) {
            G4cout << "Initialization complete" << G4endl;
        }
        else if (from == G4State_Idle && to == G4State_GeomClosed) {
            G4cout << "Run starting" << G4endl;
        }
        else if (from == G4State_GeomClosed && to == G4State_Idle) {
            G4cout << "Run ending" << G4endl;
        }
        else if (from == G4State_GeomClosed && to == G4State_EventProc) {
            G4cout << "Event starting" << G4endl;
        }
        else if (from == G4State_EventProc && to == G4State_GeomClosed) {
            G4cout << "Event ending" << G4endl;
        }
    }
};
```

## Best Practices

### 1. Always Validate State

```cpp
void OperationRequiringIdleState() {
    G4StateManager* sm = G4StateManager::GetStateManager();
    if (sm->GetCurrentState() != G4State_Idle) {
        G4String msg = "Operation requires Idle state, current: "
                     + sm->GetStateString(sm->GetCurrentState());
        G4Exception("OperationRequiringIdleState()",
                   "InvalidState", JustWarning, msg);
        return;
    }
    // Safe to proceed
}
```

### 2. Use State-Based Logic

```cpp
void AdaptiveOperation() {
    G4StateManager* sm = G4StateManager::GetStateManager();

    switch(sm->GetCurrentState()) {
        case G4State_Idle:
            // Can modify geometry
            break;
        case G4State_GeomClosed:
            // Can prepare for events
            break;
        case G4State_EventProc:
            // Can collect data
            break;
        default:
            // Operation not available
            break;
    }
}
```

### 3. Monitor State Transitions

```cpp
class MyManager : public G4VStateDependent {
    G4bool Notify(G4ApplicationState requestedState) override {
        // React to state changes
        if (requestedState == G4State_Idle) {
            OnIdle();
        }
        return true;
    }
};
```

## Performance Notes

- State queries are very fast (inline member access)
- State comparisons are integer comparisons
- String conversions (GetStateString) have switch overhead
- Cache string representations if used frequently

## Thread Safety

- Each thread has independent state
- State values are thread-local
- No synchronization needed for queries
- Worker threads progress through states independently

## Common Patterns

### Pattern: Deferred Operations

```cpp
class DeferredUpdater {
public:
    void RequestUpdate() {
        updatePending = true;
    }

    void CheckAndUpdate() {
        G4StateManager* sm = G4StateManager::GetStateManager();
        if (updatePending && sm->GetCurrentState() == G4State_Idle) {
            PerformUpdate();
            updatePending = false;
        }
    }

private:
    bool updatePending = false;
    void PerformUpdate() {}
};
```

### Pattern: State Machine

```cpp
class StateMachine {
public:
    void Update() {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState state = sm->GetCurrentState();

        if (state != lastState) {
            OnStateChange(lastState, state);
            lastState = state;
        }
    }

private:
    G4ApplicationState lastState = G4State_PreInit;

    void OnStateChange(G4ApplicationState from, G4ApplicationState to) {
        // Handle state transition
    }
};
```

## See Also

- [State Management Overview](state-management.md)
- [G4StateManager](g4statemanager.md)
- [G4VStateDependent](g4vstatedependent.md)
- [G4RunManager API](g4runmanager.md)
- [Application Lifecycle](../application-lifecycle.md)
