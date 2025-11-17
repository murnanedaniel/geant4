# G4GaussLaguerreQ API Documentation

## Overview

`G4GaussLaguerreQ` implements Gauss-Laguerre quadrature for integrating functions over semi-infinite intervals [0, ∞) with weight function x^α e^(-x). This method is particularly useful for integrals involving exponentially decaying functions, commonly found in energy spectra, decay processes, and quantum mechanics.

The quadrature automatically handles the x^α e^(-x) weight function, so users provide only the remaining part of the integrand.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4GaussLaguerreQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussLaguerreQ.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4GaussLaguerreQ.hh:44-63`

```cpp
class G4GaussLaguerreQ : public G4VGaussianQuadrature
{
 public:
  G4GaussLaguerreQ(function pFunction, G4double alpha, G4int nLaguerre);

  G4GaussLaguerreQ(const G4GaussLaguerreQ&) = delete;
  G4GaussLaguerreQ& operator=(const G4GaussLaguerreQ&) = delete;

  G4double Integral() const;
};
```

## Constructor

`source/global/HEPNumerics/include/G4GaussLaguerreQ.hh:47-53`

```cpp
G4GaussLaguerreQ(function pFunction, G4double alpha, G4int nLaguerre);
```

**Purpose:** Create Gauss-Laguerre quadrature for specific α parameter

**Parameters:**
- `pFunction` - Function f(x) to integrate (without x^α e^(-x) factor)
- `alpha` - Power α in weight function x^α e^(-x), must be > -1
- `nLaguerre` - Number of quadrature points

**Notes:**
- Common values: α = 0 (simple exponential), α = 0.5 (√x e^(-x))
- Accuracy improves with larger nLaguerre
- Typical values: 16-64 points

## Integration Method

### Integral

`source/global/HEPNumerics/include/G4GaussLaguerreQ.hh:58-62`

```cpp
G4double Integral() const;
```

**Purpose:** Compute ∫₀^∞ x^α e^(-x) f(x) dx

**Returns:** The integral value

**Mathematical Form:**
```
∫₀^∞ x^α e^(-x) f(x) dx ≈ Σᵢ wᵢ f(xᵢ)
```

**Important:** The function f(x) should NOT include x^α e^(-x) - it's handled automatically

**Accuracy:** Exact for f(x) being a polynomial of degree ≤ 2n-1

## Mathematical Background

### Generalized Laguerre Polynomials

The generalized Laguerre polynomials L^(α)_n(x) satisfy:
- **Orthogonality:** ∫₀^∞ x^α e^(-x) L^(α)_m(x) L^(α)_n(x) dx = Γ(n+α+1)/n! δₘₙ
- **Recurrence:** (n+1)L^(α)_{n+1}(x) = (2n+α+1-x)L^(α)_n(x) - (n+α)L^(α)_{n-1}(x)

### Integration Points

- **Abscissas (xᵢ):** Roots of L^(α)_n(x)
- **Weights (wᵢ):** wᵢ = [Γ(n+α+1)/n!] xᵢ / [(n+1)L^(α)_{n+1}(xᵢ)]²

### Special Cases

- **α = 0:** Standard Laguerre polynomials, weight e^(-x)
- **α = 0.5:** Weight √x e^(-x), useful for momentum distributions
- **α = 1:** Weight x e^(-x)
- **α = 2:** Weight x² e^(-x)

## Usage Examples

### Basic Exponential Decay

```cpp
#include "G4GaussLaguerreQ.hh"

// Integrate x² e^(-x) from 0 to ∞
G4double SquareFunction(G4double x) {
    return x * x;  // Don't include e^(-x)!
}

// alpha = 0 for simple e^(-x) weight
G4GaussLaguerreQ quad(SquareFunction, 0.0, 32);
G4double result = quad.Integral();

// Analytical result: Γ(3) = 2! = 2
G4cout << "Numerical: " << result << G4endl;
G4cout << "Analytical: " << 2.0 << G4endl;
```

### Energy Spectrum Integration

```cpp
// Integrate energy spectrum from 0 to infinity
class EnergySpectrum {
public:
    // Maxwell-Boltzmann energy distribution
    G4double Spectrum(G4double E, G4double kT) {
        // dN/dE ~ √E e^(-E/kT)
        // Transform: x = E/kT, so E = kT·x
        // √E e^(-E/kT) = √(kT·x) e^(-x) = √(kT) √x e^(-x)

        return std::sqrt(E);  // Just √E part
        // Weight √x e^(-x) handled by Laguerre with α=0.5
    }

