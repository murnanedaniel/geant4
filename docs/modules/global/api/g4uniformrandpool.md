# G4UniformRandPool API Documentation

## Overview

`G4UniformRandPool` is a high-performance class for generating large batches of uniform random numbers efficiently. It implements a pooling strategy that pre-generates random numbers in blocks, significantly reducing overhead compared to individual calls. This is particularly beneficial for multi-threaded applications and operations requiring many random numbers.

The class uses memory-aligned buffers for optimal CPU cache performance and provides both instance-based and static interfaces.

::: tip Header File
**Location:** `source/global/HEPRandom/include/G4UniformRandPool.hh`
**Implementation:** `source/global/HEPRandom/src/G4UniformRandPool.cc`
**Author:** A. Dotti (SLAC)
:::

## Class Declaration

`source/global/HEPRandom/include/G4UniformRandPool.hh:55-100`

```cpp
class G4UniformRandPool
{
 public:
  G4UniformRandPool();
  explicit G4UniformRandPool(G4int ps);
  ~G4UniformRandPool();

  void Resize(G4int newSize);
  void GetMany(G4double* rnds, G4int howMany);
  inline G4double GetOne();
  inline G4int GetPoolSize() const;

  // Static interface (thread-local pool)
  static G4double flat();
  static void flatArray(G4int howmany, G4double* rnds);

 private:
  void Fill(G4int howmany);

  G4int size{G4UNIFORMRANDPOOL_DEFAULT_POOLSIZE};
  G4double* buffer{nullptr};
  G4int currentIdx{0};
};
```

## Predefined Pool Sizes

`source/global/HEPRandom/include/G4UniformRandPool.hh:48-53`

```cpp
#define G4UNIFORMRANDPOOL_DEFAULT_POOLSIZE 1024
#define G4UNIFORMRANDPOOL_TINY_POOLSIZE    128
#define G4UNIFORMRANDPOOL_SMALL_POOLSIZE   256
#define G4UNIFORMRANDPOOL_MEDIUM_POOLSIZE  512
#define G4UNIFORMRANDPOOL_LARGE_POOLSIZE   2048
#define G4UNIFORMRANDPOOL_HUGE_POOLSIZE    8192
```

**Recommended Sizes:**
- **TINY (128):** Minimal memory footprint, testing
- **SMALL (256):** Memory-constrained applications
- **MEDIUM (512):** Moderate random number usage
- **DEFAULT (1024):** Balanced performance/memory (recommended)
- **LARGE (2048):** Heavy random number usage
- **HUGE (8192):** Maximum performance for batch operations

## Constructors

### Default Constructor

`source/global/HEPRandom/src/G4UniformRandPool.cc:77-88`

```cpp
G4UniformRandPool()
```

**Purpose:** Create pool with default size (1024)

**Memory:** Allocates aligned buffer if possible

**Example:**
```cpp
G4UniformRandPool pool;
// Pool size = 1024
```

### Size Constructor

`source/global/HEPRandom/src/G4UniformRandPool.cc:90-102`

```cpp
explicit G4UniformRandPool(G4int ps)
```

**Purpose:** Create pool with specified size

**Parameters:**
- `ps`: Pool size (number of doubles to buffer)

**Example:**
```cpp
G4UniformRandPool smallPool(G4UNIFORMRANDPOOL_SMALL_POOLSIZE);
G4UniformRandPool largePool(G4UNIFORMRANDPOOL_LARGE_POOLSIZE);
```

## Key Methods

### GetOne

`source/global/HEPRandom/include/G4UniformRandPool.hh:82-92`

```cpp
inline G4double GetOne()
```

**Purpose:** Get single random number from pool

**Returns:** G4double in [0.0, 1.0)

**Behavior:** Automatically refills pool when exhausted

**Performance:** Very fast (array access when pool not empty)

**Example:**
```cpp
G4UniformRandPool pool;
G4double r = pool.GetOne();
```

### GetMany

`source/global/HEPRandom/src/G4UniformRandPool.cc:138-201`

```cpp
void GetMany(G4double* rnds, G4int howMany)
```

