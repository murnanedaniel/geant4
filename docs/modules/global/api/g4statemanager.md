# G4StateManager API Documentation

## Overview

`G4StateManager` is a singleton class responsible for managing the application state throughout the lifecycle of a Geant4 simulation. It tracks state transitions, enforces valid state changes, and notifies dependent objects when states change. The manager ensures that operations are only performed when the application is in an appropriate state.

::: tip Header File
**Location:** `source/global/management/include/G4StateManager.hh`
**Authors:** G.Cosmo, M.Asai - November 1996
:::

## Application State Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PreInit: Application Start
    PreInit --> Init: G4Initializer::Initialize()
    Init --> Idle: Initialization Complete
    Idle --> GeomClosed: BeamOn() / CloseGeometry()
    GeomClosed --> EventProc: Begin Event
    EventProc --> GeomClosed: End Event
    GeomClosed --> Idle: End Run / OpenGeometry()
    Idle --> Quit: RunManager Destructor

    PreInit --> Abort: G4Exception
    Init --> Abort: G4Exception
    Idle --> Abort: G4Exception
    GeomClosed --> Abort: G4Exception
    EventProc --> Abort: G4Exception

    Abort --> Idle: Recovery
    Quit --> [*]
```

## Class Declaration

`source/global/management/include/G4StateManager.hh:52-120`

```cpp
class G4StateManager
{
 public:
  static G4StateManager* GetStateManager();
  ~G4StateManager();

  // Deleted copy/move operations
  G4StateManager(const G4StateManager&) = delete;
  G4StateManager& operator=(const G4StateManager&) = delete;

  // State queries
  const G4ApplicationState& GetCurrentState() const;
  const G4ApplicationState& GetPreviousState() const;

  // State changes
  G4bool SetNewState(const G4ApplicationState& requestedState);
  G4bool SetNewState(const G4ApplicationState& requestedState,
                     const char* msg);

  // State-dependent object registration
  G4bool RegisterDependent(G4VStateDependent* aDependent,
                          G4bool bottom = false);
  G4bool DeregisterDependent(G4VStateDependent* aDependent);
  G4VStateDependent* RemoveDependent(const G4VStateDependent* aDependent);

  // Utilities
  G4String GetStateString(const G4ApplicationState& aState) const;
  void NotifyDeletion(const G4Event*);
  void NotifyDeletion(const G4Run*);

  // Exception handling control
  inline void SetSuppressAbortion(G4int i);
  inline G4int GetSuppressAbortion() const;
  inline const char* GetMessage() const;
  inline void SetExceptionHandler(G4VExceptionHandler* eh);
  inline G4VExceptionHandler* GetExceptionHandler() const;
  static void SetVerboseLevel(G4int val);

 private:
  G4StateManager();
};
```

## Singleton Access

### GetStateManager()

`source/global/management/include/G4StateManager.hh:55-58`

```cpp
static G4StateManager* GetStateManager();
```

Returns pointer to the singleton instance of G4StateManager.

**Returns:** Pointer to global state manager (never null)

**Thread Safety:** Thread-local in multi-threaded mode

**Example:**
```cpp
G4StateManager* stateManager = G4StateManager::GetStateManager();
G4ApplicationState currentState = stateManager->GetCurrentState();
```

## State Queries

### GetCurrentState()

`source/global/management/include/G4StateManager.hh:67-68`

```cpp
const G4ApplicationState& GetCurrentState() const;
```

Returns the current application state.

**Returns:** Reference to current state

**Example:**
```cpp
G4StateManager* stateManager = G4StateManager::GetStateManager();
G4ApplicationState state = stateManager->GetCurrentState();

if (state == G4State_Idle) {
    G4cout << "Ready to start run" << G4endl;
}
```

### GetPreviousState()

`source/global/management/include/G4StateManager.hh:69-70`

```cpp
const G4ApplicationState& GetPreviousState() const;
```

Returns the previous application state.

**Returns:** Reference to previous state

**Usage:** Useful for state transition logging and recovery

**Example:**
```cpp
G4ApplicationState previous = stateManager->GetPreviousState();
G4ApplicationState current = stateManager->GetCurrentState();

