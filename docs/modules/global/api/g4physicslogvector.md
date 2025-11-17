# G4PhysicsLogVector

## Overview

**G4PhysicsLogVector is the MOST COMMONLY USED physics vector in Geant4.** It provides **logarithmic energy binning** - energy bins are equally spaced on a logarithmic scale, providing uniform relative resolution (ΔE/E ≈ constant) across wide energy ranges. This is ideal for physics data that spans many orders of magnitude.

**Source Files:**
- Header: `source/global/management/include/G4PhysicsLogVector.hh` (lines 1-67)
- Implementation: `source/global/management/src/G4PhysicsLogVector.cc` (lines 1-89)

**Inherits from:** [G4PhysicsVector](g4physicsvector.md)

## Why Logarithmic Binning?

Most physics cross-sections and energy-dependent quantities vary smoothly on a logarithmic energy scale and span many orders of magnitude (e.g., 1 keV to 100 GeV = 8 orders of magnitude). Logarithmic binning provides:

1. **Efficient sampling:** Equal relative resolution at all energies
2. **O(1) lookup:** Direct bin calculation (no search required)
3. **Memory efficiency:** Far fewer bins needed than linear spacing
4. **Natural physics scale:** Most physics processes are log-scale

## When to Use

**Use G4PhysicsLogVector (RECOMMENDED) when:**
- Energy range spans > 2 orders of magnitude (e.g., keV to GeV)
- Storing cross-sections, stopping power, ranges, attenuation coefficients
- **This is the default choice for most physics tables in Geant4**

**Do NOT use when:**
- Minimum energy is zero (log(0) is undefined)
- Energy range is narrow < 10x (use [G4PhysicsLinearVector](g4physicslinearvector.md))
- Need irregular binning (use [G4PhysicsFreeVector](g4physicsfreevector.md))

## Standard Use Cases in Geant4

G4PhysicsLogVector is used extensively for:

1. **Cross-section tables** (photon, electron, hadron interactions)
2. **dE/dx (stopping power) tables**
3. **Range tables**
4. **Photon attenuation coefficients**
5. **Mean free path tables**
6. **Energy distribution functions**

## Constructors

### Default Constructor

```cpp
explicit G4PhysicsLogVector(G4bool spline = false);
```

Creates an empty vector for later filling via `Retrieve()` or manual population.

**Parameters:**
- `spline`: Enable spline interpolation (default: false)

**Example:**
```cpp
G4PhysicsLogVector* vec = new G4PhysicsLogVector(true);
std::ifstream file("crosssection.dat");
vec->Retrieve(file, true);
```

---

### Pre-allocated Constructor

```cpp
explicit G4PhysicsLogVector(G4double Emin, G4double Emax,
                           std::size_t Nbin, G4bool spline = false);
```

Creates a vector with pre-computed logarithmic energy bins. Data values initialized to zero.

**Parameters:**
- `Emin`: Minimum energy (**must be > 0** and < Emax)
- `Emax`: Maximum energy (must be > Emin)
- `Nbin`: Number of bins (minimum: 2, actual points = Nbin + 1)
- `spline`: Enable spline interpolation

**Energy Binning Formula:**
```
E[i] = Emin * exp(i * Δ),  for i = 0, 1, ..., Nbin

where Δ = ln(Emax/Emin) / Nbin
```

**Example:**
```cpp
// Standard cross-section table: 1 keV to 100 GeV
G4double eMin = 1.0*keV;
G4double eMax = 100.0*GeV;  // 8 orders of magnitude!
std::size_t nBins = 200;     // Very efficient

G4PhysicsLogVector* xs = new G4PhysicsLogVector(eMin, eMax, nBins, true);

// Fill with cross-section data
for (std::size_t i = 0; i < xs->GetVectorLength(); ++i) {
    G4double energy = xs->Energy(i);
    G4double crossSection = ComputeCrossSection(energy);
    xs->PutValue(i, crossSection);
}

xs->FillSecondDerivatives();  // Enable spline interpolation
```

