# G4ios

## Overview

`G4ios` provides global I/O stream definitions for Geant4, defining the standard output streams `G4cout`, `G4cerr`, and `G4debug`. It handles both sequential and multi-threaded modes, with thread-local streams in MT applications, and provides functions to initialize, finalize, and redirect output.

**Category:** Global/Management - I/O System
**Type:** Global I/O definitions and functions
**Authors:** H. Yoshida, M. Nagamatu (November 1998)

## Source Locations

**Header:** `/source/global/management/include/G4ios.hh`
**Source:** `/source/global/management/src/G4ios.cc`

## Global Stream Definitions

### Sequential Mode

```cpp
#ifndef G4MULTITHREADED

extern G4GLOB_DLL std::ostream G4debug;
extern G4GLOB_DLL std::ostream G4cout;
extern G4GLOB_DLL std::ostream G4cerr;

#endif
```

**Purpose:** Global output streams for sequential applications.

**Details:**
- Direct `std::ostream` objects
- Available globally in all translation units
- Initialized at program startup
- Default to standard console streams

### Multi-Threaded Mode

```cpp
#ifdef G4MULTITHREADED

extern G4GLOB_DLL std::ostream*& _G4debug_p();
extern G4GLOB_DLL std::ostream*& _G4cout_p();
extern G4GLOB_DLL std::ostream*& _G4cerr_p();

#define G4debug (*_G4debug_p())
#define G4cout (*_G4cout_p())
#define G4cerr (*_G4cerr_p())

#endif
```

**Purpose:** Thread-local output streams for multi-threaded applications.

**Details:**
- Implemented as accessor functions returning thread-local pointers
- Each thread has its own stream instances
- Macros provide uniform interface
- Allows per-thread output customization

## Global Streams

### G4cout

```cpp
// Usage
G4cout << "Output message" << G4endl;
```

**Purpose:** Standard output stream for Geant4 messages.

**Type:**
- Sequential: `std::ostream` object
- Multi-threaded: Macro expanding to thread-local `std::ostream` reference

**Default Behavior:**
- Outputs to `std::cout`
- Can be redirected using `G4iosSetDestination()`

**Use Cases:**
- General information messages
- Progress updates
- Simulation status
- Non-critical output

**Example:**
```cpp
G4cout << "Geant4 version: " << G4VERSION_NUMBER << G4endl;
G4cout << "Initializing detector geometry..." << G4endl;
G4cout << "Event " << eventID << " processed" << G4endl;
```

### G4cerr

```cpp
// Usage
G4cerr << "Error message" << G4endl;
```

**Purpose:** Error output stream for Geant4 error and warning messages.

**Type:**
- Sequential: `std::ostream` object
- Multi-threaded: Macro expanding to thread-local `std::ostream` reference

**Default Behavior:**
- Outputs to `std::cerr`
- Cannot be completely suppressed (for safety)

**Use Cases:**
- Error messages
- Warning messages
- Critical failures
- Exception reporting

**Example:**
```cpp
G4cerr << "ERROR: Invalid particle definition" << G4endl;
G4cerr << "WARNING: Energy below threshold" << G4endl;
G4cerr << "FATAL: Geometry overlap detected" << G4endl;
```

### G4debug

```cpp
// Usage
G4debug << "Debug information" << G4endl;
```

**Purpose:** Debug output stream for detailed diagnostic messages.

**Type:**
- Sequential: `std::ostream` object
- Multi-threaded: Macro expanding to thread-local `std::ostream` reference

**Default Behavior:**
- Outputs to `std::cout` (same as G4cout by default)
- Can be separately redirected for debug logging

**Use Cases:**
- Detailed diagnostic information
- Developer debugging output
- Verbose tracing
- Internal state logging

**Example:**
```cpp
G4debug << "Entering method: ProcessStep()" << G4endl;
G4debug << "Particle position: " << position << G4endl;
G4debug << "Energy deposit: " << edep << " MeV" << G4endl;
```

## Functions

### G4iosInitialization()

```cpp
void G4iosInitialization();
```

**Purpose:** Initializes the Geant4 I/O system.

**Details:**
- Called automatically during Geant4 initialization
- Sets up stream buffer redirects
- Initializes thread-local streams in MT mode
- Should not be called manually by users

**Typical Call Site:** G4RunManager initialization

### G4iosFinalization()

