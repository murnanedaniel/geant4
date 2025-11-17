# G4PhysicsFreeVector

## Overview

G4PhysicsFreeVector provides **arbitrary (free) energy binning** - energy points can be placed at any positions as long as they are monotonically increasing. This maximum flexibility makes it ideal for experimental data, tabulated values, or physics data with varying resolution requirements.

**Source Files:**
- Header: `source/global/management/include/G4PhysicsFreeVector.hh` (lines 1-105)
- Implementation: `source/global/management/src/G4PhysicsFreeVector.cc` (lines 1-180)

**Inherits from:** [G4PhysicsVector](g4physicsvector.md)

## When to Use

**Use G4PhysicsFreeVector when:**
- Loading experimental data with irregular energy points
- Need high resolution in specific energy regions, low elsewhere
- Energy points from external tables (NIST, ENDF, etc.)
- Combining data from multiple sources with different grids
- Building custom distributions (e.g., resonance structures)

**Do NOT use when:**
- Uniform binning works well (use [G4PhysicsLogVector](g4physicslogvector.md) or [G4PhysicsLinearVector](g4physicslinearvector.md))
- Need maximum performance (free vectors use binary search: O(log n))

## Key Features

1. **Complete flexibility:** Energy points anywhere
2. **Dynamic insertion:** Add points on-the-fly with `InsertValues()`
3. **Multiple constructors:** From arrays, vectors, or manual filling
4. **Optional log search:** Enable O(1) average lookup with `EnableLogBinSearch()`
5. **No bin limits:** Automatically grows with `InsertValues()`

## Constructors

### 1. Empty Vector

```cpp
explicit G4PhysicsFreeVector(G4bool spline = false);
```

Creates empty vector for manual filling.

**Example:**
```cpp
G4PhysicsFreeVector* vec = new G4PhysicsFreeVector(true);

// Fill using InsertValues() - automatically maintains order
vec->InsertValues(1.0*keV, 1.23e-24);
vec->InsertValues(10.0*keV, 3.45e-24);
vec->InsertValues(5.0*keV, 2.34e-24);  // Inserted in correct position

vec->FillSecondDerivatives();
```

---

### 2. Pre-allocated Size

```cpp
explicit G4PhysicsFreeVector(std::size_t length, G4bool spline = false);
explicit G4PhysicsFreeVector(G4int length);  // Legacy
```

Allocates memory for `length` points, initialized to zero.

**Example:**
```cpp
std::size_t nPoints = 50;
G4PhysicsFreeVector* vec = new G4PhysicsFreeVector(nPoints, true);

// Fill using PutValues() with explicit indices
for (std::size_t i = 0; i < nPoints; ++i) {
    G4double energy = GenerateEnergy(i);
    G4double value = ComputeValue(energy);
    vec->PutValues(i, energy, value);
}

vec->FillSecondDerivatives();
```

---

### 3. From std::vector

```cpp
explicit G4PhysicsFreeVector(const std::vector<G4double>& energies,
                            const std::vector<G4double>& values,
                            G4bool spline = false);
```

Constructs from energy and value vectors (must have same size).

**Example:**
```cpp
// Load from external source
std::vector<G4double> energies = {1*keV, 5*keV, 10*keV, 50*keV, 100*keV};
std::vector<G4double> crossSections = {1.2e-24, 3.4e-24, 5.6e-24, 8.9e-24, 9.1e-24};

G4PhysicsFreeVector* xs = new G4PhysicsFreeVector(energies, crossSections, true);
xs->FillSecondDerivatives();

// Ready to use
G4double value = xs->Value(7.5*keV);
```

---

### 4. From C Arrays

```cpp
explicit G4PhysicsFreeVector(const G4double* energies,
                            const G4double* values,
                            std::size_t length,
                            G4bool spline = false);
```

Constructs from C-style arrays.

**Example:**
```cpp
G4double energies[] = {1, 10, 100, 1000, 10000};  // in eV
G4double values[] = {1.2, 3.4, 5.6, 7.8, 9.0};
std::size_t n = 5;

G4PhysicsFreeVector* vec = new G4PhysicsFreeVector(energies, values, n, true);
vec->ScaleVector(eV, 1.0);  // Convert energies to Geant4 units
vec->FillSecondDerivatives();
```

---

### 5. Obsolete Constructor

```cpp
explicit G4PhysicsFreeVector(std::size_t length, G4double emin,
                            G4double emax, G4bool spline = false);
```

**Deprecated.** The `emin` and `emax` parameters are ignored. Use constructor 2 instead.

## Public Methods

### PutValues() - Fill at Index