**WARNING:** `Emin` must be > 0! Cannot use zero energy with logarithmic vectors.

## Key Features

### O(1) Logarithmic Bin Lookup

Log vectors compute bin index directly:

```cpp
// Internal calculation (simplified)
std::size_t bin = (log(energy) - log(Emin)) * invdBin;
```

where `invdBin = numberOfBins / log(Emax/Emin)`

**Performance:** Constant time O(1), as fast as linear vectors!

### Uniform Relative Resolution

Logarithmic spacing provides constant **relative** resolution:

```
ΔE / E ≈ constant

Example with 200 bins from 1 keV to 100 GeV:
At 1 keV:   ΔE ≈ 0.06 keV  (6%)
At 1 MeV:   ΔE ≈ 60 keV    (6%)
At 1 GeV:   ΔE ≈ 60 MeV    (6%)
```

This matches how physics cross-sections naturally vary!

### Energy Grid

For a log vector with Emin, Emax, and N bins:

```
Points: N + 1
Bins: N

Energy[0] = Emin
Energy[1] = Emin * r
Energy[2] = Emin * r²
...
Energy[N] = Emax = Emin * r^N

where r = (Emax/Emin)^(1/N)  (bin ratio)
```

**Example:**
```cpp
G4PhysicsLogVector vec(1*keV, 1*MeV, 3);  // 3 bins, 4 points

// Energy grid:
// 1 keV, 10 keV, 100 keV, 1000 keV (1 MeV)
// Ratio r = 10, each bin spans one decade
```

## Complete Example: Photon Cross-Section Table

```cpp
#include "G4PhysicsLogVector.hh"
#include "G4Material.hh"
#include "G4Gamma.hh"

// Build photoelectric cross-section for gamma in Lead
G4PhysicsLogVector* BuildPhotoelectricXS_Pb()
{
    G4Material* lead = G4Material::GetMaterial("G4_Pb");
    G4ParticleDefinition* gamma = G4Gamma::Definition();

    // Typical photon energy range: 1 keV to 100 GeV
    G4double eMin = 1.0*keV;
    G4double eMax = 100.0*GeV;
    std::size_t nBins = 220;  // ~10-12 bins per decade

    G4cout << "Building photoelectric XS for Lead:" << G4endl;
    G4cout << "  Energy range: " << eMin/keV << " keV to "
           << eMax/GeV << " GeV" << G4endl;
    G4cout << "  Decades: " << std::log10(eMax/eMin) << G4endl;
    G4cout << "  Bins: " << nBins << " (~"
           << nBins/std::log10(eMax/eMin) << " per decade)" << G4endl;

    // Create with spline for smooth interpolation
    G4PhysicsLogVector* xs = new G4PhysicsLogVector(eMin, eMax, nBins, true);

    // Fill cross-section values
    for (std::size_t i = 0; i < xs->GetVectorLength(); ++i) {
        G4double energy = xs->Energy(i);

        // This would call the actual photoelectric cross-section model
        G4double crossSection = ComputePhotoelectricXS(gamma, lead, energy);

        xs->PutValue(i, crossSection);
    }

    // CRITICAL: Compute spline coefficients
    xs->FillSecondDerivatives(G4SplineType::Base);

    G4cout << "  XS range: " << xs->GetMinValue()/barn << " - "
           << xs->GetMaxValue()/barn << " barn" << G4endl;

    return xs;
}

// Use in simulation
void SimulatePhotonInteraction()
{
    G4PhysicsLogVector* photoXS = BuildPhotoelectricXS_Pb();

    // Get cross-section at specific energy
    G4double photonEnergy = 100*keV;
    std::size_t idx = 0;  // Cache for sequential lookups

    G4double xs = photoXS->Value(photonEnergy, idx);

    G4cout << "Photoelectric XS at " << photonEnergy/keV << " keV: "
           << xs/barn << " barn" << G4endl;

    // Compute mean free path
    G4double atomicDensity = 3.3e22 / cm3;  // Lead
    G4double lambda = 1.0 / (xs * atomicDensity);

    G4cout << "Mean free path: " << lambda/mm << " mm" << G4endl;

    // Sample interaction distance
    G4double distance = -lambda * std::log(G4UniformRand());

    delete photoXS;
}
```

