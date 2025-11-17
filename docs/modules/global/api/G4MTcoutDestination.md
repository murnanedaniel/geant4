# G4MTcoutDestination

## Overview

`G4MTcoutDestination` is a specialized multi-threaded output destination that manages cout/cerr streams in multi-threaded Geant4 applications. It handles thread-specific output formatting, buffering, and routing to ensure clean and organized output from multiple worker threads.

**Category:** Global/Management - Multi-Threaded I/O
**Base Class:** G4MulticoutDestination
**Authors:** M. Asai, A. Dotti (SLAC) - May 2013

## Source Locations

**Header:** `/source/global/management/include/G4MTcoutDestination.hh`
**Source:** `/source/global/management/src/G4MTcoutDestination.cc`

## Class Definition

```cpp
class G4MTcoutDestination : public G4MulticoutDestination
{
 public:
  explicit G4MTcoutDestination(const G4int& threadId);
  ~G4MTcoutDestination() override;

  virtual void Reset();

  void SetDefaultOutput(G4bool addMasterDestination = true,
                        G4bool formatAlsoMaster     = true);

  void SetCoutFileName(const G4String& fileN = "G4cout.txt",
                       G4bool ifAppend       = true);
  void AddCoutFileName(const G4String& fileN = "G4cout.txt",
                       G4bool ifAppend       = true);
  void SetCerrFileName(const G4String& fileN = "G4cerr.txt",
                       G4bool ifAppend       = true);
  void AddCerrFileName(const G4String& fileN = "G4cerr.txt",
                       G4bool ifAppend       = true);

  void EnableBuffering(G4bool flag = true);

  void SetPrefixString(const G4String& wd = "G4WT");
  void SetIgnoreCout(G4int tid = 0);
  void SetIgnoreInit(G4bool val = true);

  G4String GetPrefixString() const;
  G4String GetFullPrefixString() const;

 protected:
  void AddMasterOutput(G4bool formatAlsoMaster);
  void HandleFileCout(const G4String& fileN, G4bool appendFlag,
                      G4bool suppressDefault);
  void HandleFileCerr(const G4String& fileN, G4bool appendFlag,
                      G4bool suppressDefault);

 private:
  void DumpBuffer();

  G4coutDestination* ref_defaultOut = nullptr;
  G4coutDestination* ref_masterOut = nullptr;
  G4bool masterDestinationFlag = true;
  G4bool masterDestinationFmtFlag = true;
  const G4int id;
  G4bool useBuffer = false;
  G4bool ignoreCout = false;
  G4bool ignoreInit = true;
  G4String prefix = "G4WT";
  G4StateManager* stateMgr = nullptr;
};
```

## Public Methods

### Constructor and Destructor

#### G4MTcoutDestination()

```cpp
explicit G4MTcoutDestination(const G4int& threadId);
```

**Purpose:** Constructs a multi-threaded output destination for a specific worker thread.

**Parameters:**
- `threadId` - The ID of the worker thread (typically from `G4Threading::GetThreadId()`)

**Details:**
- Creates thread-specific output handling
- Initializes with default prefix "G4WT" + threadId
- Does not automatically set up file or master output

**Example:**
```cpp
// In worker thread initialization
G4int threadId = G4Threading::G4GetThreadId();
auto mtDest = new G4MTcoutDestination(threadId);
mtDest->SetDefaultOutput();
G4iosSetDestination(mtDest);
```

#### ~G4MTcoutDestination()

```cpp
~G4MTcoutDestination() override;
```

**Purpose:** Destructor that cleans up multi-threaded destination resources.

**Details:**
- Flushes any buffered output
- Closes thread-specific files
- Removes from master destination if connected

### Configuration Methods

#### Reset()

```cpp
virtual void Reset();
```

**Purpose:** Resets the destination to initial state, removing all configured outputs.

**Details:**
- Clears all file destinations
- Removes master output connection
- Resets to unconfigured state
- Does not change thread ID or prefix

**Example:**
```cpp
mtDest->SetCoutFileName("thread_output.log");
// ... use for a while ...
mtDest->Reset();  // Clear configuration
mtDest->SetDefaultOutput();  // Reconfigure
```

