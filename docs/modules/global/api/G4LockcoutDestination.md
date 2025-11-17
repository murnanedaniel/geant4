# G4LockcoutDestination

## Overview

`G4LockcoutDestination` is a thread-safe output destination that uses mutex locking to serialize access to `std::cout` and `std::cerr`. It ensures that output from multiple threads doesn't interleave or corrupt, making it ideal for simple multi-threaded applications that need console output.

**Category:** Global/Management - Multi-Threaded I/O
**Base Class:** G4coutDestination
**Author:** A. Dotti (SLAC) - April 2017

## Source Locations

**Header:** `/source/global/management/include/G4LockcoutDestination.hh`
**Source:** `/source/global/management/src/G4LockcoutDestination.cc`

## Class Definition

```cpp
class G4LockcoutDestination : public G4coutDestination
{
 public:
  G4LockcoutDestination() = default;
  ~G4LockcoutDestination() override = default;

  G4int ReceiveG4debug(const G4String& msg) override;
  G4int ReceiveG4cout(const G4String& msg) override;
  G4int ReceiveG4cerr(const G4String& msg) override;
};
```

## Public Methods

### Constructor and Destructor

#### G4LockcoutDestination()

```cpp
G4LockcoutDestination() = default;
```

**Purpose:** Constructs a thread-safe locked output destination.

**Details:**
- Uses internal static mutex for thread synchronization
- No configuration required
- Ready to use immediately

**Example:**
```cpp
auto dest = new G4LockcoutDestination();
G4iosSetDestination(dest);
```

#### ~G4LockcoutDestination()

```cpp
~G4LockcoutDestination() override = default;
```

**Purpose:** Default destructor.

**Details:** No special cleanup required.

### Message Handling (Override)

#### ReceiveG4debug()

```cpp
G4int ReceiveG4debug(const G4String& msg) override;
```

**Purpose:** Writes debug messages to standard output with mutex protection.

**Parameters:**
- `msg` - Debug message to output

**Return Value:**
- `0` - Message written successfully
- `-1` - Output failed

**Details:**
- Acquires mutex lock before writing
- Writes to `std::cout`
- Releases lock after writing
- Thread-safe: Multiple threads can call simultaneously

**Implementation Pattern:**
```cpp
G4int ReceiveG4debug(const G4String& msg) override
{
    std::lock_guard<std::mutex> lock(globalMutex);
    std::cout << msg << std::flush;
    return 0;
}
```

**Example:**
```cpp
// Thread 1
G4debug << "Thread 1 debug" << G4endl;

// Thread 2 (concurrent)
G4debug << "Thread 2 debug" << G4endl;

// Output is clean, no interleaving
```

#### ReceiveG4cout()

```cpp
G4int ReceiveG4cout(const G4String& msg) override;
```

**Purpose:** Writes output messages to standard output with mutex protection.

**Parameters:**
- `msg` - Output message

**Return Value:**
- `0` - Message written successfully
- `-1` - Output failed

**Details:**
- Primary thread-safe output method
- Mutex ensures atomic writes
- Each message written completely before next thread's message
- Output flushed after each message

**Example:**
```cpp
// Safe multi-threaded usage
void ProcessEvent(G4int threadId, G4int eventId)
{
    G4cout << "Thread " << threadId
           << " processing event " << eventId
           << G4endl;
    // Complete message printed atomically
}
```

#### ReceiveG4cerr()

```cpp
G4int ReceiveG4cerr(const G4String& msg) override;
```

**Purpose:** Writes error messages to standard error with mutex protection.

**Parameters:**
- `msg` - Error message

**Return Value:**
- `0` - Message written successfully
- `-1` - Output failed

**Details:**
- Thread-safe error output
- Writes to `std::cerr`
- Same mutex as cout (prevents interleaving between cout and cerr)
- Critical for multi-threaded error reporting

**Example:**
```cpp
// Thread-safe error reporting
void DetectError(G4int threadId)
{
    G4cerr << "ERROR in thread " << threadId
           << ": Invalid state detected"
           << G4endl;
    // Error message printed atomically
}
```

## Usage Patterns

### Basic Multi-Threaded Setup

