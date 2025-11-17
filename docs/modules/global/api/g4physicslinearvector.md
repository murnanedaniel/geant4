# G4PhysicsLinearVector

## Overview

G4PhysicsLinearVector is a physics vector with **linear energy binning** - the energy bins are equally spaced on a linear scale. This provides uniform sampling across the energy range and enables O(1) bin lookup through direct calculation.

**Source Files:**
- Header: `source/global/management/include/G4PhysicsLinearVector.hh` (lines 1-67)
- Implementation: `source/global/management/src/G4PhysicsLinearVector.cc` (lines 1-88)

**Inherits from:** [G4PhysicsVector](g4physicsvector.md)

## When to Use

**Use G4PhysicsLinearVector when:**
- Energy range is relatively narrow (within 1-2 orders of magnitude)
- Physics quantity varies smoothly without rapid changes
- Uniform resolution across the range is desired
- Working with low-energy particles where linear spacing is natural

**Do NOT use when:**
- Energy range spans many orders of magnitude (use [G4PhysicsLogVector](g4physicslogvector.md))
- Need flexible/irregular binning (use [G4PhysicsFreeVector](g4physicsfreevector.md))

## Example Use Cases

1. **Particle ranges in thin materials** (narrow energy range)
2. **Angular distributions** (angle is the "energy" axis)
3. **Low-energy nuclear reactions** (MeV range)
4. **Specialized processes** with specific linear requirements

## Constructors

### Default Constructor

```cpp
explicit G4PhysicsLinearVector(G4bool spline = false);
```

Creates an empty vector for later filling via `Retrieve()` or manual population.

**Parameters:**
- `spline`: Enable spline interpolation (default: false)

**Example:**
```cpp
G4PhysicsLinearVector* vec = new G4PhysicsLinearVector(true);
std::ifstream file("data.dat");
vec->Retrieve(file, true);  // Load from file
```

---

### Pre-allocated Constructor

```cpp
explicit G4PhysicsLinearVector(G4double Emin, G4double Emax,
                              std::size_t Nbin, G4bool spline = false);
```

Creates a vector with pre-computed energy bins. Data values initialized to zero.

**Parameters:**
- `Emin`: Minimum energy (must be > 0 and < Emax)
- `Emax`: Maximum energy (must be > Emin)
- `Nbin`: Number of bins (minimum: 1, actual points = Nbin + 1)
- `spline`: Enable spline interpolation

**Energy Binning:**
```
binWidth = (Emax - Emin) / Nbin
E[i] = Emin + i * binWidth,  for i = 0, 1, ..., Nbin
```

**Example:**
```cpp
// Create vector from 1 to 10 MeV with 90 bins (91 points)
G4double eMin = 1.0*MeV;
G4double eMax = 10.0*MeV;
std::size_t nBins = 90;

G4PhysicsLinearVector* dedx = new G4PhysicsLinearVector(eMin, eMax, nBins, true);

// Energy points are: 1.0, 1.1, 1.2, ..., 9.9, 10.0 MeV
// Fill with data
for (std::size_t i = 0; i < dedx->GetVectorLength(); ++i) {
    G4double energy = dedx->Energy(i);
    G4double stoppingPower = ComputeStoppingPower(energy);
    dedx->PutValue(i, stoppingPower);
}

dedx->FillSecondDerivatives();  // Compute spline if enabled
```

## Key Features

### O(1) Bin Lookup

Linear vectors compute bin index directly without search:

```cpp
// Internal calculation (simplified)
std::size_t bin = (energy - edgeMin) * invdBin;
```

where `invdBin = numberOfBins / (edgeMax - edgeMin)`

**Performance:** Constant time O(1) regardless of vector size.

### Energy Grid

For a linear vector with Emin, Emax, and N bins:

```
Points: N + 1
Bins: N

Energy[0] = Emin
Energy[1] = Emin + Δ
Energy[2] = Emin + 2Δ
...
Energy[N] = Emax

where Δ = (Emax - Emin) / N
```

**Example:**
```cpp
G4PhysicsLinearVector vec(0*MeV, 10*MeV, 10);  // 10 bins, 11 points

// Energy grid:
// 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 MeV
```

## Complete Example: dE/dx Table for Low Energy Protons

