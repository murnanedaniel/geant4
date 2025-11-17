# G4GaussJacobiQ API Documentation

## Overview

`G4GaussJacobiQ` implements Gauss-Jacobi quadrature for numerical integration over [-1, 1] with the general weight function (1-x)^α (1+x)^β. This is the most general classical Gaussian quadrature, encompassing Legendre (α=β=0), Chebyshev (α=β=-0.5), and other special cases as limiting forms.

The quadrature is particularly useful for integrals with algebraic singularities at the endpoints.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4GaussJacobiQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussJacobiQ.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4GaussJacobiQ.hh:43-56`

```cpp
class G4GaussJacobiQ : public G4VGaussianQuadrature
{
 public:
  G4GaussJacobiQ(function pFunction, G4double alpha, G4double beta,
                 G4int nJacobi);

  G4GaussJacobiQ(const G4GaussJacobiQ&) = delete;
  G4GaussJacobiQ& operator=(const G4GaussJacobiQ&) = delete;

  G4double Integral() const;
};
```

## Constructor

`source/global/HEPNumerics/include/G4GaussJacobiQ.hh:46-47`

```cpp
G4GaussJacobiQ(function pFunction, G4double alpha, G4double beta,
               G4int nJacobi);
```

**Purpose:** Create Gauss-Jacobi quadrature with specified parameters

**Parameters:**
- `pFunction` - Function f(x) to integrate (without weight)
- `alpha` - Power α in weight (1-x)^α, must be > -1
- `beta` - Power β in weight (1+x)^β, must be > -1
- `nJacobi` - Number of quadrature points

**Constraints:** α, β > -1 for convergence

## Integration Method

### Integral

`source/global/HEPNumerics/include/G4GaussJacobiQ.hh:53-55`

```cpp
G4double Integral() const;
```

**Purpose:** Compute ∫₋₁¹ (1-x)^α (1+x)^β f(x) dx

**Returns:** The integral value

**Mathematical Form:**
```
∫₋₁¹ (1-x)^α (1+x)^β f(x) dx ≈ Σᵢ wᵢ f(xᵢ)
```

**Important:** Function f(x) should NOT include the weight factor

## Mathematical Background

### Jacobi Polynomials

The Jacobi polynomials P^(α,β)_n(x) satisfy:
- **Orthogonality:** ∫₋₁¹ (1-x)^α (1+x)^β P^(α,β)_m(x) P^(α,β)_n(x) dx = hₙ δₘₙ
- **Normalization:** hₙ = (2^(α+β+1))/(2n+α+β+1) × Γ(n+α+1)Γ(n+β+1)/(n!Γ(n+α+β+1))

### Special Cases

| α | β | Quadrature Type | Weight Function |
|---|---|-----------------|-----------------|
| 0 | 0 | Legendre | 1 |
| -0.5 | -0.5 | Chebyshev (1st kind) | 1/√(1-x²) |
| 0.5 | 0.5 | Chebyshev (2nd kind) | √(1-x²) |
| -0.5 | 0.5 | - | √((1+x)/(1-x)) |
| 0.5 | -0.5 | - | √((1-x)/(1+x)) |

## Usage Examples

### Basic Integration

```cpp
#include "G4GaussJacobiQ.hh"

// Integrate (1-x)^0.5 (1+x)^0.5 from -1 to 1
G4double ConstantFunction(G4double x) {
    return 1.0;  // Weight handled automatically
}

// α = β = 0.5
G4GaussJacobiQ quad(ConstantFunction, 0.5, 0.5, 32);
G4double result = quad.Integral();
```

### Asymmetric Endpoint Behavior

```cpp
// Function with different singularities at each endpoint
G4double AsymmetricIntegral() {
    // ∫₋₁¹ (1-x)^α (1+x)^β f(x) dx
    // α = 0.5: weak singularity at x = 1
    // β = 1.5: stronger singularity at x = -1

    auto func = [](G4double x) {
        return std::sin(CLHEP::pi * x);
    };

    G4GaussJacobiQ quad(func, 0.5, 1.5, 48);
    return quad.Integral();
}
```

### Transform to Arbitrary Interval

```cpp
// Integrate over [a, b] with weight function
G4double GeneralInterval(G4double a, G4double b,
                        G4double alpha, G4double beta) {
    // Transform [a,b] → [-1,1]: x = (2t - a - b)/(b - a)
    // (1-x)^α (1+x)^β → ((b-t)/(b-a))^α ((t-a)/(b-a))^β

    auto transformed = [a, b](G4double x) {
        G4double t = 0.5*(b-a)*x + 0.5*(b+a);
        return SomeFunction(t);
    };

    G4GaussJacobiQ quad(transformed, alpha, beta, 64);
    G4double scaling = std::pow((b-a)/2, alpha+beta+1);
    return scaling * quad.Integral();
}
```

## Performance Notes

- **Initialization:** O(n²) - more complex than Legendre
- **Best for:** Endpoint singularities with known behavior
- **Accuracy:** Depends on matching singularity to α, β

## Thread Safety

Thread-safe after construction. Use per-thread instances for concurrent integration.

## Related Classes

- [G4VGaussianQuadrature](g4vgaussianquadrature.md) - Base class
- [G4GaussLegendreQ](g4gausslegendreq.md) - Special case α=β=0
- [G4GaussChebyshevQ](g4gausschebyshevq.md) - Special case α=β=-0.5
- [G4Integrator](g4integrator.md) - Template integrator with Jacobi method

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4GaussJacobiQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussJacobiQ.cc`
**Author:** V.Grichine, 1997
:::
