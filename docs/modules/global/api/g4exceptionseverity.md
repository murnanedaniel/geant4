# G4ExceptionSeverity API Documentation

## Overview

`G4ExceptionSeverity` is an enumeration that defines the severity levels for exceptions in Geant4. It controls the behavior of `G4Exception`, determining whether the program aborts, the run aborts, the event aborts, or execution simply continues with a warning.

::: tip Header File
**Location:** `source/global/management/include/G4ExceptionSeverity.hh`
**Author:** M.Asai - August 2002
**Last Update:** September 2023 (added IgnoreTheIssue)
:::

## Enumeration Definition

`source/global/management/include/G4ExceptionSeverity.hh:65-73`

```cpp
enum G4ExceptionSeverity
{
  FatalException,
  FatalErrorInArgument,
  RunMustBeAborted,
  EventMustBeAborted,
  JustWarning,
  IgnoreTheIssue
};
```

## Severity Levels

### FatalException

`source/global/management/include/G4ExceptionSeverity.hh:32-34`

**Description:** Error is severe or occurs during initialization

**Behavior:**
- Program is aborted immediately
- Core dump may be generated (system-dependent)
- Application state transitions to `G4State_Abort`
- No recovery possible

**When to Use:**
- Critical errors that prevent further execution
- Initialization failures
- Unrecoverable internal errors
- Corrupted data structures
- Impossible physical conditions

**Example:**
```cpp
if (detectorConstruction == nullptr) {
    G4Exception("G4RunManager::Initialize()",
               "Run001",
               FatalException,
               "Detector construction not defined!");
    // Program terminates here
}
```

**Output Example:**
```
-------- EEEE ------- G4Exception-START -------- EEEE -------
*** G4Exception : Run001
      issued by : G4RunManager::Initialize()
*** Fatal Exception ***
Detector construction not defined!
*** Fatal Exception ***
-------- EEEE -------- G4Exception-END --------- EEEE -------

*** G4Exception: Aborting execution ***
```

### FatalErrorInArgument

`source/global/management/include/G4ExceptionSeverity.hh:36-39`

**Description:** Fatal error caused by misuse of interfaces by user code

**Behavior:**
- Program is aborted immediately
- Core dump may be generated
- Application state transitions to `G4State_Abort`
- Indicates programming error in user code

**When to Use:**
- Invalid function arguments (null pointers, out of range values)
- Misuse of API
- Violation of preconditions
- Programming errors that should have been caught during development

**Example:**
```cpp
void G4Track::SetKineticEnergy(G4double energy)
{
    if (energy < 0.0) {
        G4ExceptionDescription ed;
        ed << "Negative kinetic energy: " << energy/MeV << " MeV";

        G4Exception("G4Track::SetKineticEnergy()",
                   "Track001",
                   FatalErrorInArgument,
                   ed);
        // Program terminates
    }
    // ... set energy ...
}
```

**Difference from FatalException:**
- `FatalException`: Internal Geant4 error or initialization problem
- `FatalErrorInArgument`: User code error (wrong API usage)

### RunMustBeAborted

`source/global/management/include/G4ExceptionSeverity.hh:41-45`

**Description:** Error at run initialization or unpleasant situation during event loop

**Behavior:**
- Current run is aborted
- Application returns to `G4State_Idle`
- Geometry is reopened
- Next run can be started after recovery

**When to Use:**
- Errors during `BeamOn()` setup
- Geometry closure problems
- Physics initialization issues during run
- Conditions that prevent run completion but allow recovery

**Example:**
```cpp
void MyRunAction::BeginOfRunAction(const G4Run* run)
{
    if (!ValidateGeometry()) {
        G4ExceptionDescription ed;
        ed << "Geometry validation failed for run " << run->GetRunID();

        G4Exception("MyRunAction::BeginOfRunAction()",
                   "Run002",
                   RunMustBeAborted,
                   ed);
        // Run aborted, returns to Idle state
        return;
    }

    // Continue with run initialization
}
```

**Execution Flow:**
```cpp
// State: Idle
runManager->BeamOn(1000);  // Attempts to start run
    // State: Idle -> GeomClosed
    // BeginOfRunAction called
    // G4Exception with RunMustBeAborted
    // State: GeomClosed -> Idle
// Execution continues here
// State: Idle (can start another run)
```