#### SetDefaultOutput()

```cpp
void SetDefaultOutput(G4bool addMasterDestination = true,
                     G4bool formatAlsoMaster     = true);
```

**Purpose:** Configures default output routing for the worker thread.

**Parameters:**
- `addMasterDestination` - If true, forwards output to master thread (default: true)
- `formatAlsoMaster` - If true, applies formatting before forwarding to master (default: true)

**Details:**
- Sets up standard console output with thread prefix
- Optionally forwards to master thread destination
- Master forwarding allows GUI or main thread to collect all output
- Formatting includes thread ID prefix

**Example:**
```cpp
// Forward to master with formatting
mtDest->SetDefaultOutput(true, true);

// Local output only, no master forwarding
mtDest->SetDefaultOutput(false, false);

// Forward to master without local formatting
mtDest->SetDefaultOutput(true, false);
```

### File Output Configuration

#### SetCoutFileName()

```cpp
void SetCoutFileName(const G4String& fileN = "G4cout.txt",
                    G4bool ifAppend       = true);
```

**Purpose:** Redirects G4cout output to a file, replacing any existing cout file destination.

**Parameters:**
- `fileN` - Filename for cout output (default: "G4cout.txt")
- `ifAppend` - If true, append to existing file; if false, overwrite (default: true)

**Details:**
- Removes previous cout file destination if any
- Suppresses default console output for cout
- Thread ID is typically included in filename
- Does not affect cerr output

**Example:**
```cpp
// Thread-specific file
std::stringstream ss;
ss << "thread_" << threadId << "_cout.log";
mtDest->SetCoutFileName(ss.str(), false);  // Overwrite mode

// Shared file (not recommended - use locking)
mtDest->SetCoutFileName("all_threads.log", true);  // Append mode
```

#### AddCoutFileName()

```cpp
void AddCoutFileName(const G4String& fileN = "G4cout.txt",
                    G4bool ifAppend       = true);
```

**Purpose:** Adds an additional file destination for G4cout output without removing existing destinations.

**Parameters:**
- `fileN` - Filename for cout output (default: "G4cout.txt")
- `ifAppend` - If true, append to existing file (default: true)

**Details:**
- Keeps existing cout destinations (console, other files)
- Output goes to multiple destinations
- Useful for logging to multiple files simultaneously

**Example:**
```cpp
// Output to both console and file
mtDest->SetDefaultOutput();
mtDest->AddCoutFileName("detailed.log");

// Output to multiple files
mtDest->AddCoutFileName("summary.log");
mtDest->AddCoutFileName("verbose.log");
```

#### SetCerrFileName()

```cpp
void SetCerrFileName(const G4String& fileN = "G4cerr.txt",
                    G4bool ifAppend       = true);
```

**Purpose:** Redirects G4cerr output to a file, replacing any existing cerr file destination.

**Parameters:**
- `fileN` - Filename for cerr output (default: "G4cerr.txt")
- `ifAppend` - If true, append to existing file (default: true)

**Details:**
- Removes previous cerr file destination if any
- Suppresses default console output for cerr
- Errors from this thread go to specified file
- Does not affect cout output

**Example:**
```cpp
// Separate error file per thread
std::stringstream ss;
ss << "thread_" << threadId << "_errors.log";
mtDest->SetCerrFileName(ss.str(), false);

// Shared error log
mtDest->SetCerrFileName("all_errors.log", true);
```

#### AddCerrFileName()

```cpp
void AddCerrFileName(const G4String& fileN = "G4cerr.txt",
                    G4bool ifAppend       = true);
```

**Purpose:** Adds an additional file destination for G4cerr output.

**Parameters:**
- `fileN` - Filename for cerr output (default: "G4cerr.txt")
- `ifAppend` - If true, append to existing file (default: true)

**Details:**
- Keeps existing cerr destinations
- Errors go to multiple outputs
- Useful for both console and file error logging

**Example:**
```cpp
// Errors to both console and file
mtDest->SetDefaultOutput();
mtDest->AddCerrFileName("errors.log");
```

### Buffering Control

#### EnableBuffering()

