# G4AllocatorPool

## Overview

`G4AllocatorPool` is the **low-level memory pool implementation** that powers `G4Allocator`. It manages pre-allocated memory chunks organized as a linked list, providing O(1) allocation and deallocation operations. This class implements the core memory management strategy that makes Geant4's object allocation extremely fast.

**Source Locations:**
- Header: `/source/global/management/include/G4AllocatorPool.hh`
- Implementation: `/source/global/management/src/G4AllocatorPool.cc`
- Author: G.Cosmo (CERN), November 2000

**Design Inspiration:** Implementation derived from B. Stroustrup's "The C++ Programming Language", Third Edition.

## Key Features

- **Fixed-Size Allocation**: All elements in a pool have the same size
- **Chunk-Based Growth**: Allocates memory in chunks (pages) as needed
- **Free List Management**: Maintains linked list of free slots for O(1) allocation
- **Adaptive Sizing**: Chunk size adapts to object size (small vs large objects)
- **No Per-Object Overhead**: Minimal memory overhead compared to heap allocation

## Memory Organization

### Chunk Size Strategy

```cpp
// Constructor determines chunk size
G4AllocatorPool(unsigned int sz) :
    esize(sz < sizeof(G4PoolLink) ? sizeof(G4PoolLink) : sz),
    csize(sz < 1024/2 - 16 ? 1024 - 16 : sz * 10 - 16)
```

**Element Size (`esize`):**
- Minimum: `sizeof(G4PoolLink)` (pointer size, typically 8 bytes)
- Actual: `max(sz, sizeof(G4PoolLink))`

**Chunk Size (`csize`):**
- **Small objects** (sz < 496 bytes): 1008 bytes per chunk
- **Large objects** (sz >= 496 bytes): 10 × sz - 16 bytes per chunk
- The `-16` accounts for chunk overhead

**Rationale:**
- Small objects: Fixed 1KB chunks minimize waste and improve cache locality
- Large objects: Proportional chunks (10x) reduce allocation frequency

### Internal Structures

#### G4PoolLink
```cpp
struct G4PoolLink {
    G4PoolLink* next;  // Pointer to next free slot
};
```
Used to link free memory slots within and across chunks. Each free slot contains a pointer to the next free slot.

#### G4PoolChunk
```cpp
class G4PoolChunk {
public:
    explicit G4PoolChunk(unsigned int sz);
    ~G4PoolChunk();

    const unsigned int size;  // Chunk size in bytes
    char* mem;                // Allocated memory
    G4PoolChunk* next;        // Next chunk in list
};
```
Represents a single memory page (chunk). Chunks are linked together to form the pool.

### Memory Layout

```
Pool Structure:
┌─────────────┐
│ G4AllocatorPool │
├─────────────┤
│ esize       │ ← Element size
│ csize       │ ← Chunk size
│ chunks   ───┼──→ [Chunk 3] → [Chunk 2] → [Chunk 1] → nullptr
│ head     ───┼──→ Free slot
│ nchunks     │ ← Number of chunks
└─────────────┘

Chunk Layout (example: 4 elements):
┌──────────────────────────────┐
│ Chunk Header                  │
├──────────────────────────────┤
│ Element 1 │ → │ Element 2 │  │
├──────────────────────────────┤
│ Element 3 │ → │ Element 4 │→ │ next chunk's first element
└──────────────────────────────┘
  ↑ head points here when all elements are free
```

## API Reference

### Constructor & Destructor

#### G4AllocatorPool (Constructor)
```cpp
explicit G4AllocatorPool(unsigned int n = 0);
```
Creates a memory pool for elements of size `n` bytes.

**Parameters:**
- `n`: Size of elements in bytes (0 uses default)

**Initialization:**
- Element size set to `max(n, sizeof(G4PoolLink))`
- Chunk size calculated based on element size
- No memory allocated until first `Alloc()` call

**Example:**
```cpp
G4AllocatorPool pool(sizeof(MyClass));  // Pool for MyClass objects
```

#### ~G4AllocatorPool (Destructor)
```cpp
~G4AllocatorPool();
```
Destructor returns all storage to the free store by calling `Reset()`.

**Cleanup:**
- Deletes all allocated chunks
- Frees all memory back to the system

### Copy Operations

#### Copy Constructor
```cpp
G4AllocatorPool(const G4AllocatorPool& right) = default;
```
Default copy constructor (shallow copy of pointers).

**Warning:** Typically not used in practice. Both pools would share chunks, leading to undefined behavior.

#### Assignment Operator
```cpp
G4AllocatorPool& operator=(const G4AllocatorPool& right);
```
Assigns pool state from `right`.

