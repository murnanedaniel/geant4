# G4Threading

Comprehensive threading utilities and macros that expose the Geant4 multi-threading model.

## Header

```cpp
#include "G4Threading.hh"
```

## Source Location

- Header: `source/global/management/include/G4Threading.hh`

## Overview

G4Threading provides the foundational types, macros, and utility functions for Geant4's multi-threading capabilities. It abstracts platform-specific threading primitives using C++11 standard library threading, with special handling for both multi-threaded (`G4MULTITHREADED`) and sequential builds.

The file defines thread types, mutex types, condition variables, and provides essential functions for thread identification, core detection, and thread affinity management. In sequential builds, many threading operations become no-ops to maintain the same API without overhead.

## Type Definitions

### Thread Types

```cpp
// Multi-threaded build (when G4MULTITHREADED is defined)
using G4Thread = std::thread;
using G4NativeThread = std::thread::native_handle_type;
using G4ThreadId = std::thread::id;
using G4Pid_t = std::thread::id;

// Sequential build (when G4MULTITHREADED is NOT defined)
using G4Thread = G4DummyThread;          // Executes immediately
using G4NativeThread = G4DummyThread::native_handle_type;
using G4ThreadId = std::thread::id;
using G4Pid_t = G4int;
```

### Mutex Types

```cpp
using G4Mutex = std::mutex;
using G4RecursiveMutex = std::recursive_mutex;
```

Note: Mutexes are always C++11 standard types, but locking/unlocking behavior differs between builds.

### Future/Promise Types

```cpp
template<typename _Tp>
using G4Future = std::future<_Tp>;

template<typename _Tp>
using G4SharedFuture = std::shared_future<_Tp>;

template<typename _Tp>
using G4Promise = std::promise<_Tp>;
```

### Condition Variables

```cpp
// Multi-threaded only
using G4Condition = std::condition_variable;

// Sequential build
using G4Condition = G4int;  // Dummy type
```

### Function Pointer Types

```cpp
using G4ThreadFunReturnType = void*;
using G4ThreadFunArgType = void*;
using thread_lock = G4int (*)(G4Mutex*);
using thread_unlock = G4int (*)(G4Mutex*);
```

## Macros

### Thread Sleep

```cpp
G4THREADSLEEP(tick)
```
Puts the current thread to sleep for `tick` seconds.

**Example:**
```cpp
G4THREADSLEEP(1);  // Sleep for 1 second
```

### Mutex Operations

#### Multi-threaded Build

```cpp
G4MUTEXLOCK(mutex)      // Locks the mutex
G4MUTEXUNLOCK(mutex)    // Unlocks the mutex
G4MUTEXINIT(mutex)      // No-op (C++11 handles initialization)
G4MUTEXDESTROY(mutex)   // No-op (C++11 handles destruction)
```

#### Sequential Build

All mutex macros are no-ops:
```cpp
G4MUTEXLOCK(mutex)      // No-op
G4MUTEXUNLOCK(mutex)    // No-op
```

### Thread Operations

```cpp
// Create thread - works in both MT and sequential builds
template <typename _Worker, typename _Func, typename... _Args>
void G4THREADCREATE(_Worker*& worker, _Func func, _Args... args);

// Join thread
G4THREADJOIN(worker)
```

**Multi-threaded behavior:** Creates actual thread
**Sequential behavior:** Executes function immediately in `G4DummyThread` constructor

### Condition Variables (Multi-threaded only)

```cpp
G4CONDITION_INITIALIZER             // Initialize condition variable
G4CONDITIONWAIT(cond, lock)        // Wait on condition
G4CONDITIONWAITLAMBDA(cond, lock, lambda)  // Wait with predicate
G4CONDITIONNOTIFY(cond)            // Notify one waiting thread
G4CONDITIONBROADCAST(cond)         // Notify all waiting threads
```

**Sequential build:** All become no-ops or parameter consumers.

## Template Functions

### Type-Specific Mutexes

```cpp
template <typename _Tp>
G4Mutex& G4TypeMutex()
```
Returns a static mutex unique to type `_Tp`. Useful for template classes requiring type-specific locking.

**Example:**
```cpp
G4AutoLock l(G4TypeMutex<G4Cache<int>>());
// Locks mutex specific to G4Cache<int>
```

---

```cpp
template <typename _Tp>
G4RecursiveMutex& G4TypeRecursiveMutex()
```
Returns a static recursive mutex unique to type `_Tp`.

**Example:**
```cpp
G4RecursiveAutoLock l(G4TypeRecursiveMutex<MyClass>());
```

## G4DummyThread Class

A dummy thread implementation for sequential builds that mimics `std::thread` interface.

### Constructor

```cpp
G4DummyThread()                    // Does nothing
template <typename _Func, typename... _Args>
G4DummyThread(_Func func, _Args&&... _args)  // Executes func immediately
```

### Methods

