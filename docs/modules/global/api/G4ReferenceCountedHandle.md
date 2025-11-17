# G4ReferenceCountedHandle

## Overview

`G4ReferenceCountedHandle` is a **smart pointer** template class that provides automatic reference counting and memory management. It acts as a safe wrapper around raw pointers, automatically managing object lifetime by tracking the number of references and destroying the object when the count reaches zero.

**Source Locations:**
- Header: `/source/global/management/include/G4ReferenceCountedHandle.hh`
- Author: Radovan Chytracek (CERN), November 2001

**Key Concept:** This class implements the **reference counting** smart pointer pattern, similar to `std::shared_ptr` but optimized for Geant4's specific needs and integrated with `G4Allocator` for performance.

## Class Hierarchy

```
G4ReferenceCountedHandle<X>
    └── Contains G4CountedObject<X>*
            └── Contains X* (actual object)
                └── Contains reference count
```

## Key Features

- **Automatic Memory Management**: No manual delete required
- **Reference Counting**: Tracks number of handles to same object
- **Thread-Safe Allocation**: Uses G4Allocator for efficient memory allocation
- **Operator Overloading**: Provides pointer-like syntax (`->`, `*`, `()`)
- **Null-Safety**: Can represent null/invalid state
- **Copy Semantics**: Safe copying with automatic count management

## Design Pattern: Reference Counting

### Reference Count Lifecycle

```
Creation:
  Handle1 = new Object  →  RefCount = 1

Copy:
  Handle2 = Handle1     →  RefCount = 2
  Handle3 = Handle2     →  RefCount = 3

Destruction:
  Handle2 destroyed     →  RefCount = 2
  Handle1 destroyed     →  RefCount = 1
  Handle3 destroyed     →  RefCount = 0 → DELETE Object
```

### Memory Structure

```
G4ReferenceCountedHandle<MyClass> handle;
        ↓
    fObj points to
        ↓
G4CountedObject<MyClass>
    ├── fCount: 3        (reference count)
    └── fRep: MyClass*   (actual object)
            ↓
        MyClass instance
```

## G4ReferenceCountedHandle&lt;X&gt; API

### Type Safety

```cpp
template <class X>
class G4ReferenceCountedHandle {
    // X is the type of object being managed
};
```

### Constructors & Destructor

#### Default/Pointer Constructor
```cpp
inline G4ReferenceCountedHandle(X* rep = nullptr);
```
Constructs handle from raw pointer.

**Parameters:**
- `rep`: Pointer to object to manage (default: `nullptr`)

**Behavior:**
- If `rep != nullptr`: Creates new `G4CountedObject<X>` with count = 1
- If `rep == nullptr`: Handle is in null state

**Example:**
```cpp
// Null handle
G4ReferenceCountedHandle<MyClass> handle1;

// Handle managing new object
G4ReferenceCountedHandle<MyClass> handle2(new MyClass(args...));

// Direct construction
auto handle3 = G4ReferenceCountedHandle<MyClass>(new MyClass());
```

#### Copy Constructor
```cpp
inline G4ReferenceCountedHandle(const G4ReferenceCountedHandle<X>& right);
```
Copy constructor increments reference count.

**Behavior:**
- Shares underlying `G4CountedObject` with `right`
- Increments reference count by 1
- Both handles point to same object

**Example:**
```cpp
G4ReferenceCountedHandle<MyClass> handle1(new MyClass());
// handle1: RefCount = 1

G4ReferenceCountedHandle<MyClass> handle2(handle1);
// Both handles: RefCount = 2
```

#### Destructor
```cpp
inline ~G4ReferenceCountedHandle();
```
Decrements reference count, destroying object if count reaches zero.

**Behavior:**
```cpp
if (fObj != nullptr) {
    fObj->Release();  // Decrements count, deletes if zero
}
```

**Automatic Cleanup:**
- Reference count decremented
- If count becomes 0: Object and counted wrapper deleted
- If count > 0: Object remains alive

### Assignment Operators

#### Copy Assignment
```cpp
inline G4ReferenceCountedHandle<X>& operator=(
    const G4ReferenceCountedHandle<X>& right);
```
Assigns from another handle with proper reference counting.

