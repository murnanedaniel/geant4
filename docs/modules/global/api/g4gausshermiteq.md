# G4GaussHermiteQ API Documentation

## Overview

`G4GaussHermiteQ` implements Gauss-Hermite quadrature for integrating functions over infinite intervals (-∞, ∞) with a Gaussian weight function e^(-x²). This method is particularly useful for integrals involving Gaussian distributions and statistical mechanics calculations.

The quadrature automatically handles the e^(-x²) weight, so users only need to provide the remaining part of the integrand.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4GaussHermiteQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussHermiteQ.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4GaussHermiteQ.hh:43-58`

```cpp
class G4GaussHermiteQ : public G4VGaussianQuadrature
{
 public:
  G4GaussHermiteQ(function pFunction, G4int nHermite);

  G4GaussHermiteQ(const G4GaussHermiteQ&) = delete;
  G4GaussHermiteQ& operator=(const G4GaussHermiteQ&) = delete;

  G4double Integral() const;
};
```

## Constructor

`source/global/HEPNumerics/include/G4GaussHermiteQ.hh:48-50`

```cpp
G4GaussHermiteQ(function pFunction, G4int nHermite);
```

**Purpose:** Create Gauss-Hermite quadrature with n points

**Parameters:**
- `pFunction` - Function f(x) to integrate (without the e^(-x²) factor)
- `nHermite` - Number of quadrature points

**Notes:**
- Computes roots of Hermite polynomial Hₙ(x)
- Accuracy improves with larger nHermite
- Typical values: 16-64 points

## Integration Method

### Integral

`source/global/HEPNumerics/include/G4GaussHermiteQ.hh:55-57`

```cpp
G4double Integral() const;
```

**Purpose:** Compute ∫₋∞^∞ e^(-x²) f(x) dx

**Returns:** The integral value

**Mathematical Form:**
```
∫₋∞^∞ e^(-x²) f(x) dx ≈ Σᵢ wᵢ f(xᵢ)
```

**Important:** The function f(x) should NOT include the e^(-x²) factor - it's handled automatically

**Accuracy:** Exact for f(x) being a polynomial of degree ≤ 2n-1

## Mathematical Background

### Hermite Polynomials

The (physicist's) Hermite polynomials Hₙ(x) satisfy:
- **Orthogonality:** ∫₋∞^∞ e^(-x²) Hₘ(x)Hₙ(x)dx = √π 2ⁿ n! δₘₙ
- **Recurrence:** Hₙ₊₁(x) = 2xHₙ(x) - 2nHₙ₋₁(x)
- **Derivative:** H'ₙ(x) = 2nHₙ₋₁(x)

### Integration Points

- **Abscissas (xᵢ):** Roots of Hₙ(x)
- **Weights (wᵢ):** wᵢ = (2^(n-1) n! √π) / (n² [Hₙ₋₁(xᵢ)]²)

### Properties

- Abscissas are symmetric: x₋ᵢ = -xᵢ
- Weights are symmetric: w₋ᵢ = wᵢ
- All weights are positive
- Points cluster near x = 0 (where e^(-x²) is largest)

## Usage Examples

### Basic Gaussian Integral

```cpp
#include "G4GaussHermiteQ.hh"

// Integrate x² e^(-x²) from -∞ to ∞
G4double PolynomialFunction(G4double x) {
    return x * x;  // Don't include e^(-x²)!
}

G4GaussHermiteQ quad(PolynomialFunction, 32);
G4double result = quad.Integral();

// Analytical result: √π/2
G4cout << "Numerical: " << result << G4endl;
G4cout << "Analytical: " << std::sqrt(CLHEP::pi)/2 << G4endl;
```

### Maxwell-Boltzmann Distribution

```cpp
// Compute average velocity in Maxwell-Boltzmann distribution
class MaxwellBoltzmann {
public:
    MaxwellBoltzmann(G4double mass, G4double T)
        : fMass(mass), fKT(CLHEP::k_Boltzmann * T) {}

