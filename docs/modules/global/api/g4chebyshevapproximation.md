# G4ChebyshevApproximation API Documentation

## Overview

`G4ChebyshevApproximation` creates Chebyshev polynomial approximations of functions, providing efficient evaluation and minimax properties. Chebyshev approximations minimize the maximum error and are optimal for many applications requiring fast function evaluation.

Based on algorithms from "Numerical Methods in C++" by B.H. Flowers.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4ChebyshevApproximation.hh`
**Implementation:** `source/global/HEPNumerics/src/G4ChebyshevApproximation.cc`
:::

## Constructors

### Function Approximation

`source/global/HEPNumerics/include/G4ChebyshevApproximation.hh:50`

```cpp
G4ChebyshevApproximation(function pFunction, G4int n, G4double a, G4double b);
```

**Purpose:** Approximate function with n Chebyshev terms over [a,b]

**Parameters:**
- `pFunction` - Function to approximate
- `n` - Number of Chebyshev coefficients
- `a`, `b` - Interval of approximation

### Derivative Approximation

`source/global/HEPNumerics/include/G4ChebyshevApproximation.hh:59-60`

```cpp
G4ChebyshevApproximation(function pFunction, G4int n, G4int m, G4double a,
                         G4double b);
```

**Purpose:** Approximate m-th derivative

**Parameters:**
- `m` - Order of derivative (must be < n)

## Methods

### ChebyshevEvaluation

`source/global/HEPNumerics/include/G4ChebyshevApproximation.hh:81`

```cpp
G4double ChebyshevEvaluation(G4double x) const;
```

**Purpose:** Evaluate approximation at x

**Returns:** Approximated function value

## Usage Examples

### Basic Approximation

```cpp
#include "G4ChebyshevApproximation.hh"

G4double MyFunction(G4double x) {
    return std::exp(-x*x);  // Gaussian
}

// Approximate over [-3, 3] with 20 terms
G4ChebyshevApproximation approx(MyFunction, 20, -3.0, 3.0);

// Evaluate approximation
G4double y = approx.ChebyshevEvaluation(1.5);
G4double exact = MyFunction(1.5);
G4cout << "Approx: " << y << ", Exact: " << exact << G4endl;
```

### Fast Function Lookup

```cpp
// Replace expensive function with fast approximation
class FastExp {
public:
    FastExp() : fApprox(std::exp, 32, -10.0, 10.0) {}

    G4double Evaluate(G4double x) {
        if (x < -10.0 || x > 10.0) return std::exp(x);  // Outside range
        return fApprox.ChebyshevEvaluation(x);
    }

private:
    G4ChebyshevApproximation fApprox;
};
```

## Performance Notes

- **Minimax property:** Best maximum error for given degree
- **Fast evaluation:** O(n) using Clenshaw's algorithm
- **Uniform accuracy:** Error spread evenly over interval

## Thread Safety

Thread-safe after construction.

## Related Classes

- [G4DataInterpolation](g4datainterpolation.md) - Data interpolation
- [G4GaussChebyshevQ](g4gausschebyshevq.md) - Chebyshev quadrature

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4ChebyshevApproximation.hh`
**Implementation:** `source/global/HEPNumerics/src/G4ChebyshevApproximation.cc`
**Author:** V.Grichine, 1997
:::