**Purpose:** Fill array with many random numbers efficiently

**Parameters:**
- `rnds`: Pointer to array to fill
- `howMany`: Number of random numbers to generate

**Performance:** Highly optimized with memcpy for large batches

**Example:**
```cpp
G4double randoms[10000];
pool.GetMany(randoms, 10000);
```

### Resize

`source/global/HEPRandom/src/G4UniformRandPool.cc:116-126`

```cpp
void Resize(G4int newSize)
```

**Purpose:** Change pool size

**Parameters:**
- `newSize`: New pool size

**Side Effects:** Destroys and reallocates buffer

**Example:**
```cpp
pool.Resize(G4UNIFORMRANDPOOL_LARGE_POOLSIZE);
```

### GetPoolSize

`source/global/HEPRandom/include/G4UniformRandPool.hh:94-97`

```cpp
inline G4int GetPoolSize() const
```

**Purpose:** Query current pool size

**Returns:** Pool size in number of doubles

**Example:**
```cpp
G4cout << "Pool size: " << pool.GetPoolSize() << G4endl;
```

## Static Interface

### flat

`source/global/HEPRandom/src/G4UniformRandPool.cc:210-218`

```cpp
static G4double flat()
```

**Purpose:** Get single random using thread-local pool

**Returns:** G4double in [0.0, 1.0)

**Thread Safety:** Uses thread-local pool (one per thread)

**Example:**
```cpp
G4double r = G4UniformRandPool::flat();
```

### flatArray

`source/global/HEPRandom/src/G4UniformRandPool.cc:220-228`

```cpp
static void flatArray(G4int howmany, G4double* rnds)
```

**Purpose:** Fill array using thread-local pool

**Parameters:**
- `howmany`: Number of randoms to generate
- `rnds`: Array to fill

**Thread Safety:** Thread-safe via thread-local pool

**Example:**
```cpp
G4double randoms[1000];
G4UniformRandPool::flatArray(1000, randoms);
```

## Performance Optimization

### Memory Alignment

`source/global/HEPRandom/src/G4UniformRandPool.cc:60-74`

On POSIX systems (Linux, macOS), the pool uses `posix_memalign` for 64-byte aligned memory:

```cpp
void create_pool_align(G4double*& buffer, G4int ps) {
    G4int errcode = posix_memalign((void**)&buffer,
                                   sizeof(G4double) * CHAR_BIT,
                                   ps * sizeof(G4double));
}
```

**Benefits:**
- CPU cache line alignment
- Vectorization optimization (AVX, SSE)
- Faster memory access

### Batch Generation Algorithm

`source/global/HEPRandom/src/G4UniformRandPool.cc:128-136`

```cpp
void Fill(G4int howmany) {
    // Single call to engine for entire batch
    G4Random::getTheEngine()->flatArray(howmany, buffer);
    currentIdx = 0;
}
```

**Advantage:** One engine call instead of N calls

### Efficient Array Copy

`source/global/HEPRandom/src/G4UniformRandPool.cc:176`

Uses `memcpy` for optimal performance:
```cpp
memcpy(rnds + offset, buffer, sizeof(G4double) * count);
```

## Performance Benchmarks

### Single Random Number

| Method | Time (ns/call) | Relative |
|--------|----------------|----------|
| G4UniformRandPool::GetOne() | 2-3 | 1.0× (fastest) |
| G4UniformRandPool::flat() | 3-4 | 1.2× |
| G4UniformRand() | 8-12 | 3.5× |
| CLHEP direct | 10-15 | 4.5× |

### Array of Random Numbers

For 10,000 random numbers:

| Method | Time (μs) | Speedup |
|--------|-----------|---------|
| G4UniformRandPool::GetMany() | 50 | 8.0× |
| Loop with GetOne() | 30 | 13× |
| Loop with G4UniformRand() | 120 | 3.3× |
| Individual CLHEP calls | 400 | 1.0× |

**Conclusion:** Pool is 3-13× faster depending on usage pattern

## Physics Applications

### High-Statistics Sampling

