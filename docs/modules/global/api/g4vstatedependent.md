# G4VStateDependent

## Class Overview

**Defined in**: `/source/global/management/include/G4VStateDependent.hh`

**Implemented in**: `/source/global/management/src/G4VStateDependent.cc`

`G4VStateDependent` is an abstract base class that implements the Observer pattern for state change notifications. Classes that need to be notified when the Geant4 application state changes should derive from this class and implement the pure virtual `Notify()` method.

## Purpose

This class provides a standard interface for components to:
- React to application state changes
- Validate state transitions before they occur
- Receive notifications when events or runs are deleted
- Automatically register and deregister with the state manager

## Class Declaration

```cpp
class G4VStateDependent
{
 public:
  explicit G4VStateDependent(G4bool bottom = false);
  virtual ~G4VStateDependent();

  G4bool operator==(const G4VStateDependent& right) const;
  G4bool operator!=(const G4VStateDependent& right) const;

  virtual G4bool Notify(G4ApplicationState requestedState) = 0;

  virtual void NotifyDeletion(const G4Event*) {}
  virtual void NotifyDeletion(const G4Run*) {}

 private:
  G4VStateDependent(const G4VStateDependent& right);
  G4VStateDependent& operator=(const G4VStateDependent& right);
};
```

## Public Methods

### Constructor

```cpp
explicit G4VStateDependent(G4bool bottom = false);
```

**Description**: Constructs a state-dependent object and automatically registers it with G4StateManager

**Parameters**:
- `bottom`: Registration priority
  - `false` (default): Register as normal dependent (notified in registration order)
  - `true`: Register as "bottom dependent" (notified last, after all normal dependents)

**Side Effects**: Automatically calls `G4StateManager::RegisterDependent(this, bottom)`

**Example**:
```cpp
// Normal dependent
class MyObserver : public G4VStateDependent {
public:
    MyObserver() : G4VStateDependent(false) {
        // Automatically registered with state manager
    }
};

// Bottom dependent (critical final validation)
class CriticalValidator : public G4VStateDependent {
public:
    CriticalValidator() : G4VStateDependent(true) {
        // Registered as bottom dependent - notified last
    }
};
```

**When to Use Bottom Dependent**:
- Final validation after all other components
- System-level critical operations
- Operations that depend on all other components being ready

### Destructor

```cpp
virtual ~G4VStateDependent();
```

**Description**: Destroys the object and automatically deregisters from G4StateManager

**Side Effects**: Automatically calls `G4StateManager::DeregisterDependent(this)`

**Important**: Ensures clean removal from notification list even if derived class destructor throws

**Example**:
```cpp
{
    MyObserver* observer = new MyObserver();  // Registered
    // ... use observer ...
    delete observer;  // Automatically deregistered
}
```

### Notification Methods

#### Notify() - Pure Virtual

```cpp
virtual G4bool Notify(G4ApplicationState requestedState) = 0;
```

**Description**: Pure virtual method called by G4StateManager when a state change is requested

**Parameters**:
- `requestedState`: The state that the application is attempting to transition to

**Returns**:
- `true`: Accept the state change (allow transition)
- `false`: Reject the state change (veto transition)

**Call Context**: Called during `G4StateManager::SetNewState()`

**Call Order**:
1. All normal dependents in registration order
2. Bottom dependent (if registered)
3. If any returns false, transition is aborted

**Important Notes**:
- **Avoid vetoing unless absolutely necessary** - use command state validation instead
- Keep implementation fast - called on every state transition
- Can access transition message via `G4StateManager::GetMessage()`
- Current state still reflects old state during this callback

