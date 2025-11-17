# G4AllocatorList

## Overview

`G4AllocatorList` is a **thread-local singleton registry** that manages all `G4Allocator` instances within a thread. It provides centralized control for allocator lifecycle management, memory reporting, and cleanup. This class is essential for proper resource management in multi-threaded Geant4 simulations.

**Source Locations:**
- Header: `/source/global/management/include/G4AllocatorList.hh`
- Implementation: `/source/global/management/src/G4AllocatorList.cc`
- Authors: M.Asai (SLAC), G.Cosmo (CERN), June 2013

## Key Features

- **Thread-Local Singleton**: Separate instance per thread for thread safety
- **Automatic Registration**: Allocators register themselves automatically
- **Memory Reporting**: Query total memory usage across all allocators
- **Centralized Cleanup**: Destroy all allocators in proper order
- **Memory Statistics**: Detailed per-allocator and aggregate statistics

## Class Design

### Singleton Pattern

```cpp
class G4AllocatorList {
public:
    static G4AllocatorList* GetAllocatorList();
    static G4AllocatorList* GetAllocatorListIfExist();

private:
    G4AllocatorList() = default;  // Private constructor
    static G4ThreadLocal G4AllocatorList* fAllocatorList;
    std::vector<G4AllocatorBase*> fList;
};
```

**Design Notes:**
- **Private constructor**: Prevents direct instantiation
- **Static factory methods**: Control instance creation
- **Thread-local storage**: One instance per thread via `G4ThreadLocal`
- **Polymorphic storage**: Uses `G4AllocatorBase*` for type erasure

## API Reference

### Static Factory Methods

#### GetAllocatorList
```cpp
static G4AllocatorList* GetAllocatorList();
```
Returns the allocator list for the current thread, creating it if necessary.

**Returns:** Pointer to thread-local `G4AllocatorList` instance

**Thread Safety:** Thread-safe - each thread gets its own instance

**Implementation:**
```cpp
G4AllocatorList* G4AllocatorList::GetAllocatorList() {
    if (fAllocatorList == nullptr) {
        fAllocatorList = new G4AllocatorList;
    }
    return fAllocatorList;
}
```

**Usage:**
```cpp
G4AllocatorList* list = G4AllocatorList::GetAllocatorList();
list->Register(myAllocator);
```

#### GetAllocatorListIfExist
```cpp
static G4AllocatorList* GetAllocatorListIfExist();
```
Returns the allocator list if it exists, `nullptr` otherwise.

**Returns:** Pointer to thread-local instance or `nullptr`

**Use Case:** Check if list exists without creating it

**Example:**
```cpp
G4AllocatorList* list = G4AllocatorList::GetAllocatorListIfExist();
if (list != nullptr) {
    list->Report();  // Safe - list exists
}
```

### Instance Methods

#### Register
```cpp
void Register(G4AllocatorBase* alloc);
```
Registers an allocator with the list.

**Parameters:**
- `alloc`: Pointer to allocator to register (must not be `nullptr`)

**Behavior:**
- Adds allocator to internal vector
- Allocator will be managed by this list
- Called automatically by `G4Allocator` constructor

**Example:**
```cpp
G4Allocator<MyClass>* allocator = new G4Allocator<MyClass>;
G4AllocatorList::GetAllocatorList()->Register(allocator);
```

**Note:** Typically called automatically, not manually.

#### Destroy
```cpp
void Destroy(G4int nStat = 0, G4int verboseLevel = 0);
```
Destroys registered allocators and frees their memory.

**Parameters:**
- `nStat`: Number of static allocators to preserve (default: 0)
- `verboseLevel`: Verbosity level for output (0=quiet, 1=summary, 2=detailed)

**Behavior:**
1. Iterates through all registered allocators
2. First `nStat` allocators: `ResetStorage()` only (preserved)
3. Remaining allocators: `ResetStorage()` + `delete` (destroyed)
4. Clears the allocator list