```cpp
native_handle_type native_handle() const
bool joinable() const              // Always returns true
id get_id() const noexcept        // Returns this thread's ID
void swap(G4DummyThread&)         // No-op
void join()                        // No-op
void detach()                      // No-op
static unsigned int hardware_concurrency() noexcept
```

## G4ThisThread Namespace

```cpp
namespace G4ThisThread
{
    using namespace std::this_thread;
    // Provides: get_id(), sleep_for(), sleep_until(), yield()
}
```

Access current thread utilities via `G4ThisThread::get_id()`, etc.

## G4Threading Namespace

### Thread ID Constants

```cpp
enum
{
    SEQUENTIAL_ID    = -2,
    MASTER_ID        = -1,
    WORKER_ID        = 0,
    GENERICTHREAD_ID = -1000
};
```

### Functions

#### G4GetPidId()
```cpp
G4Pid_t G4GetPidId()
```
Returns the process/thread ID.

**Returns:** Platform-specific thread identifier

---

#### G4GetNumberOfCores()
```cpp
G4int G4GetNumberOfCores()
```
Returns the number of available CPU cores.

**Returns:** Number of hardware threads (logical cores)

**Example:**
```cpp
G4int ncores = G4Threading::G4GetNumberOfCores();
std::cout << "Available cores: " << ncores << std::endl;
```

---

#### G4GetThreadId()
```cpp
G4int G4GetThreadId()
```
Returns the Geant4 thread ID for the current thread.

**Returns:**
- `MASTER_ID` (-1) for master thread
- `0, 1, 2, ...` for worker threads
- `SEQUENTIAL_ID` (-2) for sequential builds

**Thread Safety:** Thread-local

**Example:**
```cpp
G4int tid = G4Threading::G4GetThreadId();
if (tid == G4Threading::MASTER_ID) {
    std::cout << "Running on master thread" << std::endl;
} else {
    std::cout << "Running on worker thread " << tid << std::endl;
}
```

---

#### IsWorkerThread()
```cpp
G4bool IsWorkerThread()
```
Checks if the current thread is a worker thread.

**Returns:** `true` if worker thread, `false` otherwise

**Example:**
```cpp
if (G4Threading::IsWorkerThread()) {
    // Worker-specific code
    ProcessEvent();
}
```

---

#### IsMasterThread()
```cpp
G4bool IsMasterThread()
```
Checks if the current thread is the master thread.

**Returns:** `true` if master thread, `false` otherwise

**Example:**
```cpp
if (G4Threading::IsMasterThread()) {
    // Master-only operations
    InitializeGeometry();
}
```

---

#### G4SetThreadId()
```cpp
void G4SetThreadId(G4int aNewValue)
```
Sets the Geant4 thread ID for the current thread.

**Parameters:**
- `aNewValue`: Thread ID to set (typically MASTER_ID or worker index)

**Thread Safety:** Thread-local operation

---

#### G4SetPinAffinity()
```cpp
G4bool G4SetPinAffinity(G4int idx, G4NativeThread& at)
```
Sets CPU affinity for a thread (pins thread to specific core).

**Parameters:**
- `idx`: Core index to pin to
- `at`: Native thread handle

**Returns:** `true` if affinity was set successfully, `false` otherwise

**Platform Support:** Linux only (returns false on other platforms)

---

#### SetMultithreadedApplication()
```cpp
void SetMultithreadedApplication(G4bool value)
```
Sets the global flag indicating whether application runs in MT mode.

**Parameters:**
- `value`: `true` for multi-threaded, `false` for sequential

---

#### IsMultithreadedApplication()
```cpp
G4bool IsMultithreadedApplication()
```
Checks if the application is running in multi-threaded mode.

**Returns:** `true` if MT mode enabled, `false` otherwise

**Example:**
```cpp
if (G4Threading::IsMultithreadedApplication()) {
    G4cout << "Running in MT mode" << G4endl;
}
```

---

#### WorkerThreadLeavesPool()
```cpp
G4int WorkerThreadLeavesPool()
```
Decrements the count of active worker threads.

**Returns:** Updated count of running worker threads

---

#### WorkerThreadJoinsPool()
```cpp
G4int WorkerThreadJoinsPool()
```
Increments the count of active worker threads.

**Returns:** Updated count of running worker threads

---

#### GetNumberOfRunningWorkerThreads()
```cpp
G4int GetNumberOfRunningWorkerThreads()
```
Gets the current number of running worker threads.

**Returns:** Count of active worker threads

## Threading Patterns

### Pattern 1: Thread-Safe Singleton Access

```cpp
class MyManager {
    static MyManager* GetInstance() {
        static G4Mutex mutex;
        G4AutoLock lock(&mutex);

        if (!instance) {
            instance = new MyManager();
        }
        return instance;
    }

private:
    static MyManager* instance;
};
```

### Pattern 2: Master vs Worker Differentiation