**Example - Basic Implementation**:
```cpp
class MyDetector : public G4VStateDependent {
public:
    MyDetector() : G4VStateDependent(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        switch (requestedState) {
            case G4State_Idle:
                OnIdleState();
                return true;

            case G4State_GeomClosed:
                OnGeometryClosed();
                return true;

            case G4State_EventProc:
                return OnEventStart();  // May veto if not ready

            default:
                return true;  // Accept other state changes
        }
    }

private:
    void OnIdleState() {
        // Geometry can be modified
        if (needsUpdate) {
            UpdateGeometry();
        }
    }

    void OnGeometryClosed() {
        // Geometry closed, finalize
        FinalizeGeometry();
    }

    G4bool OnEventStart() {
        // Validate readiness
        if (!IsReady()) {
            G4cerr << "Detector not ready for event!" << G4endl;
            return false;  // Veto state change
        }
        PrepareForEvent();
        return true;
    }

    G4bool needsUpdate = false;
    G4bool IsReady() { return true; }
    void UpdateGeometry() {}
    void FinalizeGeometry() {}
    void PrepareForEvent() {}
};
```

**Example - With Message Handling**:
```cpp
class MessageLogger : public G4VStateDependent {
public:
    MessageLogger() : G4VStateDependent(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState currentState = sm->GetCurrentState();
        const char* msg = sm->GetMessage();

        G4cout << "State transition: "
               << sm->GetStateString(currentState) << " -> "
               << sm->GetStateString(requestedState);

        if (msg != nullptr) {
            G4cout << " [" << msg << "]";
        }
        G4cout << G4endl;

        return true;  // Always accept
    }
};
```

**Example - State-Specific Actions**:
```cpp
class DataCollector : public G4VStateDependent {
public:
    DataCollector() : G4VStateDependent(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState currentState = sm->GetCurrentState();

        // Handle specific transitions
        if (currentState == G4State_GeomClosed &&
            requestedState == G4State_Idle) {
            // Run ending
            FinalizeRun();
        }
        else if (currentState == G4State_EventProc &&
                 requestedState == G4State_GeomClosed) {
            // Event ending
            FinalizeEvent();
        }
        else if (currentState == G4State_Idle &&
                 requestedState == G4State_GeomClosed) {
            // Run starting
            InitializeRun();
        }

        return true;
    }

private:
    void InitializeRun() {}
    void FinalizeRun() {}
    void FinalizeEvent() {}
};
```

#### NotifyDeletion(const G4Event*)

```cpp
virtual void NotifyDeletion(const G4Event*) {}
```

**Description**: Called when a G4Event object is being deleted

**Parameters**:
- Pointer to the G4Event being destroyed

**Default Implementation**: Empty (does nothing)

**Purpose**: Allows observers to clear pointers and avoid dangling references

**Called By**: G4StateManager::NotifyDeletion(const G4Event*), typically invoked by G4EventManager

**Override When**: Your class stores pointers to G4Event objects

**Example**:
```cpp
class EventAnalyzer : public G4VStateDependent {
public:
    EventAnalyzer() : G4VStateDependent(false), currentEvent(nullptr) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        if (requestedState == G4State_EventProc) {
            // Event starting - will get event pointer later
        }
        return true;
    }

    virtual void NotifyDeletion(const G4Event* evt) override {
        if (currentEvent == evt) {
            // Event we're tracking is being deleted
            ProcessEventData();  // Save any pending data
            currentEvent = nullptr;  // Clear pointer to avoid dangling reference
        }
    }

    void SetCurrentEvent(const G4Event* evt) {
        currentEvent = evt;
    }

private:
    const G4Event* currentEvent;

    void ProcessEventData() {
        if (currentEvent != nullptr) {
            // Extract and save data
        }
    }
};
```

**Important**: Always check pointer equality before clearing - multiple deletion notifications may occur

#### NotifyDeletion(const G4Run*)

```cpp
virtual void NotifyDeletion(const G4Run*) {}
```

**Description**: Called when a G4Run object is being deleted

**Parameters**:
- Pointer to the G4Run being destroyed

**Default Implementation**: Empty (does nothing)

**Purpose**: Allows observers to clear pointers and avoid dangling references

**Called By**: G4StateManager::NotifyDeletion(const G4Run*), typically invoked by G4RunManager

**Override When**: Your class stores pointers to G4Run objects

