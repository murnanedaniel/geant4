# G4Physics2DVector

## Overview

G4Physics2DVector provides **2-dimensional physics data storage** with bilinear or bicubic interpolation. It stores physics quantities that depend on two variables (typically energy and angle) in a grid format, enabling efficient 2D lookups for scattering distributions, differential cross-sections, and other angular-dependent physics data.

**Source Files:**
- Header: `source/global/management/include/G4Physics2DVector.hh` (lines 1-162)
- Inline: `source/global/management/include/G4Physics2DVector.icc`
- Implementation: `source/global/management/src/G4Physics2DVector.cc`

## Purpose

G4Physics2DVector is used for physics data that depends on two independent variables:

1. **Differential cross-sections**: dσ/dΩ(E, θ) - Energy and angle
2. **Angular distributions**: f(E, θ) - Scattering angles vs. energy
3. **Energy-angle correlations**: Secondary particle distributions
4. **Double-differential distributions**: d²σ/(dE dΩ)
5. **Polarization data**: Spin-dependent quantities

## When to Use

**Use G4Physics2DVector when:**
- Physics quantity depends on TWO variables (e.g., energy AND angle)
- Need interpolation in 2D space
- Data is structured on a regular or free grid
- Working with scattering distributions, angular correlations

**Do NOT use when:**
- Data depends on only one variable (use [G4PhysicsVector](g4physicsvector.md))
- Need more than 2 dimensions (implement custom solution)
- Data is very sparse (consider alternative representations)

## Constructors

### Default Constructor

```cpp
G4Physics2DVector();
```

Creates empty 2D vector for later filling via `Retrieve()`.

---

### Pre-allocated Constructor

```cpp
explicit G4Physics2DVector(std::size_t nx, std::size_t ny);
```

Allocates grid of size `nx × ny`. Minimum 2×2 required.

**Parameters:**
- `nx`: Number of X-axis points (minimum: 2)
- `ny`: Number of Y-axis points (minimum: 2)

**Example:**
```cpp
// Create 50×36 grid for E vs. angle
std::size_t nEnergies = 50;
std::size_t nAngles = 36;  // Every 5 degrees

G4Physics2DVector* diffXS = new G4Physics2DVector(nEnergies, nAngles);
```

## Public Methods

### Setting Grid Points

```cpp
inline void PutX(std::size_t idx, G4double value);
inline void PutY(std::size_t idy, G4double value);
```

Set X-axis (first dimension) and Y-axis (second dimension) values.

**Example:**
```cpp
G4Physics2DVector* vec = new G4Physics2DVector(10, 18);

// Set energy grid (X-axis)
for (std::size_t i = 0; i < 10; ++i) {
    G4double energy = 1*keV * std::pow(10, i/9.0 * 3.0);  // 1 keV to 1 GeV
    vec->PutX(i, energy);
}

// Set angle grid (Y-axis) - cosTheta from -1 to +1
for (std::size_t j = 0; j < 18; ++j) {
    G4double cosTheta = -1.0 + 2.0 * j / 17.0;
    vec->PutY(j, cosTheta);
}
```

---

```cpp
void PutVectors(const std::vector<G4double>& vecX,
                const std::vector<G4double>& vecY);
```

Set both axes at once from vectors.

**Example:**
```cpp
std::vector<G4double> energies = {1*keV, 10*keV, 100*keV, 1*MeV, 10*MeV};
std::vector<G4double> angles = {-1, -0.5, 0, 0.5, 1};  // cosTheta

vec->PutVectors(energies, angles);
```

### Setting Data Values

```cpp
inline void PutValue(std::size_t idx, std::size_t idy, G4double value);
```

Set data value at grid point (idx, idy).

**Example - Differential cross-section:**
```cpp
// Fill dσ/dΩ(E, cosθ) grid
for (std::size_t i = 0; i < nEnergies; ++i) {
    G4double energy = vec->GetX(i);

    for (std::size_t j = 0; j < nAngles; ++j) {
        G4double cosTheta = vec->GetY(j);

        G4double diffXS = ComputeDifferentialCrossSection(energy, cosTheta);
        vec->PutValue(i, j, diffXS);
    }
}
```

### Value Retrieval (CRITICAL METHODS)

```cpp
G4double Value(G4double x, G4double y, std::size_t& lastidx,
               std::size_t& lastidy) const;
```

**Main interpolation method** with index caching for performance.

