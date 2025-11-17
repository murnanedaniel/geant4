# G4StateManager

## Class Overview

**Defined in**: `/source/global/management/include/G4StateManager.hh`

**Implemented in**: `/source/global/management/src/G4StateManager.cc`

**Inline methods**: `/source/global/management/include/G4StateManager.icc`

`G4StateManager` is the central singleton class responsible for managing the application state throughout the Geant4 lifecycle. It maintains the current and previous states, validates state transitions, and notifies registered observers when states change.

## Purpose

The state manager serves as the authoritative source for application state information and coordinates state-dependent behavior across the Geant4 framework. It ensures that components operate only in appropriate states and provides hooks for custom behavior during state transitions.

## Class Declaration

```cpp
class G4StateManager
{
 public:
  static G4StateManager* GetStateManager();
  ~G4StateManager();

  G4StateManager(const G4StateManager&) = delete;
  G4StateManager& operator=(const G4StateManager&) = delete;
  G4bool operator==(const G4StateManager&) const = delete;
  G4bool operator!=(const G4StateManager&) const = delete;

  const G4ApplicationState& GetCurrentState() const;
  const G4ApplicationState& GetPreviousState() const;

  G4bool SetNewState(const G4ApplicationState& requestedState);
  G4bool SetNewState(const G4ApplicationState& requestedState, const char* msg);

  G4bool RegisterDependent(G4VStateDependent* aDependent, G4bool bottom = false);
  G4bool DeregisterDependent(G4VStateDependent* aDependent);
  G4VStateDependent* RemoveDependent(const G4VStateDependent* aDependent);

  G4String GetStateString(const G4ApplicationState& aState) const;

  void NotifyDeletion(const G4Event*);
  void NotifyDeletion(const G4Run*);

  inline void SetSuppressAbortion(G4int i);
  inline G4int GetSuppressAbortion() const;
  inline const char* GetMessage() const;
  inline void SetExceptionHandler(G4VExceptionHandler* eh);
  inline G4VExceptionHandler* GetExceptionHandler() const;
  static void SetVerboseLevel(G4int val);

 private:
  G4StateManager();

  static G4ThreadLocal G4StateManager* theStateManager;
  G4ApplicationState theCurrentState = G4State_PreInit;
  G4ApplicationState thePreviousState = G4State_PreInit;
  std::vector<G4VStateDependent*> theDependentsList;
  G4VStateDependent* theBottomDependent = nullptr;
  G4int suppressAbortion = 0;
  const char* msgptr = nullptr;
  G4VExceptionHandler* exceptionHandler = nullptr;
  static G4int verboseLevel;
};
```

## Public Methods

### Singleton Access

#### GetStateManager()

```cpp
static G4StateManager* GetStateManager();
```

**Description**: Returns the singleton instance of G4StateManager. Creates the instance on first call.

**Thread Safety**: Thread-local singleton - each thread gets its own instance

**Returns**: Pointer to the G4StateManager instance for the current thread

**Example**:
```cpp
G4StateManager* stateManager = G4StateManager::GetStateManager();
```

**Note**: Never delete the returned pointer - it's managed internally.

### State Query Methods

#### GetCurrentState()

```cpp
const G4ApplicationState& GetCurrentState() const;
```

**Description**: Returns the current application state

**Returns**: Reference to current `G4ApplicationState`

**Thread Safety**: Thread-safe read operation

**Performance**: Inline accessor - very fast

**Example**:
```cpp
G4StateManager* sm = G4StateManager::GetStateManager();
G4ApplicationState state = sm->GetCurrentState();

if (state == G4State_Idle) {
    // Safe to modify geometry
}
```

#### GetPreviousState()

```cpp
const G4ApplicationState& GetPreviousState() const;
```

**Description**: Returns the application state before the most recent transition

**Returns**: Reference to previous `G4ApplicationState`

**Thread Safety**: Thread-safe read operation

**Use Cases**:
- Determining state transition context
- Implementing state-dependent history
- Debugging state flow

**Example**:
```cpp
G4ApplicationState current = sm->GetCurrentState();
G4ApplicationState previous = sm->GetPreviousState();

if (current == G4State_Idle && previous == G4State_GeomClosed) {
    G4cout << "Run has completed" << G4endl;
}
```

#### GetStateString()

```cpp
G4String GetStateString(const G4ApplicationState& aState) const;
```

**Description**: Converts state enumeration to human-readable string