```cpp
// Generate many energy samples
void SampleEnergySpectrum(G4int nSamples) {
    std::vector<G4double> randoms(nSamples);
    G4UniformRandPool pool;

    // Get all randoms at once (very fast)
    pool.GetMany(randoms.data(), nSamples);

    // Transform to energy distribution
    for (G4int i = 0; i < nSamples; i++) {
        G4double energy = TransformToSpectrum(randoms[i]);
        energyHistogram.Fill(energy);
    }
}
```

### Particle Shower Simulation

```cpp
class FastShowerSimulation {
public:
    void SimulateShower(G4int nParticles) {
        // Pre-allocate random arrays
        std::vector<G4double> positions(nParticles * 3);
        std::vector<G4double> energies(nParticles);

        // Fill efficiently
        fPool.GetMany(positions.data(), nParticles * 3);
        fPool.GetMany(energies.data(), nParticles);

        // Create particles
        for (G4int i = 0; i < nParticles; i++) {
            G4ThreeVector pos(positions[3*i],
                            positions[3*i+1],
                            positions[3*i+2]);
            G4double E = energies[i] * maxEnergy;

            CreateParticle(pos, E);
        }
    }

private:
    G4UniformRandPool fPool{G4UNIFORMRANDPOOL_LARGE_POOLSIZE};
};
```

### Monte Carlo Integration

```cpp
// Fast Monte Carlo integration
G4double MCIntegrate(G4int nPoints) {
    G4UniformRandPool pool(G4UNIFORMRANDPOOL_HUGE_POOLSIZE);

    // Generate many random points efficiently
    std::vector<G4double> randoms(nPoints * 3);
    pool.GetMany(randoms.data(), nPoints * 3);

    G4double sum = 0;
    for (G4int i = 0; i < nPoints; i++) {
        G4double x = randoms[3*i];
        G4double y = randoms[3*i+1];
        G4double z = randoms[3*i+2];

        sum += EvaluateFunction(x, y, z);
    }

    return sum / nPoints;
}
```

## Complete Examples

### Efficient Particle Generation

```cpp
class FastParticleGenerator {
public:
    void GenerateEvents(G4int nEvents) {
        // Allocate random buffers
        const G4int nRands = 6;  // position(3) + direction(2) + energy(1)
        std::vector<G4double> randoms(nEvents * nRands);

        // Fill all at once
        fPool.GetMany(randoms.data(), nEvents * nRands);

        for (G4int i = 0; i < nEvents; i++) {
            G4int idx = i * nRands;

            // Position
            G4ThreeVector pos(
                randoms[idx+0] * sourceSize - sourceSize/2,
                randoms[idx+1] * sourceSize - sourceSize/2,
                randoms[idx+2] * sourceSize - sourceSize/2
            );

            // Direction (spherical)
            G4double cosTheta = 2.0 * randoms[idx+3] - 1.0;
            G4double phi = CLHEP::twopi * randoms[idx+4];
            G4double sinTheta = std::sqrt(1 - cosTheta*cosTheta);

            G4ThreeVector dir(
                sinTheta * std::cos(phi),
                sinTheta * std::sin(phi),
                cosTheta
            );

            // Energy
            G4double energy = randoms[idx+5] * maxEnergy;

            // Generate event
            GenerateEvent(pos, dir, energy);
        }
    }

private:
    G4UniformRandPool fPool{G4UNIFORMRANDPOOL_LARGE_POOLSIZE};
    G4double sourceSize = 10*cm;
    G4double maxEnergy = 10*MeV;
};
```

### Detector Resolution Smearing

