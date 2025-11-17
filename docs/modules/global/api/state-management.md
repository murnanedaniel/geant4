# State Management API

## Overview

The State Management subsystem provides centralized control over the application lifecycle and execution phases in Geant4. It implements the Singleton and Observer (Notifier) design patterns to manage state transitions and notify registered components when the application state changes.

## Purpose

The State Management system serves several critical functions:

- **Lifecycle Management**: Tracks the application's progression through initialization, execution, and termination phases
- **State Validation**: Ensures operations are performed only in appropriate states
- **Change Notification**: Notifies registered components when state transitions occur
- **Error Handling**: Provides controlled behavior during exceptional conditions
- **Thread Safety**: Maintains per-thread state management in multi-threaded mode

## Architecture

The State Management system consists of three main components:

```
G4ApplicationState (enum)
        ↑
        |
G4StateManager (singleton)
        |
        | notifies
        ↓
G4VStateDependent (observer base class)
```

## Source Files

### Header Files
- `/source/global/management/include/G4ApplicationState.hh` - Application state enumeration
- `/source/global/management/include/G4StateManager.hh` - State manager singleton
- `/source/global/management/include/G4StateManager.icc` - Inline method implementations
- `/source/global/management/include/G4VStateDependent.hh` - Observer base class

### Implementation Files
- `/source/global/management/src/G4StateManager.cc` - State manager implementation
- `/source/global/management/src/G4VStateDependent.cc` - Observer implementation

## Application States

### State Enumeration

```cpp
enum G4ApplicationState
{
  G4State_PreInit,     // Pre-initialization
  G4State_Init,        // Initialization in progress
  G4State_Idle,        // Ready for simulation
  G4State_GeomClosed,  // Geometry closed, ready for events
  G4State_EventProc,   // Event processing in progress
  G4State_Quit,        // Application terminating
  G4State_Abort        // Exceptional termination
};
```

### State Descriptions

#### G4State_PreInit
**Initial state at application startup**

- Application has just started
- No materials, geometry, particles, or physics processes initialized
- G4StateManager starts in this state
- Transitions to `Init` when `G4Initializer::Initialize()` begins

**Typical Duration**: Very brief, immediately at startup

**Valid Operations**: Basic initialization preparation

#### G4State_Init
**Active initialization phase**

- During execution of `G4Initializer::Initialize()`
- Materials, geometry, particles, and physics processes are being initialized
- Transitions to `Idle` when all initialization procedures complete successfully

**Typical Duration**: Application startup until fully initialized

**Valid Operations**: Initialization of all simulation components

#### G4State_Idle
**Ready for simulation**

- All initialization complete
- Application ready to begin simulation runs
- Geometry is open and can be modified
- Transitions to `GeomClosed` when `G4RunManager::BeamOn()` starts
- Transitions to `Quit` for normal termination
- Returns to this state after each run completes

**Typical Duration**: Between runs or waiting for user commands

**Valid Operations**:
- Geometry modifications
- Physics configuration
- Starting new runs
- Application termination

#### G4State_GeomClosed
**Geometry closed, between events**

- Active during a run, but not processing an event
- Geometry is closed (optimized for navigation)
- Occurs between `G4GeometryManager::CloseGeometry()` and `G4GeometryManager::OpenGeometry()`
- Transitions to `EventProc` at start of each event
- Returns from `EventProc` after each event completes
- Transitions back to `Idle` at end of run

**Typical Duration**: Brief periods between events during a run

**Valid Operations**:
- Run-level operations
- Preparation for next event
- No geometry modifications

#### G4State_EventProc
**Event processing active**

- Actively simulating a single event
- From event construction and primary particle generation through completion
- All tracking, stepping, and scoring occurs in this state
- Transitions back to `GeomClosed` when event processing completes

**Typical Duration**: Duration of single event simulation

**Valid Operations**:
- Particle tracking
- Physics processes
- Detector scoring
- Event data recording

#### G4State_Quit
**Normal termination**

- Entered when `G4RunManager` destructor is invoked
- Application is shutting down normally
- Cleanup operations in progress

**Typical Duration**: Brief, during application shutdown

**Valid Operations**: Cleanup and finalization

#### G4State_Abort
**Exceptional termination**

- Entered when `G4Exception` is invoked
- Application encountered an error condition
- May suppress further processing depending on configuration

