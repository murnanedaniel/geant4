# G4MasterForwardcoutDestination

## Overview

`G4MasterForwardcoutDestination` is a simple forwarding destination that sends all output messages to the master thread's destination in a multi-threaded application. It provides thread-safe message forwarding with mutex serialization, making it ideal for collecting worker thread output in the master thread.

**Category:** Global/Management - Multi-Threaded I/O
**Base Class:** G4coutDestination
**Author:** A. Dotti (SLAC) - April 2017

## Source Locations

**Header:** `/source/global/management/include/G4MasterForwardcoutDestination.hh`
**Source:** `/source/global/management/src/G4MasterForwardcoutDestination.cc`

## Class Definition

```cpp
class G4MasterForwardcoutDestination : public G4coutDestination
{
 public:
  G4MasterForwardcoutDestination() = default;
  ~G4MasterForwardcoutDestination() override = default;

  G4int ReceiveG4debug(const G4String& msg) override;
  G4int ReceiveG4cout(const G4String& msg) override;
  G4int ReceiveG4cerr(const G4String& msg) override;
};
```

## Public Methods

### Constructor and Destructor

#### G4MasterForwardcoutDestination()

```cpp
G4MasterForwardcoutDestination() = default;
```

**Purpose:** Default constructor.

**Details:**
- Creates a destination that forwards to master thread
- No configuration required
- Uses base class `masterG4coutDestination` for forwarding

**Example:**
```cpp
auto forwarder = new G4MasterForwardcoutDestination();
G4iosSetDestination(forwarder);
```

#### ~G4MasterForwardcoutDestination()

```cpp
~G4MasterForwardcoutDestination() override = default;
```

**Purpose:** Default destructor.

**Details:** No special cleanup required - forwarding only.

### Message Handling (Override)

#### ReceiveG4debug()

```cpp
G4int ReceiveG4debug(const G4String& msg) override;
```

**Purpose:** Forwards debug messages to master thread destination.

**Parameters:**
- `msg` - Debug message to forward

**Return Value:**
- `0` - Message forwarded successfully
- `-1` - No master destination or forwarding failed

**Details:**
- Uses mutex lock for thread-safe forwarding
- If no master destination exists, message is silently ignored
- Calls master's `ReceiveG4debug_()` method

**Example:**
```cpp
// In worker thread
G4debug << "Debug information from worker" << G4endl;
// Forwarded to master thread's destination
```

#### ReceiveG4cout()

```cpp
G4int ReceiveG4cout(const G4String& msg) override;
```

**Purpose:** Forwards standard output messages to master thread destination.

**Parameters:**
- `msg` - Output message to forward

**Return Value:**
- `0` - Message forwarded successfully
- `-1` - No master destination or forwarding failed

**Details:**
- Thread-safe forwarding using mutex
- Master destination handles actual output
- Preserves message transformers applied before forwarding

**Example:**
```cpp
// In worker thread
G4cout << "Worker thread processing event" << G4endl;
// Message sent to master thread for display
```

#### ReceiveG4cerr()

```cpp
G4int ReceiveG4cerr(const G4String& msg) override;
```

**Purpose:** Forwards error messages to master thread destination.

**Parameters:**
- `msg` - Error message to forward

**Return Value:**
- `0` - Message forwarded successfully
- `-1` - No master destination or forwarding failed

**Details:**
- Critical for collecting error messages from all threads
- Thread-safe forwarding
- Master destination decides how to handle errors (console, file, GUI, etc.)

**Example:**
```cpp
// In worker thread
G4cerr << "ERROR: Invalid particle encountered" << G4endl;
// Error forwarded to master for handling
```

## Usage Patterns

### Basic Worker Thread Setup

```cpp
// Worker thread initialization
void InitializeWorkerThread()
{
    // Create forwarding destination
    auto forwarder = new G4MasterForwardcoutDestination();

    // Set as thread's destination
    G4iosSetDestination(forwarder);

    // All output from this thread now goes to master
    G4cout << "Worker initialized" << G4endl;
}
```

### With Message Formatting