G4cout << "State transition: "
       << stateManager->GetStateString(previous)
       << " -> "
       << stateManager->GetStateString(current)
       << G4endl;
```

## State Changes

### SetNewState() - Basic

`source/global/management/include/G4StateManager.hh:71-74`

```cpp
G4bool SetNewState(const G4ApplicationState& requestedState);
```

Attempts to change the application state.

**Parameters:**
- `requestedState`: Desired new state

**Returns:**
- `true`: State change successful
- `false`: State change rejected (illegal transition)

**Behavior:**
- Validates state transition is legal
- Notifies all registered state-dependent objects
- Updates current and previous states

**Example:**
```cpp
G4bool success = stateManager->SetNewState(G4State_Idle);
if (!success) {
    G4cout << "Cannot transition to Idle from current state" << G4endl;
}
```

### SetNewState() - With Message

`source/global/management/include/G4StateManager.hh:75-79`

```cpp
G4bool SetNewState(const G4ApplicationState& requestedState,
                   const char* msg);
```

Changes state with an associated message.

**Parameters:**
- `requestedState`: Desired new state
- `msg`: Message describing reason for state change

**Returns:** Same as basic version

**Example:**
```cpp
stateManager->SetNewState(G4State_GeomClosed,
                         "Geometry closed for run");
```

::: warning State Validation
Not all state transitions are valid. Attempting an illegal transition returns `false` and the state remains unchanged.
:::

## Valid State Transitions

| From State | To State | Context |
|------------|----------|---------|
| G4State_PreInit | G4State_Init | Initialization begins |
| G4State_Init | G4State_Idle | Initialization completes |
| G4State_Idle | G4State_GeomClosed | Run begins (geometry closes) |
| G4State_GeomClosed | G4State_EventProc | Event processing begins |
| G4State_EventProc | G4State_GeomClosed | Event completes |
| G4State_GeomClosed | G4State_Idle | Run ends (geometry opens) |
| G4State_Idle | G4State_Quit | Application termination |
| Any State | G4State_Abort | Exception occurs |
| G4State_Abort | G4State_Idle | Recovery from error |

## State-Dependent Object Registration

State-dependent objects are notified when the application state changes. This allows different parts of Geant4 to respond appropriately to state transitions.

### RegisterDependent()

`source/global/management/include/G4StateManager.hh:80-84`

```cpp
G4bool RegisterDependent(G4VStateDependent* aDependent,
                        G4bool bottom = false);
```

Registers an object to be notified of state changes.

**Parameters:**
- `aDependent`: Pointer to state-dependent object (must inherit from `G4VStateDependent`)
- `bottom`: If `true`, adds to bottom of notification list; if `false`, adds to top (default)

**Returns:**
- `true`: Registration successful
- `false`: Registration failed (already registered)

**Notification Order:**
- Objects registered with `bottom=false` are notified first (LIFO order)
- Objects registered with `bottom=true` are notified last (FIFO order)

**Example:**
```cpp
class MyStateDependent : public G4VStateDependent
{
 public:
  G4bool Notify(G4ApplicationState requestedState) override
  {
    G4cout << "State changing to: " << requestedState << G4endl;
    return true;  // Allow state change
  }
};