```cpp
void G4iosFinalization();
```

**Purpose:** Finalizes and cleans up the Geant4 I/O system.

**Details:**
- Called automatically during Geant4 shutdown
- Flushes pending output
- Restores original stream buffers
- Cleans up thread-local resources in MT mode
- Should not be called manually by users

**Typical Call Site:** G4RunManager destruction

### G4iosSetDestination()

```cpp
void G4iosSetDestination(G4coutDestination* sink);
```

**Purpose:** Redirects G4cout/G4cerr/G4debug streams to a custom destination.

**Parameters:**
- `sink` - Pointer to destination object (caller retains ownership)

**Details:**
- Must call with `nullptr` before destroying the destination
- Destination receives all subsequent G4cout/G4cerr/G4debug output
- In MT mode, affects current thread only
- Ownership remains with caller

**Important:** Caller must call `G4iosSetDestination(nullptr)` before deleting the destination.

**Example:**
```cpp
// Set custom destination
auto dest = new G4FilecoutDestination("output.log");
dest->Open();
G4iosSetDestination(dest);

// Use streams
G4cout << "This goes to file" << G4endl;

// Clean up (important!)
G4iosSetDestination(nullptr);  // Reset before deleting
delete dest;
```

## Auxiliary Definitions

### G4cin

```cpp
#define G4cin std::cin
```

**Purpose:** Standard input stream (for consistency with G4cout/G4cerr naming).

**Usage:** Same as `std::cin`

**Example:**
```cpp
G4int value;
G4cin >> value;
```

### G4endl

```cpp
#define G4endl std::endl
```

**Purpose:** End-of-line manipulator (for consistency with G4cout/G4cerr naming).

**Usage:** Same as `std::endl` - outputs newline and flushes stream.

**Example:**
```cpp
G4cout << "Message" << G4endl;
```

## Usage Patterns

### Basic Output

```cpp
// Standard output
G4cout << "Starting simulation" << G4endl;

// Error output
G4cerr << "ERROR: Invalid input" << G4endl;

// Debug output
G4debug << "Internal state: " << state << G4endl;
```

### Formatted Output

```cpp
#include <iomanip>

G4cout << "Energy: "
       << std::setw(10) << std::setprecision(4)
       << energy << " MeV"
       << G4endl;

G4cout << "Count: " << std::setfill('0') << std::setw(5) << count << G4endl;
```

### Conditional Output

```cpp
if (verboseLevel > 0) {
    G4cout << "Verbose information..." << G4endl;
}

if (verboseLevel > 1) {
    G4debug << "Detailed debug info..." << G4endl;
}
```

### Redirecting to File

```cpp
// Create file destination
auto fileDest = new G4FilecoutDestination("simulation.log");
fileDest->Open();

// Redirect output
G4iosSetDestination(fileDest);

// All output now goes to file
G4cout << "This message is logged to file" << G4endl;
G4cerr << "Errors also logged to file" << G4endl;

// Cleanup
G4iosSetDestination(nullptr);
fileDest->Close();
delete fileDest;
```

### Multi-Destination Output

```cpp
// Output to both console and file
auto multi = new G4MulticoutDestination();

// Console
multi->push_back(G4coutDestinationUPtr(new G4coutDestination()));

// File
auto fileDest = new G4FilecoutDestination("output.log");
fileDest->Open();
multi->push_back(G4coutDestinationUPtr(fileDest));

G4iosSetDestination(multi);

// Output goes to both console and file
G4cout << "Message to both destinations" << G4endl;

// Cleanup
G4iosSetDestination(nullptr);
delete multi;
```

### Multi-Threaded Output Setup

```cpp
// Master thread
void InitializeMaster()
{
    auto masterDest = new G4coutDestination();
    G4iosSetDestination(masterDest);

    G4cout << "Master thread initialized" << G4endl;
}

// Worker thread
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();

    auto workerDest = new G4MTcoutDestination(threadId);
    workerDest->SetDefaultOutput();

    G4iosSetDestination(workerDest);

    G4cout << "Worker thread " << threadId << " initialized" << G4endl;
    // Output: G4WT1: Worker thread 1 initialized
}
```

### Custom Destination