## Example: Electron dE/dx Table (Full Workflow)

```cpp
// Build complete dE/dx table for electrons in water
class ElectronDEDXBuilder
{
public:
    static G4PhysicsLogVector* Build(const G4Material* material)
    {
        // Standard energy range for electrons
        G4double eMin = 1.0*keV;
        G4double eMax = 10.0*TeV;  // 10 orders of magnitude!
        std::size_t nBins = 240;    // ~24 bins per decade

        G4PhysicsLogVector* dedx = new G4PhysicsLogVector(
            eMin, eMax, nBins, true);

        for (std::size_t i = 0; i < dedx->GetVectorLength(); ++i) {
            G4double energy = dedx->Energy(i);

            // Sum contributions from all processes
            G4double totalDEDX = 0.0;
            totalDEDX += ComputeIonizationDEDX(energy, material);
            totalDEDX += ComputeBremDEDX(energy, material);
            // ... other processes

            dedx->PutValue(i, totalDEDX);
        }

        dedx->FillSecondDerivatives();
        return dedx;
    }

    static void PrintTable(G4PhysicsLogVector* dedx)
    {
        G4cout << "\\nElectron dE/dx Table:" << G4endl;
        G4cout << "Energy (MeV)    dE/dx (MeV/cm)" << G4endl;
        G4cout << "--------------------------------" << G4endl;

        // Print at selected energies (decades)
        for (G4double e = dedx->GetMinEnergy();
             e <= dedx->GetMaxEnergy(); e *= 10.0)
        {
            G4double dedxValue = dedx->Value(e);
            G4cout << std::setw(12) << e/MeV
                   << std::setw(16) << dedxValue/(MeV/cm) << G4endl;
        }
    }

    static void SaveToFile(G4PhysicsLogVector* dedx, const G4String& filename)
    {
        std::ofstream file(filename);
        if (dedx->Store(file, true)) {  // ASCII format
            G4cout << "dE/dx table saved to " << filename << G4endl;
        }
        file.close();
    }
};

// Usage
void TestElectronDEDX()
{
    G4Material* water = G4Material::GetMaterial("G4_WATER");

    G4PhysicsLogVector* dedx = ElectronDEDXBuilder::Build(water);
    ElectronDEDXBuilder::PrintTable(dedx);
    ElectronDEDXBuilder::SaveToFile(dedx, "electron_dedx_water.dat");

    // Use in stepping
    G4double kineticEnergy = 1.5*MeV;
    G4double stepLength = 1.0*mm;

    G4double stoppingPower = dedx->Value(kineticEnergy);
    G4double energyLoss = stoppingPower * stepLength;

    G4cout << "\\nAt E = " << kineticEnergy/MeV << " MeV:" << G4endl;
    G4cout << "  dE/dx = " << stoppingPower/(MeV/cm) << " MeV/cm" << G4endl;
    G4cout << "  ΔE over " << stepLength/mm << " mm = "
           << energyLoss/keV << " keV" << G4endl;

    delete dedx;
}
```

## Optimized Value Lookup with LogVectorValue()

For log vectors, if you have already computed log(energy), use the optimized method:

```cpp
std::size_t idx = 0;
G4double energy = 1.5*MeV;
G4double logEnergy = G4Log(energy);  // Compute once

// Standard method
G4double val1 = logVec->Value(energy, idx);  // Computes log internally

// Optimized method (saves one log calculation)
G4double val2 = logVec->LogVectorValue(energy, logEnergy);  // Uses provided log

// Both give same result, but second is faster
```

**When to use:**
- High-performance inner loops
- When log(energy) is needed for other calculations
- Processing millions of events

## Comparison: Linear vs. Logarithmic Efficiency

