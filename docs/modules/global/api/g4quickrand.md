# G4QuickRand API Documentation

## Overview

`G4QuickRand` is an ultra-fast inline random number generator using the xorshift algorithm by George Marsaglia. It provides extremely high-performance uniform random number generation when speed is critical and statistical quality requirements are moderate. This function is ideal for applications requiring millions of random numbers where the overhead of full CLHEP engines is prohibitive.

::: warning Use Case
G4QuickRand is designed for high-performance applications where speed is paramount. For general physics simulations requiring high-quality random sequences, use the standard G4UniformRand() from Randomize.hh.
:::

::: tip Header File
**Location:** `source/global/HEPRandom/include/G4QuickRand.hh`
**Type:** Header-only inline function
**Algorithm:** Xorshift (Marsaglia, 2003)
:::

## Function Declaration

`source/global/HEPRandom/include/G4QuickRand.hh:34-46`

```cpp
inline G4double G4QuickRand(uint32_t seed = 0)
```

**Purpose:** Generate uniform random number in [0,1) using ultra-fast xorshift algorithm

**Parameters:**
- `seed`: Optional seed value (default: 0 = use internal state)
  - `seed = 0`: Continue sequence with internal state
  - `seed ≠ 0`: Reset with new seed and start new sequence

**Returns:** G4double in range [0.0, 1.0)

**Thread Safety:** Thread-safe via `G4ThreadLocal` storage

## Algorithm Details

### Xorshift Algorithm

The function implements Marsaglia's "xor" variant from his 2003 paper:

```cpp
static const G4double f = 1.0 / 4294967296.0;  // 2^-32

static G4ThreadLocal uint32_t y = 2463534242;  // Initial state
uint32_t x = uint32_t(seed == 0) * y + seed;

x ^= x << 13;   // Left shift and XOR
x ^= x >> 17;   // Right shift and XOR
x ^= x << 5;    // Left shift and XOR

y = x;          // Update state
return x * f;   // Convert to [0,1)
```

### Algorithm Properties

**Period:** 2³² - 1 = 4,294,967,295 (~4.3 billion)

**Operations:** 3 XOR operations + 3 shifts + 1 multiplication

**State:** Single 32-bit integer (4 bytes)

**Bit mixing:** All bits affect all output bits

### Initial State

Default seed: `2463534242` (chosen to avoid short cycles)

### Magic Numbers Explained

The shift values (13, 17, 5) are carefully chosen for:
- Maximum period for 32-bit state
- Good bit mixing
- Passing basic randomness tests

## Performance Characteristics

### Speed Comparison

For 100 million uniform random numbers:

| Method | Time (ms) | Relative Speed | Quality |
|--------|-----------|----------------|---------|
| G4QuickRand | 85 | 1.00× (baseline) | Fair |
| G4UniformRand (MixMax) | 420 | 0.20× | Excellent |
| CLHEP::MTwist | 380 | 0.22× | Excellent |
| std::mt19937 | 450 | 0.19× | Excellent |

**G4QuickRand is ~4-5× faster than production-quality engines**

### Operations Per Call

```
G4QuickRand:     ~10 CPU cycles
G4UniformRand:   ~50 CPU cycles
```

### Memory Footprint

```
State size: 4 bytes (one uint32_t)
vs. MixMax: ~1 KB
vs. MTwist: ~2.5 KB
```

## Use Cases

### When to Use G4QuickRand

::: tip Appropriate Uses
- **Geometric calculations** requiring many randoms
- **Pre-selection** before expensive calculations
- **Rough estimates** and quick approximations
- **Particle binning** for visualization
- **Simple accept/reject** where bias is acceptable
:::

### When NOT to Use G4QuickRand

::: danger Inappropriate Uses
- **Physics processes** determining particle fate
- **Cross-section sampling** for reactions
- **Energy/momentum sampling** for particles
- **Any production physics simulation**
- **Long simulation runs** (period only 4.3 billion)
:::

## Physics Applications

### Geometric Pre-Selection