**Typical Duration**: May be very brief or persist depending on error handling

**Valid Operations**: Error handling and recovery

## State Transition Diagram

```
        PreInit
           |
           v
         Init
           |
           v
         Idle ---------> Quit
           |^
           v|
      GeomClosed (each run)
           |^
           v|
      EventProc (each event)
```

### Typical State Flow

1. **Application Startup**: `PreInit` → `Init` → `Idle`
2. **Run Execution**: `Idle` → `GeomClosed` → (`EventProc` ↔ `GeomClosed`) → `Idle`
3. **Normal Termination**: `Idle` → `Quit`
4. **Error Condition**: Any state → `Abort`

## State Transition Rules

### Valid Transitions

The state manager validates all state transitions. While most transitions follow the standard flow shown above, certain transitions are context-dependent:

**From PreInit**:
- → `Init`: Standard initialization start
- → `Abort`: Early error

**From Init**:
- → `Idle`: Successful initialization
- → `Abort`: Initialization failure

**From Idle**:
- → `GeomClosed`: Run starting
- → `Quit`: Normal termination
- → `Abort`: Error condition

**From GeomClosed**:
- → `EventProc`: Event starting
- → `Idle`: Run ending
- → `Abort`: Error during run

**From EventProc**:
- → `GeomClosed`: Event complete
- → `Abort`: Event error (may be suppressed)

**From Quit or Abort**:
- No further transitions (terminal states)

### Transition Validation

State transitions are validated through:

1. **Registered Observers**: Each `G4VStateDependent` object can veto a transition
2. **Abort Suppression**: Transitions to `Abort` can be suppressed during event processing
3. **State Manager Logic**: Internal validation ensures legal transitions

## Design Patterns

### Singleton Pattern

`G4StateManager` implements the thread-local singleton pattern:

```cpp
class G4StateManager
{
public:
    static G4StateManager* GetStateManager();
    // Other public methods...

private:
    G4StateManager();  // Private constructor
    G4StateManager(const G4StateManager&) = delete;
    G4StateManager& operator=(const G4StateManager&) = delete;

    static G4ThreadLocal G4StateManager* theStateManager;
};
```

**Key Characteristics**:
- Single instance per thread (thread-local storage)
- Private constructor prevents direct instantiation
- Deleted copy/assignment operators prevent duplication
- Static getter method provides global access point

### Observer (Notifier) Pattern

The state-dependent notification system implements the Observer pattern:

```cpp
// Subject (Observable)
class G4StateManager
{
    std::vector<G4VStateDependent*> theDependentsList;
    G4bool SetNewState(const G4ApplicationState& requestedState);
};

// Observer Interface
class G4VStateDependent
{
    virtual G4bool Notify(G4ApplicationState requestedState) = 0;
};

// Concrete Observers
class MyStateDependent : public G4VStateDependent
{
    G4bool Notify(G4ApplicationState requestedState) override {
        // Handle state change
        return true;
    }
};
```

**Notification Flow**:

1. `G4StateManager::SetNewState()` called
2. Manager iterates through registered dependents
3. Each dependent's `Notify()` method invoked
4. If any dependent returns `false`, transition rejected
5. If all accept, state changes and previous state updated

## Thread Safety

### Multi-threaded Mode

The State Management system is designed for multi-threaded applications:

**Thread-Local Singleton**:
```cpp
static G4ThreadLocal G4StateManager* theStateManager;
```

- Each thread maintains its own `G4StateManager` instance
- Master thread and worker threads have independent states
- No synchronization needed between thread-local instances

**Thread-Safe Operations**:
- State queries (`GetCurrentState()`, `GetPreviousState()`)
- State changes within single thread
- Observer registration/deregistration

**Thread Considerations**:

1. **Worker Threads**: Each has independent state progression
2. **Master Thread**: Coordinates overall application state
3. **No Cross-Thread Access**: State managers don't interact between threads
4. **Event-Level Parallelism**: Worker threads independently process events in `EventProc` state

### Initialization in Multi-threaded Mode

```cpp
G4StateManager::G4StateManager()
{
#ifdef G4MULTITHREADED
  G4iosInitialization();  // Initialize thread-local I/O
#endif
}
```

Special I/O initialization ensures proper output handling per thread.