### Scenario: 1 keV to 100 GeV range

**Linear spacing:**
```cpp
// BAD: Linear spacing over 8 decades
G4PhysicsLinearVector bad(1*keV, 100*GeV, 100000);
// Need 100,000 bins for decent resolution at low energy
// Memory: ~800 KB for linear + spline
// Bin width at low E: 1 GeV (terrible!)
// Bin width at high E: 1 GeV (ok)
```

**Logarithmic spacing:**
```cpp
// GOOD: Log spacing over 8 decades
G4PhysicsLogVector good(1*keV, 100*GeV, 200);
// Only 200 bins needed for uniform 4% resolution everywhere
// Memory: ~1.6 KB for linear + spline (500x less!)
// Relative resolution: ~4% at all energies
```

**Memory savings: 500:1**
**Same or better accuracy with log spacing!**

## Building Range Tables from dE/dx

```cpp
// Integrate dE/dx to get range as function of energy
G4PhysicsLogVector* BuildRangeFromDEDX(G4PhysicsLogVector* dedx)
{
    std::size_t nBins = dedx->GetVectorLength() - 1;

    G4PhysicsLogVector* range = new G4PhysicsLogVector(
        dedx->GetMinEnergy(),
        dedx->GetMaxEnergy(),
        nBins,
        true);  // Spline for smooth inverse lookup

    G4cout << "Integrating dE/dx to range..." << G4endl;

    // Integrate using logarithmic trapezoidal rule
    G4double r = 0.0;

    for (std::size_t i = 0; i < range->GetVectorLength(); ++i) {
        G4double e = range->Energy(i);

        if (i > 0) {
            // For log spacing, integration is more accurate
            G4double e_prev = range->Energy(i-1);
            G4double dedx_curr = dedx->Value(e);
            G4double dedx_prev = dedx->Value(e_prev);

            // Trapezoidal rule: Δr = ∫(dE/dx)^-1 dE
            G4double dr = 0.5 * (e - e_prev) *
                         (1.0/dedx_curr + 1.0/dedx_prev);
            r += dr;
        }

        range->PutValue(i, r);
    }

    range->FillSecondDerivatives();

    G4cout << "Range table complete:" << G4endl;
    G4cout << "  At " << range->GetMinEnergy()/keV << " keV: "
           << range->GetMinValue()/um << " um" << G4endl;
    G4cout << "  At " << range->GetMaxEnergy()/GeV << " GeV: "
           << range->GetMaxValue()/m << " m" << G4endl;

    return range;
}

// Inverse: Given range, find residual energy
G4double GetEnergyFromRange(G4PhysicsLogVector* rangeTable,
                            G4double range)
{
    // Use GetEnergy() for inverse lookup
    // This works because both energy and range are monotonically increasing
    return rangeTable->GetEnergy(range);
}

// Example: Particle loses energy over distance
void SimulateRangeStraggling()
{
    G4PhysicsLogVector* rangeTable = LoadRangeTable();

    G4double initialEnergy = 10.0*MeV;
    G4double pathLength = 5.0*mm;

    // Get initial range
    G4double initialRange = rangeTable->Value(initialEnergy);

    // Residual range after path
    G4double residualRange = initialRange - pathLength;

    if (residualRange > 0) {
        // Find residual energy using inverse lookup
        G4double finalEnergy = rangeTable->GetEnergy(residualRange);

        G4cout << "Initial: E = " << initialEnergy/MeV
               << " MeV, R = " << initialRange/mm << " mm" << G4endl;
        G4cout << "After " << pathLength/mm << " mm:" << G4endl;
        G4cout << "  E = " << finalEnergy/MeV << " MeV" << G4endl;
        G4cout << "  ΔE = " << (initialEnergy - finalEnergy)/keV << " keV" << G4endl;
    } else {
        G4cout << "Particle stopped!" << G4endl;
    }

    delete rangeTable;
}
```

## Performance Benchmarks

### Lookup Speed (typical values)