**Output (verboseLevel > 0):**
```
================== Deleting memory pools ===================
Pool ID 'G4Track', size : 1.234 MB
Pool ID 'G4Step', size : 0.567 MB
...
Number of memory pools allocated: 15; of which, static: 3
Dynamic pools deleted: 12 / Total memory freed: 25.67 MB
============================================================
```

**Usage:**
```cpp
// At end of run - destroy dynamic allocators, keep static ones
G4AllocatorList::GetAllocatorList()->Destroy(3, 1);

// Complete cleanup - destroy all
G4AllocatorList::GetAllocatorList()->Destroy(0, 2);
```

#### Report
```cpp
void Report(G4bool itemize = true) const;
```
Reports memory usage for all registered allocators.

**Parameters:**
- `itemize`: If `true`, show per-allocator details; if `false`, show summary only

**Output Format:**
```
================== Current memory pools ===================
Pool ID 'G4Track', size : 2.345 MB
Pool ID 'G4Step', size : 1.234 MB
Pool ID 'G4StepPoint', size : 0.678 MB
...
Number of memory pools allocated: 15
Dynamic pools : 15 / Total memory : 12.45 MB
============================================================
```

**Usage:**
```cpp
// Detailed report
G4AllocatorList::GetAllocatorList()->Report(true);

// Summary only
G4AllocatorList::GetAllocatorList()->Report(false);
```

#### Size
```cpp
inline std::size_t Size() const;
```
Returns the number of registered allocators.

**Returns:** Number of allocators in the list

**Example:**
```cpp
std::size_t numAllocators = G4AllocatorList::GetAllocatorList()->Size();
std::cout << "Active allocators: " << numAllocators << "\n";
```

### Destructor

#### ~G4AllocatorList
```cpp
~G4AllocatorList();
```
Destructor sets thread-local pointer to `nullptr`.

**Note:** Does **not** destroy registered allocators. Call `Destroy()` explicitly before destruction.

## Memory Management Lifecycle

### Registration Phase (Initialization)

```
Program Start
    ↓
Thread Created
    ↓
First G4Allocator<Type> instantiated
    ↓
G4AllocatorList::GetAllocatorList() called
    ↓
Create thread-local G4AllocatorList instance
    ↓
Register allocator in list
    ↓
More allocators created and registered...
```

### Active Phase (Simulation)

```
During Simulation:
- Allocators allocate/free objects
- G4AllocatorList passively holds references
- Can call Report() to monitor memory usage
```

### Cleanup Phase (Shutdown)

```
End of Run / Program Exit
    ↓
G4AllocatorList::Destroy() called
    ↓
For each allocator:
    ├─ Static (i < nStat): ResetStorage() only
    └─ Dynamic (i >= nStat): ResetStorage() + delete
    ↓
fList.clear()
    ↓
Thread Exit
    ↓
~G4AllocatorList() called
    ↓
fAllocatorList = nullptr
```

## Thread Safety

### Thread-Local Storage

```cpp
G4ThreadLocal static G4AllocatorList* G4AllocatorList::fAllocatorList = nullptr;
```

**Implications:**
- Each thread has its own `G4AllocatorList` instance
- No sharing of allocator lists between threads
- Thread-safe by isolation (no synchronization needed)

### Per-Thread Isolation

```
Thread 1:                    Thread 2:
┌─────────────────┐         ┌─────────────────┐
│ G4AllocatorList │         │ G4AllocatorList │
├─────────────────┤         ├─────────────────┤
│ fList:          │         │ fList:          │
│  - Allocator A1 │         │  - Allocator A2 │
│  - Allocator B1 │         │  - Allocator B2 │
│  - Allocator C1 │         │  - Allocator C2 │
└─────────────────┘         └─────────────────┘
    Independent                Independent
```

**Key Point:** Allocators in Thread 1's list are completely independent of Thread 2's list.

