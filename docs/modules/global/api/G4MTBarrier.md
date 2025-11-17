# G4MTBarrier

Multi-threaded synchronization barrier for coordinating master and worker threads.

## Header

```cpp
#include "G4MTBarrier.hh"
```

## Source Location

- Header: `source/global/management/include/G4MTBarrier.hh`

## Overview

G4MTBarrier implements a synchronization point between a master thread and a pool of worker threads. It provides a rendezvous mechanism where the master thread waits for all active worker threads to reach a barrier, and workers wait for the master to signal continuation.

This is critical for coordinating threads at specific points in the Geant4 event loop, such as:
- Before starting event processing
- After completing all events
- Between different run phases

The barrier can be extended via inheritance to support message passing between master and workers during synchronization.

## Class Definition

```cpp
class G4MTBarrier
{
public:
    G4MTBarrier();
    G4MTBarrier(unsigned int numThreads);
    virtual ~G4MTBarrier() {}

    // Deleted copy/move operations
    G4MTBarrier(const G4MTBarrier&) = delete;
    G4MTBarrier& operator=(const G4MTBarrier&) = delete;

    // Core synchronization methods
    void ThisWorkerReady();
    virtual void WaitForReadyWorkers();

    // Configuration
    void SetActiveThreads(unsigned int val);
    void ResetCounter();
    unsigned int GetCounter();

    // Granular control
    void Wait();
    void ReleaseBarrier();
    void Wait(unsigned int numt);
};
```

## Constructors

### Default Constructor
```cpp
G4MTBarrier()
```
Creates a barrier for 1 active thread.

**Example:**
```cpp
G4MTBarrier barrier;  // Default: 1 thread
barrier.SetActiveThreads(4);  // Adjust later
```

---

### Parameterized Constructor
```cpp
G4MTBarrier(unsigned int numThreads)
```
Creates a barrier expecting `numThreads` active worker threads.

**Parameters:**
- `numThreads`: Number of worker threads to wait for

**Example:**
```cpp
unsigned int nWorkers = 8;
G4MTBarrier barrier(nWorkers);
```

## Core Methods

### ThisWorkerReady()
```cpp
void ThisWorkerReady()
```
Called by each worker thread to signal it has reached the barrier. The worker thread will block until the master releases the barrier.

**Thread Safety:** Thread-safe (internally synchronized)

**Blocking:** Yes - blocks until master calls ReleaseBarrier()

**Example (Worker Thread):**
```cpp
void WorkerThreadFunction() {
    // Do initialization work
    PrepareWorkerData();

    // Signal ready and wait for master
    barrier.ThisWorkerReady();

    // Continue after master releases barrier
    ProcessEvents();
}
```

---

### WaitForReadyWorkers()
```cpp
virtual void WaitForReadyWorkers()
```
Called by master thread to wait for all active worker threads to call `ThisWorkerReady()`, then releases them to continue.

**Thread Safety:** Thread-safe

**Blocking:** Yes - blocks until all workers are ready

**Virtual:** Can be overridden for custom behavior (e.g., message passing)

**Example (Master Thread):**
```cpp
void MasterThreadFunction() {
    // Wait for all workers to be ready
    barrier.WaitForReadyWorkers();

    // All workers are synchronized - proceed
    StartNextPhase();
}
```

---

### SetActiveThreads()
```cpp
void SetActiveThreads(unsigned int val)
```
Sets the number of active worker threads the barrier should wait for.

**Parameters:**
- `val`: Number of active threads

**Usage:** Call before barrier synchronization to adjust thread count.

**Example:**
```cpp
barrier.SetActiveThreads(G4Threading::G4GetNumberOfCores());
```

---

### ResetCounter()
```cpp
void ResetCounter()
```
Resets the internal counter of threads that have reached the barrier to zero.

**Usage:** Typically not needed (handled automatically), but available for manual control.

---

### GetCounter()
```cpp
unsigned int GetCounter()
```
Returns the current number of worker threads that have reached the barrier.

**Returns:** Count of threads currently waiting at barrier

**Example:**
```cpp
if (barrier.GetCounter() == expectedThreads) {
    // All threads have arrived
}
```

## Granular Control Methods

For advanced use cases, the barrier can be controlled in steps:

### Wait()
```cpp
void Wait()
```
Master waits for all workers to reach barrier (first half of WaitForReadyWorkers).

---

### ReleaseBarrier()
```cpp
void ReleaseBarrier()
```
Master releases all waiting workers (second half of WaitForReadyWorkers).