**Behavior:**
1. If `this == &right`: No-op (self-assignment)
2. If different objects:
   - Release current object (may delete)
   - Share `right`'s object
   - Increment new object's count

**Example:**
```cpp
G4ReferenceCountedHandle<MyClass> h1(new MyClass());  // Object1, count=1
G4ReferenceCountedHandle<MyClass> h2(new MyClass());  // Object2, count=1

h2 = h1;
// Object2 deleted (count was 1, now 0)
// Object1 count = 2 (h1 and h2 both point to it)
```

#### Pointer Assignment
```cpp
inline G4ReferenceCountedHandle<X>& operator=(X* objPtr);
```
Assigns from raw pointer, replacing current object.

**Behavior:**
1. Release current object (may delete)
2. Create new `G4CountedObject` for `objPtr`
3. New count = 1

**Example:**
```cpp
G4ReferenceCountedHandle<MyClass> handle(new MyClass());  // Object1
handle = new MyClass();  // Object1 deleted, Object2 now managed
```

**Warning:** Creates new reference counting context. Multiple assignments of same raw pointer create separate counting contexts (typically incorrect usage).

### Access Operators

#### Dereference Operator
```cpp
inline X* operator->() const;
```
Provides pointer member access.

**Returns:** Pointer to managed object (`fObj->fRep`)

**Returns 0 if handle is null** - caller must ensure validity!

**Example:**
```cpp
G4ReferenceCountedHandle<MyClass> handle(new MyClass());
handle->SomeMethod();  // Calls MyClass::SomeMethod()

// DANGER: No null check!
G4ReferenceCountedHandle<MyClass> nullHandle;
nullHandle->SomeMethod();  // CRASH - undefined behavior
```

**Best Practice:** Always check validity before dereferencing.

#### Functor Operator
```cpp
inline X* operator()() const;
```
Returns raw pointer to managed object.

**Returns:** `fObj->fRep` if valid, `nullptr` otherwise

**Safe Alternative to ->:**
```cpp
G4ReferenceCountedHandle<MyClass> handle(new MyClass());
X* rawPtr = handle();  // Returns MyClass*

if (rawPtr != nullptr) {
    rawPtr->SomeMethod();  // Safe
}
```

#### Boolean Operators

##### Negation Operator
```cpp
inline G4bool operator!() const;
```
Tests if handle is null.

**Returns:** `true` if handle is null/invalid, `false` otherwise

**Example:**
```cpp
G4ReferenceCountedHandle<MyClass> handle;
if (!handle) {
    std::cout << "Handle is null!\n";
}
```

##### Bool Conversion Operator
```cpp
inline operator bool() const;
```
Tests if handle is valid.

**Returns:** `true` if handle is valid, `false` if null

**Example:**
```cpp
G4ReferenceCountedHandle<MyClass> handle(new MyClass());
if (handle) {
    std::cout << "Handle is valid!\n";
    handle->SomeMethod();  // Safe
}
```

### Reference Count Query

#### Count
```cpp
inline unsigned int Count() const;
```
Returns current reference count.

**Returns:**
- Number of handles sharing the object
- 0 if handle is null

**Use Case:** Debugging, testing, verification

**Example:**
```cpp
G4ReferenceCountedHandle<MyClass> h1(new MyClass());
std::cout << "Count: " << h1.Count() << "\n";  // Output: 1

{
    G4ReferenceCountedHandle<MyClass> h2 = h1;
    std::cout << "Count: " << h1.Count() << "\n";  // Output: 2
}
std::cout << "Count: " << h1.Count() << "\n";  // Output: 1
```

### Memory Allocation (Advanced)

#### operator new
```cpp
inline void* operator new(std::size_t);
```
Custom allocator using G4Allocator for efficient allocation.

**Warning:** Subclassing this class may break this implementation.

**Usage:** Automatic - called by C++ runtime

#### operator delete
```cpp
inline void operator delete(void* pObj);
```
Custom deallocator returning memory to G4Allocator pool.