### EventMustBeAborted

`source/global/management/include/G4ExceptionSeverity.hh:47-49`

**Description:** Error during particle tracking

**Behavior:**
- Current event is aborted
- Run continues with next event
- Remaining events in run are processed normally
- No state change (stays in `G4State_GeomClosed`)

**When to Use:**
- Tracking errors for specific particles
- Invalid particle states
- Detector response calculation errors
- Event-specific problems that don't affect other events

**Example:**
```cpp
void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4Track* track = step->GetTrack();

    // Detect unphysical condition
    if (track->GetKineticEnergy() < -1e-9*eV) {
        G4ExceptionDescription ed;
        ed << "Negative kinetic energy detected!" << G4endl;
        ed << "Track ID: " << track->GetTrackID() << G4endl;
        ed << "Particle: " << track->GetParticleDefinition()->GetParticleName()
           << G4endl;
        ed << "Energy: " << track->GetKineticEnergy()/eV << " eV";

        G4Exception("MySteppingAction::UserSteppingAction()",
                   "Step001",
                   EventMustBeAborted,
                   ed);
        // Event aborted, run continues
        return;
    }
}
```

**Execution Flow:**
```cpp
runManager->BeamOn(1000);  // Start run with 1000 events
    // Events 1-99: processed normally
    // Event 100: G4Exception with EventMustBeAborted
    //   (event 100 aborted, data discarded)
    // Events 101-1000: processed normally
// Run completes with 999 successful events
```

### JustWarning

`source/global/management/include/G4ExceptionSeverity.hh:51-52`

**Description:** Warning message only

**Behavior:**
- Message printed to `G4cerr`
- Execution continues normally
- No state change
- No abortion

**When to Use:**
- Non-critical issues
- Suboptimal configurations
- Informational messages about unusual conditions
- Deprecated API usage
- Performance warnings

**Example:**
```cpp
void MyPhysicsList::SetCuts(G4double cut)
{
    if (cut > 10*mm) {
        G4ExceptionDescription ed;
        ed << "Production cut " << cut/mm << " mm is very large!" << G4endl;
        ed << "This may affect physics accuracy." << G4endl;
        ed << "Recommended maximum: 10 mm";

        G4Exception("MyPhysicsList::SetCuts()",
                   "Physics001",
                   JustWarning,
                   ed);
        // Execution continues
    }

    // Set the cut anyway
    SetDefaultCutValue(cut);
}
```

**Output Example:**
```
-------- WWWW ------- G4Exception-START -------- WWWW -------
*** G4Exception : Physics001
      issued by : MyPhysicsList::SetCuts()
*** Just Warning ***
Production cut 15 mm is very large!
This may affect physics accuracy.
Recommended maximum: 10 mm
*** Just Warning ***
-------- WWWW -------- G4Exception-END --------- WWWW -------
```

### IgnoreTheIssue

`source/global/management/include/G4ExceptionSeverity.hh:54-55`

**Description:** No message generated (added September 2023)

**Behavior:**
- Completely silent
- No output to any stream
- Execution continues normally
- No state change

**When to Use:**
- Suppressing known non-issues
- Conditional exception reporting
- Debug/development scenarios
- Temporary issue suppression

**Example:**
```cpp
void CheckValue(G4double value, G4bool verbose)
{
    if (value < 0) {
        // Only warn if verbose mode enabled
        G4ExceptionSeverity severity = verbose ? JustWarning : IgnoreTheIssue;

        G4Exception("MyClass::CheckValue()",
                   "Check001",
                   severity,
                   "Negative value detected");
        // Either warns or silent, depending on verbose flag
    }
}
```

::: warning Use Sparingly
`IgnoreTheIssue` completely suppresses exception reporting. Use only when you're certain the condition should be ignored and when you have other means of detection if needed.
:::

## Severity Comparison Table

