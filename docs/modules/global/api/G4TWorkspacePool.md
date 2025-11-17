# G4TWorkspacePool

Template class for managing thread-specific workspace pools with support for workspace recycling.

## Header

```cpp
#include "G4TWorkspacePool.hh"
```

## Source Location

- Header: `source/global/management/include/G4TWorkspacePool.hh`

## Overview

G4TWorkspacePool manages thread-private workspace instances, providing each thread with its own workspace for physics calculations. Workspaces contain thread-local copies of data structures that would otherwise require synchronization. The pool supports both simple per-thread allocation and dynamic workspace recycling for task-based threading models.

This is critical for multi-threaded Geant4 performance, as it eliminates lock contention on frequently-accessed physics data structures by giving each thread its own copy.

## Class Template

```cpp
template <class T>
class G4TWorkspacePool
{
public:
    T* CreateWorkspace();
    void CreateAndUseWorkspace();
    T* FindOrCreateWorkspace();
    T* GetWorkspace();
    void Recycle(T* myWrkSpace);
    void CleanUpAndDestroyAllWorkspaces();

    G4TWorkspacePool() {}
    ~G4TWorkspacePool() {}

private:
    static G4ThreadLocal T* fMyWorkspace;
};
```

## Template Parameters

- `T`: Workspace class type (must implement `UseWorkspace()`, `ReleaseWorkspace()`, and `DestroyWorkspace()` methods)

## Methods

### CreateWorkspace()
```cpp
T* CreateWorkspace()
```
Creates a new workspace for the current thread. Can only be called once per thread.

**Returns:** Pointer to newly created workspace

**Thread Safety:** Thread-local (each thread creates its own)

**Exceptions:** Throws `G4Exception` if:
- Workspace already exists for this thread
- Memory allocation fails

**Example:**
```cpp
G4TWorkspacePool<MyWorkspace> pool;
MyWorkspace* ws = pool.CreateWorkspace();
```

---

### CreateAndUseWorkspace()
```cpp
void CreateAndUseWorkspace()
```
Creates workspace and immediately activates it for use.

**Equivalent to:**
```cpp
CreateWorkspace()->UseWorkspace();
```

**Example:**
```cpp
G4TWorkspacePool<PhysicsWorkspace> pool;
pool.CreateAndUseWorkspace();  // Create and activate
```

---

### FindOrCreateWorkspace()
```cpp
T* FindOrCreateWorkspace()
```
Returns existing workspace for this thread, or creates new one if needed. Automatically calls `UseWorkspace()`.

**Returns:** Pointer to workspace (existing or newly created)

**Thread Safety:** Thread-safe

**Usage:** Preferred method for task-based threading models

**Example:**
```cpp
// Safe to call multiple times
T* ws = pool.FindOrCreateWorkspace();
// ws is ready to use
```

---

### GetWorkspace()
```cpp
T* GetWorkspace()
```
Returns the current thread's workspace without creating one.

**Returns:** Pointer to workspace, or `nullptr` if none exists

**Thread Safety:** Thread-local access

**Example:**
```cpp
T* ws = pool.GetWorkspace();
if (ws) {
    // Use existing workspace
}
```

---

### Recycle()
```cpp
void Recycle(T* myWrkSpace)
```
Releases and destroys a workspace. For future use with workspace recycling.

**Parameters:**
- `myWrkSpace`: Workspace pointer to recycle

**Actions:**
1. Calls `myWrkSpace->ReleaseWorkspace()`
2. Deletes the workspace

**Example:**
```cpp
T* ws = pool.GetWorkspace();
pool.Recycle(ws);  // Release and delete
```

---

### CleanUpAndDestroyAllWorkspaces()
```cpp
void CleanUpAndDestroyAllWorkspaces()
```
Cleans up and destroys the current thread's workspace. Call at thread termination.

**Thread Safety:** Thread-local

**Typical Usage:** Called by run manager during thread cleanup

**Example:**
```cpp
// At end of worker thread
void CleanupThread() {
    pool.CleanUpAndDestroyAllWorkspaces();
}
```

## Workspace Requirements

The template parameter `T` must implement these methods:

```cpp
class MyWorkspace {
public:
    void UseWorkspace();        // Activate this workspace
    void ReleaseWorkspace();    // Deactivate this workspace
    void DestroyWorkspace();    // Clean up internal resources
};
```

## Threading Patterns

### Pattern 1: Simple Per-Thread Workspace

