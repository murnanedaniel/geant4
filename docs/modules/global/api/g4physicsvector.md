# G4PhysicsVector

## Overview

**G4PhysicsVector is the fundamental base class for storing ALL physics data in Geant4.** It provides a flexible, efficient container for energy-dependent physics quantities such as cross-sections, energy loss (dE/dx), particle ranges, and angular distributions. This class stores pairs of (energy, value) data points and provides optimized interpolation methods to retrieve values at arbitrary energies.

**Source Files:**
- Header: `source/global/management/include/G4PhysicsVector.hh` (lines 1-238)
- Inline: `source/global/management/include/G4PhysicsVector.icc` (lines 1-300)
- Implementation: `source/global/management/src/G4PhysicsVector.cc` (lines 1-473)

## Purpose

G4PhysicsVector serves as the storage mechanism for:
- **Cross-sections**: Interaction probabilities vs. energy
- **Energy loss (dE/dx)**: Stopping power tables
- **Range tables**: Particle range vs. initial energy
- **Scattering distributions**: Angular and energy distributions
- **Attenuation coefficients**: Material interaction data
- **Any energy-dependent physics quantity**

## Key Features

1. **Flexible energy binning**: Linear, logarithmic, or arbitrary spacing
2. **Fast retrieval**: O(1) for regular binning, O(log n) for arbitrary
3. **Interpolation**: Linear or cubic spline
4. **Persistent storage**: Binary and ASCII file I/O
5. **Index caching**: Reusable bin indices for sequential access
6. **Boundary handling**: Automatic extrapolation at edges

## Class Hierarchy

```
G4PhysicsVector (abstract base)
├── G4PhysicsLinearVector (linear energy spacing)
├── G4PhysicsLogVector (logarithmic energy spacing)
└── G4PhysicsFreeVector (arbitrary energy spacing)
    └── G4PhysicsOrderedFreeVector (alias)
```

## Public Methods

### Constructors and Destructor

```cpp
explicit G4PhysicsVector(G4bool spline = false);
```
**Parameters:**
- `spline`: Enable cubic spline interpolation (default: false, use linear)

**Usage:**
```cpp
G4PhysicsVector* vec = new G4PhysicsLogVector(true);  // With spline
```

---

```cpp
G4PhysicsVector(const G4PhysicsVector&) = default;
G4PhysicsVector& operator=(const G4PhysicsVector&) = default;
virtual ~G4PhysicsVector() = default;
```
**Copy semantics:** Default copy constructor and assignment operator.
**Note:** Move operations are deleted for safety.

### Value Retrieval (CRITICAL METHODS)

#### Value() - With Index Cache

```cpp
inline G4double Value(const G4double energy, std::size_t& lastidx) const;
```
**The most important method in the class.** Returns interpolated value at given energy.

**Parameters:**
- `energy`: Energy at which to retrieve value (in Geant4 energy units)
- `lastidx`: Reference to last used bin index (in/out parameter)

**Returns:** Interpolated physics value

**How it works:**
1. Checks if energy is still in cached bin `[lastidx, lastidx+1]`
2. If not, performs bin search and updates `lastidx`
3. Performs interpolation (linear or spline)
4. Handles boundaries: returns edge values if out of range

**Performance:** O(1) if index cache is valid, otherwise O(1) for linear/log vectors, O(log n) for free vectors.

**Example - Cross-section lookup:**
```cpp
G4PhysicsVector* crossSection = GetCrossSectionVector(particle, material);
std::size_t idx = 0;  // Initialize once

// In simulation loop
for (const auto& energy : particleEnergies) {
    G4double xs = crossSection->Value(energy, idx);  // idx is updated and reused
    // Process with cross-section...
}
```

---

#### Value() - Without Index Cache

```cpp
inline G4double Value(const G4double energy) const;
```
**Simplified version** when index caching is not practical.

**Parameters:**
- `energy`: Energy at which to retrieve value

**Returns:** Interpolated physics value

**Performance:** Always performs bin search. Use the cached version for better performance.

**Example - Single lookup:**
```cpp
G4double range = rangeVector->Value(kineticEnergy);
```

---

#### GetValue() - Legacy Method

```cpp
inline G4double GetValue(const G4double energy, G4bool& isOutRange) const;
```
**Obsolete.** Kept for backward compatibility. The `isOutRange` parameter is no longer used.