```cpp
void PutValues(const std::size_t index,
               const G4double energy,
               const G4double value);
```

Sets both energy and value at specific index. Energies must be in increasing order.

**Example:**
```cpp
G4PhysicsFreeVector* vec = new G4PhysicsFreeVector(100);

for (std::size_t i = 0; i < 100; ++i) {
    G4double e = ComputeIrregularEnergy(i);
    G4double v = ComputeValue(e);
    vec->PutValues(i, e, v);  // Fill both energy and value
}

vec->FillSecondDerivatives();
```

---

### InsertValues() - Dynamic Insertion

```cpp
void InsertValues(const G4double energy, const G4double value);
```

Inserts (energy, value) pair maintaining sorted order. Vector grows automatically.

**Key feature:** Energies don't need to be added in order!

**Example:**
```cpp
G4PhysicsFreeVector* vec = new G4PhysicsFreeVector();

// Can add in any order - automatically sorted
vec->InsertValues(100*keV, 5.0);
vec->InsertValues(1*keV, 1.0);    // Inserted before 100 keV
vec->InsertValues(10*keV, 3.0);   // Inserted between 1 and 100
vec->InsertValues(10*keV, 3.1);   // Equal energy - inserted after first 10 keV

// Final order: (1, 1.0), (10, 3.0), (10, 3.1), (100, 5.0)

vec->FillSecondDerivatives();
```

**Performance:** O(n) insertion time (must maintain sort order)

---

### EnableLogBinSearch() - Performance Optimization

```cpp
void EnableLogBinSearch(const G4int n = 1);
```

Creates logarithmic search table for O(1) average bin lookup instead of O(log n) binary search.

**Parameters:**
- `n`: Sampling factor (n=1 means `nLogNodes = numberOfNodes`, n=10 means `nLogNodes = numberOfNodes/10`)

**When to use:**
- Many lookups on same vector (> 1000x)
- Performance is critical
- Energy range is wide

**Requirements:**
- All energies must be > 0
- At least 3 points
- Energy range must be > 0

**Example:**
```cpp
// Large free vector from experimental data
G4PhysicsFreeVector* vec = LoadExperimentalData();  // 10,000 points

// Enable fast lookup
vec->EnableLogBinSearch(10);  // Creates 1,000-point search table

// Now lookups are ~10x faster
std::size_t idx = 0;
for (G4int i = 0; i < 1000000; ++i) {
    G4double val = vec->Value(energy[i], idx);  // Fast!
}
```

---

### PutValue() - Legacy Method

```cpp
inline void PutValue(const std::size_t index,
                    const G4double e,
                    const G4double value);
```

Obsolete. Calls `PutValues()`. Use `PutValues()` directly.

## Complete Examples

### Example 1: Load NIST Cross-Section Data

```cpp
#include "G4PhysicsFreeVector.hh"
#include <fstream>
#include <sstream>

G4PhysicsFreeVector* LoadNISTData(const G4String& filename)
{
    std::ifstream file(filename);
    if (!file.is_open()) {
        G4Exception("LoadNISTData", "FileNotFound",
                   FatalException, filename);
    }

    std::vector<G4double> energies, crossSections;

    G4String line;
    while (std::getline(file, line)) {
        // Skip comments
        if (line[0] == '#') continue;

        std::istringstream iss(line);
        G4double energy, xs;
        if (iss >> energy >> xs) {
            energies.push_back(energy * eV);  // Convert to Geant4 units
            crossSections.push_back(xs * barn);
        }
    }

    file.close();

    G4cout << "Loaded " << energies.size() << " data points from "
           << filename << G4endl;

    // Create vector
    G4PhysicsFreeVector* vec = new G4PhysicsFreeVector(
        energies, crossSections, true);

    // Enable spline for smooth interpolation
    vec->FillSecondDerivatives();

    // Optional: Enable fast lookup for large datasets
    if (energies.size() > 1000) {
        vec->EnableLogBinSearch(20);
    }

    return vec;
}
```

---

### Example 2: Resonance Structure with Adaptive Resolution

```cpp
// Build vector with high resolution near resonances
G4PhysicsFreeVector* BuildResonanceVector()
{
    G4PhysicsFreeVector* vec = new G4PhysicsFreeVector(true);

    // Low resolution baseline (1 keV spacing)
    for (G4double e = 1*keV; e <= 100*keV; e += 1*keV) {
        if (e < 19*keV || e > 21*keV) {  // Skip resonance region
            vec->InsertValues(e, BaselineCrossSection(e));
        }
    }

    // High resolution near 20 keV resonance (10 eV spacing)
    for (G4double e = 19*keV; e <= 21*keV; e += 10*eV) {
        vec->InsertValues(e, ResonanceCrossSection(e));
    }

    vec->FillSecondDerivatives();

    G4cout << "Vector has " << vec->GetVectorLength() << " points" << G4endl;
    G4cout << "  Baseline: ~100 points" << G4endl;
    G4cout << "  Resonance: ~200 points" << G4endl;

    return vec;
}
```

