# G4VGaussianQuadrature API Documentation

## Overview

`G4VGaussianQuadrature` is the abstract base class for Gaussian quadrature integration methods. It provides common infrastructure for computing roots of orthogonal polynomials and their corresponding weights using the Newton-Raphson iterative method.

Derived classes implement specific quadrature methods (Legendre, Hermite, Laguerre, Chebyshev, Jacobi) that differ in their weight functions and integration domains.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4VGaussianQuadrature.hh`
**Implementation:** `source/global/HEPNumerics/src/G4VGaussianQuadrature.cc`
:::

## Type Definitions

`source/global/HEPNumerics/include/G4VGaussianQuadrature.hh:45`

```cpp
using function = G4double (*)(G4double);
```

Function pointer type for integration.

## Class Declaration

`source/global/HEPNumerics/include/G4VGaussianQuadrature.hh:47-74`

```cpp
class G4VGaussianQuadrature
{
 public:
  explicit G4VGaussianQuadrature(function pFunction);
  virtual ~G4VGaussianQuadrature();

  G4VGaussianQuadrature(const G4VGaussianQuadrature&) = delete;
  G4VGaussianQuadrature& operator=(const G4VGaussianQuadrature&) = delete;

  G4double GetAbscissa(G4int index) const;
  G4double GetWeight(G4int index) const;
  G4int GetNumber() const;

 protected:
  G4double GammaLogarithm(G4double xx);

  function fFunction;             // pointer to the function
  G4double* fAbscissa = nullptr;  // array of abscissas
  G4double* fWeight   = nullptr;  // array of weights
  G4int fNumber = 0;              // number of points
};
```

## Constructor and Destructor

### Constructor

`source/global/HEPNumerics/include/G4VGaussianQuadrature.hh:50`

```cpp
explicit G4VGaussianQuadrature(function pFunction);
```

**Purpose:** Base constructor for Gaussian quadrature classes

**Parameters:**
- `pFunction` - Pointer to the function to be integrated

**Notes:**
- Sets up the function pointer
- Derived classes allocate abscissa and weight arrays
- Explicit to prevent implicit conversions

### Destructor

`source/global/HEPNumerics/include/G4VGaussianQuadrature.hh:53`

```cpp
virtual ~G4VGaussianQuadrature();
```

**Purpose:** Virtual destructor for proper cleanup

**Cleanup:** Deletes dynamically allocated `fAbscissa` and `fWeight` arrays

## Accessor Methods

### GetAbscissa

`source/global/HEPNumerics/include/G4VGaussianQuadrature.hh:59`

```cpp
G4double GetAbscissa(G4int index) const;
```

**Purpose:** Get the quadrature abscissa (integration point) at given index

**Parameters:**
- `index` - Index from 0 to fNumber-1

**Returns:** The x-coordinate where the function will be evaluated

**Usage:**
```cpp
for (G4int i = 0; i < quad->GetNumber(); i++) {
    G4double x = quad->GetAbscissa(i);
    G4double w = quad->GetWeight(i);
    sum += w * f(x);
}
```

### GetWeight

`source/global/HEPNumerics/include/G4VGaussianQuadrature.hh:60`

```cpp
G4double GetWeight(G4int index) const;
```

**Purpose:** Get the quadrature weight at given index

**Parameters:**
- `index` - Index from 0 to fNumber-1

**Returns:** The weight coefficient for this integration point

### GetNumber

`source/global/HEPNumerics/include/G4VGaussianQuadrature.hh:61`

```cpp
G4int GetNumber() const;
```

**Purpose:** Get the total number of quadrature points

**Returns:** Number of abscissa-weight pairs

## Protected Methods

### GammaLogarithm

`source/global/HEPNumerics/include/G4VGaussianQuadrature.hh:65`

```cpp
G4double GammaLogarithm(G4double xx);
```

**Purpose:** Calculate ln(Γ(x)) - logarithm of gamma function

**Mathematical Background:**
- Used for computing polynomial coefficients
- More numerically stable than computing Γ(x) directly
- Avoids overflow for large arguments

**Algorithm:** Uses Lanczos approximation or series expansion

## Mathematical Background

### Gaussian Quadrature Formula

Gaussian quadrature approximates an integral as:

```
∫ₐᵇ w(x)f(x)dx ≈ Σᵢ wᵢ f(xᵢ)
```

Where:
- `w(x)` is a weight function (differs for each quadrature type)
- `xᵢ` are the abscissas (roots of orthogonal polynomials)
- `wᵢ` are the weights (derived from polynomial properties)

### Key Properties

1. **Optimal Accuracy:** n-point Gaussian quadrature exactly integrates polynomials of degree ≤ 2n-1

2. **Orthogonal Polynomials:** Abscissas are roots of orthogonal polynomials with respect to the weight function

3. **Symmetry:** Many quadratures have symmetric points and weights

### Quadrature Types

| Type | Weight w(x) | Domain | Use Case |
|------|-------------|--------|----------|
| Legendre | 1 | [-1,1] | General finite intervals |
| Hermite | e^(-x²) | (-∞,∞) | Gaussian distributions |
| Laguerre | x^α e^(-x) | [0,∞) | Exponential decay |
| Chebyshev | 1/√(1-x²) | [-1,1] | Endpoint singularities |
| Jacobi | (1-x)^α(1+x)^β | [-1,1] | General weight |

## Usage Example

This is a base class - use derived classes directly:

```cpp
#include "G4GaussLegendreQ.hh"