```cpp
void ProcessData() {
    if (G4Threading::IsMasterThread()) {
        // Master thread initializes shared data
        InitializeSharedData();
    } else if (G4Threading::IsWorkerThread()) {
        // Worker threads process events
        ProcessEvent();
    }
}
```

### Pattern 3: Portable Thread Creation

```cpp
G4Thread* worker = nullptr;
G4THREADCREATE(&worker, &MyFunction, arg1, arg2);
// worker points to thread (MT) or executed immediately (sequential)

if (worker) {
    G4THREADJOIN(*worker);
    delete worker;
}
```

### Pattern 4: Type-Specific Locking

```cpp
template<typename T>
class ThreadSafeCache {
    void Insert(const T& value) {
        G4AutoLock lock(G4TypeMutex<ThreadSafeCache<T>>());
        data.push_back(value);
    }

private:
    std::vector<T> data;
};
```

## Master vs Worker Thread Usage

### Master Thread Responsibilities
- Initialize geometry and physics
- Create and manage worker threads
- Coordinate synchronization points
- Aggregate results from workers
- Handle UI commands

### Worker Thread Responsibilities
- Process events independently
- Use thread-local data
- Synchronize at barriers
- Report results to master

### Example Usage

```cpp
void MyRunManager::Initialize() {
    if (G4Threading::IsMasterThread()) {
        // Master initializes shared resources
        BuildGeometry();
        BuildPhysics();
        CreateWorkers(G4Threading::G4GetNumberOfCores());
    }
}

void MyRunManager::ProcessEvent() {
    if (G4Threading::IsWorkerThread()) {
        G4int tid = G4Threading::G4GetThreadId();
        // Each worker processes its events
        ProcessEventForThread(tid);
    }
}
```

## Thread Safety Guarantees

### Thread-Safe Operations
- `G4GetThreadId()` - Thread-local storage
- `G4GetNumberOfCores()` - Const operation
- `IsWorkerThread()`, `IsMasterThread()` - Thread-local
- `G4TypeMutex<T>()` - Returns static per-type mutex

### NOT Thread-Safe (Requires External Synchronization)
- Global state modifications
- Shared data structure access
- Static variable modifications without mutexes

### Sequential Build Behavior
In sequential builds, all mutex operations are no-ops, eliminating overhead while maintaining API compatibility.

## Performance Notes

### Multi-threaded Builds
- Minimal overhead from std::mutex and std::thread
- Type-specific mutexes (G4TypeMutex) avoid global contention
- Proper affinity can improve cache performance
- Number of threads should typically match core count

### Sequential Builds
- Zero overhead from mutex operations (compiled out)
- G4DummyThread executes immediately
- No synchronization overhead

### Best Practices
1. Use `G4GetNumberOfCores()` to determine optimal thread count
2. Set thread affinity on NUMA systems for better performance
3. Minimize lock contention by using type-specific mutexes
4. Prefer G4AutoLock over manual lock/unlock
5. Keep critical sections as short as possible

## Common Pitfalls

### 1. Forgetting Sequential Build Support
```cpp
// BAD - assumes MT build
#ifdef G4MULTITHREADED
    G4AutoLock lock(&myMutex);
#endif

// GOOD - works in both builds
G4AutoLock lock(&myMutex);
```

### 2. Incorrect Thread ID Checks
```cpp
// BAD - doesn't handle sequential build
if (G4GetThreadId() >= 0) { /* worker */ }

// GOOD
if (G4Threading::IsWorkerThread()) { /* worker */ }
```

### 3. Static Initialization Race
```cpp
// BAD - potential race condition
static SomeClass* instance = nullptr;
if (!instance) instance = new SomeClass();

// GOOD - use mutex
static G4Mutex mutex;
G4AutoLock lock(&mutex);
if (!instance) instance = new SomeClass();
```

## Integration with Other Classes

- **G4AutoLock**: RAII wrapper for G4Mutex
- **G4MTBarrier**: Synchronization between master and workers
- **G4ThreadLocalSingleton**: Thread-private singletons
- **G4TWorkspacePool**: Thread-specific workspace management
- **G4ThreadPool**: Task-based parallelism

## Notes

1. **Build Configuration**: Behavior changes significantly based on `G4MULTITHREADED` definition
2. **C++11 Standard**: Uses only standard C++11 threading primitives
3. **Platform Independence**: Abstracts platform-specific details
4. **Backward Compatibility**: Maintains API compatibility between MT and sequential builds
5. **Future-Ready**: Includes promise/future types for potential task-based migration

## See Also

- G4AutoLock - RAII mutex locking
- G4MTBarrier - Thread synchronization
- G4ThreadLocalSingleton - Thread-local singletons
- G4MTRunManager - Multi-threaded run manager
- G4WorkerThread - Worker thread implementation

## Authors

- Andrea Dotti (SLAC) - First Implementation (15 February 2013)
- Jonathan R. Madsen - Revision (21 February 2018)
