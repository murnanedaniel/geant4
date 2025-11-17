# G4GaussChebyshevQ API Documentation

## Overview

`G4GaussChebyshevQ` implements Gauss-Chebyshev quadrature for numerical integration over the interval [-1, 1] with weight function 1/√(1-x²). This method is particularly effective for integrals with endpoint singularities and is widely used in approximation theory.

The quadrature automatically handles the 1/√(1-x²) weight, so users provide only the remaining part of the integrand.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4GaussChebyshevQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussChebyshevQ.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4GaussChebyshevQ.hh:44-58`

```cpp
class G4GaussChebyshevQ : public G4VGaussianQuadrature
{
 public:
  G4GaussChebyshevQ(function pFunction, G4int nChebyshev);
  ~G4GaussChebyshevQ() override = default;

  G4GaussChebyshevQ(const G4GaussChebyshevQ&) = delete;
  G4GaussChebyshevQ& operator=(const G4GaussChebyshevQ&) = delete;

  G4double Integral(G4double a, G4double b) const;
};
```

## Constructor

`source/global/HEPNumerics/include/G4GaussChebyshevQ.hh:47`

```cpp
G4GaussChebyshevQ(function pFunction, G4int nChebyshev);
```

**Purpose:** Create Gauss-Chebyshev quadrature with n points

**Parameters:**
- `pFunction` - Function f(x) to integrate (without 1/√(1-x²) factor)
- `nChebyshev` - Number of quadrature points

**Notes:**
- Chebyshev abscissas have closed form: xᵢ = cos((2i-1)π/2n)
- All weights are equal: wᵢ = π/n
- Very efficient to compute

## Integration Method

### Integral

`source/global/HEPNumerics/include/G4GaussChebyshevQ.hh:55-57`

```cpp
G4double Integral(G4double a, G4double b) const;
```

**Purpose:** Integrate function over [a, b]

**Returns:** Approximation to ∫ₐᵇ f(x)/√(1-x²) dx after transformation

**Mathematical Form:**
```
∫₋₁¹ f(x)/√(1-x²) dx ≈ (π/n) Σᵢ f(xᵢ)
```

**Transform to [a,b]:** Uses standard linear transformation

## Mathematical Background

### Chebyshev Polynomials

The Chebyshev polynomials of the first kind Tₙ(x) = cos(n arccos(x)) satisfy:
- **Orthogonality:** ∫₋₁¹ Tₘ(x)Tₙ(x)/√(1-x²) dx = 0 for m ≠ n
- **Recurrence:** Tₙ₊₁(x) = 2xTₙ(x) - Tₙ₋₁(x)
- **Roots:** xₖ = cos((2k-1)π/2n) for k=1,...,n

### Key Properties

- **Equal weights:** All weights are π/n (simplifies computation)
- **Explicit abscissas:** No iterative root finding needed
- **Fast setup:** O(n) initialization vs O(n²) for other quadratures
- **Minimax property:** Optimal for polynomial approximation

## Usage Examples

### Basic Integration

```cpp
#include "G4GaussChebyshevQ.hh"

// Integrate 1/√(1-x²) from -1 to 1
G4double ConstantFunction(G4double x) {
    return 1.0;  // Don't include weight!
}

G4GaussChebyshevQ quad(ConstantFunction, 32);
G4double result = quad.Integral(-1.0, 1.0);
// Analytical result: π
```

### Elliptic Integral

```cpp
// Complete elliptic integral of the first kind
G4double EllipticK(G4double k) {
    // K(k) = ∫₀^(π/2) dθ/√(1-k²sin²θ)
    //      = ∫₀¹ dx/√((1-x²)(1-k²x²))
    // Transform to standard Chebyshev form

    auto integrand = [k](G4double x) {
        G4double denom = std::sqrt(1.0 - k*k*x*x);
        return 1.0 / denom;  // Weight 1/√(1-x²) handled automatically
    };

    G4GaussChebyshevQ quad(integrand, 64);
    return quad.Integral(0.0, 1.0);
}
```

### Endpoint Singularity

```cpp
// Function with singularities at ±1
G4double IntegrateWithSingularity() {
    // ∫₋₁¹ ln(1+x)/√(1-x²) dx
    auto func = [](G4double x) {
        return std::log(1.0 + x);  // Singular at x = -1
    };

    // Chebyshev quadrature handles endpoint singularities well
    G4GaussChebyshevQ quad(func, 48);
    return quad.Integral(-1.0, 1.0);
}
```

### Function Approximation

```cpp
// Compute Chebyshev coefficients for function approximation
class ChebyshevApproximator {
public:
    std::vector<G4double> ComputeCoefficients(
        std::function<G4double(G4double)> f, G4int n) {

        std::vector<G4double> coeffs(n);

        for (G4int k = 0; k < n; k++) {
            auto weighted = [f, k](G4double x) {
                return f(x) * std::cos(k * std::acos(x));
            };

            G4GaussChebyshevQ quad(weighted, 64);
            coeffs[k] = (2.0/CLHEP::pi) * quad.Integral(-1.0, 1.0);
        }

        coeffs[0] /= 2.0;  // Special case for k=0
        return coeffs;
    }
};
```

## Performance Characteristics

### Speed Advantage

- **Initialization:** O(n) vs O(n²) for Legendre
- **Simple weights:** All equal to π/n
- **No root finding:** Explicit formulas
- **Cache friendly:** Regular spacing

### Accuracy

| Points | Polynomial Degree | Typical Error |
|--------|-------------------|---------------|
| 16 | 15 | 10⁻⁸ |
| 32 | 31 | 10⁻¹² |
| 64 | 63 | 10⁻¹⁴ |

## When to Use Gauss-Chebyshev

**Ideal for:**
- Endpoint singularities of form 1/√(1-x²)
- Polynomial approximation (minimax property)
- Fast initialization required
- Functions smooth in interior, singular at boundaries

**Not suitable for:**
- General smooth functions (Legendre better)
- Other weight functions
- Functions with interior singularities

## Related Classes

- [G4VGaussianQuadrature](g4vgaussianquadrature.md) - Base class
- [G4GaussLegendreQ](g4gausslegendreq.md) - For general finite intervals
- [G4ChebyshevApproximation](g4chebyshevapproximation.md) - Function approximation
- [G4Integrator](g4integrator.md) - Template integrator with Chebyshev method

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- Abramowitz & Stegun Chapter 25.4 - Chebyshev Polynomial Integration

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4GaussChebyshevQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussChebyshevQ.cc`
**Author:** V.Grichine, 1997
:::