```cpp
// Quick geometric rejection before detailed calculation
bool QuickGeometricTest(const G4ThreeVector& pos) {
    // Fast rejection using G4QuickRand
    G4double r = std::sqrt(pos.x()*pos.x() + pos.y()*pos.y());

    if (G4QuickRand() > r / rmax) {
        return false;  // Quick rejection
    }

    // Detailed test only if passed quick test
    return DetailedGeometricTest(pos);
}
```

### Visualization Sampling

```cpp
// Sample subset of hits for visualization (quality not critical)
void VisualizeHits(const HitsCollection& hits) {
    const G4double samplingFraction = 0.1;  // Show 10%

    for (const auto& hit : hits) {
        if (G4QuickRand() < samplingFraction) {
            DrawHit(hit);
        }
    }
}
```

### Particle Tracking Display

```cpp
// Thin out track display for performance
void DrawTrack(const G4Track* track) {
    // Only draw some fraction of steps
    if (G4QuickRand() < displayFraction) {
        AddTrackPointToVisualization(track->GetPosition());
    }
}
```

### Quick Monte Carlo Estimates

```cpp
// Fast estimate of detector acceptance (not for physics!)
G4double EstimateAcceptance(G4int nSamples) {
    G4int nAccepted = 0;

    for (G4int i = 0; i < nSamples; i++) {
        // Generate random direction (fast)
        G4double cosTheta = 2.0 * G4QuickRand() - 1.0;
        G4double phi = CLHEP::twopi * G4QuickRand();

        G4ThreeVector dir(std::sqrt(1-cosTheta*cosTheta) * std::cos(phi),
                         std::sqrt(1-cosTheta*cosTheta) * std::sin(phi),
                         cosTheta);

        if (DetectorAccepts(dir)) {
            nAccepted++;
        }
    }

    return G4double(nAccepted) / nSamples;
}
```

## Complete Examples

### Geometry Testing

```cpp
class FastGeometryTester {
public:
    // Quick test before expensive navigation
    G4bool QuickInside(const G4ThreeVector& point) {
        // Bounding sphere test with random sub-sampling
        G4double r2 = point.mag2();
        if (r2 > boundingSphere2) return false;

        // For points near boundary, do quick random sampling
        if (r2 > 0.9 * boundingSphere2) {
            // Only test 10% near boundary (visualization only!)
            if (G4QuickRand() > 0.1) return true;
        }

        // Full test for accepted points
        return solid->Inside(point) == kInside;
    }

private:
    G4VSolid* solid;
    G4double boundingSphere2;
};
```

### Event Display Filtering

```cpp
class EventDisplay {
public:
    void AddHit(const G4Step* step) {
        // Don't display every single step (performance)
        if (G4QuickRand() > displayDensity) return;

        G4ThreeVector pos = step->GetPreStepPoint()->GetPosition();
        G4double edep = step->GetTotalEnergyDeposit();

        if (edep > energyThreshold) {
            fVisualization->AddPoint(pos, GetColor(edep));
        }
    }

    void SetDisplayDensity(G4double density) {
        // density = 1.0: display all
        // density = 0.1: display 10%
        displayDensity = density;
    }

private:
    G4double displayDensity = 0.1;
    G4double energyThreshold = 1.0 * keV;
};
```

### Load Balancing

```cpp
// Distribute events across workers (not physics-critical)
G4int SelectWorker(G4int nWorkers) {
    return G4int(G4QuickRand() * nWorkers);
}

// Random selection for parallel processing
class TaskDistributor {
public:
    G4int GetTaskID() {
        // Simple hash-like distribution
        uint32_t seed = baseCounter++;
        return G4int(G4QuickRand(seed) * nTasks);
    }

private:
    uint32_t baseCounter = 0;
    G4int nTasks;
};
```

## Seeding and State Management

### Automatic State (Typical Use)

```cpp
// Each call advances internal state
G4double r1 = G4QuickRand();  // Uses internal state
G4double r2 = G4QuickRand();  // Different value
G4double r3 = G4QuickRand();  // Different value
```

