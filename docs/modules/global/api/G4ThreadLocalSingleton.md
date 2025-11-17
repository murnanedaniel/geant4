# G4ThreadLocalSingleton

Thread-private singleton pattern implementation for creating separate instances per thread.

## Header

```cpp
#include "G4ThreadLocalSingleton.hh"
```

## Source Location

- Header: `source/global/management/include/G4ThreadLocalSingleton.hh`

## Overview

G4ThreadLocalSingleton implements a thread-private "singleton" pattern where each thread gets its own unique instance of a class. Despite the name, it's not a true singleton since multiple instances exist (one per thread), but from each thread's perspective, it appears as a singleton.

This pattern is essential in multi-threaded Geant4 for providing thread-local storage without explicit thread-local variables, while ensuring proper cleanup at application termination. The class manages instance lifetime automatically and prevents memory leaks.

## Class Template

```cpp
template <class T>
class G4ThreadLocalSingleton : private G4Cache<T*>
{
public:
    G4ThreadLocalSingleton();
    ~G4ThreadLocalSingleton() override;

    // Deleted copy, moveable
    G4ThreadLocalSingleton(const G4ThreadLocalSingleton&) = delete;
    G4ThreadLocalSingleton(G4ThreadLocalSingleton&&) = default;
    G4ThreadLocalSingleton& operator=(const G4ThreadLocalSingleton&) = delete;
    G4ThreadLocalSingleton& operator=(G4ThreadLocalSingleton&&) = default;

    T* Instance() const;  // Returns thread-private instance
};
```

## Template Parameters

- `T`: The class to make thread-local singleton (must have accessible constructor for friend class)

## Methods

### Constructor
```cpp
G4ThreadLocalSingleton()
```
Creates the singleton manager. Does not create instances yet (lazy initialization).

**Example:**
```cpp
class MyClass {
    friend class G4ThreadLocalSingleton<MyClass>;
private:
    MyClass() { /* initialization */ }
public:
    static MyClass* GetInstance() {
        static G4ThreadLocalSingleton<MyClass> instance;
        return instance.Instance();
    }
};
```

---

### Destructor
```cpp
~G4ThreadLocalSingleton() override
```
Deletes all thread-local instances created by this manager.

**Thread Safety:** Automatically handles cleanup

---

### Instance()
```cpp
T* Instance() const
```
Returns pointer to thread-private instance of `T`. Creates instance on first call per thread.

**Returns:** Pointer to thread-local instance

**Thread Safety:** Thread-safe (each thread gets its own instance)

**Lazy Initialization:** Instance created on first access per thread

**Example:**
```cpp
// In any thread
MyClass* ptr = MyClass::GetInstance();  // Gets thread-local instance
```

## Usage Pattern

### Basic Pattern

```cpp
class MyManager {
    friend class G4ThreadLocalSingleton<MyManager>;

private:
    MyManager() {
        // Private constructor
        InitializeThreadLocalData();
    }

public:
    static MyManager* GetInstance() {
        static G4ThreadLocalSingleton<MyManager> instance;
        return instance.Instance();
    }

    void DoWork() {
        // This operates on thread-local instance
        ProcessData();
    }
};
```

### Thread Usage

```cpp
void ThreadFunction() {
    // Each thread gets its own instance
    MyManager* mgr = MyManager::GetInstance();
    mgr->DoWork();  // Operates on thread-local data
}

void MasterThread() {
    MyManager* masterMgr = MyManager::GetInstance();
    // This is a DIFFERENT instance than worker threads
}

void WorkerThread() {
    MyManager* workerMgr = MyManager::GetInstance();
    // Each worker has DIFFERENT instance
}
```

## Complete Example

```cpp
// Header file
class EventProcessor {
    friend class G4ThreadLocalSingleton<EventProcessor>;

private:
    // Private constructor - only accessible via friend
    EventProcessor()
        : eventCount(0),
          threadId(G4Threading::G4GetThreadId())
    {
        G4cout << "EventProcessor created for thread "
               << threadId << G4endl;
    }

    // Private destructor
    ~EventProcessor() {
        G4cout << "EventProcessor destroyed for thread "
               << threadId << G4endl;
    }

    // Thread-local data
    int eventCount;
    int threadId;

public:
    static EventProcessor* GetInstance() {
        static G4ThreadLocalSingleton<EventProcessor> theInstance;
        return theInstance.Instance();
    }

    void ProcessEvent() {
        ++eventCount;
        G4cout << "Thread " << threadId
               << " processed " << eventCount
               << " events" << G4endl;
    }

    int GetEventCount() const { return eventCount; }
};

// Usage
void SimulateEvents() {
    // Each thread gets its own EventProcessor
    EventProcessor* processor = EventProcessor::GetInstance();

    for (int i = 0; i < 100; i++) {
        processor->ProcessEvent();
    }

    // Each thread reports its own count
    G4cout << "This thread processed: "
           << processor->GetEventCount()
           << " events" << G4endl;
}
```