```cpp
#include "G4PhysicsLinearVector.hh"
#include "G4Material.hh"

// Build dE/dx vector for protons in water (1-10 MeV)
G4PhysicsLinearVector* BuildProtonDEDX_LowE()
{
    G4Material* water = G4Material::GetMaterial("G4_WATER");

    // Low energy range where linear binning is appropriate
    G4double eMin = 1.0*MeV;
    G4double eMax = 10.0*MeV;
    std::size_t nBins = 180;  // ~50 keV spacing

    // Create with spline for smooth interpolation
    G4PhysicsLinearVector* dedx = new G4PhysicsLinearVector(
        eMin, eMax, nBins, true);

    G4cout << "Building dE/dx table:" << G4endl;
    G4cout << "  Energy range: " << eMin/MeV << " - " << eMax/MeV << " MeV" << G4endl;
    G4cout << "  Bins: " << nBins << G4endl;
    G4cout << "  Bin width: " << (eMax-eMin)/nBins/keV << " keV" << G4endl;

    // Fill dE/dx values
    for (std::size_t i = 0; i < dedx->GetVectorLength(); ++i) {
        G4double energy = dedx->Energy(i);

        // Compute stopping power (this would call actual physics)
        G4double stoppingPower = ComputeProtonStoppingPower(water, energy);

        dedx->PutValue(i, stoppingPower);
    }

    // Enable spline interpolation
    dedx->FillSecondDerivatives(G4SplineType::Base);

    G4cout << "  dE/dx range: " << dedx->GetMinValue()/(MeV/cm)
           << " - " << dedx->GetMaxValue()/(MeV/cm) << " MeV/cm" << G4endl;

    return dedx;
}

// Use the vector
void TestDEDX()
{
    G4PhysicsLinearVector* dedx = BuildProtonDEDX_LowE();

    // Lookup dE/dx at specific energy
    G4double energy = 5.5*MeV;
    std::size_t idx = 0;
    G4double stoppingPower = dedx->Value(energy, idx);

    G4cout << "Stopping power at " << energy/MeV << " MeV: "
           << stoppingPower/(MeV/cm) << " MeV/cm" << G4endl;

    // Compute energy loss over step
    G4double stepLength = 1.0*mm;
    G4double energyLoss = stoppingPower * stepLength;
    G4double finalEnergy = energy - energyLoss;

    G4cout << "After " << stepLength/mm << " mm: "
           << "E = " << finalEnergy/MeV << " MeV" << G4endl;

    delete dedx;
}
```

## Example: Range Table from dE/dx

```cpp
// Integrate dE/dx to create range table
G4PhysicsLinearVector* BuildRangeTable(G4PhysicsLinearVector* dedx)
{
    std::size_t nBins = dedx->GetVectorLength() - 1;

    G4PhysicsLinearVector* range = new G4PhysicsLinearVector(
        dedx->GetMinEnergy(),
        dedx->GetMaxEnergy(),
        nBins,
        true);  // Spline for inverse range->energy lookup

    // Integrate using trapezoidal rule
    G4double r = 0.0;  // Range accumulator

    for (std::size_t i = 0; i < range->GetVectorLength(); ++i) {
        G4double e = range->Energy(i);

        if (i > 0) {
            G4double e_prev = range->Energy(i-1);
            G4double dedx_curr = dedx->Value(e);
            G4double dedx_prev = dedx->Value(e_prev);

            // Δr = ∫(dE/dx)^-1 dE ≈ Δ E / <dE/dx>
            G4double dr = 0.5 * (e - e_prev) * (1.0/dedx_curr + 1.0/dedx_prev);
            r += dr;
        }

        range->PutValue(i, r);
    }

    range->FillSecondDerivatives();

    G4cout << "Range table: " << range->GetMinEnergy()/MeV << " MeV -> "
           << range->GetMinValue()/cm << " cm" << G4endl;
    G4cout << "             " << range->GetMaxEnergy()/MeV << " MeV -> "
           << range->GetMaxValue()/cm << " cm" << G4endl;

    return range;
}
```

## Linear vs. Logarithmic Comparison

### When Linear is Better

```cpp
// GOOD: Narrow range, linear spacing appropriate
G4PhysicsLinearVector good(1*MeV, 2*MeV, 100);
// Bin width: 10 keV - uniform resolution
```

### When Logarithmic is Better

```cpp
// BAD: Wide range with linear spacing wastes bins at high E
G4PhysicsLinearVector bad(1*keV, 10*GeV, 1000);
// Bins at high energy: 10 MeV spacing - poor resolution
// Bins at low energy: 10 keV spacing - overkill

// GOOD: Use logarithmic for wide ranges
G4PhysicsLogVector good(1*keV, 10*GeV, 200);
// Uniform relative resolution: ΔE/E ≈ constant
```