```cpp
class PhysicsWorkspace {
public:
    void UseWorkspace() {
        // Set global pointers to this workspace's data
        G4Material::SetMaterialTable(materialTable);
        G4Element::SetElementTable(elementTable);
    }

    void ReleaseWorkspace() {
        // Reset global pointers
        G4Material::SetMaterialTable(nullptr);
        G4Element::SetElementTable(nullptr);
    }

    void DestroyWorkspace() {
        // Clean up workspace-specific data
        materialTable.clear();
        elementTable.clear();
    }

private:
    std::vector<G4Material*> materialTable;
    std::vector<G4Element*> elementTable;
};

// Usage
G4TWorkspacePool<PhysicsWorkspace> thePool;

void WorkerThreadInit() {
    thePool.CreateAndUseWorkspace();
}

void WorkerThreadCleanup() {
    thePool.CleanUpAndDestroyAllWorkspaces();
}
```

### Pattern 2: Dynamic Workspace with FindOrCreate

```cpp
void ProcessEvent() {
    // Safe to call repeatedly - reuses or creates
    auto* workspace = thePool.FindOrCreateWorkspace();

    // Process event using workspace
    SimulateEvent();

    // Workspace remains active for next event
}
```

### Pattern 3: Singleton Workspace Pool

```cpp
class GeometryWorkspacePool {
public:
    static G4TWorkspacePool<GeometryWorkspace>& GetPool() {
        static G4TWorkspacePool<GeometryWorkspace> pool;
        return pool;
    }

    static GeometryWorkspace* GetWorkspace() {
        return GetPool().FindOrCreateWorkspace();
    }

    static void CleanUp() {
        GetPool().CleanUpAndDestroyAllWorkspaces();
    }
};

// Usage
auto* ws = GeometryWorkspacePool::GetWorkspace();
```

### Pattern 4: Multiple Workspace Types

```cpp
// Different workspace types for different subsystems
G4TWorkspacePool<GeometryWorkspace> geometryPool;
G4TWorkspacePool<PhysicsWorkspace> physicsPool;
G4TWorkspacePool<TrackingWorkspace> trackingPool;

void InitializeWorker() {
    geometryPool.CreateAndUseWorkspace();
    physicsPool.CreateAndUseWorkspace();
    trackingPool.CreateAndUseWorkspace();
}

void CleanupWorker() {
    geometryPool.CleanUpAndDestroyAllWorkspaces();
    physicsPool.CleanUpAndDestroyAllWorkspaces();
    trackingPool.CleanUpAndDestroyAllWorkspaces();
}
```

### Pattern 5: Workspace Switching

```cpp
void SwitchWorkspace(G4TWorkspacePool<MyWorkspace>& pool) {
    // Get current workspace
    auto* oldWs = pool.GetWorkspace();
    if (oldWs) {
        oldWs->ReleaseWorkspace();
    }

    // Create or find new workspace
    auto* newWs = pool.FindOrCreateWorkspace();
    // FindOrCreateWorkspace automatically calls UseWorkspace()
}
```

## Master vs Worker Thread Usage

### Master Thread
The master thread typically does NOT create workspaces from the pool:

```cpp
void MasterThreadInit() {
    // Master creates shared data structures
    BuildGeometry();
    BuildPhysicsTables();

    // Master does NOT call CreateWorkspace()
    // Only workers create workspaces
}
```

### Worker Threads
Each worker thread creates and uses its own workspace:

```cpp
void WorkerThreadInit() {
    // Create thread-local workspace
    geometryPool.CreateAndUseWorkspace();
    physicsPool.CreateAndUseWorkspace();

    // Now worker can access thread-local copies
    ProcessEvents();
}

void WorkerThreadCleanup() {
    // Destroy workspace at thread end
    geometryPool.CleanUpAndDestroyAllWorkspaces();
    physicsPool.CleanUpAndDestroyAllWorkspaces();
}
```

### Initialization Sequence

```cpp
// 1. Master thread initializes shared resources
if (G4Threading::IsMasterThread()) {
    InitializeMasterData();
}

// 2. Workers create workspaces from master data
if (G4Threading::IsWorkerThread()) {
    auto* ws = thePool.CreateWorkspace();
    ws->UseWorkspace();

    // Workspace now contains thread-local copies
    // of master data
}
```

## Real-World Geant4 Usage

### Geometry Workspace