    G4double IntegrateSpectrum(G4double kT) {
        auto func = [kT, this](G4double x) {
            G4double E = kT * x;
            return std::sqrt(E) / kT;  // Include transformation Jacobian
        };

        // α = 0.5 for √x e^(-x) weight
        G4GaussLaguerreQ quad(func, 0.5, 48);
        return quad.Integral() * std::sqrt(kT);
    }
};
```

### Nuclear Decay Chain

```cpp
// Calculate activity in decay chain
class DecayChain {
public:
    // Activity = ∫₀^∞ N(t) λ e^(-λt) dt
    G4double IntegrateActivity(G4double lambda, G4double N0) {
        // For simple decay: N(t) = N0 (constant in this example)
        auto func = [](G4double t) {
            return 1.0;  // N(t)/N0 is constant
        };

        // Weight e^(-λt), rescale time: x = λt
        // ∫₀^∞ N0 λ e^(-λt) dt = N0 ∫₀^∞ e^(-x) dx
        G4GaussLaguerreQ quad(func, 0.0, 32);
        return N0 * lambda * quad.Integral();
    }

    // More complex: parent-daughter decay
    G4double DaughterActivity(G4double t_measure,
                             G4double lambda1, G4double lambda2) {
        auto bateman = [lambda1, lambda2](G4double t) {
            if (std::abs(lambda1 - lambda2) < 1e-10)
                return lambda1 * t * std::exp(lambda1 * t);  // Equal λ case
            return (lambda1/(lambda2-lambda1)) *
                   (std::exp((lambda2-lambda1)*t) - 1.0);
        };

        G4GaussLaguerreQ quad(bateman, 0.0, 64);
        return quad.Integral();
    }
};
```

### Cross Section Integration

```cpp
// Integrate cross section over energy
class CrossSectionIntegrator {
public:
    CrossSectionIntegrator(G4double E0) : fE0(E0) {}

    // Integrate σ(E) over Maxwellian energy distribution
    G4double MaxwellianAverageCrossSection() {
        // <σ> = ∫₀^∞ σ(E) √E e^(-E/E0) dE / ∫₀^∞ √E e^(-E/E0) dE
        // Transform: x = E/E0

        auto weighted_sigma = [this](G4double x) {
            G4double E = fE0 * x;
            return CrossSection(E) * std::sqrt(E);
        };

        G4GaussLaguerreQ quad(weighted_sigma, 0.5, 48);
        G4double numerator = quad.Integral();

        // Denominator is Γ(1.5) = √π/2
        return numerator / (std::sqrt(CLHEP::pi)/2 * std::sqrt(fE0));
    }

private:
    G4double CrossSection(G4double E);
    G4double fE0;
};
```

### Quantum Tunneling Rate

```cpp
// WKB tunneling probability
class TunnelingCalculator {
public:
    G4double TunnelingRate(G4double barrier_height, G4double width) {
        // Γ ~ ∫₀^∞ e^(-2κ(E)w) ρ(E) dE
        // where ρ(E) ~ √E e^(-E/kT) (thermal distribution)

        auto integrand = [barrier_height, width, this](G4double x) {
            G4double E = kT * x;
            if (E > barrier_height) return 0.0;

            G4double kappa = std::sqrt(2*m*(barrier_height-E))/hbar;
            return std::exp(-2*kappa*width) * std::sqrt(E);
        };

        G4GaussLaguerreQ quad(integrand, 0.5, 64);
        return quad.Integral();
    }

private:
    G4double kT = 0.025*eV;
    G4double m = electron_mass_c2;
    G4double hbar = CLHEP::hbar_Planck;
};
```

### Lifetime Integration

```cpp
// Mean lifetime calculation
class LifetimeCalculator {
public:
    // <t> = ∫₀^∞ t P(t) dt where P(t) = (1/τ) e^(-t/τ)
    G4double MeanLifetime(G4double tau) {
        // Transform: x = t/τ
        auto t_weighted = [](G4double x) {
            return x;  // Just t/τ, weight e^(-x) from Laguerre
        };

        G4GaussLaguerreQ quad(t_weighted, 0.0, 32);
        return tau * quad.Integral();  // Should equal τ
    }