**Pattern:**
```cpp
// In master thread
barrier.Wait();           // Wait for workers
DoSomethingWhileLocked(); // Custom logic
barrier.ReleaseBarrier(); // Release workers
```

---

### Wait(unsigned int)
```cpp
void Wait(unsigned int numt)
```
Convenience method: sets active threads and waits.

**Parameters:**
- `numt`: Number of threads to wait for

**Equivalent to:**
```cpp
barrier.SetActiveThreads(numt);
barrier.Wait();
```

## Barrier Mechanism

The barrier implements a two-phase synchronization protocol:

### Phase 1: Workers Signal Ready

```
Worker 1 ────┐
Worker 2 ────┼──> ThisWorkerReady() ──> Increment counter ──> Wait on condition
Worker 3 ────┘                                                        │
                                                                      │
Master ──────────> WaitForReadyWorkers() ──> Wait until counter == N │
                                                                      │
                                          ┌───────────────────────────┘
                                          │
```

### Phase 2: Master Releases Workers

```
Master ──> Broadcast signal ──────────────────┐
                                               │
Worker 1 <────────────────────────────────────┤
Worker 2 <──── Wake up and continue <─────────┤
Worker 3 <────────────────────────────────────┘
```

### Internal Algorithm

**Master Thread (WaitForReadyWorkers):**
```cpp
// (1) Loop waiting for all workers
while (counter != nActiveThreads) {
    lock(counterMutex);
    if (counter == nActiveThreads) break;
    wait(conditionOnCounter, counterMutex);  // Atomically unlock and wait
    unlock(counterMutex);
}

// (2) All workers ready - signal them
lock(counterMutex);
broadcast(doSomethingCanStart);
unlock(counterMutex);
```

**Worker Thread (ThisWorkerReady):**
```cpp
lock(counterMutex);
++counter;                                   // Signal ready
broadcast(conditionOnCounter);               // Notify master
wait(doSomethingCanStart, counterMutex);    // Wait for master signal
unlock(counterMutex);
```

## Threading Patterns

### Pattern 1: Basic Run Barrier

```cpp
class MyRunManager {
    G4MTBarrier runBarrier;

    void BeginOfRunAction() {
        if (IsMasterThread()) {
            runBarrier.SetActiveThreads(numberOfWorkers);
            runBarrier.WaitForReadyWorkers();
            // All workers ready for run
        } else {
            // Worker prepares
            PrepareForRun();
            runBarrier.ThisWorkerReady();
            // Proceed with run
        }
    }
};
```

### Pattern 2: Event Loop Synchronization

```cpp
void RunEventLoop() {
    G4MTBarrier startBarrier(nWorkers);
    G4MTBarrier endBarrier(nWorkers);

    if (IsMasterThread()) {
        // Wait for workers to start
        startBarrier.WaitForReadyWorkers();
        std::cout << "All workers started" << std::endl;

        // Wait for workers to finish
        endBarrier.WaitForReadyWorkers();
        std::cout << "All workers finished" << std::endl;

    } else {
        // Worker signals start
        startBarrier.ThisWorkerReady();

        // Process events
        ProcessMyEvents();

        // Worker signals completion
        endBarrier.ThisWorkerReady();
    }
}
```

### Pattern 3: Granular Control with Custom Logic

```cpp
void CustomBarrier() {
    G4MTBarrier barrier(nWorkers);

    if (IsMasterThread()) {
        // Wait for workers
        barrier.Wait();

        // Do something while workers are waiting
        CollectStatistics();
        UpdateConfiguration();

        // Release workers
        barrier.ReleaseBarrier();

    } else {
        barrier.ThisWorkerReady();
    }
}
```

### Pattern 4: Inherited Barrier with Message Passing

```cpp
class MessageBarrier : public G4MTBarrier {
    G4Mutex messageMutex;
    std::string message;

public:
    MessageBarrier(unsigned int n) : G4MTBarrier(n) {}

    void WaitForReadyWorkers() override {
        // Wait for workers (mandatory)
        Wait();

        // Process/send message while workers wait
        {
            G4AutoLock lock(&messageMutex);
            message = "Configuration updated";
        }

        // Release workers (mandatory)
        ReleaseBarrier();
    }

    void ThisWorkerReady() {
        // Call base to reach barrier
        G4MTBarrier::ThisWorkerReady();

        // Process message after release
        G4AutoLock lock(&messageMutex);
        ProcessMessage(message);
    }
};
```

### Pattern 5: Dynamic Thread Count