## Threading Patterns

### Pattern 1: Thread-Local State Management

```cpp
class RunStatistics {
    friend class G4ThreadLocalSingleton<RunStatistics>;

private:
    RunStatistics() : totalEnergy(0), numParticles(0) {}

    double totalEnergy;
    long numParticles;

public:
    static RunStatistics* GetInstance() {
        static G4ThreadLocalSingleton<RunStatistics> instance;
        return instance.Instance();
    }

    void RecordParticle(double energy) {
        totalEnergy += energy;
        ++numParticles;
    }

    void Print() const {
        G4cout << "Thread " << G4Threading::G4GetThreadId()
               << ": Energy=" << totalEnergy
               << ", Particles=" << numParticles << G4endl;
    }
};
```

### Pattern 2: Thread-Local Random Number Generator

```cpp
class ThreadLocalRNG {
    friend class G4ThreadLocalSingleton<ThreadLocalRNG>;

private:
    ThreadLocalRNG() {
        // Seed with thread-specific value
        long seed = static_cast<long>(
            G4Threading::G4GetThreadId() * 1000 + time(nullptr)
        );
        rng.seed(seed);
    }

    std::mt19937 rng;

public:
    static ThreadLocalRNG* GetInstance() {
        static G4ThreadLocalSingleton<ThreadLocalRNG> instance;
        return instance.Instance();
    }

    double Uniform() {
        std::uniform_real_distribution<> dist(0.0, 1.0);
        return dist(rng);
    }
};
```

### Pattern 3: Thread-Local Resource Pool

```cpp
class MemoryPool {
    friend class G4ThreadLocalSingleton<MemoryPool>;

private:
    MemoryPool() : poolSize(1024) {
        buffer.resize(poolSize);
    }

    std::vector<char> buffer;
    size_t poolSize;

public:
    static MemoryPool* GetInstance() {
        static G4ThreadLocalSingleton<MemoryPool> instance;
        return instance.Instance();
    }

    void* Allocate(size_t size) {
        // Thread-local allocation
        // No synchronization needed
        return AllocateFromPool(size);
    }
};
```

### Pattern 4: Migration from G4ThreadLocal

```cpp
// OLD: Using G4ThreadLocal keyword
class OldSingleton {
private:
    static G4ThreadLocal OldSingleton* instance;
    OldSingleton() {}
public:
    static OldSingleton* GetInstance() {
        if (!instance) instance = new OldSingleton();  // Memory leak!
        return instance;
    }
};

// NEW: Using G4ThreadLocalSingleton
class NewSingleton {
    friend class G4ThreadLocalSingleton<NewSingleton>;
private:
    NewSingleton() {}
public:
    static NewSingleton* GetInstance() {
        static G4ThreadLocalSingleton<NewSingleton> instance;
        return instance.Instance();  // No memory leak!
    }
};
```

## Master vs Worker Thread Usage

### Different Instances Per Thread

```cpp
class ThreadSpecificData {
    friend class G4ThreadLocalSingleton<ThreadSpecificData>;
private:
    ThreadSpecificData()
        : threadId(G4Threading::G4GetThreadId()),
          isMaster(G4Threading::IsMasterThread()) {}

    int threadId;
    bool isMaster;

public:
    static ThreadSpecificData* GetInstance() {
        static G4ThreadLocalSingleton<ThreadSpecificData> instance;
        return instance.Instance();
    }

    void PrintInfo() {
        G4cout << (isMaster ? "Master" : "Worker")
               << " thread " << threadId << G4endl;
    }
};

// Usage
void MasterThread() {
    auto* data = ThreadSpecificData::GetInstance();
    data->PrintInfo();  // Prints: "Master thread -1"
}

void WorkerThread0() {
    auto* data = ThreadSpecificData::GetInstance();
    data->PrintInfo();  // Prints: "Worker thread 0"
}

void WorkerThread1() {
    auto* data = ThreadSpecificData::GetInstance();
    data->PrintInfo();  // Prints: "Worker thread 1"
}
```