**Recommendation:** Use `Value()` instead.

---

#### Specialized Value Methods

```cpp
inline G4double LogVectorValue(const G4double energy,
                               const G4double theLogEnergy) const;
```
**Optimized for G4PhysicsLogVector.** Use when you already have log(energy) computed.

**Parameters:**
- `energy`: Energy value
- `theLogEnergy`: Pre-computed log(energy)

**Example:**
```cpp
G4double energy = 1.5*MeV;
G4double logE = G4Log(energy);
G4double xs = logVector->LogVectorValue(energy, logE);
```

---

```cpp
inline G4double LogFreeVectorValue(const G4double energy,
                                   const G4double theLogEnergy) const;
```
**Optimized for G4PhysicsFreeVector with logarithmic search enabled.**

### Data Access

```cpp
inline G4double operator[](const std::size_t index) const;
inline G4double operator()(const std::size_t index) const;
```
**Direct access to data values** without interpolation. No bounds checking.

**Example:**
```cpp
G4double firstValue = (*physicsVector)[0];
G4double lastValue = physicsVector->operator()(vec->GetVectorLength() - 1);
```

---

```cpp
inline G4double Energy(const std::size_t index) const;
inline G4double GetLowEdgeEnergy(const std::size_t index) const;
```
**Get energy at given index.** No bounds checking.

**Example:**
```cpp
for (size_t i = 0; i < vec->GetVectorLength(); ++i) {
    G4cout << "E = " << vec->Energy(i)/MeV << " MeV, "
           << "Value = " << (*vec)[i] << G4endl;
}
```

---

```cpp
inline G4double GetMinEnergy() const;
inline G4double GetMaxEnergy() const;
inline G4double GetMinValue() const;
inline G4double GetMaxValue() const;
inline std::size_t GetVectorLength() const;
```
**Query vector properties.**

**Example:**
```cpp
G4cout << "Energy range: " << vec->GetMinEnergy()/keV
       << " - " << vec->GetMaxEnergy()/GeV << " GeV" << G4endl;
G4cout << "Vector length: " << vec->GetVectorLength() << G4endl;
```

### Data Modification

```cpp
inline void PutValue(const std::size_t index, const G4double value);
```
**Set data value at index.** Energies must already be filled.

**Example - Building a cross-section vector:**
```cpp
G4PhysicsLogVector* xs = new G4PhysicsLogVector(1*keV, 10*GeV, 100);

for (size_t i = 0; i < xs->GetVectorLength(); ++i) {
    G4double energy = xs->Energy(i);
    G4double crossSection = ComputeCrossSection(particle, material, energy);
    xs->PutValue(i, crossSection);
}

xs->FillSecondDerivatives();  // Enable spline interpolation
```

---

```cpp
void ScaleVector(const G4double factorE, const G4double factorV);
```
**Scale all energies and values** by given factors. Useful for unit conversion.

**Parameters:**
- `factorE`: Energy scale factor
- `factorV`: Value scale factor

**Example - Convert to Geant4 units:**
```cpp
// After reading from file with energies in eV and cross-sections in barns
vec->ScaleVector(eV, barn);
vec->FillSecondDerivatives();  // Recompute spline after scaling
```

### Interpolation Setup

```cpp
void FillSecondDerivatives(const G4SplineType = G4SplineType::Base,
                          const G4double dir1 = 0.0,
                          const G4double dir2 = 0.0);
```
**Compute spline coefficients** for cubic spline interpolation. Must be called after filling data and before using spline interpolation.

**Parameters:**
- `splineType`: Type of spline (Simple, Base, or FixedEdges)
- `dir1`: First derivative at first point (for FixedEdges only)
- `dir2`: First derivative at last point (for FixedEdges only)

**Requirements:**
- Vector must be constructed with `spline=true`
- Minimum 4 points for Simple, 5 for Base

**Example:**
```cpp
G4PhysicsLogVector* vec = new G4PhysicsLogVector(eMin, eMax, nBins, true);

// Fill data...
for (size_t i = 0; i < vec->GetVectorLength(); ++i) {
    vec->PutValue(i, ComputeValue(vec->Energy(i)));
}

// Compute spline (required!)
vec->FillSecondDerivatives(G4SplineType::Base);  // Default, smooth
// OR
vec->FillSecondDerivatives(G4SplineType::FixedEdges, dydx_first, dydx_last);
```