**Parameters**:
- `aState`: The application state to convert

**Returns**: String name of the state ("PreInit", "Init", "Idle", "GeomClosed", "EventProc", "Quit", "Abort", or "Unknown")

**Example**:
```cpp
G4ApplicationState state = sm->GetCurrentState();
G4String stateName = sm->GetStateString(state);
G4cout << "Current state: " << stateName << G4endl;
// Output: "Current state: Idle"
```

**Implementation**:
```cpp
G4String G4StateManager::GetStateString(const G4ApplicationState& aState) const
{
  G4String stateName;
  switch(aState)
  {
    case G4State_PreInit:    stateName = "PreInit"; break;
    case G4State_Init:       stateName = "Init"; break;
    case G4State_Idle:       stateName = "Idle"; break;
    case G4State_GeomClosed: stateName = "GeomClosed"; break;
    case G4State_EventProc:  stateName = "EventProc"; break;
    case G4State_Quit:       stateName = "Quit"; break;
    case G4State_Abort:      stateName = "Abort"; break;
    default:                 stateName = "Unknown"; break;
  }
  return stateName;
}
```

### State Transition Methods

#### SetNewState() - Basic

```cpp
G4bool SetNewState(const G4ApplicationState& requestedState);
```

**Description**: Request a state transition without an associated message

**Parameters**:
- `requestedState`: The desired new state

**Returns**:
- `true` if transition successful
- `false` if transition rejected by any observer

**Side Effects**:
- Updates `theCurrentState` if successful
- Updates `thePreviousState` with old current state
- Notifies all registered state-dependent observers
- Prints state change if verbose level > 0

**Example**:
```cpp
G4bool success = sm->SetNewState(G4State_Idle);
if (!success) {
    G4cerr << "State transition rejected" << G4endl;
}
```

#### SetNewState() - With Message

```cpp
G4bool SetNewState(const G4ApplicationState& requestedState, const char* msg);
```

**Description**: Request a state transition with an associated message

**Parameters**:
- `requestedState`: The desired new state
- `msg`: Message describing the state change context (can be nullptr)

**Returns**:
- `true` if transition successful
- `false` if transition rejected

**Message Handling**: The message pointer is stored temporarily and can be retrieved by observers via `GetMessage()` during notification

**Example**:
```cpp
const char* msg = "Starting run with 1000 events";
G4bool success = sm->SetNewState(G4State_GeomClosed, msg);
```

**State Transition Algorithm**:

```cpp
G4bool G4StateManager::SetNewState(const G4ApplicationState& requestedState,
                                   const char* msg)
{
  // Check abort suppression
  if(requestedState == G4State_Abort && suppressAbortion > 0) {
    if(suppressAbortion == 2) return false;
    if(theCurrentState == G4State_EventProc) return false;
  }

  msgptr = msg;
  G4ApplicationState savedState = thePreviousState;
  thePreviousState = theCurrentState;

  // Notify all regular dependents
  G4bool ack = true;
  for (auto* dependent : theDependentsList) {
    ack = dependent->Notify(requestedState);
    if (!ack) break;
  }

  // Notify bottom dependent (if exists)
  if (theBottomDependent != nullptr) {
    ack = theBottomDependent->Notify(requestedState);
  }

  // Finalize transition
  if (!ack) {
    thePreviousState = savedState;  // Restore previous state
  } else {
    theCurrentState = requestedState;
    if (verboseLevel > 0) {
      G4cout << "#### G4StateManager::SetNewState from "
             << GetStateString(thePreviousState) << " to "
             << GetStateString(requestedState) << G4endl;
    }
  }

  msgptr = nullptr;
  return ack;
}
```

**Special Handling**:
- **Abort Suppression**: If `suppressAbortion` is set, transitions to `G4State_Abort` may be blocked
- **Event Processing**: Aborts during event processing can be specifically suppressed
- **Rollback**: If any observer rejects, previous state is restored

### Observer Management Methods

#### RegisterDependent()

```cpp
G4bool RegisterDependent(G4VStateDependent* aDependent, G4bool bottom = false);
```

**Description**: Register an observer to be notified of state changes

**Parameters**:
- `aDependent`: Pointer to state-dependent object to register
- `bottom`: If true, register as "bottom dependent" (notified last)

**Returns**: `true` (always succeeds in current implementation)