MyStateDependent* myObject = new MyStateDependent();
stateManager->RegisterDependent(myObject);
```

### DeregisterDependent()

`source/global/management/include/G4StateManager.hh:86-88`

```cpp
G4bool DeregisterDependent(G4VStateDependent* aDependent);
```

Removes an object from state change notifications.

**Parameters:**
- `aDependent`: Pointer to object to deregister

**Returns:**
- `true`: Deregistration successful
- `false`: Object was not registered

**Example:**
```cpp
stateManager->DeregisterDependent(myObject);
```

### RemoveDependent()

`source/global/management/include/G4StateManager.hh:89-91`

```cpp
G4VStateDependent* RemoveDependent(const G4VStateDependent* aDependent);
```

Removes and returns a registered dependent object.

**Parameters:**
- `aDependent`: Pointer to object to remove

**Returns:** Pointer to removed object, or `nullptr` if not found

**Example:**
```cpp
G4VStateDependent* removed = stateManager->RemoveDependent(myObject);
if (removed) {
    delete removed;  // Caller responsible for deletion
}
```

## Utility Methods

### GetStateString()

`source/global/management/include/G4StateManager.hh:92-93`

```cpp
G4String GetStateString(const G4ApplicationState& aState) const;
```

Converts a state enum to a human-readable string.

**Parameters:**
- `aState`: State to convert

**Returns:** String representation of state

**State Strings:**
- `G4State_PreInit` → "PreInit"
- `G4State_Init` → "Init"
- `G4State_Idle` → "Idle"
- `G4State_GeomClosed` → "GeomClosed"
- `G4State_EventProc` → "EventProc"
- `G4State_Quit` → "Quit"
- `G4State_Abort` → "Abort"

**Example:**
```cpp
G4ApplicationState state = stateManager->GetCurrentState();
G4cout << "Current state: " << stateManager->GetStateString(state) << G4endl;
```

### NotifyDeletion() - Event

`source/global/management/include/G4StateManager.hh:95`

```cpp
void NotifyDeletion(const G4Event*);
```

Notifies state-dependent objects that an event is being deleted.

**Parameters:**
- Pointer to event being deleted

**Usage:** Called internally when events are deleted

### NotifyDeletion() - Run

`source/global/management/include/G4StateManager.hh:96`

```cpp
void NotifyDeletion(const G4Run*);
```

Notifies state-dependent objects that a run is being deleted.

**Parameters:**
- Pointer to run being deleted

**Usage:** Called internally when runs are deleted

## Exception Handling Control

### SetSuppressAbortion() / GetSuppressAbortion()

`source/global/management/include/G4StateManager.hh:100-101`

```cpp
inline void SetSuppressAbortion(G4int i);
inline G4int GetSuppressAbortion() const;
```

Controls whether exceptions cause program abortion.

**Parameters:**
- `i`: Suppression level
  - `0`: Normal behavior (abort on fatal exceptions)
  - `>0`: Suppress abortion, return to Idle state

**Returns:** Current suppression level

**Example:**
```cpp
// Temporarily suppress abortion for batch processing
stateManager->SetSuppressAbortion(1);

// ... run simulations ...

stateManager->SetSuppressAbortion(0);  // Restore normal behavior
```

::: warning Use with Caution
Suppressing abortion can lead to inconsistent state if not handled properly. Use only when you have robust error recovery.
:::

### GetMessage()

`source/global/management/include/G4StateManager.hh:102`

```cpp
inline const char* GetMessage() const;
```

Returns the message associated with the current state change.

**Returns:** Pointer to message string

**Example:**
```cpp
const char* msg = stateManager->GetMessage();
if (msg) {
    G4cout << "State change reason: " << msg << G4endl;
}
```

### SetExceptionHandler() / GetExceptionHandler()

`source/global/management/include/G4StateManager.hh:103-104`

```cpp
inline void SetExceptionHandler(G4VExceptionHandler* eh);
inline G4VExceptionHandler* GetExceptionHandler() const;
```

Sets or gets the custom exception handler.

**Parameters:**
- `eh`: Pointer to custom exception handler (or `nullptr` for default)

**Returns:** Current exception handler

**Example:**
```cpp
class MyExceptionHandler : public G4VExceptionHandler
{
 public:
  G4bool Notify(const char* originOfException,
               const char* exceptionCode,
               G4ExceptionSeverity severity,
               const char* description) override
  {
    // Custom exception handling
    return false;  // Continue with default handling
  }
};