| Severity | Abort Program | Abort Run | Abort Event | Print Message | State Change |
|----------|--------------|-----------|-------------|---------------|--------------|
| FatalException | Yes | Yes | Yes | Yes | → Abort |
| FatalErrorInArgument | Yes | Yes | Yes | Yes | → Abort |
| RunMustBeAborted | No | Yes | Yes | Yes | → Idle |
| EventMustBeAborted | No | No | Yes | Yes | None |
| JustWarning | No | No | No | Yes | None |
| IgnoreTheIssue | No | No | No | No | None |

## Usage Decision Tree

```
Is execution possible to continue?
├─ No → Is it a user code error?
│       ├─ Yes → FatalErrorInArgument
│       └─ No → FatalException
│
└─ Yes → Is the current run salvageable?
         ├─ No → RunMustBeAborted
         │
         └─ Yes → Is the current event salvageable?
                  ├─ No → EventMustBeAborted
                  │
                  └─ Yes → Is it worth notifying the user?
                           ├─ Yes → JustWarning
                           └─ No → IgnoreTheIssue
```

## Complete Usage Examples

### Validation with Multiple Severity Levels

```cpp
class ParameterValidator
{
 public:
  void ValidateEnergy(G4double energy, G4bool strict = false)
  {
    // Fatal: completely invalid
    if (energy < 0) {
        G4Exception("ParameterValidator::ValidateEnergy()",
                   "Val001",
                   FatalErrorInArgument,
                   "Energy cannot be negative!");
    }

    // Warning: valid but unusual
    if (energy > 100*TeV) {
        G4ExceptionDescription ed;
        ed << "Energy " << energy/TeV << " TeV is unusually high";

        G4Exception("ParameterValidator::ValidateEnergy()",
                   "Val002",
                   JustWarning,
                   ed);
    }

    // Conditional warning
    if (strict && energy < 1*keV) {
        G4ExceptionDescription ed;
        ed << "Energy " << energy/keV << " keV is below recommended minimum";

        G4Exception("ParameterValidator::ValidateEnergy()",
                   "Val003",
                   strict ? RunMustBeAborted : JustWarning,
                   ed);
    }
  }
};
```

### Progressive Error Handling

```cpp
class MyDetectorConstruction : public G4VUserDetectorConstruction
{
 private:
  G4int errorCount = 0;

 public:
  G4VPhysicalVolume* Construct() override
  {
    try {
        BuildGeometry();
    }
    catch (const std::exception& e) {
        errorCount++;

        G4ExceptionDescription ed;
        ed << "Geometry construction error #" << errorCount << G4endl;
        ed << "Exception: " << e.what();

        // First few errors: just warn
        if (errorCount <= 3) {
            G4Exception("MyDetectorConstruction::Construct()",
                       "Geom001",
                       JustWarning,
                       ed);
            // Try to continue
        }
        // Too many errors: abort
        else {
            G4Exception("MyDetectorConstruction::Construct()",
                       "Geom002",
                       FatalException,
                       ed);
        }
    }

    return worldPhysical;
  }
};
```

### Error Recovery Strategy

```cpp
void ProcessEventWithRecovery(G4Event* event)
{
    try {
        // Attempt primary generation
        GeneratePrimaries(event);
    }
    catch (...) {
        // Can't generate primaries → abort event
        G4Exception("ProcessEventWithRecovery()",
                   "Event001",
                   EventMustBeAborted,
                   "Primary generation failed");
        return;
    }

    try {
        // Attempt tracking
        TrackEvent(event);
    }
    catch (const TrackingException& e) {
        // Tracking error → abort event
        G4ExceptionDescription ed;
        ed << "Tracking failed: " << e.what();

        G4Exception("ProcessEventWithRecovery()",
                   "Event002",
                   EventMustBeAborted,
                   ed);
        return;
    }
    catch (...) {
        // Unknown error → abort run
        G4Exception("ProcessEventWithRecovery()",
                   "Event003",
                   RunMustBeAborted,
                   "Unknown error during event processing");
        return;
    }

    // Event successful
}
```

### User-Controlled Severity