### Multi-Threading Best Practices

```cpp
// CORRECT: Thread-local pattern
void WorkerThread() {
    // Each thread gets its own list automatically
    G4AllocatorList* list = G4AllocatorList::GetAllocatorList();

    // Create thread-local allocator
    G4Allocator<MyClass>* allocator = new G4Allocator<MyClass>;
    list->Register(allocator);  // Registered in THIS thread's list

    // ... use allocator ...

    // Cleanup for this thread
    list->Destroy();
}
```

## Usage Patterns

### Automatic Registration Pattern

Most common usage - allocators register themselves:

```cpp
// In G4Allocator constructor (happens automatically)
G4AllocatorBase::G4AllocatorBase() {
    G4AllocatorList::GetAllocatorList()->Register(this);
}

// User code just creates allocator
G4Allocator<MyClass>* allocator = new G4Allocator<MyClass>;
// Already registered automatically!
```

### Memory Monitoring Pattern

Monitor memory usage during simulation:

```cpp
void MonitorMemory() {
    G4AllocatorList* list = G4AllocatorList::GetAllocatorList();

    std::cout << "Number of allocators: " << list->Size() << "\n";

    // Detailed report
    list->Report(true);
}

// Call periodically or on-demand
void EndOfEvent(const G4Event* event) {
    if (event->GetEventID() % 1000 == 0) {
        MonitorMemory();
    }
}
```

### Cleanup Pattern (End of Run)

```cpp
void CleanupAllocators(G4int verbosity = 1) {
    G4AllocatorList* list = G4AllocatorList::GetAllocatorListIfExist();
    if (list != nullptr) {
        // Destroy all dynamic allocators, keep static ones
        // Typically first 3-5 are static (G4Track, G4Step, etc.)
        list->Destroy(3, verbosity);
    }
}

// In run manager
void MyRunManager::RunTermination() {
    CleanupAllocators(2);  // Verbose cleanup
}
```

### Complete Cleanup Pattern (Program Exit)

```cpp
void ShutdownMemoryManagement() {
    G4AllocatorList* list = G4AllocatorList::GetAllocatorListIfExist();
    if (list != nullptr) {
        // Report final statistics
        std::cout << "Final memory report:\n";
        list->Report(true);

        // Destroy ALL allocators (nStat = 0)
        list->Destroy(0, 2);  // Very verbose

        // List is now empty
        assert(list->Size() == 0);
    }
}
```

## Destroy Method Details

### Parameters Explained

#### nStat (Static Allocator Count)

**Purpose:** Preserve frequently-used allocators across runs

**Rationale:**
- Static allocators (G4Track, G4Step, etc.) are reused across runs
- Destroying and recreating them is wasteful
- First `nStat` allocators are reset but not deleted

**Common Values:**
- `0`: Destroy all allocators (complete cleanup)
- `3-5`: Preserve core tracking allocators
- `Size()`: Preserve all (just reset storage)

#### verboseLevel

**Levels:**
- `0`: Silent - no output
- `1`: Summary - total memory freed, counts
- `2`: Detailed - per-allocator memory breakdown

**Example Output (verboseLevel = 2):**
```
================== Deleting memory pools ===================
Pool ID 'G4Track', size : 5.123 MB
Pool ID 'G4Step', size : 3.456 MB
Pool ID 'G4StepPoint', size : 2.789 MB
Pool ID 'G4ReactionProduct', size : 1.234 MB
Pool ID 'G4Fragment', size : 0.987 MB
...
Number of memory pools allocated: 23; of which, static: 3
Dynamic pools deleted: 20 / Total memory freed: 45.67 MB
============================================================
```

### Destroy Algorithm