MyExceptionHandler* handler = new MyExceptionHandler();
stateManager->SetExceptionHandler(handler);
```

### SetVerboseLevel()

`source/global/management/include/G4StateManager.hh:105`

```cpp
static void SetVerboseLevel(G4int val);
```

Sets verbosity level for state change messages.

**Parameters:**
- `val`: Verbosity level
  - `0`: Silent
  - `1`: Errors only
  - `2`: Warnings and errors
  - `3`: All messages (default)

**Example:**
```cpp
G4StateManager::SetVerboseLevel(1);  // Only show errors
```

## Complete Usage Examples

### Monitoring State Changes

```cpp
class StateMonitor : public G4VStateDependent
{
 public:
  G4bool Notify(G4ApplicationState requestedState) override
  {
    G4StateManager* stateManager = G4StateManager::GetStateManager();
    G4ApplicationState currentState = stateManager->GetCurrentState();

    G4cout << "State transition: "
           << stateManager->GetStateString(currentState)
           << " -> "
           << stateManager->GetStateString(requestedState)
           << G4endl;

    // Log to file, update GUI, etc.

    return true;  // Allow transition
  }
};

// Register the monitor
StateMonitor* monitor = new StateMonitor();
G4StateManager::GetStateManager()->RegisterDependent(monitor);
```

### Validating Operations Based on State

```cpp
void MyDetectorConstruction::UpdateGeometry()
{
    G4StateManager* stateManager = G4StateManager::GetStateManager();
    G4ApplicationState state = stateManager->GetCurrentState();

    if (state != G4State_PreInit && state != G4State_Idle) {
        G4Exception("MyDetectorConstruction::UpdateGeometry()",
                   "InvalidState", JustWarning,
                   "Geometry can only be modified in PreInit or Idle state");
        return;
    }

    // Safe to modify geometry
    ModifyGeometry();
}
```

### Implementing State-Dependent Behavior

```cpp
class RunTimeService : public G4VStateDependent
{
 public:
  G4bool Notify(G4ApplicationState requestedState) override
  {
    switch(requestedState) {
      case G4State_Init:
        InitializeService();
        break;

      case G4State_Idle:
        if (isRunning) {
          FinalizeRun();
        }
        break;

      case G4State_GeomClosed:
        PrepareForRun();
        break;

      case G4State_EventProc:
        // Event processing started
        break;

      case G4State_Quit:
        Cleanup();
        break;

      case G4State_Abort:
        HandleError();
        break;

      default:
        break;
    }

    return true;  // Allow state change
  }

 private:
  G4bool isRunning = false;

