# G4StatAnalysis API Documentation

## Overview

`G4StatAnalysis` provides advanced statistical analysis for Monte Carlo simulations, computing mean, variance, standard deviation, relative error, efficiency, and Figure of Merit (FOM). It includes timing information and statistical quality metrics essential for Monte Carlo convergence assessment.

Adapted from Lux & Koblinger, "Monte Carlo Particle Transport Methods" (1990).

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4StatAnalysis.hh`
**Implementation:** `source/global/HEPNumerics/include/G4StatAnalysis.icc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4StatAnalysis.hh:61-165`

```cpp
class G4StatAnalysis
{
 public:
  inline G4StatAnalysis();
  inline ~G4StatAnalysis() {}

  // Accumulated values
  inline G4double GetMean() const;
  inline const G4double& GetSum() const;
  inline G4int GetHits() const;

  // Computed statistics
  inline G4double GetFOM() const;
  inline G4double GetRelativeError() const;
  inline G4double GetStdDev() const;
  inline G4double GetVariance() const;
  inline G4double GetCoeffVariation() const;
  inline G4double GetEfficiency() const;

  // Modifications
  inline void Reset();
  inline void Add(const G4double& _val, const G4double& _weight = 1.0);
  inline void Rescale(const G4double& factor);

  // Operators
  inline G4StatAnalysis& operator+=(const G4double& _val);
  inline G4StatAnalysis& operator+=(const G4StatAnalysis&);
};
```

## Key Methods

### Add

`source/global/HEPNumerics/include/G4StatAnalysis.hh:100`

```cpp
void Add(const G4double& _val, const G4double& _weight = 1.0);
```

**Purpose:** Add scored value with weight

### GetMean

`source/global/HEPNumerics/include/G4StatAnalysis.hh:68`

```cpp
G4double GetMean() const;
```

**Purpose:** Get mean value

### GetRelativeError

`source/global/HEPNumerics/include/G4StatAnalysis.hh:87`

```cpp
G4double GetRelativeError() const;
```

**Purpose:** Get relative statistical error

**Formula:** σ/(mean√N)

### GetFOM

`source/global/HEPNumerics/include/G4StatAnalysis.hh:86`

```cpp
G4double GetFOM() const;
```

**Purpose:** Get Figure of Merit

**Formula:** 1/(R²T) where R is relative error, T is CPU time

**Use:** Measure simulation efficiency

## Usage Examples

### Monte Carlo Scoring

```cpp
#include "G4StatAnalysis.hh"

G4StatAnalysis detector_score;

// In stepping action
void UserSteppingAction(const G4Step* step) {
    G4double edep = step->GetTotalEnergyDeposit();
    if (edep > 0) {
        detector_score.Add(edep);
    }
}

// End of run
void EndOfRunAction() {
    G4cout << "Mean energy: " << detector_score.GetMean() << G4endl;
    G4cout << "Std dev: " << detector_score.GetStdDev() << G4endl;
    G4cout << "Relative error: " << detector_score.GetRelativeError() << G4endl;
    G4cout << "FOM: " << detector_score.GetFOM() << G4endl;
}
```

### Convergence Monitoring

```cpp
void MonitorConvergence() {
    G4StatAnalysis stats;

    for (G4int i = 0; i < nEvents; i++) {
        G4double score = SimulateEvent();
        stats.Add(score);

        if (i % 1000 == 0) {
            G4double rel_err = stats.GetRelativeError();
            G4cout << "Events: " << i
                   << ", Relative error: " << rel_err << G4endl;

            if (rel_err < 0.01) {
                G4cout << "Target precision reached!" << G4endl;
                break;
            }
        }
    }
}
```

### Efficiency Calculation

```cpp
class DetectorEfficiency {
public:
    void ScoreEvent(G4bool detected) {
        fStats.Add(detected ? 1.0 : 0.0);
    }

    void PrintResults() {
        G4double efficiency = fStats.GetMean();  // Fraction detected
        G4double error = fStats.GetRelativeError();

        G4cout << "Efficiency: " << efficiency * 100 << "%" << G4endl;
        G4cout << "Absolute error: " << efficiency * error * 100 << "%" << G4endl;
    }

private:
    G4StatAnalysis fStats;
};
```

## Performance Metrics

### Figure of Merit (FOM)

FOM measures simulation efficiency:
- **Higher is better**
- Accounts for both accuracy and speed
- Use to compare different variance reduction techniques

### Relative Error

Target values:
- **< 1%:** Excellent statistics
- **1-5%:** Good statistics
- **5-10%:** Moderate statistics
- **> 10%:** Poor statistics

## Thread Safety

Not thread-safe. Use thread-local instances and merge results.

## Related Classes

- [G4StatDouble](g4statdouble.md) - Simple single-variable statistics
- [G4ConvergenceTester](g4convergencetester.md) - MCNP-style convergence tests

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4StatAnalysis.hh`
**Implementation:** `source/global/HEPNumerics/include/G4StatAnalysis.icc`
**Author:** J.Madsen, 2018
:::
