# G4PolynomialSolver API Documentation

## Overview

`G4PolynomialSolver` is a template class that solves polynomial equations using the Bezier clipping method combined with Newton's method. It's designed for implicit equation solving in geometry calculations, particularly for finding ray-surface intersections in complex solid shapes like tori.

The solver provides high precision for polynomials up to 4th degree and uses adaptive interval subdivision for robust root finding.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4PolynomialSolver.hh`
**Implementation:** `source/global/HEPNumerics/include/G4PolynomialSolver.icc`
:::

## Template Parameters

`source/global/HEPNumerics/include/G4PolynomialSolver.hh:96-97`

```cpp
template <class T, class F>
class G4PolynomialSolver
```

**Template Parameters:**
- `T` - Type of the class containing the function
- `F` - Member function pointer type for function and derivative

## Constructor

`source/global/HEPNumerics/include/G4PolynomialSolver.hh:100`

```cpp
G4PolynomialSolver(T* typeF, F func, F deriv, G4double precision);
```

**Purpose:** Create solver with function, derivative, and precision

**Parameters:**
- `typeF` - Pointer to object containing the function
- `func` - Member function pointer to f(x)
- `deriv` - Member function pointer to f'(x)
- `precision` - Required relative precision

**Example:**
```cpp
class TorusEquation {
public:
    G4double Function(G4double t);
    G4double Derivative(G4double t);
};

TorusEquation torus;
G4PolynomialSolver<TorusEquation, G4double(TorusEquation::*)(G4double)>
    solver(&torus, &TorusEquation::Function,
           &TorusEquation::Derivative, 1e-10);
```

## Public Methods

### solve

`source/global/HEPNumerics/include/G4PolynomialSolver.hh:103`

```cpp
G4double solve(G4double IntervalMin, G4double IntervalMax);
```

**Purpose:** Find root in interval [IntervalMin, IntervalMax]

**Returns:** Root of f(x) = 0 in the interval

**Precision:** Controlled by precision parameter in constructor

**Algorithm:**
1. Bezier clipping to narrow interval
2. Newton-Raphson iteration for refinement
3. Bisection fallback if needed

## Usage Examples

### Basic Polynomial Root Finding

```cpp
#include "G4PolynomialSolver.hh"

class QuadraticEq {
public:
    QuadraticEq(G4double a, G4double b, G4double c)
        : fA(a), fB(b), fC(c) {}

    G4double Function(G4double x) {
        return fA*x*x + fB*x + fC;
    }

    G4double Derivative(G4double x) {
        return 2*fA*x + fB;
    }

private:
    G4double fA, fB, fC;
};

// Solve x² - 2x - 3 = 0
QuadraticEq eq(1.0, -2.0, -3.0);

G4PolynomialSolver<QuadraticEq, G4double(QuadraticEq::*)(G4double)>
    solver(&eq, &QuadraticEq::Function,
           &QuadraticEq::Derivative, 1e-10);

// Find root in [0, 5]
G4double root1 = solver.solve(0.0, 5.0);  // Should find x = 3

// Find root in [-5, 0]
G4double root2 = solver.solve(-5.0, 0.0);  // Should find x = -1
```

### Torus Intersection

```cpp
// Find ray-torus intersection
class TorusIntersection {
public:
    TorusIntersection(G4ThreeVector point, G4ThreeVector direction,
                     G4double Rmax, G4double Rmin)
        : fP(point), fD(direction), fRmax(Rmax), fRmin(Rmin) {}

    G4double Function(G4double t) {
        // Point on ray: P + t*D
        G4ThreeVector pos = fP + t * fD;

        G4double x = pos.x();
        G4double y = pos.y();
        G4double z = pos.z();

        // Torus equation
        G4double rho2 = x*x + y*y;
        G4double temp = rho2 + z*z + fRmax*fRmax - fRmin*fRmin;

        return temp*temp - 4*fRmax*fRmax*rho2;
    }

    G4double Derivative(G4double t) {
        // Derivative of torus equation w.r.t. t
        G4ThreeVector pos = fP + t * fD;

        G4double x = pos.x();
        G4double y = pos.y();
        G4double z = pos.z();

        G4double dx = fD.x();
        G4double dy = fD.y();
        G4double dz = fD.z();

        G4double rho2 = x*x + y*y;
        G4double temp = rho2 + z*z + fRmax*fRmax - fRmin*fRmin;

        G4double dtemp = 2*(x*dx + y*dy + z*dz);
        G4double drho2 = 2*(x*dx + y*dy);

        return 2*temp*dtemp - 8*fRmax*fRmax*drho2;
    }

