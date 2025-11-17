# G4VSIntegration API Documentation

## Overview

`G4VSIntegration` is a base class for numerical integration and sampling of probability density functions. It implements an efficient algorithm for functions with a peak and long tail, automatically adapting the integration step size. The class is optimized for pre-compound model calculations but applicable to other physics processes.

This is a recent addition (2025) designed for Monte Carlo sampling with integrated probability distributions.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4VSIntegration.hh`
**Implementation:** `source/global/HEPNumerics/src/G4VSIntegration.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4VSIntegration.hh:46-105`

```cpp
class G4VSIntegration
{
 public:
  G4VSIntegration() = default;
  virtual ~G4VSIntegration() = default;

  virtual G4double ProbabilityDensityFunction(G4double) = 0;
  virtual const G4String& ModelName() const;

  void InitialiseIntegrator(G4double accuracy, G4double fact1, G4double fact2,
                           G4double de, G4double dmin, G4double dmax);

  G4double ComputeIntegral(const G4double emin, const G4double emax);
  G4double SampleValue();

  void SetVerbose(G4int verb) { fVerbose = verb; }
};
```

## Pure Virtual Methods

### ProbabilityDensityFunction

`source/global/HEPNumerics/include/G4VSIntegration.hh:54`

```cpp
virtual G4double ProbabilityDensityFunction(G4double) = 0;
```

**Purpose:** User must implement this to define the PDF to integrate

**Parameters:**
- Unnamed `G4double` - Energy or variable value

**Returns:** Probability density at that point

**Example:**
```cpp
class MyDistribution : public G4VSIntegration {
  G4double ProbabilityDensityFunction(G4double E) override {
    return E * std::exp(-E/kT);  // Boltzmann-like
  }
};
```

## Initialization

### InitialiseIntegrator

`source/global/HEPNumerics/include/G4VSIntegration.hh:65-66`

```cpp
void InitialiseIntegrator(G4double accuracy, G4double fact1, G4double fact2,
                         G4double de, G4double dmin, G4double dmax);
```

**Purpose:** Configure integration parameters before use

**Parameters:**
- `accuracy` - Relative accuracy target (default: 0.001)
- `fact1` - Factor < 1 to find E₁, E₂ from peak (default: 0.25)
- `fact2` - Factor > 1 for max cross section tolerance (default: 1.05)
- `de` - Default energy step (default: 1.0)
- `dmin` - Minimum step size (default: 0.1)
- `dmax` - Maximum step size (default: 2.0)

**Algorithm Details:**
- Finds peak of PDF
- Determines characteristic energies E₁ (where P = fact1×Pₘₐₓ)
- Determines E₂ (where P = fact1×P₁)
- Adapts step size in different regions

## Integration Methods

### ComputeIntegral

`source/global/HEPNumerics/include/G4VSIntegration.hh:69`

```cpp
G4double ComputeIntegral(const G4double emin, const G4double emax);
```

**Purpose:** Integrate PDF over [emin, emax]

**Returns:** Total integrated probability

**Side Effects:** Stores information for subsequent sampling

**Usage:** Must call before `SampleValue()`

### SampleValue

`source/global/HEPNumerics/include/G4VSIntegration.hh:73`

```cpp
G4double SampleValue();
```

**Purpose:** Sample a random value from the PDF

**Precondition:** `ComputeIntegral()` must be called first

**Returns:** Sampled energy/value from distribution

**Method:** Uses stored cumulative distribution

## Usage Examples

### Basic Energy Spectrum Sampling

```cpp
#include "G4VSIntegration.hh"

class EnergySpectrum : public G4VSIntegration {
public:
    EnergySpectrum(G4double temp) : fTemperature(temp) {}

    G4double ProbabilityDensityFunction(G4double E) override {
        // Maxwell-Boltzmann spectrum
        return E * std::exp(-E / fTemperature);
    }

    const G4String& ModelName() const override {
        static G4String name = "Maxwell-Boltzmann";
        return name;
    }

private:
    G4double fTemperature;
};

// Usage
EnergySpectrum spectrum(1.0*MeV);

// Initialize with default parameters
spectrum.InitialiseIntegrator(0.001, 0.25, 1.05, 1.0*MeV, 0.1*MeV, 2.0*MeV);