**Behavior:**
- Copies `chunks`, `head`, and `nchunks` pointers
- Shallow copy - both pools share memory
- **Not recommended** for typical usage

### Primary Allocation Methods

#### Alloc
```cpp
inline void* Alloc();
```
Allocates one element from the pool. **This is the hot path** for allocation.

**Returns:** Pointer to uninitialized memory of size `esize`.

**Algorithm:**
```cpp
if (head == nullptr) {
    Grow();  // Allocate new chunk
}
G4PoolLink* p = head;      // Get first free slot
head = p->next;            // Update free list head
return p;                  // Return slot
```

**Performance:** O(1) - constant time operation

**Example:**
```cpp
void* ptr = pool.Alloc();
MyClass* obj = new (ptr) MyClass(args...);  // Placement new
```

#### Free
```cpp
inline void Free(void* b);
```
Returns an element back to the pool. **This is the hot path** for deallocation.

**Parameters:**
- `b`: Pointer previously returned by `Alloc()`

**Algorithm:**
```cpp
G4PoolLink* p = static_cast<G4PoolLink*>(b);
p->next = head;    // Link to current free list
head = p;          // Make this the new head
```

**Performance:** O(1) - constant time operation

**Critical:** Does **not** call destructor. Caller must do this explicitly.

**Example:**
```cpp
obj->~MyClass();     // Explicit destructor
pool.Free(obj);      // Return to pool
```

### Memory Management

#### Reset
```cpp
void Reset();
```
Returns all allocated storage to the free store. Destroys all chunks and resets pool to initial state.

**Effects:**
- Deletes all `G4PoolChunk` objects
- Sets `head = nullptr`
- Sets `chunks = nullptr`
- Sets `nchunks = 0`

**Warning:** All memory contents are lost. Only call when certain no objects are in use.

**Implementation:**
```cpp
void G4AllocatorPool::Reset() {
    G4PoolChunk* n = chunks;
    G4PoolChunk* p = nullptr;
    while (n != nullptr) {
        p = n;
        n = n->next;
        delete p;  // Frees chunk memory
    }
    head = nullptr;
    chunks = nullptr;
    nchunks = 0;
}
```

### Query Methods

#### Size
```cpp
inline unsigned int Size() const;
```
Returns total allocated memory size in bytes.

**Formula:** `nchunks × csize`

**Returns:** Total bytes allocated (not bytes in use)

**Example:**
```cpp
std::cout << "Pool allocated: " << pool.Size() << " bytes\n";
// Output might be: Pool allocated: 3024 bytes (3 chunks × 1008 bytes)
```

#### GetNoPages
```cpp
inline int GetNoPages() const;
```
Returns the total number of allocated chunks (pages).

**Returns:** Value of `nchunks`

#### GetPageSize
```cpp
inline unsigned int GetPageSize() const;
```
Returns the current chunk size in bytes.

**Returns:** Value of `csize`

#### GrowPageSize
```cpp
inline void GrowPageSize(unsigned int factor);
```
Increases the chunk size by multiplying by `factor`.

**Parameters:**
- `factor`: Multiplier for page size (0 means no change)

**Formula:** `csize = (factor != 0) ? factor × csize : csize`

**Usage:** Call **before** any allocations to tune pool for expected load.

**Example:**
```cpp
pool.GrowPageSize(5);  // 5x larger chunks
// Small object pool: 1008 → 5040 bytes per chunk
// Large object pool: (sz × 10) → (sz × 50) bytes per chunk
```

### Growth Method (Private)

#### Grow
```cpp
void Grow();
```
Allocates a new chunk and links it to the pool. Called automatically by `Alloc()` when the free list is empty.

**Algorithm:**
```cpp
1. Allocate new G4PoolChunk of size csize
2. Link chunk to existing chunks list
3. Increment nchunks counter
4. Calculate number of elements in chunk: nelem = csize / esize
5. Initialize chunk as linked list of free slots
6. Set head to first element in new chunk
```

**Implementation Detail:**
```cpp
void G4AllocatorPool::Grow() {
    auto* n = new G4PoolChunk(csize);
    n->next = chunks;
    chunks = n;
    ++nchunks;

    const int nelem = csize / esize;
    char* start = n->mem;
    char* last = &start[(nelem - 1) * esize];

    // Link elements in chunk
    for (char* p = start; p < last; p += esize) {
        reinterpret_cast<G4PoolLink*>(p)->next =
            reinterpret_cast<G4PoolLink*>(p + esize);
    }
    reinterpret_cast<G4PoolLink*>(last)->next = nullptr;
    head = reinterpret_cast<G4PoolLink*>(start);
}
```

