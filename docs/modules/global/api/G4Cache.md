# G4Cache

## Overview

`G4Cache` is a **thread-safe caching** template class designed for Geant4 multi-threading. It enables shared class instances to store thread-private data members safely. Each thread accessing a cached value gets its own independent copy, eliminating race conditions while maintaining object-oriented design.

**Source Locations:**
- Header: `/source/global/management/include/G4Cache.hh`
- Helper: `/source/global/management/include/G4CacheDetails.hh` (implementation details)
- Author: A.Dotti, 21 October 2013

**Key Concept:** Thread-local storage within shared objects - solving the problem of per-thread state in globally accessible instances.

## Problem Statement

In multi-threaded Geant4 simulations, you often have:
- **Shared objects** accessed by all threads (e.g., geometry, physics tables)
- **Need for thread-private data** within these shared objects (e.g., caches, temporary calculations)

**Without G4Cache:**
```cpp
class G4Shared {
    G4double cache;  // PROBLEM: Shared by all threads - race condition!

    void Compute() {
        cache = ExpensiveCalculation();  // Data race!
        return cache * 2;
    }
};
```

**With G4Cache:**
```cpp
class G4Shared {
    G4Cache<G4double> cache;  // SOLUTION: Each thread has its own cache!

    void Compute() {
        G4double c = cache.Get();
        c = ExpensiveCalculation();
        cache.Put(c);  // Thread-safe
        return c * 2;
    }
};
```

## Class Family

### G4Cache&lt;VALTYPE&gt;

Base template for thread-private scalar values.

```cpp
template <class VALTYPE>
class G4Cache {
    // Thread-private storage of single value
};
```

### G4VectorCache&lt;VALTYPE&gt;

Extends G4Cache for vector-like collections.

```cpp
template <class VALTYPE>
class G4VectorCache : public G4Cache<std::vector<VALTYPE>> {
    // Thread-private vector with std::vector interface
};
```

### G4MapCache&lt;KEYTYPE, VALTYPE&gt;

Extends G4Cache for map-like collections.

```cpp
template <class KEYTYPE, class VALTYPE>
class G4MapCache : public G4Cache<std::map<KEYTYPE, VALTYPE>> {
    // Thread-private map with std::map interface
};
```

## G4Cache&lt;VALTYPE&gt; API

### Type Definitions

```cpp
template <class VALTYPE>
class G4Cache {
public:
    using value_type = VALTYPE;
    // ...
};
```

### Constructors & Destructor

#### Default Constructor
```cpp
G4Cache();
```
Creates empty cache. Each thread will have uninitialized value initially.

**Example:**
```cpp
class MyClass {
    G4Cache<G4double> threadCache;  // Each thread gets separate G4double
};
```

#### Value Constructor
```cpp
G4Cache(const value_type& v);
```
Creates cache initialized with value `v` for the calling thread.

**Parameters:**
- `v`: Initial value for current thread's cache

**Example:**
```cpp
class MyClass {
    G4Cache<G4int> counter;

    MyClass() : counter(0) {  // Initialize to 0
        // Each thread starts with counter = 0
    }
};
```

#### Copy Constructor
```cpp
G4Cache(const G4Cache& rhs);
```
Copies the **value** from `rhs` in current thread, not the entire cache structure.

**Behavior:**
- Gets value from `rhs` for current thread
- Creates new cache with that value
- Does NOT share thread-local storage with `rhs`

**Example:**
```cpp
G4Cache<G4double> cache1(3.14);
G4Cache<G4double> cache2(cache1);  // cache2 gets value 3.14 for this thread
```

#### Destructor
```cpp
virtual ~G4Cache();
```
Cleans up thread-local storage for this cache.

**Thread Safety Note:** Destructor handles cleanup even if threads exit before object destruction.

### Primary Access Methods

#### Get
```cpp
inline value_type& Get() const;
```
Returns reference to this thread's cached value.

**Returns:** Reference to thread-local value (mutable via reference)

**Thread Safety:** Each thread gets its own independent value

**Example:**
```cpp
G4Cache<G4double> cache;
G4double& value = cache.Get();
value = 42.0;  // Sets value for THIS thread only

// Different thread
G4double& otherValue = cache.Get();  // Different value!
```

#### Put
```cpp
inline void Put(const value_type& val) const;
```
Sets this thread's cached value.

**Parameters:**
- `val`: Value to store in current thread's cache