```cpp
void EnableBuffering(G4bool flag = true);
```

**Purpose:** Enables or disables output buffering for the thread.

**Parameters:**
- `flag` - If true, enable buffering; if false, disable (default: true)

**Details:**
- Buffering can improve performance by reducing I/O operations
- Buffered output is dumped at end of event or when buffer is full
- Disabled buffering provides immediate output (slower but real-time)
- Buffer is automatically flushed on thread termination

**Example:**
```cpp
// Enable buffering for better performance
mtDest->EnableBuffering(true);

// Disable for real-time monitoring
mtDest->EnableBuffering(false);
```

### Prefix and Formatting

#### SetPrefixString()

```cpp
void SetPrefixString(const G4String& wd = "G4WT");
```

**Purpose:** Sets the prefix string for thread output.

**Parameters:**
- `wd` - Prefix string (default: "G4WT")

**Details:**
- Full prefix is `prefix + threadId` (e.g., "G4WT5")
- Added to each output line from this thread
- Helps identify which thread generated output
- Default "G4WT" stands for "Geant4 Worker Thread"

**Example:**
```cpp
// Custom prefix
mtDest->SetPrefixString("Worker");  // Output: Worker5: message

// No prefix (empty string)
mtDest->SetPrefixString("");  // Output: 5: message

// Application-specific
mtDest->SetPrefixString("SimThread");  // Output: SimThread5: message
```

#### GetPrefixString()

```cpp
G4String GetPrefixString() const;
```

**Purpose:** Returns the current prefix string (without thread ID).

**Return Value:** The prefix string (e.g., "G4WT")

**Example:**
```cpp
G4String prefix = mtDest->GetPrefixString();
// Returns: "G4WT"
```

#### GetFullPrefixString()

```cpp
G4String GetFullPrefixString() const;
```

**Purpose:** Returns the complete prefix including thread ID.

**Return Value:** Full prefix string (e.g., "G4WT5")

**Example:**
```cpp
G4String fullPrefix = mtDest->GetFullPrefixString();
// Returns: "G4WT5" for thread 5
G4cout << "Output from " << fullPrefix << G4endl;
```

### Output Control

#### SetIgnoreCout()

```cpp
void SetIgnoreCout(G4int tid = 0);
```

**Purpose:** Suppresses cout output from specific thread.

**Parameters:**
- `tid` - Thread ID to ignore (default: 0)

**Details:**
- Used to silence verbose threads
- Does not affect cerr (errors still shown)
- Commonly used to suppress output from specific worker threads

**Example:**
```cpp
// Suppress cout from this thread
mtDest->SetIgnoreCout(G4Threading::G4GetThreadId());

// Only show output from master thread
if (threadId != 0) {
    mtDest->SetIgnoreCout(threadId);
}
```

#### SetIgnoreInit()

```cpp
void SetIgnoreInit(G4bool val = true);
```

**Purpose:** Controls whether to ignore output during initialization phase.

**Parameters:**
- `val` - If true, ignore output during Init state (default: true)

**Details:**
- Initialization can produce redundant output from all threads
- Ignoring init output reduces clutter
- Based on G4StateManager application state

**Example:**
```cpp
// Show all output including initialization
mtDest->SetIgnoreInit(false);

// Hide initialization output (default)
mtDest->SetIgnoreInit(true);
```

## Protected Methods

#### AddMasterOutput()

```cpp
void AddMasterOutput(G4bool formatAlsoMaster);
```

**Purpose:** Adds master thread destination to receive forwarded output.

**Parameters:**
- `formatAlsoMaster` - Apply formatting before forwarding

**Details:** Internal method called by `SetDefaultOutput()`.

#### HandleFileCout()

```cpp
void HandleFileCout(const G4String& fileN, G4bool appendFlag,
                   G4bool suppressDefault);
```

**Purpose:** Internal method for setting up cout file output.

**Parameters:**
- `fileN` - Filename
- `appendFlag` - Append or overwrite
- `suppressDefault` - Whether to suppress default console output

#### HandleFileCerr()

```cpp
void HandleFileCerr(const G4String& fileN, G4bool appendFlag,
                   G4bool suppressDefault);
```