// Integrate from 0 to 20 MeV
G4double total = spectrum.ComputeIntegral(0.0, 20.0*MeV);

// Sample 1000 energies
for (int i = 0; i < 1000; i++) {
    G4double E = spectrum.SampleValue();
    // Use sampled energy
}
```

### Pre-Compound Model Application

```cpp
class PreCompoundSpectrum : public G4VSIntegration {
public:
    PreCompoundSpectrum(G4int Z, G4int A, G4double Ex)
        : fZ(Z), fA(A), fExcitation(Ex) {}

    G4double ProbabilityDensityFunction(G4double E) override {
        // Exciton model spectrum
        if (E <= 0 || E >= fExcitation) return 0.0;

        G4double levelDensity = LevelDensity(fExcitation - E);
        G4double inverseXS = InverseXSection(E);

        return E * levelDensity * inverseXS;
    }

private:
    G4double LevelDensity(G4double U);
    G4double InverseXSection(G4double E);

    G4int fZ, fA;
    G4double fExcitation;
};
```

### Adaptive Sampling with Quality Control

```cpp
void SampleWithQualityControl() {
    EnergySpectrum spectrum(2.0*MeV);

    // High accuracy for precise calculations
    spectrum.InitialiseIntegrator(
        0.0001,  // 0.01% accuracy
        0.2,     // Narrow peak finding
        1.02,    // Tight tolerance
        0.5*MeV, // Small default step
        0.05*MeV,
        1.0*MeV
    );

    G4double integral = spectrum.ComputeIntegral(0.0, 50.0*MeV);

    // Verify normalization
    if (std::abs(integral - 1.0) > 0.01) {
        G4cout << "Warning: Poor normalization" << G4endl;
    }

    // Sample distribution
    std::vector<G4double> samples;
    for (int i = 0; i < 10000; i++) {
        samples.push_back(spectrum.SampleValue());
    }

    // Compute mean
    G4double mean = 0.0;
    for (auto E : samples) mean += E;
    mean /= samples.size();

    G4cout << "Mean energy: " << mean/MeV << " MeV" << G4endl;
}
```

### Evaporation Spectrum

```cpp
class EvaporationSpectrum : public G4VSIntegration {
public:
    EvaporationSpectrum(G4double temp, G4double barrier)
        : fTemp(temp), fBarrier(barrier) {}

    G4double ProbabilityDensityFunction(G4double E) override {
        // Weisskopf evaporation spectrum
        if (E < fBarrier) return 0.0;

        G4double reducedE = (E - fBarrier) / fTemp;
        return reducedE * std::exp(-reducedE);
    }

private:
    G4double fTemp;
    G4double fBarrier;
};
```

## Algorithm Details

### Peak Finding Strategy

1. Scan over [Eₘᵢₙ, Eₘₐₓ] to find Pₘₐₓ
2. Find E₁ where P(E₁) = fact1 × Pₘₐₓ
3. Find E₂ where P(E₂) = fact1 × P(E₁)
4. Use adaptive steps in each region

### Step Size Adaptation

- **Near peak:** Smaller steps (size ~ dmin)
- **Peak to tail:** Medium steps (size ~ de)
- **Far tail:** Larger steps (size ~ dmax)

## Performance Notes

- **Optimized for peaked functions:** Fast convergence
- **Adaptive meshing:** Efficient for varying behavior
- **One-time cost:** Integration cost paid once
- **Fast sampling:** After integration, sampling is O(log n)

## Thread Safety

- **Not thread-safe:** Stores state in member variables
- **Recommended:** Create separate instances per thread
- **Thread-local usage:**
  ```cpp
  G4ThreadLocal MySpectrum* localSpec = nullptr;
  if (!localSpec) {
      localSpec = new MySpectrum();
      localSpec->InitialiseIntegrator(...);
  }
  ```

## Related Classes

- [G4SimpleIntegration](g4simpleintegration.md) - Simple integration methods
- [G4Integrator](g4integrator.md) - Template integrator
- [G4StatDouble](g4statdouble.md) - Statistical analysis

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4VSIntegration.hh`
**Implementation:** `source/global/HEPNumerics/src/G4VSIntegration.cc`
**Author:** V.Ivanchenko, 2025
:::