```cpp
// Define custom destination
class MyDestination : public G4coutDestination
{
 public:
  G4int ReceiveG4cout(const G4String& msg) override {
    myCustomLogger.Log(msg);
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override {
    myCustomLogger.LogError(msg);
    return 0;
  }

 private:
  MyCustomLogger myCustomLogger;
};

// Use it
auto dest = new MyDestination();
G4iosSetDestination(dest);

G4cout << "Logged to custom logger" << G4endl;

G4iosSetDestination(nullptr);
delete dest;
```

### Temporary Output Redirection

```cpp
void TemporaryRedirect()
{
    // Save current destination
    auto originalDest = /* get current destination */;

    // Redirect temporarily
    auto tempDest = new G4FilecoutDestination("temp.log");
    tempDest->Open();
    G4iosSetDestination(tempDest);

    // Output to temporary destination
    G4cout << "Temporary output" << G4endl;

    // Restore original
    G4iosSetDestination(originalDest);
    tempDest->Close();
    delete tempDest;
}
```

### Silencing Output

```cpp
class NullDestination : public G4coutDestination
{
 public:
  G4int ReceiveG4cout(const G4String&) override { return 0; }
  G4int ReceiveG4cerr(const G4String&) override { return 0; }
  G4int ReceiveG4debug(const G4String&) override { return 0; }
};

// Silence all output
auto nullDest = new NullDestination();
G4iosSetDestination(nullDest);

// No output produced
G4cout << "This is not shown" << G4endl;

// Restore output
G4iosSetDestination(nullptr);
delete nullDest;
```

## Best Practices

### 1. Always Use G4cout/G4cerr Instead of std::cout/std::cerr

```cpp
// GOOD - Redirectable, thread-aware
G4cout << "Message" << G4endl;

// AVOID - Not redirectable, not thread-aware
std::cout << "Message" << std::endl;
```

### 2. Use G4endl for Line Termination

```cpp
// GOOD - Consistent with Geant4 style
G4cout << "Message" << G4endl;

// OK but inconsistent style
G4cout << "Message" << std::endl;

// AVOID - No flush, may lose output
G4cout << "Message" << "\n";
```

### 3. Reset Destination Before Deleting

```cpp
// GOOD - Proper cleanup
auto dest = new G4FilecoutDestination("log.txt");
dest->Open();
G4iosSetDestination(dest);
// ... use ...
G4iosSetDestination(nullptr);  // Reset first!
delete dest;

// WRONG - Undefined behavior
auto dest = new G4FilecoutDestination("log.txt");
G4iosSetDestination(dest);
delete dest;  // Still active destination!
```

### 4. Use Appropriate Stream for Message Type

```cpp
// GOOD - Right stream for right purpose
G4cout << "Information message" << G4endl;
G4cerr << "Error message" << G4endl;
G4debug << "Debug details" << G4endl;

// AVOID - Wrong stream
G4cout << "ERROR: Something failed" << G4endl;  // Should use G4cerr
```

### 5. Manage Destination Lifetime Carefully

```cpp
// GOOD - Destination lives long enough
class MyApp {
 public:
  void Initialize() {
    m_dest = new G4FilecoutDestination("log.txt");
    m_dest->Open();
    G4iosSetDestination(m_dest);
  }

  ~MyApp() {
    G4iosSetDestination(nullptr);
    delete m_dest;
  }

 private:
  G4FilecoutDestination* m_dest;
};

// WRONG - Premature deletion
void BadExample() {
    auto dest = new G4FilecoutDestination("log.txt");
    G4iosSetDestination(dest);
    delete dest;  // But still in use!
}
G4cout << "Crash!" << G4endl;  // Dangling pointer
```

### 6. Handle Multi-Threaded Output Properly

```cpp
// GOOD - Per-thread destinations in MT mode
void InitializeWorkerThread() {
    auto dest = new G4MTcoutDestination(threadId);
    dest->SetDefaultOutput();
    G4iosSetDestination(dest);
}

// WRONG - Sharing destination without locking
static G4coutDestination* sharedDest = nullptr;
void InitializeWorkerThread() {
    if (!sharedDest) sharedDest = new G4coutDestination();
    G4iosSetDestination(sharedDest);  // Not thread-safe!
}
```

### 7. Flush Important Messages

```cpp
// For critical messages that must appear immediately
G4cerr << "FATAL ERROR: Aborting..." << G4endl;
std::cerr << std::flush;  // Ensure immediate output

// Or use destination that auto-flushes
auto dest = new G4FilecoutDestination("log.txt");
// File destinations auto-flush each message
```