**Example**:
```cpp
class RunStatistics : public G4VStateDependent {
public:
    RunStatistics() : G4VStateDependent(false), currentRun(nullptr) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState currentState = sm->GetCurrentState();

        if (currentState == G4State_Idle &&
            requestedState == G4State_GeomClosed) {
            // Run starting
            statistics.clear();
        }
        return true;
    }

    virtual void NotifyDeletion(const G4Run* run) override {
        if (currentRun == run) {
            // Run we're tracking is being deleted
            SaveStatistics();  // Write final statistics
            currentRun = nullptr;  // Clear pointer
        }
    }

    void SetCurrentRun(const G4Run* run) {
        currentRun = run;
    }

private:
    const G4Run* currentRun;
    std::map<G4String, G4double> statistics;

    void SaveStatistics() {
        // Write statistics to file
    }
};
```

### Comparison Operators

#### operator==()

```cpp
G4bool operator==(const G4VStateDependent& right) const;
```

**Description**: Compare two state-dependent objects for equality

**Implementation**: Pointer comparison (`this == &right`)

**Returns**: `true` if same object (same address)

**Example**:
```cpp
G4VStateDependent* dep1 = new MyObserver();
G4VStateDependent* dep2 = new MyObserver();
G4VStateDependent* dep3 = dep1;

G4bool same1 = (*dep1 == *dep2);  // false (different objects)
G4bool same2 = (*dep1 == *dep3);  // true (same object)
```

#### operator!=()

```cpp
G4bool operator!=(const G4VStateDependent& right) const;
```

**Description**: Compare two state-dependent objects for inequality

**Implementation**: Pointer comparison (`this != &right`)

**Returns**: `true` if different objects

**Example**:
```cpp
if (*observer1 != *observer2) {
    G4cout << "Different observers" << G4endl;
}
```

## Registration and Lifecycle

### Automatic Registration

The constructor automatically registers the object with G4StateManager:

```cpp
G4VStateDependent::G4VStateDependent(G4bool bottom)
{
  G4StateManager* stateManager = G4StateManager::GetStateManager();
  stateManager->RegisterDependent(this, bottom);
}
```

**Implications**:
- No manual registration required
- Registration happens before derived class constructor
- Object immediately begins receiving notifications

### Automatic Deregistration

The destructor automatically deregisters the object:

```cpp
G4VStateDependent::~G4VStateDependent()
{
  G4StateManager* stateManager = G4StateManager::GetStateManager();
  stateManager->DeregisterDependent(this);
}
```

**Implications**:
- No manual cleanup required
- Safe even if state manager is being destroyed
- Deregistration happens after derived class destructor

### Lifecycle Best Practices

**Recommended**:
```cpp
class MyObserver : public G4VStateDependent {
public:
    MyObserver() : G4VStateDependent(false) {
        // Safe initialization - already registered
        Initialize();
    }

    virtual ~MyObserver() {
        // Cleanup before deregistration
        Cleanup();
        // Base class destructor deregisters automatically
    }
};
```

**Avoid**:
```cpp
// DON'T manually register/deregister
class BadObserver : public G4VStateDependent {
public:
    BadObserver() : G4VStateDependent(false) {
        // Already registered by base class
        G4StateManager::GetStateManager()->RegisterDependent(this);  // WRONG!
    }
};
```

## Implementation Patterns

### Pattern 1: State-Specific Initialization

```cpp
class DetectorInitializer : public G4VStateDependent {
public:
    DetectorInitializer() : G4VStateDependent(false), initialized(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        if (requestedState == G4State_Idle && !initialized) {
            // First transition to Idle - perform one-time initialization
            InitializeDetector();
            initialized = true;
        }
        return true;
    }

private:
    G4bool initialized;

    void InitializeDetector() {
        // One-time initialization
    }
};
```

### Pattern 2: Resource Management by State