```cpp
class G4GeometryWorkspace {
public:
    void UseWorkspace() {
        // Switch global volume store to workspace copy
        G4LogicalVolumeStore::GetInstance()->
            SetWorkspace(solidVector, logicalVolumeVector);
    }

    void ReleaseWorkspace() {
        G4LogicalVolumeStore::GetInstance()->ReleaseWorkspace();
    }

    void DestroyWorkspace() {
        // Workspaces typically share geometry, so minimal cleanup
    }

private:
    std::vector<G4VSolid*> solidVector;
    std::vector<G4LogicalVolume*> logicalVolumeVector;
};

// Global pool
G4TWorkspacePool<G4GeometryWorkspace> g_geometryWorkspacePool;
```

### Physics Workspace

```cpp
class G4PhysicsWorkspace {
public:
    void UseWorkspace() {
        // Activate thread-local physics tables
        SetupPhysicsTables();
    }

    void ReleaseWorkspace() {
        // Deactivate physics tables
        ReleasePhysicsTables();
    }

    void DestroyWorkspace() {
        // Clean up thread-local physics tables
        ClearPhysicsTables();
    }
};

G4TWorkspacePool<G4PhysicsWorkspace> g_physicsWorkspacePool;
```

## Thread Safety Guarantees

### Thread-Safe Operations
- `CreateWorkspace()` - Thread-local, no sharing
- `GetWorkspace()` - Thread-local, no synchronization needed
- `FindOrCreateWorkspace()` - Thread-safe per-thread creation

### NOT Thread-Safe
- Sharing workspace pointers between threads
- Accessing another thread's workspace
- Concurrent modification of same workspace

### Important Notes
1. **Thread-Local Storage**: Each thread has its own workspace pointer
2. **No Cross-Thread Access**: Never pass workspace pointers between threads
3. **Cleanup Required**: Must call `CleanUpAndDestroyAllWorkspaces()` before thread exit

## Performance Notes

### Memory Overhead
- **Per-Thread Cost**: One workspace instance per thread
- **Total Memory**: base_size × number_of_threads
- **Trade-off**: Memory cost for elimination of synchronization

### Performance Benefits
- **No Locks**: Eliminates synchronization overhead
- **Cache Locality**: Each thread accesses its own memory
- **Scalability**: Linear scaling with thread count

### Optimization Tips
1. **Minimize Workspace Size**: Keep workspace data structures lean
2. **Lazy Initialization**: Use `FindOrCreateWorkspace()` for on-demand creation
3. **Reuse Workspaces**: Don't recreate unnecessarily
4. **Proper Cleanup**: Avoid memory leaks with cleanup methods

## Common Pitfalls

### 1. Creating Workspace Twice

```cpp
// BAD - Will throw exception
void BadInit() {
    pool.CreateWorkspace();
    pool.CreateWorkspace();  // ERROR: Already exists!
}

// GOOD - Check first or use FindOrCreate
void GoodInit() {
    auto* ws = pool.GetWorkspace();
    if (!ws) {
        ws = pool.CreateWorkspace();
    }
}

// BETTER - Use FindOrCreate
void BetterInit() {
    auto* ws = pool.FindOrCreateWorkspace();  // Safe
}
```

### 2. Forgetting to Call UseWorkspace()

```cpp
// BAD - Workspace created but not activated
void BadInit() {
    auto* ws = pool.CreateWorkspace();
    // Forgot to call ws->UseWorkspace()!
    ProcessData();  // May use wrong data!
}

// GOOD - Use CreateAndUseWorkspace
void GoodInit() {
    pool.CreateAndUseWorkspace();  // Creates AND activates
}

// ALSO GOOD - FindOrCreateWorkspace auto-activates
void AlsoGood() {
    pool.FindOrCreateWorkspace();  // Creates AND activates
}
```

### 3. Not Cleaning Up

```cpp
// BAD - Memory leak
void BadThreadFunction() {
    pool.CreateAndUseWorkspace();
    ProcessEvents();
    // Exit without cleanup - LEAK!
}

// GOOD - Proper cleanup
void GoodThreadFunction() {
    pool.CreateAndUseWorkspace();
    ProcessEvents();
    pool.CleanUpAndDestroyAllWorkspaces();  // Clean up
}
```

### 4. Sharing Workspace Between Threads

```cpp
// BAD - Sharing workspace pointer
MyWorkspace* globalWs = nullptr;

void Thread1() {
    globalWs = pool.CreateWorkspace();  // BAD!
}

void Thread2() {
    globalWs->UseWorkspace();  // WRONG THREAD!
}

// GOOD - Each thread gets its own
void Thread1() {
    auto* ws = pool.FindOrCreateWorkspace();
    ws->UseWorkspace();
}

void Thread2() {
    auto* ws = pool.FindOrCreateWorkspace();  // Different workspace
    ws->UseWorkspace();
}
```

