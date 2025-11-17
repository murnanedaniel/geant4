# G4Integrator API Documentation

## Overview

`G4Integrator` is a template class that provides comprehensive numerical integration methods for generic functions. It supports multiple integration algorithms including Simpson's method, adaptive Gauss quadrature, and various orthogonal polynomial-based methods (Legendre, Chebyshev, Laguerre, Hermite, and Jacobi).

The class is designed to work with member functions, function pointers, and functors, providing maximum flexibility for integration tasks in physics simulations.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4Integrator.hh`
**Implementation:** `source/global/HEPNumerics/include/G4Integrator.icc`
:::

## Template Parameters

`source/global/HEPNumerics/include/G4Integrator.hh:43-44`

```cpp
template <class T, class F>
class G4Integrator
```

**Template Parameters:**
- `T` - Type of the object containing the function to integrate
- `F` - Type of the member function pointer (e.g., `G4double (T::*)(G4double)`)

## Constructor and Destructor

`source/global/HEPNumerics/include/G4Integrator.hh:47-48`

```cpp
G4Integrator();   // Default constructor
~G4Integrator();  // Destructor
```

Both are trivial implementations - the class is stateless and can be reused.

## Integration Methods

### Simpson Integration

`source/global/HEPNumerics/include/G4Integrator.hh:50-52`

```cpp
G4double Simpson(T& typeT, F f, G4double a, G4double b, G4int n);
G4double Simpson(T* ptrT, F f, G4double a, G4double b, G4int n);
G4double Simpson(G4double (*f)(G4double), G4double a, G4double b, G4int n);
```

**Purpose:** Integrate using Simpson's rule with n intervals

**Parameters:**
- `typeT`/`ptrT` - Object reference or pointer containing the function
- `f` - Member function or function pointer
- `a`, `b` - Integration limits
- `n` - Number of intervals (must be even)

**Algorithm:** Composite Simpson's rule with error O(h^4)

**Performance:** Fast for smooth functions, accuracy improves with larger n

### Adaptive Gauss Integration

`source/global/HEPNumerics/include/G4Integrator.hh:55-58`

```cpp
G4double AdaptiveGauss(T& typeT, F f, G4double a, G4double b, G4double e);
G4double AdaptiveGauss(T* ptrT, F f, G4double a, G4double b, G4double e);
G4double AdaptiveGauss(G4double (*f)(G4double), G4double a, G4double b,
                       G4double e);
```

**Purpose:** Adaptive Gauss-Legendre quadrature with automatic refinement

**Parameters:**
- `typeT`/`ptrT` - Object reference or pointer
- `f` - Function to integrate
- `a`, `b` - Integration limits
- `e` - Desired absolute error tolerance

**Algorithm:** Recursive subdivision until error tolerance is met

**Best For:** Functions with unknown behavior, varying smoothness

### Legendre Integration

`source/global/HEPNumerics/include/G4Integrator.hh:63-65`

```cpp
G4double Legendre(T& typeT, F f, G4double a, G4double b, G4int n);
G4double Legendre(T* ptrT, F f, G4double a, G4double b, G4int n);
G4double Legendre(G4double (*f)(G4double), G4double a, G4double b, G4int n);
```

**Purpose:** Gauss-Legendre quadrature integration

**Mathematical Background:** Uses roots of Legendre polynomials as integration points

**Accuracy:** Exact for polynomials of degree ≤ 2n-1

### Legendre10

`source/global/HEPNumerics/include/G4Integrator.hh:69-71`

```cpp
G4double Legendre10(T& typeT, F f, G4double a, G4double b);
G4double Legendre10(T* ptrT, F f, G4double a, G4double b);
G4double Legendre10(G4double (*f)(G4double), G4double a, G4double b);
```

**Purpose:** 10-point Gauss-Legendre quadrature (optimized)

**Accuracy:** Very fast and accurate enough for most applications

**Recommendation:** Default choice for finite interval integration

### Legendre96

`source/global/HEPNumerics/include/G4Integrator.hh:75-77`

```cpp
G4double Legendre96(T& typeT, F f, G4double a, G4double b);
G4double Legendre96(T* ptrT, F f, G4double a, G4double b);
G4double Legendre96(G4double (*f)(G4double), G4double a, G4double b);
```

**Purpose:** 96-point Gauss-Legendre quadrature (high accuracy)

**Accuracy:** Very accurate and still fast enough for most purposes

**Best For:** High-precision requirements with smooth functions

### Chebyshev Integration

`source/global/HEPNumerics/include/G4Integrator.hh:81-83`

```cpp
G4double Chebyshev(T& typeT, F f, G4double a, G4double b, G4int n);
G4double Chebyshev(T* ptrT, F f, G4double a, G4double b, G4int n);
G4double Chebyshev(G4double (*f)(G4double), G4double a, G4double b, G4int n);
```

**Purpose:** Gauss-Chebyshev quadrature

**Weight Function:** 1/√(1-x²)

**Best For:** Integrals with singularities at endpoints

### Laguerre Integration

`source/global/HEPNumerics/include/G4Integrator.hh:87-89`

```cpp
G4double Laguerre(T& typeT, F f, G4double alpha, G4int n);
G4double Laguerre(T* ptrT, F f, G4double alpha, G4int n);
G4double Laguerre(G4double (*f)(G4double), G4double alpha, G4int n);
```

**Purpose:** Gauss-Laguerre quadrature for semi-infinite intervals

**Integral Form:** ∫₀^∞ x^α e^(-x) f(x) dx

**Best For:** Exponentially decaying functions, energy spectra

### Hermite Integration

`source/global/HEPNumerics/include/G4Integrator.hh:93-95`

```cpp
G4double Hermite(T& typeT, F f, G4int n);
G4double Hermite(T* ptrT, F f, G4int n);
G4double Hermite(G4double (*f)(G4double), G4int n);
```

**Purpose:** Gauss-Hermite quadrature for infinite intervals

**Integral Form:** ∫₋∞^∞ e^(-x²) f(x) dx

**Best For:** Gaussian-weighted integrals, statistical mechanics

### Jacobi Integration

`source/global/HEPNumerics/include/G4Integrator.hh:99-102`

```cpp
G4double Jacobi(T& typeT, F f, G4double alpha, G4double beta, G4int n);
G4double Jacobi(T* ptrT, F f, G4double alpha, G4double beta, G4int n);
G4double Jacobi(G4double (*f)(G4double), G4double alpha, G4double beta,
                G4int n);
