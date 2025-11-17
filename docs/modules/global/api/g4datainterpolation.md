# G4DataInterpolation API Documentation

## Overview

`G4DataInterpolation` provides various interpolation and extrapolation methods for tabulated data, including polynomial interpolation, rational function interpolation, and cubic spline interpolation. The cubic spline method is particularly efficient and widely used for smooth function representation.

Based on algorithms from "Numerical Methods in C++" by B.H. Flowers.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4DataInterpolation.hh`
**Implementation:** `source/global/HEPNumerics/src/G4DataInterpolation.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4DataInterpolation.hh:42-109`

```cpp
class G4DataInterpolation
{
 public:
  G4DataInterpolation(G4double pX[], G4double pY[], G4int number);
  G4DataInterpolation(G4double pX[], G4double pY[], G4int number,
                      G4double pFirstDerStart, G4double pFirstDerFinish);
  ~G4DataInterpolation();

  G4double PolynomInterpolation(G4double pX, G4double& deltaY) const;
  G4double RationalPolInterpolation(G4double pX, G4double& deltaY) const;
  G4double CubicSplineInterpolation(G4double pX) const;
  G4double FastCubicSpline(G4double pX, G4int index) const;
  G4int LocateArgument(G4double pX) const;

 private:
  G4double* fArgument;
  G4double* fFunction;
  G4double* fSecondDerivative;
  G4int fNumber;
};
```

## Constructors

### Basic Constructor

`source/global/HEPNumerics/include/G4DataInterpolation.hh:45`

```cpp
G4DataInterpolation(G4double pX[], G4double pY[], G4int number);
```

**Purpose:** Create interpolator for data points

**Parameters:**
- `pX` - Array of x values (must be monotonic)
- `pY` - Array of y values
- `number` - Number of data points

### Spline Constructor

`source/global/HEPNumerics/include/G4DataInterpolation.hh:48-49`

```cpp
G4DataInterpolation(G4double pX[], G4double pY[], G4int number,
                    G4double pFirstDerStart, G4double pFirstDerFinish);
```

**Purpose:** Create cubic spline with specified endpoint derivatives

**Parameters:**
- `pFirstDerStart` - First derivative at start point
- `pFirstDerFinish` - First derivative at end point

**Use Case:** Natural spline (derivatives = 0) or clamped spline

## Interpolation Methods

### PolynomInterpolation

`source/global/HEPNumerics/include/G4DataInterpolation.hh:61`

```cpp
G4double PolynomInterpolation(G4double pX, G4double& deltaY) const;
```

**Purpose:** Polynomial interpolation (Neville's algorithm)

**Parameters:**
- `pX` - Point to interpolate
- `deltaY` - Output: error estimate

**Returns:** Interpolated value

**Best for:** Small number of points (n < 10)

### CubicSplineInterpolation

`source/global/HEPNumerics/include/G4DataInterpolation.hh:79`

```cpp
G4double CubicSplineInterpolation(G4double pX) const;
```

**Purpose:** Cubic spline interpolation (recommended)

**Returns:** Interpolated value at pX

**Best for:** Most applications, smooth functions

### FastCubicSpline

`source/global/HEPNumerics/include/G4DataInterpolation.hh:85`

```cpp
G4double FastCubicSpline(G4double pX, G4int index) const;
```

**Purpose:** Fast cubic spline when interval known

**Parameters:**
- `pX` - Point to interpolate
- `index` - Known interval: pX in [fArgument[index], fArgument[index+1]]

**Best for:** Sequential interpolation with known indices

## Usage Examples

### Basic Spline Interpolation

```cpp
#include "G4DataInterpolation.hh"

// Tabulated cross section data
G4double energy[] = {1.0, 2.0, 5.0, 10.0, 20.0};  // MeV
G4double xs[] = {0.5, 1.2, 2.1, 1.8, 1.0};        // barns

G4DataInterpolation interp(energy, xs, 5, 0.0, 0.0);  // Natural spline

// Interpolate at E = 7.5 MeV
G4double xs_interp = interp.CubicSplineInterpolation(7.5);
G4cout << "σ(7.5 MeV) = " << xs_interp << " barns" << G4endl;
```

### Energy Loss Table

```cpp
class EnergyLossTable {
public:
    EnergyLossTable(const std::vector<G4double>& energies,
                   const std::vector<G4double>& dEdx) {
        fInterpolator = new G4DataInterpolation(
            const_cast<G4double*>(energies.data()),
            const_cast<G4double*>(dEdx.data()),
            energies.size(),
            0.0,  // Natural spline
            0.0
        );
    }

    ~EnergyLossTable() { delete fInterpolator; }

    G4double GetdEdx(G4double E) {
        return fInterpolator->CubicSplineInterpolation(E);
    }

private:
    G4DataInterpolation* fInterpolator;
};
```

### Fast Sequential Access

```cpp
// Interpolate many points in order
void InterpolateSequential(G4DataInterpolation& interp,
                          G4double x[], G4int n) {
    G4int index = 0;  // Start at beginning

    for (G4int i = 0; i < n; i++) {
        // Update index for new x value
        interp.CorrelatedSearch(x[i], index);

        // Fast interpolation with known index
        G4double y = interp.FastCubicSpline(x[i], index);
        G4cout << "y(" << x[i] << ") = " << y << G4endl;
    }
}
```

### Error Estimation

```cpp
// Compare polynomial interpolation with error estimate
void InterpolateWithError(G4DataInterpolation& interp, G4double x) {
    G4double error;
    G4double value = interp.PolynomInterpolation(x, error);

    G4cout << "Value: " << value << " ± " << error << G4endl;

    if (error > 0.01 * std::abs(value)) {
        G4cout << "Warning: Large interpolation error!" << G4endl;
    }
}
```

## Performance Notes

- **Cubic spline:** O(n) setup, O(log n) per evaluation
- **Polynomial:** O(n²) per evaluation
- **Best choice:** Cubic spline for most applications

## Thread Safety

Not thread-safe. Create separate instances per thread.

## Related Classes

- [G4ChebyshevApproximation](g4chebyshevapproximation.md) - Function approximation
- [G4Integrator](g4integrator.md) - Numerical integration

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4DataInterpolation.hh`
**Implementation:** `source/global/HEPNumerics/src/G4DataInterpolation.cc`
**Author:** V.Grichine, 1997
:::
