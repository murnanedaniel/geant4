# G4Exception API Documentation

## Overview

`G4Exception` is the global error reporting mechanism in Geant4. It provides a unified way to report errors, warnings, and other exceptional conditions with consistent formatting, severity levels, and optional program abortion. All Geant4 error messages should use this function rather than direct output or standard C++ exceptions.

::: tip Header File
**Location:** `source/global/management/include/G4Exception.hh`
**Authors:** G.Cosmo, M.Asai - May 1999
:::

## Function Declarations

### Basic Form

`source/global/management/include/G4Exception.hh:42-44`

```cpp
void G4Exception(const char* originOfException,
                 const char* exceptionCode,
                 G4ExceptionSeverity severity,
                 const char* description);
```

Reports an exception with basic text description.

**Parameters:**
- `originOfException`: Class and method where error occurred (e.g., "G4Track::SetKineticEnergy()")
- `exceptionCode`: Unique error code identifier (e.g., "Track001")
- `severity`: Severity level (see [G4ExceptionSeverity](./g4exceptionseverity.md))
- `description`: Human-readable error description

### Stream Form

`source/global/management/include/G4Exception.hh:46-48`

```cpp
void G4Exception(const char* originOfException,
                 const char* exceptionCode,
                 G4ExceptionSeverity severity,
                 G4ExceptionDescription& description);
```

Reports an exception with stream-based description.

**Parameters:**
- `originOfException`: Source location
- `exceptionCode`: Error code
- `severity`: Severity level
- `description`: String stream containing formatted message

### Extended Form

`source/global/management/include/G4Exception.hh:50-53`

```cpp
void G4Exception(const char* originOfException,
                 const char* exceptionCode,
                 G4ExceptionSeverity severity,
                 G4ExceptionDescription& description,
                 const char* comments);
```

Reports an exception with additional comments.

**Parameters:**
- Same as stream form, plus:
- `comments`: Additional contextual information

## G4ExceptionDescription

`source/global/management/include/G4Exception.hh:40`

```cpp
using G4ExceptionDescription = std::ostringstream;
```

Type alias for building formatted exception messages using stream operators.

**Usage:**
```cpp
G4ExceptionDescription ed;
ed << "Invalid value: " << value << G4endl;
ed << "Expected range: [" << min << ", " << max << "]";
G4Exception("MyClass::MyMethod()", "Code001", FatalException, ed);
```

## Exception Behavior by Severity

The behavior of `G4Exception` depends on the severity level:

### FatalException
- **Action**: Print error message and abort program
- **Return**: Does not return (calls `abort()` or `G4Abort()`)
- **Usage**: Unrecoverable errors
- **State**: Transitions to `G4State_Abort`

### FatalErrorInArgument
- **Action**: Print error message and abort program
- **Return**: Does not return
- **Usage**: Invalid function arguments that cannot be handled
- **State**: Transitions to `G4State_Abort`

### RunMustBeAborted
- **Action**: Print error message and abort current run
- **Return**: Returns to caller after aborting run
- **Usage**: Errors that prevent run continuation but allow recovery
- **State**: Transitions from `G4State_GeomClosed` to `G4State_Idle`

### EventMustBeAborted
- **Action**: Print error message and abort current event
- **Return**: Returns to caller after aborting event
- **Usage**: Errors during event processing that allow continuing with next event
- **State**: Event aborted, run continues

### JustWarning
- **Action**: Print warning message to `G4cerr`
- **Return**: Returns normally to caller
- **Usage**: Non-critical issues that should be noted
- **State**: No state change

### IgnoreTheIssue
- **Action**: No message generated
- **Return**: Returns immediately
- **Usage**: Suppressed/ignored errors (use sparingly)
- **State**: No state change

## Usage Examples

### Basic Error Reporting

```cpp
void MyClass::SetEnergy(G4double energy)
{
    if (energy < 0.0) {
        G4Exception("MyClass::SetEnergy()",
                   "Energy001",
                   FatalErrorInArgument,
                   "Energy must be positive!");
        // Program terminates here
    }

    fEnergy = energy;
}
```

### Warning Message