**Purpose:** Internal method for setting up cerr file output.

**Parameters:**
- `fileN` - Filename
- `appendFlag` - Append or overwrite
- `suppressDefault` - Whether to suppress default console output

## Usage Patterns

### Basic Multi-Threaded Setup

```cpp
// In worker thread initialization (typically in G4UserWorkerThreadInitialization)
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();

    // Create MT destination for this thread
    auto mtDest = new G4MTcoutDestination(threadId);

    // Setup default output with master forwarding
    mtDest->SetDefaultOutput(true, true);

    // Set as active destination for this thread
    G4iosSetDestination(mtDest);

    G4cout << "Worker thread " << threadId << " initialized" << G4endl;
    // Output: G4WT5: Worker thread 5 initialized
}
```

### Thread-Specific Log Files

```cpp
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();
    auto mtDest = new G4MTcoutDestination(threadId);

    // Each thread writes to its own file
    std::stringstream coutFile, cerrFile;
    coutFile << "thread_" << threadId << "_output.log";
    cerrFile << "thread_" << threadId << "_errors.log";

    mtDest->SetCoutFileName(coutFile.str(), false);  // Overwrite
    mtDest->SetCerrFileName(cerrFile.str(), false);

    G4iosSetDestination(mtDest);
}
```

### Buffered Output for Performance

```cpp
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();
    auto mtDest = new G4MTcoutDestination(threadId);

    // Enable buffering for high-performance simulations
    mtDest->EnableBuffering(true);

    // Setup output
    mtDest->SetDefaultOutput();
    G4iosSetDestination(mtDest);

    // Output is buffered and flushed periodically
    for (int i = 0; i < 1000; ++i) {
        G4cout << "Event " << i << " processed" << G4endl;
    }
    // Buffered output flushed at end of event or when full
}
```

### Master-Only Output

```cpp
// Master thread
void InitializeMaster()
{
    auto masterDest = new G4coutDestination();
    G4iosSetDestination(masterDest);
}

// Worker threads
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();
    auto mtDest = new G4MTcoutDestination(threadId);

    // Forward all output to master, suppress local output
    mtDest->SetDefaultOutput(true, true);

    // Suppress cout from workers (only master shows output)
    mtDest->SetIgnoreCout(threadId);

    G4iosSetDestination(mtDest);
}
```

### Selective Thread Output

```cpp
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();
    auto mtDest = new G4MTcoutDestination(threadId);

    // Only show output from thread 0 and 1
    if (threadId > 1) {
        mtDest->SetIgnoreCout(threadId);
    }

    mtDest->SetDefaultOutput();
    G4iosSetDestination(mtDest);
}
```

### Custom Prefix for Clarity

```cpp
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();
    auto mtDest = new G4MTcoutDestination(threadId);

    // Use custom prefix
    mtDest->SetPrefixString("Worker");

    mtDest->SetDefaultOutput();
    G4iosSetDestination(mtDest);

    G4cout << "Processing event" << G4endl;
    // Output: Worker5: Processing event
}
```

### Multiple Output Destinations

```cpp
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();
    auto mtDest = new G4MTcoutDestination(threadId);

    // Setup default console output
    mtDest->SetDefaultOutput();

    // Add file output (in addition to console)
    mtDest->AddCoutFileName("all_threads.log", true);

    // Add thread-specific detailed log
    std::stringstream ss;
    ss << "thread_" << threadId << "_detailed.log";
    mtDest->AddCoutFileName(ss.str(), false);

    G4iosSetDestination(mtDest);

    // Output goes to: console, all_threads.log, and thread_N_detailed.log
}
```

### Filtering Initialization Output

```cpp
void InitializeWorkerThread()
{
    G4int threadId = G4Threading::G4GetThreadId();
    auto mtDest = new G4MTcoutDestination(threadId);

    // Hide verbose initialization output
    mtDest->SetIgnoreInit(true);

    mtDest->SetDefaultOutput();
    G4iosSetDestination(mtDest);

    // Initialization messages suppressed
    // Normal run output shown
}
```

## Best Practices

### 1. Always Create Per-Thread Destinations