---

### Example 3: Combine Multiple Data Sources

```cpp
// Merge cross-section data from different energy ranges
G4PhysicsFreeVector* MergeCrossSections(
    const std::vector<G4double>& lowE_energy,
    const std::vector<G4double>& lowE_xs,
    const std::vector<G4double>& highE_energy,
    const std::vector<G4double>& highE_xs)
{
    G4PhysicsFreeVector* merged = new G4PhysicsFreeVector(true);

    // Add low energy data (e.g., from tabulated values)
    for (std::size_t i = 0; i < lowE_energy.size(); ++i) {
        merged->InsertValues(lowE_energy[i], lowE_xs[i]);
    }

    // Add high energy data (e.g., from theoretical calculations)
    for (std::size_t i = 0; i < highE_energy.size(); ++i) {
        // Only add if not overlapping with low-E data
        if (highE_energy[i] > lowE_energy.back()) {
            merged->InsertValues(highE_energy[i], highE_xs[i]);
        }
    }

    // Handle overlap region with smoothing
    G4double overlapE = lowE_energy.back();
    G4double overlapE_high = highE_energy.front();

    if (std::abs(overlapE - overlapE_high) < 1*keV) {
        // Smooth transition in overlap
        for (G4double e = overlapE; e <= overlapE_high; e += 0.1*keV) {
            G4double w = (e - overlapE) / (overlapE_high - overlapE);
            G4double xs = (1-w) * ComputeXS_LowE(e) + w * ComputeXS_HighE(e);
            merged->InsertValues(e, xs);
        }
    }

    merged->FillSecondDerivatives();
    return merged;
}
```

---

### Example 4: Angular Distribution (Cumulative)

```cpp
// Build cumulative angular distribution for scattering
G4PhysicsFreeVector* BuildAngularCDF(
    const std::vector<G4double>& cosTheta,
    const std::vector<G4double>& dSigmadOmega)
{
    std::size_t n = cosTheta.size();

    // Compute cumulative distribution
    std::vector<G4double> cdf(n);
    cdf[0] = 0.0;

    for (std::size_t i = 1; i < n; ++i) {
        G4double dCosTheta = cosTheta[i] - cosTheta[i-1];
        G4double avgDiffXS = 0.5 * (dSigmadOmega[i] + dSigmadOmega[i-1]);
        cdf[i] = cdf[i-1] + avgDiffXS * dCosTheta * 2*pi;  // Integrate
    }

    // Normalize to [0, 1]
    G4double totalXS = cdf[n-1];
    for (auto& c : cdf) c /= totalXS;

    // Create vector (cosTheta as "energy", CDF as "value")
    G4PhysicsFreeVector* angularCDF = new G4PhysicsFreeVector(
        cosTheta, cdf, false);  // No spline for sampling

    return angularCDF;
}

// Sample scattering angle
G4double SampleCosTheta(G4PhysicsFreeVector* angularCDF)
{
    G4double random = G4UniformRand();  // [0, 1]

    // Use GetEnergy() for inverse CDF lookup
    G4double cosTheta = angularCDF->GetEnergy(random);

    return cosTheta;
}
```

## Performance Characteristics

### Bin Search: Binary vs. Logarithmic

```cpp
// Default: Binary search - O(log n)
G4PhysicsFreeVector vecBinary(energies, values);
// 1000 points: ~10 comparisons per lookup

// With log search enabled - O(1) average
G4PhysicsFreeVector vecLog(energies, values);
vecLog.EnableLogBinSearch(10);
// 1000 points with 100-point search table: ~1-2 comparisons average
```

**Benchmark (1M lookups, 1000 points):**
- Binary search: ~50 ms
- Log search: ~30 ms
- Log/Linear vector (regular binning): ~25 ms

**Memory overhead of log search:**
- Search table size: `nLogNodes * sizeof(std::size_t)`
- Example: 100 nodes × 8 bytes = 800 bytes (negligible)

### When EnableLogBinSearch() Helps

**Benefit is significant when:**
1. Many lookups (> 10,000x)
2. Large vector (> 500 points)
3. Random access pattern

