# G4ConvergenceTester API Documentation

## Overview

`G4ConvergenceTester` implements comprehensive Monte Carlo convergence tests based on the MCNP statistical quality criteria. It performs 8 different tests to assess whether a Monte Carlo simulation has achieved statistical convergence, helping users determine when sufficient events have been simulated.

Reference: MCNP Manual LA-12625-M (1997), Chapter 2, Section VI.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4ConvergenceTester.hh`
**Implementation:** `source/global/HEPNumerics/src/G4ConvergenceTester.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4ConvergenceTester.hh:54-174`

```cpp
class G4ConvergenceTester
{
 public:
  G4ConvergenceTester(const G4String& theName = "NONAME");
  ~G4ConvergenceTester();

  void AddScore(G4double);

  void ShowHistory(std::ostream& out = G4cout);
  void ShowResult(std::ostream& out = G4cout);

  // Accessors
  inline G4double GetMean();
  inline G4double GetStandardDeviation();
  inline G4double GetVariance();
  inline G4double GetR();
  inline G4double GetEfficiency();
  inline G4double GetR2eff();
  inline G4double GetR2int();
  inline G4double GetFOM();

  // Operator
  inline G4ConvergenceTester& operator+=(G4double val);

 private:
  G4int noTotal = 8;  // Total number of tests
};
```

## Constructor

`source/global/HEPNumerics/include/G4ConvergenceTester.hh:58`

```cpp
G4ConvergenceTester(const G4String& theName = "NONAME");
```

**Purpose:** Create convergence tester with optional name

**Parameters:**
- `theName` - Identifier for this tester

## Methods

### AddScore

`source/global/HEPNumerics/include/G4ConvergenceTester.hh:62`

```cpp
void AddScore(G4double value);
```

**Purpose:** Add scored value (history)

**Effect:** Updates statistics and convergence tests

**Usage:** Call once per Monte Carlo history/event

### ShowResult

`source/global/HEPNumerics/include/G4ConvergenceTester.hh:71`

```cpp
void ShowResult(std::ostream& out = G4cout);
```

**Purpose:** Display convergence test results

**Output:**
- Mean, variance, standard deviation
- Relative error, efficiency
- FOM (Figure of Merit)
- Individual test results (8 tests)
- Overall pass/fail status

### ShowHistory

`source/global/HEPNumerics/include/G4ConvergenceTester.hh:70`

```cpp
void ShowHistory(std::ostream& out = G4cout);
```

**Purpose:** Display detailed history of convergence evolution

## Convergence Tests

### The 8 MCNP Tests

1. **Mean converged:** Mean is stable over latter half of simulation
2. **Relative error < 0.1:** Relative error R < 10%
3. **Relative error < 0.05:** Relative error R < 5% (stricter)
4. **VOV converged:** Variance of variance is decreasing
5. **FOM stable:** Figure of Merit not systematically changing
6. **Slope of FOM:** FOM vs. history number has slope near 0
7. **R decreasing:** Relative error decreases with more histories
8. **PDF bin behavior:** Probability density function well-sampled

### Pass Criteria

- **All 8 tests pass:** Excellent convergence
- **7 tests pass:** Acceptable convergence
- **< 7 tests pass:** Questionable results, need more histories

## Usage Examples

### Basic Convergence Testing

```cpp
#include "G4ConvergenceTester.hh"

G4ConvergenceTester tester("Detector_A");

// In event loop
for (G4int i = 0; i < nEvents; i++) {
    G4double score = SimulateEvent();
    tester.AddScore(score);

    // Check periodically
    if (i % 10000 == 0 && i > 0) {
        tester.ShowResult();
    }
}

// Final results
tester.ShowResult();
```

### Automatic Stopping

```cpp
void RunUntilConverged(G4int maxEvents) {
    G4ConvergenceTester tester("AutoStop");

    for (G4int i = 0; i < maxEvents; i++) {
        G4double score = SimulateEvent();
        tester.AddScore(score);

        // Check convergence every 1000 events
        if (i % 1000 == 0 && i > 10000) {  // Need minimum histories
            G4double R = tester.GetR();

            if (R < 0.05) {  // 5% relative error
                G4cout << "Converged after " << i << " events" << G4endl;
                tester.ShowResult();
                break;
            }
        }
    }
}
```

### Multi-Detector Convergence

```cpp
class MultiDetectorTester {
public:
    MultiDetectorTester(G4int nDet) {
        for (G4int i = 0; i < nDet; i++) {
            fTesters.push_back(
                new G4ConvergenceTester("Detector_" + std::to_string(i)));
        }
    }