```cpp
void ProcessWithDynamicThreads() {
    G4MTBarrier barrier;

    if (IsMasterThread()) {
        int activeWorkers = GetActiveWorkerCount();
        barrier.Wait(activeWorkers);  // Set count and wait
        // Proceed
        barrier.ReleaseBarrier();

    } else if (IsActiveWorker()) {
        barrier.ThisWorkerReady();
    }
}
```

## Master vs Worker Thread Usage

### Master Thread Responsibilities

```cpp
void MasterThread() {
    G4MTBarrier barrier(nWorkers);

    // Initialize shared resources
    InitializeGeometry();
    InitializePhysics();

    // Create worker threads
    CreateWorkerThreads(nWorkers);

    // Synchronization point 1: Wait for workers to initialize
    barrier.WaitForReadyWorkers();
    G4cout << "All workers initialized" << G4endl;

    // Start run
    StartRun();

    // Synchronization point 2: Wait for workers to complete
    barrier.WaitForReadyWorkers();
    G4cout << "All workers completed" << G4endl;

    // Aggregate results
    CollectResults();
}
```

### Worker Thread Responsibilities

```cpp
void WorkerThread() {
    G4MTBarrier& barrier = GetBarrier();

    // Initialize worker-local data
    InitializeWorkerData();

    // Signal ready to master
    barrier.ThisWorkerReady();

    // Process events
    ProcessEvents();

    // Signal completion to master
    barrier.ThisWorkerReady();
}
```

## Thread Safety Guarantees

### Thread-Safe Operations
- `ThisWorkerReady()` - Can be called concurrently by multiple workers
- `WaitForReadyWorkers()` - Safe for master thread
- `SetActiveThreads()` - Should be called before synchronization
- `GetCounter()` - Thread-safe read

### Synchronization Guarantees
- **Mutual Exclusion**: Only one thread modifies counter at a time
- **Happens-Before**: Worker operations before `ThisWorkerReady()` happen-before master operations after `WaitForReadyWorkers()`
- **No Spurious Wakeups**: Condition wait is protected by counter check

### Important Constraints
1. Master must call `WaitForReadyWorkers()` or `Wait()`/`ReleaseBarrier()`
2. Each worker must call `ThisWorkerReady()` exactly once per barrier use
3. Number of `ThisWorkerReady()` calls must equal `m_numActiveThreads`
4. Don't change `m_numActiveThreads` while threads are waiting

## Performance Notes

### Overhead
- **Lock Contention**: All workers contend on same mutex
- **Context Switches**: Workers sleep and wake, triggering context switches
- **Synchronization Cost**: Barrier adds latency at synchronization points

### Optimization Tips
1. **Minimize Barrier Points**: Use barriers only when necessary
2. **Batch Work**: Do maximum work between barriers
3. **Avoid in Hot Paths**: Don't use in per-event loops
4. **Consider Alternatives**: Lock-free algorithms for high-frequency sync

### Scaling Characteristics
- **Linear Scaling**: Synchronization time grows with thread count
- **Cache Effects**: Barrier thrashing can affect cache performance
- **NUMA Awareness**: Consider NUMA topology on large systems

## Common Pitfalls

### 1. Mismatched Thread Count

```cpp
// BAD - Worker count doesn't match barrier
barrier.SetActiveThreads(4);
CreateWorkers(8);  // 8 workers, but barrier expects 4
// Master will hang waiting for 4, while 8 workers wait

// GOOD
int nWorkers = 8;
barrier.SetActiveThreads(nWorkers);
CreateWorkers(nWorkers);
```

### 2. Calling ThisWorkerReady() from Master

```cpp
// BAD - Master calling worker method
if (IsMasterThread()) {
    barrier.ThisWorkerReady();  // WRONG - will deadlock
}

// GOOD
if (IsMasterThread()) {
    barrier.WaitForReadyWorkers();
} else {
    barrier.ThisWorkerReady();
}
```

### 3. Multiple Calls to ThisWorkerReady()

```cpp
// BAD - Worker calls twice
void WorkerThread() {
    barrier.ThisWorkerReady();
    DoWork();
    barrier.ThisWorkerReady();  // BAD - counter will be wrong
}

// GOOD - Use separate barriers
void WorkerThread() {
    barrier1.ThisWorkerReady();
    DoWork();
    barrier2.ThisWorkerReady();
}
```

### 4. Forgetting to Release Barrier

