# G4JTPolynomialSolver API Documentation

## Overview

`G4JTPolynomialSolver` implements the Jenkins-Traub algorithm for finding all roots of real polynomials of arbitrary degree. This is the most robust polynomial solver in Geant4, capable of handling high-degree polynomials where analytical methods fail.

The algorithm iteratively computes roots using a combination of polynomial deflation and iterative refinement.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4JTPolynomialSolver.hh`
**Implementation:** `source/global/HEPNumerics/src/G4JTPolynomialSolver.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4JTPolynomialSolver.hh:66-114`

```cpp
class G4JTPolynomialSolver
{
 public:
  G4JTPolynomialSolver() = default;
  ~G4JTPolynomialSolver() = default;

  G4int FindRoots(G4double* op, G4int degree, G4double* zeror, G4double* zeroi);
};
```

## Public Methods

### FindRoots

`source/global/HEPNumerics/include/G4JTPolynomialSolver.hh:72`

```cpp
G4int FindRoots(G4double* op, G4int degree, G4double* zeror, G4double* zeroi);
```

**Purpose:** Find all roots of polynomial

**Parameters:**
- `op` - Array of coefficients in descending power order
  - op[0] is coefficient of x^degree
  - op[degree] is constant term
- `degree` - Degree of polynomial
- `zeror` - Output array of real parts (size: degree)
- `zeroi` - Output array of imaginary parts (size: degree)

**Returns:**
- Number of roots found (normally equals degree)
- -1 if leading coefficient is zero

**Example:**
```cpp
// Polynomial: x⁷ + 3x⁵ - 2x + 1
G4double coef[8] = {1, 0, 3, 0, 0, -2, 1, 0};
G4double zr[7], zi[7];

G4JTPolynomialSolver solver;
G4int n = solver.FindRoots(coef, 7, zr, zi);

for (G4int i = 0; i < n; i++) {
    G4cout << "Root " << i << ": "
           << zr[i] << " + " << zi[i] << "i" << G4endl;
}
```

## Usage Examples

### High-Degree Polynomial

```cpp
#include "G4JTPolynomialSolver.hh"

// Solve x⁸ - 1 = 0 (8th roots of unity)
G4JTPolynomialSolver solver;

G4double coef[9] = {1, 0, 0, 0, 0, 0, 0, 0, -1};
G4double zr[8], zi[8];

G4int n = solver.FindRoots(coef, 8, zr, zi);

