# Exception Handling System

Global error and exception handling mechanism for Geant4

## Overview

The Geant4 Exception Handling System provides a unified mechanism for reporting errors, warnings, and exceptional conditions throughout the toolkit. This system consists of three key components:

1. **G4Exception** - The main exception function that handles error reporting and program flow control
2. **G4ExceptionSeverity** - An enumeration defining severity levels for exceptions
3. **G4VExceptionHandler** - A base class for implementing custom exception handlers

The exception system integrates with the G4StateManager to control program execution based on exception severity, allowing graceful handling of errors ranging from simple warnings to fatal exceptions requiring program termination.

## Source Locations

**G4Exception Function:**
- Header: `/home/user/geant4/source/global/management/include/G4Exception.hh` (lines 1-55)
- Implementation: `/home/user/geant4/source/global/management/src/G4Exception.cc` (lines 1-142)
- Authors: G. Cosmo, M. Asai (May 1999)

**G4ExceptionSeverity Enumeration:**
- Header: `/home/user/geant4/source/global/management/include/G4ExceptionSeverity.hh` (lines 1-74)
- Author: M. Asai (August 2002, updated September 2023)

**G4VExceptionHandler Base Class:**
- Header: `/home/user/geant4/source/global/management/include/G4VExceptionHandler.hh` (lines 1-64)
- Implementation: `/home/user/geant4/source/global/management/src/G4VExceptionHandler.cc` (lines 1-65)
- Author: M. Asai (August 2002)

## Exception Severity Levels

The `G4ExceptionSeverity` enumeration (lines 65-73 of G4ExceptionSeverity.hh) defines six severity levels:

### FatalException
**Purpose:** Severe error or initialization-time error
**Behavior:** Program will be aborted and core dump will be generated
**Use case:** Critical failures that prevent any further execution

```cpp
G4Exception("G4RunManager::Initialize",
            "Run0001",
            FatalException,
            "Geometry has not been defined");
```

### FatalErrorInArgument
**Purpose:** Fatal error caused by misuse of interfaces
**Behavior:** Program will be aborted and core dump will be generated
**Use case:** Invalid arguments or API misuse by user code

```cpp
G4Exception("G4Material::G4Material",
            "Mat0001",
            FatalErrorInArgument,
            "Invalid density value - must be positive");
```

### RunMustBeAborted
**Purpose:** Error during run initialization or event loop
**Behavior:** Current run will be aborted, application returns to "Idle" state
**Use case:** Errors during geometry closing or unpleasant situations in event loop

```cpp
G4Exception("G4RunManager::BeamOn",
            "Run0002",
            RunMustBeAborted,
            "Failed to open geometry - overlap detected");
```

### EventMustBeAborted
**Purpose:** Error during particle tracking
**Behavior:** Current event will be aborted, run continues
**Use case:** Recoverable errors during event processing

```cpp
G4Exception("G4Transportation::AlongStepDoIt",
            "Track0001",
            EventMustBeAborted,
            "Particle entered undefined volume");
```

### JustWarning
**Purpose:** Display informational or warning messages
**Behavior:** Message is displayed, execution continues normally
**Use case:** Non-critical issues, deprecated features, or informational messages

```cpp
G4Exception("G4Material::AddElement",
            "Mat0002",
            JustWarning,
            "Element already exists - replacing previous definition");
```

### IgnoreTheIssue
**Purpose:** Suppress message generation
**Behavior:** No message generated, execution continues
**Use case:** Situations where exception call exists but should be silently ignored
**Added:** September 2023

```cpp
G4Exception("G4ProcessManager::CheckOrderingParameters",
            "Process0001",
            IgnoreTheIssue,
            "");  // Silent - no output
```

## G4Exception Function Signatures

The G4Exception function is provided in three overloaded forms (lines 42-53 of G4Exception.hh):

### Basic Form

```cpp
void G4Exception(const char* originOfException,
                 const char* exceptionCode,
                 G4ExceptionSeverity severity,
                 const char* description);
```

