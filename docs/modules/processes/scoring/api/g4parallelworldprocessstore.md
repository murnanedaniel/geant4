# G4ParallelWorldProcessStore

**Singleton registry for parallel world processes**

::: tip Quick Reference
**Header:** `source/processes/scoring/include/G4ParallelWorldProcessStore.hh`
**Source:** `source/processes/scoring/src/G4ParallelWorldProcessStore.cc`
**Inherits:** `std::map<G4ParallelWorldProcess*, G4String>`
**Pattern:** Singleton (thread-local)
**Author:** M. Asai (SLAC), 2010
:::

## Purpose

`G4ParallelWorldProcessStore` is a **singleton registry** that manages the relationship between parallel world processes and their associated parallel world names:

1. **Process Registration** - Maps processes to parallel world names
2. **Uniqueness Enforcement** - Ensures each process has exactly one world
3. **Consistency Validation** - Prevents process-world conflicts
4. **World Name Propagation** - Updates processes with world names
5. **Process Lookup** - Finds process by parallel world name
6. **Thread-Local Storage** - One instance per thread

This is primarily used **internally** by `G4ParallelWorldPhysics` and detector construction, but can be accessed for advanced use cases.

---

## Class Declaration

**File:** Lines 48-70 in `source/processes/scoring/include/G4ParallelWorldProcessStore.hh`

```cpp
class G4ParallelWorldProcessStore : public std::map<G4ParallelWorldProcess*, G4String>
{
  public:
    // Singleton access
    static G4ParallelWorldProcessStore* GetInstance();
    static G4ParallelWorldProcessStore* GetInstanceIfExist();

    // Process-world management
    void SetParallelWorld(G4ParallelWorldProcess* proc,
                         const G4String& parallelWorldName);
    void UpdateWorlds();

    // Process lookup
    G4ParallelWorldProcess* GetProcess(const G4String& parallelWorldName);

    // Cleanup
    void Clear();

    virtual ~G4ParallelWorldProcessStore();

  private:
    // Private constructor (singleton pattern)
    G4ParallelWorldProcessStore();

  private:
    // Thread-local singleton instance
    static G4ThreadLocal G4ParallelWorldProcessStore* fInstance;
};
```

---

## Key Concepts

### Singleton Pattern (Thread-Local)

**Traditional Singleton:** One instance per application.

**Thread-Local Singleton:** One instance **per thread**.

```cpp
// Thread 1 (master)
G4ParallelWorldProcessStore* store1 = GetInstance();  // Creates instance 1

// Thread 2 (worker)
G4ParallelWorldProcessStore* store2 = GetInstance();  // Creates instance 2

// store1 ≠ store2 (different threads, different instances)
```

**Why thread-local?**
- Each worker thread has independent processes
- No shared state between threads
- Thread-safe by design (no locks needed)

**Implementation:** Line 68 in header
```cpp
static G4ThreadLocal G4ParallelWorldProcessStore* fInstance;
```

---

### Map Structure

Inherits from `std::map<G4ParallelWorldProcess*, G4String>`:

```cpp
// Internal structure
{
    process1 → "ScoringWorld",
    process2 → "ImportanceWorld",
    process3 → "BiasWorld",
    // ...
}
```

**Key:** Pointer to `G4ParallelWorldProcess`
**Value:** Name of parallel world (string)

**Benefit:** Standard map operations available (iteration, lookup, etc.)

---

## Key Methods

### Singleton Access

#### `GetInstance()`
**Declaration:** Line 52 in header

```cpp
static G4ParallelWorldProcessStore* GetInstance();
```

**Purpose:** Get or create the singleton instance for current thread.

**Behavior:**
- If instance exists: Returns existing instance
- If instance is `nullptr`: Creates new instance, returns it

**Implementation:** Lines 37-44 in source file

```cpp
G4ParallelWorldProcessStore* G4ParallelWorldProcessStore::GetInstance()
{
  if (fInstance == nullptr)
  {
    fInstance = new G4ParallelWorldProcessStore();
  }
  return fInstance;
}
```

**Usage:**
```cpp
G4ParallelWorldProcessStore* store =
    G4ParallelWorldProcessStore::GetInstance();
// Always safe to call (creates if needed)
```

