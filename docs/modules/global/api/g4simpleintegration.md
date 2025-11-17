# G4SimpleIntegration API Documentation

## Overview

`G4SimpleIntegration` provides simple, classical numerical integration methods including Trapezoidal, MidPoint, Gauss, Simpson, and Adaptive Gauss integration. These methods are straightforward to use and suitable for quick integrations where advanced features of `G4Integrator` are not needed.

The class is based on algorithms from "Numerical Methods in C++" by B.H. Flowers.

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4SimpleIntegration.hh`
**Implementation:** `source/global/HEPNumerics/src/G4SimpleIntegration.cc`
:::

## Class Declaration

`source/global/HEPNumerics/include/G4SimpleIntegration.hh:45-87`

```cpp
class G4SimpleIntegration
{
 public:
  explicit G4SimpleIntegration(function pFunction);
  G4SimpleIntegration(function pFunction, G4double pTolerance);
  ~G4SimpleIntegration() = default;

  G4double Trapezoidal(G4double xInitial, G4double xFinal, G4int iterationNumber);
  G4double MidPoint(G4double xInitial, G4double xFinal, G4int iterationNumber);
  G4double Gauss(G4double xInitial, G4double xFinal, G4int iterationNumber);
  G4double Simpson(G4double xInitial, G4double xFinal, G4int iterationNumber);
  G4double AdaptGaussIntegration(G4double xInitial, G4double xFinal);

 private:
  function fFunction;
  G4double fTolerance = 0.0001;
  const G4int fMaxDepth = 100;
};
```

## Constructors

`source/global/HEPNumerics/include/G4SimpleIntegration.hh:48-50`

```cpp
explicit G4SimpleIntegration(function pFunction);
G4SimpleIntegration(function pFunction, G4double pTolerance);
```

**Parameters:**
- `pFunction` - Pointer to function to integrate
- `pTolerance` - Accuracy for adaptive integration (default: 0.0001)

## Integration Methods

### Trapezoidal

`source/global/HEPNumerics/include/G4SimpleIntegration.hh:63-64`

```cpp
G4double Trapezoidal(G4double xInitial, G4double xFinal, G4int iterationNumber);
```

**Algorithm:** Trapezoidal rule with n panels
**Error:** O(h²)
**Best for:** Quick estimates, smooth functions

### MidPoint

`source/global/HEPNumerics/include/G4SimpleIntegration.hh:66`

```cpp
G4double MidPoint(G4double xInitial, G4double xFinal, G4int iterationNumber);
```

**Algorithm:** Midpoint rule
**Error:** O(h²)
**Best for:** Open intervals, avoiding endpoints

### Gauss

`source/global/HEPNumerics/include/G4SimpleIntegration.hh:68`

```cpp
G4double Gauss(G4double xInitial, G4double xFinal, G4int iterationNumber);
```

**Algorithm:** Simple Gauss quadrature
**Best for:** Moderate accuracy with fewer evaluations

### Simpson

`source/global/HEPNumerics/include/G4SimpleIntegration.hh:70`

```cpp
G4double Simpson(G4double xInitial, G4double xFinal, G4int iterationNumber);
```

**Algorithm:** Simpson's 1/3 rule
**Error:** O(h⁴)
**Best for:** Smooth functions, good balance of speed/accuracy

### AdaptGaussIntegration

`source/global/HEPNumerics/include/G4SimpleIntegration.hh:74`

```cpp
G4double AdaptGaussIntegration(G4double xInitial, G4double xFinal);
```

**Algorithm:** Adaptive Gauss with automatic refinement
**Accuracy:** Controlled by tolerance (default 10⁻⁴)
**Best for:** Unknown functions, automatic accuracy

## Usage Examples

### Basic Integration

```cpp
#include "G4SimpleIntegration.hh"

G4double MyFunction(G4double x) {
    return std::sin(x);
}

G4SimpleIntegration integrator(MyFunction);

// Simpson's rule with 100 steps
G4double result = integrator.Simpson(0.0, CLHEP::pi, 100);
G4cout << "∫sin(x)dx = " << result << G4endl;  // Should be 2.0
```

### Adaptive Integration

```cpp
// Complex function with unknown behavior
G4double ComplexFunction(G4double x) {
    return std::exp(-x*x) * std::sin(10*x);
}

G4SimpleIntegration integrator(ComplexFunction, 1e-8);  // Tight tolerance
G4double result = integrator.AdaptGaussIntegration(0.0, 10.0);
```

### Compare Methods

```cpp
void CompareIntegrationMethods() {
    G4SimpleIntegration integrator(MyFunc);

    G4double trap = integrator.Trapezoidal(0, 1, 100);
    G4double mid = integrator.MidPoint(0, 1, 100);
    G4double simp = integrator.Simpson(0, 1, 100);
    G4double gauss = integrator.Gauss(0, 1, 100);
    G4double adapt = integrator.AdaptGaussIntegration(0, 1);

    G4cout << "Trapezoidal: " << trap << G4endl;
    G4cout << "MidPoint:    " << mid << G4endl;
    G4cout << "Simpson:     " << simp << G4endl;
    G4cout << "Gauss:       " << gauss << G4endl;
    G4cout << "Adaptive:    " << adapt << G4endl;
}
```

## Performance Notes

- **Simpson:** Best balance for most applications
- **AdaptGaussIntegration:** Best for unknown functions
- **Trapezoidal/MidPoint:** Quick estimates only

## Thread Safety

Thread-safe after construction. Each thread should have its own instance.

## Related Classes

- [G4Integrator](g4integrator.md) - Advanced template integrator
- [G4VGaussianQuadrature](g4vgaussianquadrature.md) - Gaussian quadrature base
- [G4DataInterpolation](g4datainterpolation.md) - Data interpolation

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4SimpleIntegration.hh`
**Implementation:** `source/global/HEPNumerics/src/G4SimpleIntegration.cc`
**Author:** V.Grichine, 1997
:::
