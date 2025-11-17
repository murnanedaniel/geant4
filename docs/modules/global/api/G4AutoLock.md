# G4AutoLock

RAII (Resource Acquisition Is Initialization) wrapper for automatic mutex locking and unlocking.

## Header

```cpp
#include "G4AutoLock.hh"
```

## Source Location

- Header: `source/global/management/include/G4AutoLock.hh`

## Overview

G4AutoLock provides automatic mutex management using the RAII pattern. It inherits from `std::unique_lock` to provide standard C++11 lock functionality while adding Geant4-specific features. The lock is automatically acquired in the constructor and released in the destructor, preventing common mutex management errors.

In multi-threaded builds, G4AutoLock provides full locking functionality. In sequential builds, it becomes a no-op wrapper that compiles to near-zero overhead while maintaining API compatibility.

**Key Feature:** Protects against mutex lock failures during application termination when static mutexes may be destroyed before objects using them.

## Class Hierarchy

```
std::unique_lock<_Mutex_t>
    └── G4TemplateAutoLock<_Mutex_t>
            ├── G4AutoLock (alias for G4Mutex)
            ├── G4RecursiveAutoLock (alias for G4RecursiveMutex)
            └── G4TAutoLock<_Tp> (custom mutex type)
```

## Type Definitions

```cpp
using G4AutoLock = G4TemplateAutoLock<G4Mutex>;
using G4RecursiveAutoLock = G4TemplateAutoLock<G4RecursiveMutex>;

template <typename _Tp>
using G4TAutoLock = G4TemplateAutoLock<_Tp>;
```

## G4TemplateAutoLock Class

Template class providing RAII mutex locking for any mutex type.

### Template Parameters

- `_Mutex_t`: Mutex type (typically `G4Mutex` or `G4RecursiveMutex`)

### Type Aliases

```cpp
using unique_lock_t = std::unique_lock<_Mutex_t>;
using this_type = G4TemplateAutoLock<_Mutex_t>;
using mutex_type = typename unique_lock_t::mutex_type;
```

## Constructors

### Standard Reference Form

#### Basic Locking Constructor
```cpp
G4TemplateAutoLock(mutex_type& _mutex)
```
Locks the mutex immediately. The behavior is undefined if the current thread already owns the mutex (except for recursive mutexes).

**Parameters:**
- `_mutex`: Reference to mutex to lock

**Example:**
```cpp
G4Mutex myMutex;
{
    G4AutoLock lock(myMutex);
    // Critical section - mutex is locked
    ModifySharedData();
} // Mutex automatically unlocked here
```

---

#### Timeout Duration Constructor
```cpp
template <typename Rep, typename Period>
G4TemplateAutoLock(mutex_type& _mutex,
                   const std::chrono::duration<Rep, Period>& _timeout_duration)
```
Tries to lock the mutex, blocking for up to `_timeout_duration`.

**Parameters:**
- `_mutex`: Reference to mutex to lock
- `_timeout_duration`: Maximum time to wait for lock

**Example:**
```cpp
G4Mutex myMutex;
G4AutoLock lock(myMutex, std::chrono::milliseconds(100));
if (lock.owns_lock()) {
    // Got the lock
} else {
    // Timeout - didn't get lock
}
```

---

#### Timeout Time Point Constructor
```cpp
template <typename Clock, typename Duration>
G4TemplateAutoLock(mutex_type& _mutex,
                   const std::chrono::time_point<Clock, Duration>& _timeout_time)
```
Tries to lock the mutex until `_timeout_time` is reached.

**Parameters:**
- `_mutex`: Reference to mutex to lock
- `_timeout_time`: Absolute time point to wait until

---

#### Deferred Lock Constructor
```cpp
G4TemplateAutoLock(mutex_type& _mutex, std::defer_lock_t _lock) noexcept
```
Creates lock without locking the mutex. Lock must be acquired manually.

**Parameters:**
- `_mutex`: Reference to mutex (not locked)
- `_lock`: `std::defer_lock` tag

**Example:**
```cpp
G4Mutex mutex1, mutex2;
G4AutoLock lock1(mutex1, std::defer_lock);
G4AutoLock lock2(mutex2, std::defer_lock);
std::lock(lock1, lock2);  // Lock both without deadlock
```

---

#### Try Lock Constructor (Multi-threaded only)
```cpp
G4TemplateAutoLock(mutex_type& _mutex, std::try_to_lock_t _lock)
```
Attempts to lock without blocking.