**Parameters:**
- `originOfException` - Name of the method/function where exception occurred
- `exceptionCode` - Unique code identifying the exception (e.g., "Run0001")
- `severity` - Severity level from G4ExceptionSeverity enumeration
- `description` - Human-readable description of the error

### Stream-Based Form

```cpp
void G4Exception(const char* originOfException,
                 const char* exceptionCode,
                 G4ExceptionSeverity severity,
                 G4ExceptionDescription& description);
```

Uses `G4ExceptionDescription` (typedef for `std::ostringstream` at line 40) to build complex messages:

```cpp
G4ExceptionDescription ed;
ed << "Energy = " << energy << " MeV" << G4endl;
ed << "Expected range: 0 to " << maxEnergy << " MeV";
G4Exception("MyClass::Calculate", "User0001", JustWarning, ed);
```

### Extended Form with Comments

```cpp
void G4Exception(const char* originOfException,
                 const char* exceptionCode,
                 G4ExceptionSeverity severity,
                 G4ExceptionDescription& description,
                 const char* comments);
```

Appends additional comments to the description before reporting (lines 135-141 of G4Exception.cc).

## G4VExceptionHandler Base Class

The `G4VExceptionHandler` class (lines 43-62 of G4VExceptionHandler.hh) allows customization of exception behavior.

### Class Interface

```cpp
class G4VExceptionHandler
{
 public:
  G4VExceptionHandler();
  virtual ~G4VExceptionHandler() = default;

  virtual G4bool Notify(const char* originOfException,
                        const char* exceptionCode,
                        G4ExceptionSeverity severity,
                        const char* description) = 0;
};
```

### Notify Method

The pure virtual `Notify()` method (lines 51-57) is invoked when G4Exception occurs:

**Return value:**
- `true` - Core dump will be generated (for fatal errors)
- `false` - Program execution continues (for warnings)

**Behavior:**
- Automatically registered with G4StateManager upon construction (lines 34-38 of G4VExceptionHandler.cc)
- Called by G4Exception before default exception handling (lines 62-69 of G4Exception.cc)

## Exception Handling Flow

The exception handling process (G4Exception.cc, lines 59-123):

1. **Custom Handler Check:** Retrieves exception handler from G4StateManager (line 62-63)
2. **Handler Notification:** If handler exists, calls `Notify()` method (lines 67-68)
3. **Default Handling:** If no handler, formats and outputs message with appropriate banner (lines 70-108)
4. **Severity-Based Output:**
   - Fatal errors (FatalException, FatalErrorInArgument, RunMustBeAborted, EventMustBeAborted): Output to G4cerr (lines 84-97)
   - Warnings (JustWarning): Output to G4cout (lines 100-102)
   - Ignored (IgnoreTheIssue): No output (lines 105-107)
5. **Abort Decision:** If `toBeAborted` is true, attempts state change to G4State_Abort and calls `abort()` (lines 110-122)

## Usage Examples

### Basic Error Reporting

```cpp
#include "G4Exception.hh"

void MyDetectorConstruction::Construct()
{
    if (worldVolume == nullptr)
    {
        G4Exception("MyDetectorConstruction::Construct",
                   "Det0001",
                   FatalException,
                   "World volume not defined");
    }
}
```

### Warning with Details

```cpp
#include "G4Exception.hh"

void MyPhysicsList::SetCuts(G4double cutValue)
{
    if (cutValue < 0.1*mm)
    {
        G4ExceptionDescription msg;
        msg << "Cut value " << cutValue/mm << " mm is very small." << G4endl;
        msg << "This may significantly slow down simulation." << G4endl;
        msg << "Recommended minimum: 0.1 mm";

        G4Exception("MyPhysicsList::SetCuts",
                   "Phys0001",
                   JustWarning,
                   msg);
    }
}
```

### Input Validation

```cpp
#include "G4Exception.hh"

void MyPrimaryGenerator::SetEnergy(G4double energy)
{
    if (energy <= 0.0)
    {
        G4ExceptionDescription ed;
        ed << "Invalid energy value: " << energy << G4endl;
        ed << "Energy must be positive.";

        G4Exception("MyPrimaryGenerator::SetEnergy",
                   "Gen0001",
                   FatalErrorInArgument,
                   ed);
    }

    fParticleGun->SetParticleEnergy(energy);
}
```