**Usage:** Automatic - called by C++ runtime

**Note:** These operators integrate with G4Allocator for performance but are typically transparent to users.

## G4CountedObject&lt;X&gt; (Helper Class)

Internal class managing reference count and object ownership.

### Internal Structure

```cpp
template <class X>
class G4CountedObject {
    friend class G4ReferenceCountedHandle<X>;

private:
    unsigned int fCount;  // Reference count
    X* fRep;              // The actual object
};
```

### Methods (Private/Friend Access)

#### Constructor
```cpp
G4CountedObject(X* pObj = nullptr);
```
Initializes with object pointer, sets count to 1 if non-null.

#### Destructor
```cpp
~G4CountedObject();
```
Deletes the managed object (`delete fRep`).

#### AddRef
```cpp
inline void AddRef();
```
Increments reference count (`++fCount`).

#### Release
```cpp
inline void Release();
```
Decrements reference count, deletes self if count reaches zero.

```cpp
if (--fCount == 0) {
    delete this;  // Destroys G4CountedObject and managed object
}
```

## Usage Patterns

### Basic Usage

```cpp
// 1. Create handle with new object
G4ReferenceCountedHandle<MyClass> handle(new MyClass(arg1, arg2));

// 2. Use like a pointer
handle->Method();
int value = handle()->GetValue();

// 3. Copy handle (shares object)
G4ReferenceCountedHandle<MyClass> handle2 = handle;

// 4. Handles go out of scope - automatic cleanup
```

### Null Handle Pattern

```cpp
G4ReferenceCountedHandle<MyClass> handle;  // Null handle

// Check before use
if (!handle) {
    std::cout << "Handle is null, creating object...\n";
    handle = new MyClass();
}

// Or use bool conversion
if (handle) {
    handle->DoSomething();
}
```

### Shared Ownership Pattern

```cpp
class Container {
    G4ReferenceCountedHandle<Resource> resource;

public:
    void SetResource(G4ReferenceCountedHandle<Resource> res) {
        resource = res;  // Share ownership
    }

    G4ReferenceCountedHandle<Resource> GetResource() {
        return resource;  // Return copy - increments count
    }
};

// Usage
auto resource = G4ReferenceCountedHandle<Resource>(new Resource());
// Count = 1

Container c1, c2;
c1.SetResource(resource);  // Count = 2
c2.SetResource(resource);  // Count = 3

auto r = c1.GetResource();  // Count = 4

// All containers and handles share same Resource object
```

### Transfer Ownership Pattern

```cpp
G4ReferenceCountedHandle<MyClass> CreateObject() {
    // Create object
    auto obj = G4ReferenceCountedHandle<MyClass>(new MyClass());

    // Do initialization...
    obj->Initialize();

    return obj;  // Transfer ownership to caller
}

// Usage
auto handle = CreateObject();  // Object created and returned
// Count = 1 (only caller owns it)
```

### Polymorphic Usage

```cpp
class Base {
public:
    virtual ~Base() = default;
    virtual void Action() = 0;
};

class Derived : public Base {
public:
    void Action() override { /* ... */ }
};

// Can use handles with polymorphism
G4ReferenceCountedHandle<Base> handle(new Derived());
handle->Action();  // Calls Derived::Action()
```

## Thread Safety

### Thread Safety Model

**G4ReferenceCountedHandle is NOT thread-safe for concurrent access:**
- Reference counting operations are **not atomic**
- Concurrent modifications to same handle from multiple threads = **race condition**
- Concurrent copies of same handle = **corrupted reference count**

### Safe Multi-Threading Patterns

#### Pattern 1: Thread-Local Handles
```cpp
// Each thread gets its own handle
void WorkerThread(MyClass* sharedObject) {
    G4ThreadLocal static G4ReferenceCountedHandle<MyClass> handle;

    if (!handle) {
        handle = new MyClass(*sharedObject);  // Thread-local copy
    }

    handle->ProcessInThread();
}
```