// Function to integrate
G4double MyFunction(G4double x) {
    return x * x * std::exp(-x);
}

// Create Gauss-Legendre quadrature object
G4GaussLegendreQ quad(MyFunction, 32);  // 32 points

// Integrate from 0 to 5
G4double result = quad.Integral(0.0, 5.0);

// Access individual points and weights if needed
G4cout << "Quadrature points:" << G4endl;
for (G4int i = 0; i < quad.GetNumber(); i++) {
    G4cout << "x[" << i << "] = " << quad.GetAbscissa(i)
           << ", w[" << i << "] = " << quad.GetWeight(i) << G4endl;
}
```

## Custom Integration with Base Class Interface

```cpp
// Manual integration using base class interface
void ManualIntegration() {
    G4GaussLegendreQ quad(MyFunction, 16);

    G4double sum = 0.0;
    for (G4int i = 0; i < quad.GetNumber(); i++) {
        G4double xi = quad.GetAbscissa(i);
        G4double wi = quad.GetWeight(i);

        // Map from [-1,1] to [a,b]
        G4double a = 0.0, b = 10.0;
        G4double x = 0.5*(b-a)*xi + 0.5*(b+a);

        sum += wi * MyFunction(x);
    }

    // Scale by interval length
    G4double result = 0.5 * (b - a) * sum;

    G4cout << "Integral = " << result << G4endl;
}
```

## Implementation Notes

### Abscissa and Weight Computation

Derived classes must:

1. **Allocate arrays:**
   ```cpp
   fAbscissa = new G4double[fNumber];
   fWeight = new G4double[fNumber];
   ```

2. **Compute polynomial roots:** Use Newton-Raphson iteration with bisection

3. **Compute weights:** From polynomial derivatives and properties

4. **Use initial approximations:** From Abramowitz & Stegun tables

### Newton-Raphson Algorithm

The iterative method for finding roots:

```
x_{n+1} = x_n - P(x_n) / P'(x_n)
```

Where P(x) is the orthogonal polynomial.

## Thread Safety

`G4VGaussianQuadrature`:
- **Not thread-safe for shared instances:** Stores function pointer and arrays
- **Thread-safe per-thread:** Each thread should create its own instance
- **Const methods safe:** GetAbscissa, GetWeight, GetNumber are thread-safe

**Recommendation:** Create quadrature objects on the stack or use thread-local storage

## Memory Management

- **Automatic cleanup:** Destructor deletes allocated arrays
- **Non-copyable:** Copy constructor and assignment deleted to prevent shallow copies
- **RAII pattern:** Resources acquired in constructor, released in destructor

## Derived Classes

- [G4GaussLegendreQ](g4gausslegendreq.md) - Gauss-Legendre quadrature
- [G4GaussHermiteQ](g4gausshermiteq.md) - Gauss-Hermite quadrature (infinite domain)
- [G4GaussLaguerreQ](g4gausslaguerreq.md) - Gauss-Laguerre quadrature (semi-infinite)
- [G4GaussChebyshevQ](g4gausschebyshevq.md) - Gauss-Chebyshev quadrature
- [G4GaussJacobiQ](g4gaussjacobiq.md) - Gauss-Jacobi quadrature

## Related Classes

- [G4Integrator](g4integrator.md) - Template integrator with multiple methods
- [G4SimpleIntegration](g4simpleintegration.md) - Simple integration methods

## References

1. **Abramowitz & Stegun:** "Handbook of Mathematical Functions" (1965)
   - Chapter 9: Orthogonal Polynomials
   - Chapter 10: Bessel Functions
   - Chapter 22: Orthogonal Polynomials
   - Chapter 25: Numerical Interpolation, Differentiation, and Integration

2. **Numerical Recipes:** Press et al.
   - Section on Gaussian Quadrature

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4VGaussianQuadrature.hh`
**Implementation:** `source/global/HEPNumerics/src/G4VGaussianQuadrature.cc`
**Author:** V.Grichine, 1997
:::