**Behavior**:
- If `bottom == false`: Added to end of regular dependents list
- If `bottom == true`: Replaces current bottom dependent (previous bottom dependent moved to regular list)

**Notification Order**:
1. Regular dependents (in registration order)
2. Bottom dependent (if registered)

**Example**:
```cpp
class MyObserver : public G4VStateDependent {
    // ... implementation
};

MyObserver* observer = new MyObserver();
// Automatic registration in constructor, or manual:
sm->RegisterDependent(observer, false);  // Regular dependent
```

**Use Cases for Bottom Dependent**:
- Final validation after all other components have accepted
- Critical operations that must occur last
- System-level state management

#### DeregisterDependent()

```cpp
G4bool DeregisterDependent(G4VStateDependent* aDependent);
```

**Description**: Remove an observer from the notification list

**Parameters**:
- `aDependent`: Pointer to state-dependent object to deregister

**Returns**:
- `true` if object was found and removed
- `false` if object was not registered

**Note**: Automatically called by `G4VStateDependent` destructor

**Example**:
```cpp
G4bool removed = sm->DeregisterDependent(observer);
if (!removed) {
    G4cerr << "Observer was not registered" << G4endl;
}
```

#### RemoveDependent()

```cpp
G4VStateDependent* RemoveDependent(const G4VStateDependent* aDependent);
```

**Description**: Remove and return an observer from the notification list

**Parameters**:
- `aDependent`: Pointer to state-dependent object to remove

**Returns**:
- Pointer to removed object if found
- `nullptr` if not found

**Difference from DeregisterDependent()**: Returns the pointer instead of boolean

**Example**:
```cpp
G4VStateDependent* removed = sm->RemoveDependent(observer);
if (removed != nullptr) {
    // Object was removed; caller now responsible for it
    // Can use returned pointer or delete it
}
```

### Object Deletion Notification

#### NotifyDeletion(const G4Event*)

```cpp
void NotifyDeletion(const G4Event*);
```

**Description**: Notify all registered observers that an event is being deleted

**Parameters**:
- Pointer to G4Event being deleted

**Purpose**: Allows observers to clear pointers and avoid dangling references

**Called By**: G4EventManager when destroying event objects

**Example Implementation in Observer**:
```cpp
void MyClass::NotifyDeletion(const G4Event* evt) {
    if (currentEvent == evt) {
        currentEvent = nullptr;  // Clear dangling pointer
        SaveEventData();
    }
}
```

#### NotifyDeletion(const G4Run*)

```cpp
void NotifyDeletion(const G4Run*);
```

**Description**: Notify all registered observers that a run is being deleted

**Parameters**:
- Pointer to G4Run being deleted

**Purpose**: Allows observers to clear pointers and avoid dangling references

**Called By**: G4RunManager when destroying run objects

**Example Implementation in Observer**:
```cpp
void MyClass::NotifyDeletion(const G4Run* run) {
    if (currentRun == run) {
        currentRun = nullptr;  // Clear dangling pointer
        FinalizeRunData();
    }
}
```

### Configuration Methods

#### SetSuppressAbortion()

```cpp
inline void SetSuppressAbortion(G4int i);
```

**Description**: Configure abortion suppression behavior

**Parameters**:
- `i`: Suppression level
  - `0`: No suppression (default)
  - `1`: Suppress abort during event processing
  - `2`: Suppress all aborts

**Use Cases**:
- Testing and debugging
- Controlled error recovery
- Batch processing where errors should not halt execution

**Warning**: Use with caution - may hide critical errors

**Example**:
```cpp
// Suppress abort only during event processing
sm->SetSuppressAbortion(1);

// Process events...

// Restore normal behavior
sm->SetSuppressAbortion(0);
```

#### GetSuppressAbortion()

```cpp
inline G4int GetSuppressAbortion() const;
```

**Description**: Query current abortion suppression level

**Returns**: Current suppression level (0, 1, or 2)

**Example**:
```cpp
G4int level = sm->GetSuppressAbortion();
if (level > 0) {
    G4cout << "Abort suppression is active (level " << level << ")" << G4endl;
}
```

#### SetExceptionHandler()

```cpp
inline void SetExceptionHandler(G4VExceptionHandler* eh);
```

**Description**: Set custom exception handler for state-related errors

**Parameters**:
- `eh`: Pointer to custom exception handler (can be nullptr)