```

**Purpose:** Gauss-Jacobi quadrature (general weight function)

**Integral Form:** ∫₋₁¹ (1-x)^α (1+x)^β f(x) dx

**Best For:** Singular integrands at interval endpoints

## Usage Examples

### Basic Integration with Member Functions

```cpp
#include "G4Integrator.hh"

class MyPhysicsFunction {
public:
    G4double BremsCrossSection(G4double energy) {
        // Compute bremsstrahlung cross section
        return /* cross section calculation */;
    }
};

// Integrate cross section over energy range
MyPhysicsFunction phys;
G4Integrator<MyPhysicsFunction,
             G4double(MyPhysicsFunction::*)(G4double)> integrator;

// Using Legendre10 (fast and accurate)
G4double totalCrossSection = integrator.Legendre10(
    phys,
    &MyPhysicsFunction::BremsCrossSection,
    1.0*MeV,   // lower limit
    100.0*MeV  // upper limit
);
```

### Integration with Function Pointers

```cpp
// Free function for energy loss
G4double EnergyLoss(G4double distance) {
    G4double dEdx = 2.0*MeV/cm;  // stopping power
    return dEdx * distance;
}

G4Integrator<G4double, G4double(*)(G4double)> integrator;

// Total energy loss over path
G4double totalLoss = integrator.Simpson(
    EnergyLoss,
    0.0*cm,    // start
    10.0*cm,   // end
    100        // intervals
);
```

### Adaptive Integration for Complex Functions

```cpp
class ScatteringAmplitude {
public:
    G4double DifferentialCrossSection(G4double angle) {
        // May have sharp peaks or rapid variations
        return /* complex angular dependence */;
    }
};

ScatteringAmplitude scatter;
G4Integrator<ScatteringAmplitude,
             G4double(ScatteringAmplitude::*)(G4double)> integrator;

// Adaptive method automatically refines where needed
G4double integrated = integrator.AdaptiveGauss(
    scatter,
    &ScatteringAmplitude::DifferentialCrossSection,
    0.0,        // 0 degrees
    pi,         // 180 degrees
    1.0e-6      // error tolerance
);
```

### Energy Spectrum Integration (Laguerre)

```cpp
// Maxwell-Boltzmann energy distribution
G4double MaxwellDistribution(G4double energy) {
    G4double kT = 0.025*eV;  // thermal energy
    // e^(-E) factor handled by Laguerre weight
    return sqrt(energy);  // √E part only
}

G4Integrator<G4double, G4double(*)(G4double)> integrator;

// Integrate from 0 to infinity
G4double totalProbability = integrator.Laguerre(
    MaxwellDistribution,
    0.5,   // alpha for √E = E^(1/2)
    48     // number of points
);
```

### Gaussian-Weighted Integrals (Hermite)

```cpp
// Momentum distribution in phase space
G4double MomentumDistribution(G4double p) {
    // Gaussian weight e^(-p²) handled automatically
    return p * p;  // Additional p² factor
}

G4Integrator<G4double, G4double(*)(G4double)> integrator;