```cpp
// BAD - Using Wait() without ReleaseBarrier()
if (IsMasterThread()) {
    barrier.Wait();
    DoWork();
    // Forgot barrier.ReleaseBarrier() - workers hang forever
}

// GOOD - Complete the cycle
if (IsMasterThread()) {
    barrier.Wait();
    DoWork();
    barrier.ReleaseBarrier();
}

// BETTER - Use WaitForReadyWorkers() which does both
if (IsMasterThread()) {
    barrier.WaitForReadyWorkers();  // Waits AND releases
}
```

### 5. Reusing Barrier Without Reset

```cpp
// BAD - Reusing without proper reset
for (int i = 0; i < 10; i++) {
    if (IsMasterThread()) {
        barrier.WaitForReadyWorkers();
    } else {
        barrier.ThisWorkerReady();
    }
    // Barrier state may be inconsistent
}

// GOOD - Barrier naturally resets for next use
for (int i = 0; i < 10; i++) {
    if (IsMasterThread()) {
        barrier.SetActiveThreads(nWorkers);  // Ensure count is correct
        barrier.WaitForReadyWorkers();
    } else {
        barrier.ThisWorkerReady();
    }
}
```

## Real-World Usage in Geant4

### G4MTRunManager

```cpp
void G4MTRunManager::RunInitialization() {
    // Master thread
    InitializeGeometry();
    InitializePhysics();

    // Create workers
    CreateAndStartWorkers();

    // Wait for workers to complete initialization
    beginOfRunBarrier->WaitForReadyWorkers();
}

void G4WorkerRunManager::RunInitialization() {
    // Worker thread
    InitializeWorkerResources();

    // Signal ready to master
    beginOfRunBarrier->ThisWorkerReady();
}
```

### Run Completion

```cpp
void G4MTRunManager::TerminateEventLoop() {
    if (IsMaster()) {
        // Wait for all workers to finish events
        endOfEventBarrier->WaitForReadyWorkers();

        // Aggregate results
        MergeResults();
    }
}

void G4WorkerRunManager::TerminateEventLoop() {
    // Complete all events
    ProcessRemainingEvents();

    // Signal completion
    endOfEventBarrier->ThisWorkerReady();
}
```

## Extending G4MTBarrier

### Custom Derived Class Example

```cpp
class ConfigBarrier : public G4MTBarrier {
    G4Mutex configMutex;
    RunConfiguration config;

public:
    ConfigBarrier(unsigned int n) : G4MTBarrier(n) {}

    void WaitForReadyWorkers() override {
        // Wait for workers (mandatory)
        Wait();

        // Update configuration while workers wait
        {
            G4AutoLock lock(&configMutex);
            config.UpdateFromMaster();
        }

        // Release workers to use new config (mandatory)
        ReleaseBarrier();
    }

    void WorkerGetConfig(RunConfiguration& workerConfig) {
        // Reach barrier
        ThisWorkerReady();

        // Get updated config
        G4AutoLock lock(&configMutex);
        workerConfig = config;
    }
};
```

## Integration with Other Classes

- **G4MTRunManager**: Uses barriers for run initialization and completion
- **G4WorkerRunManager**: Workers call ThisWorkerReady() at sync points
- **G4AutoLock**: Barrier uses G4AutoLock internally
- **G4Threading**: Uses G4Threading functions for thread identification

## Internal Implementation Details

### Private Members

```cpp
private:
    unsigned int m_numActiveThreads = 0;  // Expected worker count
    unsigned int m_counter = 0;           // Current ready workers
    G4Mutex m_mutex;                      // Protects counter
    G4Condition m_counterChanged;         // Master waits on this
    G4Condition m_continue;               // Workers wait on this
```

### Synchronization Protocol

The barrier uses two condition variables:
1. `m_counterChanged`: Master waits for counter to reach threshold
2. `m_continue`: Workers wait for master's signal to proceed

This two-condition design prevents race conditions and ensures proper synchronization.

## See Also

- G4Threading - Thread utilities and identification
- G4AutoLock - RAII mutex locking used internally
- G4MTRunManager - Uses barriers for run management
- G4WorkerRunManager - Worker-side barrier usage
- std::barrier (C++20) - Standard library equivalent

## Notes

1. **Not Reusable Immediately**: After release, barrier resets for next cycle
2. **Virtual Methods**: Override WaitForReadyWorkers() for custom behavior
3. **Exception Safety**: Consider exception handling in derived classes
4. **No Timeout**: Barrier waits indefinitely (no timeout mechanism)
5. **Single Master**: Designed for one master, multiple workers

## Authors

- Andrea Dotti (SLAC) - First Implementation (10 February 2016)