### Aggregating Results from All Threads

```cpp
class ResultCollector {
    friend class G4ThreadLocalSingleton<ResultCollector>;
private:
    ResultCollector() : result(0) {}

    double result;
    static std::vector<ResultCollector*> allInstances;
    static G4Mutex collectorMutex;

public:
    static ResultCollector* GetInstance() {
        static G4ThreadLocalSingleton<ResultCollector> instance;
        auto* ptr = instance.Instance();

        // Register for aggregation
        G4AutoLock lock(&collectorMutex);
        if (std::find(allInstances.begin(), allInstances.end(), ptr)
            == allInstances.end()) {
            allInstances.push_back(ptr);
        }

        return ptr;
    }

    void AddResult(double val) {
        result += val;  // Thread-local, no lock needed
    }

    static double GetTotalResult() {
        G4AutoLock lock(&collectorMutex);
        double total = 0;
        for (auto* collector : allInstances) {
            total += collector->result;
        }
        return total;
    }
};
```

## Thread Safety Guarantees

### Thread-Safe Operations
- `Instance()` - Each thread accesses its own instance
- Constructor/Destructor - No sharing between threads
- Instance methods - Operate on thread-local data

### Synchronization
- **No Locks Needed**: Each thread has separate instance
- **Automatic Cleanup**: Destructor ensures proper cleanup
- **Race-Free**: No data races by design

### Important Notes
1. Class `T` should not contain `G4ThreadLocal` members (unnecessary)
2. Each thread's instance is completely independent
3. Cleanup is automatic - prevents memory leaks
4. Friend declaration required for private constructor access

## Performance Notes

### Advantages
- **No Synchronization Overhead**: No locks during normal operation
- **Cache-Friendly**: Each thread accesses its own data
- **Scalable**: Performance doesn't degrade with thread count

### Overhead
- **Memory**: One instance per thread (multiply by thread count)
- **Creation**: Lazy initialization on first `Instance()` call
- **Cleanup**: Automatic destruction at thread termination

### vs G4ThreadLocal

| Feature | G4ThreadLocal | G4ThreadLocalSingleton |
|---------|--------------|------------------------|
| Syntax | Keyword modifier | Template wrapper |
| Cleanup | Manual (leaks!) | Automatic |
| Initialization | Explicit | Lazy |
| Safety | Leak-prone | Leak-free |
| C++ Standard | Compiler extension | Standard C++11 |

## Common Pitfalls

### 1. Forgetting Friend Declaration

```cpp
// BAD - Constructor not accessible
class MyClass {
private:
    MyClass() {}  // No friend declaration!
public:
    static MyClass* GetInstance() {
        static G4ThreadLocalSingleton<MyClass> instance;
        return instance.Instance();  // ERROR: can't access constructor
    }
};

// GOOD
class MyClass {
    friend class G4ThreadLocalSingleton<MyClass>;  // ADD THIS
private:
    MyClass() {}
public:
    static MyClass* GetInstance() {
        static G4ThreadLocalSingleton<MyClass> instance;
        return instance.Instance();  // OK
    }
};
```

### 2. Using G4ThreadLocal Members

```cpp
// BAD - Unnecessary G4ThreadLocal
class MyClass {
    friend class G4ThreadLocalSingleton<MyClass>;
private:
    MyClass() {}
    G4ThreadLocal int value;  // UNNECESSARY - already thread-local
};

// GOOD - Simple member variable
class MyClass {
    friend class G4ThreadLocalSingleton<MyClass>;
private:
    MyClass() {}
    int value;  // Automatically thread-local because instance is
};
```

### 3. Expecting True Singleton Behavior

```cpp
// BAD - Expecting single instance
void BadFunction() {
    MyClass* instance1 = MyClass::GetInstance();
    instance1->SetValue(42);

    // In another thread
    MyClass* instance2 = MyClass::GetInstance();
    int val = instance2->GetValue();  // NOT 42! Different instance!
}

// GOOD - Understanding thread-local nature
void GoodFunction() {
    // Each thread gets its own instance
    MyClass* myInstance = MyClass::GetInstance();
    myInstance->SetValue(G4Threading::G4GetThreadId());

    // Value is preserved within same thread
    assert(myInstance->GetValue() == G4Threading::G4GetThreadId());
}
```