## Usage Examples

### Example 1: Querying Current State

```cpp
#include "G4StateManager.hh"

// Get the state manager instance
G4StateManager* stateManager = G4StateManager::GetStateManager();

// Query current state
G4ApplicationState currentState = stateManager->GetCurrentState();

// Check if in specific state
if (currentState == G4State_Idle) {
    // Safe to modify geometry
    ModifyDetectorGeometry();
}

// Get human-readable state name
G4String stateName = stateManager->GetStateString(currentState);
G4cout << "Current state: " << stateName << G4endl;
```

### Example 2: Changing Application State

```cpp
#include "G4StateManager.hh"

G4StateManager* stateManager = G4StateManager::GetStateManager();

// Request state change
G4bool success = stateManager->SetNewState(G4State_Idle);

if (success) {
    G4cout << "State changed successfully" << G4endl;
} else {
    G4cerr << "State change rejected" << G4endl;
}

// State change with message
const char* msg = "Initializing detector geometry";
success = stateManager->SetNewState(G4State_Init, msg);
```

### Example 3: Creating State-Dependent Observer

```cpp
#include "G4VStateDependent.hh"
#include "G4ApplicationState.hh"

class MyDetectorConstruction : public G4VStateDependent
{
public:
    MyDetectorConstruction() : G4VStateDependent(false) {
        // Automatically registers with G4StateManager
    }

    virtual ~MyDetectorConstruction() {
        // Automatically deregisters
    }

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        switch (requestedState) {
            case G4State_Idle:
                // Geometry can be modified
                if (geometryNeedsUpdate) {
                    UpdateGeometry();
                }
                return true;

            case G4State_GeomClosed:
                // Geometry about to be closed
                FinalizeGeometry();
                return true;

            case G4State_EventProc:
                // Event starting - validate readiness
                if (!IsReadyForEvent()) {
                    G4cerr << "Detector not ready!" << G4endl;
                    return false;  // Veto state change
                }
                return true;

            default:
                return true;  // Accept other state changes
        }
    }

private:
    G4bool geometryNeedsUpdate = false;

    void UpdateGeometry() { /* ... */ }
    void FinalizeGeometry() { /* ... */ }
    G4bool IsReadyForEvent() { return true; }
};
```

### Example 4: Priority Observer (Bottom Dependent)

```cpp
class CriticalStateHandler : public G4VStateDependent
{
public:
    // Register as bottom dependent (notified last)
    CriticalStateHandler() : G4VStateDependent(true) {
        // This observer is notified after all others
    }

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        // Perform critical final checks
        if (requestedState == G4State_EventProc) {
            // All other components have accepted the transition
            // Perform final validation
            return ValidateAllSystems();
        }
        return true;
    }

private:
    G4bool ValidateAllSystems() {
        // Critical validation logic
        return true;
    }
};
```

### Example 5: Exception Handling Configuration

```cpp
#include "G4StateManager.hh"
#include "G4VExceptionHandler.hh"

class MyExceptionHandler : public G4VExceptionHandler
{
public:
    virtual G4bool Notify(const char* originOfException,
                         const char* exceptionCode,
                         G4ExceptionSeverity severity,
                         const char* description) override {
        // Custom exception handling
        return true;
    }
};

// Configure state manager
G4StateManager* stateManager = G4StateManager::GetStateManager();

// Set custom exception handler
MyExceptionHandler* handler = new MyExceptionHandler();
stateManager->SetExceptionHandler(handler);

// Configure abort suppression
// 0: Allow abort, 1: Suppress during EventProc, 2: Suppress all
stateManager->SetSuppressAbortion(1);
```

### Example 6: Verbose State Tracking

```cpp
#include "G4StateManager.hh"

// Enable verbose state change logging
G4StateManager::SetVerboseLevel(1);

// Now all state changes will print:
// "#### G4StateManager::SetNewState from [previous] to [new]"

// Later, disable verbose output
G4StateManager::SetVerboseLevel(0);
```

### Example 7: Handling Event/Run Deletion

