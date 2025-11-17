# G4AutoDelete

## Overview

`G4AutoDelete` is a **RAII-based automatic deletion mechanism** for Geant4 multi-threading that provides simplified "garbage collection" for heap-allocated objects. It registers objects for automatic deletion at thread exit, ensuring proper cleanup without manual memory management. This is particularly useful for thread-private objects that need to persist for the thread's lifetime.

**Source Locations:**
- Header: `/source/global/management/include/G4AutoDelete.hh`
- Author: A.Dotti (SLAC), 28 October 2013

**Design Pattern:** RAII (Resource Acquisition Is Initialization) combined with thread-local singleton management for automatic cleanup.

## Problem Statement

In multi-threaded Geant4, you often need:
- **Thread-private objects** allocated on the heap
- **Automatic cleanup** when thread exits
- **Static-like lifetime** without manual tracking

**Without G4AutoDelete:**
```cpp
void WorkerThread() {
    auto* obj = new MyObject();  // Allocated on heap

    // ... use obj throughout thread lifetime ...

    // PROBLEM: When/where to delete?
    // - Can't use stack allocation (may need to persist across function calls)
    // - Manual tracking is error-prone
    // - Memory leak if thread exits unexpectedly
}
```

**With G4AutoDelete:**
```cpp
void WorkerThread() {
    auto* obj = new MyObject();
    G4AutoDelete::Register(obj);  // Automatic deletion at thread exit!

    // ... use obj throughout thread lifetime ...
    // No manual delete needed - automatic cleanup
}
```

## API Reference

### Register Function

```cpp
namespace G4AutoDelete {
    template <class T>
    void Register(T* inst);
}
```

Registers object for automatic deletion when the current thread exits.

**Template Parameter:**
- `T`: Type of object to register

**Function Parameter:**
- `inst`: Pointer to heap-allocated object (must not be `nullptr`)

**Behavior:**
1. Creates or accesses thread-local singleton container for type `T`
2. Registers `inst` in the container
3. Container automatically deletes `inst` when thread exits

**Thread Safety:** Thread-safe by design - each thread has its own registry

**Example:**
```cpp
MyClass* obj = new MyClass(args...);
G4AutoDelete::Register(obj);
// obj will be deleted automatically at thread exit
```

## How It Works

### Internal Mechanism

```cpp
namespace G4AutoDelete {
    template <class T>
    void Register(T* inst) {
        static G4ThreadLocalSingleton<T> container;
        container.Register(inst);
    }
}
```

### Thread-Local Singleton

- **G4ThreadLocalSingleton**: Manages collection of registered objects per thread
- **Static variable**: One container instance per type `T` per thread
- **Automatic cleanup**: Destructor called at thread exit

### Lifecycle

```
Thread Start
    ↓
Object allocated: new MyClass()
    ↓
G4AutoDelete::Register(obj) called
    ↓
Static G4ThreadLocalSingleton<MyClass> container created (first call)
    ↓
obj added to container's registry
    ↓
... Thread continues, obj remains alive ...
    ↓
Thread Exit
    ↓
container destructor called
    ↓
All registered objects deleted: delete obj
    ↓
Thread Cleanup Complete
```

## Usage Patterns

### Pattern 1: Thread-Private Singleton

```cpp
class DatabaseConnection {
    // ... implementation ...
};

DatabaseConnection* GetThreadLocalDB() {
    static G4ThreadLocal DatabaseConnection* db = nullptr;
    if (db == nullptr) {
        db = new DatabaseConnection();
        G4AutoDelete::Register(db);  // Auto-cleanup at thread exit
    }
    return db;
}

// Usage
void ProcessData() {
    auto* db = GetThreadLocalDB();
    db->Query("SELECT ...");
    // No manual cleanup needed
}
```

### Pattern 2: Thread-Private Resource