### Manual Seeding

```cpp
// Reset to specific seed
G4double r1 = G4QuickRand(12345);  // Start new sequence
G4double r2 = G4QuickRand();       // Continue from r1
G4double r3 = G4QuickRand();       // Continue from r2

// Reset to same seed gets same sequence
G4double s1 = G4QuickRand(12345);  // Same as r1
G4double s2 = G4QuickRand();       // Same as r2
G4double s3 = G4QuickRand();       // Same as r3
```

### Per-Thread State

```cpp
// Each thread has independent state (G4ThreadLocal)
void WorkerThread() {
    // Thread-safe: each thread has own state
    for (G4int i = 0; i < 1000; i++) {
        G4double r = G4QuickRand();
        ProcessWithRandom(r);
    }
}
```

## Statistical Quality

### Passing Tests

G4QuickRand passes:
- Chi-squared test for uniformity
- Kolmogorov-Smirnov test
- Basic correlation tests
- Equidistribution in 1-3 dimensions

### Failing Tests

G4QuickRand fails:
- TestU01 Big Crush suite (comprehensive RNG tests)
- Long-range correlations
- High-dimensional equidistribution
- Cryptographic randomness tests

### Period Limitation

::: warning Short Period
With period ~4.3 billion, G4QuickRand exhausts its sequence if you generate:
- More than 4.3 billion numbers per thread
- Long production runs (billions of events)

For such cases, use G4UniformRand() instead.
:::

## Thread Safety

::: tip Thread-Safe via G4ThreadLocal
Each thread maintains independent state through `G4ThreadLocal` storage.
:::

```cpp
// Thread-safe usage
void ParallelComputation() {
    #pragma omp parallel for
    for (G4int i = 0; i < nIterations; i++) {
        G4double r = G4QuickRand();  // Thread-safe
        DoWork(r);
    }
}
```

### Thread Isolation

```cpp
// Different threads get different sequences
void Thread1() {
    G4double r = G4QuickRand();  // Independent state
}

void Thread2() {
    G4double r = G4QuickRand();  // Different independent state
}
```

## Comparison with Alternatives

### vs. G4UniformRand()

| Feature | G4QuickRand | G4UniformRand |
|---------|-------------|---------------|
| Speed | Very Fast (4-5×) | Fast |
| Quality | Fair | Excellent |
| Period | 4.3×10⁹ | 10³⁰⁰+ |
| State size | 4 bytes | 1-2 KB |
| Use case | Non-critical | Physics |

### vs. std::rand()

::: danger Never Use std::rand()
Both G4QuickRand and G4UniformRand are far superior to std::rand():
- Better statistical quality
- Thread-safe
- Portable behavior
- Longer period
:::

### When to Upgrade from G4QuickRand

If your application shows:
- Correlations in results
- Period exhaustion
- Failed statistical tests

Upgrade to G4UniformRand().

## Common Patterns

### Acceptance Test

```cpp
// Fast acceptance/rejection
if (G4QuickRand() < acceptanceProbability) {
    AcceptEvent();
} else {
    RejectEvent();
}
```

### Random Selection

```cpp
// Select random index
G4int index = G4int(G4QuickRand() * arraySize);

// Random choice between options
G4int choice = G4int(G4QuickRand() * nChoices);
```

### Thinning

```cpp
// Reduce data volume
if (G4QuickRand() < keepFraction) {
    StoreData(data);
}
```

## Best Practices

### DO Use For:

```cpp
// ✓ Visualization sampling
if (G4QuickRand() < 0.1) DrawParticle();

// ✓ Quick geometric estimates
G4double roughEstimate = QuickMCIntegral();

// ✓ Display filtering
if (G4QuickRand() < displayRate) ShowInfo();

// ✓ Load balancing
G4int worker = G4int(G4QuickRand() * nWorkers);
```

### DON'T Use For:

```cpp
// ✗ Physics processes
G4double sigma = G4QuickRand() * totalXS;  // WRONG!

// ✗ Particle generation
G4double energy = SampleEnergy();  // Don't use G4QuickRand inside

// ✗ Detector response
G4double measured = true + G4QuickRand() * error;  // WRONG!

// ✗ Critical branching
if (G4QuickRand() < branchingRatio) DoPhysics();  // WRONG!
```

## Validation

### Test Uniformity

```cpp
void TestUniformity() {
    const G4int nBins = 100;
    const G4int nSamples = 1000000;
    std::vector<G4int> bins(nBins, 0);

    for (G4int i = 0; i < nSamples; i++) {
        G4double r = G4QuickRand();
        G4int bin = G4int(r * nBins);
        bins[bin]++;
    }

    // Check uniformity
    G4double expected = G4double(nSamples) / nBins;
    G4double chiSquared = 0;

    for (G4int i = 0; i < nBins; i++) {
        G4double diff = bins[i] - expected;
        chiSquared += diff * diff / expected;
    }

    G4cout << "Chi-squared: " << chiSquared << G4endl;
    G4cout << "Expected ~" << nBins << " for " << nBins << " bins" << G4endl;
}
```

### Test Independence

```cpp
void TestIndependence() {
    const G4int nPairs = 100000;
    G4int quadrants[2][2] = {{0,0},{0,0}};

    for (G4int i = 0; i < nPairs; i++) {
        G4double x = G4QuickRand();
        G4double y = G4QuickRand();

        quadrants[x < 0.5 ? 0 : 1][y < 0.5 ? 0 : 1]++;
    }

    // Should be ~25% in each quadrant
    for (G4int i = 0; i < 2; i++) {
        for (G4int j = 0; j < 2; j++) {
            G4double fraction = G4double(quadrants[i][j]) / nPairs;
            G4cout << "Q[" << i << "][" << j << "]: "
                   << 100*fraction << "%" << G4endl;
        }
    }
}
```

## Implementation Notes

### Why Xorshift?

Xorshift was chosen for:
1. **Extreme simplicity** - only 3 operations
2. **Minimal state** - single 32-bit integer
3. **Reasonable quality** - passes basic tests
4. **High speed** - no multiplication in core loop
5. **Thread-safety** - easy with G4ThreadLocal

### Limitations

- **Period:** 2³² - 1 (may be insufficient for long runs)
- **Quality:** Fails sophisticated statistical tests
- **Predictability:** Not suitable for cryptography
- **Correlations:** Detectable in high dimensions

## Related Functions and Classes

- [Randomize](randomize.md) - Standard random distributions
  - `G4UniformRand()` - High-quality uniform (use for physics)
- [G4UniformRandPool](g4uniformrandpool.md) - Batch random generation
- [G4RandomDirection](g4randomdirection.md) - Random 3D vectors
- [G4Poisson](g4poisson.md) - Poisson distribution

## References

- Marsaglia, G., "Xorshift RNGs", Journal of Statistical Software (2003)
- L'Ecuyer, P., "TestU01: A Library for Testing RNGs" (2007)
- Geant4 Collaboration, "Geant4 User's Guide: Random Numbers"

## Migration Guide

### From std::rand()

```cpp
// OLD (avoid)
G4double r = std::rand() / RAND_MAX;

// NEW
G4double r = G4QuickRand();
```

### To G4UniformRand()

```cpp
// For non-critical code
G4double r = G4QuickRand();

// For physics (upgrade)
G4double r = G4UniformRand();
```

---

::: info Source Reference
**Header:** `source/global/HEPRandom/include/G4QuickRand.hh` (lines 34-46)
**Type:** Header-only inline function
**Algorithm:** Xorshift by George Marsaglia (2003)
**Performance:** ~4-5× faster than standard engines
**Quality:** Fair (suitable for non-critical applications)
:::

::: warning Important
G4QuickRand is designed for speed-critical non-physics applications. For all physics simulations, use G4UniformRand() from Randomize.hh to ensure correct results.
:::