```cpp
void G4AllocatorList::Destroy(G4int nStat, G4int verboseLevel) {
    auto itr = fList.cbegin();
    G4int i = 0, j = 0;
    G4double mem = 0, tmem = 0;

    if (verboseLevel > 0) {
        G4cout << "================== Deleting memory pools ===================\n";
    }

    for (; itr != fList.cend(); ++itr) {
        mem = (*itr)->GetAllocatedSize();

        if (i < nStat) {
            // Static allocator - reset only
            ++i;
            tmem += mem;
            (*itr)->ResetStorage();
            continue;
        }

        // Dynamic allocator - reset and delete
        ++j;
        tmem += mem;

        if (verboseLevel > 1) {
            G4cout << "Pool ID '" << (*itr)->GetPoolType()
                   << "', size : " << mem / 1048576 << " MB\n";
        }

        (*itr)->ResetStorage();
        delete *itr;
    }

    if (verboseLevel > 0) {
        G4cout << "Number of memory pools allocated: " << Size()
               << "; of which, static: " << i << "\n";
        G4cout << "Dynamic pools deleted: " << j
               << " / Total memory freed: " << tmem / 1048576 << " MB\n";
        G4cout << "============================================================\n";
    }

    fList.clear();
}
```

## Memory Reporting

### Report Format

**Full Report (itemize = true):**
```
================== Current memory pools ===================
Pool ID 'G4Track', size : 2.345 MB
Pool ID 'G4Step', size : 1.234 MB
Pool ID 'G4StepPoint', size : 0.987 MB
Pool ID 'G4TouchableHistory', size : 0.654 MB
Pool ID 'G4DynamicParticle', size : 0.456 MB
Pool ID 'G4ReactionProduct', size : 0.321 MB
Pool ID 'G4Fragment', size : 0.234 MB
Pool ID 'G4HitsCollection', size : 0.123 MB
Number of memory pools allocated: 8
Dynamic pools : 8 / Total memory : 6.354 MB
============================================================
```

**Summary Report (itemize = false):**
```
================== Current memory pools ===================
Number of memory pools allocated: 8
Dynamic pools : 8 / Total memory : 6.354 MB
============================================================
```

### Custom Reporting

```cpp
void CustomMemoryReport() {
    G4AllocatorList* list = G4AllocatorList::GetAllocatorList();

    std::cout << "\nCustom Memory Analysis:\n";
    std::cout << "======================\n";

    G4double totalMB = 0.0;
    std::size_t count = list->Size();

    // Note: Can't iterate directly, but can use Report()
    list->Report(true);  // Use built-in detailed report

    std::cout << "\nSummary:\n";
    std::cout << "  Allocators: " << count << "\n";
}
```

## Performance Considerations

### Registration Overhead

**Cost:** Minimal - single vector push_back per allocator
```cpp
void Register(G4AllocatorBase* alloc) {
    fList.push_back(alloc);  // O(1) amortized
}
```

**Frequency:** Once per allocator lifetime (typically at startup)

**Impact:** Negligible

### Destroy Overhead

**Cost:** Proportional to number of allocators
```cpp
for (auto itr = fList.cbegin(); itr != fList.cend(); ++itr) {
    (*itr)->ResetStorage();  // O(pages) per allocator
    delete *itr;             // O(1) per allocator
}
```

**Frequency:** Once per run or program termination

**Impact:** Acceptable (cleanup phase)

### Report Overhead

**Cost:** Proportional to number of allocators
```cpp
for (auto itr = fList.cbegin(); itr != fList.cend(); ++itr) {
    mem = (*itr)->GetAllocatedSize();  // O(1) per allocator
    // Print...
}
```

**Frequency:** On-demand (user-triggered)

**Impact:** Minimal (I/O bound)

## Common Use Cases

### Use Case 1: Memory Leak Detection

```cpp
void DetectMemoryLeaks() {
    G4AllocatorList* list = G4AllocatorList::GetAllocatorListIfExist();
    if (list == nullptr) return;

    std::cout << "\nMemory Leak Check:\n";
    list->Report(true);

    // Large memory usage may indicate leaks
    // Compare against expected values
}

// Call at end of run
void EndOfRunAction() {
    DetectMemoryLeaks();
}
```