```cpp
void InitializeWorkerThread()
{
    auto forwarder = new G4MasterForwardcoutDestination();

    // Add thread ID to messages before forwarding
    G4int threadId = G4Threading::G4GetThreadId();
    forwarder->AddCoutTransformer([threadId](G4String& msg) -> G4bool {
        std::stringstream ss;
        ss << "[Thread " << threadId << "] " << msg;
        msg = ss.str();
        return true;
    });

    G4iosSetDestination(forwarder);

    // Messages arrive at master with thread ID
    G4cout << "Processing event" << G4endl;
    // Master sees: [Thread 5] Processing event
}
```

### Master Thread Setup

```cpp
// Master thread
void InitializeMaster()
{
    // Master needs a destination to receive forwarded messages
    auto masterDest = new G4coutDestination();  // or specialized destination

    // Could be file destination
    // auto masterDest = new G4FilecoutDestination("master.log");
    // masterDest->Open();

    // Or GUI destination for graphical display
    // auto masterDest = new MyGUIDestination();

    G4iosSetDestination(masterDest);

    // Now master receives all worker output
}

// Worker thread
void InitializeWorkerThread()
{
    auto forwarder = new G4MasterForwardcoutDestination();
    G4iosSetDestination(forwarder);

    // Output forwarded to master's destination
}
```

### Combined with MulticoutDestination

```cpp
void InitializeWorkerThread()
{
    // Create multiple destination container
    auto multi = new G4MulticoutDestination();

    // Forward to master
    multi->push_back(
        G4coutDestinationUPtr(new G4MasterForwardcoutDestination())
    );

    // Also write to thread-local file
    G4int threadId = G4Threading::G4GetThreadId();
    std::stringstream ss;
    ss << "thread_" << threadId << ".log";
    auto fileDest = new G4FilecoutDestination(ss.str());
    fileDest->Open();
    multi->push_back(G4coutDestinationUPtr(fileDest));

    G4iosSetDestination(multi);

    // Output goes to both master and local file
    G4cout << "Event processed" << G4endl;
}
```

### GUI Application Pattern

```cpp
// Master thread with GUI destination
class GUIDestination : public G4coutDestination
{
 public:
  G4int ReceiveG4cout(const G4String& msg) override {
    // Update GUI text widget
    myGUI->AppendText(msg);
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override {
    // Show error in GUI dialog or error pane
    myGUI->ShowError(msg);
    return 0;
  }

 private:
  MyGUIClass* myGUI;
};

// Master setup
void InitializeMaster()
{
    auto guiDest = new GUIDestination();
    G4iosSetDestination(guiDest);
}

// Worker threads
void InitializeWorkerThread()
{
    auto forwarder = new G4MasterForwardcoutDestination();
    G4iosSetDestination(forwarder);

    // All worker output appears in GUI
    G4cout << "Processing particles" << G4endl;
}
```

### Selective Forwarding

```cpp
void InitializeWorkerThread()
{
    auto forwarder = new G4MasterForwardcoutDestination();

    // Only forward important messages
    forwarder->AddCoutTransformer([](G4String& msg) -> G4bool {
        // Only forward messages containing "IMPORTANT"
        return G4StrUtil::contains(msg, "IMPORTANT");
    });

    // Only forward errors
    forwarder->AddCerrTransformer([](G4String& msg) -> G4bool {
        return true;  // Forward all errors
    });

    G4iosSetDestination(forwarder);

    G4cout << "Normal message" << G4endl;  // Not forwarded
    G4cout << "IMPORTANT: Critical data" << G4endl;  // Forwarded
}
```

### Error Collection

