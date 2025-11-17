# G4GaussLegendreQ API Documentation

## Overview

`G4GaussLegendreQ` implements Gauss-Legendre quadrature for numerical integration over finite intervals. This is the most commonly used Gaussian quadrature method, providing excellent accuracy for smooth functions over bounded domains.

The class computes integration points (abscissas) and weights based on roots of Legendre polynomials, offering three convenience methods: general n-point integration, fast 10-point integration, and high-accuracy 96-point integration.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4GaussLegendreQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussLegendreQ.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4GaussLegendreQ.hh:44-83`

```cpp
class G4GaussLegendreQ : public G4VGaussianQuadrature
{
 public:
  explicit G4GaussLegendreQ(function pFunction);
  G4GaussLegendreQ(function pFunction, G4int nLegendre);

  G4GaussLegendreQ(const G4GaussLegendreQ&) = delete;
  G4GaussLegendreQ& operator=(const G4GaussLegendreQ&) = delete;

  G4double Integral(G4double a, G4double b) const;
  G4double QuickIntegral(G4double a, G4double b) const;
  G4double AccurateIntegral(G4double a, G4double b) const;
};
```

## Constructors

### Default Constructor

`source/global/HEPNumerics/include/G4GaussLegendreQ.hh:47`

```cpp
explicit G4GaussLegendreQ(function pFunction);
```

**Purpose:** Create quadrature with default number of points

**Parameters:**
- `pFunction` - Pointer to function to integrate

**Default:** Uses a reasonable number of points (implementation-defined)

### N-Point Constructor

`source/global/HEPNumerics/include/G4GaussLegendreQ.hh:49-55`

```cpp
G4GaussLegendreQ(function pFunction, G4int nLegendre);
```

**Purpose:** Create quadrature with specified number of points

**Parameters:**
- `pFunction` - Function to integrate
- `nLegendre` - Number of Legendre quadrature points

**Notes:**
- Computes 2*nLegendre actual integration points (symmetric)
- Accuracy improves with larger nLegendre
- Memory usage: O(nLegendre)

## Integration Methods

### Integral

`source/global/HEPNumerics/include/G4GaussLegendreQ.hh:60-66`

```cpp
G4double Integral(G4double a, G4double b) const;
```

**Purpose:** Integrate function over [a, b] using n-point Gauss-Legendre

**Parameters:**
- `a` - Lower integration limit
- `b` - Upper integration limit

**Returns:** Approximation to ∫ₐᵇ f(x) dx

**Function Evaluations:** 2*fNumber points

**Accuracy:** Exact for polynomials of degree ≤ 2*fNumber - 1

**Algorithm:**
1. Transform interval [a,b] → [-1,1]
2. Evaluate function at Legendre roots
3. Sum weighted function values
4. Scale result back to [a,b]

### QuickIntegral

`source/global/HEPNumerics/include/G4GaussLegendreQ.hh:68-74`

```cpp
G4double QuickIntegral(G4double a, G4double b) const;
```

**Purpose:** Fast 10-point Gauss-Legendre integration

**Parameters:**
- `a`, `b` - Integration limits

**Function Evaluations:** Exactly 10

**Accuracy:** Exact for polynomials up to degree 9

**Performance:** Very fast, suitable for most applications

**Recommendation:** Default choice for general integration

### AccurateIntegral

`source/global/HEPNumerics/include/G4GaussLegendreQ.hh:76-82`

```cpp
G4double AccurateIntegral(G4double a, G4double b) const;
```

**Purpose:** High-accuracy 96-point Gauss-Legendre integration

**Parameters:**
- `a`, `b` - Integration limits

**Function Evaluations:** Exactly 96

**Accuracy:** Exact for polynomials up to degree 95

**Performance:** Still fast, ~10x slower than QuickIntegral

**Best For:** High-precision requirements, oscillatory functions

## Mathematical Background

### Legendre Polynomials

The Legendre polynomials Pₙ(x) satisfy:
- **Orthogonality:** ∫₋₁¹ Pₘ(x)Pₙ(x)dx = 0 for m ≠ n
- **Normalization:** ∫₋₁¹ [Pₙ(x)]² dx = 2/(2n+1)
- **Recurrence:** (n+1)Pₙ₊₁(x) = (2n+1)xPₙ(x) - nPₙ₋₁(x)

### Integration Formula

```
∫ₐᵇ f(x)dx ≈ ((b-a)/2) Σᵢ wᵢ f(((b-a)/2)xᵢ + (a+b)/2)
```

Where:
- `xᵢ` are roots of Pₙ(x) in [-1,1]
- `wᵢ = 2/((1-xᵢ²)[P'ₙ(xᵢ)]²)`

### Symmetry Property

Legendre roots and weights are symmetric:
- `x₋ᵢ = -xᵢ`
- `w₋ᵢ = wᵢ`

This allows storing only half the points.

## Usage Examples

### Basic Integration

```cpp
#include "G4GaussLegendreQ.hh"

// Define function to integrate
G4double MyFunction(G4double x) {
    return std::sin(x) / x;  // sinc function
}

// Create quadrature object
G4GaussLegendreQ quad(MyFunction, 32);  // 32-point quadrature

// Integrate from 0 to pi
G4double result = quad.Integral(0.0, CLHEP::pi);
G4cout << "∫₀^π sin(x)/x dx = " << result << G4endl;
```

### Quick Integration for Performance

```cpp
// Fast integration for cross section
G4double IntegrateCrossSection(G4double E_min, G4double E_max) {
    G4GaussLegendreQ quad(CrossSectionFunction);

    // QuickIntegral uses only 10 points - very fast
    return quad.QuickIntegral(E_min, E_max);
}
```

### High-Accuracy Integration

```cpp
// High-precision form factor calculation
G4double FormFactor(G4double q) {
    return std::exp(-q*q/(2*fm*fm));  // Gaussian form factor
}

G4GaussLegendreQ quad(FormFactor);

// AccurateIntegral uses 96 points for high precision
G4double integral = quad.AccurateIntegral(0.0, 5.0/fm);
```

### Physics Application: Stopping Power

```cpp
class StoppingPowerIntegrator {
public:
    StoppingPowerIntegrator(G4double Z, G4double A)
        : fZ(Z), fA(A) {}

    G4double ComputeStoppingPower(G4double E_kin) {
        // Function for energy loss spectrum
        auto dEdx = [this, E_kin](G4double E_transfer) {
            return this->BetheBlochSpectrum(E_kin, E_transfer);
        };

        // Integrate over energy transfer
        G4GaussLegendreQ quad(dEdx, 48);  // 48 points

        G4double E_max = ComputeMaxTransfer(E_kin);
        return quad.Integral(0.0, E_max);
    }

private:
    G4double BetheBlochSpectrum(G4double E, G4double dE);
    G4double ComputeMaxTransfer(G4double E);
    G4double fZ, fA;
};
```

### Angular Distribution Integration

```cpp
// Integrate differential cross section over angles
G4double TotalCrossSection() {
    auto differential = [](G4double cos_theta) {
        // Rutherford scattering
        G4double sin_half = std::sqrt((1 - cos_theta)/2);
        return 1.0 / (sin_half * sin_half * sin_half * sin_half);
    };

    G4GaussLegendreQ quad(differential, 64);

    // Integrate dσ/dΩ over solid angle
    // ∫dσ/dΩ dΩ = 2π ∫₋₁¹ dσ/dΩ d(cos θ)
    G4double integral = quad.Integral(-1.0, 1.0);
    return 2.0 * CLHEP::pi * integral;
}
```

### Energy Spectrum Normalization

```cpp
// Normalize energy spectrum
class SpectrumNormalizer {
public:
    G4double spectrum(G4double E) {
        return E * std::exp(-E / E0);  // Example spectrum
    }

    G4double GetNormalizedSpectrum(G4double E) {
        if (norm < 0) {
            // Calculate normalization on first call
            G4GaussLegendreQ quad(
                [this](G4double x){ return spectrum(x); }, 48);
            norm = quad.Integral(0.0, 10.0 * E0);
        }
        return spectrum(E) / norm;
    }

private:
    G4double E0 = 1.0*MeV;
    G4double norm = -1.0;
};
```

### Comparing Different Accuracies

```cpp
void CompareAccuracy() {
    G4double a = 0.0, b = 1.0;

    auto func = [](G4double x) {
        return std::exp(-x*x) * std::cos(10*x);
    };

    G4GaussLegendreQ quad(func, 16);

    G4double quick = quad.QuickIntegral(a, b);      // 10 points
    G4double normal = quad.Integral(a, b);          // 32 points
    G4double accurate = quad.AccurateIntegral(a, b); // 96 points

    G4cout << "Quick (10pt):    " << quick << G4endl;
    G4cout << "Normal (32pt):   " << normal << G4endl;
    G4cout << "Accurate (96pt): " << accurate << G4endl;
    G4cout << "Difference:      " << (accurate - quick) << G4endl;
}
```

## Performance Characteristics

### Function Evaluations vs Accuracy

| Method | Points | Polynomial Degree | Typical Error |
|--------|--------|-------------------|---------------|
| QuickIntegral | 10 | 9 | 10⁻⁸ - 10⁻¹⁰ |
| Integral(16) | 32 | 31 | 10⁻¹² - 10⁻¹⁴ |
| Integral(32) | 64 | 63 | 10⁻¹⁴ - 10⁻¹⁶ |
| AccurateIntegral | 96 | 95 | ~machine precision |

### Computational Cost

- **Initialization:** O(n²) for computing roots (one-time cost)
- **Integration:** O(n) function evaluations per call
- **Memory:** O(n) for storing abscissas and weights

### When to Use Each Method

**QuickIntegral:**
- Smooth functions
- Moderate accuracy requirements (relative error ~10⁻⁸)
- Performance-critical code
- Energy deposition calculations

**Integral(n):**
- Custom accuracy requirements
- Moderately complex functions
- Balance between speed and accuracy
- Cross section integrations

**AccurateIntegral:**
- High-precision needs (relative error ~10⁻¹⁴)
- Validation and verification
- Oscillatory functions
- Nuclear form factors

## Error Estimation

For smooth functions, the error decreases exponentially with n:

```
Error ≈ C × e^(-αn)
```

For functions with derivatives up to order k:

```
Error ≈ C × n^(-k)
```

**Rule of thumb:** Doubling n typically gains 2-4 digits of accuracy.

## Thread Safety

`G4GaussLegendreQ` is:
- **Thread-safe after construction:** Const methods can be called concurrently
- **Not thread-safe during construction:** Avoid concurrent initialization
- **Recommended pattern:** Create per-thread or use thread-local storage

```cpp
// Thread-safe usage
G4ThreadLocal G4GaussLegendreQ* localQuad = nullptr;

void ThreadSafeIntegration() {
    if (!localQuad) {
        localQuad = new G4GaussLegendreQ(MyFunction, 32);
    }
    G4double result = localQuad->Integral(0, 1);
}
```

## Common Pitfalls

1. **Singular endpoints:** Gauss-Legendre doesn't handle singularities well
   ```cpp
   // Bad: 1/x singular at x=0
   auto bad = [](G4double x) { return 1.0/x; };
   G4GaussLegendreQ quad(bad);
   quad.Integral(0.0, 1.0);  // Poor accuracy or NaN

   // Better: shift away from singularity
   quad.Integral(1e-6, 1.0);

   // Best: use Gauss-Laguerre or other appropriate method
   ```

2. **Discontinuous functions:** Reduced accuracy
   ```cpp
   // Split at discontinuity
   G4double result = quad.Integral(0, x0) + quad.Integral(x0, 1);
   ```

3. **Oscillatory functions:** May need more points
   ```cpp
   // For highly oscillatory functions
   G4GaussLegendreQ quad(oscillatory, 128);  // More points needed
   ```

## Related Classes

- [G4VGaussianQuadrature](g4vgaussianquadrature.md) - Base class
- [G4Integrator](g4integrator.md) - Template integrator with Legendre methods
- [G4GaussHermiteQ](g4gausshermiteq.md) - For infinite domains
- [G4GaussLaguerreQ](g4gausslaguerreq.md) - For semi-infinite domains
- [G4GaussChebyshevQ](g4gausschebyshevq.md) - For endpoint singularities

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- Abramowitz & Stegun Chapter 25.4 - Gaussian Quadrature Formulas

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4GaussLegendreQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussLegendreQ.cc`
**Author:** V.Grichine, 1997
:::