**Thread Safety:** Each thread gets independent instance.

---

#### `GetInstanceIfExist()`
**Declaration:** Line 53 in header

```cpp
static G4ParallelWorldProcessStore* GetInstanceIfExist();
```

**Purpose:** Get instance only if it already exists.

**Returns:**
- Pointer to instance if it exists
- `nullptr` if not yet created

**Implementation:** Lines 46-49 in source file

```cpp
G4ParallelWorldProcessStore* G4ParallelWorldProcessStore::GetInstanceIfExist()
{
  return fInstance;
}
```

**Usage:**
```cpp
// Check if store exists without creating it
G4ParallelWorldProcessStore* store =
    G4ParallelWorldProcessStore::GetInstanceIfExist();

if (store != nullptr) {
    // Store exists, use it
    G4ParallelWorldProcess* proc = store->GetProcess("WorldName");
}
```

**Use Case:** Query without initialization side-effects.

---

### Process-World Management

#### `SetParallelWorld()`
**Declaration:** Lines 55-56 in header

```cpp
void SetParallelWorld(G4ParallelWorldProcess* proc,
                     const G4String& parallelWorldName);
```

**Purpose:** Register a process with its parallel world name.

**Parameters:**
- `proc` - Pointer to parallel world process
- `parallelWorldName` - Name of parallel world

**Behavior:**
1. **Check if process already registered:**
   - If yes, with **same name** → Return (no-op)
   - If yes, with **different name** → Throw exception (consistency error)

2. **If not registered:** Add to map

**Implementation:** Lines 59-80 in source file

```cpp
void G4ParallelWorldProcessStore::SetParallelWorld(
    G4ParallelWorldProcess* proc,
    const G4String& parallelWorldName)
{
  for (const auto& [process, name] : *fInstance)
  {
    if(process == proc)
    {
      if(name == parallelWorldName)
      {
        return; // already registered
      }

      // inconsistent !
      G4ExceptionDescription ED;
      ED << "G4ParallelWorldProcess (" << proc
         << ") has the world volume (" << name
         << "). It is inconsistent with (" << parallelWorldName << ").";
      G4Exception("G4ParallelWorldProcessStore::SetParallelWorld",
                 "ProcScore0101", FatalException, ED);
    }
  }
  (*fInstance)[proc] = parallelWorldName;
}
```

**Error Handling:** Throws `FatalException` if process-world inconsistency detected.

**Usage:**
```cpp
G4ParallelWorldProcess* proc = new G4ParallelWorldProcess("MyProc");
G4ParallelWorldProcessStore::GetInstance()->SetParallelWorld(proc, "ScoringWorld");

// Later, trying to set different world → ERROR
store->SetParallelWorld(proc, "DifferentWorld");  // FatalException!
```

---

#### `UpdateWorlds()`
**Declaration:** Line 56 in header

```cpp
void UpdateWorlds();
```

**Purpose:** Apply stored world names to all registered processes.

**Behavior:**
- Iterates through all process-name pairs
- Calls `SetParallelWorld(name)` on each process

**Implementation:** Lines 82-88 in source file

```cpp
void G4ParallelWorldProcessStore::UpdateWorlds()
{
  for(auto& [process, name] : *fInstance)
  {
    process->SetParallelWorld(name);
  }
}
```

**Use Case:** After geometry reconstruction, propagate world names.

**Typical Usage:**
```cpp
// After detector construction changes
G4ParallelWorldProcessStore::GetInstance()->UpdateWorlds();
// All processes re-associated with their parallel worlds
```

---

### Process Lookup

#### `GetProcess()`
**Declaration:** Line 57 in header

```cpp
G4ParallelWorldProcess* GetProcess(const G4String& parallelWorldName);
```

**Purpose:** Find process associated with a parallel world name.

**Parameters:**
- `parallelWorldName` - Name of parallel world

**Returns:**
- Pointer to process if found
- `nullptr` if no process registered for that world

**Implementation:** Lines 90-97 in source file

```cpp
G4ParallelWorldProcess* G4ParallelWorldProcessStore::GetProcess(
    const G4String& parallelWorldName)
{
  for(const auto& [proc, name] : *fInstance)
  {
    if (name == parallelWorldName) return proc;
  }
  return nullptr;
}
```