```cpp
void CheckConfiguration()
{
    if (numThreads > recommendedMax) {
        G4Exception("MyClass::CheckConfiguration()",
                   "Config001",
                   JustWarning,
                   "Number of threads exceeds recommended maximum. "
                   "Performance may degrade.");
        // Execution continues
    }
}
```

### Formatted Exception with Stream

```cpp
void ValidateParameter(G4double value, G4double min, G4double max)
{
    if (value < min || value > max) {
        G4ExceptionDescription ed;
        ed << "Parameter value " << value << " is out of range!" << G4endl;
        ed << "Valid range: [" << min << ", " << max << "]" << G4endl;
        ed << "Using default value: " << (min + max) / 2.0;

        G4Exception("MyClass::ValidateParameter()",
                   "Param001",
                   JustWarning,
                   ed);
    }
}
```

### Event Abortion

```cpp
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4Track* track = step->GetTrack();

    // Check for unphysical condition
    if (track->GetKineticEnergy() < 0) {
        G4ExceptionDescription ed;
        ed << "Track has negative kinetic energy!" << G4endl;
        ed << "Track ID: " << track->GetTrackID() << G4endl;
        ed << "Position: " << track->GetPosition() << G4endl;

        G4Exception("MySteppingAction::UserSteppingAction()",
                   "Step001",
                   EventMustBeAborted,
                   ed);
        // Event is aborted, returns here
        // Next event will be processed
    }
}
```

### Run Abortion

```cpp
void MyRunAction::BeginOfRunAction(const G4Run* run)
{
    // Verify geometry is properly initialized
    if (!GeometryIsValid()) {
        G4ExceptionDescription ed;
        ed << "Geometry validation failed!" << G4endl;
        ed << "Cannot proceed with run " << run->GetRunID();

        G4Exception("MyRunAction::BeginOfRunAction()",
                   "Run001",
                   RunMustBeAborted,
                   ed);
        // Run aborted, state returns to Idle
    }
}
```

### Detailed Error with Comments

```cpp
void ProcessData(const std::vector<G4double>& data)
{
    if (data.empty()) {
        G4ExceptionDescription ed;
        ed << "Data vector is empty!";

        G4Exception("MyClass::ProcessData()",
                   "Data001",
                   FatalException,
                   ed,
                   "This usually indicates a problem with data initialization. "
                   "Check that detector has recorded hits.");
        // Program aborts
    }
}
```

### Conditional Exception Severity

```cpp
void HandleError(G4double deviation, G4bool strict)
{
    G4ExceptionSeverity severity = strict ? FatalException : JustWarning;

    G4ExceptionDescription ed;
    ed << "Deviation from expected value: " << deviation;

    G4Exception("MyClass::HandleError()",
               "Error001",
               severity,
               ed);

    // Behavior depends on 'strict' flag
}
```

### Range Checking with Detailed Information

```cpp
void G4Track::SetKineticEnergy(G4double energy)
{
    if (energy < 0.0) {
        G4ExceptionDescription ed;
        ed << "Negative kinetic energy requested: " << energy/MeV << " MeV"
           << G4endl;
        ed << "Track ID: " << fTrackID << G4endl;
        ed << "Particle: " << GetParticleDefinition()->GetParticleName()
           << G4endl;
        ed << "Current position: " << fPosition/mm << " mm" << G4endl;
        ed << "Current energy: " << GetKineticEnergy()/MeV << " MeV";

        G4Exception("G4Track::SetKineticEnergy()",
                   "Track001",
                   FatalErrorInArgument,
                   ed,
                   "Kinetic energy must be non-negative.");
    }

    // Set energy...
}
```

### Multiple Exception Possibilities

```cpp
void InitializePhysics()
{
    try {
        LoadPhysicsTables();
    }
    catch (const std::exception& e) {
        G4ExceptionDescription ed;
        ed << "Failed to load physics tables" << G4endl;
        ed << "Standard exception: " << e.what();

        G4Exception("MyClass::InitializePhysics()",
                   "Physics001",
                   FatalException,
                   ed);
    }

    if (!ValidatePhysicsTables()) {
        G4Exception("MyClass::InitializePhysics()",
                   "Physics002",
                   RunMustBeAborted,
                   "Physics table validation failed!");
    }
}
```