    ~MultiDetectorTester() {
        for (auto* tester : fTesters) delete tester;
    }

    void ScoreEvent(G4int detID, G4double value) {
        fTesters[detID]->AddScore(value);
    }

    void ShowAllResults() {
        for (auto* tester : fTesters) {
            tester->ShowResult();
            G4cout << "-------------------" << G4endl;
        }
    }

    G4bool AllConverged(G4double threshold = 0.05) {
        for (auto* tester : fTesters) {
            if (tester->GetR() > threshold) return false;
        }
        return true;
    }

private:
    std::vector<G4ConvergenceTester*> fTesters;
};
```

### Tallying with Weight

```cpp
// Importance sampling with weights
void TallyWithWeights() {
    G4ConvergenceTester tester("Weighted");

    for (G4int i = 0; i < nEvents; i++) {
        G4double score, weight;
        SimulateEventWithWeight(score, weight);

        // Score weighted value
        tester.AddScore(score * weight);
    }

    // Check efficiency
    G4double efficiency = tester.GetEfficiency();
    G4cout << "Sampling efficiency: " << efficiency << G4endl;

    // Check if variance reduction is working
    if (efficiency < 0.01) {
        G4cout << "Warning: Low efficiency - variance reduction may not be working" << G4endl;
    }
}
```

### Convergence History Analysis

```cpp
void AnalyzeConvergence() {
    G4ConvergenceTester tester("Analysis");

    std::vector<G4double> rel_error_history;
    std::vector<G4double> fom_history;

    for (G4int i = 0; i < nEvents; i++) {
        tester.AddScore(SimulateEvent());

        if (i % 100 == 0 && i > 1000) {
            rel_error_history.push_back(tester.GetR());
            fom_history.push_back(tester.GetFOM());
        }
    }

    // Show detailed history
    tester.ShowHistory();

    // Check if R decreasing (good sign)
    G4int n = rel_error_history.size();
    if (n > 10) {
        G4double recent_slope = (rel_error_history[n-1] - rel_error_history[n-5]) / 5.0;
        if (recent_slope < 0) {
            G4cout << "Good: Relative error decreasing" << G4endl;
        } else {
            G4cout << "Warning: Relative error not decreasing" << G4endl;
        }
    }
}
```

## Statistical Quantities

### Relative Error (R)

R = σ/(mean√N)

Target: R < 0.05 (5%)

### Figure of Merit (FOM)

FOM = 1/(R²T)

Should be approximately constant if simulation efficient.

### Variance of Variance (VOV)

Measures stability of variance estimate.

Should decrease with more histories.

### Efficiency

Fraction of non-zero scores.

Low efficiency may indicate poor sampling.

## Interpretation Guide

### Good Convergence Signs

- All or most tests passing
- R < 0.05
- FOM approximately constant
- VOV decreasing
- Mean stable in second half

### Warning Signs

- FOM decreasing significantly
- VOV not decreasing
- R not decreasing with N
- Mean still changing
- Low efficiency (< 0.01)

## Performance Notes

- **Overhead:** Minimal, mostly bookkeeping
- **Memory:** O(N) for history storage
- **Recommended:** Check every 1000-10000 events
- **Minimum histories:** At least 10000 for reliable tests

## Thread Safety

Not thread-safe. Use one instance per thread, merge at end if needed.

## Related Classes

- [G4StatAnalysis](g4statanalysis.md) - Advanced statistics
- [G4StatDouble](g4statdouble.md) - Simple statistics
- [G4SimplexDownhill](g4simplexdownhill.md) - Uses convergence tester internally

## References

1. **MCNP Manual** LA-12625-M (1997)
   - Chapter 2, Section VI: Estimation of Monte Carlo Precision

2. **Lux & Koblinger** "Monte Carlo Particle Transport Methods" (1990)

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4ConvergenceTester.hh`
**Implementation:** `source/global/HEPNumerics/src/G4ConvergenceTester.cc`
**Author:** T.Koi (SLAC/SCCS)
:::