```cpp
// Master collects all errors in dedicated file
void InitializeMaster()
{
    auto errorFile = new G4FilecoutDestination("all_errors.log");
    errorFile->Open();

    // Custom destination that only handles errors
    class ErrorCollector : public G4coutDestination
    {
     public:
      ErrorCollector(G4FilecoutDestination* errDest)
        : m_errDest(errDest) {}

      G4int ReceiveG4cout(const G4String& msg) override {
        // Normal output to console
        std::cout << msg << std::endl;
        return 0;
      }

      G4int ReceiveG4cerr(const G4String& msg) override {
        // Errors to both console and file
        std::cerr << msg << std::endl;
        return m_errDest->ReceiveG4cerr(msg);
      }

     private:
      G4FilecoutDestination* m_errDest;
    };

    auto collector = new ErrorCollector(errorFile);
    G4iosSetDestination(collector);
}

// Worker threads
void InitializeWorkerThread()
{
    auto forwarder = new G4MasterForwardcoutDestination();
    G4iosSetDestination(forwarder);

    // Errors from all threads collected in master's error file
    G4cerr << "Worker error occurred" << G4endl;
}
```

## Best Practices

### 1. Always Set Up Master Destination First

```cpp
// GOOD - Master destination ready before workers start
void SetupThreading()
{
    // Master thread
    auto masterDest = new G4coutDestination();
    G4iosSetDestination(masterDest);

    // Then start workers with forwarders
    StartWorkerThreads();
}

// WRONG - Workers start before master ready
void SetupThreading()
{
    StartWorkerThreads();  // Forwarders have nowhere to send!
    auto masterDest = new G4coutDestination();
    G4iosSetDestination(masterDest);
}
```

### 2. Use for Centralized Output

```cpp
// GOOD - All output collected in one place
// Master: GUI or master log file
// Workers: Forward to master

// AVOID - If you need separate per-thread logs
// Use G4FilecoutDestination directly in each thread instead
```

### 3. Add Thread Identification

```cpp
// GOOD - Identify source thread
auto forwarder = new G4MasterForwardcoutDestination();
G4int tid = G4Threading::G4GetThreadId();
forwarder->AddCoutTransformer([tid](G4String& msg) -> G4bool {
    msg = "[T" + std::to_string(tid) + "] " + msg;
    return true;
});

// AVOID - Anonymous output (can't tell which thread)
auto forwarder = new G4MasterForwardcoutDestination();
// No identification added
```

### 4. Handle Master Destination Lifetime

```cpp
// GOOD - Master destination lives as long as workers
class MyApplication
{
 public:
  void Initialize() {
    m_masterDest = new G4coutDestination();
    G4iosSetDestination(m_masterDest);
  }

  ~MyApplication() {
    delete m_masterDest;  // After all workers destroyed
  }

 private:
  G4coutDestination* m_masterDest;
};

// WRONG - Master destroyed while workers active
{
    auto masterDest = new G4coutDestination();
    G4iosSetDestination(masterDest);
    delete masterDest;  // Workers still trying to forward!
}
```

### 5. Use for GUI Applications

```cpp
// IDEAL USE CASE - GUI needs all output
// Master runs GUI and collects all worker output
void InitializeGUIApplication()
{
    // Master with GUI
    auto guiDest = new MyGUIDestination();
    G4iosSetDestination(guiDest);

    // Workers forward to GUI
    // (In each worker thread)
    auto forwarder = new G4MasterForwardcoutDestination();
    G4iosSetDestination(forwarder);
}
```

### 6. Don't Mix with Direct Console Output

```cpp
// AVOID - Mixing forwarded and direct output
auto forwarder = new G4MasterForwardcoutDestination();

// Also writing directly to console
std::cout << "Direct output" << std::endl;  // Not forwarded!

// BETTER - All output through G4cout
G4cout << "Forwarded output" << G4endl;  // Goes to master
```

### 7. Consider Performance Impact

```cpp
// Each forwarded message acquires mutex
// For very high-frequency output, consider:

// Option 1: Buffer before forwarding
class BufferedForwarder : public G4BuffercoutDestination
{
  G4int FlushG4cout() override {
    // Forward buffered output to master
    return masterG4coutDestination->ReceiveG4cout(buffer);
  }
};

// Option 2: Reduce verbosity in worker threads
forwarder->AddCoutTransformer([](G4String& msg) -> G4bool {
    // Filter verbose messages
    return !G4StrUtil::contains(msg, "VERBOSE");
});
```