**Parameters:**
- `x`: First coordinate (e.g., energy)
- `y`: Second coordinate (e.g., angle)
- `lastidx`: Cached X-bin index (in/out)
- `lastidy`: Cached Y-bin index (in/out)

**Returns:** Interpolated value (bilinear or bicubic)

**Example:**
```cpp
std::size_t idxE = 0, idxAngle = 0;  // Initialize caches

// In simulation loop
for (auto& event : events) {
    G4double energy = event.GetEnergy();
    G4double cosTheta = event.GetCosTheta();

    // Fast lookup with caching
    G4double diffXS = vec->Value(energy, cosTheta, idxE, idxAngle);

    // Process with differential cross-section...
}
```

---

```cpp
G4double Value(G4double x, G4double y) const;
```

Simplified version without index caching.

**Example:**
```cpp
G4double xs = vec->Value(1.5*MeV, 0.5);  // E=1.5 MeV, cosθ=0.5
```

### Data Access

```cpp
inline G4double GetX(std::size_t index) const;
inline G4double GetY(std::size_t index) const;
inline G4double GetValue(std::size_t idx, std::size_t idy) const;
```

Direct access to grid points and values.

**Example:**
```cpp
// Print grid
for (std::size_t i = 0; i < vec->GetLengthX(); ++i) {
    for (std::size_t j = 0; j < vec->GetLengthY(); ++j) {
        G4cout << "Value[" << i << "," << j << "] at ("
               << vec->GetX(i) << ", " << vec->GetY(j) << ") = "
               << vec->GetValue(i, j) << G4endl;
    }
}
```

### Bin Finding

```cpp
inline std::size_t FindBinLocationX(const G4double x,
                                    const std::size_t lastidx) const;
inline std::size_t FindBinLocationY(const G4double y,
                                    const std::size_t lastidy) const;
```

Find bin indices for given coordinates.

### Grid Dimensions

```cpp
inline std::size_t GetLengthX() const;
inline std::size_t GetLengthY() const;
inline G4PhysicsVectorType GetType() const;
```

Query vector properties.

### Interpolation Control

```cpp
inline void SetBicubicInterpolation(G4bool);
```

Enable/disable bicubic interpolation (default: bilinear).

**Parameters:**
- `true`: Use bicubic interpolation (smoother, slower)
- `false`: Use bilinear interpolation (faster, default)

**Example:**
```cpp
vec->SetBicubicInterpolation(true);  // Enable for smooth distributions
```

### Scaling

```cpp
void ScaleVector(G4double factor);
```

Multiply all data values by factor. Grid coordinates unchanged.

**Example - Unit conversion:**
```cpp
// After loading from file with cross-sections in millibarns
vec->ScaleVector(millibarn);  // Convert to Geant4 units
```

### Sampling from Cumulative Distribution

```cpp
G4double FindLinearX(G4double rand, G4double y, std::size_t& lastidy) const;
inline G4double FindLinearX(G4double rand, G4double y) const;
```

Find X value from cumulative distribution at fixed Y. Useful for sampling.

**Use case:** Sample energy from angular-dependent energy distribution.

### File I/O

```cpp
void Store(std::ofstream& fOut) const;
G4bool Retrieve(std::ifstream& fIn);
```

Save/load 2D vector to/from file (ASCII format only).

**Example:**
```cpp
// Save
std::ofstream out("angular_dist.dat");
vec->Store(out);
out.close();

// Load
G4Physics2DVector* loaded = new G4Physics2DVector();
std::ifstream in("angular_dist.dat");
if (loaded->Retrieve(in)) {
    G4cout << "Loaded " << loaded->GetLengthX() << " × "
           << loaded->GetLengthY() << " grid" << G4endl;
}
in.close();
```

### Verbosity

```cpp
inline void SetVerboseLevel(G4int value);
```

Control diagnostic output.

## Complete Example: Compton Scattering Angular Distribution