**Example:**
```cpp
G4Cache<G4double> cache;
cache.Put(3.14);  // Set for this thread

// Can also use Get() for modification
cache.Get() = 2.71;  // Equivalent for simple types
```

#### Pop
```cpp
inline value_type Pop();
```
Returns a **copy** of the current thread's cached value.

**Returns:** Copy of value (not reference)

**Use Case:** When you need a copy rather than reference

**Example:**
```cpp
G4Cache<G4ThreeVector> cache;
cache.Put(G4ThreeVector(1,2,3));

G4ThreeVector copy = cache.Pop();  // Copy of (1,2,3)
copy.setX(999);  // Doesn't affect cached value
```

### Assignment Operator

```cpp
G4Cache& operator=(const G4Cache& rhs);
```
Copies value from `rhs` for current thread.

**Behavior:** Same as copy constructor - copies value, not cache structure.

## Thread-Local Storage Mechanism

### Internal Implementation

```cpp
template <class V>
class G4Cache {
private:
    G4int id;  // Unique cache ID
    mutable G4CacheReference<value_type> theCache;  // Thread-local storage

    value_type& GetCache() const {
        theCache.Initialize(id);
        return theCache.GetCache(id);
    }
};
```

### How It Works

1. **Unique ID**: Each cache instance gets unique ID
2. **G4CacheReference**: Manages thread-local storage map
3. **Initialize**: Creates entry for current thread if needed
4. **GetCache**: Returns reference to thread's value

### Per-Thread Storage

```
Cache Instance (Shared by all threads)
    ├── id: 42
    └── theCache: G4CacheReference
            ├── Thread 1: value1
            ├── Thread 2: value2
            ├── Thread 3: value3
            └── ...

Each thread accessing cache.Get() gets its own value
```

## G4VectorCache&lt;VALTYPE&gt; API

Vector-like cache providing std::vector interface with thread-local storage.

### Type Definitions

```cpp
template <class VALTYPE>
class G4VectorCache : public G4Cache<std::vector<VALTYPE>> {
public:
    using value_type = VALTYPE;
    using vector_type = std::vector<value_type>;
    using size_type = typename vector_type::size_type;
    using iterator = typename vector_type::iterator;
    using const_iterator = typename vector_type::const_iterator;
};
```

### Constructors

#### Default Constructor
```cpp
G4VectorCache();
```
Creates empty vector cache.

#### Sized Constructor
```cpp
G4VectorCache(G4int nElems);
```
Creates vector cache with `nElems` default-constructed elements.

**Example:**
```cpp
G4VectorCache<G4double> cache(100);  // Each thread gets vector of 100 doubles
```

#### Array Constructor
```cpp
G4VectorCache(G4int nElems, value_type* vals);
```
Creates vector cache initialized from array.

**Parameters:**
- `nElems`: Number of elements
- `vals`: Array of initial values

**Example:**
```cpp
G4double values[] = {1.0, 2.0, 3.0};
G4VectorCache<G4double> cache(3, values);
```

### Vector Operations

#### Push_back
```cpp
inline void Push_back(const value_type& val);
```
Appends element to this thread's vector.

**Example:**
```cpp
G4VectorCache<G4int> cache;
cache.Push_back(10);
cache.Push_back(20);
// Thread's vector now contains [10, 20]
```

#### Pop_back
```cpp
inline value_type Pop_back();
```
Removes and returns last element from this thread's vector.

**Returns:** Copy of removed element

**Example:**
```cpp
G4VectorCache<G4int> cache;
cache.Push_back(10);
cache.Push_back(20);
G4int last = cache.Pop_back();  // last = 20, vector = [10]
```

#### operator[]
```cpp
inline value_type& operator[](const G4int& idx);
```
Accesses element at index in this thread's vector.

**Parameters:**
- `idx`: Index into vector

**Returns:** Reference to element (mutable)

**Example:**
```cpp
G4VectorCache<G4double> cache(10);
cache[0] = 3.14;
cache[5] = 2.71;
G4double val = cache[0];  // val = 3.14
```

#### Begin / End
```cpp
inline iterator Begin();
inline iterator End();
```
Returns iterators to this thread's vector.

**Example:**
```cpp
G4VectorCache<G4int> cache;
cache.Push_back(1);
cache.Push_back(2);
cache.Push_back(3);

for (auto it = cache.Begin(); it != cache.End(); ++it) {
    std::cout << *it << "\n";
}
```