## Thread Safety

- **Thread-Safe:** Uses mutex locking for all forwarding operations
- Messages are serialized when sent to master
- No race conditions when multiple workers forward simultaneously
- Master destination must also be thread-safe if accessed directly

## Performance Considerations

### Mutex Overhead

- Each forwarded message acquires a mutex lock
- Lock contention increases with number of threads
- Overhead is small for moderate output rates
- Consider buffering for very high-frequency output

### Message Ordering

- Messages from different threads are serialized
- Order is non-deterministic (depends on thread scheduling)
- Use thread prefixes to identify source
- Timestamps can help reconstruct event sequence

### Network Latency

- No impact for local applications
- In distributed systems, forwarding may involve network overhead
- Consider local buffering for distributed applications

## Common Use Cases

### 1. GUI Applications

Ideal for collecting all output in GUI:
```cpp
// All worker output appears in GUI text widget
```

### 2. Web-Based Monitoring

Central collection point for web display:
```cpp
// Master forwards to web server
// Workers forward to master
```

### 3. Centralized Logging

Single log file for all threads:
```cpp
// Master writes to log file
// Workers forward to master
```

### 4. Remote Monitoring

Master can send to remote monitoring system:
```cpp
// Master sends to monitoring service
// Workers forward to master
```

## Common Pitfalls

### No Master Destination

```cpp
// WRONG - No master destination set
void InitializeWorkerThread()
{
    auto forwarder = new G4MasterForwardcoutDestination();
    G4iosSetDestination(forwarder);
    // Messages forwarded to nullptr - lost!
}

// CORRECT - Master destination exists
void InitializeMaster()
{
    G4iosSetDestination(new G4coutDestination());
}
void InitializeWorkerThread()
{
    auto forwarder = new G4MasterForwardcoutDestination();
    G4iosSetDestination(forwarder);
    // Messages forwarded successfully
}
```

### Circular Forwarding

```cpp
// WRONG - Infinite loop
void InitializeMaster()
{
    auto forwarder = new G4MasterForwardcoutDestination();
    G4iosSetDestination(forwarder);
    // Master forwards to itself!
}

// CORRECT - Master has actual destination
void InitializeMaster()
{
    auto dest = new G4coutDestination();  // Real destination
    G4iosSetDestination(dest);
}
```

### Premature Master Destruction

```cpp
// WRONG - Master destroyed before workers
{
    auto masterDest = new G4coutDestination();
    G4iosSetDestination(masterDest);
    StartWorkers();
    delete masterDest;  // Workers still running!
    WaitForWorkers();
}

// CORRECT - Master lives until workers done
auto masterDest = new G4coutDestination();
G4iosSetDestination(masterDest);
StartWorkers();
WaitForWorkers();
delete masterDest;  // Now safe to delete
```

## Comparison with Other Destinations

### vs G4MTcoutDestination

- **G4MasterForwardcoutDestination:** Simple forwarding only
- **G4MTcoutDestination:** Full-featured MT output with buffering, file output, formatting

### vs G4MulticoutDestination

- **G4MasterForwardcoutDestination:** Single purpose - forward to master
- **G4MulticoutDestination:** Route to multiple destinations

### vs G4FilecoutDestination

- **G4MasterForwardcoutDestination:** Forward to master's destination (any type)
- **G4FilecoutDestination:** Direct file writing

### When to Use

- **Use G4MasterForwardcoutDestination when:**
  - Building GUI applications
  - Centralizing all output
  - Master thread handles display/logging
  - Simple forwarding needed

- **Use G4MTcoutDestination when:**
  - Need full MT features (buffering, file output, etc.)
  - Per-thread customization required
  - Complex output routing

## See Also

- **G4coutDestination** - Base class
- **G4MTcoutDestination** - Full-featured multi-threaded output
- **G4MulticoutDestination** - Multiple destination routing
- **G4LockcoutDestination** - Thread-safe locked output
- **G4Threading** - Threading utilities
- **G4iosSetDestination()** - Setting active destination