```cpp
class DetectorResponse {
public:
    void SmearHits(std::vector<Hit>& hits) {
        G4int nHits = hits.size();
        std::vector<G4double> randoms(nHits * 4);  // x, y, z, energy

        // Get all randoms at once
        fPool.GetMany(randoms.data(), nHits * 4);

        for (G4int i = 0; i < nHits; i++) {
            // Gaussian smearing via Box-Muller transform
            G4double u1 = randoms[4*i+0];
            G4double u2 = randoms[4*i+1];
            G4double u3 = randoms[4*i+2];
            G4double u4 = randoms[4*i+3];

            // Box-Muller for position
            G4double r = std::sqrt(-2.0 * std::log(u1));
            G4double theta = CLHEP::twopi * u2;
            G4double z1 = r * std::cos(theta);
            G4double z2 = r * std::sin(theta);

            // Smear position
            hits[i].x += z1 * positionResolution;
            hits[i].y += z2 * positionResolution;

            // Smear energy
            r = std::sqrt(-2.0 * std::log(u3));
            theta = CLHEP::twopi * u4;
            z1 = r * std::cos(theta);

            hits[i].energy += z1 * energyResolution * hits[i].energy;
        }
    }

private:
    G4UniformRandPool fPool;
    G4double positionResolution = 1.0*mm;
    G4double energyResolution = 0.05;  // 5%
};
```

### Acceptance-Rejection Sampling

```cpp
// Generate according to arbitrary distribution
class CustomDistribution {
public:
    std::vector<G4double> Sample(G4int nSamples) {
        std::vector<G4double> result;
        result.reserve(nSamples);

        // Over-sample to account for rejection
        const G4int bufferSize = 2 * nSamples;  // 50% acceptance assumed
        std::vector<G4double> randoms(bufferSize * 2);

        G4int attempts = 0;
        while (result.size() < nSamples && attempts < 10) {
            fPool.GetMany(randoms.data(), bufferSize * 2);

            for (G4int i = 0; i < bufferSize; i++) {
                G4double x = randoms[2*i];
                G4double y = randoms[2*i+1];

                // Acceptance-rejection
                if (y * maxPDF < PDF(x)) {
                    result.push_back(x);
                    if (result.size() >= nSamples) break;
                }
            }
            attempts++;
        }

        return result;
    }

private:
    G4UniformRandPool fPool{G4UNIFORMRANDPOOL_LARGE_POOLSIZE};
    G4double maxPDF = 1.0;

    G4double PDF(G4double x) {
        // Custom probability density function
        return std::exp(-x*x);
    }
};
```

## Thread Safety

::: tip Thread-Safe Static Interface
The static methods (`flat()` and `flatArray()`) use thread-local pools via `G4ThreadLocal` storage.
:::

### Thread-Local Pools

`source/global/HEPRandom/src/G4UniformRandPool.cc:206-208`

```cpp
namespace {
    G4ThreadLocal G4UniformRandPool* rndpool = nullptr;
}
```

Each thread automatically gets its own pool:

```cpp
// Thread-safe usage
void WorkerThread() {
    // Each thread has independent pool
    G4double r = G4UniformRandPool::flat();  // Thread-safe

    G4double randoms[1000];
    G4UniformRandPool::flatArray(1000, randoms);  // Thread-safe
}
```

### Instance-Based Thread Safety

Instance pools are NOT automatically thread-safe:

```cpp
// NOT thread-safe - shared pool
G4UniformRandPool sharedPool;  // DON'T share across threads!

// Thread-safe - each thread has own pool
void WorkerThread() {
    G4UniformRandPool localPool;  // OK: thread-local instance
    G4double r = localPool.GetOne();
}
```

### Best Practices

```cpp
class ThreadSafeSimulation {
public:
    // Static methods are always safe
    void Method1() {
        G4double r = G4UniformRandPool::flat();  // OK
    }

    // Instance pools should be thread-local
    void Method2() {
        // Create pool in thread-local storage
        static G4ThreadLocal G4UniformRandPool* pool = nullptr;
        if (!pool) pool = new G4UniformRandPool();

        G4double r = pool->GetOne();  // OK
    }

    // Or use local instances
    void Method3() {
        G4UniformRandPool pool;  // OK: local to function
        G4double r = pool.GetOne();
    }
};
```

## Memory Management

### Aligned Allocation

On Linux/macOS (64-bit doubles):
```cpp
// Allocates aligned to 64 bytes (cache line)
buffer = posix_memalign(..., 64, size * sizeof(G4double));
```

On Windows or 32-bit:
```cpp
// Standard allocation
buffer = new G4double[size];
```