### Use Case 2: Memory Profiling

```cpp
class MemoryProfiler {
    std::map<G4String, G4double> initialMemory;

public:
    void StartProfiling() {
        // Record initial state
        G4AllocatorList* list = G4AllocatorList::GetAllocatorList();
        // Would need to extend G4AllocatorList for per-allocator query
        list->Report(false);
    }

    void EndProfiling() {
        // Report final state and delta
        G4AllocatorList* list = G4AllocatorList::GetAllocatorList();
        list->Report(true);
    }
};
```

### Use Case 3: Graceful Shutdown

```cpp
void GracefulShutdown(G4int staticAllocatorCount = 3) {
    G4AllocatorList* list = G4AllocatorList::GetAllocatorListIfExist();
    if (list == nullptr) {
        std::cout << "No allocators registered.\n";
        return;
    }

    std::cout << "Shutting down memory management...\n";
    std::cout << "Registered allocators: " << list->Size() << "\n";

    // Detailed report before cleanup
    list->Report(true);

    // Destroy dynamic allocators
    list->Destroy(staticAllocatorCount, 2);

    std::cout << "Shutdown complete.\n";
}
```

## Integration with G4AllocatorBase

`G4AllocatorList` manages `G4AllocatorBase*` pointers, enabling polymorphic allocator management:

```cpp
class G4AllocatorBase {
public:
    G4AllocatorBase() {
        G4AllocatorList::GetAllocatorList()->Register(this);
    }

    virtual ~G4AllocatorBase() = default;
    virtual void ResetStorage() = 0;
    virtual std::size_t GetAllocatedSize() const = 0;
    virtual int GetNoPages() const = 0;
    virtual std::size_t GetPageSize() const = 0;
    virtual void IncreasePageSize(unsigned int sz) = 0;
    virtual const char* GetPoolType() const = 0;
};
```

**Benefits:**
- Type-erased storage in list
- Polymorphic operations (ResetStorage, GetAllocatedSize, etc.)
- Uniform management of different allocator types

## Best Practices

### DO's

1. **Use GetAllocatorList()**: Don't try to instantiate directly
2. **Check with GetAllocatorListIfExist()**: Before optional operations
3. **Call Destroy() Explicitly**: Don't rely on destructor for cleanup
4. **Set Appropriate nStat**: Preserve commonly-used allocators
5. **Use Report() for Debugging**: Monitor memory usage during development

### DON'Ts

1. **Don't Delete List Manually**: Managed automatically by thread
2. **Don't Share Across Threads**: Each thread has its own list
3. **Don't Destroy During Simulation**: Only at run boundaries
4. **Don't Assume Registration Order**: List order may vary
5. **Don't Double-Register**: Allocators register automatically

### Memory Management Strategy

```cpp
// Application initialization
void Initialize() {
    // Allocators created and registered automatically
    // No explicit G4AllocatorList management needed
}

// End of run
void EndOfRun() {
    G4AllocatorList* list = G4AllocatorList::GetAllocatorList();

    // Optional: Report memory usage
    list->Report(true);

    // Reset storage for next run (preserve static allocators)
    list->Destroy(5, 1);
}

// Application termination
void Terminate() {
    G4AllocatorList* list = G4AllocatorList::GetAllocatorListIfExist();
    if (list != nullptr) {
        // Final report
        list->Report(true);

        // Destroy all allocators
        list->Destroy(0, 2);
    }
}
```

## See Also

- **G4Allocator**: Template allocator registered with this list
- **G4AllocatorBase**: Abstract base class for polymorphic management
- **G4AllocatorPool**: Underlying memory pool implementation
- **G4ThreadLocal**: Thread-local storage mechanism

## References

- Geant4 Application Developer Guide: Memory Management
- G4Threading documentation