### Bin Search

```cpp
std::size_t FindBin(const G4double energy, std::size_t idx) const;
```
**Find bin index** for given energy, using idx as a hint.

**Returns:** Index i such that `binVector[i] <= energy < binVector[i+1]`

---

```cpp
inline std::size_t ComputeLogVectorBin(const G4double logenergy) const;
```
**Fast bin calculation for log vectors.** Direct O(1) computation.

### Inverse Lookup

```cpp
G4double GetEnergy(const G4double value) const;
```
**Find energy corresponding to a value.** Assumes both energy and data are monotonically increasing.

**Use case:** Cumulative distribution functions (CDFs), sampling from distributions.

**Example - Sample from CDF:**
```cpp
// Assume vec contains a normalized CDF (0 to 1)
G4double randomValue = G4UniformRand();  // 0 to 1
G4double sampledEnergy = vec->GetEnergy(randomValue);
```

---

```cpp
inline G4double FindLinearEnergy(const G4double rand) const;
```
**Sample energy from cumulative probability.** Convenience method.

**Example:**
```cpp
G4double energy = cdfVector->FindLinearEnergy(G4UniformRand());
```

### File I/O

```cpp
G4bool Store(std::ofstream& fOut, G4bool ascii = false) const;
G4bool Retrieve(std::ifstream& fIn, G4bool ascii = false);
```
**Save/load vector to/from file.**

**Parameters:**
- `fOut`/`fIn`: File stream
- `ascii`: true for ASCII format, false for binary (default)

**Returns:** true on success, false on failure

**File Format (ASCII):**
```
<edgeMin> <edgeMax> <numberOfNodes>
<size>
<energy_0> <value_0>
<energy_1> <value_1>
...
<energy_n> <value_n>
```

**Example - Save and load:**
```cpp
// Save
std::ofstream outFile("crosssection.dat");
if (vec->Store(outFile, true)) {  // ASCII format
    G4cout << "Vector saved successfully" << G4endl;
}
outFile.close();

// Load
G4PhysicsVector* loadedVec = new G4PhysicsFreeVector();
std::ifstream inFile("crosssection.dat");
if (loadedVec->Retrieve(inFile, true)) {
    G4cout << "Vector loaded successfully" << G4endl;
}
inFile.close();
```

### Type and Configuration

```cpp
inline G4PhysicsVectorType GetType() const;
inline G4bool GetSpline() const;
inline void SetVerboseLevel(G4int value);
```

**Query vector configuration.**

**Example:**
```cpp
if (vec->GetType() == T_G4PhysicsLogVector) {
    G4cout << "Logarithmic binning" << G4endl;
}
if (vec->GetSpline()) {
    G4cout << "Spline interpolation enabled" << G4endl;
}
```

### Debugging

```cpp
void DumpValues(G4double unitE = 1.0, G4double unitV = 1.0) const;
friend std::ostream& operator<<(std::ostream&, const G4PhysicsVector&);
```

**Print vector contents.**

**Example:**
```cpp
vec->DumpValues(MeV, barn);  // Print in MeV and barns
// OR
G4cout << *vec << G4endl;
```

## Protected Members

```cpp
G4double edgeMin, edgeMax;      // Energy boundaries
G4double invdBin;               // 1/binWidth for uniform vectors
G4double logemin;               // log(edgeMin) for log vectors
std::size_t numberOfNodes;      // Number of data points
std::size_t idxmax;             // numberOfNodes - 2
G4PhysicsVectorType type;       // Vector type identifier

std::vector<G4double> binVector;      // Energy values
std::vector<G4double> dataVector;     // Physics values
std::vector<G4double> secDerivative;  // Spline coefficients
```

## Interpolation Details

### Linear Interpolation

For energy E between `binVector[i]` and `binVector[i+1]`:

```
value = dataVector[i] + (E - binVector[i]) * (dataVector[i+1] - dataVector[i])
                                            / (binVector[i+1] - binVector[i])
```

**Accuracy:** First-order, may show discontinuous derivatives

### Cubic Spline Interpolation

Uses pre-computed second derivatives for smooth interpolation:

```
value = linear_term + spline_correction
```

where the spline correction involves secDerivative[i] and secDerivative[i+1].

**Accuracy:** Third-order, smooth continuous derivatives