#### Clear
```cpp
inline void Clear();
```
Removes all elements from this thread's vector.

**Example:**
```cpp
cache.Clear();  // Thread's vector now empty
```

#### Size
```cpp
inline size_type Size();
```
Returns number of elements in this thread's vector.

**Returns:** Size of thread-local vector

**Example:**
```cpp
G4VectorCache<G4int> cache;
cache.Push_back(1);
cache.Push_back(2);
std::cout << "Size: " << cache.Size() << "\n";  // Output: Size: 2
```

## G4MapCache&lt;KEYTYPE, VALTYPE&gt; API

Map-like cache providing std::map interface with thread-local storage.

### Type Definitions

```cpp
template <class KEYTYPE, class VALTYPE>
class G4MapCache : public G4Cache<std::map<KEYTYPE, VALTYPE>> {
public:
    using key_type = KEYTYPE;
    using value_type = VALTYPE;
    using map_type = std::map<key_type, value_type>;
    using size_type = typename map_type::size_type;
    using iterator = typename map_type::iterator;
    using const_iterator = typename map_type::const_iterator;
};
```

### Map Operations

#### Insert
```cpp
inline std::pair<iterator, G4bool> Insert(const key_type& k, const value_type& v);
```
Inserts key-value pair into this thread's map.

**Returns:** Pair of iterator and bool (true if inserted, false if key existed)

**Example:**
```cpp
G4MapCache<G4int, G4String> cache;
auto result = cache.Insert(42, "answer");
if (result.second) {
    std::cout << "Inserted successfully\n";
}
```

#### operator[]
```cpp
inline value_type& operator[](const key_type& k);
```
Accesses value for key in this thread's map. Creates entry if key doesn't exist.

**Parameters:**
- `k`: Key to look up

**Returns:** Reference to value (mutable)

**Example:**
```cpp
G4MapCache<G4String, G4double> cache;
cache["pi"] = 3.14159;
cache["e"] = 2.71828;
G4double pi = cache["pi"];  // pi = 3.14159
```

#### Has
```cpp
inline G4bool Has(const key_type& k);
```
Checks if key exists in this thread's map.

**Returns:** `true` if key exists, `false` otherwise

**Example:**
```cpp
if (cache.Has("pi")) {
    G4double pi = cache.Get("pi");
}
```

#### Find
```cpp
inline iterator Find(const key_type& k);
```
Finds entry for key in this thread's map.

**Returns:** Iterator to element or `End()` if not found

**Example:**
```cpp
auto it = cache.Find("pi");
if (it != cache.End()) {
    std::cout << "Found: " << it->second << "\n";
}
```

#### Get
```cpp
inline value_type& Get(const key_type& k);
```
Gets value for key (assumes key exists).

**Returns:** Reference to value

**Warning:** Undefined behavior if key doesn't exist. Use `Has()` first or use `operator[]`.

#### Erase
```cpp
inline size_type Erase(const key_type& k);
```
Removes entry for key from this thread's map.

**Returns:** Number of elements removed (0 or 1)

**Example:**
```cpp
cache["temp"] = 123.0;
cache.Erase("temp");  // Removed
```

#### Begin / End
```cpp
inline iterator Begin();
inline iterator End();
```
Returns iterators to this thread's map.

**Example:**
```cpp
G4MapCache<G4String, G4int> cache;
cache["one"] = 1;
cache["two"] = 2;

for (auto it = cache.Begin(); it != cache.End(); ++it) {
    std::cout << it->first << ": " << it->second << "\n";
}
```

#### Size
```cpp
inline size_type Size();
```
Returns number of entries in this thread's map.

## Usage Examples

### Example 1: Simple Thread-Private Counter

```cpp
class CountingClass {
    G4Cache<G4int> threadCounter;

public:
    CountingClass() : threadCounter(0) {}

    void IncrementCounter() {
        G4int count = threadCounter.Get();
        count++;
        threadCounter.Put(count);
    }

    G4int GetCount() const {
        return threadCounter.Get();
    }
};

// Usage in multi-threaded context
CountingClass shared;  // Shared by all threads

// Thread 1
shared.IncrementCounter();  // Thread 1's counter = 1
shared.IncrementCounter();  // Thread 1's counter = 2

// Thread 2
shared.IncrementCounter();  // Thread 2's counter = 1
shared.GetCount();          // Returns 1 (independent from Thread 1)
```

### Example 2: Thread-Private Cache

From G4Cache.hh documentation:

```cpp
class G4Shared {
    G4double sharedData;
    G4Cache<G4double> threadPrivate;

    void foo() {
        G4double priv = threadPrivate.Get();
        if (priv < 10) {
            priv += sharedData;
        }
        threadPrivate.Put(priv);
    }
};
```

### Example 3: Vector Cache for Temporary Data

```cpp
class PhysicsProcess {
    G4VectorCache<G4ThreeVector> tempPositions;

public:
    void ProcessTrack(const G4Track& track) {
        // Each thread maintains its own temporary position list
        tempPositions.Clear();

        for (G4int i = 0; i < 10; ++i) {
            G4ThreeVector pos = CalculatePosition(track, i);
            tempPositions.Push_back(pos);
        }

        // Use positions
        for (G4int i = 0; i < tempPositions.Size(); ++i) {
            ProcessPosition(tempPositions[i]);
        }
    }
};
```

### Example 4: Map Cache for Physics Tables

```cpp
class CrossSectionManager {
    G4MapCache<G4double, G4double> energyToXS;  // Energy → Cross-section

public:
    G4double GetCrossSection(G4double energy) {
        // Check thread-local cache
        if (energyToXS.Has(energy)) {
            return energyToXS[energy];
        }

        // Calculate and cache
        G4double xs = CalculateCrossSection(energy);
        energyToXS[energy] = xs;
        return xs;
    }

    void ClearCache() {
        // Clear this thread's cache
        for (auto it = energyToXS.Begin(); it != energyToXS.End(); ) {
            it = energyToXS.Erase(it->first);
        }
    }
};
```

### Example 5: Shared Object with Thread-Private State

```cpp
class GeometryCalculator {
    // Shared data (read-only, accessed by all threads)
    G4ThreeVector origin;
    G4double radius;

    // Thread-private data (each thread has its own)
    G4Cache<G4int> cachedStepCount;
    G4VectorCache<G4ThreeVector> cachedIntersections;

public:
    GeometryCalculator(const G4ThreeVector& o, G4double r)
        : origin(o), radius(r), cachedStepCount(0) {}

    void ProcessStep(const G4Step& step) {
        // Increment thread's step count
        G4int count = cachedStepCount.Get();
        cachedStepCount.Put(count + 1);

        // Calculate intersections (thread-private)
        G4ThreeVector intersection = CalculateIntersection(step);
        cachedIntersections.Push_back(intersection);
    }

    G4int GetStepCount() const {
        return cachedStepCount.Get();  // Returns THIS thread's count
    }

    G4int GetIntersectionCount() const {
        return cachedIntersections.Size();  // Returns THIS thread's count
    }
};
```

## Thread Safety

### Thread Safety Guarantees

**G4Cache is thread-safe by design:**
- Each thread accesses its own independent storage
- No synchronization needed between threads
- No race conditions or data corruption
- Lockless implementation for maximum performance

### How Thread Safety Works

```
Shared Object Instance
    ├── Non-cached members: Shared (must be read-only or synchronized)
    └── G4Cache members: Thread-private (automatic isolation)

Thread 1 accesses cache → Gets Thread 1's value
Thread 2 accesses cache → Gets Thread 2's value
Thread 3 accesses cache → Gets Thread 3's value

NO CONFLICTS - Complete isolation
```

### Thread Safety Model

```cpp
class SafeShared {
    // Shared read-only data - safe
    const G4double constantValue;

    // Shared mutable data - UNSAFE without synchronization
    G4double sharedMutable;  // DANGER!

    // Thread-private data - safe with G4Cache
    G4Cache<G4double> threadPrivate;  // SAFE!

public:
    void SafeMethod() {
        // Safe: reading constant
        G4double c = constantValue;

        // UNSAFE: writing shared mutable
        sharedMutable = 42.0;  // DATA RACE!

        // Safe: writing thread-private
        threadPrivate.Put(42.0);  // NO RACE
    }
};
```

## Performance Characteristics

### Memory Overhead

**Per Cache Instance:**
```cpp
sizeof(G4Cache<T>) = sizeof(G4int) +              // id (~4 bytes)
                     sizeof(G4CacheReference<T>)  // (~16 bytes)
                   ≈ 20-24 bytes
```

**Per Thread Per Cache:**
```cpp
sizeof(T) + map overhead ≈ sizeof(T) + 32 bytes
```