## Exception Code Conventions

### Naming Convention
- Format: `"ModuleNNN"` where Module is the subsystem and NNN is a number
- Examples: `"Track001"`, `"Geom042"`, `"EM1003"`

### Code Organization
```cpp
// Track module errors
const char* TRACK_INVALID_ID     = "Track001";
const char* TRACK_NEGATIVE_ENERGY = "Track002";
const char* TRACK_NULL_PARTICLE  = "Track003";

// Geometry module errors
const char* GEOM_OVERLAP         = "Geom001";
const char* GEOM_INVALID_VOLUME  = "Geom002";

// Using the codes
void MyMethod() {
    G4Exception("MyClass::MyMethod()",
               TRACK_NEGATIVE_ENERGY,
               FatalErrorInArgument,
               "Energy cannot be negative!");
}
```

## Exception Output Format

### Standard Format
```
-------- EEEE ------- G4Exception-START -------- EEEE -------

*** G4Exception : Track001
      issued by : G4Track::SetKineticEnergy()
*** Fatal Error In Argument ***
Negative kinetic energy requested: -10.5 MeV
Track ID: 42
Particle: e-
Current position: (100, 200, 50) mm
Current energy: 25.3 MeV
Kinetic energy must be non-negative.

*** Fatal Error In Argument ***
-------- EEEE -------- G4Exception-END --------- EEEE -------
```

### Components
1. **Header**: `G4Exception-START` with severity indicator
2. **Exception Code**: Unique identifier
3. **Origin**: Where exception occurred
4. **Severity**: Error level
5. **Description**: Main error message
6. **Comments**: Additional context (if provided)
7. **Footer**: `G4Exception-END` with severity indicator

## Integration with State Manager

`G4Exception` interacts with `G4StateManager`:

```cpp
void G4Exception(...)
{
    // Get state manager
    G4StateManager* stateManager = G4StateManager::GetStateManager();

    // Print exception message
    PrintExceptionMessage();

    // Take action based on severity
    switch(severity) {
        case FatalException:
        case FatalErrorInArgument:
            stateManager->SetNewState(G4State_Abort);
            Abort();  // Does not return
            break;

        case RunMustBeAborted:
            stateManager->SetNewState(G4State_Idle);
            AbortRun();
            return;

        case EventMustBeAborted:
            AbortEvent();
            return;

        case JustWarning:
        case IgnoreTheIssue:
            return;  // Continue execution
    }
}
```

## Custom Exception Handlers

You can override default exception behavior with a custom handler:

```cpp
class MyExceptionHandler : public G4VExceptionHandler
{
 public:
  G4bool Notify(const char* originOfException,
               const char* exceptionCode,
               G4ExceptionSeverity severity,
               const char* description) override
  {
    // Custom handling
    LogToFile(originOfException, exceptionCode, severity, description);

    // Send to monitoring system
    SendToMonitoring(exceptionCode, severity);

    // Return false to continue with default handling
    // Return true to suppress default handling
    return false;
  }
};

// Install custom handler
MyExceptionHandler* handler = new MyExceptionHandler();
G4StateManager::GetStateManager()->SetExceptionHandler(handler);
```

## Suppressing Abortion

For batch processing or testing, you can suppress program abortion:

```cpp
G4StateManager* stateManager = G4StateManager::GetStateManager();

// Suppress abortion (state returns to Idle instead)
stateManager->SetSuppressAbortion(1);

try {
    // Run potentially failing code
    runManager->BeamOn(1000);

    // Check if we ended in abort state
    if (stateManager->GetCurrentState() == G4State_Abort) {
        G4cout << "Run encountered error, recovering..." << G4endl;
        stateManager->SetNewState(G4State_Idle);
    }
}
catch (...) {
    // Handle any other exceptions
}

// Restore normal behavior
stateManager->SetSuppressAbortion(0);
```

## Best Practices

### 1. Always Provide Origin
```cpp
// Good
G4Exception("MyClass::MyMethod()", "Code001", ...);

// Bad
G4Exception("", "Code001", ...);
```