## Thread Safety

### Sequential Mode
- Thread-safe (single thread)
- Direct stream objects

### Multi-Threaded Mode
- Each thread has its own stream instances
- Thread-local storage ensures isolation
- `G4iosSetDestination()` affects current thread only
- Master and worker threads have independent destinations

### Thread-Local Behavior

```cpp
// Master thread
G4iosSetDestination(masterDest);
G4cout << "From master" << G4endl;  // Uses masterDest

// Worker thread 1
G4iosSetDestination(worker1Dest);
G4cout << "From worker 1" << G4endl;  // Uses worker1Dest

// Worker thread 2
G4iosSetDestination(worker2Dest);
G4cout << "From worker 2" << G4endl;  // Uses worker2Dest
```

## Performance Considerations

### Output Overhead

- Console output: ~10-100 microseconds per message
- File output: ~5-50 microseconds per message (buffered)
- Buffered destination: ~0.1 microsecond per message (until flush)

### Recommendations

- **High-frequency output:** Use `G4BuffercoutDestination`
- **Multi-threaded:** Use per-thread file outputs or `G4MTcoutDestination`
- **Production runs:** Minimize output or use buffering
- **Development/debugging:** Use `G4LockcoutDestination` for MT console output

## Common Pitfalls

### Not Resetting Destination

```cpp
// WRONG
{
    auto dest = new G4FilecoutDestination("log.txt");
    dest->Open();
    G4iosSetDestination(dest);
}  // dest destroyed but still active!

G4cout << "Crash!" << G4endl;
```

### Mixing std::cout and G4cout

```cpp
// CONFUSING - Mixed output streams
std::cout << "Direct output" << std::endl;
G4cout << "Redirected output" << G4endl;
// Output may be interleaved or go to different places
```

### Forgetting Thread-Local Nature in MT

```cpp
// WRONG - Setting in master doesn't affect workers
void main() {
    G4iosSetDestination(myDest);  // Only master uses this!
    // Workers still use default
}
```

### Premature Cleanup

```cpp
// WRONG
auto dest = new G4FilecoutDestination("log.txt");
dest->Open();
G4iosSetDestination(dest);

// ... in another function ...
G4iosSetDestination(nullptr);
delete dest;

// ... back in original function ...
G4cout << "Lost!" << G4endl;  // No destination!
```

## Examples

### Complete File Logging Example

```cpp
#include "G4ios.hh"
#include "G4FilecoutDestination.hh"

int main()
{
    // Create and open file destination
    auto fileDest = new G4FilecoutDestination("simulation.log");
    fileDest->Open(std::ios_base::trunc);  // Overwrite existing

    // Redirect all output to file
    G4iosSetDestination(fileDest);

    // Run simulation
    G4cout << "=== Simulation Started ===" << G4endl;
    // ... simulation code ...
    G4cout << "=== Simulation Completed ===" << G4endl;

    // Cleanup
    G4iosSetDestination(nullptr);
    fileDest->Close();
    delete fileDest;

    return 0;
}
```

### Complete Multi-Threaded Example

```cpp
#include "G4MTRunManager.hh"
#include "G4ios.hh"
#include "G4MTcoutDestination.hh"

int main()
{
    auto runManager = new G4MTRunManager();
    runManager->SetNumberOfThreads(4);

    // Master thread uses default console
    G4cout << "Master thread initialized" << G4endl;

    // Worker thread initialization
    class MyWorkerInit : public G4UserWorkerThreadInitialization
    {
      void WorkerRunStart() const override
      {
        G4int tid = G4Threading::G4GetThreadId();
        auto dest = new G4MTcoutDestination(tid);
        dest->SetDefaultOutput(true, true);
        G4iosSetDestination(dest);
      }
    };

    runManager->SetUserInitialization(new MyWorkerInit());

    // Initialize and run
    runManager->Initialize();
    runManager->BeamOn(1000);

    delete runManager;
    return 0;
}
```

## See Also

- **G4coutDestination** - Base destination class
- **G4FilecoutDestination** - File output
- **G4MTcoutDestination** - Multi-threaded output
- **G4MulticoutDestination** - Multiple destinations
- **G4LockcoutDestination** - Thread-safe output
- **G4BuffercoutDestination** - Buffered output
- **G4coutFormatters** - Output formatting
- **std::ostream** - Standard C++ output stream