```cpp
#include "G4Physics2DVector.hh"

// Build Klein-Nishina differential cross-section table
G4Physics2DVector* BuildComptonAngularDistribution()
{
    // Energy range: 1 keV to 10 MeV
    // Angle range: cosθ from -1 to +1
    std::size_t nEnergies = 40;
    std::size_t nAngles = 36;

    G4Physics2DVector* diffXS = new G4Physics2DVector(nEnergies, nAngles);

    // Set up energy grid (logarithmic)
    std::vector<G4double> energies;
    for (std::size_t i = 0; i < nEnergies; ++i) {
        G4double energy = 1*keV * std::pow(10000, i/(nEnergies-1.0));
        energies.push_back(energy);
    }

    // Set up angle grid (linear in cosθ)
    std::vector<G4double> cosThetas;
    for (std::size_t j = 0; j < nAngles; ++j) {
        G4double cosTheta = -1.0 + 2.0 * j / (nAngles - 1.0);
        cosThetas.push_back(cosTheta);
    }

    diffXS->PutVectors(energies, cosThetas);

    // Fill with Klein-Nishina formula
    G4cout << "Computing Klein-Nishina distribution..." << G4endl;

    for (std::size_t i = 0; i < nEnergies; ++i) {
        G4double E0 = energies[i];
        G4double x = E0 / (electron_mass_c2);

        for (std::size_t j = 0; j < nAngles; ++j) {
            G4double cosTheta = cosThetas[j];

            // Klein-Nishina formula
            G4double ratio = 1.0 / (1.0 + x * (1.0 - cosTheta));
            G4double dSigma_dOmega = classic_electr_radius * classic_electr_radius
                                   * ratio * ratio
                                   * (ratio + 1.0/ratio - 1.0 + cosTheta*cosTheta)
                                   / 2.0;

            diffXS->PutValue(i, j, dSigma_dOmega);
        }
    }

    // Use bicubic for smooth angular distributions
    diffXS->SetBicubicInterpolation(true);

    G4cout << "Klein-Nishina table complete: " << nEnergies << " × "
           << nAngles << " grid" << G4endl;

    return diffXS;
}

// Use to get differential cross-section
void TestComptonDiffXS()
{
    G4Physics2DVector* comptonDiffXS = BuildComptonAngularDistribution();

    // Lookup differential XS at specific energy and angle
    G4double photonEnergy = 100*keV;
    G4double scatterAngle = 60*degree;  // Convert to radians
    G4double cosTheta = std::cos(scatterAngle);

    std::size_t idxE = 0, idxAngle = 0;

    G4double dSigma = comptonDiffXS->Value(photonEnergy, cosTheta,
                                          idxE, idxAngle);

    G4cout << "At E = " << photonEnergy/keV << " keV, θ = "
           << scatterAngle/degree << " deg:" << G4endl;
    G4cout << "  dσ/dΩ = " << dSigma/barn << " barn/sr" << G4endl;

    delete comptonDiffXS;
}
```

## Example: Sampling from 2D Distribution

```cpp
// Build cumulative angular distribution for each energy
class AngularSampler
{
public:
    static G4Physics2DVector* BuildCDF(
        const std::vector<G4double>& energies,
        const std::vector<G4double>& cosThetas,
        std::function<G4double(G4double, G4double)> diffXSFunc)
    {
        std::size_t nE = energies.size();
        std::size_t nAngle = cosThetas.size();

        G4Physics2DVector* cdf = new G4Physics2DVector(nE, nAngle);
        cdf->PutVectors(energies, cosThetas);

        // Build cumulative distribution for each energy
        for (std::size_t i = 0; i < nE; ++i) {
            G4double energy = energies[i];

            // Integrate differential cross-section
            G4double cumulative = 0.0;
            std::vector<G4double> cdfValues(nAngle);

            for (std::size_t j = 0; j < nAngle; ++j) {
                if (j > 0) {
                    G4double cosTheta1 = cosThetas[j-1];
                    G4double cosTheta2 = cosThetas[j];
                    G4double dSigma1 = diffXSFunc(energy, cosTheta1);
                    G4double dSigma2 = diffXSFunc(energy, cosTheta2);

                    // Integrate: ∫ dσ/dΩ d(cosθ) × 2π
                    cumulative += 0.5 * (dSigma1 + dSigma2)
                                * (cosTheta2 - cosTheta1) * twopi;
                }
                cdfValues[j] = cumulative;
            }

            // Normalize to [0, 1]
            for (std::size_t j = 0; j < nAngle; ++j) {
                cdf->PutValue(i, j, cdfValues[j] / cumulative);
            }
        }

        return cdf;
    }

    static G4double SampleCosTheta(G4Physics2DVector* cdf, G4double energy)
    {
        G4double random = G4UniformRand();
        return cdf->FindLinearX(random, energy);
    }
};

// Usage
void TestSampling()
{
    auto kleinNishina = [](G4double E, G4double cosTheta) {
        // Klein-Nishina formula
        G4double x = E / electron_mass_c2;
        G4double ratio = 1.0 / (1.0 + x * (1.0 - cosTheta));
        return classic_electr_radius * classic_electr_radius
             * ratio * ratio
             * (ratio + 1.0/ratio - 1.0 + cosTheta*cosTheta) / 2.0;
    };

    std::vector<G4double> energies, cosThetas;
    // Fill grids...

    G4Physics2DVector* cdf = AngularSampler::BuildCDF(
        energies, cosThetas, kleinNishina);

    // Sample scattering angle for 100 keV photon
    G4double cosTheta = AngularSampler::SampleCosTheta(cdf, 100*keV);
    G4double theta = std::acos(cosTheta);

    G4cout << "Sampled scattering angle: " << theta/degree << " deg" << G4endl;

    delete cdf;
}
```