### Event-Level Error Handling

```cpp
#include "G4Exception.hh"

void MySteppingAction::UserSteppingAction(const G4Step* step)
{
    G4VPhysicalVolume* volume = step->GetPreStepPoint()->GetPhysicalVolume();

    if (volume == nullptr)
    {
        // Abort this event but continue run
        G4Exception("MySteppingAction::UserSteppingAction",
                   "Step0001",
                   EventMustBeAborted,
                   "Particle stepped into undefined volume");
    }
}
```

### Custom Exception Handler Implementation

```cpp
#include "G4VExceptionHandler.hh"
#include <fstream>

class MyExceptionHandler : public G4VExceptionHandler
{
 public:
  MyExceptionHandler() : G4VExceptionHandler(), logFile("exceptions.log", std::ios::app) {}

  virtual ~MyExceptionHandler() { logFile.close(); }

  virtual G4bool Notify(const char* originOfException,
                       const char* exceptionCode,
                       G4ExceptionSeverity severity,
                       const char* description) override
  {
    // Log all exceptions to file
    logFile << "Exception: " << exceptionCode << std::endl;
    logFile << "Origin: " << originOfException << std::endl;
    logFile << "Description: " << description << std::endl;
    logFile << "---" << std::endl;

    // Custom handling based on severity
    switch(severity)
    {
      case FatalException:
      case FatalErrorInArgument:
        // Send email notification for fatal errors
        SendEmailAlert(originOfException, exceptionCode, description);
        return true;  // Generate core dump

      case RunMustBeAborted:
        CleanupCurrentRun();
        return false;  // Don't generate core dump

      case EventMustBeAborted:
        IncrementEventErrorCounter();
        return false;

      case JustWarning:
        IncrementWarningCounter();
        return false;

      case IgnoreTheIssue:
      default:
        return false;
    }
  }

 private:
  std::ofstream logFile;
  void SendEmailAlert(const char* origin, const char* code, const char* desc);
  void CleanupCurrentRun();
  void IncrementEventErrorCounter();
  void IncrementWarningCounter();
};

// In main():
int main(int argc, char** argv)
{
    // Create custom exception handler - automatically registers with G4StateManager
    MyExceptionHandler* exceptionHandler = new MyExceptionHandler();

    // ... rest of Geant4 initialization
}
```

### Formatted Exception Messages

```cpp
#include "G4Exception.hh"
#include "G4UnitsTable.hh"

void CheckEnergyRange(G4double energy, G4double minE, G4double maxE)
{
    if (energy < minE || energy > maxE)
    {
        G4ExceptionDescription ed;
        ed << "Energy out of range!" << G4endl;
        ed << "  Provided: " << G4BestUnit(energy, "Energy") << G4endl;
        ed << "  Valid range: " << G4BestUnit(minE, "Energy")
           << " to " << G4BestUnit(maxE, "Energy");

        G4Exception("CheckEnergyRange",
                   "Range0001",
                   FatalErrorInArgument,
                   ed);
    }
}
```

## Default Exception Formatting

When no custom handler is installed, G4Exception formats messages with banners (lines 38-54 of G4Exception.cc):

**Error Banner (for fatal errors and aborts):**
```
-------- EEEE ------- G4Exception-START -------- EEEE -------

*** ExceptionHandler is not defined ***
*** G4Exception : ExceptionCode
      issued by : OriginOfException
Description of the problem

*** Fatal Exception ***
-------- EEEE ------- G4Exception-END -------- EEEE -------
```

**Warning Banner (for JustWarning):**
```
-------- WWWW ------- G4Exception-START -------- WWWW -------

*** ExceptionHandler is not defined ***
*** G4Exception : ExceptionCode
      issued by : OriginOfException
Description of the problem

*** This is just a warning message. ***
-------- WWWW ------- G4Exception-END -------- WWWW -------
```

## Best Practices

### Exception Codes

Use systematic naming for exception codes:

```cpp
// Format: <Module><Number>
// Examples:
"Run0001"     // Run manager errors
"Geo0001"     // Geometry errors
"Mat0001"     // Material errors
"Phys0001"    // Physics list errors
"Track0001"   // Tracking errors
"User0001"    // User code errors
```

### Origin Specification

Always provide the full method signature:

```cpp
// Good - includes class and method
G4Exception("MyClass::MyMethod", ...);
G4Exception("MyNamespace::MyClass::MyMethod", ...);

// Avoid - too vague
G4Exception("MyMethod", ...);
```

### Choose Appropriate Severity

Select severity based on recoverability:

```cpp
// Fatal - no recovery possible
if (geometry == nullptr)
    G4Exception(..., FatalException, ...);

// FatalErrorInArgument - user error, could be fixed
if (density <= 0)
    G4Exception(..., FatalErrorInArgument, ...);

// EventMustBeAborted - this event is bad, but continue run
if (trackingError)
    G4Exception(..., EventMustBeAborted, ...);

// JustWarning - informational, execution continues
if (unusualButValid)
    G4Exception(..., JustWarning, ...);
```

### Provide Actionable Messages

Include enough information for users to fix the problem:

```cpp
// Poor - not actionable
G4Exception("MyClass::Method", "Err01", FatalException, "Error occurred");

// Good - specific and actionable
G4ExceptionDescription ed;
ed << "Material '" << materialName << "' not found in material table." << G4endl;
ed << "Available materials: " << GetMaterialList() << G4endl;
ed << "Please check your detector construction.";
G4Exception("MyClass::Method", "Mat0001", FatalException, ed);
```

### Avoid Exception Spam

Don't generate excessive warnings in loops:

```cpp
// Bad - could generate thousands of warnings
for (int i = 0; i < nEvents; ++i)
{
    if (someCondition)
        G4Exception(..., JustWarning, ...);  // Called every event!
}

// Good - warn once
static G4bool warned = false;
if (someCondition && !warned)
{
    G4Exception(..., JustWarning, ...);
    warned = true;
}
```

### Custom Handlers Should Be Lightweight

```cpp
// Avoid - heavy operations in exception handler
virtual G4bool Notify(...)
{
    PerformExpensiveAnalysis();  // May slow down exception handling
    WriteGiantLogFile();         // May cause I/O bottlenecks
    return false;
}

// Better - defer heavy work
virtual G4bool Notify(...)
{
    QueueForLaterProcessing(originOfException, exceptionCode, description);
    return false;
}
```

## Thread Safety

### G4Exception Function

**Thread Safety:** Thread-safe
**Rationale:** Uses G4StateManager which maintains per-thread state in multi-threaded mode

In multi-threaded Geant4 applications:
- Each worker thread has its own G4StateManager instance
- Exceptions in worker threads affect only that thread's state
- Master thread exceptions affect the master thread only

### G4VExceptionHandler

**Thread Safety:** Requires careful implementation
**Considerations:**

1. **Handler Registration:** The handler is registered per-thread through G4StateManager
   ```cpp
   // In worker thread initialization:
   G4VExceptionHandler* handler = new MyThreadLocalHandler();
   // Automatically registered for this thread
   ```

2. **Shared Resources:** If your custom handler uses shared resources, protect them:
   ```cpp
   class MyExceptionHandler : public G4VExceptionHandler
   {
    public:
     virtual G4bool Notify(...) override
     {
       std::lock_guard<std::mutex> lock(logMutex);
       sharedLogFile << description << std::endl;
       return false;
     }

    private:
     static std::mutex logMutex;  // Protect shared file
     static std::ofstream sharedLogFile;
   };
   ```

3. **Thread-Local Handlers:** For best performance, use thread-local handlers:
   ```cpp
   class MyExceptionHandler : public G4VExceptionHandler
   {
    public:
     virtual G4bool Notify(...) override
     {
       threadLocalFile << description << std::endl;  // No locking needed
       return false;
     }

    private:
     G4ThreadLocal static std::ofstream threadLocalFile;
   };
   ```

### Exception Output

- G4cout and G4cerr are thread-safe in multi-threaded builds
- Output from different threads is serialized to prevent interleaving
- Master and worker thread messages are kept separate