```cpp
class ExpensiveResource {
public:
    ExpensiveResource() {
        // Complex initialization
    }
    ~ExpensiveResource() {
        // Important cleanup
    }
};

void WorkerThread() {
    // Create expensive resource once per thread
    auto* resource = new ExpensiveResource();
    G4AutoDelete::Register(resource);

    // Use throughout thread lifetime
    for (int i = 0; i < 1000; ++i) {
        resource->ProcessEvent(i);
    }

    // Automatic cleanup when thread exits
}
```

### Pattern 3: Shared Class with Thread-Private Data

From G4AutoDelete.hh documentation:

```cpp
class G4SharedByThreads {
    void calledByThreads() {
        G4Something* anObject = new G4Something;
        G4AutoDelete::Register(anObject);
    }
};
```

### Pattern 4: Lazy Initialization

```cpp
class PhysicsCache {
    // Large physics tables
};

PhysicsCache* GetCache() {
    static G4ThreadLocal PhysicsCache* cache = nullptr;
    if (!cache) {
        cache = new PhysicsCache();
        G4AutoDelete::Register(cache);
    }
    return cache;
}

// Each thread gets its own cache, automatically deleted
```

## Usage in Geant4

### Real-World Examples

#### G4Threading.cc
```cpp
G4ThreadLocal static std::set<G4int>* aset = new std::set<G4int>;
G4AutoDelete::Register(aset);
```
Thread-private set automatically cleaned up at thread exit.

#### G4GeometryTolerance.cc
```cpp
if (fpInstance == nullptr) {
    fpInstance = new G4GeometryTolerance();
    G4AutoDelete::Register(fpInstance);
}
```
Thread-local singleton with automatic cleanup.

#### G4UniformRandPool.cc
```cpp
G4ThreadLocal static G4UniformRandPool* rndpool = new G4UniformRandPool();
G4AutoDelete::Register(rndpool);
```
Thread-private random number pool with automatic deletion.

## Limitations

### Critical Limitation: No G4ThreadLocal Data Members

**From documentation:**
> The registered object should not contain any G4ThreadLocal data member.

**Why?** Thread-local members within a registered object can cause:
- Double deletion issues
- Incorrect cleanup order
- Memory corruption

**Example of INCORRECT usage:**
```cpp
// WRONG - Don't do this!
class BadClass {
    G4ThreadLocal static int tlsValue;  // Thread-local member
};

BadClass* obj = new BadClass();
G4AutoDelete::Register(obj);  // PROBLEM! obj contains thread-local member
```

**Correct alternative:**
```cpp
// CORRECT - Thread-local at function scope
int& GetThreadLocalValue() {
    static G4ThreadLocal int tlsValue = 0;
    return tlsValue;
}

class GoodClass {
    // No thread-local members
    int normalValue;
};

GoodClass* obj = new GoodClass();
G4AutoDelete::Register(obj);  // OK!
```

### Performance Considerations

**Note from documentation:**
> This function uses G4ThreadLocalSingleton that on its own uses locks and mutexes.
> Thus its use should be limited to only when really necessary.

**Impact:**
- **Locking overhead** on first registration per type per thread
- **Negligible** for infrequent operations (e.g., thread initialization)
- **Avoid** in performance-critical tight loops

**When to use:**
- Thread initialization (one-time cost)
- Singleton creation (one-time per type per thread)
- Resource allocation at thread start

**When NOT to use:**
- Inside event loop (thousands of times per second)
- For temporary objects (use stack allocation instead)
- For objects with clear ownership (use unique_ptr/shared_ptr)

## Thread Safety

### Thread Safety Model

**G4AutoDelete is thread-safe:**
- Each thread has independent registry
- No sharing of registered objects between threads
- Thread-local storage prevents races
- Mutex protection during registration

### Multi-Threading Safety

```
Thread 1:                          Thread 2:
┌────────────────────┐            ┌────────────────────┐
│ Register(obj1)     │            │ Register(obj2)     │
│   ↓                │            │   ↓                │
│ ThreadLocalSingleton│           │ ThreadLocalSingleton│
│ <Container1>       │            │ <Container2>       │
│   - obj1           │            │   - obj2           │
└────────────────────┘            └────────────────────┘
     Independent                       Independent
```