    // Variance of lifetime
    G4double VarianceLifetime(G4double tau) {
        // Var(t) = <t²> - <t>²
        auto t2_weighted = [](G4double x) {
            return x * x;
        };

        G4GaussLaguerreQ quad(t2_weighted, 0.0, 32);
        G4double mean_t2 = tau * tau * quad.Integral();  // Should equal 2τ²

        G4double mean_t = tau;
        return mean_t2 - mean_t * mean_t;  // Should equal τ²
    }
};
```

### Momentum Distribution (α = 1/2)

```cpp
// Particle momentum distribution
G4double IntegrateMomentumDistribution() {
    // ∫₀^∞ p³ e^(-p²/2mkT) dp
    // Let x = p²/(2mkT), then p = √(2mkT·x), dp = √(2mkT)/(2√x) dx
    // Integral becomes ∫₀^∞ (2mkT)² x e^(-x) √(2mkT)/(2√x) dx
    //                = (2mkT)^(5/2)/2 ∫₀^∞ √x e^(-x) dx

    G4double mkT = electron_mass_c2 * 0.025*eV;

    auto integrand = [](G4double x) {
        return 1.0;  // Just the √x e^(-x) weight
    };

    G4GaussLaguerreQ quad(integrand, 0.5, 32);
    G4double integral = quad.Integral();  // Γ(1.5) = √π/2

    return std::pow(2*mkT, 2.5) / 2 * integral;
}
```

## Performance Characteristics

### Number of Points vs Accuracy

| Points | Polynomial Degree | Typical Error |
|--------|-------------------|---------------|
| 16 | 15 | 10⁻⁸ |
| 32 | 31 | 10⁻¹² |
| 48 | 47 | 10⁻¹⁴ |
| 64 | 63 | ~10⁻¹⁶ |

### Convergence Properties

- **Exponential convergence:** For functions compatible with weight
- **Fast for polynomials:** Exact for degree ≤ 2n-1
- **Optimal for exponential decay:** Natural fit for e^(-x) behavior

### Computational Cost

- **Initialization:** O(n²) - computed once
- **Integration:** O(n) function evaluations
- **Memory:** O(n)

## Alpha Parameter Selection

### Common Values

| α | Weight Function | Physical Application |
|---|-----------------|---------------------|
| 0 | e^(-x) | Simple exponential decay |
| 0.5 | √x e^(-x) | Momentum distributions |
| 1 | x e^(-x) | Modified distributions |
| 2 | x² e^(-x) | Phase space integrals |

### Transform to α = 0

Any α can be transformed to α = 0:
```cpp
// Instead of ∫₀^∞ x^α e^(-x) f(x) dx with α ≠ 0
// Use ∫₀^∞ e^(-x) [x^α f(x)] dx with α = 0

auto transformed = [alpha, f](G4double x) {
    return std::pow(x, alpha) * f(x);
};
G4GaussLaguerreQ quad(transformed, 0.0, n);
```

## Thread Safety

`G4GaussLaguerreQ` is:
- **Thread-safe after construction**
- **Const methods safe for concurrent calls**
- **Recommended:** Use per-thread instances

## Common Pitfalls

1. **Including weight in function:**
   ```cpp
   // WRONG - weight counted twice
   auto wrong = [](G4double x) {
       return x * std::exp(-x);  // e^(-x) already in weight!
   };

   // CORRECT - weight handled automatically
   auto correct = [](G4double x) {
       return x;
   };
   G4GaussLaguerreQ quad(correct, 0.0, 32);
   ```

2. **Wrong α value:**
   ```cpp
   // To integrate ∫₀^∞ x^(3/2) e^(-x) f(x) dx:
   G4GaussLaguerreQ quad(f, 1.5, 48);  // Use α = 1.5
   ```

3. **Coordinate transformation errors:**
   ```cpp
   // To integrate ∫₀^∞ e^(-ax) f(x) dx:
   // Let y = ax, x = y/a, dx = dy/a
   auto transformed = [a, f](G4double y) {
       return f(y/a) / a;
   };
   G4GaussLaguerreQ quad(transformed, 0.0, n);
   ```

## When to Use Gauss-Laguerre

**Ideal for:**
- Exponentially decaying functions
- Energy spectra with e^(-E/E₀) form
- Decay processes
- Thermal distributions
- Semi-infinite domains [0,∞)

**Not suitable for:**
- Finite intervals (use Gauss-Legendre)
- Oscillatory functions without decay
- Functions not decaying exponentially

## Related Classes

- [G4VGaussianQuadrature](g4vgaussianquadrature.md) - Base class
- [G4GaussLegendreQ](g4gausslegendreq.md) - For finite intervals
- [G4GaussHermiteQ](g4gausshermiteq.md) - For infinite intervals
- [G4Integrator](g4integrator.md) - Template integrator with Laguerre method

## See Also

- [Global Module Overview](../index.md) - Complete Global module documentation
- Abramowitz & Stegun Chapter 25.4 - Laguerre Polynomial Integration

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4GaussLaguerreQ.hh`
**Implementation:** `source/global/HEPNumerics/src/G4GaussLaguerreQ.cc`
**Author:** V.Grichine, 1997
:::