### 4. Premature Deletion

```cpp
// BAD - Manually deleting instance
void BadCleanup() {
    MyClass* instance = MyClass::GetInstance();
    delete instance;  // BAD! Managed by G4ThreadLocalSingleton
}

// GOOD - Let G4ThreadLocalSingleton handle cleanup
void GoodCleanup() {
    MyClass* instance = MyClass::GetInstance();
    // Just use it - cleanup is automatic
}
```

### 5. Sharing Pointers Between Threads

```cpp
// BAD - Sharing thread-local instance
MyClass* globalPtr = nullptr;

void Thread1() {
    globalPtr = MyClass::GetInstance();  // BAD!
}

void Thread2() {
    globalPtr->DoWork();  // WRONG THREAD'S INSTANCE!
}

// GOOD - Each thread gets its own
void Thread1() {
    MyClass* localPtr = MyClass::GetInstance();
    localPtr->DoWork();  // Correct instance
}

void Thread2() {
    MyClass* localPtr = MyClass::GetInstance();
    localPtr->DoWork();  // Different, correct instance
}
```

## Comparison to Alternatives

### vs Static Thread-Local

```cpp
// Using G4ThreadLocal keyword
class OldStyle {
public:
    static OldStyle* GetInstance() {
        static G4ThreadLocal OldStyle* instance = nullptr;
        if (!instance) instance = new OldStyle();  // LEAKS!
        return instance;
    }
};

// Using G4ThreadLocalSingleton
class NewStyle {
    friend class G4ThreadLocalSingleton<NewStyle>;
private:
    NewStyle() {}
public:
    static NewStyle* GetInstance() {
        static G4ThreadLocalSingleton<NewStyle> instance;
        return instance.Instance();  // NO LEAK
    }
};
```

### vs G4Cache

```cpp
// G4Cache: Requires manual management
class CacheStyle {
    static G4Cache<CacheStyle*> cache;
public:
    static CacheStyle* GetInstance() {
        if (cache.Get() == nullptr) {
            cache.Put(new CacheStyle());  // Must manage lifetime
        }
        return cache.Get();
    }
};

// G4ThreadLocalSingleton: Automatic management
class SingletonStyle {
    friend class G4ThreadLocalSingleton<SingletonStyle>;
private:
    SingletonStyle() {}
public:
    static SingletonStyle* GetInstance() {
        static G4ThreadLocalSingleton<SingletonStyle> instance;
        return instance.Instance();  // Automatic lifetime
    }
};
```

## Integration with Other Classes

- **G4Cache**: G4ThreadLocalSingleton inherits privately from G4Cache<T*>
- **G4AutoLock**: Uses G4AutoLock for thread-safe registration
- **G4AutoDelete**: Integrates with auto-deletion mechanism
- **G4MTRunManager**: Many Geant4 managers use this pattern

## Limitations

1. **No Cross-Thread Access**: Instance cannot be safely accessed from other threads
2. **Memory Overhead**: One instance per thread (scales with thread count)
3. **No Global State**: Can't share data between thread instances without external synchronization
4. **Constructor Requirements**: Class must have accessible constructor (via friend)

## Best Practices

1. **Use for Thread-Local State**: Random generators, statistics, caches
2. **Keep Friend Private**: Don't make constructor public
3. **Document Thread-Local Nature**: Clearly indicate in class documentation
4. **Avoid Shared Pointers**: Don't pass instances between threads
5. **Prefer Over G4ThreadLocal**: Better lifetime management

## See Also

- G4Cache - Lower-level thread-local storage
- G4Threading - Thread identification and utilities
- G4AutoLock - Thread-safe locking
- G4TWorkspacePool - Thread workspace management
- G4AutoDelete - Automatic object deletion

## Notes

1. **Memory Management**: Automatic cleanup prevents leaks
2. **Lazy Initialization**: Instance created on first access per thread
3. **Thread-Safe**: No synchronization needed for instance access
4. **Standard C++**: Uses only C++11 standard features
5. **Preferred Pattern**: Recommended over G4ThreadLocal for singletons

## Authors

- Andrea Dotti (SLAC) - First Implementation (28 October 2013)