**No conflicts** - complete thread isolation.

## Memory Management

### Automatic Deletion

**When objects are deleted:**
- At thread exit (normal termination)
- When thread-local static destructors run
- Before thread joins or detaches

**Order of deletion:**
- Reverse order of registration within same type
- Undefined order across different types

**Example:**
```cpp
G4AutoDelete::Register(obj1);  // Registered first
G4AutoDelete::Register(obj2);  // Registered second
G4AutoDelete::Register(obj3);  // Registered third

// At thread exit: deleted in order obj3, obj2, obj1
```

### Memory Overhead

**Per Type Per Thread:**
```cpp
sizeof(G4ThreadLocalSingleton<T>) + container overhead
≈ 64-128 bytes (depends on implementation)
```

**Per Registered Object:**
```
Pointer storage in container ≈ 8 bytes
```

**Total for N objects of M types:**
```
Total ≈ (M types × singleton overhead) + (N objects × 8 bytes)
```

## Best Practices

### DO's

1. **Use for Thread-Lifetime Objects**
   ```cpp
   void* CreateThreadResource() {
       auto* resource = new Resource();
       G4AutoDelete::Register(resource);
       return resource;
   }
   ```

2. **Register at Thread Initialization**
   ```cpp
   void InitializeThread() {
       auto* cache = new Cache();
       G4AutoDelete::Register(cache);
   }
   ```

3. **Combine with Thread-Local Pointers**
   ```cpp
   Resource* GetResource() {
       static G4ThreadLocal Resource* res = nullptr;
       if (!res) {
           res = new Resource();
           G4AutoDelete::Register(res);
       }
       return res;
   }
   ```

4. **Document Automatic Cleanup**
   ```cpp
   // Creates thread-local cache, automatically deleted at thread exit
   Cache* cache = new Cache();
   G4AutoDelete::Register(cache);
   ```

### DON'Ts

1. **Don't Register Stack Objects**
   ```cpp
   // WRONG - stack object
   MyClass obj;
   G4AutoDelete::Register(&obj);  // CRASH at thread exit!
   ```

2. **Don't Register Same Object Twice**
   ```cpp
   // WRONG - double deletion
   auto* obj = new MyClass();
   G4AutoDelete::Register(obj);
   G4AutoDelete::Register(obj);  // DOUBLE DELETE at exit!
   ```

3. **Don't Use for Short-Lived Objects**
   ```cpp
   // WRONG - overhead not justified
   void ProcessEvent() {
       auto* temp = new TempData();
       G4AutoDelete::Register(temp);  // Use stack instead!
       // ... use temp ...
   }

   // CORRECT - stack allocation
   void ProcessEvent() {
       TempData temp;
       // Automatic cleanup at scope exit
   }
   ```

4. **Don't Register Objects with Thread-Local Members**
   ```cpp
   // WRONG
   class HasThreadLocal {
       G4ThreadLocal static int value;
   };
   auto* obj = new HasThreadLocal();
   G4AutoDelete::Register(obj);  // UNDEFINED BEHAVIOR
   ```

5. **Don't Mix with Manual Delete**
   ```cpp
   // WRONG
   auto* obj = new MyClass();
   G4AutoDelete::Register(obj);
   // ... later ...
   delete obj;  // DOUBLE DELETE at thread exit!
   ```

## Common Pitfalls

### Pitfall 1: Double Registration

```cpp
MyClass* obj = new MyClass();
G4AutoDelete::Register(obj);
G4AutoDelete::Register(obj);  // PROBLEM: Registered twice!

// At thread exit: delete obj; delete obj; → CRASH!
```

**Solution:** Register only once per object.

### Pitfall 2: Manual Delete After Registration

```cpp
MyClass* obj = new MyClass();
G4AutoDelete::Register(obj);

// ... later in code ...
delete obj;  // Manual delete

// At thread exit: delete obj; → CRASH! (already deleted)
```