```cpp
class ConfigurableChecker
{
 private:
  G4ExceptionSeverity fErrorMode = JustWarning;

 public:
  void SetErrorMode(const G4String& mode)
  {
    if (mode == "ignore")
        fErrorMode = IgnoreTheIssue;
    else if (mode == "warn")
        fErrorMode = JustWarning;
    else if (mode == "abort")
        fErrorMode = FatalException;
  }

  void CheckCondition(G4bool condition, const G4String& message)
  {
    if (!condition) {
        G4Exception("ConfigurableChecker::CheckCondition()",
                   "Check001",
                   fErrorMode,
                   message);
    }
  }
};

// Usage:
ConfigurableChecker checker;
checker.SetErrorMode("warn");  // Warnings during development
// checker.SetErrorMode("abort");  // Strict mode for validation
// checker.SetErrorMode("ignore");  // Production with known issues
```

## Best Practices

### 1. Choose Appropriate Severity

```cpp
// Good - appropriate severity for each case
if (pointer == nullptr) {
    G4Exception(..., FatalErrorInArgument, ...);  // User error
}

if (fileNotFound) {
    G4Exception(..., JustWarning, ...);  // Can continue without file
}

if (trackingError) {
    G4Exception(..., EventMustBeAborted, ...);  // Event-specific
}

// Bad - wrong severity
if (minorConfigIssue) {
    G4Exception(..., FatalException, ...);  // Overkill
}
```

### 2. Escalate Severity When Appropriate

```cpp
// Start with warning for first occurrence
static G4int errorCount = 0;
if (unusualCondition) {
    errorCount++;

    G4ExceptionSeverity severity = (errorCount > 10) ?
                                   FatalException : JustWarning;

    G4Exception(..., severity, ...);
}
```

### 3. Document Severity Choice

```cpp
// Good - comment explains why
if (value < minimum) {
    // JustWarning because we can use default value
    G4Exception(..., JustWarning, "Using default");
    value = defaultValue;
}

// Bad - unclear why severity was chosen
if (value < minimum) {
    G4Exception(..., JustWarning, "Bad value");
}
```

## Common Pitfalls

### 1. Using FatalException for Non-Fatal Issues

**Problem:**
```cpp
if (suboptimal_configuration) {
    G4Exception(..., FatalException, ...);  // Too harsh!
}
```

**Solution:**
```cpp
if (suboptimal_configuration) {
    G4Exception(..., JustWarning, ...);  // More appropriate
}
```

### 2. Not Considering Event vs Run Abortion

**Problem:**
```cpp
// In stepping action - aborts entire run!
G4Exception(..., RunMustBeAborted, ...);
```

**Solution:**
```cpp
// In stepping action - aborts only this event
G4Exception(..., EventMustBeAborted, ...);
```

### 3. Ignoring Recovery Opportunities

**Problem:**
```cpp
if (recoverable_error) {
    G4Exception(..., FatalException, ...);  // Could have recovered
}
```

**Solution:**
```cpp
if (recoverable_error) {
    G4Exception(..., EventMustBeAborted, ...);
    // or RunMustBeAborted
}
```

### 4. Overusing IgnoreTheIssue

**Problem:**
```cpp
// Silencing everything
G4Exception(..., IgnoreTheIssue, ...);
```

**Solution:**
```cpp
// Only ignore when truly appropriate
if (shouldReport) {
    G4Exception(..., JustWarning, ...);
} else {
    G4Exception(..., IgnoreTheIssue, ...);
}
```

## Thread Safety

### Multi-Threading Behavior
- Severity levels are simple enum values (thread-safe)
- Exception handling is thread-safe
- Each worker thread handles exceptions independently

### Worker Thread Exceptions
```cpp
// In worker thread
if (error_in_worker) {
    // EventMustBeAborted only affects this worker's event
    G4Exception(..., EventMustBeAborted, ...);
}

if (critical_error_in_worker) {
    // FatalException terminates this worker (and may affect run)
    G4Exception(..., FatalException, ...);
}
```

## See Also

- [G4Exception](./g4exception.md) - Exception reporting function
- [G4StateManager](./g4statemanager.md) - Application state management
- [G4ApplicationState](./g4applicationstate.md) - Application states
- [Global Module Overview](../index.md) - Complete module documentation

---

::: info Source Reference
Complete implementation in:
- Header: `source/global/management/include/G4ExceptionSeverity.hh`

This is a pure enumeration with no source file.
:::