  void InitializeService() { /* ... */ }
  void PrepareForRun() { isRunning = true; }
  void FinalizeRun() { isRunning = false; }
  void Cleanup() { /* ... */ }
  void HandleError() { /* ... */ }
};
```

### Safe State Transitions

```cpp
G4bool SafeTransitionToIdle()
{
    G4StateManager* stateManager = G4StateManager::GetStateManager();
    G4ApplicationState currentState = stateManager->GetCurrentState();

    // Check if transition is possible
    if (currentState == G4State_EventProc) {
        G4cerr << "Cannot transition to Idle during event processing"
               << G4endl;
        return false;
    }

    if (currentState == G4State_GeomClosed) {
        // Need to open geometry first
        if (!stateManager->SetNewState(G4State_Idle,
                                      "End of run - opening geometry")) {
            G4cerr << "Failed to open geometry" << G4endl;
            return false;
        }
    }

    return true;
}
```

### Exception Handling with State Recovery

```cpp
void RunSimulationWithRecovery()
{
    G4StateManager* stateManager = G4StateManager::GetStateManager();

    // Enable error recovery
    G4int originalSuppression = stateManager->GetSuppressAbortion();
    stateManager->SetSuppressAbortion(1);

    try {
        // Run simulation
        runManager->BeamOn(1000);

        // Check if we ended up in abort state
        if (stateManager->GetCurrentState() == G4State_Abort) {
            G4cerr << "Simulation aborted, attempting recovery..." << G4endl;

            // Try to recover to Idle state
            if (stateManager->SetNewState(G4State_Idle, "Recovery")) {
                G4cout << "Successfully recovered to Idle state" << G4endl;
            } else {
                G4cerr << "Recovery failed" << G4endl;
            }
        }
    }
    catch (...) {
        G4cerr << "Unexpected exception caught" << G4endl;
    }

    // Restore original behavior
    stateManager->SetSuppressAbortion(originalSuppression);
}
```

## Thread Safety

### Multi-Threading Behavior

`source/global/management/include/G4StateManager.hh:111`

- State manager is **thread-local** in multi-threaded mode
- Each worker thread has its own state manager instance
- Master thread has separate state manager
- States are independent between threads

**Thread States:**
- **Master Thread**: Manages overall run state (PreInit → Init → Idle → Quit)
- **Worker Threads**: Each goes through GeomClosed → EventProc cycles independently

**Example:**
```cpp
// In worker thread
G4StateManager* stateManager = G4StateManager::GetStateManager();
// This is a thread-local instance, separate from master
```

## Data Members

`source/global/management/include/G4StateManager.hh:111-120`

```cpp
private:
  static G4ThreadLocal G4StateManager* theStateManager;
  G4ApplicationState theCurrentState  = G4State_PreInit;
  G4ApplicationState thePreviousState = G4State_PreInit;
  std::vector<G4VStateDependent*> theDependentsList;
  G4VStateDependent* theBottomDependent = nullptr;
  G4int suppressAbortion                = 0;
  const char* msgptr                    = nullptr;
  G4VExceptionHandler* exceptionHandler = nullptr;
  static G4int verboseLevel;
```

## Performance Considerations

1. **State Queries**: Getting current/previous state is very fast (simple member access)

2. **State Changes**: Setting new state involves:
   - Validation check (fast)
   - Notification of all registered dependents (can be slow if many dependents)
   - Consider minimizing dependents for performance-critical code

3. **String Conversion**: `GetStateString()` involves string creation; cache results if called frequently

4. **State Checks**: For performance-critical code, check state once and cache rather than repeatedly querying

## Common Pitfalls

### 1. Invalid State Transitions

**Problem**: Attempting illegal state change
```cpp
// In EventProc state
stateManager->SetNewState(G4State_PreInit);  // ILLEGAL!
```

**Solution**: Follow valid state transition diagram

### 2. Not Checking Return Value

**Problem**: Ignoring failed state change
```cpp
stateManager->SetNewState(G4State_Idle);  // Might fail
DoSomethingRequiringIdleState();  // Unsafe
```

**Solution**: Always check return value
```cpp
if (stateManager->SetNewState(G4State_Idle)) {
    DoSomethingRequiringIdleState();
}
```

### 3. Blocking State Changes in Dependents

**Problem**: Dependent returns false, preventing valid transition
```cpp
G4bool Notify(G4ApplicationState requestedState) override
{
    return false;  // Blocks ALL state changes
}
```

**Solution**: Only return false for truly invalid transitions

### 4. Memory Leaks with Dependents

**Problem**: Not deregistering before deletion
```cpp
MyDependent* dep = new MyDependent();
stateManager->RegisterDependent(dep);
delete dep;  // Still registered!
```

**Solution**: Always deregister
```cpp
stateManager->DeregisterDependent(dep);
delete dep;
```

## See Also

- [G4ApplicationState](./g4applicationstate.md) - State enumeration
- [G4VStateDependent](./g4vstatedependent.md) - Base class for state-dependent objects
- [G4Exception](./g4exception.md) - Exception handling
- [G4RunManager](../run/api/g4runmanager.md) - Run management
- [Global Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/global/management/include/G4StateManager.hh`
- Source: `source/global/management/src/G4StateManager.cc`
- Inline: `source/global/management/include/G4StateManager.icc`
:::