// Integrate over all momentum space
G4double result = integrator.Hermite(
    MomentumDistribution,
    32  // integration points
);
```

### High-Precision Integration

```cpp
class PrecisionCalculation {
public:
    G4double FormFactor(G4double q) {
        // Nuclear form factor requiring high accuracy
        return /* form factor calculation */;
    }
};

PrecisionCalculation calc;
G4Integrator<PrecisionCalculation,
             G4double(PrecisionCalculation::*)(G4double)> integrator;

// Use 96-point Legendre for high accuracy
G4double precise = integrator.Legendre96(
    calc,
    &PrecisionCalculation::FormFactor,
    0.0,
    1.0/fm
);
```

### Comparison of Methods

```cpp
// Compare different integration methods
void CompareIntegrationMethods() {
    auto func = [](G4double x) {
        return std::sin(x) / x;
    };

    G4Integrator<G4double, G4double(*)(G4double)> integrator;

    G4double result_simpson = integrator.Simpson(func, 0.1, 10.0, 100);
    G4double result_leg10 = integrator.Legendre10(func, 0.1, 10.0);
    G4double result_leg96 = integrator.Legendre96(func, 0.1, 10.0);
    G4double result_adaptive = integrator.AdaptiveGauss(
        func, 0.1, 10.0, 1e-8);

    G4cout << "Simpson:   " << result_simpson << G4endl;
    G4cout << "Leg10:     " << result_leg10 << G4endl;
    G4cout << "Leg96:     " << result_leg96 << G4endl;
    G4cout << "Adaptive:  " << result_adaptive << G4endl;
}
```

## Algorithm Selection Guide

### Finite Interval [a, b]

| Method | Speed | Accuracy | Best For |
|--------|-------|----------|----------|
| Simpson | Fast | Moderate | Smooth functions, known behavior |
| Legendre10 | Very Fast | Good | General purpose, default choice |
| Legendre96 | Fast | Excellent | High precision requirements |
| AdaptiveGauss | Variable | Excellent | Unknown/complex functions |
| Chebyshev | Fast | Good | Endpoint singularities |

### Semi-Infinite [0, ∞)

- **Laguerre:** For integrals with e^(-x) decay
- Transform and use finite methods for other cases

### Infinite (-∞, ∞)

- **Hermite:** For Gaussian-weighted integrals
- Transform and use finite methods otherwise

## Performance Notes

1. **Legendre10 is the default choice:** Fast, accurate, reliable for most applications

2. **Use Legendre96 for high precision:** Only ~10x slower but much more accurate

3. **AdaptiveGauss for safety:** Automatic refinement but potential performance cost

4. **Specialized methods for efficiency:**
   - Laguerre for exponential decay → avoid infinite limits
   - Hermite for Gaussian weights → avoid numerical overflow
   - Chebyshev for endpoint singularities → better conditioning

5. **Function evaluations:**
   - Simpson(n): 2n+1 evaluations
   - Legendre(n): n evaluations
   - AdaptiveGauss: Variable (depends on function complexity)

## Thread Safety

`G4Integrator` is:
- **Thread-safe:** Stateless design, no mutable data
- **Reentrant:** Can be used simultaneously by multiple threads
- **Copy-friendly:** Lightweight, trivial to copy

Each thread can create its own integrator or share a single instance safely.

## Common Pitfalls

1. **Simpson with odd n:** Must use even number of intervals
   ```cpp
   // Wrong: n must be even
   integrator.Simpson(func, 0, 1, 99);  // Error!

   // Correct
   integrator.Simpson(func, 0, 1, 100);
   ```

2. **Adaptive tolerance too tight:** May not converge
   ```cpp
   // May fail or take very long
   integrator.AdaptiveGauss(func, 0, 1, 1e-15);

   // More reasonable
   integrator.AdaptiveGauss(func, 0, 1, 1e-8);
   ```

3. **Wrong method for integral type:**
   ```cpp
   // Don't do this - inefficient
   integrator.Legendre10(exp_decay, 0, 1000);  // Large interval

   // Better - natural for exponential decay
   integrator.Laguerre(exp_decay, 0.0, 48);
   ```

## Related Classes

- [G4VGaussianQuadrature](g4vgaussianquadrature.md) - Base class for Gaussian quadrature
- [G4GaussLegendreQ](g4gausslegendreq.md) - Gauss-Legendre quadrature
- [G4GaussHermiteQ](g4gausshermiteq.md) - Gauss-Hermite quadrature
- [G4GaussLaguerreQ](g4gausslaguerreq.md) - Gauss-Laguerre quadrature
- [G4SimpleIntegration](g4simpleintegration.md) - Alternative integration class
- [G4DataInterpolation](g4datainterpolation.md) - Data interpolation methods

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- Abramowitz & Stegun, "Handbook of Mathematical Functions" - Mathematical reference

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4Integrator.hh`
**Implementation:** `source/global/HEPNumerics/include/G4Integrator.icc`
**Author:** V.Grichine, 1999
:::
