# G4StatDouble API Documentation

## Overview

`G4StatDouble` provides simple statistical analysis for a single variable, computing mean, RMS (root-mean-square), and supporting weighted data. It's designed for accumulating statistics incrementally during simulations.

Originally from the GRAS tool by Giovanni Santin (ESA, 2005).

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4StatDouble.hh`
**Implementation:** `source/global/HEPNumerics/src/G4StatDouble.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4StatDouble.hh:40-101`

```cpp
class G4StatDouble
{
 public:
  G4StatDouble();
  G4StatDouble(G4double);
  virtual ~G4StatDouble() = default;

  void reset();
  void fill(G4double x, G4double weight = 1.);
  void scale(G4double);

  G4double mean() const;
  G4double rms();
  void add(const G4StatDouble*);

  inline G4int n() const { return m_n; }
  inline G4double sum_w() const { return m_sum_w; }
  inline G4double sum_wx() const { return m_sum_wx; }
  inline G4double sum_wx2() const { return m_sum_wx2; }

  G4StatDouble& operator+=(const G4double& rhs);
  G4StatDouble& operator+=(const G4StatDouble& rhs);
};
```

## Constructors

`source/global/HEPNumerics/include/G4StatDouble.hh:43-44`

```cpp
G4StatDouble();                // Default: empty
G4StatDouble(G4double value);  // Initialize with one value
```

## Methods

### fill

`source/global/HEPNumerics/include/G4StatDouble.hh:68`

```cpp
void fill(G4double x, G4double weight = 1.);
```

**Purpose:** Add data point with optional weight

### mean

`source/global/HEPNumerics/include/G4StatDouble.hh:73`

```cpp
G4double mean() const;
```

**Purpose:** Compute weighted mean

**Formula:** Σ(w·x) / Σw

### rms

`source/global/HEPNumerics/include/G4StatDouble.hh:74`

```cpp
G4double rms();
```

**Purpose:** Compute root-mean-square

**Formula:** √(Σ(w·x²)/Σw - mean²)

## Usage Examples

### Basic Statistics

```cpp
#include "G4StatDouble.hh"

G4StatDouble energyStats;

// Accumulate particle energies
for (G4int i = 0; i < nParticles; i++) {
    G4double E = GetParticleEnergy(i);
    energyStats.fill(E);
}

G4cout << "Mean energy: " << energyStats.mean() << " MeV" << G4endl;
G4cout << "RMS: " << energyStats.rms() << " MeV" << G4endl;
G4cout << "N particles: " << energyStats.n() << G4endl;
```

### Weighted Statistics

```cpp
// Dose calculation with weights
G4StatDouble doseStats;

for (auto& hit : hits) {
    G4double dose = hit.GetDose();
    G4double weight = hit.GetWeight();
    doseStats.fill(dose, weight);
}

G4cout << "Weighted mean dose: " << doseStats.mean() << G4endl;
```

### Combining Statistics

```cpp
// Merge statistics from multiple threads
G4StatDouble totalStats;
std::vector<G4StatDouble*> threadStats = GetThreadLocalStats();

for (auto* stats : threadStats) {
    totalStats.add(stats);
}

G4cout << "Combined mean: " << totalStats.mean() << G4endl;
```

## Thread Safety

Not thread-safe. Use thread-local instances.

## Related Classes

- [G4StatAnalysis](g4statanalysis.md) - Advanced multi-variable statistics
- [G4ConvergenceTester](g4convergencetester.md) - Convergence testing

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4StatDouble.hh`
**Implementation:** `source/global/HEPNumerics/src/G4StatDouble.cc`
**Authors:** G.Santin (2005), J.Apostolakis (2011)
:::