**Parameters:**
- `_mutex`: Reference to mutex
- `_lock`: `std::try_to_lock` tag

**Multi-threaded:** Tries to acquire lock
**Sequential:** Initializes with deferred lock (no-op)

**Example:**
```cpp
G4Mutex myMutex;
G4AutoLock lock(myMutex, std::try_to_lock);
if (lock.owns_lock()) {
    // Successfully acquired lock
    DoWork();
}
```

---

#### Adopt Lock Constructor (Multi-threaded only)
```cpp
G4TemplateAutoLock(mutex_type& _mutex, std::adopt_lock_t _lock)
```
Assumes the calling thread already owns the mutex.

**Parameters:**
- `_mutex`: Reference to already-locked mutex
- `_lock`: `std::adopt_lock` tag

**Multi-threaded:** Adopts ownership
**Sequential:** Initializes with deferred lock (no-op)

### Pointer Form Constructors

Backward-compatible versions that take mutex pointer:

```cpp
G4TemplateAutoLock(mutex_type* _mutex)
G4TemplateAutoLock(mutex_type* _mutex, std::defer_lock_t _lock)
G4TemplateAutoLock(mutex_type* _mutex, std::try_to_lock_t _lock)  // MT only
G4TemplateAutoLock(mutex_type* _mutex, std::adopt_lock_t _lock)   // MT only
```

**Example:**
```cpp
static G4Mutex aMutex;
G4AutoLock lock(&aMutex);  // Pointer form
```

## Methods

### Inherited from std::unique_lock

All methods from `std::unique_lock` are available:

```cpp
void lock()                          // Lock the mutex
void unlock()                        // Unlock the mutex
bool try_lock()                      // Try to lock without blocking

template <typename Rep, typename Period>
bool try_lock_for(const std::chrono::duration<Rep,Period>&)

template <typename Clock, typename Duration>
bool try_lock_until(const std::chrono::time_point<Clock,Duration>&)

void swap(unique_lock& other) noexcept
mutex_type* release() noexcept      // Release ownership without unlocking
mutex_type* mutex() const noexcept  // Get pointer to mutex
bool owns_lock() const noexcept     // Check if lock owns the mutex
explicit operator bool() const noexcept  // Same as owns_lock()
```

### Sequential Build Overrides

In sequential builds, the following methods are overridden to be no-ops:

```cpp
void lock()                         // No-op
void unlock()                       // No-op
bool try_lock()                     // Returns true
bool try_lock_for(...)              // Returns true
bool try_lock_until(...)            // Returns true
void swap(this_type& other)         // Swaps lock objects
bool owns_lock() const              // Returns false
```

## Threading Patterns

### Pattern 1: Basic Critical Section

```cpp
static G4Mutex dataMutex;

void UpdateSharedData(int value) {
    G4AutoLock lock(&dataMutex);
    sharedData = value;
    // Lock automatically released when lock goes out of scope
}
```

### Pattern 2: Scoped Locking

```cpp
void ProcessData() {
    // Non-critical code here

    {
        G4AutoLock lock(&myMutex);
        // Critical section
        ModifySharedState();
    } // Lock released here

    // More non-critical code
}
```

### Pattern 3: Conditional Locking

```cpp
void ConditionalUpdate(bool needLock) {
    G4Mutex myMutex;
    G4AutoLock lock(myMutex, std::defer_lock);

    if (needLock) {
        lock.lock();
    }

    UpdateData();
    // Lock auto-unlocks if it was locked
}
```

### Pattern 4: Type-Specific Mutex

```cpp
template<typename T>
class ThreadSafeCache {
    void Add(const T& item) {
        G4AutoLock lock(G4TypeMutex<ThreadSafeCache<T>>());
        cache.push_back(item);
    }

private:
    std::vector<T> cache;
};
```

### Pattern 5: Recursive Locking

```cpp
static G4RecursiveMutex recursiveMutex;

void FunctionA() {
    G4RecursiveAutoLock lock(&recursiveMutex);
    // Do work
    FunctionB();  // Can safely call B
}

void FunctionB() {
    G4RecursiveAutoLock lock(&recursiveMutex);  // Won't deadlock
    // Do more work
}
```

### Pattern 6: Try-Lock Pattern

```cpp
void TryProcess() {
    static G4Mutex mutex;
    G4AutoLock lock(mutex, std::try_to_lock);

    if (lock.owns_lock()) {
        // Got the lock - do exclusive work
        ProcessExclusively();
    } else {
        // Couldn't get lock - do alternative work
        ProcessNonExclusively();
    }
}
```