**Solution:** Let G4AutoDelete handle deletion exclusively.

### Pitfall 3: Registering Non-Heap Objects

```cpp
void Function() {
    MyClass stackObj;
    G4AutoDelete::Register(&stackObj);  // WRONG!
}  // stackObj destroyed here

// At thread exit: delete &stackObj; → CRASH!
```

**Solution:** Only register heap-allocated objects (`new`).

### Pitfall 4: Accessing After Thread Exit

```cpp
G4ThreadLocal static MyClass* global = nullptr;

void Thread1() {
    global = new MyClass();
    G4AutoDelete::Register(global);
}  // Thread exits, global deleted

void Thread2() {
    global->Method();  // CRASH! Dangling pointer
}
```

**Solution:** Don't share pointers to auto-deleted objects across threads.

## Comparison with Alternatives

### vs. Stack Allocation

```cpp
// Stack allocation - simplest
void Function() {
    MyClass obj;  // Automatic cleanup at scope exit
}

// G4AutoDelete - for thread lifetime
void Function() {
    static G4ThreadLocal MyClass* obj = new MyClass();
    G4AutoDelete::Register(obj);  // Cleanup at thread exit
}
```

**Use G4AutoDelete when:** Object must persist beyond function scope.

### vs. std::unique_ptr

```cpp
// std::unique_ptr - modern C++
static G4ThreadLocal std::unique_ptr<MyClass> obj;
if (!obj) {
    obj = std::make_unique<MyClass>();
}

// G4AutoDelete - Geant4 style
static G4ThreadLocal MyClass* obj = nullptr;
if (!obj) {
    obj = new MyClass();
    G4AutoDelete::Register(obj);
}
```

**Use std::unique_ptr when:** Modern C++ preferred, automatic deletion at scope exit.

**Use G4AutoDelete when:** Geant4 conventions, thread-exit cleanup, compatibility with existing code.

### vs. Manual Deletion

```cpp
// Manual deletion - error-prone
static G4ThreadLocal MyClass* obj = nullptr;
if (!obj) {
    obj = new MyClass();
}
// PROBLEM: When to delete? Easy to forget!

// G4AutoDelete - automatic
static G4ThreadLocal MyClass* obj = nullptr;
if (!obj) {
    obj = new MyClass();
    G4AutoDelete::Register(obj);  // Automatic cleanup
}
```

**Use G4AutoDelete when:** Manual tracking is complex or error-prone.

## Advanced Usage

### Type-Safe Registration

```cpp
template<typename T, typename... Args>
T* CreateThreadLocal(Args&&... args) {
    static G4ThreadLocal T* instance = nullptr;
    if (!instance) {
        instance = new T(std::forward<Args>(args)...);
        G4AutoDelete::Register(instance);
    }
    return instance;
}

// Usage
auto* cache = CreateThreadLocal<PhysicsCache>(arg1, arg2);
auto* manager = CreateThreadLocal<ResourceManager>();
```

### Conditional Registration

```cpp
void RegisterIfNeeded(MyClass* obj, bool autoDelete) {
    if (autoDelete) {
        G4AutoDelete::Register(obj);
    } else {
        // Manual lifetime management
    }
}
```

### Multiple Objects Per Type

```cpp
void CreateMultiple() {
    for (int i = 0; i < 10; ++i) {
        auto* obj = new MyClass(i);
        G4AutoDelete::Register(obj);
    }
    // All 10 objects automatically deleted at thread exit
}
```

## See Also

- **G4ThreadLocalSingleton**: Underlying implementation for thread-local management
- **G4ThreadLocal**: Thread-local storage qualifier
- **G4Cache**: Alternative for thread-private data in shared objects
- **std::unique_ptr**: Modern C++ alternative for automatic deletion

## References

- Geant4 Multi-Threading Guide: Thread-Local Storage
- "Effective Modern C++" by Scott Meyers: Item 21 (Prefer std::make_unique and std::make_shared)
- RAII pattern documentation