#### Pattern 2: No Sharing Across Threads
```cpp
// Thread 1
{
    G4ReferenceCountedHandle<MyClass> h1(new MyClass());
    h1->DoWork();
}

// Thread 2 (separate object)
{
    G4ReferenceCountedHandle<MyClass> h2(new MyClass());
    h2->DoWork();
}
// No sharing - thread-safe by isolation
```

#### Pattern 3: Synchronize Access
```cpp
G4Mutex handleMutex = G4MUTEX_INITIALIZER;
G4ReferenceCountedHandle<MyClass> sharedHandle(new MyClass());

void ThreadSafeAccess() {
    G4AutoLock lock(&handleMutex);
    auto localCopy = sharedHandle;  // Protected copy
    lock.unlock();

    localCopy->DoWork();  // Use local copy
}
```

### Why Not Atomic?

For maximum performance in single-threaded or thread-local contexts:
- No atomic operation overhead
- Simple increment/decrement
- Cache-friendly operations

**Alternative:** Use `std::shared_ptr` for thread-safe reference counting (atomic operations), but at performance cost.

## Performance Characteristics

### Memory Overhead

**Per Handle:**
```cpp
sizeof(G4ReferenceCountedHandle<X>) = sizeof(G4CountedObject<X>*)
                                     ≈ 8 bytes (64-bit pointer)
```

**Per Shared Object:**
```cpp
sizeof(G4CountedObject<X>) = sizeof(unsigned int) +  // fCount (~4 bytes)
                             sizeof(X*) +            // fRep (~8 bytes)
                             padding                 // ~4 bytes
                           ≈ 16 bytes
```

**Total Overhead:**
- First handle: `sizeof(Handle) + sizeof(CountedObject) ≈ 24 bytes`
- Additional handles: `sizeof(Handle) ≈ 8 bytes` each

### Time Complexity

| Operation | Complexity | Cost |
|-----------|------------|------|
| Constructor (null) | O(1) | Minimal |
| Constructor (pointer) | O(1) | Allocate CountedObject |
| Copy constructor | O(1) | Increment count |
| Destructor | O(1) | Decrement count (+delete if zero) |
| Assignment | O(1) | Decrement old, increment new |
| operator-> | O(1) | Dereference |
| Count() | O(1) | Read integer |

### Performance vs Raw Pointers

**Advantages:**
- Automatic memory management (no manual delete)
- Prevent leaks and dangling pointers
- Share ownership safely

**Overhead:**
- Extra memory (16 bytes per object + 8 bytes per handle)
- Extra indirection (handle → counted object → actual object)
- Reference count operations

**When to Use:**
- Complex ownership semantics
- Shared resources
- Error-prone manual management

**When NOT to Use:**
- Simple local variables (use stack allocation)
- Clear single ownership (use std::unique_ptr or raw pointer + manual delete)
- Performance-critical tight loops (consider raw pointers with careful management)

## Best Practices

### DO's

1. **Initialize on Construction**: Create with object immediately
   ```cpp
   G4ReferenceCountedHandle<MyClass> h(new MyClass());
   ```

2. **Check Before Dereferencing**: Use `operator!()` or `operator bool()`
   ```cpp
   if (handle) {
       handle->Method();
   }
   ```

3. **Pass by Value for Sharing**: Copies increment reference count
   ```cpp
   void ShareResource(G4ReferenceCountedHandle<Resource> resource) {
       // resource is shared
   }
   ```

4. **Pass by const& for Non-Owning**: Don't change reference count
   ```cpp
   void UseResource(const G4ReferenceCountedHandle<Resource>& resource) {
       // No copy, no count change
   }
   ```

5. **Return by Value**: Safe transfer of ownership
   ```cpp
   G4ReferenceCountedHandle<MyClass> Factory() {
       return G4ReferenceCountedHandle<MyClass>(new MyClass());
   }
   ```

### DON'Ts

1. **Don't Use 'new' on Handle**: Exchange by reference, never dynamically allocate
   ```cpp
   // WRONG
   auto* handle = new G4ReferenceCountedHandle<MyClass>(new MyClass());

   // CORRECT
   G4ReferenceCountedHandle<MyClass> handle(new MyClass());
   ```