**Usage:**
```cpp
// Find process for specific world
G4ParallelWorldProcess* proc =
    G4ParallelWorldProcessStore::GetInstance()->GetProcess("ScoringWorld");

if (proc != nullptr) {
    // Use process
    proc->SetLayeredMaterialFlag(true);
}
```

**Performance:** O(N) linear search (N = number of registered processes).

---

### Cleanup

#### `Clear()`
**Declaration:** Line 58 in header

```cpp
void Clear();
```

**Purpose:** Remove all entries from the store.

**Behavior:**
- Clears the map (removes all process-name pairs)
- Does **not** delete processes (just removes references)

**Implementation:** Lines 99-102 in source file

```cpp
void G4ParallelWorldProcessStore::Clear()
{
  fInstance->clear();
}
```

**Usage:**
```cpp
// Clean up all registrations
G4ParallelWorldProcessStore::GetInstance()->Clear();
```

**Use Case:** Typically called during cleanup or before geometry reconstruction.

---

### Destructor

**Declaration:** Line 60 in header

```cpp
virtual ~G4ParallelWorldProcessStore();
```

**Behavior:**
- Calls `Clear()` to remove all entries
- Sets `fInstance` to `nullptr`

**Implementation:** Lines 53-57 in source file

```cpp
G4ParallelWorldProcessStore::~G4ParallelWorldProcessStore()
{
  Clear();
  fInstance = nullptr;
}
```

**Note:** Processes themselves are **not** deleted (ownership elsewhere).

---

## Data Members

### Singleton Instance

**Line 68 in header**

```cpp
static G4ThreadLocal G4ParallelWorldProcessStore* fInstance;
```

**Purpose:** Thread-local singleton instance.

**Initialization:** `nullptr` (created on first `GetInstance()` call)

**Lifetime:** Destroyed at thread exit

---

## Usage Patterns

### Basic Registration (Typical Use)

Usually handled automatically by `G4ParallelWorldPhysics`:

```cpp
// Internally in G4ParallelWorldPhysics
G4ParallelWorldProcess* proc = new G4ParallelWorldProcess(worldName);

G4ParallelWorldProcessStore::GetInstance()->SetParallelWorld(
    proc, worldName
);
```

**User typically doesn't call directly** - automatic via physics constructor.

---

### Manual Registration (Advanced)

For custom parallel world setup:

```cpp
// Create process
G4ParallelWorldProcess* customProc =
    new G4ParallelWorldProcess("CustomScoring");

// Register with store
G4ParallelWorldProcessStore* store =
    G4ParallelWorldProcessStore::GetInstance();
store->SetParallelWorld(customProc, "CustomWorld");

// Later, update world reference
store->UpdateWorlds();
```

---

### Querying Registered Processes

```cpp
G4ParallelWorldProcessStore* store =
    G4ParallelWorldProcessStore::GetInstance();

// Iterate through all registered processes
for (const auto& [proc, worldName] : *store) {
    G4cout << "Process: " << proc->GetProcessName()
           << " -> World: " << worldName
           << G4endl;
}
```

**Access as map:** Can use standard map operations.

---

### Finding Process by World Name

```cpp
// Get process for specific parallel world
G4String worldName = "ImportanceWorld";
G4ParallelWorldProcess* proc = store->GetProcess(worldName);

if (proc) {
    // Configure process
    proc->SetLayeredMaterialFlag(true);
} else {
    G4cerr << "No process found for world: " << worldName << G4endl;
}
```

---

### Cleanup Before Reconstruction

```cpp
// Before changing geometry
void DetectorConstruction::UpdateGeometry() {
    // Clear process-world associations
    G4ParallelWorldProcessStore::GetInstance()->Clear();

    // Reconstruct geometry
    // ...

    // Re-register processes
    // (or let physics list re-register automatically)
}
```

---

## Thread Safety

### Thread-Local Singleton

Each thread has independent instance:

```cpp
// Master thread
void MasterThread() {
    G4ParallelWorldProcessStore* masterStore = GetInstance();
    // masterStore is master's instance

    masterStore->SetParallelWorld(masterProc, "World");
}

// Worker thread
void WorkerThread() {
    G4ParallelWorldProcessStore* workerStore = GetInstance();
    // workerStore is worker's instance (different from master)

    workerStore->SetParallelWorld(workerProc, "World");
    // workerProc is worker's clone of masterProc
}
```

