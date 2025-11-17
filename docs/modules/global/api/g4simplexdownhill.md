# G4SimplexDownhill API Documentation

## Overview

`G4SimplexDownhill` implements the Nelder-Mead simplex algorithm for multidimensional function minimization. It finds local minima without requiring derivatives, making it suitable for noisy or discontinuous objective functions.

Based on the classic algorithm by Nelder & Mead (1965) and implementation guidance from "Numerical Recipes in C".

::: tip Header File
**Location:** `source/global/HEPNumerics/include/G4SimplexDownhill.hh`
**Implementation:** `source/global/HEPNumerics/include/G4SimplexDownhill.icc`
:::

## Template Declaration

`source/global/HEPNumerics/include/G4SimplexDownhill.hh:46-106`

```cpp
template <class T>
class G4SimplexDownhill
{
 public:
  G4SimplexDownhill(T* tp, G4int n);
  ~G4SimplexDownhill();

  G4double GetMinimum();
  std::vector<G4double> GetMinimumPoint();
};
```

**Template Parameter:**
- `T` - Class type that provides `GetValueOfMinimizingFunction(std::vector<G4double>)`

## Constructor

`source/global/HEPNumerics/include/G4SimplexDownhill.hh:50-56`

```cpp
G4SimplexDownhill(T* tp, G4int n);
```

**Purpose:** Create optimizer for n-dimensional function

**Parameters:**
- `tp` - Pointer to object with minimization function
- `n` - Number of variables

**Requirements:** Class T must implement:
```cpp
G4double GetValueOfMinimizingFunction(std::vector<G4double> x);
```

## Methods

### GetMinimum

`source/global/HEPNumerics/include/G4SimplexDownhill.hh:60`

```cpp
G4double GetMinimum();
```

**Purpose:** Perform minimization and return minimum value

**Returns:** Function value at minimum

### GetMinimumPoint

`source/global/HEPNumerics/include/G4SimplexDownhill.hh:62`

```cpp
std::vector<G4double> GetMinimumPoint();
```

**Purpose:** Get coordinates of minimum point

**Returns:** Vector of parameter values at minimum

## Usage Examples

### Basic Minimization

```cpp
#include "G4SimplexDownhill.hh"

class Quadratic {
public:
    G4double GetValueOfMinimizingFunction(std::vector<G4double> x) {
        // Minimize (x-2)² + (y-3)²
        G4double dx = x[0] - 2.0;
        G4double dy = x[1] - 3.0;
        return dx*dx + dy*dy;
    }
};

// Usage
Quadratic func;
G4SimplexDownhill<Quadratic> minimizer(&func, 2);  // 2D

G4double min_value = minimizer.GetMinimum();
std::vector<G4double> min_point = minimizer.GetMinimumPoint();

G4cout << "Minimum: " << min_value << " at ("
       << min_point[0] << ", " << min_point[1] << ")" << G4endl;
// Should find: 0.0 at (2.0, 3.0)
```

### Chi-Square Fitting

```cpp
class ChiSquareFit {
public:
    ChiSquareFit(const std::vector<G4double>& xdata,
                const std::vector<G4double>& ydata)
        : fXdata(xdata), fYdata(ydata) {}

    G4double GetValueOfMinimizingFunction(std::vector<G4double> params) {
        // Fit y = a + b*x + c*x²
        G4double chi2 = 0.0;
        for (size_t i = 0; i < fXdata.size(); i++) {
            G4double x = fXdata[i];
            G4double y_model = params[0] + params[1]*x + params[2]*x*x;
            G4double diff = fYdata[i] - y_model;
            chi2 += diff * diff;
        }
        return chi2;
    }

private:
    std::vector<G4double> fXdata, fYdata;
};

// Usage
std::vector<G4double> x_data = {1, 2, 3, 4, 5};
std::vector<G4double> y_data = {2.1, 4.8, 8.2, 12.1, 16.9};

ChiSquareFit fitter(x_data, y_data);
G4SimplexDownhill<ChiSquareFit> minimizer(&fitter, 3);  // 3 parameters

auto best_params = minimizer.GetMinimumPoint();
G4cout << "Best fit: y = " << best_params[0]
       << " + " << best_params[1] << "*x"
       << " + " << best_params[2] << "*x²" << G4endl;
```

### Geometry Optimization

```cpp
class GeometryOptimizer {
public:
    G4double GetValueOfMinimizingFunction(std::vector<G4double> dims) {
        // Optimize detector geometry
        // dims[0] = radius, dims[1] = length, dims[2] = thickness

        G4double efficiency = ComputeEfficiency(dims);
        G4double cost = ComputeCost(dims);

        // Maximize efficiency/cost ratio = minimize cost/efficiency
        return cost / (efficiency + 1e-10);
    }

private:
    G4double ComputeEfficiency(const std::vector<G4double>& dims);
    G4double ComputeCost(const std::vector<G4double>& dims);
};
```

## Algorithm Parameters

Default parameters (in source code):
- `alpha = 1.0` - Reflection coefficient
- `beta = 0.5` - Contraction coefficient
- `gamma = 2.0` - Expansion coefficient
- `max_se = 1e-6` - Convergence tolerance
- `max_ratio = 1e-6` - Relative convergence
- `maximum_no_trial = 10000` - Maximum iterations

## Performance Notes

- **Derivative-free:** No gradient needed
- **Robust:** Handles noisy functions
- **Convergence:** O(n²) function evaluations
- **Best for:** Small n (< 10 variables)

## Thread Safety

Not thread-safe. Create separate instances per thread.

## Related Classes

- [G4ConvergenceTester](g4convergencetester.md) - Monte Carlo convergence testing

---

::: info Source Reference
**Header:** `source/global/HEPNumerics/include/G4SimplexDownhill.hh`
**Implementation:** `source/global/HEPNumerics/include/G4SimplexDownhill.icc`
**Author:** T.Koi, 2007
:::