    G4double AverageSpeed() {
        // <v> = ∫ v f(v) dv where f(v) ~ v² e^(-mv²/2kT)
        // Transform to standard form with x = v√(m/2kT)

        auto integrand = [this](G4double x) {
            // x = v√(m/2kT), so v = x√(2kT/m)
            G4double v = x * std::sqrt(2*fKT/fMass);
            // Include v³ factor (v from average, v² from distribution)
            // e^(-x²) handled by Hermite quadrature
            return v * v * v;
        };

        G4GaussHermiteQ quad(integrand, 48);
        G4double integral = quad.Integral();

        // Normalization factor
        G4double norm = std::sqrt(2*fKT/(CLHEP::pi*fMass));

        return norm * integral;
    }

private:
    G4double fMass;
    G4double fKT;
};

// Usage
MaxwellBoltzmann gas(proton_mass_c2, 300*kelvin);
G4double v_avg = gas.AverageSpeed();
```

### Quantum Harmonic Oscillator

```cpp
// Expectation value in quantum harmonic oscillator
class HarmonicOscillator {
public:
    // Wave function: ψ_n(x) = (1/√(2ⁿn!)) (mω/πℏ)^(1/4) e^(-mωx²/2ℏ) Hₙ(ξ)
    // where ξ = √(mω/ℏ) x

    G4double ExpectationValue(G4int n, std::function<G4double(G4double)> observable) {
        auto integrand = [n, observable, this](G4double xi) {
            // xi is already the scaled coordinate
            G4double Hn = HermitePolynomial(n, xi);
            G4double psi_squared = Hn * Hn / (std::pow(2, n) * Factorial(n) * std::sqrt(CLHEP::pi));

            return psi_squared * observable(xi);
        };

        G4GaussHermiteQ quad(integrand, 64);
        return quad.Integral();
    }

private:
    G4double HermitePolynomial(G4int n, G4double x);
    G4double Factorial(G4int n);
};
```

### Error Function Calculation

```cpp
// Compute error function erf(a) using Gauss-Hermite
G4double ComputeErrorFunction(G4double a) {
    // erf(a) = (2/√π) ∫₀^a e^(-t²) dt
    //        = (1/√π) ∫₋∞^∞ e^(-x²) H(a-|x|) dx
    // where H is Heaviside step function

    auto integrand = [a](G4double x) {
        return (std::abs(x) <= a) ? 1.0 : 0.0;
    };

    G4GaussHermiteQ quad(integrand, 48);
    return quad.Integral() / std::sqrt(CLHEP::pi);
}
```

### Momentum Space Integrals

```cpp
// Momentum distribution in phase space
class MomentumDistribution {
public:
    G4double IntegrateMomentum(G4double T) {
        // ∫ p² f(p) dp with Gaussian momentum distribution
        // Transform to dimensionless: x = p/p₀

        G4double p0 = std::sqrt(2 * electron_mass_c2 * CLHEP::k_Boltzmann * T);

        auto integrand = [p0](G4double x) {
            G4double p = x * p0;
            // p² from phase space, e^(-p²/p₀²) from Hermite
            return p * p * p * p;  // Additional p² factor
        };

        G4GaussHermiteQ quad(integrand, 40);
        G4double integral = quad.Integral();

        // Include normalization
        return integral / (p0 * p0 * std::sqrt(CLHEP::pi));
    }
};
```

### Normal Distribution Moments

```cpp
// Calculate moments of normal distribution
class NormalMoments {
public:
    // n-th moment of N(μ, σ²)
    G4double Moment(G4int n, G4double mu, G4double sigma) {
        auto integrand = [n, mu, sigma](G4double x) {
            // x is standard normal variable
            G4double y = mu + sigma * x * std::sqrt(2);  // Transform
            return std::pow(y, n);
        };

        G4GaussHermiteQ quad(integrand, 64);
        return quad.Integral() / std::sqrt(CLHEP::pi);
    }
};