### 2. Use Unique Exception Codes
```cpp
// Good - unique codes
G4Exception("Method1()", "MyClass001", ...);
G4Exception("Method2()", "MyClass002", ...);

// Bad - reused codes
G4Exception("Method1()", "Error", ...);
G4Exception("Method2()", "Error", ...);
```

### 3. Appropriate Severity
```cpp
// Good - appropriate severity
if (config_nonoptimal) {
    G4Exception(..., JustWarning, ...);  // Non-critical
}
if (data_corrupted) {
    G4Exception(..., FatalException, ...);  // Critical
}

// Bad - wrong severity
if (minor_issue) {
    G4Exception(..., FatalException, ...);  // Overkill
}
```

### 4. Informative Messages
```cpp
// Good - detailed and actionable
G4ExceptionDescription ed;
ed << "Energy " << E << " exceeds maximum " << maxE << G4endl;
ed << "Reduce beam energy or increase detector capability";
G4Exception(..., ed);

// Bad - vague
G4Exception(..., "Error in energy");
```

### 5. Include Context
```cpp
// Good - provides context
G4ExceptionDescription ed;
ed << "Track ID: " << trackID << G4endl;
ed << "Position: " << position << G4endl;
ed << "Time: " << time << G4endl;
ed << "Energy value: " << energy;
G4Exception(..., ed);

// Bad - no context
G4Exception(..., "Invalid energy");
```

## Thread Safety

### Multi-Threading Behavior
- `G4Exception` is thread-safe
- Each worker thread can call independently
- Exception messages are serialized to prevent interleaving
- State manager is thread-local

### Worker Thread Exceptions
```cpp
// In worker thread
void MyAction::UserSteppingAction(const G4Step* step)
{
    if (error_condition) {
        // Safe to call from worker
        G4Exception("MyAction::UserSteppingAction()",
                   "Worker001",
                   EventMustBeAborted,
                   "Error in worker thread");
        // Event aborted in this worker only
    }
}
```

## Common Pitfalls

### 1. Forgetting to Check Return

**Problem:**
```cpp
G4Exception(..., EventMustBeAborted, ...);
continueProcessing();  // Still executes!
```

**Solution:**
```cpp
G4Exception(..., EventMustBeAborted, ...);
return;  // Explicit return after event abortion
```

### 2. Using C++ Exceptions Instead

**Problem:**
```cpp
throw std::runtime_error("Something went wrong");  // Not Geant4 style
```

**Solution:**
```cpp
G4Exception("MyClass::MyMethod()", "Code001",
           FatalException, "Something went wrong");
```

### 3. Non-Unique Exception Codes

**Problem:**
```cpp
G4Exception(..., "ERROR", ...);  // Appears everywhere
```

**Solution:**
```cpp
G4Exception(..., "MyClass001", ...);  // Unique identifier
```

### 4. Empty Origin Strings

**Problem:**
```cpp
G4Exception("", "Code001", ...);  // Can't find where it occurred
```

**Solution:**
```cpp
G4Exception("MyClass::MyMethod()", "Code001", ...);
```

## Performance Considerations

1. **Exception Construction**: Building `G4ExceptionDescription` with streams has some overhead. For frequently-checked conditions, validate first:
   ```cpp
   // Fast path - no exception
   if (value_is_valid) return;

   // Slow path - build detailed exception
   G4ExceptionDescription ed;
   // ... build message ...
   G4Exception(..., ed);
   ```

2. **String Operations**: Stream operations allocate memory. For critical paths, use simple string literals:
   ```cpp
   // Faster
   G4Exception(..., "Simple error message");

   // Slower
   G4ExceptionDescription ed;
   ed << "Complex " << formatted << " message";
   G4Exception(..., ed);
   ```

## See Also

- [G4ExceptionSeverity](./g4exceptionseverity.md) - Severity level enumeration
- [G4StateManager](./g4statemanager.md) - Application state management
- [G4VExceptionHandler](./g4vexceptionhandler.md) - Custom exception handling
- [Global Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/global/management/include/G4Exception.hh`
- Source: `source/global/management/src/G4Exception.cc`
:::