**Cost:** ~3x slower than linear, but much more accurate

## Common Usage Patterns

### Pattern 1: Cross-Section Tables

```cpp
// Build cross-section vector for a process
G4PhysicsLogVector* BuildCrossSectionVector(
    const G4ParticleDefinition* particle,
    const G4Material* material)
{
    G4double eMin = 1*keV;
    G4double eMax = 100*GeV;
    size_t nBins = 200;

    G4PhysicsLogVector* xs = new G4PhysicsLogVector(eMin, eMax, nBins, true);

    for (size_t i = 0; i < xs->GetVectorLength(); ++i) {
        G4double energy = xs->Energy(i);
        G4double crossSection = ComputeCrossSection(particle, material, energy);
        xs->PutValue(i, crossSection);
    }

    xs->FillSecondDerivatives();  // Enable spline
    return xs;
}

// Use in simulation
std::size_t idx = 0;
G4double xs = crossSectionVector->Value(particleEnergy, idx);
G4double lambda = 1.0 / (xs * atomicDensity);  // Mean free path
```

### Pattern 2: Energy Loss (dE/dx) Tables

```cpp
// Build dE/dx vector
G4PhysicsLogVector* BuildDEDXVector(
    const G4ParticleDefinition* particle,
    const G4Material* material)
{
    G4double eMin = 1*keV;
    G4double eMax = 10*TeV;
    size_t nBins = 300;

    G4PhysicsLogVector* dedx = new G4PhysicsLogVector(eMin, eMax, nBins, true);

    for (size_t i = 0; i < dedx->GetVectorLength(); ++i) {
        G4double energy = dedx->Energy(i);
        G4double stoppingPower = ComputeStoppingPower(particle, material, energy);
        dedx->PutValue(i, stoppingPower);
    }

    dedx->FillSecondDerivatives();
    return dedx;
}

// Use to compute energy loss
G4double energyLoss = dedxVector->Value(kineticEnergy) * stepLength;
```

### Pattern 3: Range Tables

```cpp
// Build range vector (integrated from dE/dx)
G4PhysicsLogVector* BuildRangeVector(G4PhysicsVector* dedxVector)
{
    size_t nBins = dedxVector->GetVectorLength();
    G4PhysicsLogVector* range = new G4PhysicsLogVector(
        dedxVector->GetMinEnergy(),
        dedxVector->GetMaxEnergy(),
        nBins - 1,
        true);

    // Integrate dE/dx to get range
    G4double r = 0.0;
    for (size_t i = 0; i < range->GetVectorLength(); ++i) {
        G4double e = range->Energy(i);
        G4double dedx = dedxVector->Value(e);

        if (i > 0) {
            G4double e_prev = range->Energy(i-1);
            r += 0.5 * (e - e_prev) * (1.0/dedx + 1.0/dedxVector->Value(e_prev));
        }

        range->PutValue(i, r);
    }

    range->FillSecondDerivatives();
    return range;
}

// Use: Given energy, find range
G4double range = rangeVector->Value(kineticEnergy);

// Inverse: Given range, find energy (using GetEnergy)
G4double finalEnergy = rangeVector->GetEnergy(range - pathLength);
```

### Pattern 4: Angular Distributions

```cpp
// Build cumulative distribution for sampling
G4PhysicsFreeVector* BuildCDF(std::vector<G4double>& angles,
                              std::vector<G4double>& probabilities)
{
    size_t n = angles.size();
    G4PhysicsFreeVector* cdf = new G4PhysicsFreeVector(n);

    // Build cumulative sum
    G4double sum = 0.0;
    for (size_t i = 0; i < n; ++i) {
        if (i > 0) sum += probabilities[i];
        cdf->PutValues(i, angles[i], sum);
    }

    // Normalize to [0, 1]
    for (size_t i = 0; i < n; ++i) {
        cdf->PutValue(i, (*cdf)[i] / sum);
    }

    return cdf;
}

// Sample angle
G4double SampleAngle(G4PhysicsVector* cdf) {
    G4double random = G4UniformRand();
    return cdf->GetEnergy(random);
}
```

## Performance Optimization

### 1. Use Index Caching