    G4double FindIntersection() {
        G4PolynomialSolver<TorusIntersection,
                          G4double(TorusIntersection::*)(G4double)>
            solver(this, &TorusIntersection::Function,
                   &TorusIntersection::Derivative, 1e-8);

        // Find nearest intersection (t > 0)
        return solver.solve(0.0, 1000.0*mm);
    }

private:
    G4ThreeVector fP, fD;
    G4double fRmax, fRmin;
};
```

### Cubic Spline Root Finding

```cpp
// Find where cubic spline crosses a value
class SplineRoot {
public:
    SplineRoot(G4double a, G4double b, G4double c, G4double d,
               G4double target)
        : fA(a), fB(b), fC(c), fD(d), fTarget(target) {}

    G4double Function(G4double x) {
        // S(x) = ax³ + bx² + cx + d - target
        return fA*x*x*x + fB*x*x + fC*x + fD - fTarget;
    }

    G4double Derivative(G4double x) {
        // S'(x) = 3ax² + 2bx + c
        return 3*fA*x*x + 2*fB*x + fC;
    }

private:
    G4double fA, fB, fC, fD, fTarget;
};
```

### Energy Loss Equation

```cpp
// Solve for range given energy loss
class RangeCalculator {
public:
    RangeCalculator(G4double E0, G4double Ef, G4double dEdx_const)
        : fE0(E0), fEf(Ef), fdEdx(dEdx_const) {}

    G4double Function(G4double range) {
        // Bethe-Bloch equation simplified
        G4double E_at_range = fE0 - fdEdx * range;

        // Want E_at_range = Ef
        return E_at_range - fEf;
    }

    G4double Derivative(G4double range) {
        return -fdEdx;
    }

private:
    G4double fE0, fEf, fdEdx;
};
```

## Algorithm Details

### Bezier Clipping Method

1. **Convert polynomial to Bezier form:** Express P(t) using Bezier control points
2. **Clip interval:** Use Bezier curve properties to eliminate regions without roots
3. **Iterate:** Repeat until interval is sufficiently small
4. **Newton refinement:** Polish root with Newton-Raphson

### Advantages

- **Robust:** Handles polynomials up to degree 4 reliably
- **Guaranteed convergence:** For well-conditioned problems
- **Adaptive:** Adjusts to function behavior
- **No initial guess needed:** Works with interval only

## Performance Notes

- **Convergence rate:** Quadratic near root (Newton's method)
- **Robust fallback:** Bezier clipping prevents divergence
- **Best for:** Degree ≤ 4 polynomials
- **Precision:** User-controlled via constructor parameter

## Limitations

- **Single root:** Finds one root per call
- **Degree limit:** Optimized for polynomials up to degree 4
- **Derivative required:** Must provide analytic derivative
- **Interval must bracket root:** Undefined behavior if no root in interval

## Thread Safety

`G4PolynomialSolver` is:
- **Thread-safe:** No mutable state after construction
- **Reentrant:** Multiple threads can use same instance
- **Lightweight:** Safe to create per-thread instances

## Common Pitfalls

1. **No root in interval:**
   ```cpp
   // May fail or return boundary
   solver.solve(0.0, 1.0);  // No root here

   // Better: check for sign change first
   if (func(0.0) * func(1.0) < 0) {
       root = solver.solve(0.0, 1.0);
   }
   ```

2. **Multiple roots:**
   ```cpp
   // Only finds one root
   solver.solve(-10, 10);

   // Better: split interval
   if (func(-10)*func(0) < 0) root1 = solver.solve(-10, 0);
   if (func(0)*func(10) < 0) root2 = solver.solve(0, 10);
   ```

3. **Incorrect derivative:**
   ```cpp
   // WRONG - derivative doesn't match function
   G4double Derivative(G4double x) {
       return 2*x;  // But function is x³?
   }
   // Will give incorrect results or fail to converge
   ```

## Related Classes

- [G4AnalyticalPolSolver](g4analyticalpolsolver.md) - Analytical polynomial solutions
- [G4JTPolynomialSolver](g4jtpolynomialsolver.md) - Jenkins-Traub algorithm
- [G4DataInterpolation](g4datainterpolation.md) - Spline interpolation

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4PolynomialSolver.hh`
**Implementation:** `source/global/HEPNumerics/include/G4PolynomialSolver.icc`
**Author:** E.Medernach, 2000
:::