```cpp
class MyDataCollector : public G4VStateDependent
{
public:
    MyDataCollector() : G4VStateDependent(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        return true;
    }

    // Notified when event is being deleted
    virtual void NotifyDeletion(const G4Event* evt) override {
        if (currentEvent == evt) {
            // Clear pointer to avoid dangling reference
            currentEvent = nullptr;
            SaveEventData();
        }
    }

    // Notified when run is being deleted
    virtual void NotifyDeletion(const G4Run* run) override {
        if (currentRun == run) {
            // Clear pointer to avoid dangling reference
            currentRun = nullptr;
            FinalizeRunData();
        }
    }

private:
    const G4Event* currentEvent = nullptr;
    const G4Run* currentRun = nullptr;

    void SaveEventData() { /* ... */ }
    void FinalizeRunData() { /* ... */ }
};
```

### Example 8: State-Based Operation Validation

```cpp
#include "G4StateManager.hh"

class PhysicsListManager
{
public:
    void AddProcess(G4VProcess* process) {
        G4StateManager* stateManager = G4StateManager::GetStateManager();
        G4ApplicationState currentState = stateManager->GetCurrentState();

        // Only allow physics modifications in certain states
        if (currentState == G4State_PreInit ||
            currentState == G4State_Init ||
            currentState == G4State_Idle) {
            // Safe to modify physics
            physicsList->AddProcess(process);
        } else {
            G4String stateName = stateManager->GetStateString(currentState);
            G4Exception("PhysicsListManager::AddProcess()",
                       "PhysicsList001",
                       JustWarning,
                       ("Cannot modify physics in state: " + stateName).c_str());
        }
    }

private:
    G4VUserPhysicsList* physicsList;
};
```

## API Reference

### G4StateManager

See [G4StateManager API](g4statemanager.md) for detailed class reference.

### G4VStateDependent

See [G4VStateDependent API](g4vstatedependent.md) for detailed class reference.

### G4ApplicationState

See [G4ApplicationState API](g4applicationstate.md) for detailed enumeration reference.

## Best Practices

### Do's

1. **Always check current state** before operations that are state-sensitive
2. **Use state-dependent observers** for automatic notification of state changes
3. **Return true from Notify()** unless you have a critical reason to veto
4. **Clean up in NotifyDeletion()** to avoid dangling pointers
5. **Use verbose mode** during development to track state transitions

### Don'ts

1. **Don't veto state changes unnecessarily** - use command availability instead
2. **Don't store raw pointers** to G4Event/G4Run without handling NotifyDeletion
3. **Don't assume synchronous states** in multi-threaded applications
4. **Don't modify state directly** - always use SetNewState()
5. **Don't suppress abort without good reason** - it can hide critical errors

### Performance Considerations

1. **Observer Notification**: Keep `Notify()` methods fast - they're called on every state change
2. **Registration Order**: Normal dependents notified in registration order, bottom dependent last
3. **State Queries**: `GetCurrentState()` is very fast - inline accessor
4. **String Conversion**: `GetStateString()` has switch overhead - cache if used frequently

## Common Patterns

### Initialization Sequence

```cpp
// Application starts in PreInit
// -> Initialize materials, geometry, physics
stateManager->SetNewState(G4State_Init);
// -> Complete initialization
stateManager->SetNewState(G4State_Idle);
```

### Run Execution

```cpp
// Ready to run
currentState == G4State_Idle
// -> Close geometry and prepare run
stateManager->SetNewState(G4State_GeomClosed);
// -> For each event:
stateManager->SetNewState(G4State_EventProc);
// ... process event ...
stateManager->SetNewState(G4State_GeomClosed);
// -> Open geometry and finalize run
stateManager->SetNewState(G4State_Idle);
```

### Error Handling

```cpp
try {
    // Some operation
} catch (...) {
    stateManager->SetNewState(G4State_Abort, "Critical error occurred");
    // Or throw G4Exception which triggers abort
}
```

## Related Documentation

- [G4RunManager API](g4runmanager.md) - Uses state management for run control
- [G4EventManager API](g4eventmanager.md) - Transitions to EventProc state
- [G4GeometryManager API](g4geometrymanager.md) - Triggers GeomClosed transitions
- [Exception Handling](../exception-handling.md) - Integration with abort state

## History

- **November 1996**: Initial implementation by G. Cosmo and M. Asai
- **Multi-threading Support**: Added G4ThreadLocal for thread-safe singleton

## See Also

- Design Patterns: Singleton, Observer
- Multi-threading in Geant4
- Application Lifecycle Management