### Master vs Worker Thread Exceptions

```cpp
void MyRunAction::BeginOfRunAction(const G4Run* run)
{
    // Different behavior based on thread
    if (G4Threading::IsWorkerThread())
    {
        // Worker thread - abort event, not entire program
        if (error)
            G4Exception(..., EventMustBeAborted, ...);
    }
    else
    {
        // Master thread - more serious consequences
        if (error)
            G4Exception(..., RunMustBeAborted, ...);
    }
}
```

## Common Pitfalls

### 1. Using std::exception Instead of G4Exception

```cpp
// Wrong - bypasses Geant4 exception handling
throw std::runtime_error("Something went wrong");

// Correct - uses Geant4 mechanism
G4Exception("MyClass::Method", "Err001", FatalException, "Something went wrong");
```

### 2. Incorrect Severity Choice

```cpp
// Wrong - JustWarning for fatal condition
if (criticalResourceNull)
    G4Exception(..., JustWarning, ...);  // Execution continues - will crash!

// Correct - FatalException for fatal condition
if (criticalResourceNull)
    G4Exception(..., FatalException, ...);  // Properly terminates
```

### 3. Empty or Useless Messages

```cpp
// Wrong - no information
G4Exception("Method", "E01", FatalException, "Error");

// Correct - informative
G4ExceptionDescription ed;
ed << "Failed to allocate memory for particle array." << G4endl;
ed << "Requested size: " << requestedBytes << " bytes" << G4endl;
ed << "Available memory: " << availableBytes << " bytes";
G4Exception("MyClass::AllocateParticles", "Mem0001", FatalException, ed);
```

### 4. Not Using G4ExceptionDescription for Complex Messages

```cpp
// Awkward - hard to read
char msg[1000];
sprintf(msg, "Value %f is outside range [%f, %f]", value, min, max);
G4Exception("Method", "E01", JustWarning, msg);

// Better - type-safe and readable
G4ExceptionDescription ed;
ed << "Value " << value << " is outside range [" << min << ", " << max << "]";
G4Exception("Method", "E01", JustWarning, ed);
```

### 5. Exception Handler Memory Leak

```cpp
// Wrong - handler never deleted
void InitializeApp()
{
    new MyExceptionHandler();  // Memory leak!
}

// Correct - proper ownership
std::unique_ptr<G4VExceptionHandler> exceptionHandler;

void InitializeApp()
{
    exceptionHandler = std::make_unique<MyExceptionHandler>();
}

void CleanupApp()
{
    exceptionHandler.reset();
}
```

### 6. Catching G4Exception

```cpp
// Wrong - G4Exception is not a C++ exception
try {
    SomeGeant4Code();
} catch (G4Exception& e) {  // This won't work!
    // Handle exception
}

// Correct - use custom exception handler
class MyHandler : public G4VExceptionHandler
{
    virtual G4bool Notify(...) override
    {
        // Handle the exception here
        return false;
    }
};
```

## Related Components

- **G4StateManager** - Manages application state and exception handler registration
- **G4cerr** - Thread-safe error output stream
- **G4cout** - Thread-safe standard output stream
- **G4String** - String class used in exception messages
- **globals.hh** - Includes G4Exception.hh and related headers

## Integration with State Management

The exception system works closely with G4StateManager:

```cpp
// Exception triggers state change
G4Exception(..., FatalException, ...);
  → G4StateManager::SetNewState(G4State_Abort)
    → If successful: abort() is called
    → If unsuccessful: Warning issued, execution continues (risky!)
```

## Version History

- **1999 (G. Cosmo, M. Asai):** Initial implementation of G4Exception
- **2002 (M. Asai):** Added G4ExceptionSeverity and G4VExceptionHandler
- **2023:** Added IgnoreTheIssue severity level

## See Also

- [G4StateManager](g4statemanager.md) - Application state management
- [G4String](g4string.md) - String handling in Geant4
- [globals.hh](globals.md) - Common global definitions
- Geant4 Application Developer's Guide: Error Handling
- Geant4 User's Guide: Multi-threaded Applications