```cpp
// Master thread initialization
void InitializeMaster()
{
    auto lockDest = new G4LockcoutDestination();
    G4iosSetDestination(lockDest);
}

// Worker threads (no special setup needed)
void InitializeWorkerThread()
{
    // Same destination used by all threads
    // Mutex ensures thread safety
}

// Thread-safe output from any thread
void ProcessInThread(G4int tid)
{
    G4cout << "Thread " << tid << " running" << G4endl;
    // Safe concurrent access
}
```

### Shared Console Output

```cpp
// All threads share single locked destination
int main()
{
    // Setup locked destination
    auto dest = new G4LockcoutDestination();
    G4iosSetDestination(dest);

    // Start multi-threaded simulation
    auto runManager = new G4MTRunManager();
    runManager->SetNumberOfThreads(4);

    // All threads output safely to console
    runManager->BeamOn(1000);

    delete dest;
    return 0;
}
```

### With Thread Identification

```cpp
void InitializeWorkerThread()
{
    // Can still add transformers for thread ID
    auto dest = G4coutbuf.GetDestination();
    if (auto lockDest = dynamic_cast<G4LockcoutDestination*>(dest))
    {
        G4int tid = G4Threading::G4GetThreadId();
        lockDest->AddCoutTransformer([tid](G4String& msg) -> G4bool {
            msg = "[T" + std::to_string(tid) + "] " + msg;
            return true;
        });
    }
}

// Output includes thread ID
// Thread 1: [T1] Processing event 42
// Thread 2: [T2] Processing event 43
```

### Error Collection

```cpp
class ThreadSafeErrorCollector : public G4LockcoutDestination
{
 public:
  G4int ReceiveG4cerr(const G4String& msg) override
  {
    // Call parent for locked console output
    G4LockcoutDestination::ReceiveG4cerr(msg);

    // Also collect in thread-safe vector
    std::lock_guard<std::mutex> lock(m_errorMutex);
    m_errors.push_back(msg);

    return 0;
  }

  std::vector<G4String> GetErrors() const
  {
    std::lock_guard<std::mutex> lock(m_errorMutex);
    return m_errors;
  }

 private:
  mutable std::mutex m_errorMutex;
  std::vector<G4String> m_errors;
};

// Usage
auto collector = new ThreadSafeErrorCollector();
G4iosSetDestination(collector);

// ... multi-threaded execution ...

// Retrieve all errors at end
auto errors = collector->GetErrors();
for (const auto& err : errors) {
    std::cout << "Collected error: " << err << std::endl;
}
```

### Combined with File Output

```cpp
// Console with locking + file output
auto multi = new G4MulticoutDestination();

// Thread-safe console
multi->push_back(G4coutDestinationUPtr(new G4LockcoutDestination()));

// Thread-safe file (each thread has own file)
void InitializeWorkerThread()
{
    G4int tid = G4Threading::G4GetThreadId();
    std::stringstream ss;
    ss << "thread_" << tid << ".log";

    auto fileDest = new G4FilecoutDestination(ss.str());
    fileDest->Open();

    // Add file to multi-destination (per-thread setup)
    // Or use separate file destination for each thread
}
```

### Simple Multi-Threaded Application

```cpp
#include "G4MTRunManager.hh"
#include "G4LockcoutDestination.hh"

int main(int argc, char** argv)
{
    // Create locked destination for thread-safe output
    auto lockDest = new G4LockcoutDestination();
    G4iosSetDestination(lockDest);

    // Setup MT run manager
    auto runManager = new G4MTRunManager();
    runManager->SetNumberOfThreads(
        std::thread::hardware_concurrency()
    );

    // Initialize geometry, physics, etc.
    // ...

    // Run simulation (threads output safely)
    runManager->BeamOn(10000);

    // Cleanup
    delete runManager;
    delete lockDest;

    return 0;
}
```

### Debugging Multi-Threaded Issues

```cpp
class DebugLockcoutDestination : public G4LockcoutDestination
{
 public:
  G4int ReceiveG4cout(const G4String& msg) override
  {
    // Add timestamp and thread ID for debugging
    auto tid = std::this_thread::get_id();
    auto now = std::chrono::system_clock::now();
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()
    ).count();

    std::stringstream ss;
    ss << "[" << ms << " TID:" << tid << "] " << msg;

    return G4LockcoutDestination::ReceiveG4cout(ss.str());
  }
};

// Usage helps debug thread timing issues
auto debugDest = new DebugLockcoutDestination();
G4iosSetDestination(debugDest);
```