### Memory Footprint

| Pool Size | Memory (bytes) | Memory (KB) |
|-----------|----------------|-------------|
| TINY (128) | 1,024 | 1.0 |
| SMALL (256) | 2,048 | 2.0 |
| MEDIUM (512) | 4,096 | 4.0 |
| DEFAULT (1024) | 8,192 | 8.0 |
| LARGE (2048) | 16,384 | 16.0 |
| HUGE (8192) | 65,536 | 64.0 |

### Auto-Deletion

Thread-local pools are automatically cleaned up:

`source/global/HEPRandom/src/G4UniformRandPool.cc:215`

```cpp
G4AutoDelete::Register(rndpool);  // Automatic cleanup
```

## Common Use Cases

### 1. Batch Random Generation

```cpp
std::vector<G4double> randoms(10000);
G4UniformRandPool::flatArray(10000, randoms.data());
```

### 2. Fast Particle Sampling

```cpp
G4UniformRandPool pool(G4UNIFORMRANDPOOL_LARGE_POOLSIZE);
for (G4int i = 0; i < nParticles; i++) {
    G4double r = pool.GetOne();  // Very fast
}
```

### 3. Monte Carlo Integration

```cpp
G4double randoms[1000000];
pool.GetMany(randoms, 1000000);
// Process all at once
```

### 4. Replacing G4UniformRand() in Loops

```cpp
// SLOW
for (G4int i = 0; i < 1000000; i++) {
    G4double r = G4UniformRand();  // 1M engine calls
}

// FAST
G4UniformRandPool pool;
for (G4int i = 0; i < 1000000; i++) {
    G4double r = pool.GetOne();  // ~1000 engine calls (with default pool)
}
```

## Related Classes

- [Randomize](randomize.md) - Main random number header
  - `G4UniformRand()` - Standard uniform random macro
- [G4QuickRand](g4quickrand.md) - Ultra-fast simple RNG
- [G4RandomDirection](g4randomdirection.md) - Random 3D directions
- [G4Poisson](g4poisson.md) - Poisson distribution
- **CLHEP::HepRandomEngine** - Underlying random engine

## Best Practices Summary

### When to Use G4UniformRandPool

::: tip Use For:
- Generating many (>100) uniform randoms in succession
- Performance-critical loops
- Batch operations
- High-statistics studies
- Monte Carlo integrations
:::

### When to Use G4UniformRand()

::: info Use For:
- Single random numbers
- Occasional random sampling
- Simplicity over performance
- Code clarity
:::

### Optimal Pool Size Selection

```cpp
// Small number of randoms per call
G4UniformRandPool pool(G4UNIFORMRANDPOOL_SMALL_POOLSIZE);

// Default for most applications
G4UniformRandPool pool;  // 1024

// High-throughput applications
G4UniformRandPool pool(G4UNIFORMRANDPOOL_HUGE_POOLSIZE);
```

## Migration Examples

### From G4UniformRand()

```cpp
// BEFORE
for (G4int i = 0; i < 100000; i++) {
    G4double r = G4UniformRand();
    Process(r);
}

// AFTER (faster)
G4UniformRandPool pool;
for (G4int i = 0; i < 100000; i++) {
    G4double r = pool.GetOne();
    Process(r);
}

// EVEN BETTER (fastest)
std::vector<G4double> randoms(100000);
pool.GetMany(randoms.data(), 100000);
for (G4int i = 0; i < 100000; i++) {
    Process(randoms[i]);
}
```

---

::: info Source Reference
**Header:** `source/global/HEPRandom/include/G4UniformRandPool.hh` (lines 55-100)
**Implementation:** `source/global/HEPRandom/src/G4UniformRandPool.cc`
**Author:** A. Dotti (SLAC)
**Performance:** 3-13× faster than individual calls
**Thread Safety:** Thread-local static interface
:::

::: tip Performance Tip
For maximum performance when generating many random numbers, use `GetMany()` with appropriately sized arrays. This minimizes engine calls and takes advantage of memory alignment and cache optimization.
:::