**Total for N threads:**
```
Total ≈ Cache overhead + (N threads × (sizeof(T) + 32 bytes))
```

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Get() | O(log N) | N = number of caches, typically small |
| Put() | O(log N) | Map lookup + assignment |
| First access | O(log N) | Initialize thread-local storage |
| Subsequent access | O(log N) | Map lookup is fast in practice |

**Note:** While theoretically O(log N), map lookups are very fast due to small N and cache effects.

### Performance Comparison

**G4Cache vs. G4ThreadLocal:**

```cpp
// G4ThreadLocal - faster, less flexible
G4ThreadLocal static G4double value = 0.0;  // One per function/class

// G4Cache - slightly slower, more flexible
G4Cache<G4double> value;  // Multiple per object instance
```

**G4Cache vs. Mutex-Protected:**

```cpp
// Mutex - slow, high contention
G4Mutex mutex;
G4double shared;
{
    G4AutoLock lock(&mutex);
    shared = value;  // ~100-1000 ns
}

// G4Cache - fast, no contention
G4Cache<G4double> cache;
cache.Put(value);  // ~10-50 ns
```

**Speedup:** G4Cache is typically **10-100x faster** than mutex-protected shared data.

## Best Practices

### DO's

1. **Use for Thread-Private State in Shared Objects**
   ```cpp
   class Shared {
       G4Cache<StateData> threadState;  // Each thread has its own state
   };
   ```

2. **Initialize in Constructor When Possible**
   ```cpp
   Shared() : cache(initialValue) {
       // Cache initialized for all threads
   }
   ```

3. **Clear Caches Between Runs**
   ```cpp
   void EndOfRun() {
       cache.Put(defaultValue);  // Reset to default
   }
   ```

4. **Use VectorCache for Collections**
   ```cpp
   G4VectorCache<G4double> results;  // Not G4Cache<std::vector<G4double>>
   ```

5. **Document Thread-Private Members**
   ```cpp
   G4Cache<G4int> counter;  // Thread-private counter
   ```

### DON'Ts

1. **Don't Use for Truly Shared Data**
   ```cpp
   // WRONG - defeats purpose
   class Shared {
       G4Cache<SharedResource*> resource;  // Should be truly shared!
   };
   ```

2. **Don't Assume Initialization**
   ```cpp
   // WRONG - may be uninitialized
   G4double value = cache.Get();  // May be garbage

   // CORRECT - initialize explicitly
   cache.Put(0.0);
   G4double value = cache.Get();
   ```

3. **Don't Share References Across Threads**
   ```cpp
   // WRONG
   G4double& ref = cache.Get();
   // Pass ref to another thread - UNDEFINED BEHAVIOR!
   ```

4. **Don't Over-Use**
   ```cpp
   // WRONG - excessive memory overhead
   G4Cache<G4int> a, b, c, d, e, f, g, h;  // 8 caches for simple ints!

   // BETTER - group related data
   struct ThreadData { G4int a, b, c, d, e, f, g, h; };
   G4Cache<ThreadData> data;
   ```

## Common Pitfalls

### Pitfall 1: Uninitialized Cache

```cpp
class MyClass {
    G4Cache<G4double> cache;  // Not initialized

public:
    void Method() {
        G4double value = cache.Get();  // May be garbage!
        // CRASH or incorrect behavior
    }
};

// SOLUTION: Initialize
class MyClass {
    G4Cache<G4double> cache;

public:
    MyClass() : cache(0.0) {}  // Initialize to 0
};
```

### Pitfall 2: Assuming Cross-Thread Visibility

```cpp
// Thread 1
cache.Put(42.0);

// Thread 2
G4double value = cache.Get();  // NOT 42.0! Different thread!

// Each thread has its own value
```

### Pitfall 3: Excessive Memory Usage

```cpp
// Creates N thread copies of large object!
G4Cache<HugeObject> cache;  // N × sizeof(HugeObject) memory

// BETTER: Store pointer or shared_ptr
G4Cache<HugeObject*> cache;  // N × pointer size
```

## See Also

- **G4ThreadLocal**: Simpler thread-local storage for static/global variables
- **G4AutoLock**: Mutex-based synchronization (alternative approach)
- **G4CacheDetails.hh**: Implementation details of thread-local mechanism
- **G4AllocatorPool**: Used internally for efficient cache allocation

## References

- Geant4 Multi-Threading Guide
- C++11 thread_local keyword (similar concept)
- "C++ Concurrency in Action" by Anthony Williams: Chapter 3 (Thread-Local Data)