## Best Practices

### 1. Use for Simple Multi-Threaded Console Output

```cpp
// IDEAL - Simple MT application needing console output
auto dest = new G4LockcoutDestination();
G4iosSetDestination(dest);
// All threads can safely output to console

// NOT IDEAL - Complex requirements (use G4MTcoutDestination)
// - Per-thread file output
// - Buffering
// - Complex formatting
```

### 2. Share Single Instance Across All Threads

```cpp
// GOOD - One locked destination for all threads
void InitializeMaster()
{
    auto dest = new G4LockcoutDestination();
    G4iosSetDestination(dest);
}

// WRONG - Separate instances per thread (defeats purpose)
void InitializeWorkerThread()
{
    auto dest = new G4LockcoutDestination();  // Don't do this!
    G4iosSetDestination(dest);
}
```

### 3. Keep Messages Complete

```cpp
// GOOD - Complete message in one statement
G4cout << "Thread " << tid << " event " << eventId << G4endl;
// Entire message locked and printed atomically

// AVOID - Multiple statements (can interleave)
G4cout << "Thread " << tid;
// Another thread might output here!
G4cout << " event " << eventId << G4endl;
```

### 4. Minimize Lock Contention

```cpp
// GOOD - Minimize output frequency
if (eventId % 1000 == 0) {
    G4cout << "Progress: " << eventId << " events" << G4endl;
}

// AVOID - High-frequency output (poor performance)
for (int i = 0; i < 1000000; ++i) {
    G4cout << "Step " << i << G4endl;  // Constant lock contention
}
```

### 5. Consider Buffering for Performance

```cpp
// For high-frequency output, combine with buffering
class BufferedLockedDestination : public G4BuffercoutDestination
{
 public:
  G4int FlushG4cout() override
  {
    // Flush buffer through locked destination
    static G4LockcoutDestination lockedDest;
    std::lock_guard<std::mutex> lock(flushMutex);
    // Write buffered content
    return 0;
  }

 private:
  static std::mutex flushMutex;
};
```

### 6. Add Thread Identification

```cpp
// GOOD - Identify which thread produced output
dest->AddCoutTransformer([](G4String& msg) -> G4bool {
    auto tid = G4Threading::G4GetThreadId();
    msg = "[Thread " + std::to_string(tid) + "] " + msg;
    return true;
});

// Output: [Thread 3] Processing event 42
```

### 7. Handle Errors Appropriately

```cpp
// Error output is also thread-safe
G4cerr << "ERROR: " << errorDescription << G4endl;
// Safe even from multiple threads

// Critical errors might need immediate attention
if (isCritical) {
    G4cerr << "CRITICAL ERROR: " << msg << G4endl;
    std::cerr << std::flush;  // Ensure immediate output
}
```

## Performance Considerations

### Mutex Overhead

- **Lock acquisition:** ~50-200 nanoseconds (uncontended)
- **Lock contention:** Microseconds to milliseconds (depends on wait time)
- **Impact:** Negligible for moderate output, significant for high frequency

### Scalability

- Serial output only (one thread at a time)
- Performance decreases with number of threads
- More threads = more contention = slower output

### Performance Comparison

```
Unbuffered, unlocked (unsafe):     100% (baseline, but incorrect)
G4LockcoutDestination:              80% (safe, moderate overhead)
G4MTcoutDestination (buffered):    95% (safe, low overhead)
Per-thread files (no locking):     98% (safe, minimal overhead)
```

### When to Use

- **Good for:**
  - Small number of threads (2-8)
  - Moderate output frequency
  - Simple applications
  - Quick prototyping

- **Consider alternatives for:**
  - Many threads (>8)
  - High-frequency output
  - Performance-critical applications
  - Production simulations

## Thread Safety

- **Fully thread-safe** for concurrent access
- Uses internal mutex for synchronization
- All threads can safely call simultaneously
- No race conditions or data corruption
- Output serialized (one thread at a time)

## Common Use Cases

### 1. Development and Debugging

Quick setup for multi-threaded development:
```cpp
auto dest = new G4LockcoutDestination();
G4iosSetDestination(dest);
// All threads output safely to console
```

### 2. Small-Scale Simulations