## Interpolation Methods

### Bilinear Interpolation (Default)

For point (x, y) in cell [(x₁,y₁), (x₂,y₂)]:

```
f(x,y) ≈ f₁₁(1-t)(1-u) + f₂₁ t(1-u) + f₁₂(1-t)u + f₂₂ tu

where:
  t = (x - x₁) / (x₂ - x₁)
  u = (y - y₁) / (y₂ - y₁)
  f_ij = value at (x_i, y_j)
```

**Characteristics:**
- Fast computation
- Continuous but derivatives may be discontinuous
- Sufficient for most physics applications

### Bicubic Interpolation

Uses 16 surrounding points for smoother interpolation with continuous first derivatives.

**Characteristics:**
- Slower (~3-4x bilinear)
- Smooth continuous derivatives
- Better for visualization and sampling
- Use when accuracy is critical

**Enable with:**
```cpp
vec->SetBicubicInterpolation(true);
```

## Performance Considerations

### Memory Usage

For grid size `nx × ny`:
```
xVector: nx * sizeof(G4double) = nx * 8 bytes
yVector: ny * sizeof(G4double) = ny * 8 bytes
value grid: nx * ny * sizeof(G4double) = nx * ny * 8 bytes

Total ≈ 8 * (nx + ny + nx*ny) bytes
```

**Example:** 50×36 grid
```
50*8 + 36*8 + 50*36*8 = 400 + 288 + 14400 = ~15 KB
```

### Lookup Speed

```cpp
// Typical timings per Value() call:
// Bilinear:  ~100-150 ns (with index caching)
// Bicubic:   ~400-600 ns (with index caching)
// Without caching: Add ~50 ns for binary search
```

### Optimization Tips

1. **Use index caching** for sequential/nearby lookups
2. **Choose appropriate interpolation** - bilinear is usually sufficient
3. **Optimize grid resolution** - balance accuracy vs. memory
4. **Pre-compute when possible** - avoid repeated calculations

## Thread Safety

**Thread-safe (read-only after construction):**
```cpp
// Master thread
G4Physics2DVector* vec = BuildVector();
vec->SetBicubicInterpolation(true);

// Worker threads
void Worker() {
    std::size_t idxX = 0, idxY = 0;  // Thread-local
    G4double val = vec->Value(x, y, idxX, idxY);  // Safe
}
```

**NOT thread-safe:**
- Concurrent `PutValue()`, `PutX()`, `PutY()`
- Concurrent `SetBicubicInterpolation()`
- Sharing index caches between threads

## Common Use Cases in Geant4

1. **Bremsstrahlung angular distributions** - E_photon vs. θ
2. **Pair production** - E_electron vs. E_positron
3. **Compton scattering** - E_gamma vs. cos(θ)
4. **Polarized scattering** - E vs. polarization angle
5. **Nuclear reaction kinematics** - E_projectile vs. θ_scattered

## Related Classes

- [G4PhysicsVector](g4physicsvector.md) - 1D physics data
- [G4PhysicsTable](g4physicstable.md) - Collections of 1D vectors
- [G4PhysicsFreeVector](g4physicsfreevector.md) - Arbitrary 1D binning
- G4VEmAngularDistribution - Uses 2D vectors for angular distributions

## See Also

- Physics Reference Manual, "Differential Cross Sections"
- Application Developer Guide, "Angular Distributions"
- G4VEmModel - Base class for models using 2D distributions
- G4LivermoreComptonModel - Example using 2D vectors