## Performance Characteristics

### Time Complexity

| Operation | Best Case | Worst Case | Average |
|-----------|-----------|------------|---------|
| `Alloc()` | O(1) | O(n)* | O(1) |
| `Free()` | O(1) | O(1) | O(1) |
| `Reset()` | O(m) | O(m) | O(m) |
| `Grow()` | O(n) | O(n) | O(n) |

*n = elements per chunk, m = number of chunks

**Notes:**
- `Alloc()` is O(n) only when growing (amortized O(1))
- `Grow()` is called infrequently (once per chunk)

### Space Complexity

**Per-Pool Overhead:**
```cpp
sizeof(G4AllocatorPool) =
    sizeof(esize) +      // ~4 bytes
    sizeof(csize) +      // ~4 bytes
    sizeof(chunks) +     // ~8 bytes (pointer)
    sizeof(head) +       // ~8 bytes (pointer)
    sizeof(nchunks)      // ~4 bytes
    ≈ 28 bytes
```

**Per-Chunk Overhead:**
```cpp
sizeof(G4PoolChunk) =
    sizeof(size) +       // ~4 bytes
    sizeof(mem) +        // ~8 bytes (pointer)
    sizeof(next)         // ~8 bytes (pointer)
    ≈ 20 bytes
```

**Per-Element Overhead:**
- **While Free:** 0 bytes (uses element space for linking)
- **While Allocated:** 0 bytes (no bookkeeping)

**Total Memory:**
```
Total = Pool Overhead + (Chunks × (Chunk Overhead + Chunk Size))
      ≈ 28 + nchunks × (20 + csize)
```

### Memory Efficiency

**Example:** Pool for 100-byte objects

**std::allocator (typical):**
- Per-object overhead: ~16-32 bytes
- Total for 1000 objects: ~116,000 - 132,000 bytes

**G4AllocatorPool:**
- Chunk size: 1008 bytes
- Elements per chunk: 10 (1008 / 100)
- Chunks for 1000 objects: 100
- Total memory: 28 + 100 × (20 + 1008) ≈ 102,828 bytes
- **Savings: ~10-25%**

## Memory Allocation Pattern

### Allocation Lifecycle

```
Initial State:
  head = nullptr
  chunks = nullptr
  nchunks = 0

First Alloc():
  ↓
Grow() called
  ↓
Chunk 1 allocated (1008 bytes for small objects)
  ↓
Chunk 1 initialized as linked list (10 elements × 100 bytes)
  ↓
head → Element 1 → Element 2 → ... → Element 10 → nullptr
  ↓
Return Element 1, head → Element 2

Subsequent Alloc() calls:
  ↓
Return Element 2, head → Element 3
Return Element 3, head → Element 4
...
Return Element 10, head → nullptr
  ↓
Grow() called (chunk exhausted)
  ↓
Chunk 2 allocated and linked
  ↓
Return Element 1 from Chunk 2...
```

### Free List Management

```
After allocating all elements from 2 chunks:
  head → nullptr
  All elements in use

Free(Element 5 from Chunk 1):
  head → Element 5 → nullptr

Free(Element 3 from Chunk 2):
  head → Element 3 → Element 5 → nullptr

Next Alloc() returns Element 3 (most recently freed)
  head → Element 5 → nullptr
```

**Strategy:** LIFO (Last-In-First-Out) free list
**Benefit:** Excellent cache locality - recently freed objects likely still in cache

## Thread Safety

### Thread Safety Model

**G4AllocatorPool is NOT thread-safe:**
- No internal locking or synchronization
- Concurrent `Alloc()`/`Free()` calls will corrupt free list
- Must be protected by external synchronization OR
- Use separate pool instance per thread

### Safe Multi-Threading Pattern

```cpp
// Pattern 1: Thread-local pool
G4ThreadLocal static G4AllocatorPool* pool = nullptr;
if (pool == nullptr) {
    pool = new G4AllocatorPool(sizeof(MyClass));
}
void* ptr = pool->Alloc();  // Safe - thread-local

// Pattern 2: Mutex protection (not recommended - defeats performance)
G4Mutex poolMutex = G4MUTEX_INITIALIZER;
G4AutoLock lock(&poolMutex);
void* ptr = globalPool->Alloc();  // Safe but slow
```

**Recommendation:** Always use Pattern 1 (thread-local pools)

## Usage in G4Allocator

`G4AllocatorPool` is used as a member variable in `G4Allocator`:

```cpp
template <class Type>
class G4Allocator : public G4AllocatorBase {
    // ...
    G4AllocatorPool mem;  // Pool of elements of sizeof(Type)
};
```