```cpp
class ResourceManager : public G4VStateDependent {
public:
    ResourceManager() : G4VStateDependent(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState currentState = sm->GetCurrentState();

        // Allocate resources when entering GeomClosed
        if (currentState == G4State_Idle &&
            requestedState == G4State_GeomClosed) {
            AllocateResources();
        }

        // Free resources when leaving GeomClosed
        if (currentState == G4State_GeomClosed &&
            requestedState == G4State_Idle) {
            FreeResources();
        }

        return true;
    }

private:
    void AllocateResources() {
        // Allocate event-level resources
    }

    void FreeResources() {
        // Clean up resources
    }
};
```

### Pattern 3: Conditional State Validation

```cpp
class SystemValidator : public G4VStateDependent {
public:
    SystemValidator() : G4VStateDependent(true) {  // Bottom dependent
        // Last to validate
    }

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        // Only validate critical transitions
        if (requestedState == G4State_EventProc) {
            return ValidateReadyForEvent();
        }
        return true;
    }

private:
    G4bool ValidateReadyForEvent() {
        // Check all systems
        if (!PhysicsListReady()) {
            G4cerr << "Physics list not ready!" << G4endl;
            return false;
        }
        if (!DetectorReady()) {
            G4cerr << "Detector not ready!" << G4endl;
            return false;
        }
        return true;
    }

    G4bool PhysicsListReady() { return true; }
    G4bool DetectorReady() { return true; }
};
```

### Pattern 4: Multi-Level State Tracking

```cpp
class StateTracker : public G4VStateDependent {
public:
    StateTracker() : G4VStateDependent(false) {
        stateHistory.reserve(100);
    }

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();

        // Record transition
        StateTransition trans;
        trans.from = sm->GetCurrentState();
        trans.to = requestedState;
        trans.time = std::chrono::steady_clock::now();
        trans.message = sm->GetMessage() ? sm->GetMessage() : "";

        stateHistory.push_back(trans);

        return true;
    }

    void PrintHistory() const {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4cout << "State transition history:" << G4endl;
        for (const auto& trans : stateHistory) {
            G4cout << sm->GetStateString(trans.from) << " -> "
                   << sm->GetStateString(trans.to);
            if (!trans.message.empty()) {
                G4cout << " [" << trans.message << "]";
            }
            G4cout << G4endl;
        }
    }

private:
    struct StateTransition {
        G4ApplicationState from;
        G4ApplicationState to;
        std::chrono::steady_clock::time_point time;
        G4String message;
    };

    std::vector<StateTransition> stateHistory;
};
```

### Pattern 5: Lazy Initialization

```cpp
class LazyInitializer : public G4VStateDependent {
public:
    LazyInitializer() : G4VStateDependent(false), component(nullptr) {}

    virtual ~LazyInitializer() {
        delete component;
    }

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        // Initialize on first event
        if (requestedState == G4State_EventProc && component == nullptr) {
            component = CreateComponent();
        }
        return true;
    }

    MyComponent* GetComponent() {
        // May return nullptr before first event
        return component;
    }

private:
    MyComponent* component;

    MyComponent* CreateComponent() {
        // Expensive initialization
        return new MyComponent();
    }
};
```

## Common Use Cases

### 1. Geometry Updates

```cpp
class GeometryUpdater : public G4VStateDependent {
public:
    GeometryUpdater() : G4VStateDependent(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        if (requestedState == G4State_Idle) {
            // Geometry can be safely modified
            ApplyPendingChanges();
        }
        return true;
    }

    void RequestGeometryChange() {
        pendingChanges = true;
    }

private:
    G4bool pendingChanges = false;

    void ApplyPendingChanges() {
        if (pendingChanges) {
            // Modify geometry
            pendingChanges = false;
        }
    }
};
```

### 2. Data Collection and Analysis