**Example**:
```cpp
class MyExceptionHandler : public G4VExceptionHandler {
    virtual G4bool Notify(const char* origin,
                         const char* code,
                         G4ExceptionSeverity severity,
                         const char* description) override {
        // Custom handling
        return true;
    }
};

MyExceptionHandler* handler = new MyExceptionHandler();
sm->SetExceptionHandler(handler);
```

#### GetExceptionHandler()

```cpp
inline G4VExceptionHandler* GetExceptionHandler() const;
```

**Description**: Get the current exception handler

**Returns**: Pointer to exception handler, or nullptr if none set

**Example**:
```cpp
G4VExceptionHandler* handler = sm->GetExceptionHandler();
if (handler != nullptr) {
    // Custom handler is installed
}
```

#### GetMessage()

```cpp
inline const char* GetMessage() const;
```

**Description**: Get the message associated with current state transition

**Returns**: Pointer to message string, or nullptr if no message

**Usage Context**: Called by observers during `Notify()` to get transition context

**Example**:
```cpp
class MyObserver : public G4VStateDependent {
    G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        const char* msg = sm->GetMessage();
        if (msg != nullptr) {
            G4cout << "State change message: " << msg << G4endl;
        }
        return true;
    }
};
```

**Important**: Message pointer is only valid during notification callbacks

#### SetVerboseLevel()

```cpp
static void SetVerboseLevel(G4int val);
```

**Description**: Set verbosity level for state change logging

**Parameters**:
- `val`: Verbose level
  - `0`: Silent (default)
  - `>0`: Print state transitions

**Scope**: Global for all threads (static variable)

**Output Format** (when verbose > 0):
```
#### G4StateManager::SetNewState from [previous] to [new]
```

**Example**:
```cpp
// Enable verbose output
G4StateManager::SetVerboseLevel(1);

// Now state changes print to console
sm->SetNewState(G4State_Idle);
// Output: #### G4StateManager::SetNewState from Init to Idle

// Disable verbose output
G4StateManager::SetVerboseLevel(0);
```

## Private Members

### Static Members

```cpp
static G4ThreadLocal G4StateManager* theStateManager;
```
Thread-local singleton instance pointer

```cpp
static G4int verboseLevel;
```
Global verbose level for state transition logging

### Instance Members

```cpp
G4ApplicationState theCurrentState = G4State_PreInit;
```
Current application state (initialized to PreInit)

```cpp
G4ApplicationState thePreviousState = G4State_PreInit;
```
Previous application state

```cpp
std::vector<G4VStateDependent*> theDependentsList;
```
List of registered state observers

```cpp
G4VStateDependent* theBottomDependent = nullptr;
```
Special observer notified last (if registered)

```cpp
G4int suppressAbortion = 0;
```
Abort suppression level

```cpp
const char* msgptr = nullptr;
```
Temporary pointer to transition message

```cpp
G4VExceptionHandler* exceptionHandler = nullptr;
```
Custom exception handler

## Thread Safety

### Thread-Local Storage

The state manager uses thread-local storage for the singleton instance:

```cpp
G4ThreadLocal G4StateManager* theStateManager;
```

**Implications**:
- Each thread has independent state manager
- No synchronization needed within a thread
- Master and worker threads have separate states
- State transitions don't propagate between threads

### Multi-threaded Initialization

```cpp
G4StateManager::G4StateManager()
{
#ifdef G4MULTITHREADED
  G4iosInitialization();  // Thread-local I/O setup
#endif
}
```

Special initialization ensures proper I/O handling in multi-threaded mode.

### Thread-Safe Operations

**Safe Operations**:
- `GetCurrentState()` - Read only, no contention
- `GetPreviousState()` - Read only, no contention
- `SetNewState()` - Modifies only thread-local state
- `RegisterDependent()` - Modifies only thread-local list

**No Cross-Thread Operations**: State managers in different threads never interact

## Usage Patterns

### Pattern 1: State-Conditional Logic

```cpp
void MyClass::DoOperation() {
    G4StateManager* sm = G4StateManager::GetStateManager();
    G4ApplicationState state = sm->GetCurrentState();

    switch(state) {
        case G4State_Idle:
            // Can modify geometry
            ModifyGeometry();
            break;

        case G4State_GeomClosed:
            // Can start events
            BeginEvent();
            break;

        case G4State_EventProc:
            // Can track particles
            TrackParticles();
            break;

        default:
            G4Exception("MyClass::DoOperation()",
                       "Invalid State",
                       JustWarning,
                       "Operation not available in current state");
    }
}
```