**Initialization:**
```cpp
template <class Type>
G4Allocator<Type>::G4Allocator() throw()
    : mem(sizeof(Type))  // Initialize pool with element size
{
    tname = typeid(Type).name();
}
```

**Delegation:**
```cpp
template <class Type>
Type* G4Allocator<Type>::MallocSingle() {
    return static_cast<Type*>(mem.Alloc());
}

template <class Type>
void G4Allocator<Type>::FreeSingle(Type* anElement) {
    mem.Free(anElement);
}
```

## Best Practices

### DO's

1. **Use Through G4Allocator**: Don't use `G4AllocatorPool` directly in application code
2. **Thread-Local Instances**: Create separate pool per thread for thread safety
3. **Consistent Element Size**: All allocations from a pool must be same size
4. **Reset Between Runs**: Call `Reset()` only when safe (e.g., end of run)

### DON'Ts

1. **Don't Share Across Threads**: No built-in synchronization
2. **Don't Mix Sizes**: Pool optimized for single element size
3. **Don't Reset During Use**: Will corrupt active object memory
4. **Don't Rely on Freed Memory**: Contents undefined after `Free()`

### Memory Leak Prevention

```cpp
// WRONG: Lost reference to pool
{
    G4AllocatorPool pool(100);
    void* ptr = pool.Alloc();
    // ... use ptr ...
}  // pool destroyed, but ptr memory leaked!

// CORRECT: Free before destruction
{
    G4AllocatorPool pool(100);
    void* ptr = pool.Alloc();
    // ... use ptr ...
    pool.Free(ptr);  // Return to pool
}  // pool destroyed cleanly

// BETTER: Use Reset() to clean up
{
    G4AllocatorPool pool(100);
    void* ptr = pool.Alloc();
    // ... use ptr ...
    pool.Reset();  // Frees all chunks
}
```

## Performance Tuning

### Chunk Size Optimization

**Default behavior** works well for most cases, but you can tune:

```cpp
// Before any allocations
G4AllocatorPool pool(sizeof(MyClass));

// For applications with many objects
pool.GrowPageSize(10);  // 10x larger chunks
// Reduces allocation frequency at cost of memory

// For applications with few objects
pool.GrowPageSize(1);   // Keep default
// Minimizes memory waste
```

### Monitoring Memory Usage

```cpp
void ReportPoolStatistics(G4AllocatorPool& pool) {
    std::cout << "Pool Statistics:\n";
    std::cout << "  Total allocated: " << pool.Size() << " bytes\n";
    std::cout << "  Number of chunks: " << pool.GetNoPages() << "\n";
    std::cout << "  Chunk size: " << pool.GetPageSize() << " bytes\n";

    unsigned int avgElementsPerChunk = pool.GetPageSize() / elementSize;
    std::cout << "  Elements per chunk: " << avgElementsPerChunk << "\n";
    std::cout << "  Max elements allocated: "
              << pool.GetNoPages() * avgElementsPerChunk << "\n";
}
```

## Common Pitfalls

### Double Free
```cpp
// WRONG: Double free corrupts free list
void* ptr = pool.Alloc();
pool.Free(ptr);
pool.Free(ptr);  // CORRUPTION! ptr already in free list

// CORRECT: Free only once
void* ptr = pool.Alloc();
pool.Free(ptr);
// Don't use ptr again
```

### Use After Free
```cpp
// WRONG: Use after free - undefined behavior
void* ptr = pool.Alloc();
MyClass* obj = new (ptr) MyClass();
pool.Free(ptr);
obj->method();  // CRASH! Memory may be reused

// CORRECT: Don't use after free
void* ptr = pool.Alloc();
MyClass* obj = new (ptr) MyClass();
obj->method();
obj->~MyClass();
pool.Free(ptr);
// Don't touch obj anymore
```

### Freeing Wrong Pointer
```cpp
// WRONG: Free pointer from different source
void* ptr = pool.Alloc();
MyClass* obj = new MyClass();  // Heap allocation
pool.Free(obj);  // CORRUPTION! Not from pool

// CORRECT: Only free pool-allocated memory
void* ptr = pool.Alloc();
pool.Free(ptr);  // OK - from same pool
```

## See Also

- **G4Allocator**: Template wrapper providing type-safe interface
- **G4AllocatorList**: Registry for managing multiple allocators
- **G4Track, G4Step**: Example usage in performance-critical classes

## References

- B. Stroustrup, "The C++ Programming Language", Third Edition, Section 19.4.2
- Geant4 Application Developer Guide: Memory Management