// Usage
NormalMoments nm;
G4double mean = nm.Moment(1, 5.0, 2.0);      // Should be 5.0
G4double variance = nm.Moment(2, 5.0, 2.0) - mean*mean;  // Should be 4.0
```

## Performance Characteristics

### Number of Points vs Accuracy

| Points | Polynomial Degree | Typical Error |
|--------|-------------------|---------------|
| 16 | 15 | 10⁻⁸ - 10⁻¹⁰ |
| 32 | 31 | 10⁻¹² - 10⁻¹⁴ |
| 48 | 47 | 10⁻¹⁴ - 10⁻¹⁶ |
| 64 | 63 | ~machine precision |

### Convergence Properties

- **Fast convergence:** For functions compatible with Gaussian weight
- **Slow convergence:** If f(x) doesn't decay sufficiently at infinity
- **Best case:** f(x) is polynomial or decays exponentially

### Computational Cost

- **Initialization:** O(n²) one-time cost
- **Integration:** O(n) function evaluations
- **Memory:** O(n)

## When to Use Gauss-Hermite

**Ideal for:**
- Gaussian-weighted integrals
- Normal distribution calculations
- Statistical mechanics partition functions
- Quantum harmonic oscillator
- Fourier transforms of Gaussians

**Not suitable for:**
- Slowly decaying functions
- Functions with non-Gaussian weight
- Finite or semi-infinite intervals (use Legendre/Laguerre)
- Sharp features far from origin

## Comparison with Other Methods

```cpp
// Compare Hermite quadrature with other approaches
void CompareIntegrationMethods() {
    // Integrate x² e^(-x²)
    auto func = [](G4double x) { return x*x; };

    // Method 1: Gauss-Hermite (natural choice)
    G4GaussHermiteQ hermite(func, 32);
    G4double result1 = hermite.Integral();

    // Method 2: Gauss-Legendre on finite interval (approximate)
    auto funcWithExp = [](G4double x) {
        return x*x * std::exp(-x*x);
    };
    G4GaussLegendreQ legendre(funcWithExp, 64);
    G4double result2 = 2 * legendre.Integral(0, 10);  // Large cutoff

    // Method 3: Analytic result
    G4double analytic = std::sqrt(CLHEP::pi) / 2.0;

    G4cout << "Hermite:   " << result1 << G4endl;
    G4cout << "Legendre:  " << result2 << G4endl;
    G4cout << "Analytic:  " << analytic << G4endl;
    G4cout << "Error (Hermite): " << std::abs(result1-analytic) << G4endl;
    G4cout << "Error (Legendre): " << std::abs(result2-analytic) << G4endl;
}
```

## Thread Safety

`G4GaussHermiteQ` is:
- **Thread-safe after construction**
- **Const methods safe for concurrent calls**
- **Recommended:** Create per-thread instances

## Common Pitfalls

1. **Including e^(-x²) in function:**
   ```cpp
   // WRONG - e^(-x²) counted twice
   auto wrong = [](G4double x) {
       return x * x * std::exp(-x*x);
   };

   // CORRECT - Hermite quadrature handles e^(-x²)
   auto correct = [](G4double x) {
       return x * x;
   };
   ```

2. **Slowly decaying functions:**
   ```cpp
   // Poor convergence - doesn't match Gaussian weight
   auto slow = [](G4double x) {
       return 1.0 / (1 + x*x);  // Lorentzian
   };
   // Better to use different method or transform
   ```

3. **Wrong coordinate scaling:**
   ```cpp
   // To integrate ∫ e^(-αx²) f(x) dx:
   // Change variables: y = √α x, dy = √α dx
   auto rescaled = [alpha, f](G4double y) {
       return f(y/std::sqrt(alpha)) / std::sqrt(alpha);
   };
   ```

## Related Classes

- [G4VGaussianQuadrature](g4vgaussianquadrature.md) - Base class
- [G4GaussLegendreQ](g4gausslegendreq.md) - For finite intervals
- [G4GaussLaguerreQ](g4gausslaguerreq.md) - For semi-infinite intervals
- [G4Integrator](g4integrator.md) - Template integrator with Hermite method

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- Abramowitz & Stegun Chapter 25.4 - Hermite Polynomial Integration

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4GaussHermiteQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussHermiteQ.cc`
**Author:** V.Grichine, 1997
:::