**Benefit is minimal when:**
1. Few lookups (< 100x)
2. Small vector (< 100 points)
3. Sequential access (index caching works well)

## Comparison: Free vs. Regular Vectors

### Flexibility

```cpp
// Free vector - complete flexibility
G4PhysicsFreeVector free;
free.InsertValues(1*keV, val1);
free.InsertValues(1.5*keV, val2);  // Arbitrary spacing
free.InsertValues(10*keV, val3);   // Can have gaps
free.InsertValues(10.1*keV, val4); // Can have fine resolution

// Regular vectors - fixed spacing
G4PhysicsLogVector log(1*keV, 10*keV, 50);
// Spacing is predetermined, cannot adjust
```

### Performance

```cpp
// Lookup speed (typical):
// G4PhysicsLogVector:  ~30 ns (O(1) calculation)
// G4PhysicsFreeVector: ~50 ns (O(log n) search)
// G4PhysicsFreeVector + EnableLogBinSearch(): ~35 ns (O(1) average)
```

### Memory

```cpp
// 200-point vectors:
// LogVector: ~3.3 KB
// FreeVector: ~3.3 KB
// FreeVector + log search (n=10): ~3.5 KB
```

## Thread Safety

Same as [G4PhysicsVector](g4physicsvector.md):

**Thread-safe:**
- `Value()` calls (with thread-local index cache)
- All read-only operations after `FillSecondDerivatives()`

**NOT thread-safe:**
- `InsertValues()` - modifies vector structure
- `PutValues()` - modifies data
- `EnableLogBinSearch()` - builds search table
- `FillSecondDerivatives()` - computes spline

**Safe pattern:**
```cpp
// Master thread
G4PhysicsFreeVector* vec = BuildVector();
vec->EnableLogBinSearch();
vec->FillSecondDerivatives();
// Now read-only - safe for workers

// Worker threads
void Worker() {
    std::size_t idx = 0;  // Thread-local
    G4double val = vec->Value(energy, idx);  // Safe
}
```

## Pitfalls and Best Practices

### Pitfall 1: Unsorted Energies with PutValues()

```cpp
// WRONG - energies must be sorted when using PutValues()
vec->PutValues(0, 100*keV, val1);
vec->PutValues(1, 10*keV, val2);   // Out of order!
vec->PutValues(2, 50*keV, val3);
// Results in incorrect bin searches

// CORRECT - use InsertValues() for unsorted data
vec->InsertValues(100*keV, val1);
vec->InsertValues(10*keV, val2);   // Automatically sorted
vec->InsertValues(50*keV, val3);
```

### Pitfall 2: Enabling Log Search on Small Vectors

```cpp
// Wasteful - binary search is already fast
G4PhysicsFreeVector small(10);
small.EnableLogBinSearch();  // Overhead not worth it

// Good practice
G4PhysicsFreeVector large(1000);
large.EnableLogBinSearch();  // Actually helps
```

### Pitfall 3: Forgetting FillSecondDerivatives()

```cpp
// Spline enabled but never computed
G4PhysicsFreeVector* vec = new G4PhysicsFreeVector(energies, values, true);
// Missing: vec->FillSecondDerivatives();
// Uses linear interpolation despite spline=true
```

### Best Practice: Check Data Validity

```cpp
void ValidateFreeVector(G4PhysicsFreeVector* vec)
{
    // Check monotonicity
    for (std::size_t i = 1; i < vec->GetVectorLength(); ++i) {
        if (vec->Energy(i) <= vec->Energy(i-1)) {
            G4cerr << "ERROR: Non-monotonic energies at index " << i << G4endl;
        }
    }

    // Check for NaN/Inf
    for (std::size_t i = 0; i < vec->GetVectorLength(); ++i) {
        if (!std::isfinite((*vec)[i])) {
            G4cerr << "ERROR: Invalid value at index " << i << G4endl;
        }
    }

    G4cout << "Vector validation passed" << G4endl;
}
```

## Related Classes

- [G4PhysicsVector](g4physicsvector.md) - Base class
- [G4PhysicsOrderedFreeVector](g4physicsorderedfreevector.md) - Alias for G4PhysicsFreeVector
- [G4PhysicsLogVector](g4physicslogvector.md) - Regular logarithmic binning
- [G4PhysicsLinearVector](g4physicslinearvector.md) - Regular linear binning
- [G4PhysicsTable](g4physicstable.md) - Collections of vectors

## See Also

- Application Developer Guide, "Reading Tabulated Data"
- Physics Reference Manual, "User-Defined Cross Sections"
- G4VEmProcess::AddEmModel() - Can use custom free vectors
- NIST database integration examples