**No synchronization needed:** Each thread operates independently.

---

### Multi-Threading Behavior

**Initialization:**
1. **Master thread:** Processes created, registered in master store
2. **Worker threads:** Processes cloned, registered in worker stores

**Independence:**
- Master store has master processes
- Each worker store has worker process clones
- No shared state

**Implication:** Thread-safe by design.

---

## Common Use Cases

### 1. Internal Use by G4ParallelWorldPhysics

**Automatic registration:**

```cpp
// In G4ParallelWorldPhysics::ConstructProcess()
G4ParallelWorldProcess* proc =
    new G4ParallelWorldProcess(fWorldName);

G4ParallelWorldProcessStore::GetInstance()->SetParallelWorld(
    proc, fWorldName
);
```

**User doesn't see this** - happens automatically.

---

### 2. Custom Parallel World Setup

**Manual control:**

```cpp
class MyDetectorConstruction : public G4VUserDetectorConstruction {
public:
    void ConstructParallelWorlds() {
        // Create parallel world
        RegisterParallelWorld(
            new MyParallelWorld("BiasWorld")
        );
    }
};

class MyPhysicsList : public G4VUserPhysicsList {
public:
    void ConstructProcess() {
        // Create custom process
        G4ParallelWorldProcess* biasProc =
            new G4ParallelWorldProcess("Biasing");

        // Register manually
        G4ParallelWorldProcessStore::GetInstance()->SetParallelWorld(
            biasProc, "BiasWorld"
        );

        // Add to particles
        // ...
    }
};
```

---

### 3. Debugging Parallel World Configuration

**List all parallel worlds:**

```cpp
void ListParallelWorlds() {
    G4ParallelWorldProcessStore* store =
        G4ParallelWorldProcessStore::GetInstanceIfExist();

    if (store == nullptr) {
        G4cout << "No parallel world processes registered." << G4endl;
        return;
    }

    G4cout << "Registered parallel world processes:" << G4endl;
    for (const auto& [proc, worldName] : *store) {
        G4cout << "  - Process: " << proc->GetProcessName()
               << " (" << proc << ")"
               << " -> World: " << worldName
               << G4endl;
    }
}
```

---

### 4. Validating Configuration

**Check for expected parallel world:**

```cpp
bool ValidateParallelWorld(const G4String& expectedWorld) {
    G4ParallelWorldProcessStore* store =
        G4ParallelWorldProcessStore::GetInstanceIfExist();

    if (store == nullptr) {
        G4cerr << "ERROR: No parallel world store!" << G4endl;
        return false;
    }

    G4ParallelWorldProcess* proc = store->GetProcess(expectedWorld);
    if (proc == nullptr) {
        G4cerr << "ERROR: No process for world: " << expectedWorld << G4endl;
        return false;
    }

    G4cout << "Found process for " << expectedWorld << ": "
           << proc->GetProcessName() << G4endl;
    return true;
}
```

---

## Advanced Topics

### Store Lifecycle

**Creation:**
- First call to `GetInstance()` in thread
- Created on-demand (lazy initialization)

**Destruction:**
- Destroyed automatically at thread exit
- Calls `Clear()` and sets `fInstance = nullptr`

**Typical Flow:**
```
1. Thread starts
2. First GetInstance() → creates store
3. Process registration → adds entries
4. Simulation runs → store accessed for lookups
5. Thread ends → destructor called
6. fInstance = nullptr
```

---

### Map Access

As `std::map`, supports standard operations:

**Iteration:**
```cpp
for (auto& [proc, name] : *store) {
    // Use proc and name
}
```

**Count:**
```cpp
G4int nProcesses = store->size();
```

**Erase specific entry:**
```cpp
// Find process
auto it = store->find(proc);
if (it != store->end()) {
    store->erase(it);
}
```

**Note:** Usually use `Clear()` instead of individual erasure.

---

### Consistency Enforcement

**Prevents:**
1. **Same process, different world:**
   ```cpp
   store->SetParallelWorld(proc, "World1");  // OK
   store->SetParallelWorld(proc, "World2");  // FATAL ERROR
   ```