```cpp
// Setup
G4PhysicsLogVector vec(1*keV, 100*GeV, 200, false);  // No spline
std::size_t idx = 0;

// Benchmark
auto start = std::chrono::high_resolution_clock::now();
for (int i = 0; i < 1000000; ++i) {
    G4double val = vec.Value(randomEnergy[i], idx);
}
auto end = std::chrono::high_resolution_clock::now();

// Typical timing:
// Linear interpolation: 30-50 ns per lookup
// Spline interpolation: 100-150 ns per lookup
// With proper index caching: may be even faster
```

### Memory Footprint

```cpp
// Example: 200-point vector
// sizeof(G4double) = 8 bytes

G4PhysicsLogVector vecLinear(eMin, eMax, 199, false);
// binVector: 200 * 8 = 1600 bytes
// dataVector: 200 * 8 = 1600 bytes
// Other members: ~100 bytes
// Total: ~3.3 KB

G4PhysicsLogVector vecSpline(eMin, eMax, 199, true);
// binVector: 200 * 8 = 1600 bytes
// dataVector: 200 * 8 = 1600 bytes
// secDerivative: 200 * 8 = 1600 bytes
// Other members: ~100 bytes
// Total: ~5.0 KB

// For 8 decades (1 keV - 100 GeV), 200 bins is more than enough!
```

## Thread Safety

G4PhysicsLogVector follows standard [G4PhysicsVector](g4physicsvector.md) thread-safety:

**Thread-safe (after construction):**
```cpp
// Master thread
G4PhysicsLogVector* xs = BuildCrossSectionVector();
xs->FillSecondDerivatives();

// Worker threads - read-only access is safe
void WorkerThread(int threadID) {
    std::size_t idx = 0;  // Thread-local cache
    for (auto energy : energies) {
        G4double value = xs->Value(energy, idx);  // Safe
    }
}
```

**NOT thread-safe:**
- Concurrent `PutValue()` calls
- Concurrent `FillSecondDerivatives()`
- Sharing `idx` cache between threads

## Common Mistakes and Solutions

### Mistake 1: Using Zero as Minimum Energy

```cpp
// WRONG - log(0) is undefined!
G4PhysicsLogVector bad(0*eV, 100*GeV, 200);
// Will throw exception or crash

// CORRECT - use small non-zero value
G4PhysicsLogVector good(1*eV, 100*GeV, 200);
// Or even smaller: 0.1*eV, 0.01*eV, etc.
```

### Mistake 2: Too Few Bins

```cpp
// BAD - too few bins per decade
G4PhysicsLogVector bad(1*keV, 100*GeV, 20);  // Only 2.5 bins/decade
// Inaccurate interpolation, especially without spline

// GOOD - adequate bins per decade
G4PhysicsLogVector good(1*keV, 100*GeV, 200);  // 25 bins/decade
// With spline: excellent accuracy
```

**Rule of thumb:** 10-30 bins per decade for spline interpolation

### Mistake 3: Forgetting FillSecondDerivatives()

```cpp
G4PhysicsLogVector* vec = new G4PhysicsLogVector(eMin, eMax, 200, true);
// Fill data...
// MISSING: vec->FillSecondDerivatives();

// Result: Uses linear interpolation despite spline=true!
```

**Always call FillSecondDerivatives() when using spline=true**

## Related Classes

- [G4PhysicsVector](g4physicsvector.md) - Base class with full API
- [G4PhysicsLinearVector](g4physicslinearvector.md) - Linear binning alternative
- [G4PhysicsFreeVector](g4physicsfreevector.md) - Arbitrary binning
- [G4PhysicsVectorType](g4physicsvectortype.md) - Type enumerations
- [G4PhysicsTable](g4physicstable.md) - Collections of vectors

## See Also

- Physics Reference Manual, "Cross Section and Energy Loss"
- Application Developer Guide, "Physics Tables"
- G4VEmProcess, G4VEnergyLossProcess - Major users of log vectors
- G4EmModelManager - Manages physics vectors for different models
