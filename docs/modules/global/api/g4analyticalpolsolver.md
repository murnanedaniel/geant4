# G4AnalyticalPolSolver API Documentation

## Overview

`G4AnalyticalPolSolver` provides analytical (closed-form) solutions for polynomial equations up to 4th degree. It uses explicit algebraic formulas to find all real and complex roots, making it fast and deterministic for low-degree polynomials in CSG solid tracking.

The implementation is based on the CACM Algorithm 326 by Terence R.F. Nonweiler.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4AnalyticalPolSolver.hh`
**Implementation:** `source/global/HEPNumerics/src/G4AnalyticalPolSolver.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4AnalyticalPolSolver.hh:60-70`

```cpp
class G4AnalyticalPolSolver
{
 public:
  G4AnalyticalPolSolver();
  ~G4AnalyticalPolSolver();

  G4int QuadRoots(G4double p[5], G4double r[3][5]);
  G4int CubicRoots(G4double p[5], G4double r[3][5]);
  G4int BiquadRoots(G4double p[5], G4double r[3][5]);
  G4int QuarticRoots(G4double p[5], G4double r[3][5]);
};
```

## Methods

### QuadRoots

`source/global/HEPNumerics/include/G4AnalyticalPolSolver.hh:66`

```cpp
G4int QuadRoots(G4double p[5], G4double r[3][5]);
```

**Purpose:** Solve quadratic equation: p[0]x² + p[1]x + p[2] = 0

**Parameters:**
- `p[5]` - Coefficients: p[0] (x²), p[1] (x), p[2] (constant)
- `r[3][5]` - Results: r[1][k] = real part, r[2][k] = imaginary part

**Returns:** Number of roots (2)

**Formula:** x = (-b ± √(b²-4ac)) / 2a

### CubicRoots

`source/global/HEPNumerics/include/G4AnalyticalPolSolver.hh:67`

```cpp
G4int CubicRoots(G4double p[5], G4double r[3][5]);
```

**Purpose:** Solve cubic equation: p[0]x³ + p[1]x² + p[2]x + p[3] = 0

**Returns:** Number of roots (3)

**Method:** Cardano's formula

### BiquadRoots

`source/global/HEPNumerics/include/G4AnalyticalPolSolver.hh:68`

```cpp
G4int BiquadRoots(G4double p[5], G4double r[3][5]);
```

**Purpose:** Solve biquadratic: p[0]x⁴ + p[1]x² + p[2] = 0

**Returns:** Number of roots (4)

**Method:** Substitution y=x², solve quadratic, then x=±√y

### QuarticRoots

`source/global/HEPNumerics/include/G4AnalyticalPolSolver.hh:69`

```cpp
G4int QuarticRoots(G4double p[5], G4double r[3][5]);
```

**Purpose:** Solve quartic: p[0]x⁴ + p[1]x³ + p[2]x² + p[3]x + p[4] = 0

**Returns:** Number of roots (4)

**Method:** Ferrari's formula via cubic resolvent

## Usage Examples

### Quadratic Equation

```cpp
#include "G4AnalyticalPolSolver.hh"

// Solve x² - 5x + 6 = 0 (roots: 2, 3)
G4AnalyticalPolSolver solver;

G4double p[5] = {1.0, -5.0, 6.0, 0.0, 0.0};
G4double r[3][5];

G4int n = solver.QuadRoots(p, r);

for (G4int i = 1; i <= n; i++) {
    G4cout << "Root " << i << ": "
           << r[1][i] << " + " << r[2][i] << "i" << G4endl;
}
```

### Ray-Sphere Intersection

```cpp
// Find where ray intersects sphere
class SphereIntersection {
public:
    std::vector<G4double> FindIntersections(
        G4ThreeVector origin, G4ThreeVector dir, G4double radius) {

        // Ray: P = O + t*D
        // Sphere: x² + y² + z² = R²
        // Substitute: (Ox + t*Dx)² + (Oy + t*Dy)² + (Oz + t*Dz)² = R²
        // Quadratic in t: at² + bt + c = 0

        G4double a = dir.mag2();
        G4double b = 2.0 * origin.dot(dir);
        G4double c = origin.mag2() - radius*radius;

        G4double p[5] = {a, b, c, 0.0, 0.0};
        G4double r[3][5];

        G4AnalyticalPolSolver solver;
        G4int n = solver.QuadRoots(p, r);

        std::vector<G4double> solutions;
        for (G4int i = 1; i <= n; i++) {
            if (std::abs(r[2][i]) < 1e-10 && r[1][i] > 0) {
                solutions.push_back(r[1][i]);  // Real, positive root
            }
        }
        return solutions;
    }
};
```

### Cubic Trajectory

```cpp
// Particle in magnetic field (simplified cubic trajectory)
G4double FindExitTime(G4double coeff[4]) {
    // z(t) = at³ + bt² + ct + d = 0 (exit plane)

    G4double p[5] = {coeff[0], coeff[1], coeff[2], coeff[3], 0.0};
    G4double r[3][5];

    G4AnalyticalPolSolver solver;
    G4int n = solver.CubicRoots(p, r);

    // Find smallest positive real root
    G4double t_min = DBL_MAX;
    for (G4int i = 1; i <= n; i++) {
        if (std::abs(r[2][i]) < 1e-10) {  // Real root
            if (r[1][i] > 0 && r[1][i] < t_min) {
                t_min = r[1][i];
            }
        }
    }
    return t_min;
}
```

### Torus Intersection (Quartic)

```cpp
// Ray-torus intersection (4th degree polynomial)
std::vector<G4double> TorusIntersections(
    G4ThreeVector P, G4ThreeVector D,
    G4double Rmax, G4double Rmin) {

    // Build quartic coefficients
    // (long derivation omitted)

    G4double p[5];
    // ... compute coefficients ...

    G4double r[3][5];
    G4AnalyticalPolSolver solver;
    G4int n = solver.QuarticRoots(p, r);

    std::vector<G4double> hits;
    for (G4int i = 1; i <= n; i++) {
        if (std::abs(r[2][i]) < 1e-8 && r[1][i] > 0) {
            hits.push_back(r[1][i]);
        }
    }

    std::sort(hits.begin(), hits.end());
    return hits;
}
```

## Performance Notes

- **Fast:** Analytical formulas, no iteration
- **Deterministic:** Always returns same result
- **All roots:** Finds all real and complex roots
- **Best for:** CSG tracking, geometry intersections

## Accuracy Considerations

- **Numerical stability:** Can lose precision for ill-conditioned problems
- **Catastrophic cancellation:** Possible in (b² - 4ac)
- **Better for:** Well-scaled coefficients

## Thread Safety

Thread-safe. Stateless class, safe for concurrent use.

## Related Classes

- [G4PolynomialSolver](g4polynomialsolver.md) - Iterative solver
- [G4JTPolynomialSolver](g4jtpolynomialsolver.md) - High-degree polynomials

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4AnalyticalPolSolver.hh`
**Implementation:** `source/global/HEPNumerics/src/G4AnalyticalPolSolver.cc`
**Author:** V.Grichine, 2005
:::