```cpp
// GOOD - One destination per thread
void InitializeWorkerThread() {
    G4int tid = G4Threading::G4GetThreadId();
    auto dest = new G4MTcoutDestination(tid);
    G4iosSetDestination(dest);
}

// WRONG - Sharing destination between threads
static G4MTcoutDestination* sharedDest = nullptr;  // DON'T DO THIS
```

### 2. Use Thread-Specific Filenames

```cpp
// GOOD - Separate file per thread
std::stringstream ss;
ss << "thread_" << threadId << ".log";
mtDest->SetCoutFileName(ss.str());

// RISKY - All threads writing to same file
mtDest->SetCoutFileName("output.log");  // Needs locking!
```

### 3. Enable Buffering for Performance

```cpp
// For high-event-rate simulations
mtDest->EnableBuffering(true);  // Much faster

// For debugging or monitoring
mtDest->EnableBuffering(false);  // Real-time output
```

### 4. Forward to Master for GUI Applications

```cpp
// When using GUI or collecting all output
mtDest->SetDefaultOutput(true, true);  // Forward to master

// For command-line with separate thread logs
mtDest->SetDefaultOutput(false, false);  // Local only
```

### 5. Use Meaningful Prefixes

```cpp
// GOOD - Clear, descriptive prefix
mtDest->SetPrefixString("GeometryWorker");

// AVOID - Confusing or too long
mtDest->SetPrefixString("T");  // Too cryptic
mtDest->SetPrefixString("GeometryConstructionWorkerThread");  // Too long
```

### 6. Clean Up in Worker Destruction

```cpp
class MyWorkerInitialization : public G4UserWorkerThreadInitialization
{
  void WorkerRunEnd() const override {
    // Flush and cleanup
    auto dest = dynamic_cast<G4MTcoutDestination*>(
        /* get current destination */);
    if (dest) {
      delete dest;  // Flushes buffers
      G4iosSetDestination(nullptr);
    }
  }
};
```

### 7. Consider Master-Only Output for Production

```cpp
// For production runs with many events
// Only master thread produces output (less overhead)
if (threadId != 0) {
    mtDest->SetIgnoreCout(threadId);
    mtDest->SetIgnoreInit(true);
}
```

## Thread Safety

- Each worker thread should have its own `G4MTcoutDestination` instance
- Thread-safe when using separate files per thread
- Master forwarding uses mutex locking internally
- Buffering reduces lock contention

## Performance Considerations

### Buffering Impact

- **Buffered:** ~10-100x faster for high-frequency output
- **Unbuffered:** Real-time visibility but slower
- Buffer auto-flushes at event boundaries

### File I/O

- Separate files per thread: Best performance, parallel I/O
- Shared file: Requires locking, serial I/O bottleneck
- Master forwarding: Single-threaded output, moderate overhead

### Prefix Formatting

- Minimal overhead for prefix addition
- Formatting done once before forwarding
- Can disable with empty prefix if needed

## Common Pitfalls

### Not Setting Destination Per Thread

```cpp
// WRONG - Master thread destination used by workers
// Results in garbled output
```

### Forgetting Thread ID in Filenames

```cpp
// WRONG - All threads write to same file
mtDest->SetCoutFileName("output.log");

// CORRECT - Each thread has own file
mtDest->SetCoutFileName(G4String("thread_") + std::to_string(threadId) + ".log");
```

### Not Enabling Buffering for High-Rate Output

```cpp
// SLOW - Immediate I/O for every message
for (int i = 0; i < 1000000; ++i) {
    G4cout << "Event " << i << G4endl;
}

// FAST - Buffered output
mtDest->EnableBuffering(true);
for (int i = 0; i < 1000000; ++i) {
    G4cout << "Event " << i << G4endl;
}
```

## See Also

- **G4MulticoutDestination** - Base class for multiple destinations
- **G4MasterForwardcoutDestination** - Master forwarding implementation
- **G4LockcoutDestination** - Thread-safe locked output
- **G4BuffercoutDestination** - Output buffering
- **G4Threading** - Threading utilities
- **G4UserWorkerThreadInitialization** - Worker thread setup
- **G4StateManager** - Application state management