### Pattern 2: State Transition Wrapper

```cpp
class StateTransitionGuard {
public:
    StateTransitionGuard(G4ApplicationState newState) {
        sm = G4StateManager::GetStateManager();
        previousState = sm->GetCurrentState();
        success = sm->SetNewState(newState);
    }

    ~StateTransitionGuard() {
        if (success) {
            sm->SetNewState(previousState);  // Restore
        }
    }

    bool IsValid() const { return success; }

private:
    G4StateManager* sm;
    G4ApplicationState previousState;
    bool success;
};

// Usage
void PerformOperation() {
    StateTransitionGuard guard(G4State_Idle);
    if (guard.IsValid()) {
        // Operation with guaranteed state
    }
    // State automatically restored on scope exit
}
```

### Pattern 3: State Change Monitoring

```cpp
class StateMonitor : public G4VStateDependent {
public:
    StateMonitor() : G4VStateDependent(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState current = sm->GetCurrentState();
        const char* msg = sm->GetMessage();

        // Log all state transitions
        G4cout << "State transition: "
               << sm->GetStateString(current) << " -> "
               << sm->GetStateString(requestedState);

        if (msg != nullptr) {
            G4cout << " (" << msg << ")";
        }
        G4cout << G4endl;

        return true;  // Always allow
    }
};
```

## Common Pitfalls

### 1. Not Checking State Before Operations

**Wrong**:
```cpp
void ModifyDetector() {
    // Directly modify without checking state
    detector->SetSize(newSize);  // May fail or cause errors
}
```

**Correct**:
```cpp
void ModifyDetector() {
    G4StateManager* sm = G4StateManager::GetStateManager();
    if (sm->GetCurrentState() != G4State_Idle) {
        G4Exception("ModifyDetector()", "InvalidState",
                   JustWarning, "Can only modify in Idle state");
        return;
    }
    detector->SetSize(newSize);
}
```

### 2. Vetoing State Changes Unnecessarily

**Wrong**:
```cpp
G4bool Notify(G4ApplicationState requestedState) override {
    if (requestedState == G4State_EventProc && !ready) {
        return false;  // Blocks entire application!
    }
    return true;
}
```

**Correct**:
```cpp
G4bool Notify(G4ApplicationState requestedState) override {
    if (requestedState == G4State_EventProc && !ready) {
        G4Exception("MyClass::Notify()", "NotReady",
                   JustWarning, "Component not ready");
        PrepareForEvent();  // Fix the issue
    }
    return true;  // Allow state change
}
```

### 3. Assuming Cross-Thread State Synchronization

**Wrong**:
```cpp
// In master thread
sm->SetNewState(G4State_Idle);

// Assume worker threads also in Idle - WRONG!
// Each thread has independent state
```

**Correct**:
```cpp
// Each thread manages its own state
// Use thread-safe communication mechanisms for coordination
```

### 4. Storing Message Pointer

**Wrong**:
```cpp
class MyObserver : public G4VStateDependent {
    const char* savedMessage;  // Dangling pointer risk!

    G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        savedMessage = sm->GetMessage();  // Only valid during callback!
        return true;
    }
};
```

**Correct**:
```cpp
class MyObserver : public G4VStateDependent {
    G4String savedMessage;  // Store as string, not pointer

    G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        const char* msg = sm->GetMessage();
        if (msg != nullptr) {
            savedMessage = msg;  // Copy to string
        }
        return true;
    }
};
```

## Performance Considerations

### Fast Operations
- `GetCurrentState()` - Inline, single memory read
- `GetPreviousState()` - Inline, single memory read
- `GetSuppressAbortion()` - Inline, single memory read

### Moderate Operations
- `SetNewState()` - Iterates through all observers
- `RegisterDependent()` - Vector append
- `DeregisterDependent()` - Vector search and erase

### Slow Operations
- `GetStateString()` - Switch statement with string construction

**Optimization Tips**:
1. Cache state strings if used frequently
2. Keep observer `Notify()` methods fast
3. Minimize number of registered observers
4. Avoid repeated state string conversions in tight loops

## See Also

- [State Management Overview](state-management.md)
- [G4VStateDependent](g4vstatedependent.md)
- [G4ApplicationState](g4applicationstate.md)
- [G4RunManager](g4runmanager.md)
- [Multi-threading in Geant4](../multithreading.md)