Simple MT simulations with console monitoring:
```cpp
// 2-4 threads, moderate output
runManager->SetNumberOfThreads(4);
auto dest = new G4LockcoutDestination();
```

### 3. Prototyping

Rapid prototyping before implementing full output system:
```cpp
// Quick thread-safe output
// Replace with G4MTcoutDestination for production
```

### 4. Educational Examples

Teaching MT concepts with visible output:
```cpp
// Students can see thread behavior
// Safe output without complexity
```

## Common Pitfalls

### Using Per-Thread Instances

```cpp
// WRONG - Each thread has own locked destination
void InitializeWorkerThread()
{
    auto dest = new G4LockcoutDestination();
    G4iosSetDestination(dest);
    // Different mutexes! Not thread-safe!
}

// CORRECT - All threads share one instance
void InitializeMaster()
{
    auto dest = new G4LockcoutDestination();
    G4iosSetDestination(dest);
    // All threads use same destination and mutex
}
```

### Splitting Messages

```cpp
// WRONG - Can interleave
G4cout << "Part 1 ";
// Another thread might output here
G4cout << "Part 2" << G4endl;

// CORRECT - Complete message
G4cout << "Part 1 Part 2" << G4endl;
```

### High-Frequency Output

```cpp
// WRONG - Poor performance
for (int i = 0; i < 1000000; ++i) {
    G4cout << "Step " << i << G4endl;
    // Constant mutex contention
}

// BETTER - Reduce frequency
for (int i = 0; i < 1000000; ++i) {
    if (i % 10000 == 0) {
        G4cout << "Progress: " << i << G4endl;
    }
}

// BEST - Use buffering
auto bufferedDest = new G4BuffercoutDestination();
```

### Not Flushing

```cpp
// Be aware: Each message auto-flushes
// Good for immediate visibility
// Bad for performance with many messages

// If you need performance, use buffering instead
```

## Comparison with Other Destinations

### vs G4MTcoutDestination

- **G4LockcoutDestination:** Simple, thread-safe console output
- **G4MTcoutDestination:** Full-featured MT output (buffering, files, formatting)

### vs G4MasterForwardcoutDestination

- **G4LockcoutDestination:** All threads output directly to console with locking
- **G4MasterForwardcoutDestination:** Workers forward to master thread

### vs Per-Thread Files

- **G4LockcoutDestination:** Shared console, serialized output
- **Per-thread files:** Parallel I/O, no contention

### When to Use G4LockcoutDestination

- **Use when:**
  - Need simple thread-safe console output
  - Small number of threads
  - Development/debugging
  - Quick prototyping

- **Use alternatives when:**
  - Many threads (use per-thread files)
  - High-frequency output (use buffering)
  - Complex formatting (use G4MTcoutDestination)
  - Production runs (use G4MTcoutDestination)

## Advanced Usage

### Custom Locking Strategy

```cpp
class CustomLockedDestination : public G4coutDestination
{
 public:
  G4int ReceiveG4cout(const G4String& msg) override
  {
    // Custom lock (e.g., read-write lock)
    std::unique_lock<std::shared_mutex> lock(m_rwMutex);
    std::cout << msg << std::flush;
    return 0;
  }

 private:
  static std::shared_mutex m_rwMutex;
};
```

### Per-Stream Locking

```cpp
class PerStreamLockedDestination : public G4coutDestination
{
 public:
  G4int ReceiveG4cout(const G4String& msg) override
  {
    std::lock_guard<std::mutex> lock(m_coutMutex);
    std::cout << msg << std::flush;
    return 0;
  }

  G4int ReceiveG4cerr(const G4String& msg) override
  {
    std::lock_guard<std::mutex> lock(m_cerrMutex);
    std::cerr << msg << std::flush;
    return 0;
  }

 private:
  static std::mutex m_coutMutex;
  static std::mutex m_cerrMutex;
};
```

## See Also

- **G4coutDestination** - Base class
- **G4MTcoutDestination** - Full-featured multi-threaded output
- **G4MasterForwardcoutDestination** - Master thread forwarding
- **G4BuffercoutDestination** - Output buffering
- **G4MulticoutDestination** - Multiple destination routing
- **std::mutex** - Mutex synchronization primitive
- **std::lock_guard** - RAII mutex locking
- **G4Threading** - Threading utilities