```cpp
// SLOW - creates new index each time
for (int i = 0; i < 1000000; ++i) {
    G4double val = vec->Value(energy[i]);  // No caching
}

// FAST - reuses index
std::size_t idx = 0;
for (int i = 0; i < 1000000; ++i) {
    G4double val = vec->Value(energy[i], idx);  // Cached
}
```

**Speedup:** 2-5x for sequential or nearby energies

### 2. Choose Appropriate Vector Type

```cpp
// For wide energy range (keV to GeV): use LogVector
G4PhysicsLogVector* xs = new G4PhysicsLogVector(1*keV, 10*GeV, 200);

// For narrow range: LinearVector may be better
G4PhysicsLinearVector* xs = new G4PhysicsLinearVector(1*MeV, 2*MeV, 100);
```

### 3. Enable Log Search for Free Vectors

```cpp
G4PhysicsFreeVector* freeVec = new G4PhysicsFreeVector(energies, values);
freeVec->EnableLogBinSearch(10);  // Creates log search table
// Now lookups are O(1) average instead of O(log n)
```

### 4. Spline vs. Linear Trade-off

```cpp
// Linear: Fast (~50 ns/lookup), less accurate
G4PhysicsLogVector* fast = new G4PhysicsLogVector(eMin, eMax, 1000, false);

// Spline: Slower (~150 ns/lookup), more accurate - can use fewer bins
G4PhysicsLogVector* accurate = new G4PhysicsLogVector(eMin, eMax, 200, true);
accurate->FillSecondDerivatives();
```

## Thread Safety

**Read operations are thread-safe** once the vector is fully constructed and `FillSecondDerivatives()` has been called.

**Not thread-safe:**
- Concurrent modifications (PutValue, ScaleVector)
- Concurrent calls to FillSecondDerivatives()
- Writing to the same cached index from multiple threads

**Safe pattern for multi-threading:**
```cpp
// Build in master thread
G4PhysicsVector* vec = BuildVector();
vec->FillSecondDerivatives();

// Read-only access in worker threads is safe
// Each thread should have its own index cache
void WorkerThread() {
    std::size_t idx = 0;  // Thread-local
    for (auto energy : energies) {
        G4double val = vec->Value(energy, idx);  // Safe
    }
}
```

## Common Pitfalls

### 1. Forgetting to Call FillSecondDerivatives()

```cpp
// WRONG - spline enabled but not computed
G4PhysicsLogVector* vec = new G4PhysicsLogVector(eMin, eMax, nBins, true);
// Fill data...
// Missing: vec->FillSecondDerivatives();
// Result: Linear interpolation is used despite spline=true

// CORRECT
vec->FillSecondDerivatives();  // Must call this!
```

### 2. Modifying After FillSecondDerivatives()

```cpp
vec->FillSecondDerivatives();
vec->PutValue(50, newValue);  // BAD - invalidates spline
// Must call FillSecondDerivatives() again
vec->FillSecondDerivatives();  // Recompute
```

### 3. Using Log Vector with Zero Energy

```cpp
// WRONG - log vectors cannot include zero
G4PhysicsLogVector* vec = new G4PhysicsLogVector(0*keV, 10*GeV, 100);
// Will throw exception or produce NaN

// CORRECT - use small non-zero minimum
G4PhysicsLogVector* vec = new G4PhysicsLogVector(1*eV, 10*GeV, 100);
```

### 4. Out-of-Bounds Access

```cpp
// No bounds checking on operator[]
G4double val = (*vec)[vec->GetVectorLength()];  // Undefined behavior!

// Use Value() for safe access with extrapolation
G4double val = vec->Value(energy);  // Returns edge values if out of range
```

## Related Classes

- [G4PhysicsVectorType](g4physicsvectortype.md) - Type enumerations
- [G4PhysicsLinearVector](g4physicslinearvector.md) - Linear energy binning
- [G4PhysicsLogVector](g4physicslogvector.md) - Logarithmic energy binning
- [G4PhysicsFreeVector](g4physicsfreevector.md) - Arbitrary energy binning
- [G4PhysicsTable](g4physicstable.md) - Collection of physics vectors
- [G4Physics2DVector](g4physics2dvector.md) - 2D physics data

## See Also

- Physics Reference Manual, Chapter on "Physics Tables"
- Application Developer Guide, Section on "Cross Section and Energy Loss"
- G4VEmProcess - Uses physics vectors for cross-sections
- G4VEnergyLossProcess - Uses physics vectors for dE/dx and range