```cpp
class EventDataCollector : public G4VStateDependent {
public:
    EventDataCollector() : G4VStateDependent(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        G4StateManager* sm = G4StateManager::GetStateManager();
        G4ApplicationState current = sm->GetCurrentState();

        if (current == G4State_GeomClosed && requestedState == G4State_Idle) {
            // Run ending - save all data
            WriteDataToFile();
            ResetCollectors();
        }

        return true;
    }

    virtual void NotifyDeletion(const G4Event* evt) override {
        if (currentEvent == evt) {
            ProcessEventData(evt);
            currentEvent = nullptr;
        }
    }

private:
    const G4Event* currentEvent = nullptr;

    void ProcessEventData(const G4Event* evt) {}
    void WriteDataToFile() {}
    void ResetCollectors() {}
};
```

### 3. Resource Pooling

```cpp
class ResourcePool : public G4VStateDependent {
public:
    ResourcePool() : G4VStateDependent(false) {}

    virtual G4bool Notify(G4ApplicationState requestedState) override {
        switch (requestedState) {
            case G4State_GeomClosed:
                // Run starting - allocate pool
                AllocatePool();
                break;

            case G4State_Idle:
                // Run ending - free pool
                FreePool();
                break;
        }
        return true;
    }

private:
    std::vector<Resource*> pool;

    void AllocatePool() {
        for (int i = 0; i < 100; ++i) {
            pool.push_back(new Resource());
        }
    }

    void FreePool() {
        for (auto* res : pool) {
            delete res;
        }
        pool.clear();
    }
};
```

## Best Practices

### Do's

1. **Keep Notify() Fast**: Called on every state change
2. **Return true Usually**: Only veto for critical validation failures
3. **Handle NotifyDeletion**: If you store G4Event/G4Run pointers
4. **Use State Manager Services**: GetMessage(), GetCurrentState(), etc.
5. **Initialize in Constructor**: Base class has already registered you

### Don'ts

1. **Don't Veto Unnecessarily**: Use command state validation instead
2. **Don't Store Message Pointer**: Copy to G4String if needed
3. **Don't Manually Register**: Constructor does it automatically
4. **Don't Perform Long Operations**: In Notify() - defer if possible
5. **Don't Assume Synchronous States**: In multi-threaded mode

### Thread Safety

- Each thread has its own state manager
- State-dependent objects are typically thread-local
- No synchronization needed within single thread
- Don't share state-dependent objects between threads

## Common Pitfalls

### Pitfall 1: Forgetting to Handle Deletion

**Wrong**:
```cpp
class BadCollector : public G4VStateDependent {
    const G4Event* event;  // May become dangling!

    G4bool Notify(G4ApplicationState state) override {
        return true;
    }
    // Missing NotifyDeletion override
};
```

**Correct**:
```cpp
class GoodCollector : public G4VStateDependent {
    const G4Event* event;

    G4bool Notify(G4ApplicationState state) override {
        return true;
    }

    void NotifyDeletion(const G4Event* evt) override {
        if (event == evt) {
            event = nullptr;  // Clear dangling pointer
        }
    }
};
```

### Pitfall 2: Blocking State Changes

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
        G4Exception("Notify", "NotReady", JustWarning, "Not ready");
        PrepareQuickly();  // Try to fix
    }
    return true;  // Allow state change
}
```

### Pitfall 3: Expensive Operations

**Wrong**:
```cpp
G4bool Notify(G4ApplicationState requestedState) override {
    // Expensive computation in notification
    for (int i = 0; i < 1000000; ++i) {
        DoComplexCalculation();
    }
    return true;
}
```

**Correct**:
```cpp
G4bool Notify(G4ApplicationState requestedState) override {
    // Mark work as needed
    needsProcessing = true;
    return true;
}

void ProcessWhenReady() {
    if (needsProcessing) {
        // Do expensive work when appropriate
        for (int i = 0; i < 1000000; ++i) {
            DoComplexCalculation();
        }
        needsProcessing = false;
    }
}
```

## See Also

- [State Management Overview](state-management.md)
- [G4StateManager](g4statemanager.md)
- [G4ApplicationState](g4applicationstate.md)
- [Observer Pattern](https://en.wikipedia.org/wiki/Observer_pattern)