2. **Don't Dereference Without Checking**:
   ```cpp
   // WRONG
   G4ReferenceCountedHandle<MyClass> h;
   h->Method();  // CRASH

   // CORRECT
   if (h) h->Method();
   ```

3. **Don't Share Raw Pointer Across Multiple Handles**:
   ```cpp
   // WRONG - creates separate reference counts
   MyClass* raw = new MyClass();
   G4ReferenceCountedHandle<MyClass> h1(raw);
   G4ReferenceCountedHandle<MyClass> h2(raw);  // DOUBLE DELETE!

   // CORRECT - copy handles
   G4ReferenceCountedHandle<MyClass> h1(new MyClass());
   G4ReferenceCountedHandle<MyClass> h2 = h1;  // Shared ownership
   ```

4. **Don't Delete Managed Object Manually**:
   ```cpp
   // WRONG
   G4ReferenceCountedHandle<MyClass> h(new MyClass());
   delete h();  // DOUBLE DELETE when handle destroyed!

   // CORRECT - let handle manage lifetime
   G4ReferenceCountedHandle<MyClass> h(new MyClass());
   // Automatic deletion when last handle destroyed
   ```

5. **Don't Share Across Threads Without Synchronization**:
   ```cpp
   // WRONG - race condition
   G4ReferenceCountedHandle<MyClass> global;
   // Multiple threads accessing global

   // CORRECT - thread-local or synchronized
   G4ThreadLocal static G4ReferenceCountedHandle<MyClass> local;
   ```

## Common Pitfalls

### Pitfall 1: Circular References

```cpp
class Node {
public:
    G4ReferenceCountedHandle<Node> next;
};

// PROBLEM: Circular reference leak
G4ReferenceCountedHandle<Node> n1(new Node());
G4ReferenceCountedHandle<Node> n2(new Node());
n1->next = n2;  // n2 count = 2
n2->next = n1;  // n1 count = 2
// When n1, n2 go out of scope, counts become 1 each
// Objects never deleted! MEMORY LEAK
```

**Solution:** Use weak references or raw pointers for back-references.

### Pitfall 2: Premature Destruction

```cpp
MyClass* GetRawPointer() {
    G4ReferenceCountedHandle<MyClass> temp(new MyClass());
    return temp();  // DANGER!
}
// temp destroyed, object deleted
// Returned pointer is dangling!
```

**Solution:** Return handle, not raw pointer.

### Pitfall 3: Double Wrapping

```cpp
MyClass* raw = new MyClass();
G4ReferenceCountedHandle<MyClass> h1(raw);
G4ReferenceCountedHandle<MyClass> h2(raw);  // WRONG! Two separate counts
// When h1 destroyed: deletes object
// When h2 destroyed: double delete! CRASH
```

**Solution:** Never create multiple handles from same raw pointer.

## Comparison with std::shared_ptr

| Feature | G4ReferenceCountedHandle | std::shared_ptr |
|---------|-------------------------|-----------------|
| Reference counting | Yes | Yes |
| Thread-safe counting | No | Yes (atomic) |
| Custom allocator | Yes (G4Allocator) | Possible |
| Weak pointers | No | Yes (std::weak_ptr) |
| Custom deleters | No | Yes |
| Null safety | Manual check | Manual check |
| Overhead | Lower | Higher (atomic ops) |
| Standard library | No | Yes (C++11+) |

**When to Use G4ReferenceCountedHandle:**
- Geant4-specific code
- Single-threaded or thread-local ownership
- Performance-critical (avoid atomic overhead)

**When to Use std::shared_ptr:**
- Modern C++ code
- Thread-safe sharing required
- Need weak_ptr support
- Interoperability with standard library

## See Also

- **G4Allocator**: Efficient memory allocation for handles
- **G4CountedObject**: Internal counted object wrapper
- **std::shared_ptr**: Standard library alternative (thread-safe)
- **std::unique_ptr**: For exclusive ownership

## References

- "Effective C++" by Scott Meyers: Item 13-17 (Resource Management)
- "More Effective C++" by Scott Meyers: Item 28-29 (Smart Pointers)
- C++11 std::shared_ptr documentation