### Pattern 7: Deadlock Prevention

```cpp
void TransferData(Resource& from, Resource& to) {
    // Always lock in same order to prevent deadlock
    G4Mutex& mutex1 = (&from < &to) ? from.mutex : to.mutex;
    G4Mutex& mutex2 = (&from < &to) ? to.mutex : from.mutex;

    G4AutoLock lock1(mutex1);
    G4AutoLock lock2(mutex2);

    from.transfer(to);
}

// Or use std::lock for simultaneous locking:
void TransferDataSafe(Resource& from, Resource& to) {
    G4AutoLock lock1(from.mutex, std::defer_lock);
    G4AutoLock lock2(to.mutex, std::defer_lock);
    std::lock(lock1, lock2);  // Locks both atomically

    from.transfer(to);
}
```

## Master vs Worker Thread Usage

### Master Thread Usage

```cpp
void InitializeDetector() {
    if (G4Threading::IsMasterThread()) {
        static G4Mutex initMutex;
        G4AutoLock lock(&initMutex);

        // Initialize shared geometry
        BuildGeometry();
    }
}
```

### Worker Thread Usage

```cpp
void ProcessEvent() {
    if (G4Threading::IsWorkerThread()) {
        static G4Mutex resultsMutex;

        // Process event (thread-local)
        auto result = SimulateEvent();

        // Lock only when updating shared results
        {
            G4AutoLock lock(&resultsMutex);
            globalResults.Add(result);
        }
    }
}
```

### Both Threads

```cpp
void LogMessage(const G4String& msg) {
    static G4Mutex logMutex;
    G4AutoLock lock(&logMutex);

    // Safe from both master and worker threads
    std::cout << "[Thread " << G4Threading::G4GetThreadId()
              << "] " << msg << std::endl;
}
```

## Thread Safety Guarantees

### Thread-Safe Operations
- Constructor (acquires lock)
- Destructor (releases lock if owned)
- All member functions (operate on thread-local object)

### Important Notes
1. **Not Copyable**: G4AutoLock cannot be copied (inherits from std::unique_lock)
2. **Moveable**: G4AutoLock can be moved (default move semantics)
3. **Not Shareable**: Each G4AutoLock instance is thread-local
4. **Exception Safety**: Lock is released even if exception is thrown

### Deadlock Prevention

```cpp
// BAD - Potential deadlock
void BadFunction() {
    G4AutoLock lock1(&mutex1);
    G4AutoLock lock2(&mutex2);  // If another thread locks in opposite order
}

// GOOD - Use std::lock for multiple mutexes
void GoodFunction() {
    G4AutoLock lock1(mutex1, std::defer_lock);
    G4AutoLock lock2(mutex2, std::defer_lock);
    std::lock(lock1, lock2);  // Deadlock-free
}
```

## Performance Notes

### Multi-threaded Build
- Minimal overhead (same as std::unique_lock)
- Includes protection against termination-time mutex failures
- Try-catch block in lock methods adds small overhead for safety

### Sequential Build
- Near-zero overhead (methods compile to no-ops)
- Maintains API compatibility
- Does not actually lock/unlock mutexes

### Best Practices
1. Keep critical sections as short as possible
2. Use scoped blocks `{}` to limit lock lifetime
3. Prefer G4AutoLock over manual lock/unlock
4. Use recursive mutexes only when necessary (higher overhead)
5. Consider lock-free alternatives for high-contention scenarios

## Comparison: G4AutoLock vs G4RecursiveAutoLock

| Feature | G4AutoLock | G4RecursiveAutoLock |
|---------|-----------|---------------------|
| Mutex Type | G4Mutex (non-recursive) | G4RecursiveMutex |
| Re-entrant | No - deadlocks | Yes - can lock multiple times |
| Performance | Faster | Slower (tracks recursion depth) |
| Use Case | Most situations | Recursive function calls |
| Memory | Less | More (recursion counter) |

**Example showing difference:**

```cpp
// G4AutoLock - DEADLOCK!
static G4Mutex mutex;
void FuncA() {
    G4AutoLock lock(&mutex);
    FuncB();  // Deadlock here!
}
void FuncB() {
    G4AutoLock lock(&mutex);  // Can't acquire - already locked
}

// G4RecursiveAutoLock - OK
static G4RecursiveMutex recursiveMutex;
void FuncA() {
    G4RecursiveAutoLock lock(&recursiveMutex);
    FuncB();  // OK!
}
void FuncB() {
    G4RecursiveAutoLock lock(&recursiveMutex);  // OK - same thread
}
```