2. **Multiple processes, same world:**
   ```cpp
   store->SetParallelWorld(proc1, "World");  // OK
   store->SetParallelWorld(proc2, "World");  // OK (allowed)
   // Two processes can share a world
   ```

**Why?**
- A process can only navigate ONE parallel world
- Multiple processes CAN navigate the same world (for different particles)

---

## Common Pitfalls

### 1. Accessing Before Initialization

**Problem:**
```cpp
// Trying to access instance that doesn't exist
G4ParallelWorldProcessStore* store = GetInstanceIfExist();
store->GetProcess("World");  // Crash if store is nullptr!
```

**Solution:**
```cpp
G4ParallelWorldProcessStore* store = GetInstanceIfExist();
if (store != nullptr) {
    G4ParallelWorldProcess* proc = store->GetProcess("World");
}

// Or use GetInstance() to create if needed
G4ParallelWorldProcessStore* store = GetInstance();  // Always safe
```

---

### 2. Expecting Shared State Across Threads

**Problem:**
```cpp
// Master thread
GetInstance()->SetParallelWorld(proc, "World");

// Worker thread
G4ParallelWorldProcess* proc = GetInstance()->GetProcess("World");
// Returns nullptr! Different instance!
```

**Understanding:** Each thread has independent store.

**Solution:** Don't rely on cross-thread lookups. Each thread registers its own processes.

---

### 3. Deleting Processes Without Cleanup

**Problem:**
```cpp
G4ParallelWorldProcess* proc = new G4ParallelWorldProcess("Test");
store->SetParallelWorld(proc, "TestWorld");
delete proc;  // Deleted, but still in store!

// Later
store->GetProcess("TestWorld");  // Returns dangling pointer! ❌
```

**Solution:**
```cpp
// Remove from store before deleting
store->Clear();  // Or manually erase
delete proc;
```

**Best Practice:** Let process managers handle process deletion.

---

### 4. Forgetting UpdateWorlds() After Geometry Change

**Problem:**
```cpp
// Change parallel world geometry
// Processes still reference old world
```

**Solution:**
```cpp
// After geometry reconstruction
G4ParallelWorldProcessStore::GetInstance()->UpdateWorlds();
// Processes re-initialized with new world
```

---

## Performance Considerations

### Lookup Overhead

**GetProcess():** O(N) linear search where N = number of processes.

**Typical:** N < 10 (few parallel worlds).

**Impact:** Negligible (called rarely, not during tracking).

---

### Memory Usage

**Per instance:**
- Map overhead: ~48 bytes
- Per entry: ~16 bytes (pointer + string)

**Typical:** 5 entries × 16 bytes = 80 bytes total.

**Negligible** compared to other memory usage.

---

## Summary

`G4ParallelWorldProcessStore` provides:

**Functionality:**
- **Singleton registry** for parallel world processes
- **Thread-local** storage (one per thread)
- **Consistency enforcement** (one world per process)
- **Process lookup** by parallel world name
- **Automatic management** via `G4ParallelWorldPhysics`

**Typical Usage:**
- **Automatic** - handled by physics constructors
- **Manual** - for custom parallel world setups
- **Debugging** - list/validate parallel world configuration

**Key Points:**
- Thread-local singleton (each thread independent)
- Prevents process-world inconsistencies
- Lightweight (minimal overhead)
- Rarely accessed during tracking (initialization only)

**Best Practices:**
- Use `GetInstance()` for safe access (creates if needed)
- Use `GetInstanceIfExist()` for queries without creation
- Call `UpdateWorlds()` after geometry changes
- Let physics constructors handle registration when possible

---

## See Also

- [G4ParallelWorldProcess](./g4parallelworldprocess.md) - Main parallel world process
- [G4ParallelWorldScoringProcess](./g4parallelworldscoringprocess.md) - Scoring-only variant
- [Scoring Sub-Module Overview](../index.md) - Architecture and concepts
- G4ParallelWorldPhysics - Physics constructor using this store

**Design Patterns:**
- Singleton Pattern
- Thread-Local Storage
- Registry Pattern

**External Documentation:**
- Geant4 Multi-Threading Guide
- C++ Thread-Local Storage