**Rule of thumb:**
- Linear: Energy range < 10x (e.g., 1-10 MeV)
- Logarithmic: Energy range > 100x (e.g., 1 keV - 10 GeV)

## Performance Characteristics

### Bin Lookup Speed

```cpp
// All O(1) constant time
std::size_t idx = 0;
for (int i = 0; i < 1000000; ++i) {
    G4double value = linearVec->Value(energy[i], idx);
}
```

**Timing:**
- Linear interpolation: ~30-50 ns per lookup
- Spline interpolation: ~100-150 ns per lookup

### Memory Usage

For a vector with N points:
- Linear interpolation: 2N * sizeof(G4double) ≈ 16N bytes
- Spline interpolation: 3N * sizeof(G4double) ≈ 24N bytes

**Example:** 1000-point vector
- Linear: ~16 KB
- Spline: ~24 KB

## File I/O

### Save to File

```cpp
G4PhysicsLinearVector* vec = BuildVector();

// ASCII format (human-readable)
std::ofstream outFile("linear_vector.dat");
vec->Store(outFile, true);
outFile.close();

// Binary format (faster, smaller)
std::ofstream binFile("linear_vector.bin", std::ios::binary);
vec->Store(binFile, false);
binFile.close();
```

**File format (ASCII):**
```
1.0e6 1.0e7 91
91
1.0e6 1.234e-23
1.1e6 1.456e-23
...
```

### Load from File

```cpp
G4PhysicsLinearVector* vec = new G4PhysicsLinearVector();

std::ifstream inFile("linear_vector.dat");
if (vec->Retrieve(inFile, true)) {
    G4cout << "Loaded " << vec->GetVectorLength() << " points" << G4endl;
    G4cout << "Energy range: " << vec->GetMinEnergy()/MeV << " - "
           << vec->GetMaxEnergy()/MeV << " MeV" << G4endl;
} else {
    G4cerr << "Failed to load vector" << G4endl;
}
inFile.close();
```

## Advanced: Custom Linear Spacing

While G4PhysicsLinearVector uses uniform linear spacing, you can create custom linear schemes with G4PhysicsFreeVector:

```cpp
// Non-uniform linear sections
std::vector<G4double> energies, values;

// Fine binning at low energy (0-5 MeV, 0.1 MeV steps)
for (G4double e = 0; e <= 5.0*MeV; e += 0.1*MeV) {
    energies.push_back(e);
    values.push_back(ComputeValue(e));
}

// Coarse binning at high energy (5-100 MeV, 1 MeV steps)
for (G4double e = 6.0*MeV; e <= 100*MeV; e += 1.0*MeV) {
    energies.push_back(e);
    values.push_back(ComputeValue(e));
}

G4PhysicsFreeVector* customVec = new G4PhysicsFreeVector(energies, values, true);
customVec->FillSecondDerivatives();
```

## Thread Safety

G4PhysicsLinearVector follows the same thread-safety rules as [G4PhysicsVector](g4physicsvector.md):

**Thread-safe (read-only after construction):**
```cpp
// Build in master thread
G4PhysicsLinearVector* vec = BuildVector();
vec->FillSecondDerivatives();

// Safe to read from multiple threads
#pragma omp parallel
{
    std::size_t idx = 0;  // Thread-local cache
    G4double val = vec->Value(energy, idx);  // Safe
}
```

**NOT thread-safe:**
```cpp
// Concurrent modification
#pragma omp parallel
{
    vec->PutValue(i, value);  // DANGER - race condition
}
```

## Limitations

1. **Cannot include zero for log operations:**
   - If you need log-scale calculations with linear vector, minimum energy must be > 0

2. **Fixed binning after construction:**
   - Cannot change bin boundaries after creation
   - Use G4PhysicsFreeVector if dynamic binning is needed

3. **Inefficient for wide ranges:**
   - Linear spacing wastes bins at high energies
   - Use G4PhysicsLogVector for ranges > 100x

## Related Classes

- [G4PhysicsVector](g4physicsvector.md) - Base class with full API documentation
- [G4PhysicsLogVector](g4physicslogvector.md) - Logarithmic binning alternative
- [G4PhysicsFreeVector](g4physicsfreevector.md) - Arbitrary binning
- [G4PhysicsVectorType](g4physicsvectortype.md) - Type enumerations
- [G4PhysicsTable](g4physicstable.md) - Collections of vectors

## See Also

- Physics Reference Manual, "Energy Loss Tables"
- G4VEnergyLossProcess - Uses linear/log vectors for dE/dx
- G4EmCalculator - Utility for computing physics values