## Special Behavior: Termination Safety

G4AutoLock includes special handling for mutex lock failures during application termination:

```cpp
// When a static mutex is destroyed before an object using it:
void _lock_deferred() {
    try {
        this->unique_lock_t::lock();
    } catch(std::system_error& e) {
        // Non-fatal error logged in debug builds
        // Prevents termination crash from mutex use-after-free
        PrintLockErrorMessage(e);
    }
}
```

This prevents crashes when:
1. Static mutex is destroyed during shutdown
2. Object destructor tries to lock destroyed mutex
3. Would normally throw std::system_error and terminate

## Polymorphic Behavior Warning

G4AutoLock methods are **not virtual**. When passed as `std::unique_lock`, sequential build optimizations are lost:

```cpp
void AcceptsStdLock(std::unique_lock<std::mutex>* lock) {
    lock->lock();  // Actually locks even in sequential build!
}

void Example() {
    G4Mutex mutex;
    G4AutoLock lock(mutex, std::defer_lock);

    lock.lock();              // No-op in sequential build
    AcceptsStdLock(&lock);    // LOCKS in sequential build (not virtual)
}
```

**Workaround:** Accept G4AutoLock directly, not std::unique_lock.

## Common Pitfalls

### 1. Locking Same Mutex Twice (Non-Recursive)

```cpp
// BAD - Deadlock
static G4Mutex mutex;
void Outer() {
    G4AutoLock lock(&mutex);
    Inner();  // Deadlock!
}
void Inner() {
    G4AutoLock lock(&mutex);  // Same thread, same mutex - DEADLOCK
}

// GOOD - Use recursive mutex
static G4RecursiveMutex mutex;
void Outer() {
    G4RecursiveAutoLock lock(&mutex);
    Inner();  // OK
}
void Inner() {
    G4RecursiveAutoLock lock(&mutex);  // OK
}
```

### 2. Destroying Mutex Before Lock

```cpp
// BAD - Undefined behavior
void BadFunction() {
    G4Mutex* mutex = new G4Mutex();
    G4AutoLock lock(mutex);
    delete mutex;  // BAD - lock still owns mutex!
}

// GOOD
void GoodFunction() {
    G4Mutex mutex;
    {
        G4AutoLock lock(mutex);
        // Use lock
    } // Lock destroyed first
    // mutex destroyed second
}
```

### 3. Forgetting Sequential Build

```cpp
// BAD - Doesn't work in sequential build
#ifdef G4MULTITHREADED
    G4AutoLock lock(&mutex);
#endif
ModifyData();  // Unprotected in sequential build!

// GOOD - Works in both builds
G4AutoLock lock(&mutex);  // No-op in sequential, real lock in MT
ModifyData();
```

### 4. Holding Lock Too Long

```cpp
// BAD - Lock held during I/O
void BadFunction() {
    G4AutoLock lock(&mutex);
    ModifyData();
    WriteToFile();  // Slow I/O while holding lock!
}

// GOOD - Minimize critical section
void GoodFunction() {
    DataCopy copy;
    {
        G4AutoLock lock(&mutex);
        copy = data;
    } // Release lock before I/O
    WriteToFile(copy);
}
```

## Integration with Other Classes

- **G4Threading**: Provides G4Mutex and G4RecursiveMutex types
- **G4MTBarrier**: Uses G4AutoLock internally for synchronization
- **G4ThreadLocalSingleton**: Uses G4AutoLock for thread-safe initialization
- **G4Cache**: Often protected with G4AutoLock
- **Run Managers**: Use G4AutoLock for state management

## Notes

1. **RAII Pattern**: Guarantees mutex release even with exceptions
2. **Exception Safe**: Lock released in destructor
3. **Build Aware**: Behavior adapts to MT vs sequential build
4. **Standard Compatible**: Inherits std::unique_lock interface
5. **Termination Safe**: Handles mutex destruction gracefully

## See Also

- G4Threading - Threading utilities and mutex types
- G4MTBarrier - Thread synchronization barrier
- G4RecursiveAutoLock - Recursive mutex locking
- G4TypeMutex - Type-specific mutex generation
- std::unique_lock - C++ standard lock wrapper

## Authors

- Andrea Dotti (SLAC) - First Implementation (15 February 2013)
- Jonathan R. Madsen - Major Revision using std::unique_lock (9 February 2018)