### 5. Wrong Thread Cleanup

```cpp
// BAD - Master trying to clean worker workspaces
void BadMasterCleanup() {
    // This only cleans master's workspace (if any)
    pool.CleanUpAndDestroyAllWorkspaces();
    // Worker workspaces NOT cleaned!
}

// GOOD - Each thread cleans its own
void WorkerThread() {
    pool.CreateAndUseWorkspace();
    ProcessEvents();
    pool.CleanUpAndDestroyAllWorkspaces();  // Worker cleans itself
}
```

## Workspace Implementation Example

Complete example of a conforming workspace class:

```cpp
class MyWorkspace {
public:
    MyWorkspace()
        : isActive(false),
          threadId(G4Threading::G4GetThreadId())
    {
        // Initialize thread-local data
        data.reserve(10000);
    }

    void UseWorkspace() {
        if (!isActive) {
            // Switch global pointers to this workspace
            SetGlobalDataPointer(&data);
            isActive = true;
        }
    }

    void ReleaseWorkspace() {
        if (isActive) {
            // Reset global pointers
            SetGlobalDataPointer(nullptr);
            isActive = false;
        }
    }

    void DestroyWorkspace() {
        // Clean up workspace resources
        data.clear();
        data.shrink_to_fit();
    }

    ~MyWorkspace() {
        if (isActive) {
            ReleaseWorkspace();
        }
        DestroyWorkspace();
    }

private:
    bool isActive;
    int threadId;
    std::vector<DataType> data;

    static void SetGlobalDataPointer(std::vector<DataType>* ptr);
};
```

## Integration with Other Classes

- **G4WorkerThread**: Creates workspaces during initialization
- **G4MTRunManager**: Manages workspace pools for subsystems
- **G4GeometryWorkspace**: Geometry workspace pool
- **G4SolidsWorkspace**: Solids workspace pool
- **G4ParticlesWorkspace**: Particle table workspace pool

## Comparison to Alternatives

### vs Thread-Local Variables

| Feature | G4TWorkspacePool | Thread-Local Variables |
|---------|------------------|----------------------|
| Management | Explicit pool | Automatic |
| Cleanup | Manual | Automatic |
| Flexibility | Can recycle | Fixed lifetime |
| Control | Fine-grained | Limited |
| Use Case | Complex workspaces | Simple data |

### vs G4ThreadLocalSingleton

| Feature | G4TWorkspacePool | G4ThreadLocalSingleton |
|---------|------------------|----------------------|
| Pattern | Pool of workspaces | One instance per thread |
| Lifecycle | Explicit control | Automatic |
| Recycling | Supported | Not supported |
| Use Case | Geant4 subsystems | User singletons |

## Limitations

1. **Memory Scaling**: Memory usage scales linearly with thread count
2. **Manual Management**: Requires explicit cleanup
3. **No Sharing**: Workspaces cannot be shared between threads
4. **Interface Requirements**: Workspace class must implement specific methods

## Best Practices

1. **Use FindOrCreateWorkspace()**: Safest and most flexible method
2. **Clean Up Properly**: Always call `CleanUpAndDestroyAllWorkspaces()`
3. **Don't Share Pointers**: Keep workspace pointers thread-local
4. **Implement Full Interface**: Workspace must implement all required methods
5. **Consider Memory**: Be aware of per-thread memory cost

## Future Directions

The pool is designed to support task-based threading:
- Workspace recycling (partially implemented)
- Dynamic workspace allocation
- Workspace reuse across different tasks

## See Also

- G4ThreadLocalSingleton - Thread-local singleton pattern
- G4Cache - Thread-local caching
- G4WorkerThread - Worker thread implementation
- G4MTRunManager - Multi-threaded run manager
- G4GeometryWorkspace - Geometry workspace implementation

## Notes

1. **Task-Based Ready**: Designed for future task-based threading
2. **Explicit Management**: Requires manual lifecycle management
3. **Performance Critical**: Eliminates synchronization overhead
4. **Geant4 Core**: Used throughout Geant4 MT implementation
5. **Thread-Local Storage**: Uses `G4ThreadLocal` internally

## Authors

- John Apostolakis (CERN) - Co-author (24 October 2014)
- Andrea Dotti (SLAC) - Co-author (24 October 2014)
- Gabriele Cosmo (CERN) - Pool initialization revision (21 October 2016)