for (G4int i = 0; i < n; i++) {
    G4double mag = std::sqrt(zr[i]*zr[i] + zi[i]*zi[i]);
    G4double phase = std::atan2(zi[i], zr[i]);
    G4cout << "Root " << i << ": magnitude=" << mag
           << " phase=" << phase << G4endl;
}
```

### Complex Optical Surface

```cpp
// Find reflections in multi-layer optical system
class OpticalSystem {
public:
    std::vector<G4complex> FindReflectionPoints(G4double wavelength) {
        // Build characteristic polynomial for multi-layer system
        // (degree depends on number of layers)

        std::vector<G4double> coeffs = BuildCharacteristicPoly(wavelength);
        G4int degree = coeffs.size() - 1;

        G4double* zr = new G4double[degree];
        G4double* zi = new G4double[degree];

        G4JTPolynomialSolver solver;
        G4int n = solver.FindRoots(coeffs.data(), degree, zr, zi);

        std::vector<G4complex> roots;
        for (G4int i = 0; i < n; i++) {
            roots.emplace_back(zr[i], zi[i]);
        }

        delete[] zr;
        delete[] zi;
        return roots;
    }

private:
    std::vector<G4double> BuildCharacteristicPoly(G4double lambda);
};
```

### Resonance Finding

```cpp
// Find resonance poles in scattering amplitude
class ResonanceFinder {
public:
    std::vector<G4complex> FindPoles(G4int nMax) {
        // S-matrix has polynomial form in energy
        // Poles correspond to resonances

        std::vector<G4double> numerator = ComputeNumerator(nMax);
        std::vector<G4double> denominator = ComputeDenominator(nMax);

        G4int degree = denominator.size() - 1;
        G4double* zr = new G4double[degree];
        G4double* zi = new G4double[degree];

        G4JTPolynomialSolver solver;
        G4int n = solver.FindRoots(denominator.data(), degree, zr, zi);

        // Resonances are poles with negative imaginary part (decaying)
        std::vector<G4complex> resonances;
        for (G4int i = 0; i < n; i++) {
            if (zi[i] < 0) {
                resonances.emplace_back(zr[i], zi[i]);
            }
        }

        delete[] zr;
        delete[] zi;
        return resonances;
    }

private:
    std::vector<G4double> ComputeNumerator(G4int n);
    std::vector<G4double> ComputeDenominator(G4int n);
};
```

### Filter Roots by Criteria

```cpp
// Find only physically meaningful roots
std::vector<G4double> FindRealPositiveRoots(
    const std::vector<G4double>& coefficients) {

    G4int degree = coefficients.size() - 1;
    G4double* zr = new G4double[degree];
    G4double* zi = new G4double[degree];

    G4JTPolynomialSolver solver;
    G4int n = solver.FindRoots(
        const_cast<G4double*>(coefficients.data()), degree, zr, zi);

    std::vector<G4double> real_positive;
    for (G4int i = 0; i < n; i++) {
        // Check if real (small imaginary part)
        if (std::abs(zi[i]) < 1e-10) {
            // Check if positive
            if (zr[i] > 0) {
                real_positive.push_back(zr[i]);
            }
        }
    }

    delete[] zr;
    delete[] zi;

    std::sort(real_positive.begin(), real_positive.end());
    return real_positive;
}
```

## Algorithm Details

### Jenkins-Traub Method

1. **Polynomial Normalization:** Scale coefficients
2. **Stage 1:** Fixed shift to remove trivial roots
3. **Stage 2:** Variable shift iteration
4. **Stage 3:** Quadratic factorization
5. **Deflation:** Remove found roots and repeat

### Convergence Properties

- **Globally convergent:** Almost always finds all roots
- **Efficient:** O(n²) operations per root
- **Numerically stable:** Uses scaling and balancing

## Performance Characteristics

### Computational Cost

- **Time complexity:** O(n³) for n roots
- **Memory:** O(n) working space
- **Best for:** Degree > 4 (use G4AnalyticalPolSolver for lower degrees)

### Accuracy

- **Typical precision:** 10⁻¹² to 10⁻¹⁴
- **Controlled by:** Machine precision constants
- **Robust:** Handles multiple roots, close roots

## Thread Safety

`G4JTPolynomialSolver` is:
- **Thread-safe:** Uses only local variables in FindRoots
- **Reentrant:** Can be used by multiple threads
- **Lightweight:** Safe to create per-thread instances

## Common Pitfalls

1. **Zero leading coefficient:**
   ```cpp
   G4double bad[5] = {0, 1, 2, 3, 4};  // Leading coef is zero!
   // Returns -1

   // Correct: ensure op[0] != 0
   if (std::abs(op[0]) < 1e-15) {
       // Handle special case or renormalize
   }
   ```

2. **Array sizes:**
   ```cpp
   // WRONG - arrays too small
   G4double zr[5], zi[5];
   solver.FindRoots(coef, 7, zr, zi);  // Need size 7!

   // CORRECT
   G4double zr[7], zi[7];
   solver.FindRoots(coef, 7, zr, zi);
   ```

3. **Coefficient order:**
   ```cpp
   // For x³ + 2x² - 3x + 1:
   G4double correct[4] = {1, 2, -3, 1};  // Descending powers
   G4double wrong[4] = {1, -3, 2, 1};    // Random order
   ```

## When to Use

**Use Jenkins-Traub when:**
- Degree > 4 (analytical methods unavailable)
- All roots needed (not just one)
- Complex roots expected
- Robust solution required

**Use alternatives when:**
- Degree ≤ 4: Use [G4AnalyticalPolSolver](g4analyticalpolsolver.md)
- Single root needed: Use [G4PolynomialSolver](g4polynomialsolver.md)
- Simple iteration OK: Use Newton-Raphson

## Related Classes

- [G4AnalyticalPolSolver](g4analyticalpolsolver.md) - Analytical solutions (degree ≤ 4)
- [G4PolynomialSolver](g4polynomialsolver.md) - Bezier clipping method
- [G4DataInterpolation](g4datainterpolation.md) - Polynomial interpolation

## References

- Jenkins & Traub, "A Three-Stage Algorithm for Real Polynomials Using Quadratic Iteration," SIAM J. Numer. Anal., 1970
- TOMS Algorithm 493

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4JTPolynomialSolver.hh`
**Implementation:** `source/global/HEPNumerics/src/G4JTPolynomialSolver.cc`
**Author:** O.Link, 2005
:::
